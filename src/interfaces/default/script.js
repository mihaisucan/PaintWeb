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
 * $Date: 2009-06-17 21:10:38 +0300 $
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
  var _self     = this,
      config    = app.config,
      doc       = app.doc,
      lang      = app.lang,
      MathRound = Math.round,
      pwlib     = window.pwlib,
      appEvent  = pwlib.appEvent,
      win       = app.win;

  this.app = app;
  this.idPrefix = 'paintweb' + app.UID + '_',
  this.classPrefix = 'paintweb_';

  /**
   * Holds references to DOM elements.
   * @type Object
   */
  this.elems = {};

  /**
   * Holds references to DOM elements which hold inputs for the PaintWeb 
   * configuration.
   * @type Object
   */
  this.inputs = {};

  /**
   * Holds references to DOM elements which holds input configuration values.
   * @type Object
   */
  this.inputValues = {};

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
   * Holds references to floating panels GUI components.
   * @type Object
   */
  this.floatingPanels = {zIndex_: 0};

  /**
   * Holds references to tab panel GUI components.
   * @type Object
   */
  this.tabPanels = {};

  /**
   * Holds an instance of the guiResizer object attached to the Canvas.
   *
   * @private
   * @type guiResizer
   */
  this.canvasResizer = null;

  /**
   * Holds tab configuration information for most drawing tools.
   * @type Object
   */
  this.toolTabConfig = {
    bcurve: {
      lineTab: true,
      shapeType: true,
      lineWidth: true,
      lineWidthLabel: lang.inputs.borderWidth,
      lineCap: true
    },
    ellipse: {
      lineTab: true,
      shapeType: true,
      lineWidth: true,
      lineWidthLabel: lang.inputs.borderWidth
    },
    rectangle: {
      lineTab: true,
      shapeType: true,
      lineWidth: true,
      lineWidthLabel: lang.inputs.borderWidth,
      lineJoin: true
    },
    polygon: {
      lineTab: true,
      shapeType: true,
      lineWidth: true,
      lineWidthLabel: lang.inputs.borderWidth,
      lineJoin: true,
      lineCap: true,
      miterLimit: true
    },
    eraser: {
      lineTab: true,
      lineWidth: true,
      lineWidthLabel: lang.inputs.eraserSize,
      lineJoin: true,
      lineCap: true,
      miterLimit: true
    },
    pencil: {
      lineTab: true,
      lineWidth: true,
      lineWidthLabel: lang.inputs.pencilSize,
      lineJoin: true,
      lineCap: true,
      miterLimit: true
    },
    line: {
      lineTab: true,
      lineWidth: true,
      lineWidthLabel: lang.inputs.line.lineWidth,
      lineJoin: true,
      lineCap: true,
      miterLimit: true
    },
    text: {
      lineTab: true,
      lineTabLabel: lang.tabs.textBorder,
      lineWidth: true,
      lineWidthLabel: lang.inputs.borderWidth
    }
  };

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
    var placeholder = config.guiPlaceholder;
    placeholder.style.visibility = 'hidden';
    placeholder.style.position = 'absolute';
    placeholder.style.height = '1px';
    placeholder.style.overflow = 'hidden';
    placeholder.className += ' ' + this.classPrefix + 'placeholder';

    if (!this.initImportDoc(markupDoc)) {
      app.initError(lang.guiMarkupImportFailed);
      return false;
    }

    if (!this.initParseMarkup()) {
      app.initError(lang.guiMarkupParseFailed);
      return false;
    }

    if (!this.initCanvas() ||
        !this.initImageZoom() ||
        !this.initSelection() ||
        !this.initKeyboardShortcuts()) {
      return false;
    }

    // Setup the main tabbed panel.
    var tab = null, panel = this.tabPanels.main;
    if (!panel) {
      app.initError(lang.noMainTabPanel);
      return false;
    }

    // Hide the "Shadow" tab if the drawing of shadows is not supported.
    if (!app.shadowSupported && 'shadow' in panel.tabs) {
      panel.tabHide('shadow');
    }

    // Setup the viewport height.
    if ('viewport' in this.elems) {
      this.elems.viewport.style.height = config.viewportHeight + 'px';
    }

    // Setup the Canvas resizer.
    var resizeHandle = this.elems.canvasResizer;
    if (!resizeHandle) {
      app.initError(lang.missingCanvasResizer);
      return false;
    }
    resizeHandle.title = lang.guiCanvasResizer;
    resizeHandle.removeChild(resizeHandle.firstChild);
    resizeHandle.appendChild(doc.createTextNode(lang.guiCanvasResizer));
    resizeHandle.addEventListener('mouseover', this.item_mouseover, false);
    resizeHandle.addEventListener('mouseout',  this.item_mouseout,  false);

    this.canvasResizer = new guiResizer(this, resizeHandle, 
        this.elems.canvasContainer);

    this.canvasResizer.events.add('guiResizeStart', this.canvasResizeStart);
    this.canvasResizer.events.add('guiResizeEnd',   this.canvasResizeEnd);

    if ('statusMessage' in this.elems) {
      this.elems.statusMessage._prevText = false;
    }

    // Update the version string in Help.
    if ('version' in this.elems) {
      this.elems.version.appendChild(doc.createTextNode(app.toString()));
    }

    // Update the image dimensions in the GUI.
    var imageSize = this.elems.imageSize;
    if (imageSize) {
      imageSize.removeChild(imageSize.firstChild);
      imageSize.appendChild(doc.createTextNode(app.image.width + 'x' 
            + app.image.height));
    }

    // Add application-wide event listeners.
    app.events.add('canvasSizeChange',  this.canvasSizeChange);
    app.events.add('commandRegister',   this.commandRegister);
    app.events.add('commandUnregister', this.commandUnregister);
    app.events.add('configChange',      this.configChangeHandler);
    app.events.add('imageSizeChange',   this.imageSizeChange);
    app.events.add('imageZoom',         this.imageZoom);
    app.events.add('initApp',           this.initApp);
    app.events.add('shadowAllow',       this.shadowAllow);
    app.events.add('toolActivate',      this.toolActivate);
    app.events.add('toolRegister',      this.toolRegister);
    app.events.add('toolUnregister',    this.toolUnregister);

    // Make sure the historyUndo and historyRedo command elements are 
    // synchronized with the application history state.
    if ('historyUndo' in this.commands && 'historyRedo' in this.commands) {
      app.events.add('historyUpdate', this.historyUpdate);
    }

    app.commandRegister('help', this.commandHelp);

    return true;
  };

  /**
   * Initialize the Canvas elements.
   *
   * @private
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.initCanvas = function () {
    var canvasContainer = this.elems.canvasContainer,
        layerCanvas     = app.layer.canvas,
        layerContext    = app.layer.context,
        layerStyle      = layerCanvas.style,
        bufferCanvas    = app.buffer.canvas;

    if (!canvasContainer) {
      app.initError(lang.missingCanvasContainer);
      return false;
    }

    var containerStyle  = canvasContainer.style;

    canvasContainer.className = this.classPrefix + 'canvasContainer';
    layerCanvas.className     = this.classPrefix + 'layerCanvas';
    bufferCanvas.className    = this.classPrefix + 'bufferCanvas';

    containerStyle.width  = layerStyle.width;
    containerStyle.height = layerStyle.height;

    canvasContainer.appendChild(layerCanvas);
    canvasContainer.appendChild(bufferCanvas);
    canvasContainer.style.backgroundColor = config.backgroundColor;

    // Make sure the selection transparency input checkbox is disabled if the 
    // putImageData and getImageData methods are unsupported.
    if ('selection_transparent' in this.inputs && (!layerContext.putImageData || 
          !layerContext.getImageData)) {
      this.inputs.selection_transparent.disabled = true;
      this.inputs.selection_transparent.checked = true;
    }

    return true;
  };

  /**
   * Import the DOM nodes from the interface DOM document. All the nodes are 
   * inserted into the {@link PaintWeb.config.guiPlaceholder} element.
   *
   * <p>Elements which have the ID attribute will have the attribute renamed to 
   * <code>data-pwId</code>.
   *
   * @private
   *
   * @param {Document} srcDoc The source DOM document to import the nodes from.
   *
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.initImportDoc = function (srcDoc) {
    // I could use some XPath here, but for the sake of compatibility I don't.

    var destElem = config.guiPlaceholder,
        elem = null,
        elType = Node.ELEMENT_NODE,
        nodes = srcDoc.getElementsByTagName('*');

    // Change all the id attributes to be data-pwId attributes.
    for (var i = 0; i < nodes.length; i++) {
      elem = nodes[i];
      if (elem.nodeType !== elType) {
        continue;
      }

      if (elem.id) {
        elem.setAttribute('data-pwId', elem.id);
        elem.removeAttribute('id');
      }
    }

    var docChildren = srcDoc.documentElement.childNodes;
    n = docChildren.length;

    // Import all the nodes.
    for (i = 0; i < n; i++) {
      destElem.appendChild(doc.importNode(docChildren[i], true));
    }

    return true;
  };

  /**
   * Parse the interface markup. The layout file can have custom 
   * PaintWeb-specific attributes.
   *
   * <p>Elements with the <code>data-pwId</code> attribute are added to 
   * <var>this.elems</var> object.
   *
   * <p>Elements having the <code>data-pwCommand</code> attribute are added to 
   * the <var>this.commands</var> object.
   *
   * <p>Elements having the <code>data-pwTool</code> attribute are added to the 
   * <var>this.tools</var> object.
   *
   * <p>Elements having the <code>data-pwTabPanel</code> attribute are added to 
   * the <var>this.tabPanels</var> object. These become interactive GUI 
   * components (see {@link guiTabPanel}).
   *
   * <p>Elements having the <code>data-pwFloatingPanel</code> attribute are 
   * added to the <var>this.floatingPanels</var> object. These become 
   * interactive GUI components (see {@link guiFloatingPanel}).
   *
   * <p>Elements having the <code>data-pwConfig</code> attribute are added to 
   * the <var>this.inputs</var> object. These become interactive GUI components 
   * which allow users to change configuration options.
   *
   * <p>Elements having the <code>data-pwConfigValue</code> attribute are added 
   * to the <var>this.inputValues</var> object. These can only be child nodes of 
   * elements which have the <code>data-pwConfig</code> attribute.
   *
   * @returns {Boolean} True if the parsing was successful, or false if not.
   */
  this.initParseMarkup = function () {
    var nodes = config.guiPlaceholder.getElementsByTagName('*'),
        elType = Node.ELEMENT_NODE,
        elem, tag, isInput, tool, tabPanel, floatingPanel, cmd, id, cfgAttr, 
        cfgGroup, cfgProp;

    // Store references to important elements and parse PaintWeb-specific 
    // attributes.
    for (var i = 0; i < nodes.length; i++) {
      elem = nodes[i];
      if (elem.nodeType !== elType) {
        continue;
      }
      tag = elem.tagName.toLowerCase();
      isInput = tag === 'input' || tag === 'select';

      // Store references to commands.
      cmd = elem.getAttribute('data-pwCommand');
      if (cmd && !(cmd in this.commands)) {
        elem.className += ' ' + this.classPrefix + 'command';
        this.commands[cmd] = elem;
      }

      // Store references to tools.
      tool = elem.getAttribute('data-pwTool');
      if (tool && !(tool in this.tools)) {
        elem.className += ' ' + this.classPrefix + 'tool';
        this.tools[tool] = elem;
      }

      // Create tab panels.
      tabPanel = elem.getAttribute('data-pwTabPanel');
      if (tabPanel) {
        this.tabPanels[tabPanel] = new guiTabPanel(this, elem);
      }

      // Create floating panels.
      floatingPanel = elem.getAttribute('data-pwFloatingPanel');
      if (floatingPanel) {
        this.floatingPanels[floatingPanel] = new guiFloatingPanel(this, elem);
      }

      cfgAttr = elem.getAttribute('data-pwConfig');
      if (cfgAttr) {
        this.initConfigInput(elem, cfgAttr, isInput);
      }

      id = elem.getAttribute('data-pwId');
      if (id) {
        elem.className += ' ' + this.classPrefix + id;

        // Store a reference to the element.
        if (isInput && !cfgAttr) {
          this.inputs[id] = elem;
        } else if (!isInput) {
          this.elems[id] = elem;
        }
      }
    }

    return true;
  };

  /**
   * Initialize an element associated to a configuration property.
   *
   * @private
   *
   * @param {Element} elem The DOM element which is associated to the 
   * configuration property.
   *
   * @param {String} cfgAttr The configuration attribute. This tells the 
   * configuration group and property to which the DOM element is attached to.
   *
   * @param {Boolean} isInput Tells if the element is considered an input or an 
   * element with several sub-values.
   */
  this.initConfigInput = function (input, cfgAttr, isInput) {
    var cfgNoDots = cfgAttr.replace('.', '_'),
        cfgArray = cfgAttr.split('.'),
        cfgProp = cfgArray.pop(),
        n = cfgArray.length,
        cfgGroup = cfgArray.join('.'),
        cfgGroupRef = config,
        langGroup = lang.inputs,
        labelElem;

    for (var i = 0; i < n; i++) {
      cfgGroupRef = cfgGroupRef[cfgArray[i]];
      langGroup = langGroup[cfgArray[i]];
    }

    input._pwConfigProperty = cfgProp;
    input._pwConfigGroup = cfgGroup;
    input._pwConfigGroupRef = cfgGroupRef;
    input.title = langGroup[cfgProp + 'Title'] || langGroup[cfgProp];
    input.className += ' ' + this.classPrefix + 'cfg_' + cfgNoDots;

    this.inputs[cfgNoDots] = input;

    if (isInput) {
      labelElem = input.parentNode;

      if (input.type === 'checkbox') {
        labelElem.removeChild(labelElem.lastChild);
        labelElem.appendChild(doc.createTextNode(langGroup[cfgProp]));
        input.checked = cfgGroupRef[cfgProp];
      } else {
        labelElem.removeChild(labelElem.firstChild);
        labelElem.insertBefore(doc.createTextNode(langGroup[cfgProp]), input);
        input.value = cfgGroupRef[cfgProp];
      }

      input.addEventListener('change', this.configInputChange, false);
      return;
    }

    labelElem = input.getElementsByTagName('p')[0];
    labelElem.removeChild(labelElem.firstChild);
    labelElem.appendChild(doc.createTextNode(langGroup[cfgProp]));

    // If this is not an input we consider it has child elements with 
    // data-pwConfigValue attributes.
    var elem, anchor, val,
        className = ' ' + this.classPrefix + 'configActive';
        nodes = input.getElementsByTagName('*'),
        elType = Node.ELEMENT_NODE;

    for (var i = 0; i < nodes.length; i++) {
      elem = nodes[i];
      if (elem.nodeType !== elType) {
        continue;
      }

      val = elem.getAttribute('data-pwConfigValue');
      if (!val) {
        continue;
      }

      anchor = doc.createElement('a');
      anchor.href = '#';
      anchor.title = langGroup[cfgProp + '_' + val];
      anchor.appendChild(doc.createTextNode(anchor.title));

      elem.className += ' ' + this.classPrefix + cfgProp + '_' + val 
        + ' paintweb_icon';
      elem._pwConfigParent = input;

      if (cfgGroupRef[cfgProp] == val) {
        elem.className += className;
      }

      anchor.addEventListener('click',     this.configValueClick, false);
      anchor.addEventListener('mouseover', this.item_mouseover,   false);
      anchor.addEventListener('mouseout',  this.item_mouseout,    false);

      elem.removeChild(elem.firstChild);
      elem.appendChild(anchor);

      this.inputValues[cfgGroup + '_' + cfgProp + '_' + val] = elem;
    }
  };

  /**
   * Initialize the image zoom input.
   *
   * @private
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.initImageZoom = function () {
    var input = this.inputs.imageZoom;
    if (!input) {
      return true; // allow layouts without the zoom input
    }

    input.value = 100;
    input._old_value = 100;

    // Override the attributes, based on the settings.
    input.setAttribute('step', config.imageZoomStep * 100);
    input.setAttribute('max',  config.imageZoomMax  * 100);
    input.setAttribute('min',  config.imageZoomMin  * 100);

    //elem.addEventListener('keypress', this.ev_input_nr, false);
    input.addEventListener('change', function () {
      app.imageZoomTo(parseInt(this.value) / 100);
    }, false);

    // Update some language strings

    var label = input.parentNode;
    if (label.tagName.toLowerCase() === 'label') {
      label.removeChild(label.firstChild);
      label.insertBefore(doc.createTextNode(lang.imageZoomLabel), input);
    }

    var elem = this.elems.statusZoom;
    if (!elem) {
      return true;
    }

    elem.title = lang.imageZoomTitle;

    return true;
  };

  /**
   * Initialize GUI elements associated to the selection tool.
   *
   * @private
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.initSelection = function () {
    var classDisabled = ' ' + this.classPrefix + 'disabled',
        cut   = this.commands.selectionCut,
        copy  = this.commands.selectionCopy,
        paste = this.commands.clipboardPaste;

    if (paste) {
      app.events.add('clipboardUpdate', this.clipboardUpdate);
      paste.className += classDisabled;

    }

    if (cut && copy) {
      app.events.add('selectionChange', this.selectionChange);
      cut.className  += classDisabled;
      copy.className += classDisabled;
    }

    var selTab_cmds = ['selectionCut', 'selectionCopy', 'clipboardPaste'],
        anchor, elem, cmd;

    for (var i = 0, n = selTab_cmds.length; i < n; i++) {
      cmd = selTab_cmds[i];
      elem = this.elems['selTab_' + cmd];
      if (!elem) {
        continue;
      }

      anchor = doc.createElement('a');
      anchor.title = lang.commands[cmd];
      anchor.href = '#';
      anchor.appendChild(doc.createTextNode(anchor.title));
      anchor.addEventListener('click', this.commandClick, false);

      elem.className += classDisabled + ' ' + this.classPrefix + 'command' 
        + ' ' + this.classPrefix + 'cmd_' + cmd;
      elem.setAttribute('data-pwCommand', cmd);
      elem.removeChild(elem.firstChild);
      elem.appendChild(anchor);
    }

    var selCrop   = this.commands.selectionCrop,
        selFill   = this.commands.selectionFill,
        selDelete = this.commands.selectionDelete;

    selCrop.className   += classDisabled;
    selFill.className   += classDisabled;
    selDelete.className += classDisabled;

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
   * The <code>initApp</code> event handler. This method is invoked once 
   * PaintWeb completes all the loading.
   *
   * @private
   * @param {pwlib.appEvent.initApp} ev The application event object.
   */
  this.initApp = function (ev) {
    // Initialization was not successful ...
    if (ev.state !== PaintWeb.INIT_DONE) {
      return;
    }

    // Make PaintWeb visible.
    var placeholder = this.config.guiPlaceholder.style;
    placeholder.visibility = '';
    placeholder.position = '';
    placeholder.height = '';
    placeholder.overflow = 'visible';
  };

  /**
   * The <code>guiResizeStart</code> event handler for the Canvas resize 
   * operation.
   * @private
   */
  this.canvasResizeStart = function () {
    this.resizeHandle.style.display = 'none';

    // ugly...
    this.timeout_ = setTimeout(function () {
      _self.statusShow('guiCanvasResizerActive', true)
      clearTimeout(_self.canvasResizer.timeout_);
      delete _self.canvasResizer.timeout_;
    }, 400);
  };

  /**
   * The <code>guiResizeEnd</code> event handler for the Canvas resize 
   * operation.
   *
   * @private
   * @param {pwlib.appEvent.guiResizeEnd} ev The application event object.
   */
  this.canvasResizeEnd = function (ev) {
    this.resizeHandle.style.display = '';

    app.imageCrop(0, 0, ev.width / app.image.canvasScale,
        ev.height / app.image.canvasScale);

    if (this.timeout_) {
      clearTimeout(this.timeout_);
      delete this.timeout_;
    } else {
      _self.statusShow(-1);
    }
  };

  /**
   * The <code>mouseover</code> event handler for all tools, commands and icons.  
   * This simply shows the title / text content of the element in the GUI status 
   * bar.
   *
   * @see this#statusShow The method used for displaying the message in the GUI 
   * status bar.
   */
  this.item_mouseover = function () {
    if (this.title || this.textConent) {
      _self.statusShow(this.title || this.textContent, true);
    }
  };

  /**
   * The <code>mouseout</code> event handler for all tools, commands and icons.  
   * This method simply resets the GUI status bar to the previous message it was 
   * displaying before the user hovered the current element.
   *
   * @see this#statusShow The method used for displaying the message in the GUI 
   * status bar.
   */
  this.item_mouseout = function () {
    _self.statusShow(-1);
  };

  /**
   * Show a message in the status bar.
   *
   * @param {String|Number} msg The message ID you want to display. The ID 
   * should be available in the {@link PaintWeb.lang.status} object. If the 
   * value is -1 then the previous non-temporary message will be displayed. If 
   * the ID is not available in the language file, then the string is shown 
   * as-is.
   *
   * @param {Boolean} [temporary=false] Tells if the message is temporary or 
   * not.
   */
  this.statusShow = function (msg, temporary) {
    var elem = this.elems.statusMessage;
    if (msg === -1 && elem._prevText === false) {
      return false;
    }

    if (msg === -1) {
      msg = elem._prevText;
    }

    if (msg in lang.status) {
      msg = lang.status[msg];
    }

    if (!temporary) {
      elem._prevText = msg;
    }

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
    app.toolActivate(this.parentNode.getAttribute('data-pwTool'), ev);
    ev.preventDefault();
  };

  /**
   * The <code>toolActivate</code> application event handler. This method 
   * provides visual feedback for the activation of a new drawing tool.
   *
   * @private
   *
   * @param {pwlib.appEvent.toolActivate} ev The application event object.
   *
   * @see PaintWeb#toolActivate the method which allows you to activate 
   * a drawing tool.
   */
  this.toolActivate = function (ev) {
    var tabAnchor,
        tabConfig = _self.toolTabConfig[ev.id] || {},
        tabPanel = _self.tabPanels.main,
        lineTab = tabPanel.tabs.line,
        tabActive = _self.tools[ev.id],
        shapeType = _self.inputs.shapeType,
        lineWidth = _self.inputs.line_lineWidth,
        lineCap = _self.inputs.line_lineCap,
        lineJoin = _self.inputs.line_lineJoin,
        miterLimit = _self.inputs.line_miterLimit,
        lineWidthLabel = null;

    tabActive.className += ' ' + _self.classPrefix + 'toolActive';
    _self.statusShow(ev.id + 'Active');

    // show/hide the shapeType input config.
    if (shapeType) {
      if (tabConfig.shapeType) {
        shapeType.style.display = '';
      } else {
        shapeType.style.display = 'none';
      }
    }

    if (ev.prevId) {
      var prevTab = _self.tools[ev.prevId],
          prevTabConfig = _self.toolTabConfig[ev.prevId] || {};

      prevTab.className = prevTab.className.
        replace(' ' + _self.classPrefix + 'toolActive', '');

      // hide the line tab
      if (prevTabConfig.lineTab && lineTab) {
        tabPanel.tabHide('line');
        lineTab.container.className = lineTab.container.className.
          replace(' ' + _self.classPrefix + 'main_line_' + ev.prevId, 
              ' ' + _self.classPrefix + 'main_line');
      }

      // hide the tab for the current tool.
      if (ev.prevId in tabPanel.tabs) {
        tabPanel.tabHide(ev.prevId);
      }
    }

    // Change the label of the lineWidth input element.
    if (tabConfig.lineWidthLabel) {
      lineWidthLabel = lineWidth.parentNode;
      lineWidthLabel.removeChild(lineWidthLabel.firstChild);
      lineWidthLabel.insertBefore(doc.createTextNode(tabConfig.lineWidthLabel), 
          lineWidthLabel.firstChild);

    }

    if (lineJoin) {
      if (tabConfig.lineJoin) {
        lineJoin.style.display = '';
      } else {
        lineJoin.style.display = 'none';
      }
    }

    if (lineCap) {
      if (tabConfig.lineCap) {
        lineCap.style.display = '';
      } else {
        lineCap.style.display = 'none';
      }
    }

    if (miterLimit) {
      if (tabConfig.miterLimit) {
        miterLimit.parentNode.parentNode.style.display = '';
      } else {
        miterLimit.parentNode.parentNode.style.display = 'none';
      }
    }

    if (lineWidth) {
      if (tabConfig.lineWidth) {
        lineWidth.parentNode.parentNode.style.display = '';
      } else {
        lineWidth.parentNode.parentNode.style.display = 'none';
      }
    }

    // show the line tab, if configured
    if (tabConfig.lineTab && 'line' in tabPanel.tabs) {
      tabAnchor = lineTab.button.firstChild;
      tabAnchor.title = tabConfig.lineTabLabel || lang.tabs.main[ev.id];
      tabAnchor.removeChild(tabAnchor.firstChild);
      tabAnchor.appendChild(doc.createTextNode(tabAnchor.title));

      if (ev.id !== 'line') {
        lineTab.container.className = lineTab.container.className.
            replace(' ' + _self.classPrefix + 'main_line', ' ' + _self.classPrefix 
                + 'main_line_' + ev.id);
      }

      tabPanel.tabShow('line');
    }

    // show the tab for the current tool, if there's one.
    if (ev.id in tabPanel.tabs) {
      tabPanel.tabShow(ev.id);
    }
  };

  /**
   * The <code>toolRegister</code> application event handler. This method adds 
   * the new tool into the GUI.
   *
   * @private
   *
   * @param {pwlib.appEvent.toolRegister} ev The application event object.
   *
   * @see PaintWeb#toolRegister the method which allows you to register new 
   * tools.
   */
  this.toolRegister = function (ev) {
    var attr = null, elem = null, anchor = null;

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

    // Append an anchor element which holds the locale string.
    anchor = doc.createElement('a');
    anchor.title = lang.tools[ev.id];
    anchor.href = '#';
    anchor.appendChild(doc.createTextNode(anchor.title));

    elem.removeChild(elem.firstChild);
    elem.appendChild(anchor);

    anchor.addEventListener('click',     _self.toolClick,      false);
    anchor.addEventListener('mouseover', _self.item_mouseover, false);
    anchor.addEventListener('mouseout',  _self.item_mouseout,  false);

    if (!(ev.id in _self.tools)) {
      _self.tools[ev.id] = elem;
      _self.elems.tools.appendChild(elem);
    }
  };

  /**
   * The <code>toolUnregister</code> application event handler. This method the 
   * tool element from the GUI.
   *
   * @param {pwlib.appEvent.toolUnregister} ev The application event object.
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
   * The <code>click</code> event handler for the command DOM elements.
   *
   * @private
   *
   * @param {Event} ev The DOM Event object.
   *
   * @see PaintWeb#commandRegister to register a new command.
   */
  this.commandClick = function (ev) {
    var cmd = this.parentNode.getAttribute('data-pwCommand');
    if (cmd && cmd in app.commands) {
      app.commands[cmd].call(this, ev);
    }
    ev.preventDefault();
  };

  /**
   * The <code>commandRegister</code> application event handler. GUI elements 
   * associated to commands are updated to ensure proper user interaction.
   *
   * @private
   *
   * @param {pwlib.appEvent.commandRegister} ev The application event object.
   *
   * @see PaintWeb#commandRegister the method which allows you to register new 
   * commands.
   */
  this.commandRegister = function (ev) {
    var elem   = _self.commands[ev.id],
        anchor = null;
    if (!elem) {
      return;
    }

    elem.className += ' ' + _self.classPrefix + 'cmd_' + ev.id;

    anchor = doc.createElement('a');
    anchor.title = lang.commands[ev.id];
    anchor.href = '#';
    anchor.appendChild(doc.createTextNode(anchor.title));

    // Remove the text content and append the locale string associated to 
    // current command inside an anchor element (for better keyboard 
    // accessibility).
    if (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
    elem.appendChild(anchor);

    anchor.addEventListener('click',     _self.commandClick,   false);
    anchor.addEventListener('mouseover', _self.item_mouseover, false);
    anchor.addEventListener('mouseout',  _self.item_mouseout,  false);
  };

  /**
   * The <code>commandUnregister</code> application event handler. This method 
   * simply removes all the user interactivity from the GUI element associated 
   * to the command being unregistered.
   *
   * @param {pwlib.appEvent.commandUnregister} ev The application event object.
   *
   * @see PaintWeb#commandUnregister the method which allows you to unregister 
   * commands.
   */
  this.commandUnregister = function (ev) {
    var elem   = _self.commands[ev.id],
        anchor = null;
    if (!elem) {
      return;
    }

    elem.className = elem.className.replace(' ' + _self.classPrefix + 'cmd_' 
        + ev.id, '');

    anchor = elem.firstChild;
    anchor.removeEventListener('click',     this.commands[ev.id], false);
    anchor.removeEventListener('mouseover', _self.item_mouseover, false);
    anchor.removeEventListener('mouseout',  _self.item_mouseout,  false);

    elem.removeChild(anchor);
  };

  /**
   * The <code>historyUpdate</code> application event handler. GUI elements 
   * associated to the <code>historyUndo</code> and to the 
   * <code>historyRedo</code> commands are updated such that they are either 
   * enabled or disabled, depending on the current history position.
   *
   * @param {pwlib.appEvent.historyUpdate} ev The application event object.
   * @see PaintWeb#historyGoto the method which allows you to go to different 
   * history states.
   */
  this.historyUpdate = function (ev) {
    var undoElem  = _self.commands.historyUndo,
        undoState = false,
        redoElem  = _self.commands.historyRedo,
        redoState = false,
        className = ' ' + _self.classPrefix + 'disabled',
        undoElemState = undoElem.className.indexOf(className) === -1,
        redoElemState = redoElem.className.indexOf(className) === -1;

    if (ev.currentPos > 1) {
      undoState = true;
    }
    if (ev.currentPos < ev.states) {
      redoState = true;
    }

    if (undoElemState !== undoState) {
      if (undoState) {
        undoElem.className = undoElem.className.replace(className, '');
      } else {
        undoElem.className += className;
      }
    }

    if (redoElemState !== redoState) {
      if (redoState) {
        redoElem.className = redoElem.className.replace(className, '');
      } else {
        redoElem.className += className;
      }
    }
  };

  /**
   * The <code>imageSizeChange</code> application event handler. The GUI element 
   * which displays the image dimensions is updated to display the new image 
   * size.
   *
   * <p>Image size refers strictly to the dimensions of the image being edited 
   * by the user, that's width and height.
   *
   * @param {pwlib.appEvent.imageSizeChange} ev The application event object.
   */
  this.imageSizeChange = function (ev) {
    var imageSize  = _self.elems.imageSize;
    if (imageSize) {
      imageSize.removeChild(imageSize.firstChild);
      imageSize.appendChild(doc.createTextNode(ev.width + 'x' + ev.height));
    }
  };

  /**
   * The <code>canvasSizeChange</code> application event handler. The Canvas 
   * container element dimensions are updated to the new values and the Hand 
   * tool is enabled/disabled as necessary.
   *
   * <p>Canvas size refers strictly to the dimensions of the Canvas elements in 
   * the browser, changed with CSS style properties, width and height. Scaling 
   * of the Canvas elements is applied when the user zooms the image or when the 
   * browser changes the render DPI / zoom.
   *
   * @param {pwlib.appEvent.canvasSizeChange} ev The application event object.
   */
  this.canvasSizeChange = function (ev) {
    var canvasContainer = _self.elems.canvasContainer,
        canvasResizer   = _self.canvasResizer,
        className       = ' ' + _self.classPrefix + 'disabled',
        hand            = _self.tools.hand,
        resizeHandle    = canvasResizer.resizeHandle,
        viewport        = _self.elems.viewport;

    // Update the Canvas container to be the same size as the Canvas elements.
    canvasContainer.style.width  = ev.width  + 'px';
    canvasContainer.style.height = ev.height + 'px';

    if (resizeHandle) {
      resizeHandle.style.top  = ev.height + 'px';
      resizeHandle.style.left = ev.width  + 'px';
    }

    if (!hand || !viewport) {
      return;
    }

    // Update Hand tool state.
    var cs         = win.getComputedStyle(viewport, null),
        vwidth     = parseInt(cs.width),
        vheight    = parseInt(cs.height),
        enableHand = false,
        handState  = hand.className.indexOf(className) === -1;

    if (vheight < ev.height || vwidth < ev.width) {
      enableHand = true;
    }

    if (enableHand && !handState) {
      hand.className = hand.className.replace(className, '');
    } else if (!enableHand && handState) {
      hand.className += className;
    }

    if (!enableHand && app.tool && app.tool._id === 'hand' && 'prevTool' in 
        app.tool) {
      app.toolActivate(app.tool.prevTool);
    }
  };

  /**
   * The <code>imageZoom</code> application event handler. The GUI input element 
   * which displays the image zoom level is updated to display the new value.
   *
   * @param {pwlib.appEvent.imageZoom} ev The application event object.
   */
  this.imageZoom = function (ev) {
    var elem  = _self.inputs.imageZoom,
        val   = MathRound(ev.zoom * 100);
    if (elem && elem.value != val) {
      elem.value = val;
    }
  };

  /**
   * The <code>configChange</code> application event handler. This method 
   * ensures the GUI input elements stay up-to-date when some PaintWeb 
   * configuration is modified.
   *
   * @param {pwlib.appEvent.configChange} ev The application event object.
   */
  this.configChangeHandler = function (ev) {
    var cfg = ev.group.replace('.', '_') + '_' + ev.config,
        input = _self.inputs[cfg];

    if (!input || ev.previousValue === ev.value) {
      return;
    }

    var tag = input.tagName.toLowerCase(),
        isInput = tag === 'select' || tag === 'input';

    if (isInput) {
      if (input.type === 'checkbox' && input.checked !== ev.value) {
        input.checked = ev.value;
      }
      if (input.type !== 'checkbox' && input.value !== ev.value) {
        input.value = ev.value;
      }

      return;
    }

    var className = ' ' + _self.className + 'configActive',
        prevValElem = _self.inputValues[cfg + '_' + ev.previousValue],
        valElem = _self.inputValues[cfg + '_' + ev.value];

    if (prevValElem && prevValElem.className.indexOf(className) !== -1) {
      prevValElem.className = prevValElem.className.replace(className, '');
    }

    if (valElem && valElem.className.indexOf(className) === -1) {
      valElem.className += className;
    }
  };

  /**
   * The <code>click</code> event handler for DOM elements associated to 
   * PaintWeb configuration values. These elements rely on parent elements which 
   * are associated to configuration properties.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.configChange} event.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.configValueClick = function (ev) {
    var pNode = this.parentNode,
        input = pNode._pwConfigParent,
        val = pNode.getAttribute('data-pwConfigValue');

    if (!input || !input._pwConfigProperty) {
      return;
    }

    ev.preventDefault();

    var className = ' ' + _self.classPrefix + 'configActive',
        groupRef = input._pwConfigGroupRef,
        group = input._pwConfigGroup,
        prop = input._pwConfigProperty,
        prevVal = groupRef[prop],
        prevValElem = _self.inputValues[group.replace('.', '_') + '_' + prop 
          + '_' + prevVal];

    if (prevVal == val) {
      return;
    }

    if (prevValElem && prevValElem.className.indexOf(className) !== -1) {
      prevValElem.className = prevValElem.className.replace(className, '');
    }

    groupRef[prop] = val;

    if (pNode.className.indexOf(className) === -1) {
      pNode.className += className;
    }

    app.events.dispatch(new appEvent.configChange(val, prevVal, prop, group, 
          groupRef));
  };

  /**
   * The <code>change</code> event handler for input elements associated to 
   * PaintWeb configuration properties.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.configChange} event.
   */
  this.configInputChange = function () {
    if (!this._pwConfigProperty) {
      return;
    }

    var val = this.type === 'checkbox' ? this.checked : this.value,
        groupRef = this._pwConfigGroupRef,
        group = this._pwConfigGroup,
        prop = this._pwConfigProperty,
        prevVal = groupRef[prop];

    if (this.getAttribute('type') === 'number') {
      val = parseInt(val);
      if (val != this.value) {
        this.value = val;
      }
    }

    if (val == prevVal) {
      return;
    }

    groupRef[prop] = val;

    app.events.dispatch(new appEvent.configChange(val, prevVal, prop, group, 
          groupRef));
  };

  /**
   * The <code>shadowAllow</code> application event handler. This method 
   * shows/hide the shadow tab when shadows are allowed/disallowed.
   *
   * @param {pwlib.appEvent.shadowAllow} ev The application event object.
   */
  this.shadowAllow = function (ev) {
    if ('shadow' in _self.tabPanels.main.tabs) {
      if (ev.allowed) {
        _self.tabPanels.main.tabShow('shadow');
      } else {
        _self.tabPanels.main.tabHide('shadow');
      }
    }
  };

  /**
   * The <code>clipboardUpdate</code> application event handler. The GUI element 
   * associated to the <code>clipboardPaste</code> command is updated to be 
   * disabled/enabled depending on the event.
   *
   * @param {pwlib.appEvent.clipboardUpdate} ev The application event object.
   */
  this.clipboardUpdate = function (ev) {
    var classDisabled = ' ' + _self.classPrefix + 'disabled',
        elem, elemEnabled,
        elems = [_self.commands.clipboardPaste, 
        _self.elems.selTab_clipboardPaste];

    for (var i = 0, n = elems.length; i < n; i++) {
      elem = elems[i];
      if (!elem) {
        continue;
      }

      elemEnabled = elem.className.indexOf(classDisabled) === -1;

      if (ev.state === ev.STATE_NONE && elemEnabled) {
        elem.className += classDisabled;
      } else if (ev.state === ev.STATE_SELECTED && !elemEnabled) {
        elem.className = elem.className.replace(classDisabled, '');
      }
    }
  };

  /**
   * The <code>selectionChange</code> application event handler. The GUI 
   * elements associated to the <code>selectionCut</code> and 
   * <code>selectionCopy</code> commands are updated to be disabled/enabled 
   * depending on the event.
   *
   * @param {pwlib.appEvent.selectionChange} ev The application event object.
   */
  this.selectionChange = function (ev) {
    var classDisabled  = ' ' + _self.classPrefix + 'disabled',
        elem, elemEnabled,
        elems = [_self.commands.selectionCut, _self.commands.selectionCopy, 
        _self.elems.selTab_selectionCut, _self.elems.selTab_selectionCopy, 
        _self.commands.selectionDelete, _self.commands.selectionFill, 
        _self.commands.selectionCrop];

    for (var i = 0, n = elems.length; i < n; i++) {
      elem = elems[i];
      if (!elem) {
        continue;
      }

      elemEnabled = elem.className.indexOf(classDisabled) === -1;

      if (ev.state === ev.STATE_NONE && elemEnabled) {
        elem.className += classDisabled;
      } else if (ev.state === ev.STATE_SELECTED && !elemEnabled) {
        elem.className = elem.className.replace(classDisabled, '');
      }
    }
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
      panels      = gui.floatingPanels,
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
    var ttl = _self.elem.getElementsByTagName('h1')[0],
        cs = win.getComputedStyle(_self.elem, null),
        zIndex = parseInt(cs.zIndex);

    // Set the position in the .style for quicker usage by the mousedown handler.
    // If this is not done during initialization, it would need to be done in the mousedown handler.
    _self.elem.style.top    = cs.top;
    _self.elem.style.left   = cs.left;
    _self.elem.style.zIndex = cs.zIndex;

    if (zIndex > panels.zIndex_) {
      panels.zIndex_ = zIndex;
    }

    ttl.addEventListener('mousedown', ev_mousedown, false);

    // allow auto-hide for the panel
    if (_self.elem.getAttribute('data-pwPanelHide') === 'true') {
      _self.hide();
    }
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
    panels.zIndex_ += zIndex_step;
    elem.style.zIndex = panels.zIndex_;
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
// TODO: FIXME: make this work when scrolling of the viewport changes.
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
   * Panel ID. The ID is the same as the data-pwTabPanel attribute value of the 
   * panel DOM element .
   *
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
    _self.id = _self.container.getAttribute('data-pwTabPanel');

    // Add two class names, the generic .paintweb_tabPanel and another class 
    // name specific to the current tab panel: .paintweb_tabPanel_id. 
    _self.container.className += ' ' + gui.classPrefix + 'tabPanel' 
      + ' ' + gui.classPrefix + 'tabPanel_' + _self.id;

    var tabButtons = doc.createElement('ul'),
        tabButton = null,
        tabDefault = _self.container.getAttribute('data-pwTabDefault') || null,
        childNodes = _self.container.childNodes,
        n = childNodes.length,
        type = Node.ELEMENT_NODE,
        elem = null,
        tabId = null,
        tabTitle = null,
        anchor = null;

    tabButtons.className = gui.classPrefix + 'tabsList';

    // Find all the tabs in the current panel container element.
    for (var i = 0; elem = childNodes[i]; i++) {
      if (elem.nodeType !== type) {
        continue;
      }

      // A tab is any element with a given data-pwTab attribute.
      tabId = elem.getAttribute('data-pwTab');
      if (!tabId) {
        continue;
      }

      // two class names, the generic .paintweb_tab and the tab-specific class 
      // name .paintweb_tabPanelId_tabId.
      elem.className += ' ' + gui.classPrefix + 'tab ' + gui.classPrefix 
        + _self.id + '_' + tabId;

      tabButton = doc.createElement('li');
      tabButton._pwTab = tabId;

      anchor = doc.createElement('a');
      anchor.href = '#';
      anchor.addEventListener('click', ev_tabClick, false);

      if (_self.id in lang.tabs) {
        tabTitle = lang.tabs[_self.id][tabId];
        anchor.title = tabTitle;
        anchor.appendChild(doc.createTextNode(tabTitle));
      }

      if ((tabDefault && tabId === tabDefault) ||
          (!tabDefault && !_self.tabId)) {
        _self.tabId = tabId;
        tabButton.className = gui.classPrefix + 'tabActive';
      } else {
        prevTabId_ = tabId;
        elem.style.display = 'none';
      }

      // automatically hide the tab
      if (elem.getAttribute('data-pwTabHide') === 'true') {
        tabButton.style.display = 'none';
      }

      _self.tabs[tabId] = {container: elem, button: tabButton};

      tabButton.appendChild(anchor);
      tabButtons.appendChild(tabButton);
    }

    _self.tabButtons = tabButtons;
    _self.container.appendChild(tabButtons);
  };

  /**
   * The <code>click</code> event handler for tab buttons. This function simply 
   * activates the tab the user clicked.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function ev_tabClick (ev) {
    _self.tabActivate(this.parentNode._pwTab);
    ev.preventDefault();
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
    if (!tabId || !(tabId in this.tabs)) {
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
    tabButton.style.display = ''; // make sure the tab is not hidden
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

