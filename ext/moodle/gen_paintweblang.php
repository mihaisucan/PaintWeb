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
 * $Date: 2014-01-28 12:37:04 $
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

