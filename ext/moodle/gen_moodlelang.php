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
 * $Date: 2009-08-10 20:41:45 +0300 $
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

