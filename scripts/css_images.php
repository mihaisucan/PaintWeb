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
 * $Date: 2009-07-02 20:49:00 +0300 $
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
