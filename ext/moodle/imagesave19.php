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
 * $Date: 2009-08-11 14:29:15 +0300 $
 */

// This script performs asynchronous image save in PaintWeb. This is used by the 
// Moodle extension of PaintWeb, to save image edits. You should not include 
// this script yourself.

// This script only works with Moodle 1.9.

require_once('../../../../config.php');

/**
 * Send the JSON object result to PaintWeb.
 *
 * @param string $url The image URL we are saving/updating.
 * @param string $urlnew The new image URL generated for the saved image.
 * @param boolean $successful Tells if the save operation was successful or not.
 * @param string $errormessage Holds an error message if the save operation 
 * failed.
 */
function paintweb_send_result($url, $urlnew, $successful, $errormessage=null) {
    $output = array(
        'successful'   => $successful,
        'url'          => $url,
        'urlNew'       => $urlnew,
        'errorMessage' => $errormessage
    );

    echo json_encode($output);
    exit;
}

// The list of allowed image MIME types associated to file extensions.
$imgallowedtypes = array(
    'image/png'  => 'png',
    'image/jpeg' => 'jpg'
);

// The list of file serving proxies recognized from Moodle. For example, course 
// images are served by /file.php. So, when you add an image in TinyMCE, the 
// path will be like /file.php/course_id/dir/file.ext.
$imgproxies = array(
    $CFG->wwwroot . '/file.php'      => 'course', // course files
    $CFG->httpswwwroot . '/file.php' => 'course'  // course files
);

// Check if the configuration disallows in-place image updates.
if ($CFG->paintwebDisallowImageUpdates) {
    $imgproxies = array();
}

// The PaintWeb image viewer file serve script.
$pwproxy = dirname(__FILE__) . '/imageview.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die('illegal request');
}

if (!isloggedin()) {
    die('user not logged-in');
}

$imgurl = optional_param('url', '', PARAM_URL);
$imgurlnew = null;
$imgdataurl = required_param('dataURL', PARAM_RAW);

if (empty($imgurl)) {
    $imgurl = '-';
}

if (empty($imgdataurl)) {
    paintweb_send_result($imgurl, $imgurlnew, false,
        get_string('moodleServer:saveEmptyDataUrl', 'paintweb'));
}

if (strpos($pwproxy, $CFG->dirroot) === 0) {
    $pwproxy = trim(substr($pwproxy, strlen($CFG->dirroot)), '/');
} else {
    paintweb_send_result($imgurl, $imgurlnew, false,
        get_string('moodleServer:proxyNotFound', 'paintweb'));
}

// A data URL starts like this:
// data:[<MIME-type>][;charset="<encoding>"][;base64],<data>

// Here we find the comma delimiter.
$comma = strpos($imgdataurl, ',');
if (!$comma) {
    paintweb_send_result($imgurl, $imgurlnew, false,
        get_string('moodleServer:malformedDataUrl', 'paintweb'));
}

$imginfo = substr($imgdataurl, 0, $comma);
if (empty($imginfo) || !isset($imgdataurl{($comma+2)})) {
    paintweb_send_result($imgurl, $imgurlnew, false,
        get_string('moodleServer:malformedDataUrl', 'paintweb'));
}

// Split by ':' to find the 'data' prefix and the rest of the info.
$imginfo = explode(':', $imginfo);

// The array must have exactly two elements and the second element must not be 
// empty.
if (count($imginfo) !== 2 || $imginfo[0] !== 'data' || empty($imginfo[1])) {
    paintweb_send_result($imgurl, $imgurlnew, false,
        get_string('moodleServer:malformedDataUrl', 'paintweb'));
}

// The MIME type must be given and it must be base64-encoded.
$imginfo = explode(';', $imginfo[1]);

if (count($imginfo) < 2 || !array_key_exists($imginfo[0], $imgallowedtypes) ||
    ($imginfo[1] !== 'base64' && $imginfo[2] !== 'base64')) {
    paintweb_send_result($imgurl, $imgurlnew, false,
        get_string('moodleServer:malformedDataUrl', 'paintweb'));
}

$imgdest = null;

// Check if the image URL points to a proxy.
foreach ($imgproxies as $proxy => $type) {
    if (strpos($imgurl, $proxy) !== 0) {
        continue;
    }

    $relpath = substr($imgurl, strlen($proxy));
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
    $tmpdest = $CFG->dataroot . '/' . $relpath;

    if (!file_exists($tmpdest) || !is_writeable($tmpdest) || is_dir($tmpdest)) {
        continue;
    }

    $fname = basename($tmpdest);
    $ext = substr($fname, strrpos($fname, '.') + 1);
    $ftype = array_search(strtolower($ext), $imgallowedtypes);

    if (!$ftype || $ftype !== $imginfo[0]) {
        continue;
    }

    // Check permissions, if the image proxy is for a course file.
    if ($type === 'course') {
        $arrpath = explode('/', $relpath);
        if (count($arrpath) < 2) {
            continue;
        }

        $course = get_record('course', 'id', $arrpath[0]);
        require_login($course);
        require_capability('moodle/course:managefiles', get_context_instance(CONTEXT_COURSE, $course->id));
    }

    $imgdest = $tmpdest;
    break;
}

// If no image destination has been determined, then we create a new image file.
if (empty($imgdest)) {
    $imgdest = $CFG->dataroot . '/' . $CFG->paintwebImagesFolder;

    if (!is_dir($imgdest) || !make_upload_directory($imgdest, false)) {
        paintweb_send_result($imgurl, $imgurlnew, false,
            get_string('moodleServer:failedMkdir', 'paintweb'));
    }

    // Simply create a new file in the PainWeb images folder.
    $fname = sha1($imgdataurl) . '.' . $imgallowedtypes[$imginfo[0]];
    $imgdest .=  '/' . $fname;
    $imgurlnew = $CFG->wwwroot . '/' . $pwproxy . '?img=' . $fname;
}

$imgdataurl = substr($imgdataurl, $comma + 1);

if (!file_put_contents($imgdest, base64_decode($imgdataurl))) {
    paintweb_send_result($imgurl, $imgurlnew, false,
        get_string('moodleServer:saveFailed', 'paintweb'));
}

paintweb_send_result($imgurl, $imgurlnew, true);

// vim:set spell spl=en fo=tanqrowcb tw=80 ts=4 sw=4 sts=4 sta et noai nocin fenc=utf-8 ff=unix: 

