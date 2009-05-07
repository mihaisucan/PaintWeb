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
 * $Date: 2009-05-07 22:26:26 +0300 $
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
PaintWebInstance.toolAdd('curve', function (app) {
  var _self       = this,
      config      = app.config,
      context     = app.buffer.context,
      image       = app.image,
      layerUpdate = app.layerUpdate,
      mouse       = app.mouse,
      snapXY      = app.toolSnapXY,
      statusShow  = app.statusShow;

  /**
   * Holds the points in the Bézier curve being drawn.
   *
   * @private
   * @type Array
   */
  _self.points = [];

  /**
   * The tool deactivation method, used for clearing the buffer.
   */
  this.deactivate = function () {
    context.clearRect(0, 0, image.width, image.height);

    return true;
  };

  /**
   * The <code>mousedown</code> event handler.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousedown = function (ev) {
    _self.mousemove = _self.draw;

    return _self.draw(ev);
  };

  /**
   * The <code>mouseup</code> event handler. This method stores the current 
   * mouse coordinates as a point to be used for drawing the Bézier curve.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mouseup = function (ev) {
    if (!mouse.buttonDown) {
      return false;
    }

    if (_self.points.length == 0) {
      statusShow('curveSnapping');
    }

    if (_self.points.length == 1) {
      // Snapping on the X/Y axis for the current point.
      if (ev.shiftKey) {
        snapXY(ev, _self.points[0][0], _self.points[0][1]);
      }

      statusShow('curveActive');
    }

    // We need 4 points to draw the Bézier curve: start, end, and two control points.
    if (_self.points.length < 4) {
      _self.points.push([ev.x_, ev.y_]);

      if (!_self.draw()) {
        return false;
      }
    }

    if (_self.points.length == 4) {
      _self.points = [];
      delete _self.mousemove;

      return layerUpdate();
    }

    return true;
  };

  /**
   * Draw the Bézier curve, using the available points.
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {Boolean} True if the curve has been drawn, or false if not.
   */
  _self.draw = function (ev) {
    var y, i, p     = _self.points;
    var n           = p.length,
        lineWidth   = context.lineWidth,
        strokeStyle = context.strokeStyle,
        fillStyle   = context.fillStyle;

    // If there's an event, we can use the new point for live feedback.
    if (ev) {
      n++;
    }

    if (!n) {
      return false;
    }

    context.clearRect(0, 0, image.width, image.height);

    // Draw the main line
    if (n == 2) {
      // Snapping on the X/Y axis for the current point (if available).
      if (ev && ev.shiftKey) {
        snapXY(ev, p[0][0], p[0][1]);
      }

      context.beginPath();
      context.moveTo(p[0][0], p[0][1]+2);
      i = p[1];
      if (!i) {
        i = [ev.x_, ev.y_];
      }
      context.lineTo(i[0], i[1]+2);
      context.lineWidth = 1;
      context.strokeStyle = '#000000';
      context.stroke();
      context.closePath();

      context.lineWidth = lineWidth;
      context.strokeStyle = strokeStyle;
    }

    // Draw the points
    if (n < 4 || (n == 4 && ev)) {
      context.fillStyle = '#0000ff';
      for (i = 0; i < n; i++) {
        y = p[i];
        if (!y) {
          y = [ev.x_, ev.y_];
        }

        context.fillRect(y[0], y[1], 4, 4);
      }
      context.fillStyle = fillStyle;
    }

    // If we do not have at least 3 points we cannot draw any Bézier curve
    if (n < 3) {
      return true;
    }

    // The fourth point
    var p4 = p[3];
    if (!p4) {
      // If the fourth point is not available, then use the current event or the third point.
      if (ev) {
        p4 = [ev.x_, ev.y_];
      } else {
        p4 = p[2];
      }
    }

    var p3 = p[2];
    if (!p3) {
      p3 = [ev.x_, ev.y_];
    }

    context.beginPath();
    context.moveTo(p[0][0], p[0][1]);
    context.bezierCurveTo(p3[0], p3[1],
      p4[0], p4[1],
      p[1][0], p[1][1]);

    if (config.shapeType != 'stroke') {
      context.fill();
    }
    if (config.shapeType != 'fill') {
      context.stroke();
    }

    context.closePath();

    return true;
  };

  /**
   * The <code>keydown</code> event handler. This method allows the user to 
   * press the <kbd>Escape</kbd> key to cancel the current drawing operation.
   *
   * @param {Event} ev The DOM Event object.
   * @returns {Boolean} True if the keyboard shortcut was recognized, or false 
   * if not.
   */
  this.keydown = function (ev) {
    if (ev.kid_ != 'Escape') {
      return false;
    }

    context.clearRect(0, 0, image.width, image.height);
    _self.points = [];
    delete _self.mousemove;

    statusShow('curveActive');

    return true;
  };

  // TODO: check this...
  return true;
});

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:


