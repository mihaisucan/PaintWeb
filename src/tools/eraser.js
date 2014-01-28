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
 * $Date: 2014-01-28 13:04:28 $
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


