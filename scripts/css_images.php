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
 * $Date: 2014-01-28 12:42:33 $
 */

// This file takes a CSS file as input, and outputs the same file with all the 
// images inlined using data: URIs.

if (!isset($_SERVER['argv'][1])) {
  fwrite(STDERR, 'Error: The first argument must point to a CSS file.');
  return 1;
}

$file = $_SERVER['argv'][1];

$content = file_get_contents($file);

chdir(dirname($file));

function replace_callback ($matches) {
  $image = $matches[3];

  // If the URL points to some external image, or if the file is not found then 
  // we make no change to the code.
  if (substr($image, 0, 7) === 'http://' || !file_exists($image)) {
    return $matches[1] . ':' . $matches[2] . "url('" . $image . "')";
  }

  $base64 = base64_encode(file_get_contents($image));

  $ext = strtolower(pathinfo($image, PATHINFO_EXTENSION));

  $type = '';
  if ($ext === 'png') {
    $type = 'image/png';
  } else if ($ext === 'jpg' || $ext === 'jpeg') {
    $type = 'image/jpeg';
  } else if ($ext === 'svg') {
    $type = 'image/svg+xml';
  } else if ($ext === 'gif') {
    $type = 'image/gif';
  }

  $uri = 'data:' . $type . ';base64,' . $base64;
  $output = $matches[1] . ':' . $matches[2] . "url('" . $uri . "')";

  return $output;
}

echo preg_replace_callback(
  '/(background|background-image|content)\s*:(.*?)url\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)/sim',
  'replace_callback', $content);

// vim:set spell spl=en fo=anl1qrowcb tw=80 ts=2 sw=2 sts=2 sta et noai nocin fenc=utf-8 ff=unix: 
?>
