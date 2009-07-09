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
 * $Date: 2009-07-09 20:02:21 +0300 $
 */

// This script allows you to convert PaintWeb JSON language files into Moodle 
// PHP language files.

// In a typical setup, Moodle holds PaintWeb in lib/paintweb.

$paintwebLangDir = '../../src/lang';
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

$dir = opendir($paintwebLangDir);
while ($file = readdir($dir)) {
  if (!preg_match('/\.json$/', $file)) {
    continue;
  }

  $lang = str_replace('.json', '', $file);

  $output = "<?php\n// " . date('c') . "\n";


  $langParsed = file_get_contents($paintwebLangDir . '/' . $file);
  $langParsed = preg_replace(array('/\s*\/\*.+?\*\//ms', '/\s*\\/\\/.+/'), '', $langParsed);

  $langParsed = json_decode($langParsed, true);
  if (!$langParsed) {
    echo "Parsing $file failed. \n";
    continue;
  }

  processLang($langParsed, '');
  $outputFolder = $moodleLangDir . '/' . ($lang === 'en' ? 'en_utf8' : $lang);

  if (is_dir($outputFolder)) {
    file_put_contents($outputFolder . '/' . $moodleLangFile, $output);
  }
}

function processLang ($obj, $prefix) {
  global $output;

  foreach ($obj as $key => $val) {
    if (is_array($val)) {
      processLang($val, $prefix . $key . ':');
    } else {
      $val = str_replace("'", "\\'", $val);
      $output .= "\$string['$prefix$key'] = '" . $val . "';\n";
    }
  }
}

// vim:set spell spl=en fo=anl1qrowcb tw=80 ts=2 sw=2 sts=2 sta et noai nocin fenc=utf-8 ff=unix: 
?>
