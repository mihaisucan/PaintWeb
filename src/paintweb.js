/*
 * Copyright (C) 2008, 2009, 2010 Mihai Şucan
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
 * $Date: 2010-06-26 22:44:23 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview The main PaintWeb application code.
 */

/**
 * @class The PaintWeb application object.
 *
 * @param {Window} [win=window] The window object to use.
 * @param {Document} [doc=document] The document object to use.
 */
function PaintWeb (win, doc) {
  var _self = this;

  if (!win) {
    win = window;
  }
  if (!doc) {
    doc = document;
  }

  /**
   * PaintWeb version.
   * @type Number
   */
  this.version = 0.9; //!

  /**
   * PaintWeb build date (YYYYMMDD).
   * @type Number
   */
  this.build = -1; //!

  /**
   * Holds all the PaintWeb configuration.
   * @type Object
   */
  this.config = {
    showErrors: true
  };

  /**
   * Holds all language strings used within PaintWeb.
   */
  // Here we include a minimal set of strings, used in case the language file will 
  // not load.
  this.lang = {
    "noComputedStyle": "Error: window.getComputedStyle is not available.",
    "noXMLHttpRequest": "Error: window.XMLHttpRequest is not available.",
    "noCanvasSupport": "Error: Your browser does not support Canvas.",
    "guiPlaceholderWrong": "Error: The config.guiPlaceholder property must " +
      "reference a DOM element!",
    "initHandlerMustBeFunction": "The first argument must be a function.",
    "noConfigFile": "Error: You must point to a configuration file by " +
      "setting the config.configFile property!",
    "failedConfigLoad": "Error: Failed loading the configuration file.",
    "failedLangLoad": "Error: Failed loading the language file."
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
   * Holds all the PaintWeb commands. Each property in this object must 
   * reference a simple function which can be executed by keyboard shortcuts 
   * and/or GUI elements.
   *
   * @type Object
   * @see PaintWeb#commandRegister Register a new command.
   * @see PaintWeb#commandUnregister Unregister a command.
   */
  this.commands = {};

  /**
   * The graphical user interface object instance.
   * @type pwlib.gui
   */
  this.gui = null;

  /**
   * The document element PaintWeb is working with.
   *
   * @private
   * @type Document
   * @default document
   */
  this.doc = doc;

  /**
   * The window object PaintWeb is working with.
   *
   * @private
   * @type Window
   * @default window
   */
  this.win = win;

  /**
   * Holds image information: width, height, zoom and more.
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
    canvasScale: 1,

    /**
     * Tells if the current image has been modified since the initial load.
     *
     * @type Boolean
     * @default false
     */
    modified: false
  };

  /**
   * Resolution information.
   *
   * @type Object
   */
  this.resolution = {
    /**
     * The DOM element holding information about the current browser rendering 
     * settings (zoom / DPI).
     *
     * @private
     * @type Element
     */
    elem: null,

    /**
     * The ID of the DOM element holding information about the current browser 
     * rendering settings (zoom / DPI).
     *
     * @private
     * @type String
     * @default 'paintweb_resInfo'
     */
    elemId: 'paintweb_resInfo',

    /**
     * The styling necessary for the DOM element.
     *
     * @private
     * @type String
     */
    cssText: '@media screen and (resolution:96dpi){' +
             '#paintweb_resInfo{width:96px}}' +
             '@media screen and (resolution:134dpi){' +
             '#paintweb_resInfo{width:134px}}' +
             '@media screen and (resolution:200dpi){' +
             '#paintweb_resInfo{width:200px}}' +
             '@media screen and (resolution:300dpi){' +
             '#paintweb_resInfo{width:300px}}' +
             '#paintweb_resInfo{' +
             'display:block;' +
             'height:100%;' +
             'left:-3000px;' +
             'position:fixed;' +
             'top:0;' +
             'visibility:hidden;' +
             'z-index:-32}',

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
     * @default -1
     */
    scale: -1
  };

  /**
   * The image history.
   *
   * @private
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
   * Tells if the browser supports the Canvas Shadows API.
   *
   * @type Boolean
   * @default true
   */
  this.shadowSupported = true;

  /**
   * Tells if the current tool allows the drawing of shadows.
   *
   * @type Boolean
   * @default true
   */
  this.shadowAllowed = true;

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
   * List of Canvas context properties to save and restore.
   *
   * <p>When the Canvas is resized the state is lost. Using context.save/restore 
   * state does work only in Opera. In Firefox/Gecko and WebKit saved states are 
   * lost after resize, so there's no state to restore. As such, PaintWeb has 
   * its own simple state save/restore mechanism. The property values are saved 
   * into a JavaScript object.
   *
   * @private
   * @type Array
   *
   * @see PaintWeb#stateSave to save the canvas context state.
   * @see PaintWeb#stateRestore to restore a canvas context state.
   */
  this.stateProperties = ['strokeStyle', 'fillStyle', 'globalAlpha', 
    'lineWidth', 'lineCap', 'lineJoin', 'miterLimit', 'shadowOffsetX', 
    'shadowOffsetY', 'shadowBlur', 'shadowColor', 'globalCompositeOperation', 
    'font', 'textAlign', 'textBaseline'];

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
   * Element node type constant.
   *
   * @constant
   * @type Number
   */
  this.ELEMENT_NODE = window.Node ? Node.ELEMENT_NODE : 1;

  /**
   * PaintWeb pre-initialization code. This runs when the PaintWeb instance is 
   * constructed.
   * @private
   */
  function preInit() {
    var d = new Date();

    // If PaintWeb is running directly from the source code, then the build date 
    // is always today.
    if (_self.build === -1) {
      var dateArr = [d.getFullYear(), d.getMonth()+1, d.getDate()];

      if (dateArr[1] < 10) {
        dateArr[1] = '0' + dateArr[1];
      }
      if (dateArr[2] < 10) {
        dateArr[2] = '0' + dateArr[2];
      }

      _self.build = dateArr.join('');
    }

    _self.UID = d.getMilliseconds() * MathRound(Math.random() * 100);
    _self.elems.head = doc.getElementsByTagName('head')[0] || doc.body;
  };

  /**
   * Initialize PaintWeb.
   *
   * <p>This method is asynchronous, meaning that it will return much sooner 
   * before the application initialization is completed.
   *
   * @param {Function} [handler] The <code>appInit</code> event handler. Your 
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
      throw new TypeError(lang.initHandlerMustBeFunction);
    }

    temp_.onInit = handler;

    // Check Canvas support.
    if (!doc.createElement('canvas').getContext) {
      this.initError(lang.noCanvasSupport);
      return false;
    }

    // Basic functionality used within the Web application.
    if (!window.getComputedStyle) {
      try {
        if (!win.getComputedStyle(doc.createElement('div'), null)) {
          this.initError(lang.noComputedStyle);
          return false;
        }
      } catch (err) {
        this.initError(lang.noComputedStyle);
        return false;
      }
    }

    if (!window.XMLHttpRequest) {
      this.initError(lang.noXMLHttpRequest);
      return false;
    }

    if (!this.config.configFile) {
      this.initError(lang.noConfigFile);
      return false;
    }

    if (typeof this.config.guiPlaceholder !== 'object' || 
        this.config.guiPlaceholder.nodeType !== this.ELEMENT_NODE) {
      this.initError(lang.guiPlaceholderWrong);
      return false;
    }

    // Silently ignore any wrong value for the config.imageLoad property.
    if (typeof this.config.imageLoad !== 'object' || 
        this.config.imageLoad.nodeType !== this.ELEMENT_NODE) {
      this.config.imageLoad = null;
    }

    // JSON parser and serializer.
    if (!window.JSON) {
      this.scriptLoad(PaintWeb.baseFolder + 'includes/json2.js', 
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
      _self.scriptLoad(PaintWeb.baseFolder + 'includes/lib.js', 
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
    _self.configLoad();
  };

  /**
   * Report an initialization error.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.appInit} event.
   *
   * @private
   *
   * @param {String} msg The error message.
   *
   * @see pwlib.appEvent.appInit
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

    if (this.events && 'dispatch' in this.events &&
        appEvent    && 'appInit'  in appEvent) {

      ev = new appEvent.appInit(this.initialized, msg);
      this.events.dispatch(ev);
    }

    if (typeof temp_.onInit === 'function') {
      if (!ev) {
        // fake an event dispatch.
        ev = {type: 'appInit', state: this.initialized, errorMessage: msg};
      }

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
   * @private
   *
   * @see PaintWeb.config.configFile The configuration file.
   * @see pwlib.xhrLoad The library function being used for creating the 
   * XMLHttpRequest object.
   */
  this.configLoad = function () {
    pwlib.xhrLoad(PaintWeb.baseFolder + this.config.configFile, 
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
    if (!xhr || xhr.readyState !== 4) {
      return;
    }

    if ((xhr.status !== 304 && xhr.status !== 200) || !xhr.responseText) {
      _self.initError(lang.failedConfigLoad);
      return;
    }

    var config = pwlib.jsonParse(xhr.responseText);
    pwlib.extend(_self.config, config);

    _self.langLoad();
  };

  /**
   * Asynchronously load the language file. This method issues an XMLHttpRequest 
   * to load the JSON file.
   *
   * @private
   *
   * @see PaintWeb.config.lang The language you want for the PaintWeb user 
   * interface.
   * @see pwlib.xhrLoad The library function being used for creating the 
   * XMLHttpRequest object.
   */
  this.langLoad = function () {
    var id   = this.config.lang,
        file = PaintWeb.baseFolder;

    // If the language is not available, always fallback to English.
    if (!(id in this.config.languages)) {
      id = this.config.lang = 'en';
    }

    if ('file' in this.config.languages[id]) {
      file += this.config.languages[id].file;
    } else {
      file += this.config.langFolder + '/' + id + '.json';
    }

    pwlib.xhrLoad(file, this.langReady);
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
    if (!xhr || xhr.readyState !== 4) {
      return;
    }

    if ((xhr.status !== 304 && xhr.status !== 200) || !xhr.responseText) {
      _self.initError(lang.failedLangLoad);
      return;
    }

    pwlib.extend(_self.lang, pwlib.jsonParse(xhr.responseText));

    if (_self.initCanvas() && _self.initContext()) {
      // Start GUI load now.
      _self.guiLoad();
    } else {
      _self.initError(lang.errorInitCanvas);
    }
  };

  /**
   * Initialize the PaintWeb commands.
   *
   * @private
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.initCommands = function () {
    if (this.commandRegister('historyUndo',    this.historyUndo) &&
        this.commandRegister('historyRedo',    this.historyRedo) &&
        this.commandRegister('selectAll',      this.selectAll) &&
        this.commandRegister('selectionCut',   this.selectionCut) &&
        this.commandRegister('selectionCopy',  this.selectionCopy) &&
        this.commandRegister('clipboardPaste', this.clipboardPaste) &&
        this.commandRegister('imageSave',      this.imageSave) &&
        this.commandRegister('imageClear',     this.imageClear) &&
        this.commandRegister('swapFillStroke', this.swapFillStroke) &&
        this.commandRegister('imageZoomIn',    this.imageZoomIn) &&
        this.commandRegister('imageZoomOut',   this.imageZoomOut) &&
        this.commandRegister('imageZoomReset', this.imageZoomReset)) {
      return true;
    } else {
      this.initError(lang.errorInitCommands);
      return false;
    }
  };

  /**
   * Load th PaintWeb GUI. This method loads the GUI markup file, the stylesheet 
   * and the script.
   *
   * @private
   *
   * @see PaintWeb.config.guiStyle The interface style file.
   * @see PaintWeb.config.guiScript The interface script file.
   * @see pwlib.gui The interface object.
   */
  this.guiLoad = function () {
    var cfg    = this.config,
        gui    = this.config.gui,
        base   = PaintWeb.baseFolder + cfg.interfacesFolder + '/' + gui + '/',
        style  = base + cfg.guiStyle,
        script = base + cfg.guiScript;

    this.styleLoad(gui + 'style', style);

    if (pwlib.gui) {
      this.guiScriptReady();
    } else {
      this.scriptLoad(script, this.guiScriptReady);
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
   * @see pwlib.gui The interface object.
   * @see pwlib.xhrLoad The library function being used for creating the 
   * XMLHttpRequest object.
   */
  this.guiScriptReady = function () {
    var cfg    = _self.config,
        gui    = _self.config.gui,
        base   = cfg.interfacesFolder + '/' + gui + '/',
        markup = base + cfg.guiMarkup;

    _self.gui = new pwlib.gui(_self);

    // Check if the interface markup is cached already.
    if (markup in pwlib.fileCache) {
      if (_self.gui.init(pwlib.fileCache[markup])) {
        _self.initTools();
      } else {
        _self.initError(lang.errorInitGUI);
      }

    } else {
      pwlib.xhrLoad(PaintWeb.baseFolder + markup, _self.guiMarkupReady);
    }
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
    if (!xhr || xhr.readyState !== 4) {
      return;
    }

    if (xhr.status !== 304 && xhr.status !== 200) {
      _self.initError(lang.failedMarkupLoad);
      return;
    }

    var param;
    if (xhr.responseXML && xhr.responseXML.documentElement) {
      param = xhr.responseXML;
    } else if (xhr.responseText) {
      param = xhr.responseText;
    } else {
      _self.initError(lang.failedMarkupLoad);
      return;
    }

    if (_self.gui.init(param)) {
      _self.initTools();
    } else {
      _self.initError(lang.errorInitGUI);
    }
  };

  /**
   * Initialize the Canvas elements. This method creates the elements and 
   * sets-up their dimensions.
   *
   * <p>The layer Canvas element will have the background rendered with the 
   * color from {@link PaintWeb.config.backgroundColor}.
   * 
   * <p>If {@link PaintWeb.config.imageLoad} is defined, then the image element 
   * is inserted into the Canvas image.
   *
   * <p>All the Canvas event listeners are also attached to the buffer Canvas 
   * element.
   *
   * @private
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   *
   * @see PaintWeb#ev_canvas The global Canvas events handler.
   */
  this.initCanvas = function () {
    var cfg           = this.config,
        res           = this.resolution,
        resInfo       = doc.getElementById(res.elemId),
        layerCanvas   = doc.createElement('canvas'),
        bufferCanvas  = doc.createElement('canvas'),
        layerContext  = layerCanvas.getContext('2d'),
        bufferContext = bufferCanvas.getContext('2d'),
        width         = cfg.imageWidth,
        height        = cfg.imageHeight,
        imageLoad     = cfg.imageLoad;

    if (!resInfo) {
      var style = doc.createElement('style');
      style.type = 'text/css';
      style.appendChild(doc.createTextNode(res.cssText));
      _self.elems.head.appendChild(style);

      resInfo = doc.createElement('div');
      resInfo.id = res.elemId;
      doc.body.appendChild(resInfo);
    }

    if (!resInfo) {
      this.initError(lang.errorInitCanvas);
      return false;
    }
    if (!layerCanvas || !bufferCanvas || !layerContext || !bufferContext) {
      this.initError(lang.noCanvasSupport);
      return false;
    }

    if (!pwlib.isSameHost(imageLoad.src, win.location.host)) {
      cfg.imageLoad = imageLoad = null;
      alert(lang.imageLoadDifferentHost);
    }

    if (imageLoad) {
      width  = parseInt(imageLoad.width);
      height = parseInt(imageLoad.height);
    }

    res.elem = resInfo;

    this.image.width  = layerCanvas.width  = bufferCanvas.width  = width;
    this.image.height = layerCanvas.height = bufferCanvas.height = height;

    this.layer.canvas   = layerCanvas;
    this.layer.context  = layerContext;
    this.buffer.canvas  = bufferCanvas;
    this.buffer.context = bufferContext;

    if (imageLoad) {
      layerContext.drawImage(imageLoad, 0, 0);
    } else {
      // Set the configured background color.
      var fillStyle = layerContext.fillStyle;
      layerContext.fillStyle = cfg.backgroundColor;
      layerContext.fillRect(0, 0, width, height);
      layerContext.fillStyle = fillStyle;
    }

    /*
     * Setup the event listeners for the canvas element.
     *
     * The event handler (ev_canvas) calls the event handlers associated with 
     * the active tool (e.g. tool.mousemove).
     */
    var events = ['dblclick', 'click', 'mousedown', 'mouseup', 'mousemove', 
        'contextmenu'],
        n = events.length;

    for (var i = 0; i < n; i++) {
      bufferCanvas.addEventListener(events[i], this.ev_canvas, false);
    }

    return true;
  };

  /**
   * Initialize the Canvas buffer context. This method updates the context 
   * properties to reflect the values defined in the PaintWeb configuration 
   * file.
   * 
   * <p>Shadows support is also determined. The {@link PaintWeb#shadowSupported} 
   * value is updated accordingly.
   *
   * @private
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.initContext = function () {
    var bufferContext = this.buffer.context;

    // Opera does not render shadows, at the moment.
    if (!pwlib.browser.opera && bufferContext.shadowColor && 'shadowOffsetX' in 
        bufferContext && 'shadowOffsetY' in bufferContext && 'shadowBlur' in 
        bufferContext) {
      this.shadowSupported = true;
    } else {
      this.shadowSupported = false;
    }

    var cfg = this.config,
        props = {
          fillStyle:    cfg.fillStyle,
          font:         cfg.text.fontSize + 'px ' + cfg.text.fontFamily,
          lineCap:      cfg.line.lineCap,
          lineJoin:     cfg.line.lineJoin,
          lineWidth:    cfg.line.lineWidth,
          miterLimit:   cfg.line.miterLimit,
          strokeStyle:  cfg.strokeStyle,
          textAlign:    cfg.text.textAlign,
          textBaseline: cfg.text.textBaseline
        };

    if (cfg.text.bold) {
      props.font = 'bold ' + props.font;
    }

    if (cfg.text.italic) {
      props.font = 'italic ' + props.font;
    }

    // Support Gecko 1.9.0
    if (!bufferContext.fillText && 'mozTextStyle' in bufferContext) {
      props.mozTextStyle = props.font;
    }

    for (var prop in props) {
      bufferContext[prop] = props[prop];
    }

    // shadows are only for the layer context.
    if (cfg.shadow.enable && this.shadowSupported) {
      var layerContext = this.layer.context;
      layerContext.shadowColor   = cfg.shadow.shadowColor;
      layerContext.shadowBlur    = cfg.shadow.shadowBlur;
      layerContext.shadowOffsetX = cfg.shadow.shadowOffsetX;
      layerContext.shadowOffsetY = cfg.shadow.shadowOffsetY;
    }

    return true;
  };

  /**
   * Initialization procedure which runs after the configuration, language and 
   * GUI files have loaded.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.appInit} event.
   *
   * @private
   *
   * @see pwlib.appEvent.appInit
   */
  this.initComplete = function () {
    if (!this.initCommands()) {
      this.initError(lang.errorInitCommands);
      return;
    }

    // The initial blank state of the image
    this.historyAdd();
    this.image.modified = false;

    // The global keyboard events handler implements everything needed for 
    // switching between tools and for accessing any other functionality of the 
    // Web application.
    kbListener_ = new pwlib.dom.KeyboardEventListener(this.config.guiPlaceholder,
        {keydown:  this.ev_keyboard,
         keypress: this.ev_keyboard,
         keyup:    this.ev_keyboard});

    this.updateCanvasScaling();
    this.win.addEventListener('resize', this.updateCanvasScaling, false);

    this.events.add('configChange',    this.configChangeHandler);
    this.events.add('imageSaveResult', this.imageSaveResultHandler);

    // Add the init event handler.
    if (typeof temp_.onInit === 'function') {
      _self.events.add('appInit', temp_.onInit);
      delete temp_.onInit;
    }

    this.initialized = PaintWeb.INIT_DONE;

    this.events.dispatch(new appEvent.appInit(this.initialized));
  };

  /**
   * Load all the configured drawing tools.
   * @private
   */
  this.initTools = function () {
    var id   = '',
        cfg  = this.config,
        n    = cfg.tools.length,
        base = PaintWeb.baseFolder + cfg.toolsFolder + '/';

    if (n < 1) {
      this.initError(lang.noToolConfigured);
      return;
    }

    temp_.toolsLoadQueue = n;

    for (var i = 0; i < n; i++) {
      id = cfg.tools[i];
      if (id in pwlib.tools) {
        this.toolLoaded();
      } else {
        this.scriptLoad(base + id + '.js' , this.toolLoaded);
      }
    }
  };

  /**
   * The <code>load</code> event handler for each tool script.
   * @private
   */
  this.toolLoaded = function () {
    temp_.toolsLoadQueue--;

    if (temp_.toolsLoadQueue === 0) {
      var t = _self.config.tools,
          n = t.length;

      for (var i = 0; i < n; i++) {
        if (!_self.toolRegister(t[i])) {
          _self.initError(pwlib.strf(lang.toolRegisterFailed, {id: t[i]}));
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
        base = PaintWeb.baseFolder + cfg.extensionsFolder + '/';

    if (n < 1) {
      this.initComplete();
      return;
    }

    temp_.extensionsLoadQueue = n;

    for (var i = 0; i < n; i++) {
      id = cfg.extensions[i];
      if (id in pwlib.extensions) {
        this.extensionLoaded();
      } else {
        this.scriptLoad(base + id + '.js', this.extensionLoaded);
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
      var e = _self.config.extensions,
          n = e.length;

      for (var i = 0; i < n; i++) {
        if (!_self.extensionRegister(e[i])) {
          _self.initError(pwlib.strf(lang.extensionRegisterFailed, {id: e[i]}));
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
   *
   * <p>The {@link pwlib.appEvent.canvasSizeChange} application event is 
   * dispatched.
   */
  this.updateCanvasScaling = function () {
    var res         = _self.resolution,
        cs          = win.getComputedStyle(res.elem, null),
        image       = _self.image;
        bufferStyle = _self.buffer.canvas.style,
        layerStyle  = _self.layer.canvas.style,
        scaleNew    = 1,
        width       = parseInt(cs.width),
        height      = parseInt(cs.height);

    if (pwlib.browser.opera) {
      // Opera zoom level detection.
      // The scaling factor is sufficiently accurate for zoom levels between 
      // 100% and 200% (in steps of 10%).

      scaleNew = win.innerHeight / height;
      scaleNew = MathRound(scaleNew * 10) / 10;

    } else if (width && !isNaN(width) && width !== res.dpiOptimal) {
      // Page DPI detection. This only works in Gecko 1.9.1.

      res.dpiLocal = width;

      // The scaling factor is the same as in Gecko.
      scaleNew = MathFloor(res.dpiLocal / res.dpiOptimal);

    } else if (pwlib.browser.olpcxo && pwlib.browser.gecko) {
      // Support for the default Gecko included on the OLPC XO-1 system.
      //
      // See:
      // http://www.robodesign.ro/mihai/blog/paintweb-performance
      // http://mxr.mozilla.org/mozilla-central/source/gfx/src/thebes/nsThebesDeviceContext.cpp#725
      // dotsArePixels = false on the XO due to a hard-coded patch.
      // Thanks go to roc from Mozilla for his feedback on making this work.

      res.dpiLocal = 134; // hard-coded value, we cannot determine it

      var appUnitsPerCSSPixel  = 60, // hard-coded internally in Gecko
          devPixelsPerCSSPixel = res.dpiLocal / res.dpiOptimal; // 1.3958333333
          appUnitsPerDevPixel  = appUnitsPerCSSPixel / devPixelsPerCSSPixel; // 42.9850746278...

      scaleNew = appUnitsPerCSSPixel / MathFloor(appUnitsPerDevPixel); // 1.4285714285...

      // New in Gecko 1.9.2.
      if ('mozImageSmoothingEnabled' in layerStyle) {
        layerStyle.mozImageSmoothingEnabled 
          = bufferStyle.mozImageSmoothingEnabled = false;
      }
    }

    if (scaleNew === res.scale) {
      return;
    }

    res.scale = scaleNew;

    var styleWidth  = image.width  / res.scale * image.zoom,
        styleHeight = image.height / res.scale * image.zoom;

    image.canvasScale = styleWidth / image.width;

    // FIXME: MSIE 9 clears the Canvas element when you change the 
    // elem.style.width/height... *argh*
    bufferStyle.width  = layerStyle.width  = styleWidth  + 'px';
    bufferStyle.height = layerStyle.height = styleHeight + 'px';

    _self.events.dispatch(new appEvent.canvasSizeChange(styleWidth, styleHeight, 
          image.canvasScale));
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
   * <p>The mouse coordinates are stored in the {@link PaintWeb#mouse} object.  
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
   * <p>Note: this method includes some work-around for making the image zoom 
   * keys work well both in Opera and Firefox.
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
      return;
    }

    if (ev.target && ev.target.nodeName) {
      switch (ev.target.nodeName.toLowerCase()) {
        case 'input':
          if (ev.type === 'keypress' && (ev.key_ === 'Up' || ev.key_ === 'Down') 
              && ev.target.getAttribute('type') === 'number') {
            _self.ev_numberInput(ev);
          }
        case 'select':
        case 'textarea':
        case 'button':
          return;
      }
    }

    // Rather ugly, but the only way, at the moment, to detect these keys in 
    // Opera and Firefox.
    if (ev.type === 'keypress' && ev.char_) {
      var isZoomKey = true,
          imageZoomKeys = _self.config.imageZoomKeys;

      // Check if this is a zoom key and execute the commands as needed.
      switch (ev.char_) {
        case imageZoomKeys['in']:
          _self.imageZoomIn(ev);
          break;

        case imageZoomKeys['out']:
          _self.imageZoomOut(ev);
          break;
        case imageZoomKeys['reset']:
          _self.imageZoomReset(ev);
          break;
        default:
          isZoomKey = false;
      }

      if (isZoomKey) {
        ev.preventDefault();
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
    if ('extension' in gkey) {
      var extension = _self.extensions[gkey.extension],
          method    = gkey.method || ev.type;

      // Call the extension method.
      if (method in extension) {
        extension[method].call(this, ev);
      }

    } else if ('command' in gkey && gkey.command in _self.commands) {
      // Invoke the command associated with the key.
      _self.commands[gkey.command].call(this, ev);

    } else if (ev.type === 'keydown' && 'toolActivate' in gkey) {

      // Active the tool associated to the key.
      _self.toolActivate(gkey.toolActivate, ev);

    }

    if (ev.type === 'keypress') {
      ev.preventDefault();
    }
  };

  /**
   * This is the <code>keypress</code> event handler for inputs of type=number.  
   * This function only handles cases when the key is <kbd>Up</kbd> or 
   * <kbd>Down</kbd>. For the <kbd>Up</kbd> key the input value is increased, 
   * and for the <kbd>Down</kbd> the value is decreased.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   * @see PaintWeb#ev_keyboard
   */
  this.ev_numberInput = function (ev) {
    var target = ev.target;

    // Process the value.
    var val,
        max  = parseFloat(target.getAttribute('max')),
        min  = parseFloat(target.getAttribute('min')),
        step = parseFloat(target.getAttribute('step'));

    if (target.value === '' || target.value === null) {
      val = !isNaN(min) ? min : 0;
    } else {
      val = parseFloat(target.value.replace(/[,.]+/g, '.').
                                    replace(/[^0-9.\-]/g, ''));
    }

    // If target is not a number, then set the old value, or the minimum value. If all fails, set 0.
    if (isNaN(val)) {
      val = min || 0;
    }

    if (isNaN(step)) {
      step = 1;
    }

    if (ev.shiftKey) {
      step *= 2;
    }

    if (ev.key_ === 'Down') {
      step *= -1;
    }

    val += step;

    if (!isNaN(max) && val > max) {
      val = max;
    } else if (!isNaN(min) && val < min) {
      val = min;
    }

    if (val == target.value) {
      return;
    }

    target.value = val;

    // Dispatch the 'change' events to make sure that any associated event 
    // handlers pick up the changes.
    if (doc.createEvent && target.dispatchEvent) {
      var ev_change = doc.createEvent('HTMLEvents');
      ev_change.initEvent('change', true, true);
      target.dispatchEvent(ev_change);
    }
  };

  /**
   * Zoom into the image.
   *
   * @param {mixed} ev An event object which might have the <var>shiftKey</var> 
   * property. If the property evaluates to true, then the zoom level will 
   * increase twice more than normal.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   *
   * @see PaintWeb#imageZoomTo The method used for changing the zoom level.
   * @see PaintWeb.config.zoomStep The value used for increasing the zoom level.
   */
  this.imageZoomIn = function (ev) {
    if (ev && ev.shiftKey) {
      _self.config.imageZoomStep *= 2;
    }

    var res = _self.imageZoomTo('+');

    if (ev && ev.shiftKey) {
      _self.config.imageZoomStep /= 2;
    }

    return res;
  };

  /**
   * Zoom out of the image.
   *
   * @param {mixed} ev An event object which might have the <var>shiftKey</var> 
   * property. If the property evaluates to true, then the zoom level will 
   * decrease twice more than normal.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   *
   * @see PaintWeb#imageZoomTo The method used for changing the zoom level.
   * @see PaintWeb.config.zoomStep The value used for decreasing the zoom level.
   */
  this.imageZoomOut = function (ev) {
    if (ev && ev.shiftKey) {
      _self.config.imageZoomStep *= 2;
    }

    var res = _self.imageZoomTo('-');

    if (ev && ev.shiftKey) {
      _self.config.imageZoomStep /= 2;
    }

    return res;
  };

  /**
   * Reset the image zoom level to normal.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   *
   * @see PaintWeb#imageZoomTo The method used for changing the zoom level.
   */
  this.imageZoomReset = function (ev) {
    return _self.imageZoomTo(1);
  };

  /**
   * Change the image zoom level.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.imageZoom} application 
   * event before zooming the image. Once the image zoom is applied, the {@link 
   * pwlib.appEvent.canvasSizeChange} event is dispatched.
   *
   * @param {Number|String} level The level you want to zoom the image to.
   * 
   * <p>If the value is a number, it must be a floating point positive number, 
   * where 0.5 means 50%, 1 means 100% (normal) zoom, 4 means 400% and so on.
   *
   * <p>If the value is a string it must be "+" or "-". This means that the zoom 
   * level will increase/decrease using the configured {@link 
   * PaintWeb.config.zoomStep}.
   *
   * @returns {Boolean} True if the image zoom level changed successfully, or 
   * false if not.
   */
  this.imageZoomTo = function (level) {
    var image  = this.image,
        config = this.config,
        res    = this.resolution;

    if (!level) {
      return false;
    } else if (level === '+') {
      level = image.zoom + config.imageZoomStep;
    } else if (level === '-') {
      level = image.zoom - config.imageZoomStep;
    } else if (typeof level !== 'number') {
      return false;
    }

    if (level > config.imageZoomMax) {
      level = config.imageZoomMax;
    } else if (level < config.imageZoomMin) {
      level = config.imageZoomMin;
    }

    if (level === image.zoom) {
      return true;
    }

    var cancel = this.events.dispatch(new appEvent.imageZoom(level));
    if (cancel) {
      return false;
    }

    var styleWidth  = image.width  / res.scale * level,
        styleHeight = image.height / res.scale * level,
        bufferStyle = this.buffer.canvas.style,
        layerStyle  = this.layer.canvas.style;

    image.canvasScale = styleWidth / image.width;

    // FIXME: MSIE 9 clears the Canvas element when you change the 
    // elem.style.width/height... *argh*
    bufferStyle.width  = layerStyle.width  = styleWidth  + 'px';
    bufferStyle.height = layerStyle.height = styleHeight + 'px';

    image.zoom = level;

    this.events.dispatch(new appEvent.canvasSizeChange(styleWidth, styleHeight, 
          image.canvasScale));

    return true;
  };

  /**
   * Crop the image.
   *
   * <p>The content of the image is retained only if the browser implements the 
   * <code>getImageData</code> and <code>putImageData</code> methods.
   *
   * <p>This method dispatches three application events: {@link 
   * pwlib.appEvent.imageSizeChange}, {@link pwlib.appEvent.canvasSizeChange} 
   * and {@link pwlib.appEvent.imageCrop}. The <code>imageCrop</code> event is 
   * dispatched before the image is cropped. The <code>imageSizeChange</code> 
   * and <code>canvasSizeChange</code> events are dispatched after the image is 
   * cropped.
   *
   * @param {Number} cropX Image cropping start position on the x-axis.
   * @param {Number} cropY Image cropping start position on the y-axis.
   * @param {Number} cropWidth Image crop width.
   * @param {Number} cropHeight Image crop height.
   *
   * @returns {Boolean} True if the image was cropped successfully, or false if 
   * not.
   */
  this.imageCrop = function (cropX, cropY, cropWidth, cropHeight) {
    var bufferCanvas  = this.buffer.canvas,
        bufferContext = this.buffer.context,
        image         = this.image,
        layerCanvas   = this.layer.canvas,
        layerContext  = this.layer.context;

    cropX      = parseInt(cropX);
    cropY      = parseInt(cropY);
    cropWidth  = parseInt(cropWidth);
    cropHeight = parseInt(cropHeight);

    if (!cropWidth || !cropHeight || isNaN(cropX) || isNaN(cropY) || 
        isNaN(cropWidth) || isNaN(cropHeight) || cropX >= image.width || cropY 
        >= image.height) {
      return false;
    }

    var cancel = this.events.dispatch(new appEvent.imageCrop(cropX, cropY, 
          cropWidth, cropHeight));
    if (cancel) {
      return false;
    }

    if (cropWidth > this.config.imageWidthMax) {
      cropWidth = this.config.imageWidthMax;
    }

    if (cropHeight > this.config.imageHeightMax) {
      cropHeight = this.config.imageHeightMax;
    }

    if (cropX === 0 && cropY === 0 && image.width === cropWidth && image.height 
        === cropHeight) {
      return true;
    }

    var layerData    = null,
        bufferData   = null,
        layerState   = this.stateSave(layerContext),
        bufferState  = this.stateSave(bufferContext),
        scaledWidth  = cropWidth  * image.canvasScale,
        scaledHeight = cropHeight * image.canvasScale,
        dataWidth    = MathMin(image.width,  cropWidth),
        dataHeight   = MathMin(image.height, cropHeight),
        sumX         = cropX + dataWidth,
        sumY         = cropY + dataHeight;

    if (sumX > image.width) {
      dataWidth -= sumX - image.width;
    }
    if (sumY > image.height) {
      dataHeight -= sumY - image.height;
    }

    if (layerContext.getImageData) {
      // TODO: handle "out of memory" errors.
      try {
        layerData = layerContext.getImageData(cropX, cropY, dataWidth, 
            dataHeight);
      } catch (err) { }
    }

    if (bufferContext.getImageData) {
      try {
        bufferData = bufferContext.getImageData(cropX, cropY, dataWidth, 
            dataHeight);
      } catch (err) { }
    }

    bufferCanvas.style.width  = layerCanvas.style.width  = scaledWidth  + 'px';
    bufferCanvas.style.height = layerCanvas.style.height = scaledHeight + 'px';

    layerCanvas.width  = cropWidth;
    layerCanvas.height = cropHeight;

    if (layerData && layerContext.putImageData) {
      layerContext.putImageData(layerData, 0, 0);
    }

    this.stateRestore(layerContext, layerState);
    state = this.stateSave(bufferContext);

    bufferCanvas.width  = cropWidth;
    bufferCanvas.height = cropHeight;

    if (bufferData && bufferContext.putImageData) {
      bufferContext.putImageData(bufferData, 0, 0);
    }

    this.stateRestore(bufferContext, bufferState);

    image.width  = cropWidth;
    image.height = cropHeight;

    bufferState = layerState = layerData = bufferData = null;

    this.events.dispatch(new appEvent.imageSizeChange(cropWidth, cropHeight));
    this.events.dispatch(new appEvent.canvasSizeChange(scaledWidth, 
          scaledHeight, image.canvasScale));

    return true;
  };

  /**
   * Save the state of a Canvas context.
   *
   * @param {CanvasRenderingContext2D} context The 2D context of the Canvas 
   * element you want to save the state.
   *
   * @returns {Object} The object has all the state properties and values.
   */
  this.stateSave = function (context) {
    if (!context || !context.canvas || !this.stateProperties) {
      return false;
    }

    var stateObj = {},
        prop = null,
        n = this.stateProperties.length;

    for (var i = 0; i < n; i++) {
      prop = this.stateProperties[i];
      stateObj[prop] = context[prop];
    }

    return stateObj;
  };

  /**
   * Restore the state of a Canvas context.
   *
   * @param {CanvasRenderingContext2D} context The 2D context where you want to 
   * restore the state.
   *
   * @param {Object} stateObj The state object saved by the {@link 
   * PaintWeb#stateSave} method.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   */
  this.stateRestore = function (context, stateObj) {
    if (!context || !context.canvas) {
      return false;
    }

    for (var state in stateObj) {
      context[state] = stateObj[state];
    }

    return true;
  };

  /**
   * Allow shadows. This method re-enabled shadow rendering, if it was enabled 
   * before shadows were disallowed.
   *
   * <p>The {@link pwlib.appEvent.shadowAllow} event is dispatched.
   */
  this.shadowAllow = function () {
    if (this.shadowAllowed || !this.shadowSupported) {
      return;
    }

    // Note that some daily builds of Webkit in Chromium fail to render the 
    // shadow when context.drawImage() is used (see the this.layerUpdate()).
    var context = this.layer.context,
        cfg = this.config.shadow;

    if (cfg.enable) {
      context.shadowColor   = cfg.shadowColor;
      context.shadowOffsetX = cfg.shadowOffsetX;
      context.shadowOffsetY = cfg.shadowOffsetY;
      context.shadowBlur    = cfg.shadowBlur;
    }

    this.shadowAllowed = true;

    this.events.dispatch(new appEvent.shadowAllow(true));
  };

  /**
   * Disallow shadows. This method disables shadow rendering, if it is enabled.
   *
   * <p>The {@link pwlib.appEvent.shadowAllow} event is dispatched.
   */
  this.shadowDisallow = function () {
    if (!this.shadowAllowed || !this.shadowSupported) {
      return;
    }

    if (this.config.shadow.enable) {
      var context = this.layer.context;
      context.shadowColor   = 'rgba(0,0,0,0)';
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.shadowBlur    = 0;
    }

    this.shadowAllowed = false;

    this.events.dispatch(new appEvent.shadowAllow(false));
  };

  /**
   * Update the current image layer by moving the pixels from the buffer onto 
   * the layer. This method also adds a point into the history.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   */
  this.layerUpdate = function () {
    this.layer.context.drawImage(this.buffer.canvas, 0, 0);
    this.buffer.context.clearRect(0, 0, this.image.width, this.image.height);
    this.historyAdd();

    return true;
  };

  /**
   * Add the current image layer to the history.
   *
   * <p>Once the history state has been updated, this method dispatches the 
   * {@link pwlib.appEvent.historyUpdate} event.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   */
  // TODO: some day it would be nice to implement a hybrid history system.
  this.historyAdd = function () {
    var layerContext = this.layer.context,
        history      = this.history,
        prevPos      = history.pos;

    if (!layerContext.getImageData) {
      return false;
    }

    // We are in an undo-step, trim until the end, eliminating any possible redo-steps.
    if (prevPos < history.states.length) {
      history.states.splice(prevPos, history.states.length);
    }

    // TODO: in case of "out of memory" errors... I should show up some error.
    try {
      history.states.push(layerContext.getImageData(0, 0, this.image.width, 
            this.image.height));
    } catch (err) {
      return false;
    }

    // If we have too many history ImageDatas, remove the oldest ones
    if ('historyLimit' in this.config &&
        history.states.length > this.config.historyLimit) {

      history.states.splice(0, history.states.length 
          - this.config.historyLimit);
    }
    history.pos = history.states.length;

    this.image.modified = true;

    this.events.dispatch(new appEvent.historyUpdate(history.pos, prevPos, 
          history.pos));

    return true;
  };

  /**
   * Jump to any ImageData/position in the history.
   *
   * <p>Once the history state has been updated, this method dispatches the 
   * {@link pwlib.appEvent.historyUpdate} event.
   *
   * @param {Number|String} pos The history position to jump to.
   * 
   * <p>If the value is a number, then it must point to an existing index in the  
   * <var>{@link PaintWeb#history}.states</var> array.
   *
   * <p>If the value is a string, it must be "undo" or "redo".
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   */
  this.historyGoto = function (pos) {
    var layerContext = this.layer.context,
        image        = this.image,
        history      = this.history;

    if (!history.states.length || !layerContext.putImageData) {
      return false;
    }

    var cpos = history.pos;

    if (pos === 'undo') {
      pos = cpos-1;
    } else if (pos === 'redo') {
      pos = cpos+1;
    }

    if (pos < 1 || pos > history.states.length) {
      return false;
    }

    var himg = history.states[pos-1];
    if (!himg) {
      return false;
    }

    // Each image in the history can have a different size. As such, the script 
    // must take this into consideration.
    var w = MathMin(image.width,  himg.width),
        h = MathMin(image.height, himg.height);

    layerContext.clearRect(0, 0, image.width, image.height);

    try {
      // Firefox 3 does not clip the image, if needed.
      layerContext.putImageData(himg, 0, 0, 0, 0, w, h);

    } catch (err) {
      // The workaround is to use a new canvas from which we can copy the 
      // history image without causing any exceptions.
      var tmp    = doc.createElement('canvas');
      tmp.width  = himg.width;
      tmp.height = himg.height;

      var tmp2 = tmp.getContext('2d');
      tmp2.putImageData(himg, 0, 0);

      layerContext.drawImage(tmp, 0, 0);

      tmp2 = tmp = null;
      delete tmp2, tmp;
    }

    history.pos = pos;

    this.events.dispatch(new appEvent.historyUpdate(pos, cpos, 
          history.states.length));

    return true;
  };

  /**
   * Clear the image history.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.historyUpdate} event.
   *
   * @private
   */
  this.historyReset = function () {
    this.history.pos = 0;
    this.history.states = [];

    this.events.dispatch(new appEvent.historyUpdate(0, 0, 0));
  };

  /**
   * Perform horizontal/vertical line snapping. This method updates the mouse 
   * coordinates to "snap" with the given coordinates.
   *
   * @param {Number} x The x-axis location.
   * @param {Number} y The y-axis location.
   */
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

    this.tool = tool_obj;

    this.mouse.buttonDown = false;

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

    // TODO: it would be very nice to create the tool instance on register, for 
    // further extensibility.

    var tool = pwlib.tools[id];
    if (typeof tool !== 'function') {
      return false;
    }

    tool.prototype._id = id;

    this.events.dispatch(new appEvent.toolRegister(id));

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

    this.events.dispatch(new appEvent.toolUnregister(id));

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
   * <p>Once the extension is successfully registered, this method dispatches 
   * the {@link pwlib.appEvent.extensionRegister} application event.
   *
   * @param {String} id The ID of the new extension. The extension object 
   * constructor must exist in {@link pwlib.extensions}.
   *
   * @returns {Boolean} True if the extension was successfully registered, or 
   * false if not.
   *
   * @see PaintWeb#extensionUnregister allows you to unregister extensions.
   * @see PaintWeb#extensions Holds all the instances of registered extensions.
   * @see pwlib.extensions Holds all the extension classes.
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
    }

    this.extensions[id] = obj;
    this.events.dispatch(new appEvent.extensionRegister(id));

    return true;
  };

  /**
   * Unregister an extension from PaintWeb.
   *
   * <p>If the extension object being destructed has the 
   * <code>extensionUnregister()</code> method, then it will be invoked, 
   * allowing any custom extension removal code to run.
   *
   * <p>Before the extension is unregistered, this method dispatches the {@link 
   * pwlib.appEvent.extensionUnregister} application event.
   *
   * @param {String} id The ID of the extension object you want to unregister.
   *
   * @returns {Boolean} True if the extension was removed, or false if it does 
   * not exist or some error occurred.
   *
   * @see PaintWeb#extensionRegister allows you to register new extensions.
   * @see PaintWeb#extensions Holds all the instances of registered extensions.
   * @see pwlib.extensions Holds all the extension classes.
   */
  this.extensionUnregister = function (id) {
    if (typeof id !== 'string' || !id || !(id in this.extensions)) {
      return false;
    }

    this.events.dispatch(new appEvent.extensionUnregister(id));

    if ('extensionUnregister' in this.extensions[id]) {
      this.extensions[id].extensionUnregister();
    }
    delete this.extensions[id];

    return true;
  };

  /**
   * Register a new command in PaintWeb. Commands are simple function objects 
   * which can be invoked by keyboard shortcuts or by GUI elements.
   *
   * <p>Once the command is successfully registered, this method dispatches the 
   * {@link pwlib.appEvent.commandRegister} application event.
   *
   * @param {String} id The ID of the new command.
   * @param {Function} func The command function.
   *
   * @returns {Boolean} True if the command was successfully registered, or 
   * false if not.
   *
   * @see PaintWeb#commandUnregister allows you to unregister commands.
   * @see PaintWeb#commands Holds all the registered commands.
   */
  this.commandRegister = function (id, func) {
    if (typeof id !== 'string' || !id || typeof func !== 'function' || id in 
        this.commands) {
      return false;
    }

    this.commands[id] = func;
    this.events.dispatch(new appEvent.commandRegister(id));

    return true;
  };

  /**
   * Unregister a command from PaintWeb.
   *
   * <p>Before the command is unregistered, this method dispatches the {@link 
   * pwlib.appEvent.commandUnregister} application event.
   *
   * @param {String} id The ID of the command you want to unregister.
   *
   * @returns {Boolean} True if the command was removed successfully, or false 
   * if not.
   *
   * @see PaintWeb#commandRegister allows you to register new commands.
   * @see PaintWeb#commands Holds all the registered commands.
   */
  this.commandUnregister = function (id) {
    if (typeof id !== 'string' || !id || !(id in this.commands)) {
      return false;
    }

    this.events.dispatch(new appEvent.commandUnregister(id));

    delete this.commands[id];

    return true;
  };

  /**
   * Load a script into the document.
   *
   * @param {String} url The script URL you want to insert.
   * @param {Function} [handler] The <code>load</code> event handler you want.
   */
  this.scriptLoad = function (url, handler) {
    if (!handler) {
      var elem = doc.createElement('script');
      elem.type = 'text/javascript';
      elem.src = url;
      this.elems.head.appendChild(elem);
      return;
    }

    // huh, use XHR then eval() the code.
    // browsers do not dispatch the 'load' event reliably for script elements.

    /** @ignore */
    var xhr = new XMLHttpRequest();

    /** @ignore */
    xhr.onreadystatechange = function () {
      if (!xhr || xhr.readyState !== 4) {
        return;

      } else if ((xhr.status !== 304 && xhr.status !== 200) || 
          !xhr.responseText) {
        handler(false, xhr);

      } else {
        try {
          eval.call(win, xhr.responseText);
        } catch (err) {
          eval(xhr.responseText, win);
        }
        handler(true, xhr);
      }

      xhr = null;
    };

    xhr.open('GET', url);
    xhr.send('');
  };

  /**
   * Insert a stylesheet into the document.
   *
   * @param {String} id The stylesheet ID. This is used to avoid inserting the 
   * same style in the document.
   * @param {String} url The URL of the stylesheet you want to insert.
   * @param {String} [media='screen, projection'] The media attribute.
   * @param {Function} [handler] The <code>load</code> event handler.
   */
  this.styleLoad = function (id, url, media, handler) {
    id = 'paintweb_style_' + id;

    var elem = doc.getElementById(id);
    if (elem) {
      return;
    }

    if (!media) {
      media = 'screen, projection';
    }

    elem = doc.createElement('link');

    if (handler) {
      elem.addEventListener('load', handler, false);
    }

    elem.id = id;
    elem.rel = 'stylesheet';
    elem.type = 'text/css';
    elem.media = media;
    elem.href = url;

    this.elems.head.appendChild(elem);
  };

  /**
   * Perform action undo.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   *
   * @see PaintWeb#historyGoto The method invoked by this command.
   */
  this.historyUndo = function () {
    return _self.historyGoto('undo');
  };

  /**
   * Perform action redo.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   *
   * @see PaintWeb#historyGoto The method invoked by this command.
   */
  this.historyRedo = function () {
    return _self.historyGoto('redo');
  };

  /**
   * Load an image. By loading an image the history is cleared and the Canvas 
   * dimensions are updated to fit the new image.
   *
   * <p>This method dispatches two application events: {@link 
   * pwlib.appEvent.imageSizeChange} and {@link 
   * pwlib.appEvent.canvasSizeChange}.
   *
   * @param {Element} importImage The image element you want to load into the 
   * Canvas.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   */
  this.imageLoad = function (importImage) {
    if (!importImage || !importImage.width || !importImage.height || 
        importImage.nodeType !== this.ELEMENT_NODE || 
        !pwlib.isSameHost(importImage.src, win.location.host)) {
      return false;
    }

    this.historyReset();

    var layerContext = this.layer.context,
        layerCanvas  = this.layer.canvas,
        layerStyle   = layerCanvas.style,
        bufferCanvas = this.buffer.canvas,
        bufferStyle  = bufferCanvas.style,
        image        = this.image,
        styleWidth   = importImage.width  * image.canvasScale,
        styleHeight  = importImage.height * image.canvasScale,
        result       = true;

    bufferCanvas.width  = layerCanvas.width  = importImage.width;
    bufferCanvas.height = layerCanvas.height = importImage.height;
    bufferStyle.width  = layerStyle.width  = styleWidth  + 'px';
    bufferStyle.height = layerStyle.height = styleHeight + 'px';

    try {
      layerContext.drawImage(importImage, 0, 0);
    } catch (err) {
      result = false;
      bufferCanvas.width  = layerCanvas.width  = image.width;
      bufferCanvas.height = layerCanvas.height = image.height;
      styleWidth  = image.width  * image.canvasScale;
      styleHeight = image.height * image.canvasScale;
      bufferStyle.width  = layerStyle.width  = styleWidth  + 'px';
      bufferStyle.height = layerStyle.height = styleHeight + 'px';
    }

    if (result) {
      image.width  = importImage.width;
      image.height = importImage.height;
      _self.config.imageLoad = importImage;

      this.events.dispatch(new appEvent.imageSizeChange(image.width, 
            image.height));

      this.events.dispatch(new appEvent.canvasSizeChange(styleWidth, styleHeight, 
            image.canvasScale));
    }

    this.historyAdd();
    image.modified = false;

    return result;
  };

  /**
   * Clear the image.
   */
  this.imageClear = function (ev) {
    var layerContext = _self.layer.context,
        image = _self.image;

    layerContext.clearRect(0, 0, image.width, image.height);

    // Set the configured background color.
    var fillStyle = layerContext.fillStyle;
    layerContext.fillStyle = _self.config.backgroundColor;
    layerContext.fillRect(0, 0, image.width, image.height);
    layerContext.fillStyle = fillStyle;

    _self.historyAdd();
  };

  /**
   * Save the image.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.imageSave} event.
   *
   * <p><strong>Note:</strong> the "Save image" operation relies on integration 
   * extensions. A vanilla configuration of PaintWeb will simply open the the 
   * image in a new tab using a data: URL. You must have some event listener for 
   * the <code>imageSave</code> event and you must prevent the default action.
   *
   * <p>If the default action for the <code>imageSave</code> application event 
   * is not prevented, then this method will also dispatch the {@link 
   * pwlib.appEvent.imageSaveResult} application event.
   *
   * <p>Your event handler for the <code>imageSave</code> event must dispatch 
   * the <code>imageSaveResult</code> event.
   *
   * @param {String} [type="auto"] Image MIME type. This tells the browser which 
   * format to use when saving the image. If the image format type is not 
   * supported, then the image is saved as PNG.
   *
   * <p>You can use the resulting data URL to check which is the actual image 
   * format.
   *
   * <p>When <var>type</var> is "auto" then PaintWeb checks the type of the 
   * image currently loaded ({@link PaintWeb.config.imageLoad}). If the format 
   * is recognized, then the same format is used to save the image.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   */
  this.imageSave = function (type) {
    var canvas = _self.layer.canvas,
        cfg = _self.config,
        img = _self.image,
        imageLoad = _self.config.imageLoad,
        ext = 'png', idata = null, src = null, pos;

    if (!canvas.toDataURL) {
      return false;
    }

    var extMap = {'jpg' : 'image/jpeg', 'jpeg' : 'image/jpeg', 'png' 
      : 'image/png', 'gif' : 'image/gif'};

    // Detect the MIME type of the image currently loaded.
    if (typeof type !== 'string' || !type) {
      if (imageLoad && imageLoad.src && imageLoad.src.substr(0, 5) !== 'data:') {
        src = imageLoad.src;
        pos = src.indexOf('?');
        if (pos !== -1) {
          src = src.substr(0, pos);
        }
        ext = src.substr(src.lastIndexOf('.') + 1).toLowerCase();
      }

      type = extMap[ext] || 'image/png';
    }

    // We consider that other formats than PNG do not support transparencies.  
    // Thus, we create a new Canvas element for which we set the configured 
    // background color, and we render the image onto it.
    if (type !== 'image/png') {
      canvas = doc.createElement('canvas');
      var context = canvas.getContext('2d');

      canvas.width  = img.width;
      canvas.height = img.height;

      context.fillStyle = cfg.backgroundColor;
      context.fillRect(0, 0, img.width, img.height);
      context.drawImage(_self.layer.canvas, 0, 0);

      context = null;
    }

    try {
      // canvas.toDataURL('image/jpeg', quality) fails in Gecko due to security 
      // concerns, uh-oh.
      if (type === 'image/jpeg' && !pwlib.browser.gecko) {
        idata = canvas.toDataURL(type, cfg.jpegSaveQuality);
      } else {
        idata = canvas.toDataURL(type);
      }
    } catch (err) {
      alert(lang.errorImageSave + "\n" + err);
      return false;
    }

    canvas = null;

    if (!idata || idata === 'data:,') {
      return false;
    }

    var ev = new appEvent.imageSave(idata, img.width, img.height),
        cancel = _self.events.dispatch(ev);

    if (cancel) {
      return true;
    }

    var imgwin = _self.win.open();
    if (!imgwin) {
      return false;
    }

    imgwin.location = idata;
    idata = null;

    _self.events.dispatch(new appEvent.imageSaveResult(true));

    return true;
  };

  /**
   * The <code>imageSaveResult</code> application event handler. This method 
   * PaintWeb-related stuff: for example, the {@link PaintWeb.image.modified} 
   * flag is turned to false.
   *
   * @private
   *
   * @param {pwlib.appEvent.imageSaveResult} ev The application event object.
   *
   * @see {PaintWeb#imageSave} The method which allows you to save the image.
   */
  this.imageSaveResultHandler = function (ev) {
    if (ev.successful) {
      _self.image.modified = false;
    }
  };

  /**
   * Swap the fill and stroke styles. This is just like in Photoshop, if the 
   * user presses X, the fill/stroke colors are swapped.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.configChange} event 
   * twice for each color (strokeStyle and fillStyle).
   */
  this.swapFillStroke = function () {
    var fillStyle     = _self.config.fillStyle,
        strokeStyle   = _self.config.strokeStyle;

    _self.config.fillStyle   = strokeStyle;
    _self.config.strokeStyle = fillStyle;

    var ev = new appEvent.configChange(strokeStyle, fillStyle, 'fillStyle', '', 
        _self.config);

    _self.events.dispatch(ev);

    ev = new appEvent.configChange(fillStyle, strokeStyle, 'strokeStyle', '', 
        _self.config);

    _self.events.dispatch(ev);
  };

  /**
   * Select all the pixels. This activates the selection tool, and selects the 
   * entire image.
   *
   * @param {Event} [ev] The DOM Event object which generated the request.
   * @returns {Boolean} True if the operation was successful, or false if not.
   *
   * @see {pwlib.tools.selection.selectAll} The command implementation.
   */
  this.selectAll = function (ev) {
    if (_self.toolActivate('selection', ev)) {
      return _self.tool.selectAll(ev);
    } else {
      return false;
    }
  };

  /**
   * Cut the available selection. This only works when the selection tool is 
   * active and when some selection is available.
   *
   * @param {Event} [ev] The DOM Event object which generated the request.
   * @returns {Boolean} True if the operation was successful, or false if not.
   *
   * @see {pwlib.tools.selection.selectionCut} The command implementation.
   */
  this.selectionCut = function (ev) {
    if (!_self.tool || _self.tool._id !== 'selection') {
      return false;
    } else {
      return _self.tool.selectionCut(ev);
    }
  };

  /**
   * Copy the available selection. This only works when the selection tool is 
   * active and when some selection is available.
   *
   * @param {Event} [ev] The DOM Event object which generated the request.
   * @returns {Boolean} True if the operation was successful, or false if not.
   *
   * @see {pwlib.tools.selection.selectionCopy} The command implementation.
   */
  this.selectionCopy = function (ev) {
    if (!_self.tool || _self.tool._id !== 'selection') {
      return false;
    } else {
      return _self.tool.selectionCopy(ev);
    }
  };

  /**
   * Paste the current clipboard image. This only works when some ImageData is 
   * available in {@link PaintWeb#clipboard}.
   *
   * @param {Event} [ev] The DOM Event object which generated the request.
   * @returns {Boolean} True if the operation was successful, or false if not.
   *
   * @see {pwlib.tools.selection.clipboardPaste} The command implementation.
   */
  this.clipboardPaste = function (ev) {
    if (!_self.clipboard || !_self.toolActivate('selection', ev)) {
      return false;
    } else {
      return _self.tool.clipboardPaste(ev);
    }
  };

  /**
   * The <code>configChange</code> application event handler. This method 
   * updates the Canvas context properties depending on which configuration 
   * property changed.
   *
   * @private
   * @param {pwlib.appEvent.configChange} ev The application event object.
   */
  this.configChangeHandler = function (ev) {
    if (ev.group === 'shadow' && _self.shadowSupported && _self.shadowAllowed) {
      var context = _self.layer.context,
          cfg = ev.groupRef;

      // Enable/disable shadows
      if (ev.config === 'enable') {
        if (ev.value) {
          context.shadowColor   = cfg.shadowColor;
          context.shadowOffsetX = cfg.shadowOffsetX;
          context.shadowOffsetY = cfg.shadowOffsetY;
          context.shadowBlur    = cfg.shadowBlur;
        } else {
          context.shadowColor   = 'rgba(0,0,0,0)';
          context.shadowOffsetX = 0;
          context.shadowOffsetY = 0;
          context.shadowBlur    = 0;
        }
        return;
      }

      // Do not update any context properties if shadows are not enabled.
      if (!cfg.enable) {
        return;
      }

      switch (ev.config) {
        case 'shadowBlur':
        case 'shadowOffsetX':
        case 'shadowOffsetY':
          ev.value = parseInt(ev.value);
        case 'shadowColor':
          context[ev.config] = ev.value;
      }

    } else if (ev.group === 'line') {
      switch (ev.config) {
        case 'lineWidth':
        case 'miterLimit':
          ev.value = parseInt(ev.value);
        case 'lineJoin':
        case 'lineCap':
          _self.buffer.context[ev.config] = ev.value;
      }

    } else if (ev.group === 'text') {
      switch (ev.config) {
        case 'textAlign':
        case 'textBaseline':
          _self.buffer.context[ev.config] = ev.value;
      }

    } else if (!ev.group) {
      switch (ev.config) {
        case 'fillStyle':
        case 'strokeStyle':
          _self.buffer.context[ev.config] = ev.value;
      }
    }
  };

  /**
   * Destroy a PaintWeb instance. This method allows you to unload a PaintWeb 
   * instance. Extensions, tools and commands are unregistered, and the GUI 
   * elements are removed.
   *
   * <p>The scripts and styles loaded are not removed, since they might be used 
   * by other PaintWeb instances.
   *
   * <p>The {@link pwlib.appEvent.appDestroy} application event is dispatched 
   * before the current instance is destroyed.
   */
  this.destroy = function () {
    this.events.dispatch(new appEvent.appDestroy());

    for (var cmd in this.commands) {
      this.commandUnregister(cmd);
    }

    for (var ext in this.extensions) {
      this.extensionUnregister(ext);
    }

    for (var tool in this.gui.tools) {
      this.toolUnregister(tool);
    }

    this.gui.destroy();

    this.initialized = PaintWeb.INIT_NOT_STARTED;
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

/**
 * PaintWeb base folder. This is determined automatically when the PaintWeb 
 * script is added in a page.
 * @type String
 */
PaintWeb.baseFolder = '';

(function () {
  var scripts = document.getElementsByTagName('script'),
      n = scripts.length,
      pos, src;

  // Determine the baseFolder.

  for (var i = 0; i < n; i++) {
    src = scripts[i].src;
    if (!src || !/paintweb(\.dev|\.src)?\.js/.test(src)) {
      continue;
    }

    pos = src.lastIndexOf('/');
    if (pos !== -1) {
      PaintWeb.baseFolder = src.substr(0, pos + 1);
    }

    break;
  }
})();

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

