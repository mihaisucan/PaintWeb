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
 * $Date: 2009-07-16 15:27:32 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the integration code for PaintWeb inside <a 
 * href="http://www.moodle.org">Moodle</a>.
 */

/**
 * @class The Moodle extension for PaintWeb. This extension handles the Moodle 
 * integration inside the PaintWeb code.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.extensions.moodle = function (app) {
  var _self = this;

  /**
   * The <code>extensionRegister</code> event handler.
   *
   * @returns {Boolean} True if the extension initialized successfully, or false 
   * if not.
   */
  this.extensionRegister = function () {

    return true;
  };

  /**
   * The <code>extensionUnregister</code> event handler.
   */
  this.extensionUnregister = function () {
    return;
  };

};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

