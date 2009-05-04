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
 * $Date: 2009-05-04 16:12:07 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview The drawing tools for the PaintWeb application.
 */

/**
 * Holds the implementation of each drawing tool.
 */
var PaintTools = {};

// TODO: more jsdoc comments and code reorg

/**
 * @class The rectangle tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintTools.rect = function (app) {
  var config      = app.config,
      context     = app.buffer.context,
      image       = app.image,
      layerUpdate = app.layerUpdate,
      mouse       = app.mouse,
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

    statusShow('rectMousedown');

    return true;
  };

  /**
   * Perform the drawing operation, while the user moves the mouse.
   *
   * <p>Hold down the <kbd>Shift</kbd> key to draw a square.
   * <p>Press <kbd>Escape</kbd> to cancel the drawing operation.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    if (!mouse.buttonDown) {
      return false;
    }

    context.clearRect(0, 0, image.width, image.height);

    var x = Math.min(ev.x_,  x0),
        y = Math.min(ev.y_,  y0),
        w = Math.abs(ev.x_ - x0),
        h = Math.abs(ev.y_ - y0);

    if (!w || !h) {
      return false;
    }

    // Constrain the shape to a square
    if (ev.shiftKey) {
      if (w > h) {
        if (y == ev.y_) {
          y -= w-h;
        }
        h = w;
      } else {
        if (x == ev.x_) {
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

    // FIXME: Allow click+mousemove, not only mousedown+move+up
    /*if (ev.x_ == x0 && ev.y_ == y0) {
      return true;
    }*/

    layerUpdate();
    statusShow('rectActive');

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
    mouse.buttonDown = false;

    statusShow('rectActive');

    return true;
  };

  // TODO: check this...
  return true;
};

/**
 * @class The line tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintTools.line = function (app) {
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
};

/**
 * @class The drawing pencil.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintTools.pencil = function (app) {
  var context     = app.buffer.context,
      layerUpdate = app.layerUpdate,
      mouse       = app.mouse,
      image       = app.image;

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

  this.deactivate = function () {
    if (mouse.buttonDown) {
      context.closePath();
    }

    return true;
  };

  /**
   * Initialize the drawing operation.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousedown = function (ev) {
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
    if (ev.x_ == x0 && ev.y_ == y0) {
      context.lineTo(ev.x_, ev.y_ + 1);
      context.stroke();
    }

    context.closePath();
    layerUpdate();

    return true;
  };

  // TODO: check this...
  return true;
};

/**
 * @class The polygon tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
// TODO: Merge behaviour with line tool, and improve usability (mousedown and
// mouseup feedback).
PaintTools.poly = function (app) {
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
};

/**
 * @class The Bézier curve tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintTools.curve = function (app) {
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
};

/**
 * @class The ellipse tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintTools.ellipse = function (app) {
  var _self       = this,
      config      = app.config,
      context     = app.buffer.context,
      mouse       = app.mouse,
      image       = app.image,
      layerUpdate = app.layerUpdate,
      snapXY      = app.toolSnapXY,
      statusShow  = app.statusShow;

  var K = 4*((Math.SQRT2-1)/3);

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
    // The mouse start position
    x0 = ev.x_;
    y0 = ev.y_;

    statusShow('ellipseMousedown');

    return true;
  };

  /**
   * Perform the drawing operation, while the user moves the mouse.
   *
   * <p>Hold down the <kbd>Shift</kbd> key to draw a circle.
   * <p>Press <kbd>Escape</kbd> to cancel the drawing operation.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    if (!mouse.buttonDown) {
      return false;
    }

    context.clearRect(0, 0, image.width, image.height);

    var rectx0 = Math.min(ev.x_, x0),
        rectx1 = Math.max(ev.x_, x0),
        recty0 = Math.min(ev.y_, y0),
        recty1 = Math.max(ev.y_, y0);

    /*
      ABCD - rectangle
      A(rectx0, recty0), B(rectx1, recty0), C(rectx1, recty1), D(rectx0, recty1)
    */

    var w = rectx1-rectx0,
        h = recty1-recty0;

    if (!w || !h) {
      return false;
    }

    // Constrain the ellipse to be a circle
    if (ev.shiftKey) {
      if (w > h) {
        recty1 = recty0+w;
        if (recty0 == ev.y_) {
          recty0 -= w-h;
          recty1 -= w-h;
        }
        h = w;
      } else {
        rectx1 = rectx0+h;
        if (rectx0 == ev.x_) {
          rectx0 -= h-w;
          rectx1 -= h-w;
        }
        w = h;
      }
    }

    // Ellipse radius
    var rx = w/2,
        ry = h/2; 

    // Ellipse center
    var cx = rectx0+rx,
        cy = recty0+ry;

    // Ellipse radius*Kappa, for the Bézier curve control points
    rx *= K;
    ry *= K;

    context.beginPath();

    // startX, startY
    context.moveTo(cx, recty0);

    // Control points: cp1x, cp1y, cp2x, cp2y, destx, desty
    // go clockwise: top-middle, right-middle, bottom-middle, then left-middle
    context.bezierCurveTo(cx + rx, recty0, rectx1, cy - ry, rectx1, cy);
    context.bezierCurveTo(rectx1, cy + ry, cx + rx, recty1, cx, recty1);
    context.bezierCurveTo(cx - rx, recty1, rectx0, cy + ry, rectx0, cy);
    context.bezierCurveTo(rectx0, cy - ry, cx - rx, recty0, cx, recty0);

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
   * End the drawing operation, once the user releases the mouse button.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mouseup = function (ev) {
    if (!mouse.buttonDown) {
      return false;
    }

    // FIXME: Allow click+mousemove, not only mousedown+move+up
    /*if (ev.x_ == x0 && ev.y_ == y0) {
      return true;
    }*/

    statusShow('ellipseActive');

    return layerUpdate();
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

    statusShow('ellipseActive');

    return true;
  };

  // TODO: check this...
  return true;
};

