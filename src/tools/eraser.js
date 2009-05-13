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
 * $Date: 2009-05-13 23:08:46 +0300 $
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
PaintWebInstance.toolAdd('eraser', function (app) {
  var _self         = this,
      context       = app.buffer.context,
      layerContext  = app.layer.context,
      layerUpdate   = app.layerUpdate,
      mouse         = app.mouse,
      image         = app.image,
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

  _self.strokeStyle = context.strokeStyle;

  this.deactivate = function () {
    if (mouse.buttonDown) {
      context.closePath();
    }

    if (_self.strokeStyle) {
      context.strokeStyle = _self.strokeStyle;
    }

    // Enable canvas shadow.
    if (app.inputs.shadowActive) {
      app.inputs.shadowActive.disabled = false;
      if (_self.shadowActive) {
        app.shadowEnable();
      }
    }

    return true;
  };

  // Activation code. This is run after the tool construction and after the 
  // deactivation of the previous tool.
  this.activate = function () {
    // Disable the canvas shadow.
    if (app.inputs.shadowActive) {
      _self.shadowActive = app.inputs.shadowActive.checked;
      app.shadowDisable();
      app.inputs.shadowActive.disabled = true;
    }

    return true;
  };

  /**
   * Initialize the drawing operation.
   */
  this.mousedown = function () {
    // The mousedown event remembers the current strokeStyle and sets a white 
    // colored stroke (same as the background), such that the user gets live 
    // feedback of what he/she erases.

    _self.strokeStyle = context.strokeStyle;
    // FIXME: ...
    context.strokeStyle = 'rgb(255,255,255)';

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
    // The mouseup event handler changes the globalCompositeOperation to 
    // destination-out such that the white pencil path drawn by the user cuts 
    // out/clears the destination image

    if (mouse.x == x0 && mouse.y == y0) {
      points.push(x0+1, y0+1);
    }

    clearInterval(timer);
    draw();

    var op = layerContext.globalCompositeOperation;
    layerContext.globalCompositeOperation = 'destination-out';

    layerUpdate();

    layerContext.globalCompositeOperation = op;

    context.strokeStyle = _self.strokeStyle;

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


