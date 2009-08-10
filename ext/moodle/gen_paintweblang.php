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
 * $Date: 2009-08-10 15:58:48 +0300 $
 */

// This script allows you to convert a Moodle PHP language file into a PaintWeb 
// JSON language file.

// In a typical setup, Moodle holds PaintWeb in lib/paintweb.

// When you execute this script you must provide one argument with the language 
// code you want. For example "en", "ro", "fr" or some other code.

// Warning: running this script will overwrite the JSON language file from the 
// PaintWeb language folder.

// This script works with Moodle 1.9 and Moodle 2.0.

$paintweblangdir = '../../build/lang';
$moodlelangdir = '../../../../lang';
$moodlelangfile = 'paintweb.php';

if (!is_dir($paintweblangdir)) {
    echo "The PaintWeb folder could not be found: $paintweblangdir\n";
    return 1;
}

if (!is_dir($moodlelangdir)) {
    echo "The Moodle folder could not be found: $moodlelangdir\n";
    return 1;
}

if (!isset($_SERVER['argv'][1])) {
    echo 'This script requires one argument, the language code for which you ' .
        "want this script to perform the conversion.\n";
    return 1;
}

$lang = $_SERVER['argv'][1];

$inputfolder = $moodlelangdir . '/' . ($lang === 'en' ? 'en_utf8' : $lang);

if (!is_dir($inputfolder)) {
    echo "The following folder was not found: $inputfolder\n";
    return 1;
}

$inputfile = $inputfolder . '/' . $moodlelangfile;

if (!file_exists($inputfile)) {
    echo "The following file was not found: $inputfile\n";
    return 1;
}

require_once($inputfile);

$outputarray = array();

foreach ($string as $key => $val) {
    $keyarr = explode(':', $key);
    $langprop = array_pop($keyarr);
    $langgroup = &$outputarray;

    foreach ($keyarr as $prop) {
        if (!isset($langgroup[$prop])) {
            $langgroup[$prop] = array();
        }

        $langgroup = &$langgroup[$prop];
    }

    $langgroup[$langprop] = $val;
}

$output = json_encode($outputarray);
$outputfile = $paintweblangdir . '/' . $lang . '.json';

if (file_put_contents($outputfile, $output)) {
    echo "Updated file $outputfile\n";
} else {
    echo "Failed to update $outputfile\n";
    return 1;
}

// vim:set spell spl=en fo=tanqrowcb tw=80 ts=4 sw=4 sts=4 sta et noai nocin fenc=utf-8 ff=unix: 

