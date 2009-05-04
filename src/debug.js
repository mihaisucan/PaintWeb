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
 * $Date: 2009-04-30 20:13:27 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Minimal code used for aiding debugging PaintWeb.
 */

// Opera compatibility
if (!window.console) {
  /**
   * @namespace Holds a simple method used for debugging. Opera doesn't have the 
   * window.console API like Firefox+Firebug has.
   */
  window.console = {};
}

if (!window.console.log) {
  /**
   * Display a message in the debugger. If available, opera.postError is used, 
   * otherwise no message is displayed.
   *
   * @param {mixed} mixed Any number of arguments, each one is displayed in the 
   * debugger.
   */
  window.console.log = function () {
    var msg = '';

    for (var i = 0, n = arguments.length; i < n; i++) {
      msg += arguments[i] + ' ';
    }

    if (window.opera && window.opera.postError) {
      opera.postError(msg);
    }
  };
}

if (!window.console.warn) {
  /**
   * Display a message in the debugger. If available, opera.postError is used, 
   * otherwise no warning is displayed.
   *
   * @param {mixed} mixed Any number of arguments, each one is displayed in the 
   * debugger.
   */
  window.console.warn = function () {
    console.log.apply(null, arguments);
  };
}

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

