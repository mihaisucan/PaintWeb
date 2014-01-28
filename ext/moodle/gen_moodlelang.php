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
 * $Date: 2014-01-28 12:36:22 $
 */

// This script allows you to convert PaintWeb JSON language files into Moodle 
// PHP language files.

// In a typical setup, Moodle holds PaintWeb in lib/paintweb.

// If you execute this script without any arguments, all the PaintWeb language 
// files will be converted into Moodle PHP language files.
//
// Optionally, you can give this script one argument, to tell it which language 
// you want to convert. This allows you to convert one language file, instead of 
// all at once.

// Warning: running this script will overwrite "paintweb.php" in your Moodle 
// lang/*/ folders.

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

if (isset($_SERVER['argv'][1])) {
    $file = $_SERVER['argv'][1] . '.json';

    if (!file_exists($paintweblangdir . '/' . $file)) {
        echo "The PaintWeb language file was not found: $paintweblangdir/$file\n";
        return 1;
    }

    paintweb_convert_json_file($file);

    return 0;
}

$files = glob($paintweblangdir . '/*.json');
foreach($files as $file) {
    paintweb_convert_json_file($file);
}

/**
 * Convert a PaintWeb JSON language file to a Moodle PHP language file.
 *
 * @param string $file The file you want to convert.
 * @return boolean True if the operation executed successfully, or false 
 * otherwise.
 */
function paintweb_convert_json_file($file) {
    global $moodlelangdir, $moodlelangfile, $paintweblangdir;

    $lang = basename($file, '.json');

    $outputfolder = $moodlelangdir . '/' . ($lang === 'en' ? 'en_utf8' : $lang);

    if (!is_dir($outputfolder)) {
        echo "Skipping $file because $outputfolder was not found.\n";
        return false;
    }

    $langparsed = file_get_contents($paintweblangdir . '/' . $file);
    $langparsed = preg_replace(array('/\s*\/\*.+?\*\//ms', '/\s*\\/\\/.+/'), '', $langparsed);

    $langparsed = json_decode($langparsed, true);
    if (!$langparsed) {
        echo "Parsing $file failed. \n";
        return false;
    }

    $output = "<?php\n". paintweb_json2php($langparsed);

    if (file_put_contents($outputfolder . '/' . $moodlelangfile, $output)) {
        echo "Generated $outputfolder/$moodlelangfile\n";
    } else {
        echo "Failed to write $outputfolder/$moodlelangfile\n";
    }

    return true;
}

/**
 * Convert a PaintWeb JSON object parsed from a language file, to a Moodle PHP 
 * language file.
 *
 * @param array $obj The array object returned by json_decode().
 * @param string $prefix The accumulated language group.
 * @return string The Moodle PHP language file.
 */
function paintweb_json2php($obj, $prefix='') {
    $result = '';

    foreach ($obj as $key => $val) {
        if (is_array($val)) {
            $result .= paintweb_json2php($val, $prefix . $key . ':');
        } else {
            $key = var_export($prefix . $key, true);
            $val = var_export($val, true);
            $result .= "\$string[$key] = $val;\n";
        }
    }

    return $result;
}

// vim:set spell spl=en fo=tanqrowcb tw=80 ts=4 sw=4 sts=4 sta et noai nocin fenc=utf-8 ff=unix: 