/**
 * @class The color picker tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintTools.cpicker = function (app) {
  var _self        = this,
      context      = app.buffer.context,
      mouse        = app.mouse,
      image        = app.image,
      layerUpdate  = app.layerUpdate,
      statusShow   = app.statusShow,
      toolActivate = app.toolActivate;

  // There are problems with Safari (tested 20080324 svn trunk, webkitgtk) and Opera Merlin (Opera versions older than 9.5).
  // Safari makes the get/putImageData methods visible, even if they seem unimplemented.
  if (!context.getImageData) {
    alert(lang.errorCpickerUnsupported);
    _self._cancel = true; // FIXME
    return false;
  }

  _self.prev_tool = false;
  _self.target = false;

  // FIXME
  if (app.tool && app.tool._id) {
    _self.prev_tool = app.tool._id;
  }

  // FIXME
  var ce = app.coloreditor;

  // The color picker "dialog" is active
  // FIXME
  if (ce.elems.target) {
    _self.target = ce.elems.target;
    _me.status_texts['cpicker-active'] = _me.status_texts['cpicker-' + _self.target._prop];
  } else {
    _me.status_texts['cpicker-active'] = _me.status_texts['cpicker-normal'];
  }

  this.mousedown = function (ev) {
    if (!_self.target) {
      // The context menu (right-click). This is unsupported by Opera.
      // Also allow Shift+Click for changing the stroke color (making it easier for Opera users).
      // FIXME
      if (ev.button == 2 || ev.shiftKey) {
        _self.target = _me.inputs.strokeStyle;
      } else {
        _self.target = _me.inputs.fillStyle;
      }
      _self.store_pcolor();
    }

    _self.mouseout = _self.mousemove = _self.update_color;

    return _self.update_color(ev);
  };

  this.mouseup = function (ev) {
    if (!_self.target) {
      return false;
    }

    _self.update_color(ev);

    // Hide the current color picker and update the canvas coordinates once the user picks the color.
    // FIXME
    if (_me.elems.colorpicker_target) {
      _me.colorpicker_hide(ev);
    } else {
      delete _self.mousemove, _self.mouseup, _self.mouseout;
    }

    if (_self.prev_tool) {
      toolActivate(_self.prev_tool, ev);
    }

    return true;
  };

  // Escape returns to the previous tool.
  this.keydown = function (ev) {
    if (!_self.prev_tool || ev.kid_ != 'Escape') {
      return false;
    }

    toolActivate(_self.prev_tool, ev);
    return true;
  };

  // Unfortunately, the contextmenu event is unsupported by Opera
  _self.contextmenu = function (ev) {
    // This is already done by ev_canvas()
    ev.preventDefault();
  };

  _self.update_color = function (ev) {
    if (!ev || !_self.target || !_self.target._prop) {
      return false;
    }

    if (ev.type != 'mouseout') {
      var p = _me.img.getImageData(ev.x_, ev.y_, 1, 1);
    } else if (ev.type == 'mouseout' && _self.prev_color) {
      var p = _self.prev_color;
    } else {
      return false;
    }

    var op = p.data[3]/255;
    op = op.toFixed(3);

    if (ev.type == 'mouseup') {
      context[_self.target._prop] = 'rgba(' + p.data[0] + ',' + p.data[1] + ',' + p.data[2] + ',' + op + ')';
      _self.target._value = {
        'red'   : p.data[0] / 255,
        'green' : p.data[1] / 255,
        'blue'  : p.data[2] / 255,
        'alpha' : op
      };
    }

    _self.target.style.backgroundColor = 'rgb(' + p.data[0] + ',' + p.data[1] + ',' + p.data[2] + ')';
    _self.target.style.opacity = op;

    // If the color picker is visible, then update the field values as well.
    if (ce.elems.target) {
      ce.color.red   = p.data[0] / 255;
      ce.color.green = p.data[1] / 255;
      ce.color.blue  = p.data[2] / 255;
      ce.color.alpha = op;
      ce.update_color('rgb');
    }

    return true;
  };

  // This function stores the initial color.
  _self.store_pcolor = function () {
    if (!_self.target || !_self.target._value) {
      return false;
    }

    var color = _self.target._value;

    _self.prev_color = {'width' : 1,
      'height' : 1,
      'data' : [
        Math.round(color.red   * 255),
        Math.round(color.green * 255),
        Math.round(color.blue  * 255),
        color.alpha * 255
      ]
    };

    return true;
  };

  // If the target is available, it means that the color selector is already visible. As such, color picking can start automatically.
  if (_self.target) {
    _self.mouseout = _self.mousemove = _self.update_color;
    _self.store_pcolor();
  }

  // TODO: check this...
  return true;
};

/**
 * @class The eraser tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintTools.eraser = function (app) {
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
};

/**
 * @class The selection tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
// TODO: improve the implementation.
PaintTools.select = function (app) {
  var _self         = this,
      bufferCanvas  = app.buffer.canvas,
      bufferContext = app.buffer.context,
      config        = app.config,
      elems         = app.elems,
      image         = app.image,
      historyAdd    = app.historyAdd,
      inputs        = app.inputs,
      layerCanvas   = app.layer.canvas,
      layerContext  = app.layer.context,
      snapXY        = app.toolSnapXY,
      statusShow    = app.statusShow;

  /*
   * Steps:
   * -1 - selection dropped after mousedown. The script can switch to step 1 (drawing) if the mouse moves, or to step 0 if it does not (allowing to completely drop the selection).
   * 0 - no selection
   * 1 - drawing selection rectangle
   * 2 - selection rectangle available
   * 3 - dragging selection
   * 4 - resizing selection
   * 5 - dragging ImageData
   * 6 - resizing ImageData
   */
  this.step = 0;

  // The following properties are initialised more for the purpose of explaining them

  // The start position for any operation
  this.x0 = false;
  this.y0 = false;

  // The selection start position and the end position, including and excluding borders
  this.sx0b = this.sx0 = false;
  this.sy0b = this.sy0 = false;
  this.sx1b = this.sx1 = false;
  this.sy1b = this.sy1 = false;

  // The inner selection width/height (sw1/sh1).
  // The normal selection width/height (sw2/sh2) are the values used by strokeRect(). They include the lineWidth.
  this.sw1 = this.sh1 = this.sw2 = this.sh2 = false;

  // During step 2 (selection available) the mouse position can be: inside, outside, or on the border/resizer of the selection rectangle.
  this.mpos = false; // 'in' || 'out' || 'r'

  // During steps 4 and 6 (resizing selection/ImageData) the resizer can be: n, ne, e, s, sw, w, nw.
  this.resizer = false;

  // The last bufferContext.lineWidth, and ceil(lineWidth/2)
  this.lineWidth = this.lineWidth2 = false;

  // Remember if the selected ImageData from layerContext has been cut out or not.
  this.cleared = false;

  // Show the selection options.
  elems.selectionOptions.className = '';

  this.canvasStyle = bufferCanvas.style;

  // Older browsers do not support get/putImageData, thus non-transparent 
  // selections cannot be used.
  if (!layerContext.putImageData || !layerContext.getImageData) {
    inputs.selTransparent.checked = true;
  }
  this.transparency = inputs.selTransparent.checked;
  this.transform = inputs.selTransform.checked;

  // Make sure that the selection rectangle is visible enough
  var strokeStyle = inputs.strokeStyle;
  if (strokeStyle && parseFloat(strokeStyle._value.a) < 0.5) {
    strokeStyle._value.a = 1;
    strokeStyle.style.opacity = 1;
    bufferContext[strokeStyle._prop] = 'rgb(' + strokeStyle._value.r + ',' + strokeStyle._value.g + ',' + strokeStyle._value.b + ')';
  }
  delete strokeStyle;

  // The selection buffer
  this.selbuffer = app.doc.createElement('canvas');
  if (!this.selbuffer) {
    alert(lang.errorToolActivate);
    this._cancel = true;
    return false;
  }

  this.selbuffer.id = 'selBuffer';
  this.selbuffer.width = image.width;
  this.selbuffer.height = image.height;

  elems.container.appendChild(this.selbuffer);

  this.selbuffer = this.selbuffer.getContext('2d');
  if (!this.selbuffer) {
    alert(lang.errorToolActivate);
    this._cancel = true;
    return false;
  }

  // Activation code. This is run after the tool construction and after the deactivation of the previous tool.
  this.activate = function () {
    // Disable the bufferCanvas shadow.
    if (inputs.shadowActive) {
      _self.shadowActive = inputs.shadowActive.checked;
      app.shadowDisable();
      inputs.shadowActive.disabled = true;
    }

    return true;
  };

  this.deactivate = function (ev) {
    _self.selbuffer_merge(ev);

    elems.container.removeChild(_self.selbuffer.canvas);
    delete _self.selbuffer;

    inputs.selTransparent.removeEventListener('change', _self.update_transparency, false);

    // Minimize the selection options.
    elems.selectionOptions.className = 'minimized';

    // Enable canvas shadow.
    if (inputs.shadowActive) {
      inputs.shadowActive.disabled = false;
      if (_self.shadowActive) {
        app.shadowEnable();
      }
    }

    return true;
  };

  this.mousedown = function (ev) {
    // While drawing/dragging/resizing the selection/ImageData, mousedown has no effect.
    // This is needed for allowing operations via click+mousemove+click, instead of just mousedown+mousemove+mouseup
    if (_self.step != 0 && _self.step != 2) {
      return false;
    }

    // Update the current mouse position, this is used as the start position for most of the operations.
    _self.x0 = ev.x_;
    _self.y0 = ev.y_;

    // No selection is available, then start drawing a selection (step 1)
    if (_self.step == 0) {
      _self.update_lineWidth(ev);
      _self.step = 1;
      statusShow('selectDraw');

      return true;
    }


    // Step 2: selection available.

    _self.update_mpos(ev);
    _self.update_lineWidth(ev);

    // The user clicked outside the selection: drop the selection, go back to step -1, clear img_temp and put the current _self.selbuffer on the final image.
    // If the user moves the mouse without taking the finger off the mouse button, then a new selection rectangle will start to be drawn: the script will switch to step 1 - drawing selection.
    // If the user simply takes the finger off the mouse button (mouseup), then the script will only switch to step 0 (no selection available).
    if (_self.mpos == 'out') {
      _self.step = -1;
      statusShow('selectActive');
      return _self.selbuffer_merge(ev);
    }

    // Depending on the selection mode the script will manipulate the ImageData or just the selection rectangle, when dragging/resizing.
    _self.transform = inputs.selTransform.checked;

    // The mouse position: 'in' for drag.
    if (_self.mpos == 'in') {
      if (!_self.transform) {
        _self.step = 3; // dragging selection
      } else {
        _self.step = 5; // dragging ImageData
      }
      statusShow('selectDrag');

    } else if (_self.mpos == 'r') {
      // 'r' for resize (the user clicked on the borders)

      if (!_self.transform) {
        _self.step = 4; // resizing selection
      } else {
        _self.step = 6; // resizing ImageData
      }
      statusShow('selectResize');
    }

    // If there's any ImageData currently in memory, which was "cut" out from layerContext, then put the current ImageData on the final image (layerContext), when dragging/resizing the selection
    if (_self.cleared && (_self.step == 3 || _self.step == 4)) {
      _self.selbuffer_merge(ev);
    }

    // When the user drags/resizes the ImageData: cut out the current selection from layerContext
    if (!_self.cleared && (_self.step == 5 || _self.step == 6)) {
      _self.selbuffer_init(ev);
    }

    _self.sx0 -= _self.lineWidth2;
    _self.sy0 -= _self.lineWidth2;

    // Dragging selection (3) or ImageData (5)
    if (_self.step == 3 || _self.step == 5) {
      _self.sx0 -= _self.x0;
      _self.sy0 -= _self.y0;
    }

    return true;
  };

  this.mousemove = function (ev) {
    // Selection dropped, then mouse moves? If yes, switch to drawing a selection (1)
    if (_self.step == -1) {
      _self.step = 1;
      statusShow('selectDraw');
    }

    // Selection available
    if (_self.step == 2) {
      return _self.update_mpos(ev);
    } else if (_self.step < 1 || _self.step > 6) {
      return false; // Unknown step
    }

    bufferContext.clearRect(0, 0, image.width, image.height);

    // Drawing selection rectangle
    if (_self.step == 1) {
      var x = Math.min(ev.x_,  _self.x0),
          y = Math.min(ev.y_,  _self.y0),
          w = Math.abs(ev.x_ - _self.x0),
          h = Math.abs(ev.y_ - _self.y0);

      // Constrain the shape to a square
      if (ev.shiftKey) {
        if (w > h) {
          if (y == ev.y_) {
            y -= w-h;
          }
          h = w;
        } else {
          if (x == ev.x_) {
            x -= h-w;
          }
          w = h;
        }
      }

    } else if (_self.step == 3 || _self.step == 5) {
      // Dragging selection (3) or ImageData (5)

      // Snapping on the X/Y axis
      if (ev.shiftKey) {
        snapXY(ev, _self.x0, _self.y0);
      }

      var x = _self.sx0 + ev.x_,
          y = _self.sy0 + ev.y_,
          w = _self.sw2,
          h = _self.sh2;

      if (_self.step == 5) {
        var dw = _self.sw1,
            dh = _self.sh1;
      }

    } else if (_self.step == 4 || _self.step == 6) {
      // Resizing selection (4) or ImageData (6)

      var param = _self.calc_resize(ev);

      // The rectangle is too small
      if (!param) {
        return false;
      }

      var x = param[0],
          y = param[1],
          w = param[2],
          h = param[3];

      if (_self.step == 6) {
        var dw = w - _self.lineWidth,
            dh = h - _self.lineWidth;
      }
    }

    if (!w || !h) {
      return false;
    }

    // Dragging (5) or resizing (6) ImageData
    if (dw && dh && (_self.step == 5 || _self.step == 6)) {
      var sb = _self.selbuffer;

      // Parameters:
      // source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
      bufferContext.drawImage(sb.canvas, 0, 0, sb._sw, sb._sh,
        x + _self.lineWidth2, y + _self.lineWidth2,
        dw, dh);
    }

    bufferContext.strokeRect(x, y, w, h);

    return true;
  };

  this.mouseup = function (ev) {
    // Selection dropped? If yes, switch to no selection.
    if (_self.step == -1) {
      _self.step = 0;
      statusShow('selectActive');
      return true;
    }

    // Allow click+mousemove+click, not only mousedown+move+up
    if (ev.x_ == _self.x0 && ev.y_ == _self.y0) {
      return true;
    }

    // Skip any unknown step
    if (_self.step < 1 || _self.step > 6 || _self.step == 2) {
      return false;

    } else if (_self.step == 4 || _self.step == 6) {
      // Resizing selection (4) or ImageData (6)  

      var newVal = _self.calc_resize(ev);
      if (!newVal) {
        _self.step = 0;
        app.btn_cut(-1);
        app.btn_copy(-1);
        return false;
      }

      _self.sx0 = newVal[0];
      _self.sy0 = newVal[1];
      _self.sw2 = newVal[2];
      _self.sh2 = newVal[3];
    }

    // Update all the selection info
    _self.calc_selinfo(ev);

    // Back to step 2: selection available
    _self.step = 2;
    app.btn_cut(1);
    app.btn_copy(1);
    statusShow('selectAvailable');

    return true;
  };

  // Determine the mouse position: if it's inside/outside the selection rectangle, or on the border
  this.update_mpos = function (ev) {
    var ncur = '';

    _self.mpos = 'out';

    // Inside the rectangle
    if (ev.x_ < _self.sx1 && ev.y_ < _self.sy1 && ev.x_ > _self.sx0 && ev.y_ > _self.sy0) {
      ncur = 'move';
      _self.mpos = 'in';
    } else {
      // On one of the borders (north/south)
      if (ev.x_ >= _self.sx0b && ev.x_ <= _self.sx1b && ev.y_ >= _self.sy0b && ev.y_ <= _self.sy0) {
        ncur = 'n';
      } else if (ev.x_ >= _self.sx0b && ev.x_ <= _self.sx1b && ev.y_ >= _self.sy1 && ev.y_ <= _self.sy1b) {
        ncur = 's';
      }

      // West/east
      if (ev.y_ >= _self.sy0b && ev.y_ <= _self.sy1b && ev.x_ >= _self.sx0b && ev.x_ <= _self.sx0) {
        ncur += 'w';
      } else if (ev.y_ >= _self.sy0b && ev.y_ <= _self.sy1b && ev.x_ >= _self.sx1 && ev.x_ <= _self.sx1b) {
        ncur += 'e';
      }

      if (ncur != '') {
        _self.resizer = ncur;
        ncur += '-resize';
        _self.mpos = 'r';
      }
    }

    // Due to bug 126457 Opera will not automatically update the cursor, therefore Opera users will not see any visual feedback.
    if (ncur != _self.canvasStyle.cursor) {
      _self.canvasStyle.cursor = ncur;
    }

    return true;
  };

  // Used to update _self.lineWidth, handling all the cases
  _self.update_lineWidth = function (ev) {
    if (_self.lineWidth == bufferContext.lineWidth) {
      return false;
    }

    _self.lineWidth = bufferContext.lineWidth;
    // When lineWidth is an odd number ... tiny pixel errors show
    if ((_self.lineWidth % 2) != 0) {
      _self.lineWidth++;
      bufferContext.lineWidth = _self.lineWidth;
      inputs.lineWidth.value = _self.lineWidth;
    }
    _self.lineWidth2 = _self.lineWidth/2;

    // Selection available (2)
    if (_self.step < 2) {
      return true;
    }

    // Continue with updating the selection info

    _self.sx0 -= _self.lineWidth2;
    _self.sy0 -= _self.lineWidth2;
    _self.sw2 = _self.sw1 + _self.lineWidth;
    _self.sh2 = _self.sh1 + _self.lineWidth;

    return _self.calc_selinfo(ev);
  };

  // This method handles enabling/disabling selection transparency
  this.update_transparency = function (ev) {
    _self.transform = inputs.selTransform.checked;

    // Selection available (step 2)
    if (!_self.transform || _self.step != 2 || this.checked == _self.transparency) {
      return false;
    }

    if (!layerContext.getImageData || !layerContext.putImageData) {
      _self.transparency = this.checked = true;
      return false;
    }

    _self.transparency = this.checked;

    var sb = _self.selbuffer;

    if (!_self.cleared) {
      _self.selbuffer_init(ev);

      // Parameters:
      // source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
      bufferContext.drawImage(sb.canvas, 0, 0, sb._sw, sb._sh,
        _self.sx0 + _self.lineWidth2, _self.sy0 + _self.lineWidth2,
        _self.sw1, _self.sh1);
    }

    bufferContext.clearRect(0, 0, image.width, image.height);

    if (_self.transparency) {
      // If we have the original ImageData, then put it into the selection buffer
      if (sb._imgd) {
        sb.putImageData(sb._imgd, 0, 0);
      }

      sb._imgd = false;
    } else {
      // Draw the selection background and put the ImageData on top.
      bufferContext.fillRect(0, 0, sb._sw, sb._sh);
      bufferContext.drawImage(sb.canvas, 0, 0);

      // Store the original ImageData
      sb._imgd = sb.getImageData(0, 0, sb._sw, sb._sh);

      // Copy the selection background with the ImageData merged on top, in the selection buffer
      sb.clearRect(0, 0, sb._sw, sb._sh);
      sb.drawImage(bufferCanvas, 0, 0);

      bufferContext.clearRect(0, 0, sb._sw, sb._sh);

      // Side note: simply drawing the background and using putImageData does not work, because putImageData replaces all the pixels on the destination. putImageData does not draw the ImageData on top of the destination.
    }

    // Draw the updated selection
    bufferContext.drawImage(sb.canvas, 0, 0, sb._sw, sb._sh, _self.sx0, _self.sy0, _self.sw1, _self.sh1);
    bufferContext.strokeRect(_self.sx0b + _self.lineWidth2, _self.sy0b + _self.lineWidth2, _self.sw2, _self.sh2);

    return true;
  };
  inputs.selTransparent.addEventListener('change', this.update_transparency, 
      false);

  // Calculate the new coordinates of the selection rectangle, and the dimension, based on the mouse position
  this.calc_resize = function (ev) {
    var diffx = ev.x_ - _self.x0,
        diffy = ev.y_ - _self.y0,
        x = _self.sx0, y = _self.sy0,
        w = _self.sw2, h = _self.sh2,
        r = _self.resizer;

    if (r.charAt(0) == 'n') {
      y += diffy;
      h -= diffy;
    } else if (r.charAt(0) == 's') {
      h += diffy;
    }

    if (r == 'e' || r == 'se' || r == 'ne') {
      w += diffx;
    } else if (r == 'w' || r == 'nw' || r == 'sw') {
      x += diffx;
      w -= diffx;
    }

    if (!w || !h) {
      return false;
    }

    // Constrain the rectangle to have the same aspect ratio as the initial rectangle.
    if (ev.shiftKey) {
      var p = _self.sw2 / _self.sh2,
        w2 = w, h2 = h;

      if (r.charAt(0) == 'n' || r.charAt(0) == 's') {
        w2 = (w < 0 ? -1 : 1) * Math.abs(Math.round(h*p));
      } else {
        h2 = (h < 0 ? -1 : 1) * Math.abs(Math.round(w/p));
      }

      if (r == 'nw' || r == 'sw') {
        x -= w2 - w;
        y -= h2 - h;
      }

      w = w2;
      h = h2;
    }

    if (w < 0) {
      x += w;
      w = Math.abs(w);
    }
    if (h < 0) {
      y += h;
      h = Math.abs(h);
    }

    return [x, y, w, h];
  };

  // This method calculates all the needed selection boundaries. Most of these boundaries are used by other methods, while resizing, dragging, etc. For better performance while performing "intensive" operations, it's best that the UA does as little as possible during mousemove
  this.calc_selinfo = function (ev) {
    // Drawing selection rectangle
    if (_self.step == 1) {
      var minX = Math.min(ev.x_, _self.x0),
          minY = Math.min(ev.y_, _self.y0),
          maxX = Math.max(ev.x_, _self.x0),
          maxY = Math.max(ev.y_, _self.y0);

    } else if (_self.step == 3 || _self.step == 5) {
      // Dragging selection (3) or ImageData (5)

      // Snapping on the X/Y axis
      if (ev.shiftKey) {
        snapXY(ev, _self.x0, _self.y0);
      }

      var minX = _self.sx0 + ev.x_,
          minY = _self.sy0 + ev.y_;

    } else if (_self.step == 2 || _self.step == 4 || _self.step == 6) {
      // Selection available (2), resizing selection (4), resizing ImageData (6)

      var minX = _self.sx0,
          minY = _self.sy0;

    } else {
      return false;
    }

    if (_self.step != 1) {
      var maxX = minX + _self.sw2,
          maxY = minY + _self.sh2;
    }

    // Store the selection start and end pos
    _self.sx0 = minX + _self.lineWidth2;
    _self.sy0 = minY + _self.lineWidth2;
    _self.sx1 = maxX - _self.lineWidth2;
    _self.sy1 = maxY - _self.lineWidth2;

    // ... including the borders
    _self.sx0b = minX - _self.lineWidth2;
    _self.sy0b = minY - _self.lineWidth2;
    _self.sx1b = maxX + _self.lineWidth2;
    _self.sy1b = maxY + _self.lineWidth2;

    // inner width and height
    _self.sw1 = _self.sx1 - _self.sx0;
    _self.sh1 = _self.sy1 - _self.sy0;

    if (_self.step == 1) {
      // "normal" width and height (as used by the strokeRect method)
      _self.sw2 = maxX - minX;
      _self.sh2 = maxY - minY;
    }

    return true;
  };

  // Initialize the selection buffer, when the user starts dragging (5) or resizing (6) ImageData
  this.selbuffer_init = function (ev) {
    var x = _self.sx0, y = _self.sy0,
        w = _self.sw1, h = _self.sh1,
        sumX = _self.sx0 + _self.sw1,
        sumY = _self.sy0 + _self.sh1,
        dx = 0, dy = 0,
        sb = _self.selbuffer;

    sb._sw = w;
    sb._sh = h;

    if (x < 0) {
      w += x;
      dx -= x;
      x = 0;
    }
    if (y < 0) {
      h += y;
      dy -= y;
      y = 0;
    }

    if (sumX > image.width) {
      w -= sumX - image.width;
    }
    if (sumY > image.height) {
      h -= sumY - image.height;
    }

    // Copy the currently selected ImageData into the buffer canvas
    bufferContext.drawImage(layerCanvas, x, y, w, h, x, y, w, h);

    sb.clearRect(0, 0, image.width, image.height);

    // Set a non-transparent background for the selection buffer, if the user does not want the selection to have a transparent background.
    sb._imgd = false;
    if (!_self.transparency && layerContext.getImageData) {
      // Store the selection ImageData as-is
      sb._imgd = layerContext.getImageData(x, y, w, h);
      sb.fillStyle = bufferContext.fillStyle;
      sb.fillRect(0, 0, sb._sw, sb._sh);
    }

    // Also put the selected ImageData into the selection buffer bufferCanvas (selbuffer).
    // Parameters: source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
    sb.drawImage(layerCanvas, x, y, w, h, dx, dy, w, h);

    // Clear the selected pixels from the image
    layerContext.clearRect(x, y, w, h);
    _self.cleared = true;

    historyAdd();

    return true;
  };

  // Merge the ImageData from the selection buffer, when the user stops dragging (5) or resizing (6) ImageData.
  this.selbuffer_merge = function (ev) {
    var sb = _self.selbuffer;
    if (!sb) {
      return false;
    }

    if (_self.step == 3 || _self.step == 4) {
      bufferContext.clearRect(_self.sx0, _self.sy0, _self.sw1, _self.sh1);
    } else {
      bufferContext.clearRect(0, 0, image.width, image.height);
    }

    if (_self.cleared && sb._sw && sb._sh) {
      layerContext.drawImage(sb.canvas, 0, 0, sb._sw, sb._sh, _self.sx0, _self.sy0, _self.sw1, _self.sh1);
      historyAdd();
      _self.cleared = false;
    }

    sb._imgd = false;
    _self.canvasStyle.cursor = '';
    app.btn_cut(-1);
    app.btn_copy(-1);

    return true;
  };

  this.sel_cut = function (ev) {
    if (!_self.sel_copy(ev)) {
      return false;
    }

    bufferContext.clearRect(0, 0, image.width, image.height);
    _self.selbuffer.clearRect(0, 0, image.width, image.height);

    if (!_self.cleared) {
      layerContext.clearRect(_self.sx0, _self.sy0, _self.sw1, _self.sh1);
      historyAdd();
    }

    _tool_cleared = false;
    _self.selbuffer._imgd = false;
    _self.step = 0;
    _self.canvasStyle.cursor = '';

    app.btn_cut(-1);
    app.btn_copy(-1);
    statusShow('selectActive');

    return true;
  };

  this.sel_copy = function (ev) {
    if (_self.step != 2) {
      return false;
    }

    if (!layerContext.getImageData || !layerContext.putImageData) {
      alert(lang.errorClipboardUnsupported);
      return false;
    }

    if (!_self.cleared) {
      app.clipboard = layerContext.getImageData(_self.sx0, _self.sy0, _self.sw1, _self.sh1);
      return app.btn_paste(1);
    }

    var sb = _self.selbuffer;

    if (sb._imgd) {
      app.clipboard = sb._imgd;
    } else {
      app.clipboard = sb.getImageData(0, 0, sb._sw, sb._sh);
    }

    return app.btn_paste(1);
  };

  this.sel_paste = function (ev) {
    if (_self.step != 0 && _self.step != 2) {
      return false;
    }

    if (!layerContext.getImageData || !layerContext.putImageData) {
      alert(lang.errorClipboardUnsupported);
      return false;
    }

    // The default position for the pasted image is the top left corner of the visible area, taking into consideration the zoom level.
    var sb = _self.selbuffer,
        x = Math.round(elems.container.scrollLeft / image.zoom),
        y = Math.round(elems.container.scrollTop  / image.zoom),
        w = app.clipboard.width,
        h = app.clipboard.height;

    x += _self.lineWidth;
    y += _self.lineWidth;

    if (_self.step == 2) {
      bufferContext.clearRect(0, 0, image.width, image.height);
      _self.canvasStyle.cursor = '';
      sb._imgd = false;
    }

    // The following code block sucks:
    // you can't use negative values, nor do you have a good globalCompositeOperation
    sb.putImageData(app.clipboard, 0, 0);
    if (_self.transparency) {
      bufferContext.putImageData(app.clipboard, x, y);
    } else {
      bufferContext.fillRect(x, y, w, h);
      bufferContext.drawImage(sb.canvas, x, y);
      sb._imgd = bufferContext.getImageData(x, y, w, h);

      sb.putImageData(sb._imgd, 0, 0);
      sb._imgd = app.clipboard;
    }

    sb._sw = _self.sw1 = w;
    sb._sh = _self.sh1 = h;
    _self.sw2 = w + _self.lineWidth2;
    _self.sh2 = h + _self.lineWidth2;
    _self.sx0 = x;
    _self.sy0 = y;
    _self.sx0b = x - _self.lineWidth;
    _self.sy0b = y - _self.lineWidth;
    _self.sx1 = w + x;
    _self.sy1 = h + y;
    _self.sx1b = _self.sx1 + _self.lineWidth;
    _self.sy1b = _self.sy1 + _self.lineWidth;
    _self.transform = inputs.selTransform.checked = true;
    _self.cleared = true;
    _self.step = 2;

    app.btn_cut(1);
    app.btn_copy(1);
    statusShow('selectAvailable');

    bufferContext.strokeRect(_self.sx0b + _self.lineWidth2, _self.sy0b + _self.lineWidth2, _self.sw2, _self.sh2);

    _self.update_mpos(ev);

    return true;
  };

  // Return: quickly enable/disable the transformation mode.
  // Delete: delete the selected pixels.
  // Escape: drop selection.
  // Alt-Backspace: fill the selection with a flat color (fillStyle). This only works when transformation mode is disabled.
  this.keydown = function (ev) {
    // Toggle transformation mode
    if (ev.kid_ == 'Enter') {
      _self.transform = !inputs.selTransform.checked;
      inputs.selTransform.checked = _self.transform;

    } else if ((ev.kid_ == 'Delete' || ev.kid_ == 'Escape') && _self.step == 2) {
      // Delete the selected pixels and/or drop the selection (when the selection is available).

      // Delete the pixels from the image if they are not deleted already.
      if (!_self.cleared && ev.kid_ == 'Delete') {
        layerContext.clearRect(_self.sx0, _self.sy0, _self.sw1, _self.sh1);
        historyAdd();
      }

      _self.step = 0;
      _self.cleared = false;
      _self.canvasStyle.cursor = '';
      _self.selbuffer._imgd = false;

      bufferContext.clearRect(0, 0, image.width, image.height);
      app.btn_cut(-1);
      app.btn_copy(-1);
      statusShow('selectActive');

    } else if (ev.kid_ == 'Alt Backspace' && !_self.transform) {
      // Fill the selection with a flat color (fillStyle).

      layerContext.fillStyle = bufferContext.fillStyle;
      layerContext.fillRect(_self.sx0, _self.sy0, _self.sw1, _self.sh1);
      historyAdd();

    } else {
      return false;
    }

    return true;
  };

  this.update_lineWidth();

  return true;
};

