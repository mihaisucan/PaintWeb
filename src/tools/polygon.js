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
 * $Date: 2009-06-11 20:28:07 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the polygon tool implementation.
 */

/**
 * @class The polygon tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.tools.polygon = function (app) {
  var _self         = this,
      clearInterval = app.win.clearInterval,
      config        = app.config,
      context       = app.buffer.context,
      gui           = app.gui,
      image         = app.image,
      MathAbs       = Math.abs,
      mouse         = app.mouse,
      setInterval   = app.win.setInterval,
      snapXY        = app.toolSnapXY;

  /**
   * Holds the points in the polygon being drawn.
   *
   * @private
   * @type Array
   */
  var points = [];

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
   * The tool deactivation method, used for clearing the buffer.
   */
  this.deactivate = function () {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    if (points.length) {
      context.clearRect(0, 0, image.width, image.height);
    }

    needsRedraw = false;
    points = [];

    return true;
  };

  /**
   * The <code>mousedown</code> event handler.
   *
   * @param {Event} ev The DOM Event object.
   * @returns {Boolean} True if the event handler executed, or false if not.
   */
  this.mousedown = function (ev) {
    if (points.length == 0) {
      points.push([mouse.x, mouse.y]);
    }

    if (!timer) {
      timer = setInterval(_self.draw, config.toolDrawDelay);
    }

    shiftKey = ev.shiftKey;
    needsRedraw = false;

    gui.statusShow('polygonMousedown');

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
   * Draw the polygon.
   *
   * @see PaintWeb.config.toolDrawDelay
   */
  this.draw = function (ev) {
    if (!needsRedraw) {
      return;
    }

    var n = points.length;

    if (!n || (n == 1 && !mouse.buttonDown)) {
      needsRedraw = false;
      return;
    }

    // Snapping on the X/Y axis for the current point (if available).
    if (mouse.buttonDown && shiftKey) {
      snapXY(points[n-1][0], points[n-1][1]);
    }

    context.clearRect(0, 0, image.width, image.height);
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);

    // Draw the path of the polygon
    for (var i = 0; i < n; i++) {
      context.lineTo(points[i][0], points[i][1]);
    }

    if (mouse.buttonDown) {
      context.lineTo(mouse.x, mouse.y);
    }

    if (config.shapeType != 'stroke') {
      context.fill();
    }

    // In the case where we only have a straight line, draw a stroke even if no 
    // stroke should be drawn, such that the user has better visual feedback.
    if (config.shapeType != 'fill' || n == 1) {
      context.stroke();
    }

    context.closePath();

    needsRedraw = false;
  };

  /**
   * The <code>mouseup</code> event handler.
   *
   * @param {Event} ev The DOM Event object.
   * @returns {Boolean} True if the event handler executed, or false if not.
   */
  this.mouseup = function (ev) {
    var n = points.length;

    // Allow click+mousemove+click, not only mousedown+mousemove+mouseup.
    // Do this only for the first point in the polygon.
    if (n == 1 && mouse.x == points[n-1][0] && mouse.y == points[n-1][1]) {
      mouse.buttonDown = true;
      return true;
    }

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    shiftKey = ev.shiftKey;
    needsRedraw = true;

    if (ev.shiftKey) {
      snapXY(points[n-1][0], points[n-1][1]);
    }

    var diffx1 = MathAbs(mouse.x - points[0][0]),
        diffy1 = MathAbs(mouse.y - points[0][1]),
        diffx2 = MathAbs(mouse.x - points[n-1][0]),
        diffy2 = MathAbs(mouse.y - points[n-1][1]);

    // End the polygon if the new point is close enough to the first/last point.
    if ((diffx1 < 5 && diffy1 < 5) || (diffx2 < 5 && diffy2 < 5)) {
      // Add the start point to complete the polygon shape.
      points.push(points[0]);

      _self.draw();
      points = [];

      gui.statusShow('polygonActive');
      app.layerUpdate();

      return true;
    }

    if (n > 3) {
      gui.statusShow('polygonEnd');
    } else {
      gui.statusShow('polygonAddPoint');
    }

    points.push([mouse.x, mouse.y]);
    _self.draw();

    return true;
  };

  /**
   * The <code>keydown</code> event handler. This method allows the user to 
   * cancel drawing the current polygon, using the <kbd>Escape</kbd> key. The 
   * <kbd>Enter</kbd> key can be used to accept the current polygon shape, and 
   * end the drawing operation.
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {Boolean} True if the keyboard shortcut was recognized, or false 
   * if not.
   */
  this.keydown = function (ev) {
    var n = points.length;
    if (!n || (ev.kid_ != 'Escape' && ev.kid_ != 'Enter')) {
      return false;
    }

    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    mouse.buttonDown = false;

    if (ev.kid_ == 'Escape') {
      context.clearRect(0, 0, image.width, image.height);
      needsRedraw = false;

    } else if (ev.kid_ == 'Enter') {
      // Add the point of the last mousemove event, and the start point, to 
      // complete the polygon.
      points.push([mouse.x, mouse.y]);
      points.push(points[0]);
      needsRedraw = true;
      _self.draw();
      app.layerUpdate();
    }

    points = [];
    gui.statusShow('polygonActive');

    return true;
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

