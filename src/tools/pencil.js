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
 * $Date: 2009-05-13 23:06:56 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the pencil tool implementation.
 */

/**
 * @class The drawing pencil.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintWebInstance.toolAdd('pencil', function (app) {
  var _self         = this,
      context       = app.buffer.context,
      layerUpdate   = app.layerUpdate,
      mouse         = app.mouse,
      setInterval   = window.setInterval,
      clearInterval = window.clearInterval;

  /**
   * The delay used between each drawing call.
   *
   * @type Number
   * @default 100
   */
  this.delay = 100;

  /**
   * The interval ID used for running the pencil drawing operation every few 
   * milliseconds.
   * @private
   */
  var timer = null;

  /**
   * Holds the points needed to be drawn. Each point is added by the 
   * <code>mousemove</code> event handler.
   *
   * @private
   * @type Array
   */
  var points = [];

  /**
   * Holds the last point on the <var>x</var> axis of the image, for the current 
   * drawing operation.
   *
   * @private
   * @type Number
   */
  var x0 = 0;

  /**
   * Holds the last point on the <var>y</var> axis of the image, for the current 
   * drawing operation.
   *
   * @private
   * @type Number
   */
  var y0 = 0;

  /**
   * Initialize the drawing operation.
   */
  this.mousedown = function () {
    x0 = mouse.x;
    y0 = mouse.y;

    points = [];
    timer = setInterval(draw, _self.delay);

    return true;
  };

  /**
   * Save the mouse coordinates in the array.
   */
  this.mousemove = function () {
    if (mouse.buttonDown) {
      points.push(mouse.x, mouse.y);
    }
  };

  /**
   * End the drawing operation, once the user releases the mouse button.
   */
  this.mouseup = function () {
    if (mouse.x == x0 && mouse.y == y0) {
      points.push(x0+1, y0+1);
    }

    clearInterval(timer);
    draw();
    layerUpdate();

    return true;
  };

  /**
   * Draw the points in the stack. This function is called every few 
   * milliseconds.
   */
  function draw () {
    var i = 0, n = points.length;
    if (!n) {
      return;
    }

    context.beginPath();
    context.moveTo(x0, y0);

    while (i < n) {
      x0 = points[i++];
      y0 = points[i++];
      context.lineTo(x0, y0);
    }

    context.stroke();
    context.closePath();

    points = [];
  };

  // TODO: check this...
  return true;
});

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