/**
 * @class The "Insert image" tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
// TODO: allow inserting images from a different host, using server-side magic.
PaintTools.insertimg = function (app) {
  var _self        = this,
      canvasImage  = app.image,
      container    = app.elems.container,
      context      = app.buffer.context,
      layerUpdate  = app.layerUpdate,
      mouse        = app.mouse,
      statusShow   = app.statusShow,
      toolActivate = app.toolActivate;

  /**
   * Holds the previous tool ID.
   *
   * @private
   * @type String
   */
  var prevTool = app.tool._id;

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
   * Tells if the image element loaded or not.
   *
   * @private
   * @type Boolean
   */
  var imageLoaded = false;

  /**
   * Holds the image aspect ratio, used by the resize method.
   *
   * @private
   * @type Number
   */
  var imageRatio = 1;

  /**
   * Holds the image address.
   * @type String
   */
  this.url = prompt(lang.promptInsertimg, this.url || 'http://');

  if (!this.url || this.url.toLowerCase() == 'http://' ||
      this.url.substr(0, 7).toLowerCase() != 'http://') {
    this._cancel = true;
    return false;
  }

  // Remember the URL.
  lib.extend(true, this.constructor.prototype, {url: this.url});

  /**
   * Determine the host from the given HTTP address.
   *
   * @param {String} url The HTTP address.
   * @returns {String} The host name.
   */
  function getHost (url) {
    url = url.substr(7);
    var pos = url.indexOf('/');
    if (pos > -1) {
      url = url.substr(0, pos);
    }

    return url;
  };

  if (getHost(this.url) != app.win.location.host) {
    alert(lang.errorInsertimgHost);
    this._cancel = true;
    return false;
  }

  /**
   * The <code>load</code> event handler for the image element. This method 
   * makes sure the image dimensions are synchronized with the zoom level, and 
   * draws the image on the canvas.
   *
   * @param {Event} ev The DOM Event object.
   */
  function ev_imageLoaded (ev) {
    // Did the image already load?
    if (imageLoaded) {
      return true;
    }

    // The default position for the inserted image is the top left corner of the visible area, taking into consideration the zoom level.
    var x = Math.round(container.scrollLeft / canvasImage.zoom),
        y = Math.round(container.scrollTop  / canvasImage.zoom);

    context.clearRect(0, 0, canvasImage.width, canvasImage.height);

    try {
      context.drawImage(imageElement, x, y);
      imageLoaded = true;
      statusShow('insertimgLoaded');
    } catch (err) {
      alert(lang.errorInsertimg);
    }

    return true;
  };

  /**
   * Holds the DOM image element.
   *
   * @private
   * @type Element
   */
  var imageElement = new Image();
  imageElement.addEventListener('load', ev_imageLoaded, false);
  imageElement.src = this.url;

  /**
   * The <code>mousedown</code> event handler. This method stores the current 
   * mouse location and the image aspect ratio for later reuse by the 
   * <code>mousemove</code> event handler.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousedown = function (ev) {
    if (!imageLoaded) {
      alert(lang.errorInsertimgNotLoaded);
      return false;
    }

    x0 = ev.x_;
    y0 = ev.y_;

    // The image aspect ratio - used by the mousemove method when the user holds 
    // the Shift key down.
    imageRatio = imageElement.width / imageElement.height;

    statusShow('insertimgResize');

    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
  };

  /**
   * The <code>mousemove</code> event handler. When the mouse button is not 
   * down, the user is allowed to pick where he/she wants to insert the image 
   * element, inside the canvas. Once the <code>mousedown</code> event is fired, 
   * this method allows the user to resize the image inside the canvas.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    if (!imageLoaded) {
      return false;
    }

    context.clearRect(0, 0, canvasImage.width, canvasImage.height);

    // If the user is holding down the mouse button, then allow him/her to 
    // resize the image.
    if (mouse.buttonDown) {
      var w = Math.abs(ev.x_ - x0),
          h = Math.abs(ev.y_ - y0),
          x = Math.min(ev.x_,  x0),
          y = Math.min(ev.y_,  y0);

      // If the Shift key is down, constrain the image to have the same aspect 
      // ratio as the original image element.
      if (ev.shiftKey) {
        if (w > h) {
          if (y == ev.y_) {
            y -= w-h;
          }
          h = Math.round(w/imageRatio);
        } else {
          if (x == ev.x_) {
            x -= h-w;
          }
          w = Math.round(h*imageRatio);
        }
      }

      context.drawImage(imageElement, x, y, w, h);
    } else {
      // If the mouse button is not down, simply allow the user to pick where 
      // he/she wants to insert the image element.
      context.drawImage(imageElement, ev.x_, ev.y_);
    }
  };

  /**
   * The <code>mouseup</code> event handler. This method completes the drawing 
   * operation by inserting the image in the layer canvas, and by activating the 
   * previous tool.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mouseup = function (ev) {
    if (!imageLoaded) {
      return false;
    }

    layerUpdate();

    if (prevTool) {
      toolActivate(prevTool, ev);
    }

    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
  };

  /**
   * The tool deactivation event handler.
   */
  this.deactivate = function () {
    if (imageElement) {
      imageElement = null;
      delete imageElement;
    }

    context.clearRect(0, 0, canvasImage.width, canvasImage.height);

    return true;
  };

  /**
   * The <code>keydown</code> event handler allows users to press the 
   * <kbd>Escape</kbd> key to cancel the drawing operation and return to the 
   * previous tool.
   *
   * @param {Event} ev The DOM Event object.
   * @returns {Boolean} True if the key was recognized, or false if not.
   */
  this.keydown = function (ev) {
    if (!prevTool || ev.kid_ != 'Escape') {
      return false;
    }

    mouse.buttonDown = false;

    toolActivate(prevTool, ev);

    return true;
  };

  // TODO: check this ...
  return true;
};

