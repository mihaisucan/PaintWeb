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
 * $Date: 2009-04-28 22:51:12 +0300 $
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

var _me = window.PaintWebInstance;

/**
 * @class The rectangle tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintTools.rect = function (app) {
  var context     = app.buffer.context,
      layerUpdate = app.layerUpdate,
      mouse       = app.mouse,
      image       = app.image,
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

    statusShow('rect-mousedown');

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

    // FIXME: ...
    if (_me.shapeType != 'stroke') {
      context.fillRect(x, y, w, h);
    }

    if (_me.shapeType != 'fill') {
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
    statusShow('rect-active');

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
    statusShow('rect-active');

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
      layerUpdate = app.layerUpdate,
      mouse       = app.mouse,
      image       = app.image,
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

    statusShow('line-mousedown');

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

    // FIXME: Snapping on the X/Y axis.
    if (ev.shiftKey) {
      _me.tool_snapXY(ev, x0, y0);
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

    statusShow('line-active');
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
    statusShow('line-active');

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
    if (mouse.buttonDown) {
      return false;
    }

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

    // TODO: check this...
    //context.clearRect(0, 0, image.width, image.height);
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
    if (!mouse.buttonDown) {
      return false;
    }

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
PaintTools.poly = function (app) {
  var _self       = this,
      context     = app.buffer.context,
      mouse       = app.mouse,
      image       = app.image,
      layerUpdate = app.layerUpdate,
      statusShow  = app.statusShow;

  // FIXME: this tool needs fixes

  /**
   * Holds the points in the polygon being drawn.
   *
   * @private
   * @type Array
   */
  this.points = [];

  this.deactivate = function () {
    _self.points = [];

    return true;
  };

  this.click = function (ev) {
    if (mouse.buttonDown) {
      // FIXME: Snapping on the X/Y axis.
      if (ev.shiftKey) {
        _me.tool_snapXY(ev, _self.x1, _self.y1);
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

        statusShow('poly-active');
        layerUpdate();

        return true;
      }
    }

    // Remember the last pointer position.
    _self.x1 = ev.x_;
    _self.y1 = ev.y_;

    if (!mouse.buttonDown) {
      // Remember the first pointer position.
      _self.x0 = ev.x_;
      _self.y0 = ev.y_;

      statusShow('poly-mousedown');
    }

    _self.points.push([ev.x_, ev.y_]);

    // Users need to know how to end drawing the polygon.
    if (_self.points.length > 3) {
      statusShow('poly-end');
    }

    _self.mousemove();

    return true;
  };

  this.mousemove = function (ev) {
    var p, i,
        n         = _self.points.length,
        fillStyle = context.fillStyle;

    if (!mouse.buttonDown || !n || (n == 1 && !ev)) {
      return false;
    }

    // Store the last ev.x_ and ev.y_, for later use.
    if (ev) {
      _self.ex = ev.x_;
      _self.ey = ev.y_;
    }

    // Snapping on the X/Y axis for the current point (if available).
    if (ev && ev.shiftKey) {
      _me.tool_snapXY(ev, _self.x1, _self.y1);
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

    if (_me.shapeType != 'stroke') {
      context.fill();
    }

    if (_me.shapeType != 'fill' || n == 1) {
      // In the case where we only have a straight line, draw a stroke even if no stroke should be drawn, such that the user has better visual feedback.

      if (n == 1 && ev && _me.shapeType == 'fill') {
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

  // Escape cancels the current polygon.
  // Return completes drawing the current polygon.
  this.keydown = function (ev) {
    if (!mouse.buttonDown || (ev.kid_ != 'Escape' && ev.kid_ != 'Enter')) {
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

    statusShow('poly-active');

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
      context     = app.buffer.context,
      mouse       = app.mouse,
      image       = app.image,
      layerUpdate = app.layerUpdate,
      statusShow  = app.statusShow;

  _self.points = [];

  this.deactivate = function () {
    context.clearRect(0, 0, image.width, image.height);
    _self.points = [];
    delete _self.mousemove;

    return true;
  };

  this.mousedown = function (ev) {
    _self.mousemove = _self.draw;

    return _self.draw(ev);
  };

  this.mouseup = function (ev) {
    if (!mouse.buttonDown) {
      return false;
    }

    if (_self.points.length == 0) {
      statusShow('curve-snapping');
    }

    if (_self.points.length == 1) {
      // FIXME: Snapping on the X/Y axis for the current point.
      if (ev.shiftKey) {
        _me.tool_snapXY(ev, _self.points[0][0], _self.points[0][1]);
      }

      statusShow('curve-active');
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
        _me.tool_snapXY(ev, p[0][0], p[0][1]);
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

    // FIXME
    if (_me.shapeType != 'stroke') {
      context.fill();
    }
    if (_me.shapeType != 'fill') {
      context.stroke();
    }

    context.closePath();

    return true;
  };

  // Escape cancels drawing the current curve.
  this.keydown = function (ev) {
    if (!mouse.buttonDown || ev.kid_ != 'Escape') {
      return false;
    }

    _self.deactivate(ev);
    statusShow('curve-active');

    return true;
  };

  // TODO: check this...
  return true;
};

/**
 * @class The Bézier curve tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintTools.ellipse = function (app) {
  var _self       = this,
      context     = app.buffer.context,
      mouse       = app.mouse,
      image       = app.image,
      layerUpdate = app.layerUpdate,
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

  this.mousedown = function (ev) {
    // The mouse start position
    x0 = ev.x_;
    y0 = ev.y_;

    statusShow('ellipse-mousedown');

    return true;
  };

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

    // FIXME
    if (_me.shapeType != 'stroke') {
      context.fill();
    }
    if (_me.shapeType != 'fill') {
      context.stroke();
    }

    context.closePath();

    return true;
  };

  this.mouseup = function (ev) {
    if (!mouse.buttonDown) {
      return false;
    }

    // FIXME: Allow click+mousemove, not only mousedown+move+up
    /*if (ev.x_ == x0 && ev.y_ == y0) {
      return true;
    }*/

    statusShow('ellipse-active');

    return layerUpdate();
  };

  // Escape cancels drawing the current ellipse.
  this.keydown = function (ev) {
    if (!mouse.buttonDown || ev.kid_ != 'Escape') {
      return false;
    }

    context.clearRect(0, 0, image.width, image.height);

    statusShow('ellipse-active');

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
  var _self = this;

  if (!_me.tools || !_me.tools.pencil) {
    alert( _me.getMsg('error-tool-activate') );
    _tool._cancel = true;
    return false;
  }

  // The eraser actually uses the pencil tool with some changes.
  _tool.pencil = new _me.tools.pencil();
  _tool.strokeStyle = context.strokeStyle;

  // Activation code. This is run after the tool construction and after the deactivation of the previous tool.
  _tool.activate = function () {
    // Disable the canvas shadow.
    if (_me.inputs.shadowActive) {
      _tool.shadowActive = _me.inputs.shadowActive.checked;
      _me.shadowDisable();
      _me.inputs.shadowActive.disabled = true;
    }

    return true;
  };

  this.deactivate = function (ev) {
    _tool.pencil.deactivate(ev);

    if (_tool.strokeStyle) {
      context.strokeStyle = _tool.strokeStyle;
    }

    // Enable canvas shadow.
    if (_me.inputs.shadowActive) {
      _me.inputs.shadowActive.disabled = false;
      if (_tool.shadowActive) {
        _me.shadowEnable();
      }
    }

    return true;
  };

  // The mousedown event remembers the current strokeStyle and sets a white colored stroke (same as the background), such that the user gets live feedback of what he/she erases.
  this.mousedown = function (ev) {
    _tool.strokeStyle = context.strokeStyle;
    context.strokeStyle = 'rgb(255,255,255)';

    _tool.pencil.mousedown(ev);

    if (_tool.pencil.mousemove) {
      _tool.mousemove = _tool.pencil.mousemove;
    }
    if (_tool.pencil.mouseup) {
      _tool.mouseup = _tool._mouseup;
    }

    return true;
  };

  // The mouseup event function changes the globalCompositeOperation to destination-out such that the white pencil path drawn by the user cuts out/clears the destination image
  this.mouseup = function (ev) {
    if (_tool.pencil.mouseup) {
      var op = _me.img.globalCompositeOperation;
      _me.img.globalCompositeOperation = 'destination-out';
      _tool.pencil.mouseup(ev);
      _me.img.globalCompositeOperation = op;
    }

    context.strokeStyle = _tool.strokeStyle;
    delete _tool.mousemove, _tool.mouseup;

    return true;
  };

  return true;
};

PaintTools.select = function (app) {
  var _self = this;

  /* Steps:
   * -1 - selection dropped after mousedown. The script can switch to step 1 (drawing) if the mouse moves, or to step 0 if it does not (allowing to completely drop the selection).
   * 0 - no selection
   * 1 - drawing selection rectangle
   * 2 - selection rectangle available
   * 3 - dragging selection
   * 4 - resizing selection
   * 5 - dragging ImageData
   * 6 - resizing ImageData
   */
  _tool.step = 0;

  // The following properties are initialised more for the purpose of explaining them

  // The start position for any operation
  _tool.x0 = false;
  _tool.y0 = false;

  // The selection start position and the end position, including and excluding borders
  _tool.sx0b = _tool.sx0 = false;
  _tool.sy0b = _tool.sy0 = false;
  _tool.sx1b = _tool.sx1 = false;
  _tool.sy1b = _tool.sy1 = false;

  // The inner selection width/height (sw1/sh1).
  // The normal selection width/height (sw2/sh2) are the values used by strokeRect(). They include the lineWidth.
  _tool.sw1 =_tool.sh1 = _tool.sw2 =_tool.sh2 = false;

  // During step 2 (selection available) the mouse position can be: inside, outside, or on the border/resizer of the selection rectangle.
  _tool.mpos = false; // 'in' || 'out' || 'r'

  // During steps 4 and 6 (resizing selection/ImageData) the resizer can be: n, ne, e, s, sw, w, nw.
  _tool.resizer = false;

  // The last context.lineWidth, and ceil(lineWidth/2)
  _tool.lineWidth = _tool.lineWidth2 = false;

  // Remember if the selected ImageData from _me.img has been cut out or not.
  _tool.cleared = false;

  // Check the availability of important properties and elements.
  if (!context || !canvas || !canvas.style || !_me.inputs || !_me.inputs.selTransparent || !_me.inputs.selTransform || !_me.doc || !_me.img || !_me.img.canvas || !_me.container || !_me.inputs.strokeStyle || !_me.inputs.strokeStyle._value || !_me.elems.selectionOptions) {
    alert( _me.getMsg('error-tool-activate') );
    _tool._cancel = true;
    return false;
  }

  // Show the selection options.
  _me.elems.selectionOptions.className = '';

  _tool.canvasStyle = canvas.style;

  if (!_me.img.putImageData || !_me.img.getImageData) {
    _me.inputs.selTransparent.checked = true;
  }
  _tool.transparency = _me.inputs.selTransparent.checked;
  _tool.transform = _me.inputs.selTransform.checked;

  // Make sure that the selection rectangle is visible enough
  var strokeStyle = _me.inputs.strokeStyle;
  if (parseFloat(strokeStyle._value.a) < 0.5) {
    strokeStyle._value.a = 1;
    strokeStyle.style.opacity = 1;
    context[strokeStyle._prop] = 'rgb(' + strokeStyle._value.r + ',' + strokeStyle._value.g + ',' + strokeStyle._value.b + ')';
  }
  delete strokeStyle;

  // The selection buffer
  _tool.selbuffer = _me.doc.createElement('canvas');
  if (!_tool.selbuffer) {
    alert( _me.getMsg('error-tool-activate') );
    _tool._cancel = true;
    return false;
  }
  _tool.selbuffer.id = 'selBuffer';
  _tool.selbuffer.width = image.width;
  _tool.selbuffer.height = image.height;

  _me.container.appendChild(_tool.selbuffer);

  _tool.selbuffer = _tool.selbuffer.getContext('2d');
  if (!_tool.selbuffer) {
    alert( _me.getMsg('error-tool-activate') );
    _tool._cancel = true;
    return false;
  }

  // Activation code. This is run after the tool construction and after the deactivation of the previous tool.
  _tool.activate = function () {
    // Disable the canvas shadow.
    if (_me.inputs.shadowActive) {
      _tool.shadowActive = _me.inputs.shadowActive.checked;
      _me.shadowDisable();
      _me.inputs.shadowActive.disabled = true;
    }

    return true;
  };

  this.deactivate = function (ev) {
    _tool.selbuffer_merge(ev);

    _me.container.removeChild(_tool.selbuffer.canvas);
    delete _tool.selbuffer;

    _me.inputs.selTransparent.removeEventListener('change', _tool.update_transparency, false);

    // Minimize the selection options.
    _me.elems.selectionOptions.className = 'minimized';

    // Enable canvas shadow.
    if (_me.inputs.shadowActive) {
      _me.inputs.shadowActive.disabled = false;
      if (_tool.shadowActive) {
        _me.shadowEnable();
      }
    }

    return true;
  };

  this.mousedown = function (ev) {
    // While drawing/dragging/resizing the selection/ImageData, mousedown has no effect.
    // This is needed for allowing operations via click+mousemove+click, instead of just mousedown+mousemove+mouseup
    if (_tool.step != 0 && _tool.step != 2) {
      return false;
    }

    // Update the current mouse position, this is used as the start position for most of the operations.
    _tool.x0 = ev.x_;
    _tool.y0 = ev.y_;

    // No selection is available, then start drawing a selection (step 1)
    if (_tool.step == 0) {
      _tool.update_lineWidth(ev);
      _tool.step = 1;
      statusShow('select-draw');

      return true;
    }


    // Step 2: selection available.

    _tool.update_mpos(ev);
    _tool.update_lineWidth(ev);

    // The user clicked outside the selection: drop the selection, go back to step -1, clear img_temp and put the current _tool.selbuffer on the final image.
    // If the user moves the mouse without taking the finger off the mouse button, then a new selection rectangle will start to be drawn: the script will switch to step 1 - drawing selection.
    // If the user simply takes the finger off the mouse button (mouseup), then the script will only switch to step 0 (no selection available).
    if (_tool.mpos == 'out') {
      _tool.step = -1;
      statusShow('select-active');
      return _tool.selbuffer_merge(ev);
    }

    // Depending on the selection mode the script will manipulate the ImageData or just the selection rectangle, when dragging/resizing.
    _tool.transform = _me.inputs.selTransform.checked;

    // The mouse position: 'in' for drag.
    if (_tool.mpos == 'in') {
      if (!_tool.transform) {
        _tool.step = 3; // dragging selection
      } else {
        _tool.step = 5; // dragging ImageData
      }
      statusShow('select-drag');

    } else if (_tool.mpos == 'r') {
      // 'r' for resize (the user clicked on the borders)

      if (!_tool.transform) {
        _tool.step = 4; // resizing selection
      } else {
        _tool.step = 6; // resizing ImageData
      }
      statusShow('select-resize');
    }

    // If there's any ImageData currently in memory, which was "cut" out from _me.img, then put the current ImageData on the final image (_me.img), when dragging/resizing the selection
    if (_tool.cleared && (_tool.step == 3 || _tool.step == 4)) {
      _tool.selbuffer_merge(ev);
    }

    // When the user drags/resizes the ImageData: cut out the current selection from _me.img
    if (!_tool.cleared && (_tool.step == 5 || _tool.step == 6)) {
      _tool.selbuffer_init(ev);
    }

    _tool.sx0 -= _tool.lineWidth2;
    _tool.sy0 -= _tool.lineWidth2;

    // Dragging selection (3) or ImageData (5)
    if (_tool.step == 3 || _tool.step == 5) {
      _tool.sx0 -= _tool.x0;
      _tool.sy0 -= _tool.y0;
    }

    return true;
  };

  this.mousemove = function (ev) {
    // Selection dropped, then mouse moves? If yes, switch to drawing a selection (1)
    if (_tool.step == -1) {
      _tool.step = 1;
      statusShow('select-draw');
    }

    // Selection available
    if (_tool.step == 2) {
      return _tool.update_mpos(ev);
    } else if (_tool.step < 1 || _tool.step > 6) {
      return false; // Unknown step
    }

    context.clearRect(0, 0, image.width, image.height);

    // Drawing selection rectangle
    if (_tool.step == 1) {
      var x = Math.min(ev.x_,  _tool.x0),
        y = Math.min(ev.y_,  _tool.y0),
        w = Math.abs(ev.x_ - _tool.x0),
        h = Math.abs(ev.y_ - _tool.y0);

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

    } else if (_tool.step == 3 || _tool.step == 5) {
      // Dragging selection (3) or ImageData (5)

      // Snapping on the X/Y axis
      if (ev.shiftKey) {
        _me.tool_snapXY(ev, _tool.x0, _tool.y0);
      }

      var x = _tool.sx0 + ev.x_,
        y = _tool.sy0 + ev.y_,
        w = _tool.sw2,
        h = _tool.sh2;

      if (_tool.step == 5) {
        var dw = _tool.sw1,
          dh = _tool.sh1;
      }

    } else if (_tool.step == 4 || _tool.step == 6) {
      // Resizing selection (4) or ImageData (6)

      var param = _tool.calc_resize(ev);

      // The rectangle is too small
      if (!param) {
        return false;
      }

      var x = param[0],
        y = param[1],
        w = param[2],
        h = param[3];

      if (_tool.step == 6) {
        var dw = w - _tool.lineWidth,
          dh = h - _tool.lineWidth;
      }
    }

    if (!w || !h) {
      return false;
    }

    // Dragging (5) or resizing (6) ImageData
    if (dw && dh && (_tool.step == 5 || _tool.step == 6)) {
      var sb = _tool.selbuffer;

      // Parameters:
      // source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
      context.drawImage(sb.canvas, 0, 0, sb._sw, sb._sh,
        x + _tool.lineWidth2, y + _tool.lineWidth2,
        dw, dh);
    }

    context.strokeRect(x, y, w, h);

    return true;
  };

  this.mouseup = function (ev) {
    // Selection dropped? If yes, switch to no selection.
    if (_tool.step == -1) {
      _tool.step = 0;
      statusShow('select-active');
      return true;
    }

    // Allow click+mousemove+click, not only mousedown+move+up
    if (ev.x_ == _tool.x0 && ev.y_ == _tool.y0) {
      return true;
    }

    // Skip any unknown step
    if (_tool.step < 1 || _tool.step > 6 || _tool.step == 2) {
      return false;

    } else if (_tool.step == 4 || _tool.step == 6) {
      // Resizing selection (4) or ImageData (6)  

      var newVal = _tool.calc_resize(ev);
      if (!newVal) {
        _tool.step = 0;
        _me.btn_cut(-1);
        _me.btn_copy(-1);
        return false;
      }

      _tool.sx0 = newVal[0];
      _tool.sy0 = newVal[1];
      _tool.sw2 = newVal[2];
      _tool.sh2 = newVal[3];
    }

    // Update all the selection info
    _tool.calc_selinfo(ev);

    // Back to step 2: selection available
    _tool.step = 2;
    _me.btn_cut(1);
    _me.btn_copy(1);
    statusShow('select-available');

    return true;
  };

  // Determine the mouse position: if it's inside/outside the selection rectangle, or on the border
  _tool.update_mpos = function (ev) {
    var ncur = '';

    _tool.mpos = 'out';

    // Inside the rectangle
    if (ev.x_ < _tool.sx1 && ev.y_ < _tool.sy1 && ev.x_ > _tool.sx0 && ev.y_ > _tool.sy0) {
      ncur = 'move';
      _tool.mpos = 'in';
    } else {
      // On one of the borders (north/south)
      if (ev.x_ >= _tool.sx0b && ev.x_ <= _tool.sx1b && ev.y_ >= _tool.sy0b && ev.y_ <= _tool.sy0) {
        ncur = 'n';
      } else if (ev.x_ >= _tool.sx0b && ev.x_ <= _tool.sx1b && ev.y_ >= _tool.sy1 && ev.y_ <= _tool.sy1b) {
        ncur = 's';
      }

      // West/east
      if (ev.y_ >= _tool.sy0b && ev.y_ <= _tool.sy1b && ev.x_ >= _tool.sx0b && ev.x_ <= _tool.sx0) {
        ncur += 'w';
      } else if (ev.y_ >= _tool.sy0b && ev.y_ <= _tool.sy1b && ev.x_ >= _tool.sx1 && ev.x_ <= _tool.sx1b) {
        ncur += 'e';
      }

      if (ncur != '') {
        _tool.resizer = ncur;
        ncur += '-resize';
        _tool.mpos = 'r';
      }
    }

    // Due to bug 126457 Opera will not automatically update the cursor, therefore Opera users will not see any visual feedback.
    if (ncur != _tool.canvasStyle.cursor) {
      _tool.canvasStyle.cursor = ncur;
    }

    return true;
  };

  // Used to update _tool.lineWidth, handling all the cases
  _tool.update_lineWidth = function (ev) {
    if (_tool.lineWidth == context.lineWidth) {
      return false;
    }

    _tool.lineWidth = context.lineWidth;
    // When lineWidth is an odd number ... tiny pixel errors show
    if ((_tool.lineWidth % 2) != 0) {
      _tool.lineWidth++;
      context.lineWidth = _tool.lineWidth;
      _me.inputs.lineWidth.value = _tool.lineWidth;
    }
    _tool.lineWidth2 = _tool.lineWidth/2;

    // Selection available (2)
    if (_tool.step < 2) {
      return true;
    }

    // Continue with updating the selection info

    _tool.sx0 -= _tool.lineWidth2;
    _tool.sy0 -= _tool.lineWidth2;
    _tool.sw2 = _tool.sw1 + _tool.lineWidth;
    _tool.sh2 = _tool.sh1 + _tool.lineWidth;

    return _tool.calc_selinfo(ev);
  };

  // This method handles enabling/disabling selection transparency
  _tool.update_transparency = function (ev) {
    _tool.transform = _me.inputs.selTransform.checked;

    // Selection available (step 2)
    if (!_tool.transform || _tool.step != 2 || this.checked == _tool.transparency) {
      return false;
    }

    if (!_me.img.getImageData || !_me.img.putImageData) {
      _tool.transparency = this.checked = true;
      return false;
    }

    _tool.transparency = this.checked;

    var sb = _tool.selbuffer;

    if (!_tool.cleared) {
      _tool.selbuffer_init(ev);

      // Parameters:
      // source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
      context.drawImage(sb.canvas, 0, 0, sb._sw, sb._sh,
        _tool.sx0 + _tool.lineWidth2, _tool.sy0 + _tool.lineWidth2,
        _tool.sw1, _tool.sh1);
    }

    context.clearRect(0, 0, image.width, image.height);

    if (_tool.transparency) {
      // If we have the original ImageData, then put it into the selection buffer
      if (sb._imgd) {
        sb.putImageData(sb._imgd, 0, 0);
      }

      sb._imgd = false;
    } else {
      // Draw the selection background and put the ImageData on top.
      context.fillRect(0, 0, sb._sw, sb._sh);
      context.drawImage(sb.canvas, 0, 0);

      // Store the original ImageData
      sb._imgd = sb.getImageData(0, 0, sb._sw, sb._sh);

      // Copy the selection background with the ImageData merged on top, in the selection buffer
      sb.clearRect(0, 0, sb._sw, sb._sh);
      sb.drawImage(canvas, 0, 0);

      context.clearRect(0, 0, sb._sw, sb._sh);

      // Side note: simply drawing the background and using putImageData does not work, because putImageData replaces all the pixels on the destination. putImageData does not draw the ImageData on top of the destination.
    }

    // Draw the updated selection
    context.drawImage(sb.canvas, 0, 0, sb._sw, sb._sh, _tool.sx0, _tool.sy0, _tool.sw1, _tool.sh1);
    context.strokeRect(_tool.sx0b + _tool.lineWidth2, _tool.sy0b + _tool.lineWidth2, _tool.sw2, _tool.sh2);

    return true;
  };
  _me.inputs.selTransparent.addEventListener('change', _tool.update_transparency, false);

  // Calculate the new coordinates of the selection rectangle, and the dimension, based on the mouse position
  _tool.calc_resize = function (ev) {
    var diffx = ev.x_ - _tool.x0,
      diffy = ev.y_ - _tool.y0,
      x = _tool.sx0, y = _tool.sy0,
      w = _tool.sw2, h = _tool.sh2,
      r = _tool.resizer;

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
      var p = _tool.sw2 / _tool.sh2,
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
  _tool.calc_selinfo = function (ev) {
    // Drawing selection rectangle
    if (_tool.step == 1) {
      var minX = Math.min(ev.x_, _tool.x0),
        minY = Math.min(ev.y_, _tool.y0),
        maxX = Math.max(ev.x_, _tool.x0),
        maxY = Math.max(ev.y_, _tool.y0);

    } else if (_tool.step == 3 || _tool.step == 5) {
      // Dragging selection (3) or ImageData (5)

      // Snapping on the X/Y axis
      if (ev.shiftKey) {
        _me.tool_snapXY(ev, _tool.x0, _tool.y0);
      }

      var minX = _tool.sx0 + ev.x_,
        minY = _tool.sy0 + ev.y_;

    } else if (_tool.step == 2 || _tool.step == 4 || _tool.step == 6) {
      // Selection available (2), resizing selection (4), resizing ImageData (6)

      var minX = _tool.sx0,
        minY = _tool.sy0;

    } else {
      return false;
    }

    if (_tool.step != 1) {
      var maxX = minX + _tool.sw2,
        maxY = minY + _tool.sh2;
    }

    // Store the selection start and end pos
    _tool.sx0 = minX + _tool.lineWidth2;
    _tool.sy0 = minY + _tool.lineWidth2;
    _tool.sx1 = maxX - _tool.lineWidth2;
    _tool.sy1 = maxY - _tool.lineWidth2;

    // ... including the borders
    _tool.sx0b = minX - _tool.lineWidth2;
    _tool.sy0b = minY - _tool.lineWidth2;
    _tool.sx1b = maxX + _tool.lineWidth2;
    _tool.sy1b = maxY + _tool.lineWidth2;

    // inner width and height
    _tool.sw1 = _tool.sx1 - _tool.sx0;
    _tool.sh1 = _tool.sy1 - _tool.sy0;

    if (_tool.step == 1) {
      // "normal" width and height (as used by the strokeRect method)
      _tool.sw2 = maxX - minX;
      _tool.sh2 = maxY - minY;
    }

    return true;
  };

  // Initialize the selection buffer, when the user starts dragging (5) or resizing (6) ImageData
  _tool.selbuffer_init = function (ev) {
    var x = _tool.sx0, y = _tool.sy0,
      w = _tool.sw1, h = _tool.sh1,
      sumX = _tool.sx0 + _tool.sw1,
      sumY = _tool.sy0 + _tool.sh1,
      dx = 0, dy = 0,
      sb = _tool.selbuffer;

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

    // Copy the currently selected ImageData into the temporary canvas (img_temp)
    context.drawImage(_me.img.canvas, x, y, w, h, x, y, w, h);

    sb.clearRect(0, 0, image.width, image.height);

    // Set a non-transparent background for the selection buffer, if the user does not want the selection to have a transparent background.
    sb._imgd = false;
    if (!_tool.transparency && _me.img.getImageData) {
      // Store the selection ImageData as-is
      sb._imgd = _me.img.getImageData(x, y, w, h);
      sb.fillStyle = context.fillStyle;
      sb.fillRect(0, 0, sb._sw, sb._sh);
    }

    // Also put the selected ImageData into the selection buffer canvas (selbuffer).
    // Parameters: source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
    sb.drawImage(_me.img.canvas, x, y, w, h, dx, dy, w, h);

    // Clear the selected pixels from the image
    _me.img.clearRect(x, y, w, h);
    _tool.cleared = true;

    _me.historyAdd();

    return true;
  };

  // Merge the ImageData from the selection buffer, when the user stops dragging (5) or resizing (6) ImageData.
  _tool.selbuffer_merge = function (ev) {
    var sb = _tool.selbuffer;
    if (!sb) {
      return false;
    }

    if (_tool.step == 3 || _tool.step == 4) {
      context.clearRect(_tool.sx0, _tool.sy0, _tool.sw1, _tool.sh1);
    } else {
      context.clearRect(0, 0, image.width, image.height);
    }

    if (_tool.cleared && sb._sw && sb._sh) {
      _me.img.drawImage(sb.canvas, 0, 0, sb._sw, sb._sh, _tool.sx0, _tool.sy0, _tool.sw1, _tool.sh1);
      _me.historyAdd();
      _tool.cleared = false;
    }

    sb._imgd = false;
    _tool.canvasStyle.cursor = '';
    _me.btn_cut(-1);
    _me.btn_copy(-1);

    return true;
  };

  _tool.sel_cut = function (ev) {
    if (!_tool.sel_copy(ev)) {
      return false;
    }

    context.clearRect(0, 0, image.width, image.height);
    _tool.selbuffer.clearRect(0, 0, image.width, image.height);

    if (!_tool.cleared) {
      _me.img.clearRect(_tool.sx0, _tool.sy0, _tool.sw1, _tool.sh1);
      _me.historyAdd();
    }

    _tool_cleared = false;
    _tool.selbuffer._imgd = false;
    _tool.step = 0;
    _tool.canvasStyle.cursor = '';

    _me.btn_cut(-1);
    _me.btn_copy(-1);
    statusShow('select-active');

    return true;
  };

  _tool.sel_copy = function (ev) {
    if (_tool.step != 2) {
      return false;
    }

    if (!_me.img.getImageData || !_me.img.putImageData) {
      alert(_me.getMsg('error-clipboard-unsupported'));
      return false;
    }

    if (!_tool.cleared) {
      _me.clipboard = _me.img.getImageData(_tool.sx0, _tool.sy0, _tool.sw1, _tool.sh1);
      return _me.btn_paste(1);
    }

    var sb = _tool.selbuffer;

    if (sb._imgd) {
      _me.clipboard = sb._imgd;
    } else {
      _me.clipboard = sb.getImageData(0, 0, sb._sw, sb._sh);
    }

    return _me.btn_paste(1);
  };

  _tool.sel_paste = function (ev) {
    if (_tool.step != 0 && _tool.step != 2) {
      return false;
    }

    if (!_me.img.getImageData || !_me.img.putImageData) {
      alert(_me.getMsg('error-clipboard-unsupported'));
      return false;
    }

    // The default position for the pasted image is the top left corner of the visible area, taking into consideration the zoom level.
    var sb = _tool.selbuffer,
      x = Math.round(_me.container.scrollLeft / _me.zoom),
      y = Math.round(_me.container.scrollTop  / _me.zoom),
      w = _me.clipboard.width,
      h = _me.clipboard.height;

    x += _tool.lineWidth;
    y += _tool.lineWidth;

    if (_tool.step == 2) {
      context.clearRect(0, 0, image.width, image.height);
      _tool.canvasStyle.cursor = '';
      sb._imgd = false;
    }

    // The following code block sucks:
    // you can't use negative values, nor do you have a good globalCompositeOperation
    sb.putImageData(_me.clipboard, 0, 0);
    if (_tool.transparency) {
      context.putImageData(_me.clipboard, x, y);
    } else {
      context.fillRect(x, y, w, h);
      context.drawImage(sb.canvas, x, y);
      sb._imgd = context.getImageData(x, y, w, h);

      sb.putImageData(sb._imgd, 0, 0);
      sb._imgd = _me.clipboard;
    }

    sb._sw = _tool.sw1 = w;
    sb._sh = _tool.sh1 = h;
    _tool.sw2 = w + _tool.lineWidth2;
    _tool.sh2 = h + _tool.lineWidth2;
    _tool.sx0 = x;
    _tool.sy0 = y;
    _tool.sx0b = x - _tool.lineWidth;
    _tool.sy0b = y - _tool.lineWidth;
    _tool.sx1 = w + x;
    _tool.sy1 = h + y;
    _tool.sx1b = _tool.sx1 + _tool.lineWidth;
    _tool.sy1b = _tool.sy1 + _tool.lineWidth;
    _tool.transform = _me.inputs.selTransform.checked = true;
    _tool.cleared = true;
    _tool.step = 2;

    _me.btn_cut(1);
    _me.btn_copy(1);
    statusShow('select-available');

    context.strokeRect(_tool.sx0b + _tool.lineWidth2, _tool.sy0b + _tool.lineWidth2, _tool.sw2, _tool.sh2);

    _tool.update_mpos(ev);

    return true;
  };

  // Return: quickly enable/disable the transformation mode.
  // Delete: delete the selected pixels.
  // Escape: drop selection.
  // Alt-Backspace: fill the selection with a flat color (fillStyle). This only works when transformation mode is disabled.
  this.keydown = function (ev) {
    // Toggle transformation mode
    if (ev.kid_ == 'return') {
      _tool.transform = !_me.inputs.selTransform.checked;
      _me.inputs.selTransform.checked = _tool.transform;

    } else if ((ev.kid_ == 'delete' || ev.kid_ == 'escape') && _tool.step == 2) {
      // Delete the selected pixels and/or drop the selection (when the selection is available).

      // Delete the pixels from the image if they are not deleted already.
      if (!_tool.cleared && ev.kid_ == 'delete') {
        _me.img.clearRect(_tool.sx0, _tool.sy0, _tool.sw1, _tool.sh1);
        _me.historyAdd();
      }

      _tool.step = 0;
      _tool.cleared = false;
      _tool.canvasStyle.cursor = '';
      _tool.selbuffer._imgd = false;

      context.clearRect(0, 0, image.width, image.height);
      _me.btn_cut(-1);
      _me.btn_copy(-1);
      statusShow('select-active');

    } else if (ev.kid_ == 'alt-backspace' && !_tool.transform) {
      // Fill the selection with a flat color (fillStyle).

      _me.img.fillStyle = context.fillStyle;
      _me.img.fillRect(_tool.sx0, _tool.sy0, _tool.sw1, _tool.sh1);
      _me.historyAdd();

    } else {
      return false;
    }

    return true;
  };

  _tool.update_lineWidth();

  return true;
};

PaintTools.insertimg = function (app) {
  var _self = this;

  if (!_me.img || !_me.img.canvas || !_me.container || !context || !_me.tool || !_me.tool._id) {
    alert( _me.getMsg('error-tool-activate') );
    _tool._cancel = true;
    return false;
  }

  // Once the image is inserted, the user goes back to the previous tool.
  _tool.prev_tool = _me.tool._id;

  // The default URL
  if (!_me.tools.insertimg._url) {
    _me.tools.insertimg._url = 'http://';
  }

  _tool.url = prompt(_me.getMsg('prompt-insertimg'), _me.tools.insertimg._url);
  if (!_tool.url || _tool.url.toLowerCase() == 'http://' || _tool.url.substr(0, 7).toLowerCase() != 'http://') {
    _tool._cancel = true;
    return false;
  }
  _me.tools.insertimg._url = _tool.url;

  _tool.get_host = function (url) {
    url = url.substr(7);
    var pos = url.indexOf('/');
    if (pos > -1) {
      url = url.substr(0, pos);
    }

    return url;
  };

  if (_tool.get_host(_tool.url) != _me.win.location.host) {
    alert( _me.getMsg('error-insertimg-host') );
    _tool._cancel = true;
    return false;
  }

  // Make sure the image dimensions are synchronized with the zoom level.
  _tool.ev_img_load = function (ev) {
    // Did the image already load?
    if (_tool.img_loaded) {
      return true;
    }

    // The default position for the inserted image is the top left corner of the visible area, taking into consideration the zoom level.
    var x = Math.round(_me.container.scrollLeft / _me.zoom),
      y = Math.round(_me.container.scrollTop  / _me.zoom);

    context.clearRect(0, 0, image.width, image.height);

    try {
      context.drawImage(_tool.img, x, y);
      _tool.img_loaded = true;
      statusShow('insertimg-loaded');
    } catch (err) {
      alert( _me.getMsg('error-insertimg') );
    }

    return true;
  };
  _tool.img_loaded = false;

  // The mouse start position, used when the user also resizes the image with the mousdown+mousemove+mouseup sequence.
  _tool._x = _tool._y = 0;

  _tool.img = new Image();
  _tool.img.addEventListener('load', _tool.ev_img_load, false);
  _tool.img.src = _tool.url;

  this.mousedown = function (ev) {
    if (!_tool.img_loaded) {
      alert(_me.getMsg('error-insertimg-not-loaded'));
      return false;
    }

    _tool._x = ev.x_;
    _tool._y = ev.y_;

    _tool.mousemove_img(ev);

    // Switch to the image resize "mode" of the tool.
    _tool.mousemove = _tool.mousemove_resize;

    // The image aspect ratio - used by the resizer when the user holds the Shift key down.
    _tool.imgar = _tool.img.width / _tool.img.height;

    statusShow('insertimg-resize');

    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
  };

  // This is the initial mousemove event handler. It keeps the image position in sync with the mouse, such that the user can pick where to put the image on the canvas.
  _tool.mousemove_img = function (ev) {
    if (!_tool.img_loaded) {
      return false;
    }

    context.clearRect(0, 0, image.width, image.height);
    context.drawImage(_tool.img, ev.x_, ev.y_);
  };
  _tool.mousemove = _tool.mousemove_img;

  // After mousedown the mousemove event handler becomes this function. By doing so, users are allowed to resize the image.
  _tool.mousemove_resize = function (ev) {
    var w = Math.abs(ev.x_ - _tool._x),
      h = Math.abs(ev.y_ - _tool._y),
      x = Math.min(ev.x_, _tool._x),
      y = Math.min(ev.y_, _tool._y);

    // Constrain the image to have the same aspect ratio as the original
    if (ev.shiftKey) {
      if (w > h) {
        if (y == ev.y_) {
          y -= w-h;
        }
        h = Math.round(w/_tool.imgar);
      } else {
        if (x == ev.x_) {
          x -= h-w;
        }
        w = Math.round(h*_tool.imgar);
      }
    }

    context.clearRect(0, 0, image.width, image.height);
    context.drawImage(_tool.img, x, y, w, h);
  };

  this.mouseup = function (ev) {
    if (!_tool.img_loaded) {
      return false;
    }

    if (ev.x_ != _tool._x || ev.y_ != _tool._y) {
      _tool.mousemove_resize(ev);
    }

    layerUpdate();

    if (_tool.prev_tool) {
      toolActivate(_tool.prev_tool, ev);
    }

    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
  };

  this.deactivate = function (ev) {
    if (_tool.img) {
      _tool.img = null;
      delete _tool.img;
    }

    context.clearRect(0, 0, image.width, image.height);

    return true;
  };

  // Escape returns to the previous tool.
  this.keydown = function (ev) {
    if (!_tool.prev_tool || ev.kid_ != 'escape') {
      return false;
    }

    toolActivate(_tool.prev_tool, ev);
    return true;
  };

  return true;
};

PaintTools.text = function (app) {
  var _self = this;

  if (!_me.img || !_me.img.canvas || !_me.container || !context || !_me.resizer || !_me.resizer.elem || !_me.tool || !_me.tool._id || !_me.inputs || !_me.inputs.textString || !_me.elems.textOptions) {
    alert( _me.getMsg('error-tool-activate') );
    _tool._cancel = true;
    return false;
  }

  if (!_me.img.fillText || !_me.img.strokeText) {
    alert( _me.getMsg('error-text-unsupported') );
    _tool._cancel = true;
    return false;
  }

  // Once the text is inserted, the user goes back to the previous tool
  _tool.prev_tool = _me.tool._id;

  // The last text position, but by default it's in the center of the image.
  _tool.x = Math.round(image.width / 2);
  _tool.y = Math.round(image.height / 2);

  // Show the text options.
  _me.elems.textOptions.className = '';

  // The event handler for the text field and the other text options.
  _tool.text_update = function (ev) {
    if (!ev) {
      ev = {};
    }

    ev.x_ = _tool.x;
    ev.y_ = _tool.y;

    _tool.mousemove(ev);
  };

  _tool.setup_events = function (act) {
    var ev, i, listeners = ['textString', 'textFont', 'textSize', 'lineWidth'];

    for (i in listeners) {
      i = listeners[i];
      i = _me.inputs[i];
      if (!i) {
        continue;
      }
      if (i.tagName.toLowerCase() == 'select' || i.type == 'checkbox') {
        ev = 'change';
      } else {
        ev = 'input';
      }
      if (act == 'add') {
        i.addEventListener(ev, _tool.text_update, false);
      } else {
        i.removeEventListener(ev, _tool.text_update, false);
      }
    }
  };
  _tool.setup_events('add');

  this.mousemove = function (ev) {
    context.clearRect(0, 0, image.width, image.height);

    if (_me.shapeType != 'stroke') {
      context.fillText(_me.inputs.textString.value, ev.x_, ev.y_);
    }

    if (_me.shapeType != 'fill') {
      context.strokeText(_me.inputs.textString.value, ev.x_, ev.y_);
    }

    _tool.x = ev.x_;
    _tool.y = ev.y_;
  };

  this.click = function (ev) {
    _tool.mousemove(ev);

    layerUpdate();

    toolActivate(_tool.prev_tool, ev);

    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
  };

  // The following event handler runs post-construction and post-deactivation of the previous tool.
  _tool.activate = _tool.text_update;

  this.deactivate = function (ev) {
    _tool.setup_events('remove');

    context.clearRect(0, 0, image.width, image.height);

    // Minimize the text options.
    _me.elems.textOptions.className = 'minimized';

    return true;
  };

  // Escape returns to the previous tool.
  this.keydown = function (ev) {
    if (!_tool.prev_tool || ev.kid_ != 'escape') {
      return false;
    }

    toolActivate(_tool.prev_tool, ev);
    return true;
  };

  return true;
};

PaintTools.drag = function (app) {
  var _self = this;

  if (!context || !_me.doc || !_me.doc.body) {
    alert( _me.getMsg('error-tool-activate') );
    _tool._cancel = true;
    return false;
  }

  mouse.buttonDown = false;
  canvas.style.cursor = 'move';

  // If Escape key is pressed, the user goes back to the previous tool
  _tool.prev_tool = _me.tool._id;

  this.mousedown = function (ev) {
    _tool.x0 = Math.round(ev.x_ * _me.zoom);
    _tool.y0 = Math.round(ev.y_ * _me.zoom);
    mouse.buttonDown = true;
  };

  this.mousemove = function (ev) {
    if (!mouse.buttonDown) {
      return false;
    }

    var dx = Math.round(ev.x_ * _me.zoom) - _tool.x0,
      dy = Math.round(ev.y_ * _me.zoom) - _tool.y0;

    _me.container.scrollTop -= dy;
    _me.container.scrollLeft -= dx;
  };

  this.mouseup = function (ev) {
    mouse.buttonDown = false;
  };

  this.deactivate = function (ev) {
    canvas.style.cursor = '';
  };

  // Escape returns to the previous tool.
  this.keydown = function (ev) {
    if (!_tool.prev_tool || ev.kid_ != 'escape') {
      return false;
    }

    toolActivate(_tool.prev_tool, ev);
    return true;
  };

  return true;
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

