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
 * $Date: 2009-05-13 23:16:37 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the rectangle tool implementation.
 */

/**
 * @class The rectangle tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintWebInstance.toolAdd('rect', function (app) {
  var config      = app.config,
      context     = app.buffer.context,
      image       = app.image,
      layerUpdate = app.layerUpdate,
      MathAbs     = Math.abs,
      MathMin     = Math.min,
      mouse       = app.mouse,
      statusShow  = app.statusShow;

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
   * Initialize the drawing operation, by storing the location of the pointer, 
   * the start position.
   */
  this.mousedown = function () {
    x0 = mouse.x;
    y0 = mouse.y;

    statusShow('rectMousedown');

    return true;
  };

  /**
   * Perform the drawing operation, while the user moves the mouse.
   *
   * <p>Hold down the <kbd>Shift</kbd> key to draw a square.
   * <p>Press <kbd>Escape</kbd> to cancel the drawing operation.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    if (!mouse.buttonDown) {
      return false;
    }

    context.clearRect(0, 0, image.width, image.height);

    var x = MathMin(mouse.x,  x0),
        y = MathMin(mouse.y,  y0),
        w = MathAbs(mouse.x - x0),
        h = MathAbs(mouse.y - y0);

    if (!w || !h) {
      return false;
    }

    // Constrain the shape to a square
    if (ev.shiftKey) {
      if (w > h) {
        if (y == mouse.y) {
          y -= w-h;
        }
        h = w;
      } else {
        if (x == mouse.x) {
          x -= h-w;
        }
        w = h;
      }
    }

    if (config.shapeType != 'stroke') {
      context.fillRect(x, y, w, h);
    }

    if (config.shapeType != 'fill') {
      context.strokeRect(x, y, w, h);
    }

    return true;
  };

  /**
   * End the drawing operation, once the user releases the mouse button.
   */
  this.mouseup = function () {
    // FIXME: Allow click+mousemove, not only mousedown+move+up
    /*if (mouse.x == x0 && mouse.y == y0) {
      return true;
    }*/

    layerUpdate();
    statusShow('rectActive');

    return true;
  };

  /**
   * Allows the user to press <kbd>Escape</kbd> to cancel the drawing operation.
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {Boolean} True if the drawing operation was cancelled, or false if 
   * not.
   */
  this.keydown = function (ev) {
    if (!mouse.buttonDown || ev.kid_ != 'Escape') {
      return false;
    }

    context.clearRect(0, 0, image.width, image.height);
    mouse.buttonDown = false;

    statusShow('rectActive');

    return true;
  };

  // TODO: check this...
  return true;
});

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:


