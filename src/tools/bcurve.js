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
 * $Date: 2014-01-28 12:55:35 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the Bézier curve tool implementation.
 */

/**
 * @class The Bézier curve tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.tools.bcurve = function (app) {
  var _self         = this,
      clearInterval = app.win.clearInterval,
      config        = app.config,
      context       = app.buffer.context,
      gui           = app.gui,
      image         = app.image,
      mouse         = app.mouse,
      setInterval   = app.win.setInterval,
      snapXY        = app.toolSnapXY;

  /**
   * Holds the points in the Bézier curve being drawn.
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

    if (points.length > 0) {
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
   */
  this.mousedown = function (ev) {
    if (points.length === 0) {
      gui.statusShow('bcurveSnapping');
      points.push([mouse.x, mouse.y]);
    }

    if (!timer) {
      timer = setInterval(_self.draw, config.toolDrawDelay);
    }

    shiftKey = ev.shiftKey;
    needsRedraw = false;

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
   * Draw the Bézier curve, using the available points.
   *
   * @see PaintWeb.config.toolDrawDelay
   */
  this.draw = function () {
    if (!needsRedraw) {
      return;
    }

    var n = points.length;

    // Add the temporary point while the mouse button is down.
    if (mouse.buttonDown) {
      if (shiftKey && n === 1) {
        snapXY(points[0][0], points[0][1]);
      }
      points.push([mouse.x, mouse.y]);
      n++;
    }

    var p0 = points[0],
        p1 = points[1],
        p2 = points[2],
        p3 = points[3] || points[2];

    if (mouse.buttonDown) {
      points.pop();
    }

    context.clearRect(0, 0, image.width, image.height);

    if (!n) {
      needsRedraw = false;
      return;
    }

    // Draw the main line
    if (n === 2) {
      context.beginPath();
      context.moveTo(p0[0], p0[1]+2);
      context.lineTo(p1[0], p1[1]+2);

      if (config.shapeType === 'fill') {
        var lineWidth   = context.lineWidth,
            strokeStyle = context.strokeStyle;

        context.lineWidth   = 1;
        context.strokeStyle = context.fillStyle;
      }

      context.stroke();
      context.closePath();

      if (config.shapeType === 'fill') {
        context.lineWidth   = lineWidth;
        context.strokeStyle = strokeStyle;
      }

      needsRedraw = false;
      return;
    }

    // Draw the Bézier curve

    context.beginPath();
    context.moveTo(p0[0], p0[1]);
    context.bezierCurveTo(
      p2[0], p2[1],
      p3[0], p3[1],
      p1[0], p1[1]);

    if (config.shapeType !== 'stroke') {
      context.fill();
    }

    if (config.shapeType !== 'fill') {
      context.stroke();
    }

    context.closePath();

    needsRedraw = false;
  };

  /**
   * The <code>mouseup</code> event handler. This method stores the current 
   * mouse coordinates as a point to be used for drawing the Bézier curve.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mouseup = function (ev) {
    var n = points.length;

    // Allow click+mousemove+click, not only mousedown+mousemove+mouseup.
    // Do this only for the start point.
    if (n === 1 && mouse.x === points[0][0] && mouse.y === points[0][1]) {
      mouse.buttonDown = true;
      return true;
    }

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    if (n === 1 && ev.shiftKey) {
      snapXY(points[0][0], points[0][1]);
    }

    // We need 4 points to draw the Bézier curve: start, end, and two control 
    // points.
    if (n < 4) {
      points.push([mouse.x, mouse.y]);
      needsRedraw = true;
      n++;
    }

    // Make sure the canvas is up-to-date.
    shiftKey = ev.shiftKey;
    _self.draw();

    if (n === 2 || n === 3) {
      gui.statusShow('bcurveControlPoint' + (n-1));
    } else if (n === 4) {
      gui.statusShow('bcurveActive');
      app.layerUpdate();
      points = [];
    }

    return true;
  };

  /**
   * The <code>keydown</code> event handler. This method allows the user to 
   * press the <kbd>Escape</kbd> key to cancel the current drawing operation.
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {Boolean} True if the keyboard shortcut was recognized, or false 
   * if not.
   */
  this.keydown = function (ev) {
    if (!points.length || ev.kid_ !== 'Escape') {
      return false;
    }

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    context.clearRect(0, 0, image.width, image.height);

    points = [];
    needsRedraw = false;
    mouse.buttonDown = false;

    gui.statusShow('bcurveActive');

    return true;
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

