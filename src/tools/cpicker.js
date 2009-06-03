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
 * $Date: 2009-06-03 18:28:56 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the color picker implementation.
 */

// FIXME: waiting for the Color Editor extension and for the new GUI.


/**
 * @class The color picker tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.tools.cpicker = function (app) {
  var _self        = this,
      context      = app.buffer.context,
      mouse        = app.mouse,
      image        = app.image,
      lang         = app.lang,
      layerUpdate  = app.layerUpdate,
      statusShow   = app.gui.statusShow,
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

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

