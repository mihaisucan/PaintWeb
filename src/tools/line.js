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
 * $Date: 2009-05-07 22:26:54 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the line tool implementation.
 */

/**
 * @class The line tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintWebInstance.toolAdd('line', function (app) {
  var context     = app.buffer.context,
      image       = app.image,
      layerUpdate = app.layerUpdate,
      mouse       = app.mouse,
      snapXY      = app.toolSnapXY,
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
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousedown = function (ev) {
    x0 = ev.x_;
    y0 = ev.y_;

    statusShow('lineMousedown');

    return true;
  };

  /**
   * Perform the drawing operation, while the user moves the mouse.
   *
   * <p>Hold down the <kbd>Shift</kbd> key to draw a straight 
   * horizontal/vertical line.
   * <p>Press <kbd>Escape</kbd> to cancel the drawing operation.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    if (!mouse.buttonDown) {
      return false;
    }

    context.clearRect(0, 0, image.width, image.height);

    // Snapping on the X/Y axis.
    if (ev.shiftKey) {
      snapXY(ev, x0, y0);
    }

    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(ev.x_, ev.y_);
    context.stroke();
    context.closePath();

    return true;
  };

  /**
   * End the drawing operation, once the user releases the mouse button.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mouseup = function (ev) {
    if (!mouse.buttonDown) {
      return false;
    }

    // FIXME: Allow users to click then drag, not only mousedown+drag+mouseup.
    /*if (ev.x_ == x0 && ev.y_ == y0) {
      return true;
    }*/

    statusShow('lineActive');
    layerUpdate();

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
    statusShow('lineActive');
    mouse.buttonDown = false;

    return true;
  };

  // TODO: check this...
  return true;
});


// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

