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
 * $Date: 2009-07-21 23:10:42 +0300 $
 */

// This script generates the PaintWeb JSON language file dynamically using the 
// Moodle language files. The language picked is the one configured in Moodle.

require_once('../../../../config.php');

$moodleLangDir = '../../../../lang';
$moodleLangFile = 'paintweb.php';

if (!is_dir($moodleLangDir)) {
  echo "The Moodle folder could not be found: $moodleLangDir\n";
  return 1;
}

require_once($moodleLangDir . '/en_utf8/' . $moodleLangFile);

$keys = array_keys($string);

$outputArray = array();

foreach ($keys as $key) {
  $keyArr = explode(':', $key);
  $langProp = array_pop($keyArr);
  $langGroup = &$outputArray;

  foreach ($keyArr as $prop) {
    if (!isset($langGroup[$prop])) {
      $langGroup[$prop] = array();
    }

    $langGroup = &$langGroup[$prop];
  }

  $langGroup[$langProp] = get_string($key, 'paintweb');
}

$output = json_encode($outputArray);

$lifetime = '86400';
@header('Content-type: text/plain; charset=utf-8');
@header('Content-length: ' . strlen($output));
@header('Last-Modified: ' . gmdate('D, d M Y H:i:s', time()) . ' GMT');
@header('Cache-control: max-age=' . $lifetime);
@header('Expires: ' .  gmdate('D, d M Y H:i:s', time() + $lifetime) . ' GMT');
@header('Pragma: ');

echo $output;

// vim:set spell spl=en fo=anl1qrowcb tw=80 ts=2 sw=2 sts=2 sta et noai nocin fenc=utf-8 ff=unix: 
?>
