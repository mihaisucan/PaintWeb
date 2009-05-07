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
 * $Date: 2009-05-07 18:12:56 +0300 $
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
PaintTools.select = function (app) {
  var _self         = this,
      bufferCanvas  = app.buffer.canvas,
      bufferContext = app.buffer.context,
      bufferStyle   = app.buffer.canvas.style,
      config        = app.config,
      elems         = app.elems,
      historyAdd    = app.historyAdd,
      image         = app.image,
      inputs        = app.inputs,
      layerCanvas   = app.layer.canvas,
      layerContext  = app.layer.context,
      mouse         = app.mouse,
      snapXY        = app.toolSnapXY,
      statusShow    = app.statusShow;

  /**
   * The selection has been dropped, and the mouse button is down. The user has 
   * two choices: he releases the mouse button, thus the selection is dropped 
   * and the tool switches to STATE_NONE, or he moves the mouse in order to 
   * start a new selection (STATE_DRAWING).
   * @constant
   */
  this.STATE_PENDING = -1;

  /**
   * No selection is available.
   * @constant
   */
  this.STATE_NONE = 0;

  /**
   * The user is drawing a selection.
   * @constant
   */
  this.STATE_DRAWING = 1;

  /**
   * The selection rectangle is available.
   * @constant
   */
  this.STATE_SELECTED = 2;

  /**
   * The user is dragging/moving the selection rectangle.
   * @constant
   */
  this.STATE_DRAGGING = 3;

  /**
   * The user is resizing the selection rectangle.
   * @constant
   */
  this.STATE_RESIZING = 4;

  /**
   * Selection state. Known states:
   *
   * <ul>
   *   <li>{@link this.STATE_PENDING} - Selection dropped after the 
   *   <code>mousedown</code> event is fired. The script can switch to 
   *   STATE_DRAWING if the mouse moves, or to STATE_NONE if it does not 
   *   (allowing the user to drop the selection).
   *
   *   <li>{@link this.STATE_NONE} - No selection is available.
   *
   *   <li>{@link this.STATE_DRAWING} - The user is drawing the selection 
   *   rectangle.
   *
   *   <li>{@link this.STATE_SELECTED} - The selection rectangle is available.
   *
   *   <li>{@link this.STATE_DRAGGING} - The user is dragging/moving the current 
   *   selection.
   *
   *   <li>{@link this.STATE_RESIZING} - The user is resizing the current 
   *   selection.
   * </ul>
   *
   * @type Number
   * @default this.STATE_NONE
   */
  this.state = this.STATE_NONE;

  /**
   * Holds the starting point on the <var>x</var> axis of the image, for any 
   * ongoing operation.
   *
   * @private
   * @type Number
   */
  var x0 = 0;

  /**
   * Holds the starting point on the <var>y</var> axis of the image, for the any  
   * ongoing operation.
   *
   * @private
   * @type Number
   */
  var y0 = 0;

  /**
   * Holds selection information and image.
   * @type Object
   */
  this.selection = {
    /**
     * Selection start point, on the <var>x</var> axis.
     * @type Number
     */
    x: 0,

    /**
     * Selection start point, on the <var>y</var> axis.
     * @type Number
     */
    y: 0,

    /**
     * Selection width.
     * @type Number
     */
    width: 0,

    /**
     * Selection height.
     * @type Number
     */
    height: 0,

    /**
     * Selection original width. The user can make a selection rectangle of 
     * a given width and height, but after that he/she can resize the selection.
     * @type Number
     */
    widthOriginal: 0,

    /**
     * Selection original height. The user can make a selection rectangle of 
     * a given width and height, but after that he/she can resize the selection.
     * @type Number
     */
    heightOriginal: 0,

    /**
     * The last <var>bufferContext.lineWidth</var>, used for drawing the 
     * selection rectangle border.
     * @type Number
     */
    lineWidth: 0,

    /**
     * Tells if the selected ImageData has been cut out or not from the 
     * layerContext.
     *
     * @type Boolean
     * @default false
     */
    layerCleared: false,

    /**
     * Tells if the selection background is transparent or not.
     *
     * @type Boolean
     * @default false
     */
    transparent: false,

    /**
     * Tells if the selection transformation mode is active or not. During 
     * transformation mode any drag/resize operation will also cause the 
     * dragging/resizing to be applied to the selected pixels. Otherwise, only 
     * the selection rectangle itself is affected.
     *
     * @type Boolean
     * @default false
     */
    transform: false,

    /**
     * Selection buffer context which holds the selected pixels.
     * @type CanvasRenderingContext2D
     */
    context: null,

    /**
     * Selection buffer canvas which holds the selected pixels.
     * @type HTMLCanvasElement
     */
    canvas: null
  };

  /**
   * The area type under the current mouse location.
   * 
   * <p>During state 2 (selection available) the mouse location can be on 
   * top/inside the selection rectangle, on the border of the selection, or 
   * outside the selection.
   *
   * <p>Possible values: 'in', 'out', 'border'.
   *
   * @private
   * @type String
   * @default 'out'
   */
  var mouseArea = 'out';

  /**
   * The resize type. If the mouse is on top of the selection border, then the 
   * selection can be resized. The direction of the resize operation is 
   * determined by the location of the mouse.
   * 
   * <p>During the states 4 and 6 (resizing selection/ImageData) the property 
   * can hold the following values: 'n' (North), 'ne' (North-East), 'e' (East), 
   * 'se' (South-East), 's' (South), 'sw' (South-West), 'w' (West), 'nw' 
   * (North-West).
   *
   * @private
   * @type String
   * @default null
   */
  var mouseResize = null;

  /**
   * Tells if the shadow effect was enabled before activating the selection 
   * tool.
   *
   * @private
   * @type Boolean
   * @default false
   */
  var shadowActive = false;

  /**
   * Tool initialization logic. This method is run automatically when the tool 
   * object is instanced/constructed.
   *
   * @private
   */
  function init () {
    var sel = _self.selection;

    // Show the selection options.
    elems.selectionOptions.className = '';

    // Older browsers do not support get/putImageData, thus non-transparent 
    // selections cannot be used.
    if (!layerContext.putImageData || !layerContext.getImageData) {
      inputs.selTransparent.checked = true;
    }

    sel.transparent = inputs.selTransparent.checked;
    sel.transform   = inputs.selTransform.checked;

    // Make sure that the selection rectangle is visible enough.
    var strokeStyle = inputs.strokeStyle;
    if (strokeStyle && parseFloat(strokeStyle._value.a) < 0.5) {
      // FIXME: this is not working, at the moment. Needs the ColorEditor 
      // extension.
      strokeStyle._value.a = 1;
      strokeStyle.style.opacity = 1;
      bufferContext[strokeStyle._prop] = 'rgb(' + strokeStyle._value.r + ',' 
          + strokeStyle._value.g + ',' + strokeStyle._value.b + ')';
    }

    // The selection image buffer.
    sel.canvas = app.doc.createElement('canvas');
    if (!sel.canvas) {
      alert(lang.errorToolActivate);
      _self._cancel = true;
      return false;
    }

    sel.canvas.id     = 'selBuffer';
    sel.canvas.width  = image.width;
    sel.canvas.height = image.height;

    elems.container.appendChild(sel.canvas);

    sel.context = sel.canvas.getContext('2d');
    if (!sel.context) {
      alert(lang.errorToolActivate);
      _self._cancel = true;
      return false;
    }

    inputs.selTransparent.addEventListener('change', transparencyChange, false);

    lineWidthUpdate();

    return true;
  };

  /**
   * The tool activation code. This is run after the tool construction and after 
   * the previous tool object is destructed.
   */
  this.activate = function () {
    // Disable the bufferCanvas shadow.
    if (inputs.shadowActive) {
      shadowActive = inputs.shadowActive.checked;
      app.shadowDisable();
      inputs.shadowActive.disabled = true;
    }

    return true;
  };

  /**
   * The tool deactivation code.
   */
  this.deactivate = function () {
    selectionBufferMerge();

    var sel = _self.selection;

    elems.container.removeChild(sel.canvas);
    delete sel.context, sel.canvas;

    inputs.selTransparent.removeEventListener('change', transparencyChange, 
        false);

    // Minimize the selection options.
    elems.selectionOptions.className = 'minimized';

    // Re-enable canvas shadow.
    if (inputs.shadowActive) {
      inputs.shadowActive.disabled = false;
      if (shadowActive) {
        app.shadowEnable();
      }
    }

    return true;
  };

  /**
   * The <code>mousedown</code> event handler. Depending on the mouse location, 
   * this method does initiate different selection operations: drawing, 
   * dropping, dragging or resizing.
   *
   * <p>Hold the <kbd>Control</kbd> key down to temporarily toggle the 
   * transformation mode.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousedown = function (ev) {
    if (_self.state != _self.STATE_NONE &&
        _self.state != _self.STATE_SELECTED) {
      return false;
    }

    // Update the current mouse position, this is used as the start position for most of the operations.
    x0 = ev.x_;
    y0 = ev.y_;

    lineWidthUpdate();

    // No selection is available, then start drawing a selection.
    if (_self.state == _self.STATE_NONE) {
      _self.state = _self.STATE_DRAWING;
      statusShow('selectDraw');

      return true;
    }

    // STATE_SELECTED: selection available.
    mouseAreaUpdate(ev);

    var sel = _self.selection;

    /*
     * Check if the user clicked outside the selection: drop the selection, 
     * switch to STATE_PENDING, clear the image buffer and put the current 
     * selection buffer in the image layer.
     *
     * If the user moves the mouse without taking the finger off the mouse 
     * button, then a new selection rectangle will start to be drawn: the script 
     * will switch to STATE_DRAWING.
     *
     * If the user simply takes the finger off the mouse button (mouseup), then 
     * the script will switch to STATE_NONE (no selection available).
     */
    switch (mouseArea) {
      case 'out':
        _self.state = _self.STATE_PENDING;
        statusShow('selectActive');
        return selectionBufferMerge(); // done

      case 'in':
        // The mouse area: 'in' for drag.
        _self.state = _self.STATE_DRAGGING;
        statusShow('selectDrag');
        break;

      case 'border':
        // 'border' for resize (the user is clicking on the borders).
        _self.state = _self.STATE_RESIZING;
        statusShow('selectResize');
    }

    // Update the boolean from the input.
    sel.transform = inputs.selTransform.checked;

    // Temporarily toggle the transformation mode if the user holds the Control 
    // key down.
    if (ev.ctrlKey) {
      sel.transform = !sel.transform;
    }

    // If there's any ImageData currently in memory, which was "cut" out from 
    // the current layer, then put it back on the layer. This needs to be done 
    // only when the selection.transform mode is not active - that's when the 
    // drag/resize operation only changes the selection, not the pixels 
    // themselves.
    if (sel.layerCleared && !sel.transform) {
      selectionBufferMerge(true);
    }

    // When the user starts dragging/resizing the ImageData we must cut out the 
    // current selection from the image layer.
    if (!sel.layerCleared && sel.transform) {
      selectionBufferInit();
    }

    return true;
  };

  /**
   * The <code>mousemove</code> event handler. When the mouse button is down, 
   * this method performs the dragging/resizing operation. When the mouse button 
   * is not down, this method simply tracks the mouse location for the purpose 
   * of determining the area being pointed at: the selection, the borders, or if 
   * the mouse is outside the selection.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    switch (_self.state) {
      case _self.STATE_PENDING:
        // selection dropped, switch to draw selection
        _self.state = _self.STATE_DRAWING;
        statusShow('selectDraw');

      case _self.STATE_DRAWING:
        return selectionDraw(ev);

      case _self.STATE_SELECTED:
        return mouseAreaUpdate(ev);

      case _self.STATE_DRAGGING:
        return selectionDrag(ev);

      case _self.STATE_RESIZING:
        return selectionResize(ev);

      default: // unknown state
        return false;
    }
  };

  /**
   * The <code>mouseup</code> event handler. This method ends any selection 
   * operation.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mouseup = function (ev) {
    // Allow click+mousemove+click, not only mousedown+move+up
    if (_self.state != _self.STATE_PENDING &&
        ev.x_ == x0 && ev.y_ == y0) {
      return true;
    }

    var result = null,
        sel = _self.selection;

    switch (_self.state) {
      case _self.STATE_PENDING:
        // Selection dropped? If yes, switch to the no selection state.
        _self.state = _self.STATE_NONE;
        statusShow('selectActive');
        return true;

      case _self.STATE_DRAWING:
        result = selectionDraw(ev);
        if (result) {
          result[0] += sel.lineWidth / 2;
          result[1] += sel.lineWidth / 2;
          result[2] -= sel.lineWidth;
          result[2] -= sel.lineWidth;
        }

        break;

      case _self.STATE_DRAGGING:
        result = selectionDrag(ev);
        break;

      case _self.STATE_RESIZING:
        result = selectionResize(ev);
        break;

      default:
        return false;
    }

    if (!result) {
      _self.state = _self.STATE_NONE;
      app.btn_cut(-1);
      app.btn_copy(-1);
      return false;
    }

    sel.x = result[0];
    sel.y = result[1];

    if (result.length == 4) {
      sel.width  = result[2];
      sel.height = result[3];
    }

    _self.state = _self.STATE_SELECTED;

    app.btn_cut(1);
    app.btn_copy(1);
    statusShow('selectAvailable');

    return true;
  };

  /**
   * Perform the selection rectangle drawing operation.
   *
   * @private
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {false|Array} False is returned if the selection is too small, 
   * otherwise an array of four elements is returned. The array holds the 
   * selection information: x, y, width and height.
   */
  function selectionDraw (ev) {
    var x = Math.min(ev.x_,  x0),
        y = Math.min(ev.y_,  y0),
        w = Math.abs(ev.x_ - x0),
        h = Math.abs(ev.y_ - y0);

    // Constrain the shape to a square.
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

    bufferContext.clearRect(0, 0, image.width, image.height);

    if (!w || !h) {
      return false;
    }

    bufferContext.strokeRect(x, y, w, h);

    return [x, y, w, h];
  };

  /**
   * Perform the selection drag operation.
   *
   * @private
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {false|Array} False is returned if the selection is too small, 
   * otherwise an array of two elements is returned. The array holds the 
   * selection coordinates, x and y.
   */
  function selectionDrag (ev) {
    // Snapping on the X/Y axis
    if (ev.shiftKey) {
      snapXY(ev, x0, y0);
    }

    var sel = _self.selection;

    var x = sel.x + ev.x_ - x0,
        y = sel.y + ev.y_ - y0;

    bufferContext.clearRect(0, 0, image.width, image.height);

    // Dragging the ImageData
    if (sel.transform) {
      if (!sel.transparent) {
        bufferContext.fillRect(x, y, sel.width, sel.height);
      }

      // Parameters:
      // source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
      bufferContext.drawImage(sel.canvas, 0, 0, sel.widthOriginal, 
          sel.heightOriginal, x, y, sel.width, sel.height);
    }

    bufferContext.strokeRect(x - sel.lineWidth / 2, y - sel.lineWidth / 2, 
        sel.width + sel.lineWidth, sel.height + sel.lineWidth);

    return [x, y];
  };

  /**
   * Perform the selection resize operation.
   *
   * @private
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {false|Array} False is returned if the selection is too small, 
   * otherwise an array of four elements is returned. The array holds the 
   * selection information: x, y, width and height.
   */
  function selectionResize (ev) {
    var sel = _self.selection;

    var diffx = ev.x_ - x0,
        diffy = ev.y_ - y0,
        x     = sel.x,
        y     = sel.y,
        w     = sel.width,
        h     = sel.height;

    switch (mouseResize) {
      case 'nw':
        x += diffx;
        y += diffy;
        w -= diffx;
        h -= diffy;
        break;
      case 'n':
        y += diffy;
        h -= diffy;
        break;
      case 'ne':
        y += diffy;
        w += diffx;
        h -= diffy;
        break;
      case 'e':
        w += diffx;
        break;
      case 'se':
        w += diffx;
        h += diffy;
        break;
      case 's':
        h += diffy;
        break;
      case 'sw':
        x += diffx;
        w -= diffx;
        h += diffy;
        break;
      case 'w':
        x += diffx;
        w -= diffx;
        break;
      default:
        return false;
    }

    if (!w || !h) {
      return false;
    }

    // Constrain the rectangle to have the same aspect ratio as the initial rectangle.
    if (ev.shiftKey) {
      var p = sel.width / sel.height,
          w2 = w, h2 = h;

      switch (mouseResize.charAt(0)) {
        case 'n':
        case 's':
          w2 = Math.round(h*p);
          break;
        default:
          h2 = Math.round(w/p);
      }

      switch (mouseResize) {
        case 'nw':
        case 'sw':
          x -= w2 - w;
          y -= h2 - h;
      }

      w = w2;
      h = h2;
    }

    if (w < 0) {
      x += w;
      w *= -1;
    }
    if (h < 0) {
      y += h;
      h *= -1;
    }

    bufferContext.clearRect(0, 0, image.width, image.height);

    // Resizing the ImageData
    if (sel.transform) {
      if (!sel.transparent) {
        bufferContext.fillRect(x, y, w, h);
      }

      // Parameters:
      // source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
      bufferContext.drawImage(sel.canvas, 0, 0, sel.widthOriginal, 
          sel.heightOriginal, x, y, w, h);
    }

    bufferContext.strokeRect(x - sel.lineWidth / 2, y - sel.lineWidth / 2, 
        w + sel.lineWidth, h + sel.lineWidth);

    return [x, y, w, h];
  };

  /**
   * Determine the are where the mouse is located: if it is inside or outside of 
   * the selection rectangle, or on the selection border.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function mouseAreaUpdate (ev) {
    var cursor = '',
        sel    = _self.selection;

    var x1     = sel.x  + sel.width,
        y1     = sel.y  + sel.height;

    var x0_out = sel.x  - sel.lineWidth,
        y0_out = sel.y  - sel.lineWidth,
        x1_out =     x1 + sel.lineWidth,
        y1_out =     y1 + sel.lineWidth;

    mouseArea = 'out';

    // Inside the rectangle
    if (ev.x_ <     x1 && ev.y_ <     y1 &&
        ev.x_ > sel.x  && ev.y_ > sel.y) {
      cursor = 'move';
      mouseArea = 'in';

    } else {
      // On one of the borders (north/south)
      if (ev.x_ >= x0_out && ev.x_ <= x1_out &&
          ev.y_ >= y0_out && ev.y_ <= sel.y) {
        cursor = 'n';

      } else if (ev.x_ >= x0_out && ev.x_ <= x1_out &&
                 ev.y_ >= y1     && ev.y_ <= y1_out) {
        cursor = 's';
      }

      // West/east
      if (ev.y_ >= y0_out && ev.y_ <= y1_out &&
          ev.x_ >= x0_out && ev.x_ <= sel.x) {
        cursor += 'w';

      } else if (ev.y_ >= y0_out && ev.y_ <= y1_out &&
                 ev.x_ >= x1     && ev.x_ <= x1_out) {
        cursor += 'e';
      }

      if (cursor != '') {
        mouseResize = cursor;
        cursor += '-resize';
        mouseArea = 'border';
      }
    }

    // Due to bug 126457 Opera will not automatically update the cursor, 
    // therefore they will not see any visual feedback.
    if (cursor != bufferStyle.cursor) {
      bufferStyle.cursor = cursor;
    }
  };

  /**
   * Update <var>selection.lineWidth</var>.
   *
   * @private
   */
  function lineWidthUpdate () {
    var sel = _self.selection;
    if (sel.lineWidth == bufferContext.lineWidth) {
      return;
    }

    sel.lineWidth = bufferContext.lineWidth;

    // When lineWidth is an odd number ... tiny pixel errors show
    if ((sel.lineWidth % 2) != 0) {
      sel.lineWidth++;
      bufferContext.lineWidth = sel.lineWidth;
      inputs.lineWidth.value = sel.lineWidth;
    }
  };

  /**
   * The <code>change</code> event handler for the selection transparency 
   * check-box input element.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function transparencyChange (ev) {
    var sel = _self.selection;

    sel.transparent = this.checked;

    // Continue only if the selection rectangle is available.
    if (!sel.transform || _self.state != _self.STATE_SELECTED) {
      return false;
    }

    if (!sel.layerCleared) {
      selectionBufferInit();
    }

    bufferContext.clearRect(0, 0, image.width, image.height);

    if (!sel.transparent) {
      bufferContext.fillRect(sel.x, sel.y, sel.width, sel.height);
    }

    // Draw the updated selection
    bufferContext.drawImage(sel.canvas, 0, 0,
        sel.widthOriginal, sel.heightOriginal,
        sel.x, sel.y, sel.width, sel.height);

    bufferContext.strokeRect(sel.x - sel.lineWidth / 2, sel.y - sel.lineWidth / 2,
        sel.width + sel.lineWidth, sel.height + sel.lineWidth);

    return true;
  };

  /**
   * Initialize the selection buffer, when the user starts dragging or resizing 
   * the selected pixels.
   *
   * @private
   */
  function selectionBufferInit () {
    var sel = _self.selection;

    var x = sel.x,
        y = sel.y,
        w = sel.width,
        h = sel.height,
        sumX = sel.x + sel.width,
        sumY = sel.y + sel.height,
        dx = 0, dy = 0;

    sel.widthOriginal  = w;
    sel.heightOriginal = h;

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
      w = image.width - sel.x;
    }
    if (sumY > image.height) {
      h = image.height - sel.y;
    }

    if (!sel.transparent) {
      bufferContext.fillRect(x, y, w, h);
    }

    // Copy the currently selected ImageData into the buffer canvas
    bufferContext.drawImage(layerCanvas, x, y, w, h, x, y, w, h);

    sel.context.clearRect(0, 0, image.width, image.height);

    // Also put the selected ImageData into the selection buffer.
    // Parameters: source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
    sel.context.drawImage(layerCanvas, x, y, w, h, dx, dy, w, h);

    // Clear the selected pixels from the image
    layerContext.clearRect(x, y, w, h);
    sel.layerCleared = true;

    historyAdd();
  };

  /**
   * Merge the ImageData from the selection buffer, when the user stops dragging 
   * or resizing the selection.
   *
   * @private
   * @param {Boolean} [onlyMerge=false] Only merge the selection buffer onto the 
   * image layer. Do not clear the image buffer.
   */
  function selectionBufferMerge (onlyMerge) {
    var sel = _self.selection;

    if (!onlyMerge) {
      bufferContext.clearRect(0, 0, image.width, image.height);
      bufferStyle.cursor = '';
      app.btn_cut(-1);
      app.btn_copy(-1);
    }

    if (sel.layerCleared) {
      if (!sel.transparent) {
        layerContext.fillRect(sel.x, sel.y, sel.width, sel.height);
      }

      layerContext.drawImage(sel.canvas, 0, 0, sel.widthOriginal, 
          sel.heightOriginal, sel.x, sel.y, sel.width, sel.height);

      historyAdd();
      sel.layerCleared = false;
    }
  };

  /**
   * Cut the selected pixels. The associated ImageData is stored in 
   * <var>app.clipboard</var.
   */
  this.selectionCut = function () {
    if (!_self.selectionCopy()) {
      return false;
    }

    var sel = _self.selection;

    bufferContext.clearRect(0, 0, image.width, image.height);
    sel.context.clearRect(0, 0, image.width, image.height);

    if (!sel.layerCleared) {
      layerContext.clearRect(sel.x, sel.y, sel.width, sel.height);
      historyAdd();
    }

    sel.layerCleared = false;
    _self.state = _self.STATE_NONE;
    bufferStyle.cursor = '';

    app.btn_cut(-1);
    app.btn_copy(-1);
    statusShow('selectActive');

    return true;
  };

  /**
   * Copy the selected pixels. The associated ImageData is stored in 
   * <var>app.clipboard</var.
   */
  this.selectionCopy = function () {
    if (_self.state != _self.STATE_SELECTED) {
      return false;
    }

    if (!layerContext.getImageData || !layerContext.putImageData) {
      alert(lang.errorClipboardUnsupported);
      return false;
    }

    var sel = _self.selection;

    if (!sel.layerCleared) {
      var w    = sel.width,
          h    = sel.height,
          sumX = sel.width  + sel.x;
          sumY = sel.height + sel.y;

      if (sumX > image.width) {
        w = image.width - sel.x;
      }
      if (sumY > image.height) {
        h = image.height - sel.y;
      }

      app.clipboard = layerContext.getImageData(sel.x, sel.y, w, h);

      return app.btn_paste(1);
    }

    app.clipboard = sel.context.getImageData(0, 0, sel.widthOriginal, 
        sel.heightOriginal);

    return app.btn_paste(1);
  };

  /**
   * Paste an image from the "clipboard". The <var>app.clipboard</var object 
   * must be an ImageData. This method will generate a new selection which will 
   * hold the image pasted.
   */
  this.selectionPaste = function () {
    if (_self.state != _self.STATE_NONE &&
        _self.state != _self.STATE_SELECTED) {
      return false;
    }

    if (!layerContext.getImageData || !layerContext.putImageData) {
      alert(lang.errorClipboardUnsupported);
      return false;
    }

    // The default position for the pasted image is the top left corner of the 
    // visible area, taking into consideration the zoom level.
    var x   = Math.round(elems.container.scrollLeft / image.zoom),
        y   = Math.round(elems.container.scrollTop  / image.zoom),
        w   = app.clipboard.width,
        h   = app.clipboard.height,
        sel = _self.selection;

    x += sel.lineWidth;
    y += sel.lineWidth;

    if (_self.state == _self.STATE_SELECTED) {
      bufferContext.clearRect(0, 0, image.width, image.height);
      bufferStyle.cursor = '';
    }

    if (!sel.transparent) {
      bufferContext.fillRect(x, y, w, h);
    }

    bufferContext.putImageData(app.clipboard, x, y);

    bufferContext.strokeRect(x - sel.lineWidth / 2, y - sel.lineWidth / 2,
        w + sel.lineWidth, h + sel.lineWidth);

    sel.context.clearRect(0, 0, image.width, image.height);
    sel.context.putImageData(app.clipboard, 0, 0);

    sel.widthOriginal  = sel.width = w;
    sel.heightOriginal = sel.height = h;
    sel.x = x;
    sel.y = y;
    sel.transform = inputs.selTransform.checked = true;
    sel.layerCleared = true;
    _self.state = _self.STATE_SELECTED;

    app.btn_cut(1);
    app.btn_copy(1);
    statusShow('selectAvailable');

    return true;
  };

  /**
   * The <code>keydown</code> event handler. This method implements support for 
   * the following keys:
   *
   * <ul>
   *   <li><kbd>Control X</kbd> - Cut the selected pixels.
   *
   *   <li><kbd>Control C</kbd> - Copy the selected pixels to the PaintWeb 
   *   application clipboard. The ImageData is stored in 
   *   <var>app.clipboard</var>.
   *
   *   <li><kbd>Enter</kbd> - Toggle the transformation mode. When 
   *   transformation mode is enabled, any selection changes also affects the 
   *   selected pixels.
   *
   *   <li><kbd>Delete</kbd> - Delete the selected pixels.
   *
   *   <li><kbd>Escape</kbd> - Drop the selection / deselect.
   *
   *   <li><kbd>Alt Backspace</kbd> - Fill the selection with the current 
   *   <var>fillStyle</var>. This is only allowed when transformation mode is 
   *   disabled.
   * </ul>
   *
   * @param {Event} ev The DOM Event object.
   */
  this.keydown = function (ev) {
    var sel = _self.selection;

    switch (ev.kid_) {
      case 'Control X':
        return _self.selectionCut();

      case 'Control C':
        return _self.selectionCopy();

      case 'Enter':
        // Toggle the transformation mode.
        sel.transform = inputs.selTransform.checked = !sel.transform;
        break;

      case 'Delete':
        // Delete the pixels from the image if they are not deleted already.
        if (sel.layerCleared || _self.state != _self.STATE_SELECTED) {
          return false;
        }

        layerContext.clearRect(sel.x, sel.y, sel.width, sel.height);
        historyAdd();
        console.log('Delete');

      case 'Escape':
        // Drop the selection.
        if (_self.state != _self.STATE_SELECTED) {
          return false;
        }

        sel.layerCleared = false;
        sel.context.clearRect(0, 0, image.width, image.height);

        bufferContext.clearRect(0, 0, image.width, image.height);
        bufferStyle.cursor = '';

        app.btn_cut(-1);
        app.btn_copy(-1);
        statusShow('selectActive');
        _self.state = _self.STATE_NONE;

        break;

      case 'Alt Backspace':
        // Fill the selection with fillStyle.
        if (sel.transform) {
          return false;
        }

        layerContext.fillStyle = bufferContext.fillStyle;
        layerContext.fillRect(sel.x, sel.y, sel.width, sel.height);
        historyAdd();

        break;

      default:
        return false;
    }

    return true;
  };

  // TODO: check this...
  return init();
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

