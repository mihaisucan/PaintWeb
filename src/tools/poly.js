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
 * $Date: 2009-05-07 22:26:30 +0300 $
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
// TODO: Merge behaviour with line tool, and improve usability (mousedown and
// mouseup feedback).
PaintWebInstance.toolAdd('poly', function (app) {
  var _self       = this,
      config      = app.config,
      context     = app.buffer.context,
      image       = app.image,
      layerUpdate = app.layerUpdate,
      mouse       = app.mouse,
      snapXY      = app.toolSnapXY,
      statusShow  = app.statusShow;

  /**
   * Holds the points in the polygon being drawn.
   *
   * @private
   * @type Array
   */
  this.points = [];

  /**
   * Tells if the drawing operation has been started or not.
   *
   * @private
   * @type Boolean
   */
  this.started = false;

  /**
   * The <code>click</code> event handler.
   *
   * <p>This method adds the points in the polygon shape. If the mouse 
   * coordinates are close to the first/last point, then the drawing operation 
   * is ended.
   *
   * @param {Event} ev The DOM Event object.
   * @returns {Boolean} True if the event handler executed, or false if not.
   */
  this.click = function (ev) {
    if (_self.started) {
      if (ev.shiftKey) {
        snapXY(ev, _self.x1, _self.y1);
      }

      var diffx1 = Math.abs(ev.x_ - _self.x0),
          diffy1 = Math.abs(ev.y_ - _self.y0),
          diffx2 = Math.abs(ev.x_ - _self.x1),
          diffy2 = Math.abs(ev.y_ - _self.y1);

      // End the polygon if the new point is close enough to the first/last point.
      if ((diffx1 < 5 && diffy1 < 5) || (diffx2 < 5 && diffy2 < 5)) {
        // Add the start point to complete the polygon shape.
        _self.points.push([_self.x0, _self.y0]);

        _self.mousemove();
        _self.points = [];
        _self.started = false;

        statusShow('polyActive');
        layerUpdate();

        return true;
      }
    }

    // Remember the last pointer position.
    _self.x1 = ev.x_;
    _self.y1 = ev.y_;

    if (!_self.started) {
      _self.started = true;

      // Remember the first pointer position.
      _self.x0 = ev.x_;
      _self.y0 = ev.y_;

      statusShow('polyMousedown');
    }

    _self.points.push([ev.x_, ev.y_]);

    // Users need to know how to end drawing the polygon.
    if (_self.points.length > 3) {
      statusShow('polyEnd');
    }

    _self.mousemove();

    return true;
  };

  /**
   * The <code>mousemove</code> event handler. This method performs the actual 
   * polygon drawing operation.
   *
   * @param {Event} ev The DOM Event object.
   * @returns {Boolean} True if the polygon was drawn, false if not.
   */
  this.mousemove = function (ev) {
    var p, i, n   = _self.points.length,
        fillStyle = context.fillStyle;

    if (!_self.started || !n || (n == 1 && !ev)) {
      return false;
    }

    // Store the last ev.x_ and ev.y_, for later use.
    if (ev) {
      _self.ex = ev.x_;
      _self.ey = ev.y_;
    }

    // Snapping on the X/Y axis for the current point (if available).
    if (ev && ev.shiftKey) {
      snapXY(ev, _self.x1, _self.y1);
    }

    context.clearRect(0, 0, image.width, image.height);
    context.beginPath();
    context.moveTo(_self.points[0][0], _self.points[0][1]);

    // Draw the path of the polygon
    for (i = 0; i < n; i++) {
      p = _self.points[i];
      context.lineTo(p[0], p[1]);
    }

    // If there's a current event, then draw the temporary point as well.
    if (ev) {
      context.lineTo(ev.x_, ev.y_);
    }

    if (config.shapeType != 'stroke') {
      context.fill();
    }

    if (config.shapeType != 'fill' || n == 1) {
      // In the case where we only have a straight line, draw a stroke even if no stroke should be drawn, such that the user has better visual feedback.

      if (n == 1 && ev && config.shapeType == 'fill') {
        var strokeStyle = context.strokeStyle,
            lineWidth   = context.lineWidth;

        context.strokeStyle = context.fillStyle;
        context.lineWidth   = 1;
        context.stroke();
        context.strokeStyle = strokeStyle;
        context.lineWidth   = lineWidth;
      } else {
        context.stroke();
      }
    }

    context.closePath();

    // Draw blue squares for each point to provide live feedback for the user. The squares will not show when the final drawing is complete.
    if (ev) {
      context.fillStyle = '#0000ff';
      for (i = 0; i < n; i++) {
        p = _self.points[i];
        context.fillRect(p[0], p[1], 4, 4);
      }
      context.fillStyle = fillStyle;
    }

    return true;
  };

  /**
   * The <code>keydown</code> event handler. This method allows the user to 
   * cancel drawing the current polygon, using the <kbd>Escape</kbd> key. The 
   * <kbd>Enter</kbd> key can be used to accept the current polygon shape, and 
   * end the drawing operation.
   *
   * @param {Event} ev The DOM Event object.
   * @returns {Boolean} True if the keyboard shortcut was recognized, or false 
   * if not.
   */
  this.keydown = function (ev) {
    if (!_self.started || (ev.kid_ != 'Escape' && ev.kid_ != 'Enter')) {
      return false;
    }

    if (ev.kid_ == 'Escape') {
      context.clearRect(0, 0, image.width, image.height);

    } else if (ev.kid_ == 'Enter') {
      // Add the point of the last mousemove event, and the start point, to complete the polygon.
      _self.points.push([_self.ex, _self.ey]);
      _self.points.push([_self.x0, _self.y0]);
      _self.mousemove();

      layerUpdate();
    }

    _self.points = [];
    _self.started = false;

    statusShow('polyActive');

    return true;
  };

  // TODO: check this ...
  return true;
});

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:


