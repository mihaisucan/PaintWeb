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
 * $Date: 2009-07-29 20:34:06 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the eraser tool implementation.
 */

/**
 * @class The eraser tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.tools.eraser = function (app) {
  var _self         = this,
      bufferContext = app.buffer.context,
      clearInterval = app.win.clearInterval,
      config        = app.config,
      history       = app.history.pos,
      image         = app.image,
      layerContext  = app.layer.context,
      mouse         = app.mouse,
      setInterval   = app.win.setInterval;

  /**
   * The interval ID used for running the erasing operation every few 
   * milliseconds.
   *
   * @private
   * @see PaintWeb.config.toolDrawDelay
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

  var globalOp_  = null,
      lineWidth_ = null;

  /**
   * The tool deactivation event handler. This function clears timers, clears 
   * the canvas and allows shadows to be rendered again.
   */
  this.deactivate = function () {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    if (mouse.buttonDown) {
      if (globalOp_) {
        layerContext.globalCompositeOperation = globalOp_;
      }
      if (lineWidth_) {
        layerContext.lineWidth = lineWidth_;
      }

      app.historyGoto(history.pos);
    }

    points = [];

    // Allow Canvas shadows.
    app.shadowAllow();
  };

  /**
   * The tool activation event handler. This is run after the tool construction 
   * and after the deactivation of the previous tool. This function simply 
   * disallows the rendering of shadows.
   */
  this.activate = function () {
    // Do not allow Canvas shadows.
    app.shadowDisallow();
  };

  /**
   * Initialize the drawing operation.
   */
  this.mousedown = function () {
    globalOp_  = layerContext.globalCompositeOperation;
    lineWidth_ = layerContext.lineWidth;

    layerContext.globalCompositeOperation = 'destination-out';
    layerContext.lineWidth = bufferContext.lineWidth;

    x0 = mouse.x;
    y0 = mouse.y;

    points = [];
    if (!timer) {
      timer = setInterval(_self.draw, config.toolDrawDelay);
    }

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
   * Draw the points in the stack. This function is called every few 
   * milliseconds.
   *
   * @see PaintWeb.config.toolDrawDelay
   */
  this.draw = function () {
    var i = 0, n = points.length;
    if (!n) {
      return;
    }

    layerContext.beginPath();
    layerContext.moveTo(x0, y0);

    while (i < n) {
      x0 = points[i++];
      y0 = points[i++];
      layerContext.lineTo(x0, y0);
    }

    layerContext.stroke();
    layerContext.closePath();

    points = [];
  };

  /**
   * End the drawing operation, once the user releases the mouse button.
   */
  this.mouseup = function () {
    if (mouse.x == x0 && mouse.y == y0) {
      points.push(x0+1, y0+1);
    }

    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    _self.draw();

    layerContext.globalCompositeOperation = globalOp_;
    layerContext.lineWidth = lineWidth_;

    app.historyAdd();

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

    layerContext.globalCompositeOperation = globalOp_;
    layerContext.lineWidth = lineWidth_;

    mouse.buttonDown = false;
    points = [];

    app.historyGoto(history.pos);

    return true;
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:


