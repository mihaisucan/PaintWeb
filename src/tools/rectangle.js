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
 * $Date: 2009-06-11 20:21:13 +0300 $
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
pwlib.tools.rectangle = function (app) {
  var _self         = this,
      clearInterval = app.win.clearInterval,
      config        = app.config,
      context       = app.buffer.context,
      gui           = app.gui,
      image         = app.image,
      MathAbs       = Math.abs,
      MathMin       = Math.min,
      mouse         = app.mouse,
      setInterval   = app.win.setInterval;

  /**
   * The interval ID used for invoking the drawing operation every few 
   * milliseconds.
   *
   * @private
   * @see PaintWeb.config.toolDrawDelay
   */
  var timer = null;

  /**
   * Tells if the <kbd>Shift</kbd> key is down or not. This is used by the 
   * drawing function.
   *
   * @private
   * @type Boolean
   * @default false
   */
  var shiftKey = false;

  /**
   * Tells if the drawing canvas needs to be updated or not.
   *
   * @private
   * @type Boolean
   * @default false
   */
  var needsRedraw = false;

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
   * Tool deactivation event handler.
   */
  this.deactivate = function () {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    if (mouse.buttonDown) {
      context.clearRect(0, 0, image.width, image.height);
    }

    needsRedraw = false;
  };

  /**
   * Initialize the drawing operation.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousedown = function (ev) {
    x0 = mouse.x;
    y0 = mouse.y;

    if (!timer) {
      timer = setInterval(_self.draw, config.toolDrawDelay);
    }
    shiftKey = ev.shiftKey;
    needsRedraw = false;

    gui.statusShow('rectangleMousedown');

    return true;
  };

  /**
   * Store the <kbd>Shift</kbd> key state which is used by the drawing function.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    shiftKey = ev.shiftKey;
    needsRedraw = true;
  };

  /**
   * Perform the drawing operation. This function is called every few 
   * milliseconds.
   *
   * <p>Hold down the <kbd>Shift</kbd> key to draw a square.
   * <p>Press <kbd>Escape</kbd> to cancel the drawing operation.
   *
   * @see PaintWeb.config.toolDrawDelay
   */
  this.draw = function () {
    if (!needsRedraw) {
      return;
    }

    context.clearRect(0, 0, image.width, image.height);

    var x = MathMin(mouse.x,  x0),
        y = MathMin(mouse.y,  y0),
        w = MathAbs(mouse.x - x0),
        h = MathAbs(mouse.y - y0);

    if (!w || !h) {
      needsRedraw = false;
      return;
    }

    // Constrain the shape to a square
    if (shiftKey) {
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

    needsRedraw = false;
  };

  /**
   * End the drawing operation, once the user releases the mouse button.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mouseup = function (ev) {
    // Allow click+mousemove, not only mousedown+move+up
    if (mouse.x == x0 && mouse.y == y0) {
      mouse.buttonDown = true;
      return true;
    }

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    shiftKey = ev.shiftKey;
    _self.draw();
    app.layerUpdate();
    gui.statusShow('rectangleActive');

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

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    context.clearRect(0, 0, image.width, image.height);
    mouse.buttonDown = false;
    needsRedraw = false;

    gui.statusShow('rectangleActive');

    return true;
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:


