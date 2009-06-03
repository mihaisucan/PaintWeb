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
 * $Date: 2009-06-03 17:15:02 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview The main PaintWeb application code.
 */

(function () {
/**
 * The PaintWeb application object.
 *
 * @param {Window} [win_=window] The window object to use.
 * @param {Document} [doc_=document] The document object to use.
 */
function PaintWeb (win_, doc_) {
  var _self = this;

  /**
   * PaintWeb version.
   * @type Number
   */
  this.version = 0.9;

  /**
   * PaintWeb build date (YYYYMMDD).
   * @type Number
   */
  this.build = 20090603;

  /**
   * Holds all the PaintWeb configuration.
   * @type Object
   */
  this.config = {
    baseFolder: '',
    configFile: 'config.json',
    showErrors: true
  };

  /**
   * Holds all language strings used within PaintWeb.
   */
  // Here we include a minimal set of strings, used in case the language file will 
  // not load.
  this.lang = {
    "errorElementNotFound": "Error: the following element was not found: %id%.",
    "errorInitGetComputedStyle": "Error: window.getComputedStyle is not available.",
    "errorInitXMLHttpRequest": "Error: window.XMLHttpRequest is not available.",
    "errorInitJSON": "Error: window.JSON is not available.",
    "errorInitCanvas": "Error: Your browser does not support Canvas."
  };

  /**
   * Holds the buffer canvas and context references.
   * @type Object
   */
  this.buffer = {canvas: null, context: null};

  /**
   * Holds the current layer ID, canvas and context references.
   * @type Object
   */
  this.layer = {id: null, canvas: null, context: null};

  /**
   * The instance of the active tool object.
   *
   * @type Object
   *
   * @see PaintWeb.config.toolDefault holds the ID of the tool which is 
   * activated when the application loads.
   * @see PaintWeb#toolActivate Activate a drawing tool by ID.
   * @see PaintWeb#toolRegister Register a new drawing tool.
   * @see PaintWeb#toolUnregister Unregister a drawing tool.
   * @see pwlib.tools holds the drawing tools.
   */
  this.tool = null;

  /**
   * Holds references to DOM elements.
   *
   * @private
   * @type Object
   */
  this.elems = {};

  /**
   * Holds the last recorded mouse coordinates and the button state (if it's 
   * down or not).
   *
   * @private
   * @type Object
   */
  this.mouse = {x: 0, y: 0, buttonDown: false};

  /**
   * Holds all the PaintWeb extensions.
   *
   * @type Object
   * @see PaintWeb#extensionRegister Register a new extension.
   * @see PaintWeb#extensionUnregister Unregister an extension.
   * @see PaintWeb.config.extensions Holds the list of extensions to be loaded 
   * automatically when PaintWeb is initialized.
   */
  this.extensions = {};

  /**
   * The document element we will be working with.
   *
   * @private
   * @type Document
   * @default document
   */
  this.doc = doc_ || document;

  /**
   * The window object we will be working with.
   *
   * @private
   * @type Window
   * @default window
   */
  this.win = win_ || window;

  /**
   * Holds image information: width and height.
   *
   * @type Object
   */
  this.image = {
    /**
     * Image width.
     *
     * @type Number
     */
    width: 0,

    /**
     * Image height.
     *
     * @type Number
     */
    height: 0,

    /**
     * Image zoom level. This property holds the current image zoom level used 
     * by the user for viewing the image.
     *
     * @type Number
     * @default 1
     */
    zoom: 1,

    /**
     * Image scaling. The canvas elements are scaled from CSS using this value 
     * as the scaling factor. This value is dependant on the browser rendering 
     * resolution and on the user-defined image zoom level.
     *
     * @type Number
     * @default 1
     */
    canvasScale: 1
  };

  /**
   * Resolution information.
   *
   * @type Object
   */
  this.resolution = {
    /**
     * Optimal DPI for the canvas elements.
     *
     * @private
     * @type Number
     * @default 96
     */
    dpiOptimal: 96,

    /**
     * The current DPI used by the browser for rendering the entire page.
     *
     * @type Number
     * @default 96
     */
    dpiLocal: 96,

    /**
     * The current zoom level used by the browser for rendering the entire page.
     *
     * @type Number
     * @default 1
     */
    browserZoom: 1,

    /**
     * The scaling factor used by the browser for rendering the entire page. For 
     * example, on Gecko using DPI 200 the scale factor is 2.
     *
     * @private
     * @type Number
     * @default 1
     */
    scale: 1
  };

  /**
   * The image history.
   *
   * @type Object
   */
  this.history = {
    /**
     * History position.
     *
     * @type Number
     * @default 0
     */
    pos: 0,

    /**
     * The ImageDatas for each history state.
     *
     * @private
     * @type Array
     */
    states: []
  };

  /**
   * Image in the clipboard. This is used when some selection is copy/pasted.  
   * 
   * @type ImageData
   */
  this.clipboard = false;

  /**
   * Application initialization state. This property can be in one of the 
   * following states:
   *
   * <ul>
   *   <li>{@link PaintWeb.INIT_NOT_STARTED} - The initialization is not 
   *   started.
   *
   *   <li>{@link PaintWeb.INIT_STARTED} - The initialization process is 
   *   running.
   *
   *   <li>{@link PaintWeb.INIT_DONE} - The initialization process has completed 
   *   successfully.
   *
   *   <li>{@link PaintWeb.INIT_ERROR} - The initialization process has failed.
   * </ul>
   *
   * @type Number
   * @default PaintWeb.INIT_NOT_STARTED
   */
  this.initialized = PaintWeb.INIT_NOT_STARTED;

  /**
   * Custom application events object.
   *
   * @type pwlib.appEvents
   */
  this.events = null;

  /**
   * Unique ID for the current PaintWeb instance.
   *
   * @type Number
   */
  this.UID = 0;

  /**
   * Holds the keyboard event listener object.
   *
   * @private
   * @type pwlib.dom.KeyboardEventListener
   * @see pwlib.dom.KeyboardEventListener The class dealing with the 
   * cross-browser differences in the DOM keyboard events.
   */
  var kbListener_ = null;

  /**
   * Holds temporary state information during PaintWeb initialization.
   *
   * @private
   * @type Object
   */
  var temp_ = {onInit: null, toolsLoadQueue: 0, extensionsLoadQueue: 0};

  // Avoid global scope lookup.
  var MathAbs   = Math.abs,
      MathFloor = Math.floor,
      MathMax   = Math.max,
      MathMin   = Math.min,
      MathRound = Math.round,
      pwlib     = null,
      appEvent  = null,
      lang      = this.lang;

  /**
   * PaintWeb pre-initialization code. This runs when the PaintWeb instance is 
   * constructed.
   * @private
   */
  function preInit() {
    _self.UID = (new Date()).getMilliseconds() * MathRound(Math.random() * 100);

    _self.elems.head = _self.doc.getElementsByTagName('head')[0] || 
      _self.doc.body;
  };

  /**
   * Initialize PaintWeb.
   *
   * <p>This method asynchronous, meaning that it will return much sooner before 
   * the application initialization is completed.
   *
   * @param {Function} [handler] The <code>initApp</code> event handler. Your 
   * event handler will be invoked automatically when PaintWeb completes 
   * loading, or when an error occurs.
   *
   * @returns {Boolean} True if the initialization has been started 
   * successfully, or false if not.
   */
  this.init = function (handler) {
    if (this.initialized === PaintWeb.INIT_DONE) {
      return true;
    }

    this.initialized = PaintWeb.INIT_STARTED;

    if (handler && typeof handler !== 'function') {
      throw new TypeError("The first argument must be a function.");
    }

    temp_.onInit = handler;

    // Check Canvas support.
    if (!document.createElement('canvas').getContext) {
      this.initError(lang.errorInitCanvas);
      return false;
    }

    // Basic functionality used within the Web application.
    if (!window.getComputedStyle) {
      this.initError(lang.errorInitGetComputedStyle);
      return false;
    }

    if (!window.XMLHttpRequest) {
      this.initError(lang.errorInitXMLHttpRequest);
      return false;
    }

    // JSON parser and serializer.
    if (!window.JSON) {
      this.scriptLoad(_self.config.baseFolder + 'includes/json2.js', 
          this.jsonlibReady);
    } else {
      this.jsonlibReady();
    }

    return true;
  };

  /**
   * The <code>load</code> event handler for the JSON library script.
   * @private
   */
  this.jsonlibReady = function () {
    if (window.pwlib) {
      _self.pwlibReady();
    } else {
      _self.scriptLoad(_self.config.baseFolder + 'includes/lib.js', 
          _self.pwlibReady);
    }
  };

  /**
   * The <code>load</code> event handler for the PaintWeb library script.
   * @private
   */
  this.pwlibReady = function () {
    pwlib = window.pwlib;
    appEvent = pwlib.appEvent;

    // Create the custom application events object.
    _self.events = new pwlib.appEvents(_self);

    // Add the init event handler.
    if (typeof temp_.onInit === 'function') {
      _self.events.add('initApp', temp_.onInit);
      delete temp_.onInit;
    }

    _self.configLoad();
  };

  /**
   * Report an initialization error.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.initApp} event.
   *
   * @private
   *
   * @param {String} msg The error message.
   *
   * @see pwlib.appEvent.initApp
   */
  this.initError = function (msg) {
    switch (this.initialized) {
      case PaintWeb.INIT_ERROR:
      case PaintWeb.INIT_DONE:
      case PaintWeb.INIT_NOT_STARTED:
        return;
    }

    this.initialized = PaintWeb.INIT_ERROR;

    var ev = null;

    if (this.events && 'dispatch' in this.events && appEvent && 'initApp' in 
        appEvent) {
      ev = new appEvent.initApp(this.initialized, msg);
      this.events.dispatch(ev);

    } else if (typeof temp_.onInit === 'function') {
      // fake an event dispatch.
      ev = {type: 'initApp', state: this.initialized, errorMessage: msg};
      temp_.onInit.call(this, ev);
    }

    if (this.config.showErrors) {
      alert(msg);
    } else if (window.console && console.log) {
      console.log(msg);
    }
  };

  /**
   * Asynchronously load the configuration file. This method issues an 
   * XMLHttpRequest to load the JSON file.
   *
   * @see PaintWeb.config.configFile The configuration file.
   * @see pwlib#xhrLoad The library function being used for creating the 
   * XMLHttpRequest object.
   */
  this.configLoad = function () {
    pwlib.xhrLoad(this.config.baseFolder + this.config.configFile, 
        this.configReady);
  };

  /**
   * The configuration reader. This is the event handler for the XMLHttpRequest 
   * object, for the <code>onreadystatechange</code> event.
   *
   * @private
   *
   * @param {XMLHttpRequest} xhr The XMLHttpRequest object being handled.
   *
   * @see PaintWeb#configLoad The method which issues the XMLHttpRequest request 
   * for loading the configuration file.
   */
  this.configReady = function (xhr) {
    /*
     * readyState values:
     *   0 UNINITIALIZED open() has not been called yet.
     *   1 LOADING send() has not been called yet.
     *   2 LOADED send() has been called, headers and status are available.
     *   3 INTERACTIVE Downloading, responseText holds the partial data.
     *   4 COMPLETED Finished with all operations.
     */
    if (!xhr || xhr.readyState !== 4 || xhr.status !== 200 || !xhr.responseText) {
      return;
    }

    var config = pwlib.jsonParse(xhr.responseText);

    // Overwrite any existing configuration.
    pwlib.extend(true, _self.config, config);

    _self.langLoad();
  };

  /**
   * Asynchronously load the language file. This method issues an XMLHttpRequest 
   * to load the JSON file.
   *
   * @private
   *
   * @see PaintWeb.config.langFile The language file.
   * @see pwlib#xhrLoad The library function being used for creating the 
   * XMLHttpRequest object.
   */
  this.langLoad = function () {
    pwlib.xhrLoad(this.config.baseFolder + this.config.langFile, 
        this.langReady);
  };

  /**
   * The language file reader. This is the event handler for the XMLHttpRequest 
   * object, for the <code>onreadystatechange</code> event.
   *
   * @private
   *
   * @param {XMLHttpRequest} xhr The XMLHttpRequest object being handled.
   *
   * @see PaintWeb#langLoad The method which issues the XMLHttpRequest request 
   * for loading the language file.
   */
  this.langReady = function (xhr) {
    if (!xhr || xhr.readyState !== 4 || xhr.status !== 200 || !xhr.responseText) {
      return;
    }

    var lang_new = pwlib.jsonParse(xhr.responseText);

    pwlib.extend(_self.lang, lang_new);

    _self.guiLoad();
  };

  /**
   * Load th PaintWeb GUI. This method loads the GUI markup file, the stylesheet 
   * and the script.
   *
   * @private
   *
   * @see PaintWeb.config.guiStyle The interface style file.
   * @see PaintWeb.config.guiScript The interface script file.
   * @see pwlib.gui The namespace holding the interfaces.
   */
  this.guiLoad = function () {
    var cfg    = this.config,
        gui    = this.config.gui,
        base   = cfg.baseFolder + cfg.interfacesFolder + '/' + gui + '/',
        style  = base + cfg.guiStyle,
        script = base + cfg.guiScript;

    if (!(gui in pwlib.gui)) {
      this.styleInsert(style);
      this.scriptLoad(script, this.guiScriptReady);
    } else {
      this.guiScriptReady();
    }
  };

  /**
   * The <code>load</code> event handler for the PaintWeb GUI script. This 
   * method creates an instance of the GUI object that just loaded and starts 
   * loading the GUI markup.
   *
   * @private
   *
   * @see PaintWeb.config.guiScript The interface script file.
   * @see PaintWeb.config.guiMarkup The interface markup file.
   * @see pwlib.gui The namespace holding the interfaces.
   * @see pwlib#xhrLoad The library function being used for creating the 
   * XMLHttpRequest object.
   */
  this.guiScriptReady = function () {
    var cfg    = _self.config,
        gui    = _self.config.gui,
        base   = cfg.baseFolder + cfg.interfacesFolder + '/' + gui + '/',
        markup = base + cfg.guiMarkup;

    _self.gui = new pwlib.gui[gui](_self);

    pwlib.xhrLoad(markup, _self.guiMarkupReady);
  };

  /**
   * The GUI markup reader. This is the event handler for the XMLHttpRequest 
   * object, for the <code>onreadystatechange</code> event.
   *
   * @private
   *
   * @param {XMLHttpRequest} xhr The XMLHttpRequest object being handled.
   *
   * @see PaintWeb#guiScriptReady The method which issues the XMLHttpRequest 
   * request for loading the interface markup file.
   */
  this.guiMarkupReady = function (xhr) {
    if (!xhr || xhr.readyState !== 4 || xhr.status !== 200 || !xhr.responseXML) {
      return;
    }

    if (!_self.gui.init(xhr.responseXML)) {
      _self.initError(lang.errorInitGUI);
      return;
    }

    _self.initTools();
  };

  /**
   * Initialize the Canvas elements.
   *
   * @private
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.initCanvas = function () {
    var layerCanvas = this.layer.canvas,
        bufferCanvas = this.buffer.canvas;

    this.layer.context = layerCanvas.getContext('2d');
    if (!this.layer.context) {
      this.initError(lang.errorInitContext);
      return false;
    }

    this.image.width  = layerCanvas.width;
    this.image.height = layerCanvas.height;

    this.buffer.context = bufferCanvas.getContext('2d');

    this.updateCanvasScaling();
    this.win.addEventListener('resize', this.updateCanvasScaling, false);

    // The initial blank state of the image
    this.historyAdd();

    /*
     * Setup the event listeners for the canvas element.
     *
     * The event handler (ev_canvas) calls the event handlers associated with 
     * the active tool (e.g. tool.mousemove).
     */
    var events = ['click', 'mousedown', 'mouseup', 'mousemove', 'contextmenu'],
        n = events.length;

    for (var i = 0; i < n; i++) {
      bufferCanvas.addEventListener(events[i], this.ev_canvas, false);
    }

    return true;
  };

  /**
   * Initialization procedure which runs after the configuration, language and 
   * GUI files have loaded.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.initApp} event.
   *
   * @private
   *
   * @see pwlib.appEvent.initApp
   */
  this.initComplete = function () {
    // Load the extensions.
    if (!this.initExtensions()) {
      return false;
    }

    // The global keyboard events handler implements everything needed for 
    // switching between tools and for accessing any other functionality of the 
    // Web application.
    kbListener_ = new pwlib.dom.KeyboardEventListener(window,
        {keydown:  this.ev_keyboard,
         keypress: this.ev_keyboard,
         keyup: this.ev_keyboard});

    this.initialized = PaintWeb.INIT_DONE;

    this.events.dispatch(new appEvent.initApp(this.initialized));
  };

  /**
   * Load all the configured drawing tools.
   * @private
   */
  this.initTools = function () {
    var id   = '',
        cfg  = this.config,
        n    = cfg.tools.length,
        base = cfg.baseFolder + cfg.toolsFolder + '/';

    temp_.toolsLoadQueue = n;
    console.log('initTools n ' + temp_.toolsLoadQueue);

    for (var i = 0; i < n; i++) {
      id = cfg.tools[i];

      console.log('initTools i ' + i + ' id ' + id);

      if (id in pwlib.tools) {
        this.toolLoaded();
      } else {
        this.scriptLoad(base + id + 'js' , this.toolLoaded);
      }
    }
  };

  /**
   * The <code>load</code> event handler for each tool script.
   * @private
   */
  this.toolLoaded = function () {
    console.log('toolLoaded ' + temp_.toolsLoadQueue);
    temp_.toolsLoadQueue--;

    if (temp_.toolsLoadQueue === 0) {
      console.log('toolLoaded yay');
      var tools = _self.config.tools,
          n = tools.length;

      for (var i = 0; i < n; i++) {
        if (!_self.toolRegister(tools[i])) {
          _self.initError(lang.errorInitTools);
          return;
        }
      }

      _self.initExtensions();
    }
  };

  /**
   * Load all the extensions.
   * @private
   */
  this.initExtensions = function () {
    var id   = '',
        cfg  = this.config,
        n    = cfg.extensions.length,
        base = cfg.baseFolder + cfg.extensionsFolder + '/';

    temp_.extensionsLoadQueue = n;

    for (var i = 0; i < n; i++) {
      id = cfg.extensions[i];
      if (id in pwlib.extensions) {
        this.extensionLoaded();
      } else {
        this.scriptInsert(base + id + '.js', this.extensionLoaded);
      }
    }
  };

  /**
   * The <code>load</code> event handler for each extension script.
   * @private
   */
  this.extensionLoaded = function () {
    temp_.extensionsLoadQueue--;

    if (temp_.extensionsLoadQueue === 0) {
      var extensions = _self.config.extensions,
          n = extensions.length;

      for (var i = 0; i < n; i++) {
        if (!_self.extensionRegister(extensions[i])) {
          _self.initError(lang.errorInitExtensions);
          return;
        }
      }

      _self.initComplete();
    }
  };

  /**
   * Update the canvas scaling. This method determines the DPI and/or zoom level 
   * used by the browser to render the application. Based on these values, the 
   * canvas elements are scaled down to cancel any upscaling performed by the 
   * browser.
   */
  this.updateCanvasScaling = function () {
    var cs             = _self.win.getComputedStyle(_self.elems.resInfo, null),
        res            = _self.resolution,
        image          = _self.image;
        bufferStyle    = _self.buffer.canvas.style,
        layerStyle     = _self.layer.canvas.style,
        scaleNew       = 1;

    var width  = parseInt(cs.width),
        height = parseInt(cs.height);

    if (pwlib.browser.opera) {
      // Opera zoom level detection.
      // The scaling factor is sufficiently accurate for zoom levels between 
      // 100% and 200% (in steps of 10%).

      scaleNew = _self.win.innerHeight / height;
      scaleNew = MathRound(scaleNew * 10) / 10;

    } else if (width && !isNaN(width) && width !== res.dpiOptimal) {
      // Page DPI detection. This only works in Gecko 1.9.1.

      res.dpiLocal = width;

      // The scaling factor is the same as in Gecko.
      scaleNew = MathFloor(res.dpiLocal / res.dpiOptimal);

    } else if (pwlib.browser.olpcxo) {
      // Support for the default Gecko included on the OLPC XO-1 system.
      //
      // See:
      // http://mxr.mozilla.org/mozilla-central/source/gfx/src/thebes/nsThebesDeviceContext.cpp#725
      // dotsArePixels = false on the XO due to a hard-coded patch.
      // Thanks go to roc from Mozilla for his feedback on making this work.

      res.dpiLocal = 134; // hard-coded value, we cannot determine it
      var appUnitsPerCSSPixel = 60; // hard-coded internally in Gecko
      var devPixelsPerCSSPixel = res.dpiLocal / res.dpiOptimal; // 1.3958333333
      var appUnitsPerDevPixel = appUnitsPerCSSPixel / devPixelsPerCSSPixel; // 42.9850746278...

      scaleNew = appUnitsPerCSSPixel / MathFloor(appUnitsPerDevPixel); // 1.4285714285...
    }

    if (scaleNew === res.scale) {
      return;
    }

    res.scale = scaleNew;

    var styleWidth  = image.width  / res.scale * image.zoom,
        styleHeight = image.height / res.scale * image.zoom;

    image.canvasScale = styleWidth / image.width;

    bufferStyle.width  = layerStyle.width  = styleWidth  + 'px';
    bufferStyle.height = layerStyle.height = styleHeight + 'px';
  };

  /**
   * The Canvas events handler.
   * 
   * <p>This method determines the mouse position relative to the canvas 
   * element, after which it invokes the method of the currently active tool 
   * with the same name as the current event type. For example, for the 
   * <code>mousedown</code> event the <code><var>tool</var>.mousedown()</code> 
   * method is invoked.
   *
   * <p>The mouse coordinates are stored in the {@link PaintWeb.mouse} object.  
   * These properties take into account the current zoom level and the image 
   * scroll.
   *
   * @private
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {Boolean} True if the tool event handler executed, or false 
   * otherwise.
   */
  this.ev_canvas = function (ev) {
    if (!_self.tool) {
      return false;
    }

    switch (ev.type) {
      case 'mousedown':
        /*
         * If the mouse is down already, skip the event.
         * This is needed to allow the user to go out of the drawing canvas, 
         * release the mouse button, then come back and click to end the drawing 
         * operation.
         * Additionally, this is needed to allow extensions like MouseKeys to 
         * perform their actions during a drawing operation, even when a real 
         * mouse is used. For example, allow the user to start drawing with the 
         * keyboard (press 0) then use the real mouse to move and click to end 
         * the drawing operation.
         */
        if (_self.mouse.buttonDown) {
          return false;
        }
        _self.mouse.buttonDown = true;
        break;

      case 'mouseup':
        // Skip the event if the mouse button was not down.
        if (!_self.mouse.buttonDown) {
          return false;
        }
        _self.mouse.buttonDown = false;
    }

    /*
     * Update the event, to include the mouse position, relative to the canvas 
     * element.
     */
    if ('layerX' in ev) {
      if (_self.image.canvasScale === 1) {
        _self.mouse.x = ev.layerX;
        _self.mouse.y = ev.layerY;
      } else {
        _self.mouse.x = MathRound(ev.layerX / _self.image.canvasScale);
        _self.mouse.y = MathRound(ev.layerY / _self.image.canvasScale);
      }
    } else if ('offsetX' in ev) {
      if (_self.image.canvasScale === 1) {
        _self.mouse.x = ev.offsetX;
        _self.mouse.y = ev.offsetY;
      } else {
        _self.mouse.x = MathRound(ev.offsetX / _self.image.canvasScale);
        _self.mouse.y = MathRound(ev.offsetY / _self.image.canvasScale);
      }
    }

    // The event handler of the current tool.
    if (ev.type in _self.tool && _self.tool[ev.type](ev)) {
      ev.preventDefault();
      return true;
    } else {
      return false;
    }
  };

  /**
   * The global keyboard events handler. This makes all the keyboard shortcuts 
   * work in the web application.
   *
   * <p>This method determines the key the user pressed, based on the 
   * <var>ev</var> DOM Event object, taking into consideration any browser 
   * differences. Two new properties are added to the <var>ev</var> object:
   *
   * <ul>
   *   <li><var>ev.kid_</var> is a string holding the key and the modifiers list 
   *   (<kbd>Control</kbd>, <kbd>Alt</kbd> and/or <kbd>Shift</kbd>). For 
   *   example, if the user would press the key <kbd>A</kbd> while holding down 
   *   <kbd>Control</kbd>, then <var>ev.kid_</var> would be "Control A". If the 
   *   user would press "9" while holding down <kbd>Shift</kbd>, then 
   *   <var>ev.kid_</var> would be "Shift 9".
   *
   *   <li><var>ev.kobj_</var> holds a reference to the keyboard shortcut 
   *   definition object from the configuration. This is useful for reuse, for 
   *   passing parameters from the keyboard shortcut configuration object to the 
   *   event handler.
   * </ul>
   *
   * <p>In {@link PaintWeb.config.keys} one can setup the keyboard shortcuts.  
   * If the keyboard combination is found in that list, then the associated tool 
   * is activated.
   *
   * @private
   *
   * @param {Event} ev The DOM Event object.
   *
   * @see PaintWeb.config.keys The keyboard shortcuts configuration.
   * @see pwlib.dom.KeyboardEventListener The class dealing with the 
   * cross-browser differences in the DOM keyboard events.
   */
  this.ev_keyboard = function (ev) {
    // Do not continue if the key was not recognized by the lib.
    if (!ev.key_) {
      return false;
    }

    if (ev.target && ev.target.nodeName) {
      switch (ev.target.nodeName.toLowerCase()) {
        case 'input':
        case 'select':
          return;
      }
    }

    // Determine the key ID.
    ev.kid_ = '';
    var i, kmods = {altKey: 'Alt', ctrlKey: 'Control', shiftKey: 'Shift'};
    for (i in kmods) {
      if (ev[i] && ev.key_ !== kmods[i]) {
        ev.kid_ += kmods[i] + ' ';
      }
    }
    ev.kid_ += ev.key_;

    // Send the keyboard event to the event handler of the active tool. If it 
    // returns true, we consider it recognized the keyboard shortcut.
    if (_self.tool && ev.type in _self.tool && _self.tool[ev.type](ev)) {
      return true;
    }

    // If there's no event handler within the active tool, or if the event 
    // handler does otherwise return false, then we continue with the global 
    // keyboard shortcuts.

    var gkey = _self.config.keys[ev.kid_];
    if (!gkey) {
      return false;
    }

    ev.kobj_ = gkey;

    // Check if the keyboard shortcut has some extension associated.
    var ext    = 'extension' in gkey ? _self.extensions[gkey.extension] : false,
        ext_fn = false;

    // Check if the keyboard shortcut points to a specific method from the 
    // extension object, otherwise use the current event type as the method 
    // name.
    if (ext) {
      ext_fn = 'method' in gkey ? ext[gkey.method] : ext[ev.type];

      // Execute the associated extension method.
      if (ext_fn) {
        ext_fn(ev);
      }
    }

    switch (ev.type) {
      case 'keydown':
        // Activate the tool associated with the current keyboard shortcut.
        // Do this only once, for the keydown event.
        if ('tool' in gkey) {
          _self.toolActivate(gkey.tool);
        }
        break;

      case 'keypress':
        ev.preventDefault();
    }

    // TODO: check if return is needed.
    return true;
  };

  // The event handler for keys +/- (zoom in/out), and for the * (zoom to 100%).
  // FIXME
  this.key_zoom = function (ev) {
    if (ev.key_ === '*') {
      return _self.zoomTo(1);
    }

    if (ev.shiftKey) {
      _self.config.zoomStep *= 2;
    }

    _self.zoomTo(ev.key_);

    if (ev.shiftKey) {
      _self.config.zoomStep /= 2;
    }
  };

  // The event handler for the Zoom input field.
  // FIXME
  this.ev_change_zoom = function (ev) {
    //if (!_self.ev_input_nr(ev)) {
      return false;
    //} else {
      return _self.zoomTo(this.value/100);
    //}
  };

  /**
   * Zoom image to the given level.
   *
   * @param {Number|String} The level you want to zoom the image to.
   * 
   * <p>If the value is a number, it must be a floating point positive number, 
   * where 1 means 100% (normal) zoom, 4 means 400% and so on.
   *
   * <p>If the value is a string it must be "+" or "-". This means that the zoom 
   * level will increase/decrease using the configured {@link 
   * this.config.zoomStep}.
   *
   * @returns {Boolean} True if the image zoom level changed successfully, or 
   * false if not.
   */
  this.zoomTo = function (level) {
    var image  = _self.image,
        config = _self.config;

    if (!level) {
      return false;
    } else if (level === '+') {
      level = image.zoom + config.zoomStep;
    } else if (level === '-') {
      level = image.zoom - config.zoomStep;
    } else if (isNaN(level)) {
      return false;
    }

    if (level > config.zoomMax) {
      level = config.zoomMax;
    } else if (level < config.zoomMin) {
      level = config.zoomMin;
    }

    if (level === image.zoom) {
      return true;
    }

    var input = _self.inputs.zoom,
        w = image.width  / _self.resolution.scale * level,
        h = image.height / _self.resolution.scale * level,
        bufferStyle = _self.buffer.canvas.style,
        layerStyle = _self.layer.canvas.style,
        containerStyle = _self.elems.container.style;

    image.canvasScale = w / image.width;

    if (input.value != level*100) {
      input.value = MathRound(level*100);
    }

    bufferStyle.width  = layerStyle.width  = w + 'px';
    bufferStyle.height = layerStyle.height = h + 'px';

    // The container should only be smaller than the image dimensions
    if (level <= 1) {
      console.log('cucu1');
      containerStyle.width  = w + 'px';
      containerStyle.height = h + 'px';
    } else {
      console.log('cucu2');
      containerStyle.width  = image.width  / _self.resolution.scale + 'px';
      containerStyle.height = image.height / _self.resolution.scale + 'px';
    }

    image.zoom = level;

    return true;
  };

  // This function resizes the canvas to the desired dimensions.
  this.resizeCanvas = function (w, h, resizer) {
    if (!w || !h || isNaN(w) || isNaN(h)) {
      return false;
    }

    if (w > 1500) {
      w = 1500;
    }

    if (h > 1500) {
      h = 1500;
    }

    if (_self.image.width == w && _self.image.height == h) {
      return false;
    }

    var w2 = w * _self.image.canvasScale,
        h2 = h * _self.image.canvasScale;

    if (_self.image.zoom <= 1) {
      _self.elems.container.style.width  = w2 + 'px';
      _self.elems.container.style.height = h2 + 'px';
    } else if (resizer && _self.image.zoom > 1) {
      return true;
    }

    _self.buffer.canvas.style.width = _self.layer.canvas.style.width = w2 
      + 'px';
    _self.buffer.canvas.style.height = _self.layer.canvas.style.height = h2 
      + 'px';

    // The canvas state gets reset once the dimensions change.
    var state = _self.state_save(_self.layer.context),
        dw    = MathMin(_self.image.width,  w),
        dh    = MathMin(_self.image.height, h);

    // The image is cleared once the dimensions change. We need to restore the image.
    // This does not work in Opera 9.2 and older, nor in Safari. This works in new WebKit builds.
    var idata = false;
    if (_self.layer.context.getImageData) {
      idata = _self.layer.context.getImageData(0, 0, dw, dh);
    }

    _self.layer.canvas.width  = w;
    _self.layer.canvas.height = h;

    if (idata && _self.layer.context.putImageData) {
      _self.layer.context.putImageData(idata, 0, 0);
    }

    _self.state_restore(_self.layer.context, state);
    state = _self.state_save(_self.buffer.context);

    idata = false;
    if (_self.buffer.context.getImageData) {
      idata = _self.buffer.context.getImageData(0, 0, dw, dh);
    }

    _self.buffer.canvas.width  = w;
    _self.buffer.canvas.height = h;

    if (idata && _self.buffer.context.putImageData) {
      _self.buffer.context.putImageData(idata, 0, 0);
    }

    _self.state_restore(_self.buffer.context, state);

    _self.image.width  = w;
    _self.image.height = h;

    return true;
  };

  // When the canvas is resized the state is lost. Using context.save/restore 
  // state does work only in Opera. In Firefox/Gecko and WebKit saved states are 
  // lost after resize, so there's no state to restore.
  // As such, this is the internal state save/restore mechanism. The property 
  // values are saved into a simple JS object.
  this.state_props = ['strokeStyle', 'fillStyle', 'globalAlpha', 'lineWidth', 
    'lineCap', 'lineJoin', 'miterLimit', 'shadowOffsetX', 'shadowOffsetY', 
    'shadowBlur', 'shadowColor', 'globalCompositeOperation', 'font', 
    'textAlign', 'textBaseline'];

  this.state_save = function (context) {
    if (!context || !context.canvas || !_self.state_props) {
      return false;
    }

    var stateObj = {}, state;

    for (var i = 0, n = _self.state_props.length; i < n; i++) {
      state = _self.state_props[i];
      stateObj[state] = context[state];
    }

    return stateObj;
  };

  this.state_restore = function (context, stateObj) {
    if (!context || !context.canvas) {
      return false;
    }

    for (var state in stateObj) {
      context[state] = stateObj[state];
    }

    return true;
  };

  // This function can be used to quickly toggle the canvas shadow.
  // This is also the event handler for the "Draw shadows" check box.
  this.shadowToggle = function (ev) {
    var input;
    if (!_self.inputs || !(input = _self.inputs.shadowActive)) {
      return false;
    }

    if (input.checked) {
      return _self.shadowEnable();
    } else {
      return _self.shadowDisable();
    }
  };

  // Shadows are applied as a post-effect: once the drawing operation is completed.
  this.shadowEnable = function (ev) {
    var input, shadowColor;
    if (!_self.inputs || !(shadowColor = _self.inputs.shadowColor) ||
        !(input = _self.inputs.shadowActive)) {
      return false;
    }

    if (!ev || ev.type !== 'change') {
      input.checked = true;
    } else if (input.checked) {
      return true;
    }

    var _value = shadowColor._value;

    _self.layer.context.shadowColor = 'rgba(' +
        Math.round(_value.red   * 255) + ', ' +
        Math.round(_value.green * 255) + ', ' +
        Math.round(_value.blue  * 255) + ', ' +
                   _value.alpha +')';

    shadowColor._disabled = false;

    var parentNode = shadowColor.parentNode.parentNode;
    parentNode.className = parentNode.className.replace(' disabled', '', 'g');

    var id, i, n, props = ['shadowOffsetX', 'shadowOffsetY', 'shadowBlur'];
    for (i = 0, n = props.length; i < n; i++) {
      id = props[i];
      input = _self.inputs[id];
      if (!input) {
        continue;
      }

      input.disabled = false;

      parentNode = input.parentNode;
      parentNode.className = parentNode.className.replace(' disabled', '', 'g');

      _self.layer.context[id] = input.value;
    }

    return true;
  };

  this.shadowDisable = function (ev) {
    var input;
    if (!_self.inputs || !_self.inputs.shadowColor ||
        !(input = _self.inputs.shadowActive)) {
      return false;
    }

    if (!ev || ev.type !== 'change') {
      input.checked = false;
    } else if (!input.checked) {
      return true;
    }

    _self.layer.context.shadowColor = _self.buffer.context.shadowColor 
      = 'rgba(0, 0, 0, 0)';

    input = _self.inputs.shadowColor;
    input._disabled = true;
    input.parentNode.parentNode.className += ' disabled';

    var id, i, n, props = ['shadowOffsetX', 'shadowOffsetY', 'shadowBlur'];
    for (i = 0, n = props.length; i < n; i++) {
      id = props[i];
      input = _self.inputs[id];
      if (!input) {
        continue;
      }

      input.disabled = true;
      input.parentNode.className += ' disabled';
      _self.layer.context[id] = 0;
    }

    return true;
  };

  /**
   * Update the current image layer by moving the pixels from the buffer onto 
   * the layer. This method also adds a point into the history.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   */
  this.layerUpdate = function () {
    _self.layer.context.drawImage(_self.buffer.canvas, 0, 0);
    _self.buffer.context.clearRect(0, 0, _self.image.width, _self.image.height);
    _self.historyAdd();

    return true;
  };

  /**
   * Add the current image layer to the history.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   */
  // TODO: some day it would be nice to implement a hybrid history system.
  this.historyAdd = function () {
    var layerContext = _self.layer.context,
        history      = _self.history;

    // The get/putImageData methods do not work in Opera Merlin, nor in Safari 
    // (tested with 20080324 svn trunk, webkitgtk). However, in webkit svn trunk 
    // revision 37376 (20081007) these methods finally work (meaning Safari 
    // 4 might work).
    if (!layerContext.getImageData) {
      return false;
    }

    var n = history.states.length;

    // We are in an undo-step, trim until the end, eliminating any possible redo-steps.
    if (history.pos < n) {
      n -= history.pos;
      history.states.splice(history.pos, n);
    }

    history.states.push(layerContext.getImageData(0, 0, _self.image.width, 
          _self.image.height));

    history.pos++;
    n++;

    // If we have too many history ImageDatas, remove the oldest ones
    if (n > _self.config.historyLimit) {
      n -= _self.config.historyLimit;
      history.states.splice(0, n);
      history.pos = history.states.length;
    }

    if(_self.elems.btn_redo) {
      _self.elems.btn_redo.className = 'disabled';
    }

    if(_self.elems.btn_undo) {
      _self.elems.btn_undo.className = '';
    }

    return true;
  };

  /**
   * Jump to any ImageData/position in the history.
   *
   * @param {Number|String} pos The history position to jump to.
   * 
   * <p>If the value is a number, then it must point to an existing index in the  
   * {@link this.history.states} array.
   *
   * <p>If the value is a string, it must be "undo" or "redo".
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   */
  this.historyGoto = function (pos) {
    var layerContext = _self.layer.context,
        history      = _self.history;

    if (!history.states.length || !layerContext.putImageData) {
      return false;
    }

    var cpos = history.pos;

    if (pos === 'undo') {
      pos = cpos-1;
    } else if (pos === 'redo') {
      pos = cpos+1;
    }

    pos = parseInt(pos);
    if (pos == cpos || isNaN(pos) || pos < 1 || pos > history.states.length) {
      return false;
    }

    var himg = history.states[pos-1];
    if (!himg) {
      return false;
    }

    // Each image in the history can have a different size. As such, the script 
    // must take this into consideration.
    var w = Math.min(_self.image.width,  himg.width),
        h = Math.min(_self.image.height, himg.height);

    layerContext.clearRect(0, 0, _self.image.width, _self.image.height);

    try {
      // Firefox 3 does not clip the image, if needed.
      layerContext.putImageData(himg, 0, 0, 0, 0, w, h);

    } catch (err) {
      // The workaround is to use a new canvas from which we can copy the 
      // history image without causing any exceptions.
      var tmp    = _self.doc.createElement('canvas');
      tmp.width  = himg.width;
      tmp.height = himg.height;

      var tmp2 = tmp.getContext('2d');
      tmp2.putImageData(himg, 0, 0);

      layerContext.drawImage(tmp, 0, 0);
      delete tmp2, tmp;
    }

    history.pos = pos;

    var btn_redo = _self.elems.btn_redo,
        btn_undo = _self.elems.btn_undo;

    if (!btn_redo || !btn_undo) {
      return true;
    }

    if (pos === history.states.length) {
      btn_redo.className = 'disabled';
    } else {
      btn_redo.className = '';
    }

    if (pos === 1) {
      btn_undo.className = 'disabled';
    } else {
      btn_undo.className = '';
    }

    return true;
  };

  this.toolSnapXY = function (x, y) {
    var diffx = MathAbs(_self.mouse.x - x),
        diffy = MathAbs(_self.mouse.y - y);

    if (diffx > diffy) {
      _self.mouse.y = y;
    } else {
      _self.mouse.x = x;
    }
  };

  /**
   * Activate a drawing tool by ID.
   *
   * <p>The <var>id</var> provided must be of an existing drawing tool, one that  
   * has been installed.
   *
   * <p>The <var>ev</var> argument is an optional DOM Event object which is 
   * useful when dealing with different types of tool activation, either by 
   * keyboard or by mouse events. Tool-specific code can implement different 
   * functionality based on events.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.toolPreactivate} event 
   * before creating the new tool instance. Once the new tool is successfully 
   * activated, the {@link pwlib.appEvent.toolActivate} event is also 
   * dispatched.
   *
   * @param {String} id The ID of the drawing tool to be activated.
   * @param {Event} [ev] The DOM Event object.
   *
   * @returns {Boolean} True if the tool has been activated, or false if not.
   *
   * @see PaintWeb#toolRegister Register a new drawing tool.
   * @see PaintWeb#toolUnregister Unregister a drawing tool.
   *
   * @see pwlib.tools The object holding all the drawing tools.
   * @see pwlib.appEvent.toolPreactivate
   * @see pwlib.appEvent.toolActivate
   */
  this.toolActivate = function (id, ev) {
    if (!id || !(id in pwlib.tools) || typeof pwlib.tools[id] !== 'function') {
      return false;
    }

    var tool = pwlib.tools[id],
        prevId = this.tool ? this.tool._id : null;

    if (prevId && this.tool instanceof pwlib.tools[id]) {
      return true;
    }

    var cancel = this.events.dispatch(new appEvent.toolPreactivate(id, prevId));
    if (cancel) {
      return false;
    }

    var tool_obj = new tool(this, ev);
    if (!tool_obj) {
      return false;
    }

    /*
     * Each tool can implement its own mouse and keyboard events handler.
     * Additionally, tool objects can implement handlers for the deactivation 
     * and activation events.
     * Given tool1 is active and tool2 is going to be activated, then the 
     * following event handlers will be called:
     *
     * tool2.preActivate
     * tool1.deactivate
     * tool2.activate
     *
     * In the "preActivate" event handler you can cancel the tool activation by 
     * returning a value which evaluates to false.
     */

    if ('preActivate' in tool_obj && !tool_obj.preActivate(ev)) {
      tool_obj = null;
      return false;
    }

    // Deactivate the previously active tool
    if (this.tool && 'deactivate' in this.tool) {
      this.tool.deactivate(ev);
    }

    this.mouse.buttonDown = false;

    this.tool = tool_obj;

    // Besides the "constructor", each tool can also have code which is run 
    // after the deactivation of the previous tool.
    if ('activate' in this.tool) {
      this.tool.activate(ev);
    }

    this.events.dispatch(new appEvent.toolActivate(id, prevId));

    return true;
  };

  /**
   * Register a new drawing tool into PaintWeb.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.toolRegister} 
   * application event.
   *
   * @param {String} id The ID of the new tool. The tool object must exist in 
   * {@link pwlib.tools}.
   *
   * @returns {Boolean} True if the tool was successfully registered, or false 
   * if not.
   *
   * @see PaintWeb#toolUnregister allows you to unregister tools.
   * @see pwlib.tools Holds all the drawing tools.
   * @see pwlib.appEvent.toolRegister
   */
  this.toolRegister = function (id) {
    if (typeof id !== 'string' || !id) {
      return false;
    }

    var tool = pwlib.tools[id];
    if (typeof tool !== 'function') {
      return false;
    }

    var cancel = this.events.dispatch(new appEvent.toolRegister(id));
    if (cancel) {
      return false;
    }

    tool.prototype._id = id;

    if (!this.tool && id === this.config.toolDefault) {
      return this.toolActivate(id);
    } else {
      return true;
    }
  };

  /**
   * Unregister a drawing tool from PaintWeb.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.toolUnregister} 
   * application event.
   *
   * @param {String} id The ID of the tool you want to unregister.
   *
   * @returns {Boolean} True if the tool was unregistered, or false if it does 
   * not exist or some error occurred.
   *
   * @see PaintWeb#toolRegister allows you to register new drawing tools.
   * @see pwlib.tools Holds all the drawing tools.
   * @see pwlib.appEvent.toolUnregister
   */
  this.toolUnregister = function (id) {
    if (typeof id !== 'string' || !id || !(id in pwlib.tools)) {
      return false;
    }

    // Erm... nothing to cancel at the moment.
    var cancel = this.events.dispatch(new appEvent.toolUnregister(id));
    if (cancel) {
      return false;
    }

    return true;
  };

  /**
   * Register a new extension into PaintWeb.
   *
   * <p>If the extension object being constructed has the 
   * <code>extensionRegister()</code> method, then it will be invoked, allowing 
   * any custom extension registration code to run. If the method returns false, 
   * then the extension will not be registered.
   *
   * @param {String} id The ID of the new extension. The extension object 
   * constructor must exist in {@link pwlib.extensions}.
   *
   * @returns {Boolean} True if the extension was successfully registered, or 
   * false if not.
   *
   * @see PaintWeb#extensionUnregister allows you to unregister extensions.
   * @see pwlib.extensions Holds all the extensions.
   */
  this.extensionRegister = function (id) {
    if (typeof id !== 'string' || !id) {
      return false;
    }

    var func = pwlib.extensions[id];
    if (typeof func !== 'function') {
      return false;
    }

    func.prototype._id = id;

    var obj = new func(_self);

    if ('extensionRegister' in obj && !obj.extensionRegister()) {
      return false;

    } else {
      this.extensions[id] = obj;
      return true;
    }
  };

  /**
   * Unregister an extension from PaintWeb.
   *
   * <p>If the extension object being destructed has the 
   * <code>extensionUnregister()</code> method, then it will be invoked, 
   * allowing any custom extension removal code to run.
   *
   * @param {String} id The ID of the extension object you want to unregister.
   *
   * @returns {Boolean} True if the extension was removed, or false if it does 
   * not exist or some error occurred.
   *
   * @see PaintWeb#extensionRegister allows you to register new extensions.
   * @see pwlib.extensions Holds all the extensions.
   */
  this.extensionUnregister = function (id) {
    if (typeof id !== 'string' || !id || !(id in this.extensions)) {
      return false;
    }

    if ('extensionUnregister' in this.extensions[id]) {
      _self.actions[id].extensionUnregister();
    }

    delete _self.extensions[id];

    return true;
  };

  /**
   * Load a script into the document.
   *
   * @param {String} url The script URL you want to insert.
   * @param {Function} [handler] The <code>load</code> event handler you want.
   */
  this.scriptLoad = function (url, handler) {
    var elem = this.doc.createElement('script');
    if (handler) {
      elem.addEventListener('load', handler, false);
    }
    elem.type = 'text/javascript';
    elem.src = url;
    this.elems.head.appendChild(elem);
  };

  /**
   * Insert a stylesheet into the document.
   *
   * @param {String} url The URL of the stylesheet you want to insert.
   * @param {String} [media='screen, projection'] The media attribute.
   */
  this.styleInsert = function (url, media) {
    if (!media) {
      media = 'screen, projection';
    }

    var elem = this.doc.createElement('link');
    elem.rel = 'stylesheet';
    elem.type = 'text/css';
    elem.media = media;
    elem.href = url;

    this.elems.head.appendChild(elem);
  };

  this.toString = function () {
    return 'PaintWeb v' + this.version + ' (build ' + this.build + ')';
  };


  preInit();
};

/**
 * Application initialization not started.
 * @constant
 */
PaintWeb.INIT_NOT_STARTED = 0;

/**
 * Application initialization started.
 * @constant
 */
PaintWeb.INIT_STARTED = 1;

/**
 * Application initialization completed successfully.
 * @constant
 */
PaintWeb.INIT_DONE = 2;

/**
 * Application initialization failed.
 * @constant
 */
PaintWeb.INIT_ERROR = -1;

window.PaintWeb = PaintWeb;

})();

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

