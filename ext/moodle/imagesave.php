<?php
/*
 * Copyright (C) 2009 Mihai Şucan
 *
 * This file is part of PaintWeb.
 *
 * PaintWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * PaintWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with PaintWeb.  If not, see <http://www.gnu.org/licenses/>.
 *
 * $URL: http://code.google.com/p/paintweb $
 * $Date: 2009-07-26 21:53:12 +0300 $
 */

// This script performs asynchronous image save in PaintWeb. This is used by the 
// Moodle extension of PaintWeb, to save image edits.

require_once('../../../../config.php');

function paintwebSaveDone ($successful, $errorMessage = null) {
  global $url, $urlNew;

  $output = array(
    'successful' => $successful,
    'url' => $url,
    'urlNew' => $urlNew,
    'errorMessage' => $errorMessage
  );

  echo json_encode($output);
  exit;
}

// The list of allowed image MIME types associated to file extensions.
$allowedTypes = array('image/png' => 'png', 'image/jpeg' => 'jpg');

$url = $_POST['url'];
$urlNew = null;

$dataURL = &$_POST['dataURL'];

if (empty($url)) {
  paintwebSaveDone(false, 'empty url');
}

if (empty($dataURL)) {
  paintwebSaveDone(false, 'empty data URL');
}

// A data URL starts like this:
// data:[<MIME-type>][;charset="<encoding>"][;base64],<data>

// Here we find the comma delimiter.
$comma = strpos($dataURL, ',');
$info = substr($dataURL, 0, $comma);
if (empty($info) || !isset($dataURL{($comma+2)})) {
  paintwebSaveDone(false, 'malformed data URL');
}

// Split by ':' to find the 'data' prefix and the rest of the info.
$info = explode(':', $info);

// The array must have exactly two elements and the second element must not be 
// empty.
if (count($info) !== 2 || $info[0] !== 'data' || empty($info[1])) {
  paintwebSaveDone(false, 'malformed data URL');
}

// The MIME type must be given and it must be base64-encoded.
$info = explode(';', $info[1]);

if (count($info) < 2 || !array_key_exists($info[0], $allowedTypes) ||
    ($info[1] !== 'base64' && $info[2] !== 'base64')) {
  paintwebSaveDone(false, 'malformed data URL');
}

$dest = $CFG->dataroot . '/' . $CFG->paintwebImagesFolder;

if (!is_dir($dest) || !make_upload_directory($dest, false)) {
  paintwebSaveDone(false, 'failed to mkdir ' . $dest);
}

$filename = sha1($dataURL) . '.' . $allowedTypes[$info[0]];
$dest .=  '/' . $filename;
$dataURL = substr($dataURL, $comma + 1);

if (!file_put_contents($dest, base64_decode($dataURL))) {
  paintwebSaveDone(false, 'failed to save file');
}

$urlNew = $CFG->wwwroot . '/lib/paintweb/ext/moodle/imageview.php?img=' . $filename;

paintwebSaveDone(true);

// vim:set spell spl=en fo=anl1qrowcb tw=80 ts=2 sw=2 sts=2 sta et noai nocin fenc=utf-8 ff=unix: 

