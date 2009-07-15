<?php
/*
 * Copyright (C) 2008, 2009 Mihai Şucan
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
 * $Date: 2009-07-13 13:38:53 +0300 $
 */

// This script allows you to convert a Moodle PHP language file into a PaintWeb 
// JSON language file.

// In a typical setup, Moodle holds PaintWeb in lib/paintweb.

// When you execute this script you must provide one argument with the language 
// code you want. For example "en", "ro", "fr" or some other code.

// Warning: running this script will overwrite the JSON language file from the 
// PaintWeb language folder.

$paintwebLangDir = '../../build/lang';
$moodleLangDir = '../../../../lang';
$moodleLangFile = 'paintweb.php';

if (!is_dir($paintwebLangDir)) {
  echo "The PaintWeb folder could not be found: $paintwebLangDir\n";
  return 1;
}

if (!is_dir($moodleLangDir)) {
  echo "The Moodle folder could not be found: $moodleLangDir\n";
  return 1;
}

if (!isset($_SERVER['argv'][1])) {
  echo "This script requires one argument, the language code for which you want this script to perform the conversion.\n";
  return 1;
}

$lang = $_SERVER['argv'][1];

$inputFolder = $moodleLangDir . '/' . ($lang === 'en' ? 'en_utf8' : $lang);

if (!is_dir($inputFolder)) {
  echo "The following folder was not found: $inputFolder\n";
  return 1;
}

$inputFile = $inputFolder . '/' . $moodleLangFile;

if (!file_exists($inputFile)) {
  echo "The following file was not found: $inputFile\n";
  return 1;
}

include($inputFile);

$outputArray = array();

foreach ($string as $key => $val) {
  $keyArr = explode(':', $key);
  $langProp = array_pop($keyArr);
  $langGroup = &$outputArray;

  foreach ($keyArr as $prop) {
    if (!isset($langGroup[$prop])) {
      $langGroup[$prop] = array();
    }

    $langGroup = &$langGroup[$prop];
  }

  $langGroup[$langProp] = $val;
}

$output = json_encode($outputArray);
$outputFile = $paintwebLangDir . '/' . $lang . '.json';

if (file_put_contents($outputFile, $output)) {
  echo "Updated file $outputFile\n";
} else {
  echo "Failed to update $outputFile\n";
  return 1;
}

// vim:set spell spl=en fo=anl1qrowcb tw=80 ts=2 sw=2 sts=2 sta et noai nocin fenc=utf-8 ff=unix: 
?>
