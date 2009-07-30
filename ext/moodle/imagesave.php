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
 * $Date: 2009-07-30 22:31:47 +0300 $
 */

// This script performs asynchronous image save in PaintWeb. This is used by the 
// Moodle extension of PaintWeb, to save image edits.

require_once('../../../../config.php');

function paintwebSaveDone ($successful, $errorMessage = null) {
  global $imgUrl, $imgUrlNew;

  $output = array(
    'successful' => $successful,
    'url' => $imgUrl,
    'urlNew' => $imgUrlNew,
    'errorMessage' => $errorMessage
  );

  echo json_encode($output);
  exit;
}

function prepareImgUrl () {
  global $CFG, $imgUrl, $imgUrlNew, $imgDest, $imgProxies, $myProxy, $imgDataURL, $imgAllowedTypes, $imgInfo;

  // check if the image URL points to a proxy.
  foreach ($imgProxies as $proxy => $type) {
    if (strpos($imgUrl, $proxy) !== 0) {
      continue;
    }

    $relpath = substr($imgUrl, strlen($proxy));
    if ($relpath{0} === '?') {
      $relpath = substr($relpath, 1);
      $pathvars = array();
      parse_str($relpath, $pathvars);
      if (isset($pathvars['file'])) {
        $relpath = $pathvars['file'];
      } else {
        $relpath = false;
      }
      unset($pathvars);

    } else if (strpos($relpath, '?')) {
      $relpath = substr($relpath, 0, strpos($relpath, '?'));
    }

    if (!$relpath) {
        continue;
    }

    $relpath = trim($relpath, '/');
    $tmpDest = $CFG->dataroot . '/' . $relpath;

    if (!file_exists($tmpDest) || !is_writeable($tmpDest) || is_dir($tmpDest)) {
      continue;
    }

    $fname = basename($tmpDest);
    $ext = substr($fname, strrpos($fname, '.') + 1);
    $ftype = array_search(strtolower($ext), $imgAllowedTypes);

    if (!$ftype || $ftype !== $imgInfo[0]) {
      continue;
    }

    // check permissions, if the image proxy is for a course file.
    if ($type === 'course') {
      $arrpath = explode('/', $relpath);
      if (count($arrpath) < 2) {
        continue;
      }

      $course = get_record('course', 'id', $arrpath[0]);
      require_login($course);
      require_capability('moodle/course:managefiles', get_context_instance(CONTEXT_COURSE, $course->id));
    }

    $imgDest = $tmpDest;
    return;
  }

  $imgDest = $CFG->dataroot . '/' . $CFG->paintwebImagesFolder;

  if (!is_dir($imgDest) || !make_upload_directory($imgDest, false)) {
    paintwebSaveDone(false, 'failed to mkdir ' . $imgDest);
  }

  // simply create a new file in the PainWeb images folder.
  $fname = sha1($imgDataURL) . '.' . $imgAllowedTypes[$imgInfo[0]];
  $imgDest .=  '/' . $fname;
  $imgUrlNew = $CFG->wwwroot . '/' . $myProxy . '?img=' . $fname;
}

// The list of allowed image MIME types associated to file extensions.
$imgAllowedTypes = array('image/png' => 'png', 'image/jpeg' => 'jpg');

// The list of file serving proxies recognized from Moodle. For example, course 
// images are served by /file.php. So, when you add an image in TinyMCE, the 
// path will be like /file.php/course_id/dir/file.ext.
$imgProxies = array(
  $CFG->wwwroot . '/file.php' => 'course',     // course files
  $CFG->httpswwwroot . '/file.php' => 'course' // course files
);

if ($CFG->paintwebDisallowImageUpdates) {
  $imgProxies = array();
}

$myProxy = dirname(__FILE__) . '/imageview.php';
if (strpos($myProxy, $CFG->dirroot) === 0) {
  $myProxy = trim(substr($myProxy, strlen($CFG->dirroot)), '/');
} else {
  paintwebSaveDone(false, 'failed to find my image file proxy!');
}

$imgUrl = $_POST['url'];
$imgUrlNew = null;

$imgDataURL = &$_POST['dataURL'];

if (empty($imgUrl)) {
  paintwebSaveDone(false, 'empty url');
}

if (empty($imgDataURL)) {
  paintwebSaveDone(false, 'empty data URL');
}

// A data URL starts like this:
// data:[<MIME-type>][;charset="<encoding>"][;base64],<data>

// Here we find the comma delimiter.
$comma = strpos($imgDataURL, ',');
$imgInfo = substr($imgDataURL, 0, $comma);
if (empty($imgInfo) || !isset($imgDataURL{($comma+2)})) {
  paintwebSaveDone(false, 'malformed data URL');
}

// Split by ':' to find the 'data' prefix and the rest of the info.
$imgInfo = explode(':', $imgInfo);

// The array must have exactly two elements and the second element must not be 
// empty.
if (count($imgInfo) !== 2 || $imgInfo[0] !== 'data' || empty($imgInfo[1])) {
  paintwebSaveDone(false, 'malformed data URL');
}

// The MIME type must be given and it must be base64-encoded.
$imgInfo = explode(';', $imgInfo[1]);

if (count($imgInfo) < 2 || !array_key_exists($imgInfo[0], $imgAllowedTypes) ||
    ($imgInfo[1] !== 'base64' && $imgInfo[2] !== 'base64')) {
  paintwebSaveDone(false, 'malformed data URL');
}

prepareImgUrl();

$imgDataURL = substr($imgDataURL, $comma + 1);

if (!file_put_contents($imgDest, base64_decode($imgDataURL))) {
  paintwebSaveDone(false, 'failed to save file');
}

paintwebSaveDone(true);

// vim:set spell spl=en fo=anl1qrowcb tw=80 ts=2 sw=2 sts=2 sta et noai nocin fenc=utf-8 ff=unix: 

