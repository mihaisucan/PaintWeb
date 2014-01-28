/*
 * Copyright (c) 2009-2014, Mihai Sucan
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * 
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * $URL: http://code.google.com/p/paintweb $
 * $Date: 2014-01-28 12:53:15 $
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
pwlib.gui = function (app) {
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
   * Holds references to input elements associated to the PaintWeb configuration 
   * properties.
   * @type Object
   */
  this.inputs = {};

  /**
   * Holds references to DOM elements associated to configuration values.
   * @type Object
   */
  this.inputValues = {};

  /**
   * Holds references to DOM elements associated to color configuration 
   * properties.
   *
   * @type Object
   * @see pwlib.guiColorInput
   */
  this.colorInputs = {};

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
   *
   * @type Object
   * @see pwlib.guiFloatingPanel
   */
  this.floatingPanels = {zIndex_: 0};

  /**
   * Holds references to tab panel GUI components.
   *
   * @type Object
   * @see pwlib.guiTabPanel
   */
  this.tabPanels = {};

  /**
   * Holds an instance of the guiResizer object attached to the Canvas.
   *
   * @private
   * @type pwlib.guiResizer
   */
  this.canvasResizer = null;

  /**
   * Holds an instance of the guiResizer object attached to the viewport 
   * element.
   *
   * @private
   * @type pwlib.guiResizer
   */
  this.viewportResizer = null;

  /**
   * Holds tab configuration information for most drawing tools.
   *
   * @private
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
      lineTabLabel: lang.tabs.main.textBorder,
      shapeType: true,
      lineWidth: true,
      lineWidthLabel: lang.inputs.borderWidth
    }
  };

  /**
   * Initialize the PaintWeb interface.
   *
   * @param {Document|String} markup The interface markup loaded and parsed as 
   * DOM Document object. Optionally, the value can be a string holding the 
   * interface markup (this is used when PaintWeb is packaged).
   *
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.init = function (markup) {
    // Make sure the user nicely waits for PaintWeb to load, without seeing 
    // much.
    var placeholder = config.guiPlaceholder,
        placeholderStyle = placeholder.style;


    placeholderStyle.display = 'none';
    placeholderStyle.height = '1px';
    placeholderStyle.overflow = 'hidden';
    placeholderStyle.position = 'absolute';
    placeholderStyle.visibility = 'hidden';

    placeholder.className += ' ' + this.classPrefix + 'placeholder';
    if (!placeholder.tabIndex || placeholder.tabIndex == -1) {
      placeholder.tabIndex = 1;
    }

    if (!this.initImportDoc(markup)) {
      app.initError(lang.guiMarkupImportFailed);
      return false;
    }
    markup = null;

    if (!this.initParseMarkup()) {
      app.initError(lang.guiMarkupParseFailed);
      return false;
    }

    if (!this.initCanvas() ||
        !this.initImageZoom() ||
        !this.initSelectionTool() ||
        !this.initTextTool() ||
        !this.initKeyboardShortcuts()) {
      return false;
    }

    // Setup the main tabbed panel.
    var panel = this.tabPanels.main;
    if (!panel) {
      app.initError(lang.noMainTabPanel);
      return false;
    }

    // Hide the "Shadow" tab if the drawing of shadows is not supported.
    if (!app.shadowSupported && 'shadow' in panel.tabs) {
      panel.tabHide('shadow');
    }

    if (!('viewport' in this.elems)) {
      app.initError(lang.missingViewport);
      return false;
    }

    // Setup the GUI dimensions .
    this.elems.viewport.style.height = config.viewportHeight;
    placeholderStyle.width = config.viewportWidth;

    // Setup the Canvas resizer.
    var resizeHandle = this.elems.canvasResizer;
    if (!resizeHandle) {
      app.initError(lang.missingCanvasResizer);
      return false;
    }
    resizeHandle.title = lang.guiCanvasResizer;
    resizeHandle.replaceChild(doc.createTextNode(resizeHandle.title), 
        resizeHandle.firstChild);
    resizeHandle.addEventListener('mouseover', this.item_mouseover, false);
    resizeHandle.addEventListener('mouseout',  this.item_mouseout,  false);

    this.canvasResizer = new pwlib.guiResizer(this, resizeHandle, 
        this.elems.canvasContainer);

    this.canvasResizer.events.add('guiResizeStart', this.canvasResizeStart);
    this.canvasResizer.events.add('guiResizeEnd',   this.canvasResizeEnd);

    // Setup the viewport resizer.
    var resizeHandle = this.elems.viewportResizer;
    if (!resizeHandle) {
      app.initError(lang.missingViewportResizer);
      return false;
    }
    resizeHandle.title = lang.guiViewportResizer;
    resizeHandle.replaceChild(doc.createTextNode(resizeHandle.title), 
        resizeHandle.firstChild);
    resizeHandle.addEventListener('mouseover', this.item_mouseover, false);
    resizeHandle.addEventListener('mouseout',  this.item_mouseout,  false);

    this.viewportResizer = new pwlib.guiResizer(this, resizeHandle, 
        this.elems.viewport);

    this.viewportResizer.dispatchMouseMove = true;
    this.viewportResizer.events.add('guiResizeMouseMove', 
        this.viewportResizeMouseMove);
    this.viewportResizer.events.add('guiResizeEnd', this.viewportResizeEnd);

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
      imageSize.replaceChild(doc.createTextNode(app.image.width + 'x' 
            + app.image.height), imageSize.firstChild);
    }

    // Add application-wide event listeners.
    app.events.add('canvasSizeChange',  this.canvasSizeChange);
    app.events.add('commandRegister',   this.commandRegister);
    app.events.add('commandUnregister', this.commandUnregister);
    app.events.add('configChange',      this.configChangeHandler);
    app.events.add('imageSizeChange',   this.imageSizeChange);
    app.events.add('imageZoom',         this.imageZoom);
    app.events.add('appInit',           this.appInit);
    app.events.add('shadowAllow',       this.shadowAllow);
    app.events.add('toolActivate',      this.toolActivate);
    app.events.add('toolRegister',      this.toolRegister);
    app.events.add('toolUnregister',    this.toolUnregister);

    // Make sure the historyUndo and historyRedo command elements are 
    // synchronized with the application history state.
    if ('historyUndo' in this.commands && 'historyRedo' in this.commands) {
      app.events.add('historyUpdate', this.historyUpdate);
    }

    app.commandRegister('about', this.commandAbout);

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
    if (!config.checkersBackground || pwlib.browser.olpcxo) {
      containerStyle.backgroundImage = 'none';
    }

    canvasContainer.appendChild(layerCanvas);
    canvasContainer.appendChild(bufferCanvas);

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
   * <p>Input elements which have the ID attribute will have their attribute 
   * updated to be unique for the current PaintWeb instance.
   *
   * @private
   *
   * @param {Document|String} markup The source DOM document to import the nodes 
   * from. Optionally, this parameter can be a string which holds the interface 
   * markup.
   *
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.initImportDoc = function (markup) {
    // I could use some XPath here, but for the sake of compatibility I don't.
    var destElem = config.guiPlaceholder,
        elType = app.ELEMENT_NODE,
        elem, root, nodes, n, tag, isInput;

    if (typeof markup === 'string') {
      elem = doc.createElement('div');
      elem.innerHTML = markup;
      root = elem.firstChild;
    } else {
      root = markup.documentElement;
    }
    markup = null;

    nodes = root.getElementsByTagName('*');
    n = nodes.length;

    // Change all the id attributes to be data-pwId attributes.
    // Input elements have their ID updated to be unique for the current 
    // PaintWeb instance.
    for (var i = 0; i < n; i++) {
      elem = nodes[i];
      if (elem.nodeType !== elType || !elem.tagName) {
        continue;
      }
      tag = elem.tagName.toLowerCase();
      isInput = tag === 'input' || tag === 'select' || tag === 'textarea';

      if (elem.id) {
        elem.setAttribute('data-pwId', elem.id);

        if (isInput) {
          elem.id = this.idPrefix + elem.id;
        } else {
          elem.removeAttribute('id');
        }
      }

      // label elements have their "for" attribute updated as well.
      if (tag === 'label' && elem.htmlFor) {
        elem.htmlFor = this.idPrefix + elem.htmlFor;
      }
    }

    // Import all the nodes.
    n = root.childNodes.length;

    for (var i = 0; i < n; i++) {
      destElem.appendChild(doc.importNode(root.childNodes[i], true));
    }

    return true;
  };

  /**
   * Parse the interface markup. The layout file can have custom 
   * PaintWeb-specific attributes.
   *
   * <p>Elements with the <code>data-pwId</code> attribute are added to the 
   * {@link pwlib.gui#elems} object.
   *
   * <p>Elements having the <code>data-pwCommand</code> attribute are added to 
   * the {@link pwlib.gui#commands} object.
   *
   * <p>Elements having the <code>data-pwTool</code> attribute are added to the 
   * {@link pwlib.gui#tools} object.
   *
   * <p>Elements having the <code>data-pwTabPanel</code> attribute are added to 
   * the {@link pwlib.gui#tabPanels} object. These become interactive GUI 
   * components (see {@link pwlib.guiTabPanel}).
   *
   * <p>Elements having the <code>data-pwFloatingPanel</code> attribute are 
   * added to the {@link pwlib.gui#floatingPanels} object. These become 
   * interactive GUI components (see {@link pwlib.guiFloatingPanel}).
   *
   * <p>Elements having the <code>data-pwConfig</code> attribute are added to 
   * the {@link pwlib.gui#inputs} object. These become interactive GUI 
   * components which allow users to change configuration options.
   *
   * <p>Elements having the <code>data-pwConfigValue</code> attribute are added 
   * to the {@link pwlib.gui#inputValues} object. These can only be child nodes 
   * of elements which have the <code>data-pwConfig</code> attribute. Each such 
   * element is considered an icon. Anchor elements are appended to ensure 
   * keyboard accessibility.
   *
   * <p>Elements having the <code>data-pwConfigToggle</code> attribute are added 
   * to the {@link pwlib.gui#inputs} object. These become interactive GUI 
   * components which toggle the boolean value of the configuration property 
   * they are associated to.
   *
   * <p>Elements having the <code>data-pwColorInput</code> attribute are added 
   * to the {@link pwlib.gui#colorInputs} object. These become color picker 
   * inputs which are associated to the configuration property given as the 
   * attribute value. (see {@link pwlib.guiColorInput})
   *
   * @returns {Boolean} True if the parsing was successful, or false if not.
   */
  this.initParseMarkup = function () {
    var nodes = config.guiPlaceholder.getElementsByTagName('*'),
        elType = app.ELEMENT_NODE,
        elem, tag, isInput, tool, tabPanel, floatingPanel, cmd, id, cfgAttr, 
        colorInput;

    // Store references to important elements and parse PaintWeb-specific 
    // attributes.
    for (var i = 0; i < nodes.length; i++) {
      elem = nodes[i];
      if (elem.nodeType !== elType) {
        continue;
      }
      tag = elem.tagName.toLowerCase();
      isInput = tag === 'input' || tag === 'select' || tag === 'textarea';

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
        this.tabPanels[tabPanel] = new pwlib.guiTabPanel(this, elem);
      }

      // Create floating panels.
      floatingPanel = elem.getAttribute('data-pwFloatingPanel');
      if (floatingPanel) {
        this.floatingPanels[floatingPanel] = new pwlib.guiFloatingPanel(this, 
            elem);
      }

      cfgAttr = elem.getAttribute('data-pwConfig');
      if (cfgAttr) {
        if (isInput) {
          this.initConfigInput(elem, cfgAttr);
        } else {
          this.initConfigIcons(elem, cfgAttr);
        }
      }

      cfgAttr = elem.getAttribute('data-pwConfigToggle');
      if (cfgAttr) {
        this.initConfigToggle(elem, cfgAttr);
      }

      // elem.hasAttribute() fails in webkit (tested with chrome and safari 4)
      if (elem.getAttribute('data-pwColorInput')) {
        colorInput = new pwlib.guiColorInput(this, elem);
        this.colorInputs[colorInput.id] = colorInput;
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
   * Initialize an input element associated to a configuration property.
   *
   * @private
   *
   * @param {Element} elem The DOM element which is associated to the 
   * configuration property.
   *
   * @param {String} cfgAttr The configuration attribute. This tells the 
   * configuration group and property to which the DOM element is attached to.
   */
  this.initConfigInput = function (input, cfgAttr) {
    var cfgNoDots   = cfgAttr.replace('.', '_'),
        cfgArray    = cfgAttr.split('.'),
        cfgProp     = cfgArray.pop(),
        cfgGroup    = cfgArray.join('.'),
        cfgGroupRef = config,
        langGroup   = lang.inputs,
        labelElem   = input.parentNode;

    for (var i = 0, n = cfgArray.length; i < n; i++) {
      cfgGroupRef = cfgGroupRef[cfgArray[i]];
      langGroup = langGroup[cfgArray[i]];
    }

    input._pwConfigProperty = cfgProp;
    input._pwConfigGroup = cfgGroup;
    input._pwConfigGroupRef = cfgGroupRef;
    input.title = langGroup[cfgProp + 'Title'] || langGroup[cfgProp];
    input.className += ' ' + this.classPrefix + 'cfg_' + cfgNoDots;

    this.inputs[cfgNoDots] = input;

    if (labelElem.tagName.toLowerCase() !== 'label') {
      labelElem = labelElem.getElementsByTagName('label')[0];
    }

    if (input.type === 'checkbox' || labelElem.htmlFor) {
      labelElem.replaceChild(doc.createTextNode(langGroup[cfgProp]), 
          labelElem.lastChild);
    } else {
      labelElem.replaceChild(doc.createTextNode(langGroup[cfgProp]), 
          labelElem.firstChild);
    }

    if (input.type === 'checkbox') {
      input.checked = cfgGroupRef[cfgProp];
    } else {
      input.value = cfgGroupRef[cfgProp];
    }

    input.addEventListener('input',  this.configInputChange, false);
    input.addEventListener('change', this.configInputChange, false);
  };

  /**
   * Initialize an HTML element associated to a configuration property, and all 
   * of its own sub-elements associated to configuration values. Each element 
   * that has the <var>data-pwConfigValue</var> attribute is considered an icon.
   *
   * @private
   *
   * @param {Element} elem The DOM element which is associated to the 
   * configuration property.
   *
   * @param {String} cfgAttr The configuration attribute. This tells the 
   * configuration group and property to which the DOM element is attached to.
   */
  this.initConfigIcons = function (input, cfgAttr) {
    var cfgNoDots   = cfgAttr.replace('.', '_'),
        cfgArray    = cfgAttr.split('.'),
        cfgProp     = cfgArray.pop(),
        cfgGroup    = cfgArray.join('.'),
        cfgGroupRef = config,
        langGroup   = lang.inputs;

    for (var i = 0, n = cfgArray.length; i < n; i++) {
      cfgGroupRef = cfgGroupRef[cfgArray[i]];
      langGroup = langGroup[cfgArray[i]];
    }

    input._pwConfigProperty = cfgProp;
    input._pwConfigGroup = cfgGroup;
    input._pwConfigGroupRef = cfgGroupRef;
    input.title = langGroup[cfgProp + 'Title'] || langGroup[cfgProp];
    input.className += ' ' + this.classPrefix + 'cfg_' + cfgNoDots;

    this.inputs[cfgNoDots] = input;

    var labelElem = input.getElementsByTagName('p')[0];
    labelElem.replaceChild(doc.createTextNode(langGroup[cfgProp]), 
        labelElem.firstChild);

    var elem, anchor, val,
        className = ' ' + this.classPrefix + 'configActive';
        nodes = input.getElementsByTagName('*'),
        elType = app.ELEMENT_NODE;

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
        + ' ' + this.classPrefix + 'icon';
      elem._pwConfigParent = input;

      if (cfgGroupRef[cfgProp] == val) {
        elem.className += className;
      }

      anchor.addEventListener('click',     this.configValueClick, false);
      anchor.addEventListener('mouseover', this.item_mouseover,   false);
      anchor.addEventListener('mouseout',  this.item_mouseout,    false);

      elem.replaceChild(anchor, elem.firstChild);

      this.inputValues[cfgGroup + '_' + cfgProp + '_' + val] = elem;
    }
  };

  /**
   * Initialize an HTML element associated to a boolean configuration property.
   *
   * @private
   *
   * @param {Element} elem The DOM element which is associated to the 
   * configuration property.
   *
   * @param {String} cfgAttr The configuration attribute. This tells the 
   * configuration group and property to which the DOM element is attached to.
   */
  this.initConfigToggle = function (input, cfgAttr) {
    var cfgNoDots   = cfgAttr.replace('.', '_'),
        cfgArray    = cfgAttr.split('.'),
        cfgProp     = cfgArray.pop(),
        cfgGroup    = cfgArray.join('.'),
        cfgGroupRef = config,
        langGroup   = lang.inputs;

    for (var i = 0, n = cfgArray.length; i < n; i++) {
      cfgGroupRef = cfgGroupRef[cfgArray[i]];
      langGroup = langGroup[cfgArray[i]];
    }

    input._pwConfigProperty = cfgProp;
    input._pwConfigGroup = cfgGroup;
    input._pwConfigGroupRef = cfgGroupRef;
    input.className += ' ' + this.classPrefix + 'cfg_' + cfgNoDots 
      + ' ' + this.classPrefix + 'icon';

    if (cfgGroupRef[cfgProp]) {
      input.className += ' ' + this.classPrefix + 'configActive';
    }

    var anchor = doc.createElement('a');
    anchor.href = '#';
    anchor.title = langGroup[cfgProp + 'Title'] || langGroup[cfgProp];
    anchor.appendChild(doc.createTextNode(langGroup[cfgProp]));

    anchor.addEventListener('click',     this.configToggleClick, false);
    anchor.addEventListener('mouseover', this.item_mouseover,    false);
    anchor.addEventListener('mouseout',  this.item_mouseout,     false);

    input.replaceChild(anchor, input.firstChild);

    this.inputs[cfgNoDots] = input;
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

    var changeFn = function () {
      app.imageZoomTo(parseInt(this.value) / 100);
    };

    input.addEventListener('change', changeFn, false);
    input.addEventListener('input',  changeFn, false);

    // Update some language strings

    var label = input.parentNode;
    if (label.tagName.toLowerCase() === 'label') {
      label.replaceChild(doc.createTextNode(lang.imageZoomLabel), 
          label.firstChild);
    }

    var elem = this.elems.statusZoom;
    if (!elem) {
      return true;
    }

    elem.title = lang.imageZoomTitle;

    return true;
  };

  /**
   * Initialize GUI elements associated to selection tool options and commands.
   *
   * @private
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.initSelectionTool = function () {
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
      elem.replaceChild(anchor, elem.firstChild);
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
   * Initialize GUI elements associated to text tool options.
   *
   * @private
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.initTextTool = function () {
    if ('textString' in this.inputs) {
      this.inputs.textString.value = lang.inputs.text.textString_value;
    }

    if (!('text_fontFamily' in this.inputs) || !('text' in config) || 
        !('fontFamilies' in config.text)) {
      return true;
    }

    var option, input = this.inputs.text_fontFamily;
    for (var i = 0, n = config.text.fontFamilies.length; i < n; i++) {
      option = doc.createElement('option');
      option.value = config.text.fontFamilies[i];
      option.appendChild(doc.createTextNode(option.value));
      input.appendChild(option);

      if (option.value === config.text.fontFamily) {
        input.selectedIndex = i;
        input.value = option.value;
      }
    }

    option = doc.createElement('option');
    option.value = '+';
    option.appendChild(doc.createTextNode(lang.inputs.text.fontFamily_add));
    input.appendChild(option);

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
   * The <code>appInit</code> event handler. This method is invoked once 
   * PaintWeb completes all the loading.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.guiShow} application 
   * event.
   *
   * @private
   * @param {pwlib.appEvent.appInit} ev The application event object.
   */
  this.appInit = function (ev) {
    // Initialization was not successful ...
    if (ev.state !== PaintWeb.INIT_DONE) {
      return;
    }

    // Make sure the Hand tool is enabled/disabled as needed.
    if ('hand' in _self.tools) {
      app.events.add('canvasSizeChange',   _self.toolHandStateChange);
      app.events.add('viewportSizeChange', _self.toolHandStateChange);
      _self.toolHandStateChange(ev);
    }

    // Make PaintWeb visible.
    var placeholder = config.guiPlaceholder,
        placeholderStyle = placeholder.style;

    // We do not reset the display property. We leave this for the stylesheet.
    placeholderStyle.height = '';
    placeholderStyle.overflow = '';
    placeholderStyle.position = '';
    placeholderStyle.visibility = '';

    var cs = win.getComputedStyle(placeholder, null);

    // Do not allow the static positioning for the PaintWeb placeholder.  
    // Usually, the GUI requires absolute/relative positioning.
    if (cs.position === 'static') {
      placeholderStyle.position = 'relative';
    }

    try {
      placeholder.focus();
    } catch (err) { }

    app.events.dispatch(new appEvent.guiShow());
  };

  /**
   * The <code>guiResizeStart</code> event handler for the Canvas resize 
   * operation.
   * @private
   */
  this.canvasResizeStart = function () {
    this.resizeHandle.style.visibility = 'hidden';

    // ugly...
    this.timeout_ = setTimeout(function () {
      _self.statusShow('guiCanvasResizerActive', true);
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
    this.resizeHandle.style.visibility = '';

    app.imageCrop(0, 0, MathRound(ev.width / app.image.canvasScale),
        MathRound(ev.height / app.image.canvasScale));

    if (this.timeout_) {
      clearTimeout(this.timeout_);
      delete this.timeout_;
    } else {
      _self.statusShow(-1);
    }
  };

  /**
   * The <code>guiResizeMouseMove</code> event handler for the viewport resize 
   * operation.
   *
   * @private
   * @param {pwlib.appEvent.guiResizeMouseMove} ev The application event object.
   */
  this.viewportResizeMouseMove = function (ev) {
    config.guiPlaceholder.style.width = ev.width + 'px';
  };

  /**
   * The <code>guiResizeEnd</code> event handler for the viewport resize 
   * operation.
   *
   * @private
   * @param {pwlib.appEvent.guiResizeEnd} ev The application event object.
   */
  this.viewportResizeEnd = function (ev) {
    _self.elems.viewport.style.width = '';
    _self.resizeTo(ev.width + 'px', ev.height + 'px');
    try {
      config.guiPlaceholder.focus();
    } catch (err) { }
  };

  /**
   * The <code>mouseover</code> event handler for all tools, commands and icons.  
   * This simply shows the title / text content of the element in the GUI status 
   * bar.
   *
   * @see pwlib.gui#statusShow The method used for displaying the message in the 
   * GUI status bar.
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
   * @see pwlib.gui#statusShow The method used for displaying the message in the 
   * GUI status bar.
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

  /**
   * The "About" command. This method displays the "About" panel.
   */
  this.commandAbout = function () {
    _self.floatingPanels.about.toggle();
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
        tabActive = _self.tools[ev.id],
        tabConfig = _self.toolTabConfig[ev.id] || {},
        tabPanel = _self.tabPanels.main,
        lineTab = tabPanel.tabs.line,
        shapeType = _self.inputs.shapeType,
        lineWidth = _self.inputs.line_lineWidth,
        lineCap = _self.inputs.line_lineCap,
        lineJoin = _self.inputs.line_lineJoin,
        miterLimit = _self.inputs.line_miterLimit,
        lineWidthLabel = null;

    tabActive.className += ' ' + _self.classPrefix + 'toolActive';
    try {
      tabActive.firstChild.focus();
    } catch (err) { }

    if ((ev.id + 'Active') in lang.status) {
      _self.statusShow(ev.id + 'Active');
    }

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
      lineWidthLabel.replaceChild(doc.createTextNode(tabConfig.lineWidthLabel), 
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
      tabAnchor.replaceChild(doc.createTextNode(tabAnchor.title), 
          tabAnchor.firstChild);

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

    if (elem.firstChild) {
      elem.replaceChild(anchor, elem.firstChild);
    } else {
      elem.appendChild(anchor);
    }

    anchor.addEventListener('click',     _self.toolClick,      false);
    anchor.addEventListener('mouseover', _self.item_mouseover, false);
    anchor.addEventListener('mouseout',  _self.item_mouseout,  false);

    if (!(ev.id in _self.tools)) {
      _self.tools[ev.id] = elem;
      _self.elems.tools.appendChild(elem);
    }

    // Disable the text tool icon if the Canvas Text API is not supported.
    if (ev.id === 'text' && !app.layer.context.fillText && 
        !app.layer.context.mozPathText && elem) {
      elem.className += ' ' + _self.classPrefix + 'disabled';
      anchor.title = lang.tools.textUnsupported;

      anchor.removeEventListener('click', _self.toolClick, false);
      anchor.addEventListener('click', function (ev) {
        ev.preventDefault();
      }, false);
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
      delete _self.tools[ev.id];
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

    try {
      this.focus();
    } catch (err) { }
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
   * @private
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
   * @private
   *
   * @param {pwlib.appEvent.historyUpdate} ev The application event object.
   *
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
   * @private
   * @param {pwlib.appEvent.imageSizeChange} ev The application event object.
   */
  this.imageSizeChange = function (ev) {
    var imageSize  = _self.elems.imageSize;
    if (imageSize) {
      imageSize.replaceChild(doc.createTextNode(ev.width + 'x' + ev.height), 
          imageSize.firstChild);
    }
  };

  /**
   * The <code>canvasSizeChange</code> application event handler. The Canvas 
   * container element dimensions are updated to the new values, and the image 
   * resize handle is positioned accordingly.
   *
   * <p>Canvas size refers strictly to the dimensions of the Canvas elements in 
   * the browser, changed with CSS style properties, width and height. Scaling 
   * of the Canvas elements is applied when the user zooms the image or when the 
   * browser changes the render DPI / zoom.
   *
   * @private
   * @param {pwlib.appEvent.canvasSizeChange} ev The application event object.
   */
  this.canvasSizeChange = function (ev) {
    var canvasContainer = _self.elems.canvasContainer,
        canvasResizer   = _self.canvasResizer,
        className       = ' ' + _self.classPrefix + 'disabled',
        resizeHandle    = canvasResizer.resizeHandle;

    // Update the Canvas container to be the same size as the Canvas elements.
    canvasContainer.style.width  = ev.width  + 'px';
    canvasContainer.style.height = ev.height + 'px';

    resizeHandle.style.top  = ev.height + 'px';
    resizeHandle.style.left = ev.width  + 'px';
  };

  /**
   * The <code>imageZoom</code> application event handler. The GUI input element 
   * which displays the image zoom level is updated to display the new value.
   *
   * @private
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
   * @private
   * @param {pwlib.appEvent.configChange} ev The application event object.
   */
  this.configChangeHandler = function (ev) {
    var cfg = '', input;
    if (ev.group) {
      cfg = ev.group.replace('.', '_') + '_';
    }
    cfg += ev.config;
    input = _self.inputs[cfg];

    // Handle changes for color inputs.
    if (!input && (input = _self.colorInputs[cfg])) {
      var color = ev.value.replace(/\s+/g, '').
                    replace(/^rgba\(/, '').replace(/\)$/, '');

      color = color.split(',');
      input.updateColor({
        red:   color[0] / 255,
        green: color[1] / 255,
        blue:  color[2] / 255,
        alpha: color[3]
      });

      return;
    }

    if (!input) {
      return;
    }

    var tag = input.tagName.toLowerCase(),
        isInput = tag === 'select' || tag === 'input' || tag === 'textarea';

    if (isInput) {
      if (input.type === 'checkbox' && input.checked !== ev.value) {
        input.checked = ev.value;
      }
      if (input.type !== 'checkbox' && input.value !== ev.value) {
        input.value = ev.value;
      }

      return;
    }

    var classActive = ' ' + _self.className + 'configActive';

    if (input.hasAttribute('data-pwConfigToggle')) {
      var inputActive = input.className.indexOf(classActive) !== -1;

      if (ev.value && !inputActive) {
        input.className += classActive;
      } else if (!ev.value && inputActive) {
        input.className = input.className.replace(classActive, '');
      }
    }

    var classActive = ' ' + _self.className + 'configActive',
        prevValElem = _self.inputValues[cfg + '_' + ev.previousValue],
        valElem = _self.inputValues[cfg + '_' + ev.value];

    if (prevValElem && prevValElem.className.indexOf(classActive) !== -1) {
      prevValElem.className = prevValElem.className.replace(classActive, '');
    }

    if (valElem && valElem.className.indexOf(classActive) === -1) {
      valElem.className += classActive;
    }
  };

  /**
   * The <code>click</code> event handler for DOM elements associated to 
   * PaintWeb configuration values. These elements rely on parent elements which 
   * are associated to configuration properties.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.configChange} event.
   *
   * @private
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
   *
   * @private
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
   * The <code>click</code> event handler for DOM elements associated to boolean 
   * configuration properties. These elements only toggle the true/false value 
   * of the configuration property.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.configChange} event.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  this.configToggleClick = function (ev) {
    var className = ' ' + _self.classPrefix + 'configActive',
        pNode = this.parentNode,
        groupRef = pNode._pwConfigGroupRef,
        group = pNode._pwConfigGroup,
        prop = pNode._pwConfigProperty,
        elemActive = pNode.className.indexOf(className) !== -1;

    ev.preventDefault();

    groupRef[prop] = !groupRef[prop];

    if (groupRef[prop] && !elemActive) {
      pNode.className += className;
    } else if (!groupRef[prop] && elemActive) {
      pNode.className = pNode.className.replace(className, '');
    }

    app.events.dispatch(new appEvent.configChange(groupRef[prop], 
          !groupRef[prop], prop, group, groupRef));
  };

  /**
   * The <code>shadowAllow</code> application event handler. This method 
   * shows/hide the shadow tab when shadows are allowed/disallowed.
   *
   * @private
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
   * @private
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

      if (!ev.data && elemEnabled) {
        elem.className += classDisabled;
      } else if (ev.data && !elemEnabled) {
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
   * @private
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

  /**
   * Show the graphical user interface.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.guiShow} application 
   * event.
   */
  this.show = function () {
    var placeholder = config.guiPlaceholder,
        className   = this.classPrefix + 'placeholder',
        re          = new RegExp('\\b' + className);

    if (!re.test(placeholder.className)) {
      placeholder.className += ' ' + className;
    }

    try {
      placeholder.focus();
    } catch (err) { }

    app.events.dispatch(new appEvent.guiShow());
  };

  /**
   * Hide the graphical user interface.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.guiHide} application 
   * event.
   */
  this.hide = function () {
    var placeholder = config.guiPlaceholder,
        re = new RegExp('\\b' + this.classPrefix + 'placeholder', 'g');

    placeholder.className = placeholder.className.replace(re, '');

    app.events.dispatch(new appEvent.guiHide());
  };

  /**
   * The application destroy event handler. This method is invoked by the main 
   * PaintWeb application when the instance is destroyed, for the purpose of 
   * cleaning-up the GUI-related things from the document add by the current 
   * instance.
   *
   * @private
   */
  this.destroy = function () {
    var placeholder = config.guiPlaceholder;

    while(placeholder.hasChildNodes()) {
      placeholder.removeChild(placeholder.firstChild);
    }
  };

  /**
   * Resize the PaintWeb graphical user interface.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.configChange} event for 
   * the "viewportWidth" and "viewportHeight" configuration properties. Both 
   * properties are updated to hold the new values you give.
   *
   * <p>Once the GUI is resized, the {@link pwlib.appEvent.viewportSizeChange} 
   * event is also dispatched.
   *
   * @param {String} width The new width you want. Make sure the value is a CSS 
   * length, like "50%", "450px" or "30em".
   *
   * @param {String} height The new height you want.
   */
  this.resizeTo = function (width, height) {
    if (!width || !height) {
      return;
    }

    var width_old  = config.viewportWidth,
        height_old = config.viewportHeight;

    config.viewportWidth  = width;
    config.viewportHeight = height;

    app.events.dispatch(new appEvent.configChange(width, width_old, 
          'viewportWidth', '', config));

    app.events.dispatch(new appEvent.configChange(height, height_old, 
          'viewportHeight', '', config));

    config.guiPlaceholder.style.width = config.viewportWidth;
    this.elems.viewport.style.height  = config.viewportHeight;

    app.events.dispatch(new appEvent.viewportSizeChange(width, height));
  };

  /**
   * The state change event handler for the Hand tool. This function 
   * enables/disables the Hand tool by checking if the current image fits into 
   * the viewport or not.
   *
   * <p>This function is invoked when one of the following application events is  
   * dispatched: <code>viewportSizeChange</code>, <code>canvasSizeChange</code> 
   * or <code>appInit</code.
   *
   * @private
   * @param 
   * {pwlib.appEvent.viewportSizeChange|pwlib.appEvent.canvasSizeChange|pwlib.appEvent.appInit} 
   * [ev] The application event object.
   */
  this.toolHandStateChange = function (ev) {
    var cwidth    = 0,
        cheight   = 0,
        className = ' ' + _self.classPrefix + 'disabled',
        hand      = _self.tools.hand,
        viewport  = _self.elems.viewport;

    if (!hand) {
      return;
    }

    if (ev.type === 'canvasSizeChange') {
      cwidth  = ev.width;
      cheight = ev.height;
    } else {
      var containerStyle = _self.elems.canvasContainer.style;
      cwidth  = parseInt(containerStyle.width);
      cheight = parseInt(containerStyle.height);
    }

    // FIXME: it should be noted that when PaintWeb loads, the entire GUI is 
    // hidden, and win.getComputedStyle() style tells that the viewport 
    // width/height is 0.
    cs = win.getComputedStyle(viewport, null);

    var vwidth     = parseInt(cs.width),
        vheight    = parseInt(cs.height),
        enableHand = false,
        handState  = hand.className.indexOf(className) === -1;

    if (vheight < cheight || vwidth < cwidth) {
      enableHand = true;
    }

    if (enableHand && !handState) {
      hand.className = hand.className.replace(className, '');
    } else if (!enableHand && handState) {
      hand.className += className;
    }

    if (!enableHand && app.tool && app.tool._id === 'hand' && 'prevTool' in 
        app.tool) {
      app.toolActivate(app.tool.prevTool, ev);
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
 * @param {Element} container Reference to the DOM element you want to transform 
 * into a floating panel.
 */
pwlib.guiFloatingPanel = function (gui, container) {
  var _self          = this,
      appEvent       = pwlib.appEvent,
      cStyle         = container.style,
      doc            = gui.app.doc,
      guiPlaceholder = gui.app.config.guiPlaceholder,
      lang           = gui.app.lang,
      panels         = gui.floatingPanels,
      win            = gui.app.win,
      zIndex_step    = 200;

  // These hold the mouse starting location during the drag operation.
  var mx, my;

  // These hold the panel starting location during the drag operation.
  var ptop, pleft;

  /**
   * Panel state: hidden.
   * @constant
   */
  this.STATE_HIDDEN    = 0;

  /**
   * Panel state: visible.
   * @constant
   */
  this.STATE_VISIBLE   = 1;

  /**
   * Panel state: minimized.
   * @constant
   */
  this.STATE_MINIMIZED = 3;

  /**
   * Panel state: the user is dragging the floating panel.
   * @constant
   */
  this.STATE_DRAGGING  = 4;

  /**
   * Tells the state of the floating panel: hidden/minimized/visible or if it's 
   * being dragged.
   * @type Number
   */
  this.state = -1;

  /**
   * Floating panel ID. This is the ID used in the 
   * <var>data-pwFloatingPanel</var> element attribute.
   * @type String
   */
  this.id = null;

  /**
   * Reference to the floating panel element.
   * @type Element
   */
  this.container = container;

  /**
   * The viewport element. This element is the first parent element which has 
   * the style.overflow set to "auto" or "scroll".
   * @type Element
   */
  this.viewport = null;

  /**
   * Custom application events interface.
   * @type pwlib.appEvents
   */
  this.events = null;

  /**
   * The panel content element.
   * @type Element
   */
  this.content = null;

  // The initial viewport scroll position.
  var vScrollLeft = 0, vScrollTop = 0,
      btn_close = null, btn_minimize = null;

  /**
   * Initialize the floating panel.
   * @private
   */
  function init () {
    _self.events = new pwlib.appEvents(_self);

    _self.id = _self.container.getAttribute('data-pwFloatingPanel');

    var ttl = _self.container.getElementsByTagName('h1')[0],
        content = _self.container.getElementsByTagName('div')[0],
        cs = win.getComputedStyle(_self.container, null),
        zIndex = parseInt(cs.zIndex);

    cStyle.zIndex = cs.zIndex;

    if (zIndex > panels.zIndex_) {
      panels.zIndex_ = zIndex;
    }

    _self.container.className += ' ' + gui.classPrefix + 'floatingPanel ' +
      gui.classPrefix + 'floatingPanel_' + _self.id;

    // the content
    content.className += ' ' + gui.classPrefix + 'floatingPanel_content';
    _self.content = content;

    // setup the title element
    ttl.className += ' ' + gui.classPrefix + 'floatingPanel_title';
    ttl.replaceChild(doc.createTextNode(lang.floatingPanels[_self.id]), 
        ttl.firstChild);

    ttl.addEventListener('mousedown', ev_mousedown, false);

    // allow auto-hide for the panel
    if (_self.container.getAttribute('data-pwPanelHide') === 'true') {
      _self.hide();
    } else {
      _self.state = _self.STATE_VISIBLE;
    }

    // Find the viewport parent element.
    var pNode = _self.container.parentNode,
        found = null;

    while (!found && pNode) {
      if (pNode.nodeName.toLowerCase() === 'html') {
        found = pNode;
        break;
      }

      cs = win.getComputedStyle(pNode, null);
      if (cs && (cs.overflow === 'scroll' || cs.overflow === 'auto')) {
        found = pNode;
      } else {
        pNode = pNode.parentNode;
      }
    }

    _self.viewport = found;

    // add the panel minimize button.
    btn_minimize = doc.createElement('a');
    btn_minimize.href = '#';
    btn_minimize.title = lang.floatingPanelMinimize;
    btn_minimize.className = gui.classPrefix + 'floatingPanel_minimize';
    btn_minimize.addEventListener('click', ev_minimize, false);
    btn_minimize.appendChild(doc.createTextNode(btn_minimize.title));

    _self.container.insertBefore(btn_minimize, content);

    // add the panel close button.
    btn_close = doc.createElement('a');
    btn_close.href = '#';
    btn_close.title = lang.floatingPanelClose;
    btn_close.className = gui.classPrefix + 'floatingPanel_close';
    btn_close.addEventListener('click', ev_close, false);
    btn_close.appendChild(doc.createTextNode(btn_close.title));

    _self.container.insertBefore(btn_close, content);

    // setup the panel resize handle.
    if (_self.container.getAttribute('data-pwPanelResizable') === 'true') {
      var resizeHandle = doc.createElement('div');
      resizeHandle.className = gui.classPrefix + 'floatingPanel_resizer';
      _self.container.appendChild(resizeHandle);
      _self.resizer = new pwlib.guiResizer(gui, resizeHandle, _self.container);
    }
  };

  /**
   * The <code>click</code> event handler for the panel Minimize button element.
   *
   * <p>This method dispatches the {@link 
   * pwlib.appEvent.guiFloatingPanelStateChange} application event.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function ev_minimize (ev) {
    ev.preventDefault();
    try {
      this.focus();
    } catch (err) { }

    var classMinimized = ' ' + gui.classPrefix + 'floatingPanel_minimized';

    if (_self.state === _self.STATE_MINIMIZED) {
      _self.state = _self.STATE_VISIBLE;

      this.title = lang.floatingPanelMinimize;
      this.className = gui.classPrefix + 'floatingPanel_minimize';
      this.replaceChild(doc.createTextNode(this.title), this.firstChild);

      if (_self.container.className.indexOf(classMinimized) !== -1) {
        _self.container.className 
          = _self.container.className.replace(classMinimized, '');
      }

    } else if (_self.state === _self.STATE_VISIBLE) {
      _self.state = _self.STATE_MINIMIZED;

      this.title = lang.floatingPanelRestore;
      this.className = gui.classPrefix + 'floatingPanel_restore';
      this.replaceChild(doc.createTextNode(this.title), this.firstChild);

      if (_self.container.className.indexOf(classMinimized) === -1) {
        _self.container.className += classMinimized;
      }
    }

    _self.events.dispatch(new appEvent.guiFloatingPanelStateChange(_self.state));

    _self.bringOnTop();
  };

  /**
   * The <code>click</code> event handler for the panel Close button element.  
   * This hides the floating panel.
   *
   * <p>This method dispatches the {@link 
   * pwlib.appEvent.guiFloatingPanelStateChange} application event.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function ev_close (ev) {
    ev.preventDefault();
    _self.hide();
    try {
      guiPlaceholder.focus();
    } catch (err) { }
  };

  /**
   * The <code>mousedown</code> event handler. This is invoked when you start 
   * dragging the floating panel.
   *
   * <p>This method dispatches the {@link 
   * pwlib.appEvent.guiFloatingPanelStateChange} application event.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function ev_mousedown (ev) {
    _self.state = _self.STATE_DRAGGING;

    mx = ev.clientX;
    my = ev.clientY;

    var cs = win.getComputedStyle(_self.container, null);

    ptop  = parseInt(cs.top);
    pleft = parseInt(cs.left);

    if (_self.viewport) {
      vScrollLeft = _self.viewport.scrollLeft;
      vScrollTop  = _self.viewport.scrollTop;
    }

    _self.bringOnTop();

    doc.addEventListener('mousemove', ev_mousemove, false);
    doc.addEventListener('mouseup',   ev_mouseup,   false);

    _self.events.dispatch(new appEvent.guiFloatingPanelStateChange(_self.state));

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
    var x = pleft + ev.clientX - mx,
        y = ptop  + ev.clientY - my;

    if (_self.viewport) {
      if (_self.viewport.scrollLeft !== vScrollLeft) {
        x += _self.viewport.scrollLeft - vScrollLeft;
      }
      if (_self.viewport.scrollTop !== vScrollTop) {
        y += _self.viewport.scrollTop - vScrollTop;
      }
    }

    cStyle.left = x + 'px';
    cStyle.top  = y + 'px';
  };

  /**
   * The <code>mouseup</code> event handler. This ends the panel drag operation.
   *
   * <p>This method dispatches the {@link 
   * pwlib.appEvent.guiFloatingPanelStateChange} application event.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function ev_mouseup (ev) {
    if (_self.container.className.indexOf(' ' + gui.classPrefix 
          + 'floatingPanel_minimized') !== -1) {
      _self.state = _self.STATE_MINIMIZED;
    } else {
      _self.state = _self.STATE_VISIBLE;
    }

    doc.removeEventListener('mousemove', ev_mousemove, false);
    doc.removeEventListener('mouseup',   ev_mouseup,   false);

    try {
      guiPlaceholder.focus();
    } catch (err) { }

    _self.events.dispatch(new appEvent.guiFloatingPanelStateChange(_self.state));
  };

  /**
   * Bring the panel to the top. This method makes sure the current floating 
   * panel is visible.
   */
  this.bringOnTop = function () {
    panels.zIndex_ += zIndex_step;
    cStyle.zIndex = panels.zIndex_;
  };

  /**
   * Hide the panel.
   *
   * <p>This method dispatches the {@link 
   * pwlib.appEvent.guiFloatingPanelStateChange} application event.
   */
  this.hide = function () {
    cStyle.display = 'none';
    _self.state = _self.STATE_HIDDEN;
    _self.events.dispatch(new appEvent.guiFloatingPanelStateChange(_self.state));
  };

  /**
   * Show the panel.
   *
   * <p>This method dispatches the {@link 
   * pwlib.appEvent.guiFloatingPanelStateChange} application event.
   */
  this.show = function () {
    if (_self.state === _self.STATE_VISIBLE) {
      return;
    }

    cStyle.display = 'block';
    _self.state = _self.STATE_VISIBLE;

    var classMinimized = ' ' + gui.classPrefix + 'floatingPanel_minimized';

    if (_self.container.className.indexOf(classMinimized) !== -1) {
      _self.container.className 
        = _self.container.className.replace(classMinimized, '');

      btn_minimize.className = gui.classPrefix + 'floatingPanel_minimize';
      btn_minimize.title = lang.floatingPanelMinimize;
      btn_minimize.replaceChild(doc.createTextNode(btn_minimize.title), 
          btn_minimize.firstChild);
    }

    _self.events.dispatch(new appEvent.guiFloatingPanelStateChange(_self.state));

    _self.bringOnTop();
  };

  /**
   * Toggle the panel visibility.
   *
   * <p>This method dispatches the {@link 
   * pwlib.appEvent.guiFloatingPanelStateChange} application event.
   */
  this.toggle = function () {
    if (_self.state === _self.STATE_VISIBLE || _self.state === 
        _self.STATE_MINIMIZED) {
      _self.hide();
    } else {
      _self.show();
    }
  };

  init();
};

/**
 * @class The state change event for the floating panel. This event is fired 
 * when the floating panel changes its state. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {Number} state The floating panel state.
 */
pwlib.appEvent.guiFloatingPanelStateChange = function (state) {
  /**
   * Panel state: hidden.
   * @constant
   */
  this.STATE_HIDDEN    = 0;

  /**
   * Panel state: visible.
   * @constant
   */
  this.STATE_VISIBLE   = 1;

  /**
   * Panel state: minimized.
   * @constant
   */
  this.STATE_MINIMIZED = 3;

  /**
   * Panel state: the user is dragging the floating panel.
   * @constant
   */
  this.STATE_DRAGGING  = 4;

  /**
   * The current floating panel state.
   * @type Number
   */
  this.state = state;

  pwlib.appEvent.call(this, 'guiFloatingPanelStateChange');
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
pwlib.guiResizer = function (gui, resizeHandle, container) {
  var _self              = this,
      cStyle             = container.style,
      doc                = gui.app.doc,
      guiResizeEnd       = pwlib.appEvent.guiResizeEnd,
      guiResizeMouseMove = pwlib.appEvent.guiResizeMouseMove,
      guiResizeStart     = pwlib.appEvent.guiResizeStart,
      win                = gui.app.win;

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
   * The viewport element. This element is the first parent element which has 
   * the style.overflow set to "auto" or "scroll".
   * @type Element
   */
  this.viewport = null;

  /**
   * Tells if the GUI resizer should dispatch the {@link 
   * pwlib.appEvent.guiResizeMouseMove} application event when the user moves 
   * the mouse during the resize operation.
   *
   * @type Boolean
   * @default false
   */
  this.dispatchMouseMove = false;

  /**
   * Tells if the user resizing the container now.
   *
   * @type Boolean
   * @default false
   */
  this.resizing = false;

  // The initial position of the mouse.
  var mx = 0, my = 0;

  // The initial container dimensions.
  var cWidth = 0, cHeight = 0;

  // The initial viewport scroll position.
  var vScrollLeft = 0, vScrollTop = 0;

  /**
   * Initialize the resize functionality.
   * @private
   */
  function init () {
    _self.events = new pwlib.appEvents(_self);
    resizeHandle.addEventListener('mousedown', ev_mousedown, false);

    // Find the viewport parent element.
    var cs, pNode = _self.container.parentNode,
        found = null;
    while (!found && pNode) {
      if (pNode.nodeName.toLowerCase() === 'html') {
        found = pNode;
        break;
      }

      cs = win.getComputedStyle(pNode, null);
      if (cs && (cs.overflow === 'scroll' || cs.overflow === 'auto')) {
        found = pNode;
      } else {
        pNode = pNode.parentNode;
      }
    }

    _self.viewport = found;
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

    var cs = win.getComputedStyle(_self.container, null);
    cWidth  = parseInt(cs.width);
    cHeight = parseInt(cs.height);

    var cancel = _self.events.dispatch(new guiResizeStart(mx, my, cWidth, 
          cHeight));

    if (cancel) {
      return;
    }

    if (_self.viewport) {
      vScrollLeft = _self.viewport.scrollLeft;
      vScrollTop  = _self.viewport.scrollTop;
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
    var w = cWidth  + ev.clientX - mx,
        h = cHeight + ev.clientY - my;

    if (_self.viewport) {
      if (_self.viewport.scrollLeft !== vScrollLeft) {
        w += _self.viewport.scrollLeft - vScrollLeft;
      }
      if (_self.viewport.scrollTop !== vScrollTop) {
        h += _self.viewport.scrollTop - vScrollTop;
      }
    }

    cStyle.width  = w + 'px';
    cStyle.height = h + 'px';

    if (_self.dispatchMouseMove) {
      _self.events.dispatch(new guiResizeMouseMove(ev.clientX, ev.clientY, w, 
            h));
    }
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
    var cancel = _self.events.dispatch(new guiResizeEnd(ev.clientX, ev.clientY, 
          parseInt(cStyle.width), parseInt(cStyle.height)));

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
 * @class The GUI element resize start event. This event is cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {Number} x The mouse location on the x-axis.
 * @param {Number} y The mouse location on the y-axis.
 * @param {Number} width The element width.
 * @param {Number} height The element height.
 */
pwlib.appEvent.guiResizeStart = function (x, y, width, height) {
  /**
   * The mouse location on the x-axis.
   * @type Number
   */
  this.x = x;

  /**
   * The mouse location on the y-axis.
   * @type Number
   */
  this.y = y;

  /**
   * The element width.
   * @type Number
   */
  this.width = width;

  /**
   * The element height.
   * @type Number
   */
  this.height = height;

  pwlib.appEvent.call(this, 'guiResizeStart', true);
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
pwlib.appEvent.guiResizeEnd = function (x, y, width, height) {
  /**
   * The mouse location on the x-axis.
   * @type Number
   */
  this.x = x;

  /**
   * The mouse location on the y-axis.
   * @type Number
   */
  this.y = y;

  /**
   * The element width.
   * @type Number
   */
  this.width = width;

  /**
   * The element height.
   * @type Number
   */
  this.height = height;

  pwlib.appEvent.call(this, 'guiResizeEnd', true);
};

/**
 * @class The GUI element resize mouse move event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {Number} x The mouse location on the x-axis.
 * @param {Number} y The mouse location on the y-axis.
 * @param {Number} width The element width.
 * @param {Number} height The element height.
 */
pwlib.appEvent.guiResizeMouseMove = function (x, y, width, height) {
  /**
   * The mouse location on the x-axis.
   * @type Number
   */
  this.x = x;

  /**
   * The mouse location on the y-axis.
   * @type Number
   */
  this.y = y;

  /**
   * The element width.
   * @type Number
   */
  this.width = width;

  /**
   * The element height.
   * @type Number
   */
  this.height = height;

  pwlib.appEvent.call(this, 'guiResizeMouseMove');
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
pwlib.guiTabPanel = function (gui, panel) {
  var _self    = this,
      appEvent = pwlib.appEvent,
      doc      = gui.app.doc,
      lang     = gui.app.lang;

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
        type = gui.app.ELEMENT_NODE,
        elem = null,
        tabId = null,
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
        anchor.title = lang.tabs[_self.id][tabId + 'Title'] || 
          lang.tabs[_self.id][tabId];
        anchor.appendChild(doc.createTextNode(lang.tabs[_self.id][tabId]));
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
    ev.preventDefault();
    _self.tabActivate(this.parentNode._pwTab);
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

    try {
      tabButton.firstChild.focus();
    } catch (err) { }

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
 * @class The GUI tab activation event. This event is cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {String} tabId The ID of the tab being activated.
 * @param {String} prevTabId The ID of the previously active tab.
 */
pwlib.appEvent.guiTabActivate = function (tabId, prevTabId) {
  /**
   * The ID of the tab being activated.
   * @type String
   */
  this.tabId = tabId;

  /**
   * The ID of the previously active tab.
   * @type String
   */
  this.prevTabId = prevTabId;

  pwlib.appEvent.call(this, 'guiTabActivate', true);
};

/**
 * @class The color input GUI component.
 *
 * @private
 *
 * @param {pwlib.gui} gui Reference to the PaintWeb GUI object.
 *
 * @param {Element} input Reference to the DOM input element. This can be 
 * a span, a div, or any other tag.
 */
pwlib.guiColorInput = function (gui, input) {
  var _self      = this,
      colormixer = null,
      config     = gui.app.config,
      doc        = gui.app.doc,
      MathRound  = Math.round,
      lang       = gui.app.lang;

  /**
   * Color input ID. The ID is the same as the data-pwColorInput attribute value 
   * of the DOM input element .
   *
   * @type String.
   */
  this.id = null;

  /**
   * The color input element DOM reference.
   *
   * @type Element
   */
  this.input = input;

  /**
   * The configuration property to which this color input is attached to.
   * @type String
   */
  this.configProperty = null;

  /**
   * The configuration group to which this color input is attached to.
   * @type String
   */
  this.configGroup = null;

  /**
   * Reference to the configuration object which holds the color input value.
   * @type String
   */
  this.configGroupRef = null;

  /**
   * Holds the current color displayed by the input.
   *
   * @type Object
   */
  this.color = {red: 0, green: 0, blue: 0, alpha: 0};

  /**
   * Initialize the color input functionality.
   * @private
   */
  function init () {
    var cfgAttr     = _self.input.getAttribute('data-pwColorInput'),
        cfgNoDots   = cfgAttr.replace('.', '_'),
        cfgArray    = cfgAttr.split('.'),
        cfgProp     = cfgArray.pop(),
        cfgGroup    = cfgArray.join('.'),
        cfgGroupRef = config,
        langGroup   = lang.inputs,
        labelElem   = _self.input.parentNode,
        anchor      = doc.createElement('a'),
        color;

    for (var i = 0, n = cfgArray.length; i < n; i++) {
      cfgGroupRef = cfgGroupRef[cfgArray[i]];
      langGroup = langGroup[cfgArray[i]];
    }

    _self.configProperty = cfgProp;
    _self.configGroup = cfgGroup;
    _self.configGroupRef = cfgGroupRef;

    _self.id = cfgNoDots;

    _self.input.className += ' ' + gui.classPrefix + 'colorInput' 
      + ' ' + gui.classPrefix + _self.id;

    labelElem.replaceChild(doc.createTextNode(langGroup[cfgProp]), 
        labelElem.firstChild);

    color = _self.configGroupRef[_self.configProperty];
    color = color.replace(/\s+/g, '').replace(/^rgba\(/, '').replace(/\)$/, '');
    color = color.split(',');
    _self.color.red   = color[0] / 255;
    _self.color.green = color[1] / 255;
    _self.color.blue  = color[2] / 255;
    _self.color.alpha = color[3];

    anchor.style.backgroundColor = 'rgb(' + color[0] + ',' + color[1] + ',' 
        + color[2] + ')';
    anchor.style.opacity = color[3];

    anchor.href = '#';
    anchor.title = langGroup[cfgProp + 'Title'] || langGroup[cfgProp];
    anchor.appendChild(doc.createTextNode(lang.inputs.colorInputAnchorContent));
    anchor.addEventListener('click', ev_input_click, false);

    _self.input.replaceChild(anchor, _self.input.firstChild);
  };

  /**
   * The <code>click</code> event handler for the color input element. This 
   * function shows/hides the Color Mixer panel.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function ev_input_click (ev) {
    ev.preventDefault();

    if (!colormixer) {
      colormixer = gui.app.extensions.colormixer;
    }

    if (!colormixer.targetInput || colormixer.targetInput.id !== _self.id) {
      colormixer.show({
          id: _self.id,
          configProperty: _self.configProperty,
          configGroup: _self.configGroup,
          configGroupRef: _self.configGroupRef,
          show: colormixer_show,
          hide: colormixer_hide
        }, _self.color);

    } else {
      colormixer.hide();
    }
  };

  /**
   * The color mixer <code>show</code> event handler. This function is invoked 
   * when the color mixer is shown.
   * @private
   */
  function colormixer_show () {
    var classActive = ' ' + gui.classPrefix + 'colorInputActive',
        elemActive = _self.input.className.indexOf(classActive) !== -1;

    if (!elemActive) {
      _self.input.className += classActive;
    }
  };

  /**
   * The color mixer <code>hide</code> event handler. This function is invoked 
   * when the color mixer is hidden.
   * @private
   */
  function colormixer_hide () {
    var classActive = ' ' + gui.classPrefix + 'colorInputActive',
        elemActive = _self.input.className.indexOf(classActive) !== -1;

    if (elemActive) {
      _self.input.className = _self.input.className.replace(classActive, '');
    }
  };

  /**
   * Update color. This method allows the change of the color values associated 
   * to the current color input.
   *
   * <p>This method is used by the color picker tool and by the global GUI 
   * <code>configChange</code> application event handler.
   *
   * @param {Object} color The new color values. The object must have four 
   * properties: <var>red</var>, <var>green</var>, <var>blue</var> and 
   * <var>alpha</var>. All values must be between 0 and 1.
   */
  this.updateColor = function (color) {
    var anchor = _self.input.firstChild.style;

    anchor.opacity         = color.alpha;
    anchor.backgroundColor = 'rgb(' + MathRound(color.red   * 255) + ',' +
                                      MathRound(color.green * 255) + ',' +
                                      MathRound(color.blue  * 255) + ')';
    _self.color.red   = color.red;
    _self.color.green = color.green;
    _self.color.blue  = color.blue;
    _self.color.alpha = color.alpha;
  };

  init();
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

