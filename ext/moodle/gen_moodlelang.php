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
 * $Date: 2009-07-13 13:38:40 +0300 $
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

if (isset($_SERVER['argv'][1])) {
  $file = $_SERVER['argv'][1] . '.json';

  if (!file_exists($paintwebLangDir . '/' . $file)) {
    echo "The PaintWeb language file was not found: $paintwebLangDir/$file\n";
    return 1;
  }

  convertFile($file);

  return 0;
}

$dir = opendir($paintwebLangDir);
while ($file = readdir($dir)) {
  if (!preg_match('/\.json$/', $file)) {
    continue;
  }

  convertFile($file);
}

function convertFile ($file) {
  global $moodleLangDir, $moodleLangFile, $paintwebLangDir;

  $lang = str_replace('.json', '', $file);

  $outputFolder = $moodleLangDir . '/' . ($lang === 'en' ? 'en_utf8' : $lang);

  if (!is_dir($outputFolder)) {
    echo "Skipping $file because $outputFolder was not found.\n";
    continue;
  }

  $langParsed = file_get_contents($paintwebLangDir . '/' . $file);
  $langParsed = preg_replace(array('/\s*\/\*.+?\*\//ms', '/\s*\\/\\/.+/'), '', $langParsed);

  $langParsed = json_decode($langParsed, true);
  if (!$langParsed) {
    echo "Parsing $file failed. \n";
    continue;
  }

  $output = "<?php\n// " . date('c') . "\n" . json2php($langParsed, '');

  if (file_put_contents($outputFolder . '/' . $moodleLangFile, $output)) {
    echo "Generated $outputFolder/$moodleLangFile\n";
  } else {
    echo "Failed to write $outputFolder/$moodleLangFile\n";
  }
}

function json2php ($obj, $prefix) {
  $result = '';

  foreach ($obj as $key => $val) {
    if (is_array($val)) {
      $result .= json2php($val, $prefix . $key . ':');
    } else {
      $val = str_replace("'", "\\'", $val);
      $result .= "\$string['$prefix$key'] = '" . $val . "';\n";
    }
  }

  return $result;
}

// vim:set spell spl=en fo=anl1qrowcb tw=80 ts=2 sw=2 sts=2 sta et noai nocin fenc=utf-8 ff=unix: 
?>