/**
 * @class The text tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
// TODO: make this tool nicer to use and make it work in Opera.
PaintTools.text = function (app) {
  var _self        = this,
      config       = app.config,
      container    = app.elems.container,
      context      = app.buffer.context,
      elems        = app.elems,
      image        = app.image,
      inputs       = app.inputs,
      layerUpdate  = app.layerUpdate,
      mouse        = app.mouse,
      statusShow   = app.statusShow,
      toolActivate = app.toolActivate;

  if (!context.fillText || !context.strokeText) {
    alert(lang.errorTextUnsupported);
    this._cancel = true;
    return false;
  }

  /**
   * Holds the previous tool ID.
   *
   * @private
   * @type String
   */
  var prevTool = app.tool._id;

  // Reset mouse coordinates in the center of the image, for the purpose of 
  // placing the text there.
  mouse.x = Math.round(image.width / 2);
  mouse.y = Math.round(image.height / 2);

  // Show the text options.
  elems.textOptions.className = '';

  /**
   * The event handler for the text field and the other text options.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.textUpdate = function (ev) {
    if (!ev) {
      ev = {};
    }

    ev.x_ = mouse.x;
    ev.y_ = mouse.y;

    _self.mousemove(ev);
  };

  /**
   * Setup the <code>textUpdate()</code> event handler for several inputs. This 
   * allows the text rendering to be updated automatically when some value 
   * changes.
   *
   * @param {String} act The action to perform: 'add' or 'remove' the event 
   * listeners.
   */
  function setup (act) {
    var ev, i, listeners = ['textString', 'textFont', 'textSize', 'lineWidth'];

    for (i in listeners) {
      i = listeners[i];
      i = inputs[i];
      if (!i) {
        continue;
      }

      if (i.tagName.toLowerCase() == 'select' || i.type == 'checkbox') {
        ev = 'change';
      } else {
        ev = 'input';
      }

      if (act == 'add') {
        i.addEventListener(ev,    _self.textUpdate, false);
      } else {
        i.removeEventListener(ev, _self.textUpdate, false);
      }
    }
  };

  setup('add');

  /**
   * The <code>mousemove</code> event handler. This method tracks the mouse 
   * location and updates the text accordingly.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    context.clearRect(0, 0, image.width, image.height);

    if (config.shapeType != 'stroke') {
      context.fillText(inputs.textString.value, ev.x_, ev.y_);
    }

    if (config.shapeType != 'fill') {
      context.strokeText(inputs.textString.value, ev.x_, ev.y_);
    }
  };

  /**
   * The <code>click</code> event handler. This method completes the drawing 
   * operation by inserting the text into the layer canvas, and by activating 
   * the previous tool.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.click = function (ev) {
    _self.mousemove(ev);

    layerUpdate();

    if (prevTool) {
      toolActivate(prevTool, ev);
    }

    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
  };

  /**
   * The tool activation code. This runs after the text tool is constructed, and 
   * after the previous tool has been destructed. This method simply references 
   * the <code>textUpdate()</code> method.
   */
  this.activate = this.textUpdate;

  /**
   * The tool deactivation simply consists of removing the event listeners added 
   * when the tool was constructed, and clearing the buffer canvas.
   */
  this.deactivate = function () {
    setup('remove');

    context.clearRect(0, 0, image.width, image.height);

    // Minimize the text options.
    elems.textOptions.className = 'minimized';

    return true;
  };

  /**
   * The <code>keydown</code> event handler allows users to press the 
   * <kbd>Escape</kbd> key to cancel the drawing operation and return to the 
   * previous tool.
   *
   * @param {Event} ev The DOM Event object.
   * @returns {Boolean} True if the key was recognized, or false if not.
   */
  this.keydown = function (ev) {
    if (!prevTool || ev.kid_ != 'Escape') {
      return false;
    }

    mouse.buttonDown = false;
    toolActivate(prevTool, ev);

    return true;
  };

  // TODO: check this..
  return true;
};

