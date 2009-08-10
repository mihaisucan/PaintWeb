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
 * $Date: 2009-08-10 21:55:57 +0300 $
 */

// This script generates the PaintWeb JSON language file dynamically using the 
// Moodle language files. The language picked is the one configured in Moodle.


// This script works with Moodle 1.9 and Moodle 2.0.

require_once('../../../../config.php');

$moodlelangdir = '../../../../lang';
$moodlelangfile = 'paintweb.php';

if (!is_dir($moodlelangdir)) {
    echo "The Moodle folder could not be found: $moodlelangdir\n";
    return 1;
}

require_once($moodlelangdir . '/en_utf8/' . $moodlelangfile);

$keys = array_keys($string);

$outputarray = array();

foreach ($keys as $key) {
    $keyarr = explode(':', $key);
    $langprop = array_pop($keyarr);
    $langgroup = &$outputarray;

    foreach ($keyarr as $prop) {
        if (!isset($langgroup[$prop])) {
            $langgroup[$prop] = array();
        }

        $langgroup = &$langgroup[$prop];
    }

    $langgroup[$langprop] = get_string($key, 'paintweb');
}

$output = json_encode($outputarray);

$lifetime = '86400';
@header('Content-Type: text/plain; charset=utf-8');
@header('Content-Length: ' . strlen($output));
@header('Last-Modified: ' . gmdate('D, d M Y H:i:s', time()) . ' GMT');
@header('Cache-control: max-age=' . $lifetime);
@header('Expires: ' .  gmdate('D, d M Y H:i:s', time() + $lifetime) . ' GMT');
@header('Pragma: ');

echo $output;

// vim:set spell spl=en fo=tanqrowcb tw=80 ts=4 sw=4 sts=4 sta et noai nocin fenc=utf-8 ff=unix: 

