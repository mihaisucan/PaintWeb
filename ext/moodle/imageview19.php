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
 * $Date: 2009-10-07 15:16:47 +0300 $
 */

// This script serves images saved by PaintWeb to the browser.

// This script only works with Moodle 1.9.

require_once('../../../../config.php');
require_once($CFG->libdir . '/filelib.php');

// disable moodle specific debug messages
disable_debugging();

// The list of allowed image MIME types associated to file extensions.
$imagetypes = array('png' => 'image/png', 'jpg' => 'image/jpeg');

$file = required_param('img', PARAM_FILE);
if (empty($file) || strpos($file, '/') !== false) {
    die('image not found');
}

$filetype = substr($file, strpos($file, '.') + 1);
if (empty($filetype) || !array_key_exists($filetype, $imagetypes)) {
    die('image not found');
}

$filetype = $imagetypes[$filetype];

$path = $CFG->dataroot . '/' . $CFG->paintwebImagesFolder . '/' . $file;

if (!file_exists($path)) {
    die('image not found');
}

// Seconds for files to remain in caches
$lifetime = isset($CFG->filelifetime) ? $CFG->filelifetime : 86400;
$forcerefresh = optional_param('forcerefresh', 0, PARAM_BOOL);
if ($forcerefresh) {
    $lifetime = 0;
}

session_write_close(); // unlock session during fileserving
send_file($path, $file, $lifetime, 0, false, false, $filetype);

// vim:set spell spl=en fo=tanqrowcb tw=80 ts=4 sw=4 sts=4 sta et noai nocin fenc=utf-8 ff=unix: 

