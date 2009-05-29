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
 * $Date: 2009-05-29 15:41:56 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview The default PaintWeb interface code.
 */


/**
 * @class The default PaintWeb interface.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.gui.default = function (app) {

  this.init = function (markupDocument) {
  };

  // This function prepares all the inputs in the Properties box.
  // TODO: fix all this... (will do it with the new GUI)
  this.init_properties = function () {
    var i, elem,

      ev_simple_prop = function (ev) {
        if (!this._prop || !_self.ev_input_nr(ev)) {
          return false;
        }
        _self.buffer.context[this._prop] = this.value;
      },

      // Inputs of type=number.
      n, id, opt_nr = ['lineWidth', 'miterLimit', 'shadowOffsetX', 'shadowOffsetY', 'shadowBlur'];

    for (i = 0, n = opt_nr.length; i < n; i++) {
      id = opt_nr[i];
      if ( !(elem = $('in-' + id)) ) {
        return false;
      }

      elem.addEventListener('keypress', this.ev_input_nr, false);
      elem.addEventListener('input', ev_simple_prop, false);

      elem._old_value = elem.value;
      elem._prop = id;
      this.inputs[id] = elem;
    }

    // The icon-based options.
    var y, icons, opt_icon = ['shapeType', 'lineCap', 'lineJoin', 'textAlign'];
    for (i = 0, n = opt_icon.length; i < n; i++) {
      id = opt_icon[i];
      if ( !(elem = $('in-' + id)) ) {
        return false;
      }

      elem._prop = id;

      icons = elem.getElementsByTagName('div');

      // The first icon is also the default one for activation.
      icons[0].className = 'active';
      if (id != 'shapeType') {
        this.buffer.context[id] = icons[0].id.replace(id + '-', '');
      }

      for (y = 0; y < icons.length; y++) {
        icons[y].addEventListener('click', this.opt_icon, false);
        if (!icons[y].title) {
          icons[y].title = icons[y].textContent;
        }
      }
    }

    // Cache several inputs
    var inputs = ['selTransform', 'selTransparent', 'textFont', 'textSize', 
        'textString', 'shadowActive'];
    for (i = 0, n = inputs.length; i < n; i++) {
      id = inputs[i];
      if ( !(_self.inputs[id] = $('in-' + id)) ) {
        return false;
      }
    }

    // The selection transparency cannot be disabled if the browser does not 
    // implement put/getImageData.
    if (!this.layer.context.getImageData || !this.layer.context.putImageData) {
      this.inputs.selTransparent.parentNode.className += ' disabled';
      this.inputs.selTransparent.disabled = true;
    }

    // The Shadow API is only supported by Firefox 3.1.
    // Opera reports all the shadow-related properties as available, even if it currently doesn't implement the Shadow API.
    elem = this.inputs.shadowActive;
    if (!this.layer.context.shadowColor) {
      elem.parentNode.className += ' disabled';
      elem.disabled = true;
    }
    elem.addEventListener('change', this.shadowToggle, false);
    elem.checked = true;
    this.shadowDisable();

    // The Text API is only supported by Firefox 3.1, and new WebKit builds.
    if (this.layer.context.fillText && this.layer.context.strokeText) {
      elem = this.inputs.textSize;
      elem._old_value = elem.value;
      elem.addEventListener('keypress', this.ev_input_nr,      false);
      elem.addEventListener('input',    this.update_textProps, false);

      this.inputs.textFont.addEventListener('change', this.opt_textFont, false);

      var textStyle = ['textItalic', 'textBold'];
      for (i = 0, n = textStyle.length; i < n; i++) {
        id = textStyle[i];
        if ( !(elem = $('in-' + id)) ) {
          return false;
        }
        elem._prop = id;

        if (!elem.title && elem.textContent) {
          elem.title = elem.textContent;
        }

        elem.addEventListener('click', this.opt_textStyle, false);
        this[id] = false;
      }
    }

    var ttl, sections = {
      'lineOptions'      : true, // the condition to make the section available or not
      'selectionOptions' : true,
      'textOptions'      : this.layer.context.fillText && 
        this.layer.context.strokeText,
      'shadowOptions'    : this.layer.context.shadowColor
    };

    // Make each section from Properties minimizable.
    // By default all sections are minimized, except lineOptions.
    for (i in sections) {
      if ( !(elem = $(i)) ) {
        return false;
      }

      _self.elems[i] = elem;

      if (i != 'lineOptions') {
        elem.className = 'minimized';
      }

      if (!sections[i]) {
        elem.style.display = 'none';
        continue;
      }

      ttl = elem.getElementsByTagName('h2')[0];
      if (!ttl) {
        continue;
      }

      ttl.addEventListener('click', function () {
        if (this.parentNode.className == 'minimized') {
          this.parentNode.className = '';
        } else {
          this.parentNode.className = 'minimized';
        }
      }, false);
    }

    return true;
  };

  // Initialize and handle the dragging of the GUI boxes.
  // TODO: GUI stuff
  this.boxes = {
    'drag' : false,
    'elem' : false,
    'zIndex' : 0,
    'zIndex_step' : 200,

    'init' : function () {
      var b = _self.boxes, ttl, id, box, cs,
        boxes = {
          'toolbar'     : false, // auto-hide?
          'main'        : false,
          'properties'  : false,
          'help'        :  true,
          'coloreditor' :  true
        };

      for (id in boxes) {
        if ( !(box = $(id)) ) {
          return false;
        }

        _self.elems[id] = box;

        cs = _self.win.getComputedStyle(box, null);
        if (!cs) {
          continue;
        }

        // Set the position in the .style for quicker usage by the mousedown handler.
        // If this is not done during initialization, it would need to be done in the mousedown handler.
        box.style.top    = cs.top;
        box.style.left   = cs.left;
        box.style.zIndex = cs.zIndex;

        if (cs.zIndex > b.zIndex) {
          b.zIndex = parseInt(cs.zIndex);
        }

        // Auto-hide
        if (boxes[id]) {
          box.style.visibility = 'visible';
          box.style.display    = 'none';
        }

        ttl = box.getElementsByTagName('h1')[0];
        if (!ttl) {
          continue;
        }

        ttl.addEventListener('mousedown', b.mousedown, false);
      }

      return true;
    },

    'mousedown' : function (ev) {
      var b = _self.boxes;
      if (!b) {
        return false;
      }

      if (b.drag) {
        b.drag = false;
      }

      b.drag  = true;
      b.mx    = ev.clientX;
      b.my    = ev.clientY;
      b.elem  = this.parentNode;
      b.btop  = parseInt(b.elem.style.top);
      b.bleft = parseInt(b.elem.style.left);

      b.zIndex += b.zIndex_step;
      b.elem.style.zIndex = b.zIndex;

      _self.doc.addEventListener('mousemove', b.mousemove, false);
      _self.doc.addEventListener('mouseup',   b.mouseup,   false);

      if (ev.preventDefault) {
        ev.preventDefault();
      }

      return true;
    },

    'mousemove' : function (ev) {
      var b = _self.boxes;
      if (!b || !b.drag || !b.elem) {
        return false;
      }

      var x = b.bleft + ev.clientX - b.mx,
          y = b.btop  + ev.clientY - b.my;

      b.elem.style.top  = y + 'px';
      b.elem.style.left = x + 'px';

      if (ev.preventDefault) {
        ev.preventDefault();
      }
    },

    'mouseup' : function (ev) {
      var b = _self.boxes;
      if (!b) {
        return false;
      }

      b.elem = b.drag = false;

      _self.doc.removeEventListener('mousemove', b.mousemove, false);
      _self.doc.removeEventListener('mouseup',   b.mouseup,   false);

      if (ev.preventDefault) {
        ev.preventDefault();
      }

      return true;
    },

    'bringOnTop' : function (box) {
      var b = _self.boxes;
      if (!b || !box) {
        return false;
      }

      box = _self.elems[box];
      if (!box) {
        return false;
      }

      b.zIndex += b.zIndex_step;
      box.style.zIndex = b.zIndex;

      return true;
    }
  };

  // This is the event handler which shows a temporary status message when hovering buttons/tools.
  this.item_mouseover = function (ev) {
    if (!this.id) {
      return false;
    }

    if (_self.lang.status['hover' + this.id]) {
      _self.statusShow('hover' + this.id, ev);
    } else if (this.title) {
      _self.statusShow(this.title, ev);
    } else if (this.textContent) {
      _self.statusShow(this.textContent, ev);
    }

    return true;
  };

  // This simply goes back to the previous status message.
  this.item_mouseout = function (ev) {
    return _self.statusShow(-1, ev);
  };

  // This function changes the status message as needed. The optional event 
  // object helps determine if the status message is temporary or not.
  // The msg parameter can be an ID from _self.status_texts or directly the 
  // message desired to show. msg can also be -1 when you want to get back to 
  // the previous message.
  // TODO: GUI stuff
  this.statusShow = function (msg, ev) {
    var elem = _self.elems.status;
    if (!elem || (msg == -1 && elem._prevText === false)) {
      return false;
    }

    if (msg == -1) {
      msg = elem._prevText;
    } else {
      if (ev && ev.type == 'mouseover') {
        elem._prevText = elem.textContent;
      } else {
        elem._prevText = false;
      }

      if (msg && _self.lang.status[msg]) {
        msg = _self.lang.status[msg];
      }
    }

    if (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }

    if (!msg) {
      _self.win.status = '';
      return true;
    }

    _self.win.status = msg;
    elem.appendChild(_self.doc.createTextNode(msg));

    return true;
  };

  // This is called when any tool is clicked.
  // TODO: move into GUI code
  this.toolClick = function (ev) {
    if (!this._tool) {
      return false;
    } else {
      return _self.toolActivate(this._tool, ev);
    }
  };

  // This is the event handler for changes in inputs of type=number. The 
  // function is associated with the following events: keypress, input and/or 
  // change.
  // This function is also called by other event handlers which are specific to 
  // various inputs. The return value (true/false) is used to check if the event 
  // target value has been updated or not, while making sure the value is 
  // a valid number.
  // FIXME
  this.ev_input_nr = function (ev) {
    if (!ev || !ev.target) {
      return false;
    }

    // FIXME: update this as needed.
    return true;

    // Do not do anything if this is a synthetic DOM event.
    if (ev.type != 'keypress' && ev._invoked) {
      return true;
    }

    // Do not continue if this is a keypress event and the pressed key is not Up/Down.
    if (ev.type == 'keypress' && (!_self.ev_keypress_prepare(ev) || (ev._key != 'up' && ev._key != 'down'))) {
      return false;
    }

    // Do not continue if this is not a keypress event and the "new" value is the same as the old value.
    var target = ev.target;
    if (ev.type != 'keypress' && target.value == target._old_value) {
      return false;
    }

    // Process the value.
    var val = target.value.replace(/[,.]+/g, '.').replace(/[^0-9.\-]/g, ''),
      max = parseFloat(target.getAttribute('max')),
      min = parseFloat(target.getAttribute('min'));

    val = parseFloat(val);

    if (target.value == '') {
      val = min || 0;
    }

    // If target is not a number, then set the old value, or the minimum value. If all fails, set 0.
    if (isNaN(val)) {
      val = parseFloat(target._old_value);
      if (isNaN(val)) {
        val = min || 0;
      }
    }

    if (ev.type == 'keypress') {
      var step = parseFloat(target.getAttribute('step'));
      if (isNaN(step)) {
        step = 1;
      }

      if (ev.shiftKey) {
        step *= 2;
      }

      if (ev._key == 'down') {
        step *= -1;
      }

      val += step;
    }

    if (!isNaN(max) && val > max) {
      val = max;
    } else if (!isNaN(min) && val < min) {
      val = min;
    }

    if (val != target.value) {
      target.value = val;
    }

    // The input value was not updated by the user, so return false.
    if (val == target._old_value) {
      return false;
    }

    // This is used by this event handler only. To the rest of the event handlers target.value and target._old_value are most of the time the same.
    target._old_value = val;

    // If this is the keypress event, then dispatch the input and change events, so that the target-specific event handlers can execute.
    if (ev.type == 'keypress' && _self.doc.createEvent && target.dispatchEvent) {
      if (ev.preventDefault) {
        ev.preventDefault();
      }

      var ev_change = _self.doc.createEvent('HTMLEvents'),
        ev_input  = _self.doc.createEvent('HTMLEvents');

      ev_input.initEvent ('input',  true, true);
      ev_change.initEvent('change', true, true);

      // Let the receiving event handlers determine if this is a "fake"/synthetic event.
      ev_change._invoked = ev_input._invoked = true;

      target.dispatchEvent(ev_input);
      target.dispatchEvent(ev_change);
    }

    // The input value was updated by the user.
    return true; 
  };

  // This is the set of functions associated with the canvas resize handler.
  // TODO: GUI stuff
  this.resizer = {
    'elem' : false,
    'resizing' : false,

    // The initial position of the mouse.
    'mx' : 0,
    'my' : 0,

    // The container dimensions
    'w' : 0,
    'h' : 0,

    'mousedown' : function (ev) {
      var r = _self.resizer;
      if (r.resizing || !r.elem) {
        return false;
      }

      r.resizing = true;
      r.mx = ev.clientX;
      r.my = ev.clientY;
      r.w = parseInt(_self.elems.container.style.width);
      r.h = parseInt(_self.elems.container.style.height);

      _self.doc.addEventListener('mousemove', r.mousemove, false);
      _self.doc.addEventListener('mouseup',   r.mouseup,   false);

      // We do not want scroll bars while resizing.
      _self.elems.container.style.overflow = 'hidden';

      // Make sure that the Main box is on top.
      if (_self.boxes && _self.boxes.bringOnTop) {
        _self.boxes.bringOnTop('main');
      }

      if (ev.preventDefault) {
        ev.preventDefault();
      }

      if (ev.stopPropagation) {
        ev.stopPropagation();
      }

      return true;
    },

    'mousemove' : function (ev) {
      var r = _self.resizer;
      if (!r.resizing) {
        return false;
      }

      var dx = ev.clientX - r.mx,
          dy = ev.clientY - r.my;

      _self.elems.container.style.width  = (r.w + dx) + 'px';
      _self.elems.container.style.height = (r.h + dy) + 'px';

      if (ev.stopPropagation) {
        ev.stopPropagation();
      }

      return true;
    },

    'mouseup' : function (ev) {
      var r = _self.resizer;
      if (!r.resizing) {
        return false;
      }

      var dx = ev.clientX - r.mx,
          dy = ev.clientY - r.my;

      var w = MathRound((r.w + dx) / _self.image.canvasScale),
          h = MathRound((r.h + dy) / _self.image.canvasScale);

      _self.resizeCanvas(w, h, true);

      return r.done(ev);
    },

    'done' : function (ev) {
      var r = _self.resizer;
      if (!r.resizing) {
        return false;
      }

      r.resizing = false;
      _self.doc.removeEventListener('mousemove', r.mousemove, false);
      _self.doc.removeEventListener('mouseup',   r.mouseup,   false);
      _self.elems.container.style.overflow = 'auto';

      if (ev.stopPropagation) {
        ev.stopPropagation();
      }

      return true;
    }
  };

  // This is the event handler for most of the icon-based options. It used for 
  // shapeType, lineJoin, lineCap and textAlign
  this.opt_icon = function (ev) {
    if (!this.id) {
      return false;
    }

    var pelem = this.parentNode;
    if (!pelem._prop) {
      return false;
    }

    var old_val = '', val = this.id.replace(pelem._prop + '-', '');
    if (pelem._prop == 'shapeType') {
      old_val = _self.config.shapeType;
      _self.config.shapeType = val;
    } else {
      old_val = _self.buffer.context[pelem._prop];
      _self.buffer.context[pelem._prop] = val;
    }

    var elem = _self.doc.getElementById(pelem._prop + '-' + old_val);
    if (elem) {
      elem.className = '';
    }

    this.className = 'active';

    if (_self.tool && _self.tool._id == 'text' && 'draw' in _self.tool) {
      _self.tool.draw(ev);
    }

    return true;
  };

  // The event handler for the text Bold/Italic icons.
  this.opt_textStyle = function (ev) {
    if (!this._prop) {
      return false;
    }

    if (this.className == 'active') {
      _self[this._prop] = false;
      this.className  = '';
    } else {
      _self[this._prop] = true;
      this.className  = 'active';
    }

    return _self.update_textProps(ev);
  };

  // This is event handler for changes to the text font input. If the user wants 
  // to pick another font, then he/she can type the new font name to easily add 
  // it to the list of available fonts.
  this.opt_textFont = function (ev) {
    if (this.value != '+') {
      return _self.update_textProps(ev);
    }

    var new_font = prompt(_self.lang.promptTextFont);
    if (!new_font) {
      this.selectedIndex = 0;
      this.value = this.options[0].value;
      return _self.update_textProps(ev);
    }

    new_font = new_font.replace(/^\s+/, '').replace(/\s+$/, '');

    // Check if the font name is already in the list.
    var opt, i, new_font2 = new_font.toLowerCase(),
        n = this.options.length;

    for (i = 0; i < n; i++) {
      opt = this.options[i];
      if (opt.value.toLowerCase() == new_font2) {
        this.selectedIndex = i;
        this.value = opt.value;
        return _self.update_textProps(ev);
      }
    }

    opt = _self.doc.createElement('option');
    opt.value = new_font;
    opt.appendChild(_self.doc.createTextNode(new_font));
    this.insertBefore(opt, this.options[n-1]);
    this.selectedIndex = n-1;
    this.value = new_font;

    return _self.update_textProps(ev);
  };

  // This event handler simply builds the font CSS property for use with the Text API.
  this.update_textProps = function (ev) {
    if (!_self.layer.context.fillText || !_self.inputs.textFont || 
        !_self.inputs.textSize) {
      return false;
    }

    // If this is the textSize input, then call _self.ev_input_nr(ev) to check the input value (the number).
    // Don't do anything if the value is invalid, or if it was not really updated.
    if (ev.target && ev.target.id == _self.inputs.textSize.id && !_self.ev_input_nr(ev)) {
      return false;
    }

    var my_font   = _self.inputs.textFont.value,
        my_size   = _self.inputs.textSize.value,
        my_bold   = _self.textBold,
        my_italic = _self.textItalic,
        prop      = '';

    if (my_bold) {
      prop += 'bold ';
    }
    if (my_italic) {
      prop += 'italic ';
    }
    if (my_size) {
      prop += my_size + 'px ';
    }
    if (my_font) {
      prop += my_font;
    }

    _self.layer.context.font = _self.buffer.context.font = prop;

    if (_self.tool && _self.tool._id == 'text' && 'draw' in _self.tool) {
      _self.tool.draw(ev);
    }

    return true;
  };

  // What follows are the event handlers for several buttons used in the 
  // application.

  this.btn_help = function (ev) {
    var elem = _self.elems.help.style,
        btn  = _self.elems.btn_help;

    if (!elem || !btn) {
      return false;
    }

    if (elem.display == 'none') {
      elem.display = 'block';
      btn.className = 'active';
      if (_self.boxes && _self.boxes.zIndex) {
        _self.boxes.zIndex += 200;
        elem.zIndex = _self.boxes.zIndex;
      }
    } else {
      elem.display = 'none';
      btn.className = '';
    }

    return true;
  };
  this.btn_help_close = _self.btn_help;

  this.btn_undo = function (ev) {
    _self.historyGoto('undo');
  };

  this.btn_redo = function (ev) {
    _self.historyGoto('redo');
  };

  // This event handler simply clears the image. If the user holds the Shift key 
  // down, then he/she is given the option to define the new size of the image.
  this.btn_clear = function (ev) {
    var layerContext = _self.layer.context,
        image        = _self.image;

    if (!ev || !ev.shiftKey) {
      layerContext.clearRect(0, 0, image.width, image.height);
      _self.historyAdd();
      return true;
    }

    // When the Shift key is being held down, prompt the user to input the new 
    // image dimensions.

    var res = prompt(_self.lang.promptImageDimensions, image.width + 'x' 
        + image.height);

    if (!res) {
      return false;
    }

    res = res.replace(/\D/, ' ').replace(/\s+/, ' ').replace(/^\s+/, '').replace(/\s+$/, '');
    if (!res) {
      return false;
    }

    res = res.split(' ');
    if (res.length < 2) {
      return false;
    }

    var w = parseInt(res[0]),
        h = parseInt(res[1]);

    if (w > 1500) {
      w = 1500;
    }
    if (h > 1500) {
      h = 1500;
    }

    if (image.width == w && image.height == h) {
      return false;
    }

    // FIXME: resizeCanvas retains the image data, but the additional work is 
    // not needed for this use-case. Performance optimization needed.
    _self.resizeCanvas(w, h);
    layerContext.clearRect(0, 0, image.width, image.height);
    _self.historyAdd();

    return true;
  };

  // For the "Save image" option we simply open a new window/tab which contains 
  // the image saved as a PNG, using a data: URL.
  this.btn_save = function (ev) {
    var canvas = _self.layer.canvas;

    if (!canvas.toDataURL) {
      return false;
    }

    var idata = canvas.toDataURL();
    if (!idata || idata.toLowerCase() == 'data:') {
      return false;
    }

    var imgwin = _self.win.open();
    if (!imgwin) {
      return false;
    }

    imgwin.location = idata;
    idata = null;

    return true;
  };

  this.btn_cut = function (ev) {
    var elem = _self.elems.btn_cut;
    if (ev == -1 || ev == 1) {
      var nClass = ev == 1 ? '' : 'disabled';

      if (elem.className != nClass) {
        elem.className = nClass;
      }

      return true;
    }

    if (elem.className == 'disabled' || _self.tool._id != 'select') {
      return false;
    }

    return _self.tool.selectionCut(ev);
  };

  this.btn_copy = function (ev) {
    var elem = _self.elems.btn_copy;
    if (ev == -1 || ev == 1) {
      var nClass = ev == 1 ? '' : 'disabled';

      if (elem.className != nClass) {
        elem.className = nClass;
      }

      return true;
    }

    if (elem.className == 'disabled' || _self.tool._id != 'select') {
      return false;
    }

    return _self.tool.selectionCopy(ev);
  };

  this.btn_paste = function (ev) {
    var elem = _self.elems.btn_paste;
    if (ev == -1 || ev == 1) {
      var nClass = ev == 1 ? '' : 'disabled';

      if (elem.className != nClass) {
        elem.className = nClass;
      }

      return true;
    }

    if (elem.className == 'disabled' || !_self.clipboard) {
      return false;
    }

    if (!_self.toolActivate('select', ev)) {
      return false;
    } else {
      return _self.tool.selectionPaste(ev);
    }
  };

  /**
   * Install a new drawing tool into PaintWeb.
   *
   * @param {String} id The ID of the new tool.
   * @param {Function} func The constructor function of the new tool object.
   * @param {Boolean} [overwrite=false] Tells to overwrite or not an existing 
   * tool with the same ID.
   *
   * @returns {Boolean} True if the tool was successfully added, or false if 
   * not.
   *
   * @see PaintWeb#toolRemove allows you to remove tools.
   */
  this.toolAdd = function (id, tool, overwrite) {
    if (typeof id != 'string' || typeof tool != 'function' || (this.tools[id] && 
          !overwrite)) {
      return false;
    }

    tool.prototype._id = id;

    // TODO: move this to GUI code.
    var elem = this.doc.getElementById('tool-' + id);
    if (elem) {
      tool.prototype._elem = elem;

      if (!elem.title && elem.textContent) {
        elem.title = elem.textContent;
      }

      elem._tool = id;
      elem.addEventListener('click',     this.toolClick,      false);
      elem.addEventListener('mouseover', this.item_mouseover, false);
      elem.addEventListener('mouseout',  this.item_mouseout,  false);
    }

    this.tools[id] = tool;

    if (!this.tool && id == this.config.toolDefault) {
      return this.toolActivate(id);
    }

    return true;
  };

  /**
   * Remove a drawing tool from PaintWeb.
   *
   * @param {String} id The ID of the tool you want to remove.
   *
   * @returns {Boolean} True if the tool was removed, or false if it does not 
   * exist or some error occurred.
   *
   * @see PaintWeb#toolAdd allows you to install new drawing tools.
   */
  this.toolRemove = function (id) {
    if (!id || !_self.tools[id]) {
      return false;
    }

    delete _self.tools[id];

    return true;
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

