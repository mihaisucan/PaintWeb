<?php
/*
 * Copyright (c) 2009-2014, Mihai Sucan
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * 
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * $URL: http://code.google.com/p/paintweb $
 * $Date: 2014-01-28 12:39:24 $
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

