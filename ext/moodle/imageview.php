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
 * $Date: 2009-07-26 22:09:50 +0300 $
 */

// This script serves images saved by PaintWeb to the browser.

require_once('../../../../config.php');

// The list of allowed image MIME types associated to file extensions.
$allowedTypes = array('png' => 'image/png', 'jpg' => 'image/jpeg');

$file = $_GET['img'];
if (empty($file) || strpos($file, '/') !== false) {
  die('image not found');
}

$filetype = substr($file, strpos($file, '.') + 1);
if (empty($filetype) || !array_key_exists($filetype, $allowedTypes)) {
  die('image not found');
}

$filetype = $allowedTypes[$filetype];

$file = $CFG->dataroot . '/' . $CFG->paintwebImagesFolder . '/' . $file;

if (!file_exists($file)) {
  die('image not found');
}

$lifetime = '86400';
@header('Content-Type: ' . $filetype);
@header('Content-Length: ' . filesize($file));
@header('Last-Modified: ' . gmdate('D, d M Y H:i:s', time()) . ' GMT');
@header('Cache-control: max-age=' . $lifetime);
@header('Expires: ' .  gmdate('D, d M Y H:i:s', time() + $lifetime) . ' GMT');
@header('Pragma: ');

readfile($file);

// vim:set spell spl=en fo=anl1qrowcb tw=80 ts=2 sw=2 sts=2 sta et noai nocin fenc=utf-8 ff=unix: 