/**
 * @class The canvas drag tool. This tool allows the user to drag the canvas 
 * inside the viewport.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintTools.drag = function (app) {
  var _self        = this,
      canvasStyle  = app.buffer.canvas.style,
      container    = app.elems.container,
      image        = app.image,
      mouse        = app.mouse,
      toolActivate = app.toolActivate;

  canvasStyle.cursor = 'move';

  /**
   * Holds the previous tool ID.
   *
   * @private
   * @type String
   */
  var prevTool = app.tool._id;

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
   * Initialize the canvas drag.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousedown = function (ev) {
    x0 = Math.round(ev.x_ * image.zoom);
    y0 = Math.round(ev.y_ * image.zoom);
  };

  /**
   * Perform the canvas drag, while the user moves the mouse.
   *
   * <p>Press <kbd>Escape</kbd> to stop dragging and to get back to the previous 
   * tool.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    if (!mouse.buttonDown) {
      return false;
    }

    var dx = Math.round(ev.x_ * image.zoom) - x0,
        dy = Math.round(ev.y_ * image.zoom) - y0;

    container.scrollTop  -= dy;
    container.scrollLeft -= dx;
  };

  this.deactivate = function (ev) {
    canvasStyle.cursor = '';
  };

  /**
   * Allows the user to press <kbd>Escape</kbd> to stop dragging the canvas, and 
   * to return to the previous tool.
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {Boolean} True if the key was recognized, or false if not.
   */
  this.keydown = function (ev) {
    if (!prevTool || ev.kid_ != 'Escape') {
      return false;
    }

    toolActivate(prevTool, ev);
    return true;
  };

  return true;
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

