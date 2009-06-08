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
 * $Date: 2009-06-08 21:05:47 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview The default PaintWeb interface code.
 */

(function () {
var pwlib = window.pwlib,
    appEvent = pwlib.appEvent;

/**
 * @class The default PaintWeb interface.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.gui['default'] = function (app) {
  var _self        = this,
      config       = app.config,
      doc          = app.doc,
      lang         = app.lang,
      pwlib        = window.pwlib,
      win          = app.win,

  this.app = app;
  this.idPrefix = 'paintweb' + app.UID + '_',
  this.classPrefix = 'paintweb_';

  /**
   * Holds references to DOM elements.
   * @type Object
   */
  this.elems = {};

  /**
   * Holds references to DOM input elements.
   * @type Object
   */
  this.inputs = {};

  /**
   * Holds references to DOM elements associated to each tool registered in the 
   * current PaintWeb application instance.
   *
   * @private
   * @type Object
   */
  this.tools = {};

  /**
   * Holds references to DOM elements associated to PaintWeb commands.
   *
   * @private
   * @type Object
   */
  this.commands = {};

  /**
   * Holds references to the GUI floating panels.
   *
   * @private
   * @type Object
   */
  this.panels = {zIndex: 0};

  /**
   * Holds an instance of the guiResizer object attached to the Canvas.
   *
   * @private
   * @type guiResizer
   */
  this.canvasResizer = null;

  /**
   * The toolbar GUI component.
   *
   * @private
   * @type guiTabPanel
   */
  this.toolbar = null;

  /**
   * Initialize the PaintWeb interface.
   *
   * @param {Document} markupDoc The interface markup loaded and parsed as DOM 
   * Document object.
   *
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.init = function (markupDoc) {
    // Make sure the user nicely waits for PaintWeb to load, without seeing 
    // much.
    config.guiPlaceholder.style.visibility = 'hidden';
    config.guiPlaceholder.className += ' ' + this.classPrefix + 'placeholder';

    if (!this.initImportDoc(markupDoc) ||
        !this.initCanvas() ||
        !this.initToolbar() ||
        //!this.initButtons() ||
        //!this.initProperties() ||
        //!this.initZoomInput() ||
        !this.initKeyboardShortcuts()) {
      return false;
    }

    // Setup the floating panels.
    var panels = this.panels;

    //panels.toolbar     = new guiFloatingPanel(this, $('toolbar'));
    //panels.main        = new guiFloatingPanel(this, $('main'));
    //panels.properties  = new guiFloatingPanel(this, $('properties'));
    panels.help        = new guiFloatingPanel(this, $('help'));
    panels.help.hide();
    panels.coloreditor = new guiFloatingPanel(this, $('coloreditor'));
    panels.coloreditor.hide();

    // Setup the Canvas resizer.

    var canvasResizer = new guiResizer(this, $('canvasResizer'), 
        this.elems.canvasContainer),
        resizeHandle = canvasResizer.resizeHandle;

    canvasResizer.events.add('guiResizeStart', this.canvasResizeStart);
    canvasResizer.events.add('guiResizeEnd',   this.canvasResizeEnd);
    resizeHandle.title     = lang.guiCanvasResizer;
    resizeHandle.innerText = lang.guiCanvasResizer;

    // Misc elements:
    // #statusMessage for displaying various short informational messages.
    // #tools holds the DOM element of each tool.

    this.elems.statusMessage._prevText = false;

    // Update the version string in Help.
    this.elems.version.appendChild(doc.createTextNode(app));

    // Add application-wide event listeners.
    app.events.add('initApp',             this.initApp);
    app.events.add('toolActivate',        this.toolActivate);
    app.events.add('toolRegister',        this.toolRegister);
    app.events.add('toolUnregister',      this.toolUnregister);
    app.events.add('commandRegister',     this.commandRegister);
    app.events.add('commandUnregister',   this.commandUnregister);

    app.commandRegister('help', this.commandHelp);

    return true;
  };

  /**
   * Initialize the canvas elements.
   *
   * @private
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.initCanvas = function () {
    var canvasContainer = this.elems.canvasContainer,
        layerCanvas     = app.layer.canvas,
        bufferCanvas    = app.buffer.canvas,
        containerStyle  = canvasContainer.style;

    if (!canvasContainer) {
      return false;
    }

    canvasContainer.className = this.classPrefix + 'canvasContainer';
    layerCanvas.className     = this.classPrefix + 'layerCanvas';
    bufferCanvas.className    = this.classPrefix + 'bufferCanvas';

    containerStyle.width  = layerCanvas.width  + 'px';
    containerStyle.height = layerCanvas.height + 'px';

    canvasContainer.appendChild(layerCanvas);
    canvasContainer.appendChild(bufferCanvas);

    return true;
  };

  /**
   * Initialize the toolbar.
   *
   * @private
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.initToolbar = function () {
    if (!this.elems.toolbar) {
      return false;
    }

    var toolbar = new guiTabPanel(this, this.elems.toolbar);
    this.toolbar = toolbar;

    // Hide all the tabs except the 'main' tab
    for (var tab in toolbar.tabs) {
      if (tab !== 'main') {
        toolbar.tabHide(tab);
      }
    }

    return true;
  };

  /**
   * Import the DOM nodes from the interface DOM document. All the nodes are 
   * inserted into the {@link PaintWeb.config.guiPlaceholder} element.
   *
   * <p>Elements with IDs are added to <var>this.elems</var> object.
   *
   * @private
   * @param {Document} srcDoc The source DOM document to import the nodes from.
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.initImportDoc = function (srcDoc) {
    // I could use some XPath here, but for the sake of compatibility I don't.
    var elem  = null,
        tag   = null,
        cmd   = null,
        tool  = null,
        nodes = srcDoc.getElementsByTagName('*'),
        n     = nodes.length,
        type  = Node.ELEMENT_NODE;

    for (var i = 0; i < n; i++) {
      elem = nodes[i];
      if (elem.nodeType !== type) {
        continue;
      }

      // Store references to commands.
      cmd = elem.getAttribute('data-pwCommand');
      if (cmd && !(cmd in this.commands)) {
        this.commands[cmd] = elem;
      }

      // Store references to tools.
      tool = elem.getAttribute('data-pwTool');
      if (tool && !(tool in this.tools)) {
        this.tools[tool] = elem;
      }

      // Update the element ID to be unique.
      if (elem.id) {
        tag = elem.tagName.toLowerCase();

        // Store a reference to the element.
        if (tag === 'input' || tag === 'select') {
          this.inputs[elem.id] = elem;
        } else {
          this.elems[elem.id] = elem;
        }

        elem.id = this.idPrefix + elem.id;
      }
    }

    var destElem = config.guiPlaceholder,
        children = srcDoc.documentElement.childNodes;

    n = children.length;

    // Import all the nodes.
    for (var i = 0; i < n; i++) {
      destElem.appendChild(doc.importNode(children[i], true));
    }

    return true;
  };

  /**
   * The <code>initApp</code> event handler. This method is invoked once 
   * PaintWeb completes all the loading.
   */
  this.initApp = function (ev) {
    // Initialization was not successful ...
    if (ev.state !== PaintWeb.INIT_DONE) {
      return;
    }

    // Make PaintWeb visible.
    this.config.guiPlaceholder.style.visibility = 'visible';
  };

  /**
   * Initialize the image zoom input.
   *
   * @private
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  // TODO: fix this
  this.initZoomInput = function () {
    var elem = $('in-zoom');
    if (!elem) {
      return false;
    }

    elem.value = 100;
    elem._old_value = 100;
    elem.addEventListener('keypress', this.ev_input_nr, false);
    elem.addEventListener('change',   app.ev_change_zoom, false);

    // Override the attributes, based on the settings.
    elem.setAttribute('step', config.zoomStep * 100);
    elem.setAttribute('max',  config.zoomMax  * 100);
    elem.setAttribute('min',  config.zoomMin  * 100);

    this.inputs.zoom = elem;

    return true;
  };

  /**
   * Initialize all the inputs in the Properties box.
   * @private
   */
  // TODO: FIXME: this needs a better organization.
  this.initProperties = function () {
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
        app.buffer.context[id] = icons[0].id.replace(id + '-', '');
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
      if ( !(this.inputs[id] = $('in-' + id)) ) {
        return false;
      }
    }

    // The selection transparency cannot be disabled if the browser does not 
    // implement put/getImageData.
    if (!app.layer.context.getImageData || !app.layer.context.putImageData) {
      this.inputs.selTransparent.parentNode.className += ' disabled';
      this.inputs.selTransparent.disabled = true;
    }

    // The Shadow API is only supported by Firefox 3.1.
    // Opera reports all the shadow-related properties as available, even if it currently doesn't implement the Shadow API.
    elem = this.inputs.shadowActive;
    if (!app.layer.context.shadowColor) {
      elem.parentNode.className += ' disabled';
      elem.disabled = true;
    }
    elem.addEventListener('change', app.shadowToggle, false);
    elem.checked = true;
    app.shadowDisable();

    // The Text API is only supported by Firefox 3.1, and new WebKit builds.
    if (app.layer.context.fillText && app.layer.context.strokeText) {
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
      'textOptions'      : app.layer.context.fillText && 
        app.layer.context.strokeText,
      'shadowOptions'    : app.layer.context.shadowColor
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

  /**
   * Initialize the keyboard shortcuts. Basically, this updates various strings 
   * to ensure the user interface is informational.
   *
   * @private
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.initKeyboardShortcuts = function () {
    var kid = null, kobj = null;

    for (kid in config.keys) {
      kobj = config.keys[kid];

      if ('toolActivate' in kobj && kobj.toolActivate in lang.tools) {
        lang.tools[kobj.toolActivate] += ' [ ' + kid + ' ]';
      }

      if ('command' in kobj && kobj.command in lang.commands) {
        lang.commands[kobj.command] += ' [ ' + kid + ' ]';
      }
    }

    return true;
  };

  /**
   * The <code>start</code> event handler for the Canvas resize operation.
   * @private
   */
  this.canvasResizeStart = function () {
    this.container.style.overflow = 'hidden';
    _self.panels.main.bringOnTop();
  };

  /**
   * The <code>end</code> event handler for the Canvas resize operation.
   *
   * @private
   * @param {Object} ev The application event object.
   */
  this.canvasResizeEnd = function (ev) {
    this.container.style.overflow = 'auto';
    app.resizeCanvas(ev.width / app.image.canvasScale,
        ev.height / app.image.canvasScale, true);
  };

  // This is the event handler which shows a temporary status message when hovering buttons/tools.
  this.item_mouseover = function () {
    if (this.title) {
      _self.statusShow(this.title, true);
    } else if (this.textContent) {
      _self.statusShow(this.textContent, true);
    }
  };

  // This simply goes back to the previous status message.
  this.item_mouseout = function () {
    _self.statusShow(-1);
  };

  /**
   * Show a message in the status bar.
   *
   * @param {String|Number} id The message ID you want to display. The ID must 
   * be available in the {@link PaintWeb.lang.status} object. If the value is -1 
   * then the previous non-temporary message will be displayed.
   *
   * @param {Boolean} [temporary=false] Tells if the message is temporary or 
   * not.
   */
  this.statusShow = function (id, temporary) {
    var elem = _self.elems.statusMessage;
    if (id === -1 && elem._prevText === false) {
      return false;
    }

    if (id === -1) {
      id = elem._prevText;
    } else if (!temporary) {
      elem._prevText = id;
    }

    var msg = lang.status[id];

    if (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }

    win.status = msg;

    if (msg) {
      elem.appendChild(doc.createTextNode(msg));
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

  /**
   * The "Help" command. This method displays the "Help" panel.
   */
  this.commandHelp = function () {
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

  /**
   * The <code>click</code> event handler for the tool DOM elements.
   *
   * @private
   *
   * @param {Event} ev The DOM Event object.
   *
   * @see PaintWeb#toolActivate to activate a drawing tool.
   */
  this.toolClick = function (ev) {
    app.toolActivate(this.getAttribute('data-pwTool'), ev);
  };

  /**
   * The <code>toolActivate</code> application event handler. This method 
   * provides visual feedback for the activation of a new drawing tool.
   *
   * @private
   *
   * @param {Object} ev The application event object.
   *
   * @see PaintWeb#toolActivate the method which allows you to activate 
   * a drawing tool.
   */
  this.toolActivate = function (ev) {
    var active = _self.tools[ev.id];
    active.className += ' ' + _self.classPrefix + 'toolActive';

    if (ev.prevId) {
      var prev = _self.tools[ev.prevId];
      prev.className = prev.className.
        replace(' ' + _self.classPrefix + 'toolActive', '');
    }

    _self.statusShow(ev.id + 'Active');
  };

  /**
   * The <code>toolRegister</code> application event handler. This method adds 
   * the new tool into the GUI.
   *
   * @private
   *
   * @param {Object} ev The application event object.
   *
   * @see PaintWeb#toolRegister the method which allows you to register new 
   * tools.
   */
  this.toolRegister = function (ev) {
    var attr = null, elem = null;

    if (ev.id in _self.tools) {
      elem = _self.tools[ev.id];
      attr = elem.getAttribute('data-pwTool');
      if (attr && attr !== ev.id) {
        attr = null;
        elem = null;
        delete _self.tools[ev.id];
      }
    }

    // Create a new element if there's none already associated to the tool ID.
    if (!elem) {
      elem = doc.createElement('li');
    }

    if (!attr) {
      elem.setAttribute('data-pwTool', ev.id);
    }

    elem.className += ' ' + _self.classPrefix + 'tool_' + ev.id;
    elem.title = lang.tools[ev.id];

    elem.removeChild(elem.firstChild);
    elem.appendChild(doc.createTextNode(elem.title));

    elem.addEventListener('click',     _self.toolClick,      false);
    elem.addEventListener('mouseover', _self.item_mouseover, false);
    elem.addEventListener('mouseout',  _self.item_mouseout,  false);

    if (!(ev.id in _self.tools)) {
      _self.tools[ev.id] = elem;
    }

    _self.elems.tools.appendChild(elem);
  };

  /**
   * The <code>toolUnregister</code> application event handler. This method the 
   * tool element from the GUI.
   *
   * @param {Object} ev The application event object.
   *
   * @see PaintWeb#toolUnregister the method which allows you to unregister 
   * tools.
   */
  this.toolUnregister = function (ev) {
    if (ev.id in _self.tools) {
      _self.elems.tools.removeChild(_self.tools[ev.id]);
      delete _self.tools[id];
    } else {
      return;
    }
  };

  /**
   * The <code>commandRegister</code> application event handler. GUI elements 
   * associated to commands are updated to ensure proper user interaction.
   *
   * @private
   *
   * @param {Object} ev The application event object.
   *
   * @see PaintWeb#commandRegister the method which allows you to register new 
   * commands.
   */
  this.commandRegister = function (ev) {
    var elem = _self.commands[ev.id];
    if (!elem) {
      return;
    }

    elem.className += ' ' + _self.classPrefix + 'cmd_' + ev.id;
    elem.title = lang.commands[ev.id];

    // Remove the text content and append the language string associated to this 
    // command.
    elem.removeChild(elem.firstChild);
    elem.appendChild(doc.createTextNode(elem.title));

    elem.addEventListener('click',     this.commands[ev.id], false);
    elem.addEventListener('mouseover', _self.item_mouseover, false);
    elem.addEventListener('mouseout',  _self.item_mouseout,  false);
  };

  /**
   * The <code>commandUnregister</code> application event handler. This method 
   * simply removes all the user interactivity from the GUI element associated 
   * to the command being unregistered.
   *
   * @param {Object} ev The application event object.
   *
   * @see PaintWeb#commandUnregister the method which allows you to unregister 
   * commands.
   */
  this.commandUnregister = function (ev) {
    var elem = _self.commands[ev.id];
    if (!elem) {
      return;
    }

    elem.className = elem.className.replace(' ' + _self.classPrefix + 'cmd_' 
        + ev.id, '');

    elem.removeEventListener('click',     this.commands[ev.id], false);
    elem.removeEventListener('mouseover', _self.item_mouseover, false);
    elem.removeEventListener('mouseout',  _self.item_mouseout,  false);
  };
};

/**
 * @class A floating panel GUI element.
 *
 * @private
 *
 * @param {pwlib.gui} gui Reference to the PaintWeb GUI object.
 *
 * @param {Element} elem Reference to the DOM element you want to transform into 
 * a floating panel.
 */
function guiFloatingPanel (gui, elem) {
  var _self       = this,
      win         = gui.app.win,
      doc         = gui.app.doc,
      panels      = gui.panels,
      zIndex_step = 200;

  // These hold the mouse starting location during the drag operation.
  var mx, my;

  // These hold the panel starting location during the drag operation.
  var ptop, pleft;

  /**
   * Tells if the floating panel is being dragged by the user.
   * @type Boolean
   */
  this.dragging = false;

  /**
   * Reference to the panel element.
   * @type Element
   */
  this.elem = elem;

  /**
   * Initialize the floating panel.
   * @private
   */
  function init () {
    var ttl = elem.getElementsByTagName('h1')[0],
        cs = win.getComputedStyle(elem, null),
        zIndex = parseInt(cs.zIndex);

    // Set the position in the .style for quicker usage by the mousedown handler.
    // If this is not done during initialization, it would need to be done in the mousedown handler.
    elem.style.top    = cs.top;
    elem.style.left   = cs.left;
    elem.style.zIndex = cs.zIndex;

    if (zIndex > panels.zIndex) {
      panels.zIndex = zIndex;
    }

    ttl.addEventListener('mousedown', ev_mousedown, false);
  };

  /**
   * The <code>mousedown</code> event handler. This is invoked when you start 
   * dragging the floating panel.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function ev_mousedown (ev) {
    _self.dragging = true;

    mx = ev.clientX;
    my = ev.clientY;
    ptop  = parseInt(elem.style.top);
    pleft = parseInt(elem.style.left);

    _self.bringOnTop();

    doc.addEventListener('mousemove', ev_mousemove, false);
    doc.addEventListener('mouseup',   ev_mouseup,   false);

    if (ev.preventDefault) {
      ev.preventDefault();
    }
  };

  /**
   * The <code>mousemove</code> event handler. This performs the actual move of 
   * the floating panel.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function ev_mousemove (ev) {
    elem.style.left = (pleft + ev.clientX - mx) + 'px';
    elem.style.top  = (ptop  + ev.clientY - my) + 'px';
  };

  /**
   * The <code>mouseup</code> event handler. This ends the panel drag operation.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function ev_mouseup (ev) {
    _self.dragging = false;

    doc.removeEventListener('mousemove', ev_mousemove, false);
    doc.removeEventListener('mouseup',   ev_mouseup,   false);
  };

  /**
   * Bring the panel to the top. This method makes sure the current floating 
   * panel is visible.
   */
  this.bringOnTop = function () {
    panels.zIndex += zIndex_step;
    elem.style.zIndex = panels.zIndex;
  };

  /**
   * Hide the panel.
   */
  this.hide = function () {
    elem.style.display = 'none';
  };

  /**
   * Hide the panel.
   */
  this.show = function () {
    elem.style.display = 'block';
  };

  init();
};

/**
 * @class Resize handler.
 *
 * @private
 *
 * @param {pwlib.gui} gui Reference to the PaintWeb GUI object.
 *
 * @param {Element} resizeHandle Reference to the resize handle DOM element.  
 * This is the element users will be able to drag to achieve the resize effect 
 * on the <var>container</var> element.
 *
 * @param {Element} container Reference to the container DOM element. This is 
 * the element users will be able to resize using the <var>resizeHandle</var> 
 * element.
 */
function guiResizer (gui, resizeHandle, container) {
  var _self          = this,
      cStyle         = container.style,
      doc            = gui.app.doc,
      guiResizeEnd   = appEvent.guiResizeEnd,
      guiResizeStart = appEvent.guiResizeStart;

  /**
   * Custom application events interface.
   * @type pwlib.appEvents
   */
  this.events = null;

  /**
   * The resize handle DOM element.
   * @type Element
   */
  this.resizeHandle = resizeHandle;

  /**
   * The container DOM element. This is the element that's resized by the user 
   * when he/she drags the resize handle.
   * @type Element
   */
  this.container = container;

  /**
   * Tells if the user resizing the container now.
   * @type Boolean
   */
  this.resizing = false;

  // The initial position of the mouse.
  var mx = 0, my = 0;

  // The initial container dimensions.
  var cWidth = 0, cHeight = 0;

  /**
   * Initialize the resize functionality.
   * @private
   */
  function init () {
    _self.events = new pwlib.appEvents(_self);
    resizeHandle.addEventListener('mousedown', ev_mousedown, false);
  };

  /**
   * The <code>mousedown</code> event handler. This starts the resize operation.
   *
   * <p>This function dispatches the {@link pwlib.appEvent.guiResizeStart} 
   * event.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function ev_mousedown (ev) {
    mx = ev.clientX;
    my = ev.clientY;
    cWidth  = parseInt(cStyle.width);
    cHeight = parseInt(cStyle.height);

    var cancel = _self.events.dispatch(new guiResizeStart(mx, my, cWidth, 
          cHeight));

    if (cancel) {
      return;
    }

    _self.resizing = true;
    doc.addEventListener('mousemove', ev_mousemove, false);
    doc.addEventListener('mouseup',   ev_mouseup,   false);

    if (ev.preventDefault) {
      ev.preventDefault();
    }

    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
  };

  /**
   * The <code>mousemove</code> event handler. This performs the actual resizing 
   * of the <var>container</var> element.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function ev_mousemove (ev) {
    cStyle.width  = (cWidth  + ev.clientX - mx) + 'px';
    cStyle.height = (cHeight + ev.clientY - my) + 'px';
  };

  /**
   * The <code>mouseup</code> event handler. This ends the resize operation.
   *
   * <p>This function dispatches the {@link pwlib.appEvent.guiResizeEnd} event.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function ev_mouseup (ev) {
    var w = cWidth  + ev.clientX - mx,
        h = cHeight + ev.clientY - my,
        cancel = _self.events.dispatch(new guiResizeEnd(mx, my, w, h));

    cStyle.width  = w + 'px';
    cStyle.height = h + 'px';

    if (cancel) {
      return;
    }

    _self.resizing = false;
    doc.removeEventListener('mousemove', ev_mousemove, false);
    doc.removeEventListener('mouseup',   ev_mouseup,   false);
  };

  init();
};

/**
 * @class The tabbed panel GUI component.
 *
 * @private
 *
 * @param {pwlib.gui} gui Reference to the PaintWeb GUI object.
 *
 * @param {Element} panel Reference to the panel DOM element.
 */
function guiTabPanel (gui, panel) {
  var _self = this,
      doc   = gui.app.doc,
      lang  = gui.app.lang;

  /**
   * Custom application events interface.
   * @type pwlib.appEvents
   */
  this.events = null;

  /**
   * Panel ID. The ID is determined automatically based on the panel DOM element 
   * ID.
   * @type String.
   */
  this.id = null;

  /**
   * Holds references to the DOM element of each tab and tab button.
   * @type Object
   */
  this.tabs = {};

  /**
   * Reference to the tab buttons DOM element.
   * @type Element
   */
  this.tabButtons = null;

  /**
   * The panel container DOM element.
   * @type Element
   */
  this.container = panel;

  /**

  /**
   * Holds the ID of the currently active tab.
   * @type String
   */
  this.tabId = null;

  /**
   * Holds the ID of the previously active tab.
   *
   * @private
   * @type String
   */
  var prevTabId_ = null;

  /**
   * Initialize the toolbar functionality.
   * @private
   */
  function init () {
    _self.events = new pwlib.appEvents(_self);
    _self.id = _self.container.id.replace(new RegExp('^' + gui.idPrefix), '');

    var tabButtons = doc.createElement('ul'),
        tabButton = null,
        childNodes = _self.container.childNodes,
        n = childNodes.length,
        type = Node.ELEMENT_NODE,
        elem = null,
        tabId = null,
        tabTitle = null;

    tabButtons.className = gui.classPrefix + 'tabs';

    // Find all the tabs in the current toolbar container element.
    for (var i = 0; elem = childNodes[i]; i++) {
      if (elem.nodeType !== type) {
        continue;
      }

      // A tab is any element with a given data-pwTab attribute.
      tabId = elem.getAttribute('data-pwTab');
      if (!tabId) {
        continue;
      }

      elem.className += ' ' + gui.classPrefix + _self.id + '_' + tabId;
      tabTitle = lang.tabs[_self.id][tabId];

      tabButton = doc.createElement('li');
      tabButton._PaintWebTab = tab;
      tabButton.title = tabTitle;
      tabButton.appendChild(doc.createTextNode(tabTitle));
      tabButton.addEventListener('click', ev_tabClick, false);

      if (!_self.tabId) {
        _self.tabId = tabId;
        tabButton.className = gui.classPrefix + 'tabActive';
      } else {
        prevTabId_ = tabId;
        elem.style.display = 'none';
      }

      _self.tabs[tabId] = {container: elem, button: tabButton};

      tabButtons.appendChild(tabButton);
    }

    _self.tabButtons = tabButtons;
    _self.container.appendChild(tabButtons);
  };

  /**
   * The <code>click</code> event handler for tab buttons. This function simply 
   * activates the tab the user clicked.
   * @private
   */
  function ev_tabClick (ev) {
    if (this._PaintWebTab) {
      _self.tabActivate(this._PaintWebTab);
    }
  };

  /**
   * Activate a tab by ID.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.guiTabActivate} event.
   *
   * @param {String} tabId The ID of the tab you want to activate.
   * @returns {Boolean} True if the tab has been activated successfully, or 
   * false if not.
   */
  this.tabActivate = function (tabId) {
    if (!(tabId in this.tabs)) {
      return false;
    } else if (tabId === this.tabId) {
      return true;
    }

    var ev = new appEvent.guiTabActivate(tabId, this.tabId),
        cancel = this.events.dispatch(ev),
        elem = null,
        tabButton = null;

    if (cancel) {
      return false;
    }

    // Deactivate the currently active tab.
    if (this.tabId in this.tabs) {
      elem = this.tabs[this.tabId].container;
      elem.style.display = 'none';
      tabButton = this.tabs[this.tabId].button;
      tabButton.className = '';
      prevTabId_ = this.tabId;
    }

    // Activate the new tab.
    elem = this.tabs[tabId].container;
    elem.style.display = '';
    tabButton = this.tabs[tabId].button;
    tabButton.className = gui.classPrefix + 'tabActive';
    this.tabId = tabId;

    return true;
  };

  /**
   * Hide a tab by ID.
   *
   * @param {String} tabId The ID of the tab you want to hide.
   * @returns {Boolean} True if the tab has been hidden successfully, or false 
   * if not.
   */
  this.tabHide = function (tabId) {
    if (!(tabId in this.tabs)) {
      return false;
    }

    if (this.tabId === tabId) {
      this.tabActivate(prevTabId_);
    }

    this.tabs[tabId].button.style.display = 'none';

    return true;
  };

  /**
   * Show a tab by ID.
   *
   * @param {String} tabId The ID of the tab you want to show.
   * @returns {Boolean} True if the tab has been displayed successfully, or 
   * false if not.
   */
  this.tabShow = function (tabId) {
    if (!(tabId in this.tabs)) {
      return false;
    }

    this.tabs[tabId].button.style.display = '';

    return true;
  };

  init();
};

/**
 * @class The GUI element resize start event. This event is cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {Number} x The mouse location on the x-axis.
 * @param {Number} y The mouse location on the y-axis.
 * @param {Number} width The element width.
 * @param {Number} height The element height.
 */
appEvent.guiResizeStart = function (x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;

  appEvent.call(this, 'guiResizeStart', true);
};

/**
 * @class The GUI element resize end event. This event is cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {Number} x The mouse location on the x-axis.
 * @param {Number} y The mouse location on the y-axis.
 * @param {Number} width The element width.
 * @param {Number} height The element height.
 */
appEvent.guiResizeEnd = function (x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;

  appEvent.call(this, 'guiResizeEnd', true);
};

/**
 * @class The GUI tab activation event. This event is cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {String} tabId The ID of the tab being activated.
 * @param {String} prevTabId The ID of the previously active tab.
 */
appEvent.guiTabActivate = function (tabId, prevTabId) {
  this.tabId = tabId;
  this.prevTabId = prevTabId;

  appEvent.call(this, 'guiTabActivate', true);
};

})();

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

