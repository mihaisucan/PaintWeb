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
 * $Date: 2009-05-07 22:25:07 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the canvas drag tool implementation.
 */

/**
 * @class The canvas drag tool. This tool allows the user to drag the canvas 
 * inside the viewport.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintWebInstance.toolAdd('drag', function (app) {
  var _self        = this,
      canvasStyle  = app.buffer.canvas.style,
      container    = app.elems.container,
      image        = app.image,
      mouse        = app.mouse,
      toolActivate = app.toolActivate;

  canvasStyle.cursor = 'move';

  /**
   * Holds the previous tool ID.
   *
   * @private
   * @type String
   */
  var prevTool = app.tool._id;

  /**
   * Holds the starting point on the <var>x</var> axis of the image, for the 
   * current drawing operation.
   *
   * @private
   * @type Number
   */
  var x0 = 0;

  /**
   * Holds the starting point on the <var>y</var> axis of the image, for the 
   * current drawing operation.
   *
   * @private
   * @type Number
   */
  var y0 = 0;

  /**
   * Initialize the canvas drag.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousedown = function (ev) {
    x0 = Math.round(ev.x_ * image.zoom);
    y0 = Math.round(ev.y_ * image.zoom);
  };

  /**
   * Perform the canvas drag, while the user moves the mouse.
   *
   * <p>Press <kbd>Escape</kbd> to stop dragging and to get back to the previous 
   * tool.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    if (!mouse.buttonDown) {
      return false;
    }

    var dx = Math.round(ev.x_ * image.zoom) - x0,
        dy = Math.round(ev.y_ * image.zoom) - y0;

    container.scrollTop  -= dy;
    container.scrollLeft -= dx;
  };

  this.deactivate = function (ev) {
    canvasStyle.cursor = '';
  };

  /**
   * Allows the user to press <kbd>Escape</kbd> to stop dragging the canvas, and 
   * to return to the previous tool.
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {Boolean} True if the key was recognized, or false if not.
   */
  this.keydown = function (ev) {
    if (!prevTool || ev.kid_ != 'Escape') {
      return false;
    }

    toolActivate(prevTool, ev);
    return true;
  };

  return true;
});

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:


