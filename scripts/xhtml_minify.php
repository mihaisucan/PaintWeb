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
 * $Date: 2009-07-02 20:49:18 +0300 $
 */

// This file takes an XHTML/HTML file as input, and outputs a minified string, 
// which basically only has all the comments stripped and any leading 
// whitespace.
// Obviously, I could use PHP DOM ... but based on experience it's kinda flimsy.  
// Sure, this is flimsy as well - yet I control the flimsyness.

$content = '';
while(!feof(STDIN)) {
  $content .= fgets(STDIN, 4096);
}

echo trim(preg_replace(
  array('/<!-- .+? -->/ms', '/^\s+/m', '/[\n]+/m'),
  array('', ' ', ' '),
  $content));

// vim:set spell spl=en fo=anl1qrowcb tw=80 ts=2 sw=2 sts=2 sta et noai nocin fenc=utf-8 ff=unix: 
?>
