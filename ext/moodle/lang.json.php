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
 * $Date: 2014-01-28 12:39:58 $
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

