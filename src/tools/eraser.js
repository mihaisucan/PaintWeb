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
 * $Date: 2009-05-07 22:25:59 +0300 $
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
  var _self        = this,
      context      = app.buffer.context,
      layerContext = app.layer.context,
      layerUpdate  = app.layerUpdate,
      mouse        = app.mouse,
      image        = app.image;

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
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousedown = function (ev) {
    // The mousedown event remembers the current strokeStyle and sets a white 
    // colored stroke (same as the background), such that the user gets live 
    // feedback of what he/she erases.

    _self.strokeStyle = context.strokeStyle;
    // FIXME: ...
    context.strokeStyle = 'rgb(255,255,255)';

    x0 = ev.x_;
    y0 = ev.y_;

    context.beginPath();
    context.moveTo(ev.x_, ev.y_);

    return true;
  };

  /**
   * Perform the drawing operation, while the user moves the mouse.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    if (!mouse.buttonDown) {
      return false;
    }

    context.clearRect(0, 0, image.width, image.height);
    context.lineTo(ev.x_, ev.y_);
    context.stroke();

    return true;
  };

  /**
   * End the drawing operation, once the user releases the mouse button.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mouseup = function (ev) {
    // The mouseup event handler changes the globalCompositeOperation to 
    // destination-out such that the white pencil path drawn by the user cuts 
    // out/clears the destination image

    if (ev.x_ == x0 && ev.y_ == y0) {
      context.lineTo(ev.x_, ev.y_ + 1);
      context.stroke();
    }

    var op = layerContext.globalCompositeOperation;
    layerContext.globalCompositeOperation = 'destination-out';

    context.closePath();
    layerUpdate();

    layerContext.globalCompositeOperation = op;

    context.strokeStyle = _self.strokeStyle;

    return true;
  };

  // TODO: check this...
  return true;
});

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:


