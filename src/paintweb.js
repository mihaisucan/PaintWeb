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
 * $Date: 2009-05-25 18:26:38 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview The main PaintWeb application code.
 */


// TODO: add more jsdoc comments and move the GUI code out.

// Ugly, but needed.
document.write('<script type="text/javascript" ' +
  'src="includes/lib.js"></script>');

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
  this.version = 0.7;

  /**
   * PaintWeb build date (YYYYMMDD).
   * @type Number
   */
  this.build = 20090525;

  /**
   * Holds all the PaintWeb configuration.
   * @type Object
   */
  this.config = {
    configFile: 'config.json'
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
    "errorInitJSON": "Error: window.JSON is not available."
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
   * @see PaintWeb.tools holds the installed drawing tools.
   * @see PaintWeb#toolActivate Activate a drawing tool by ID.
   */
  this.tool = null;

  /**
   * Holds the implementation of each drawing tool.
   *
   * @private
   * @type Object
   *
   * @see PaintWeb#toolAdd Add a new drawing tool.
   * @see PaintWeb#toolActivate Activate a drawing tool.
   * @see PaintWeb#toolRemove Remove a drawing tool.
   *
   * @see PaintWeb.config.toolDefault The default tool being activated.
   * @see PaintWeb.config.tools Holds the list of tools to be loaded 
   * automatically.
   */
  this.tools = {};

  /**
   * Holds references to DOM elements.
   *
   * @private
   * @type Object
   */
  this.elems = {};

  /**
   * Holds references to DOM input elements.
   *
   * @private
   * @type Object
   */
  this.inputs = {};

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
   * @see PaintWeb#extensionInstall Install a new extension.
   * @see PaintWeb#extensionRemove Remove an extension.
   * @see PaintWeb.config.extensions Holds the list of extensions to be loaded 
   * automatically.
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
   */
  this.initialized = PaintWeb.INIT_NOT_STARTED;

  /**
   * Holds the keyboard event listener object.
   *
   * @private
   * @type pwlib.dom.KeyboardEventListener
   * @see pwlib.dom.KeyboardEventListener The class dealing with the 
   * cross-browser differences in the DOM keyboard events.
   */
  var kbListener_ = null;

  // Avoid global scope lookup.
  var MathAbs   = Math.abs,
      MathFloor = Math.floor,
      MathMax   = Math.max,
      MathMin   = Math.min,
      MathRound = Math.round;

  function $ (id) {
    var elem = _self.doc.getElementById(id);
    if (!elem) {
      alert( pwlib.lang('errorElementNotFound', {'id' : id}) );
      return false;
    } else {
      return elem;
    }
  }

  /**
   * Initialize PaintWeb.
   *
   * <p>This method asynchronous, meaning that it will return much sooner before 
   * the application initialization is completed. Please use the {@link 
   * PaintWeb.initialized} state property to check if initialization is complete 
   * or not.
   *
   * @returns {Boolean} True if the initialization has been started 
   * successfully, or false if not.
   */
  this.init = function () {
    // Basic functionality used within the Web application.
    if (!window.getComputedStyle) {
      alert(_self.lang.errorInitGetComputedStyle);
      return false;
    }

    if (!window.XMLHttpRequest) {
      alert(_self.lang.errorInitXMLHttpRequest);
      return false;
    }

    if (!window.JSON) {
      alert(_self.lang.errorInitJSON);
      return false;
    }

    _self.initialized = PaintWeb.INIT_STARTED;

    _self.configLoad();

    return true;
  };

  /**
   * Asynchronously load the configuration file. This method issues an 
   * XMLHttpRequest to load the JSON file.
   *
   * @see PaintWeb.config.configFile The configuration file.
   * @see lib#xhrLoad The library function being used for creating the 
   * XMLHttpRequest object.
   */
  this.configLoad = function () {
    pwlib.xhrLoad(this.config.configFile, this.configReady);
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
    if (!xhr || xhr.readyState != 4 || xhr.status != 200 || !xhr.responseText) {
      return;
    }

    var config = pwlib.jsonParse(xhr.responseText);

    // Overwrite any existing configuration.
    pwlib.extend(true, _self.config, config);

    if (_self.initialized == PaintWeb.INIT_STARTED) {
      _self.langLoad();
    }
  };

  /**
   * Asynchronously load the language file. This method issues an XMLHttpRequest 
   * to load the JSON file.
   *
   * @see PaintWeb.config.langFile The language file.
   * @see lib#xhrLoad The library function being used for creating the 
   * XMLHttpRequest object.
   */
  this.langLoad = function () {
    pwlib.xhrLoad(this.config.langFile, this.langReady);
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
    if (!xhr || xhr.readyState != 4 || xhr.status != 200 || !xhr.responseText) {
      return;
    }

    var lang_new = pwlib.jsonParse(xhr.responseText);

    pwlib.extend(_self.lang, lang_new);

    if (_self.initialized == PaintWeb.INIT_STARTED) {
      _self.initPostConfig();
    }
  };

  /**
   * Initialization procedure post-configuration and post-language file load.
   *
   * @private
   * @returns {Boolean} True if initialization was successful, or false if not.
   */
  this.initPostConfig = function () {
    var layerCanvas = $(this.config.layerCanvasID);
    if (!layerCanvas) {
      return false;
    }
    this.layer.canvas = layerCanvas;

    var layerContext = false;

    // Prepare the canvas context.
    try {
      layerContext = layerCanvas.getContext('2d');
      if (!layerContext) {
        throw 'err';
      }
    } catch (err) {
      alert(this.lang.errorInitContext);
      return false;
    }

    this.layer.context   = layerContext;

    this.image.width     = layerCanvas.width;
    this.image.height    = layerCanvas.height;

    var container = layerCanvas.parentNode;
    this.elems.container = container;

    // Create the buffer canvas.
    var bufferCanvas = this.doc.createElement('canvas');
    if (!bufferCanvas) {
      alert(this.lang.errorInitBufferCanvas);
      return false;
    }
    this.buffer.canvas  = bufferCanvas;

    bufferCanvas.id     = this.config.bufferCanvasID;
    bufferCanvas.width  = layerCanvas.width;
    bufferCanvas.height = layerCanvas.height;

    // Add the buffer canvas to the main document.
    container.insertBefore(bufferCanvas, layerCanvas.nextSibling);

    var layerStyle     = layerCanvas.style,
        bufferStyle    = bufferCanvas.style,
        containerStyle = container.style;

    layerStyle.width = bufferStyle.width = containerStyle.width  
      = this.image.width  + 'px';

    layerStyle.height = bufferStyle.height = containerStyle.height 
      = this.image.height + 'px';

    this.buffer.context = bufferCanvas.getContext('2d');

    this.elems.resInfo = $('resInfo');
    if (!this.elems.resInfo) {
      return false;
    }

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
    var i, n, events = ['click', 'mousedown', 'mouseup', 'mousemove', 
        'contextmenu'];

    for (i = 0, n = events.length; i < n; i++) {
      bufferCanvas.addEventListener(events[i], this.ev_canvas, false);
    }

    // FIXME: Initialize the color editor.
    /*if (!_self.coloreditor.init()) {
      return false;
    }*/

    // Prepare the buttons
    var elem, evfunc,
        btn = {
          'undo'  : false, // disabled
          'redo'  : false,
          'clear' : true,  // enabled
          'save'  : true,
          'cut'   : false,
          'copy'  : false,
          'paste' : false,
          'help'  : true,
          'help_close' : true
        };
    for (i in btn) {
      if ( !(elem = $('btn-' + i)) ) {
        return false;
      }

      // Each button must have an event handler with the same name. E.g.  
      // btn_undo
      if ( !(evfunc = this['btn_' + i]) ) {
        continue;
      }

      if (!elem.title && elem.textContent) {
        elem.title = elem.textContent;
      }

      elem.addEventListener('click',     evfunc,             false);
      elem.addEventListener('mouseover', this.item_mouseover, false);
      elem.addEventListener('mouseout',  this.item_mouseout,  false);

      if (!btn[i]) {
        elem.className = 'disabled';
      }

      this.elems['btn_' + i] = elem;
    }

    // Initialize the properties box.
    if (!this.init_properties()) {
      return false;
    }

    // The resize handler.
    if ( !(elem = $('resizer')) ) {
      return false;
    }
    elem.addEventListener('mousedown', this.resizer.mousedown, false);
    this.resizer.elem = elem;

    // The zoom input.
    if ( !(elem = $('in-zoom')) ) {
      return false;
    }

    elem.addEventListener('keypress', this.ev_input_nr, false);
    elem.addEventListener('change',   this.ev_change_zoom, false);
    elem._old_value = elem.value;

    // Override the attributes, based on the settings.
    elem.setAttribute('step', this.config.zoomStep * 100);
    elem.setAttribute('max',  this.config.zoomMax  * 100);
    elem.setAttribute('min',  this.config.zoomMin  * 100);

    this.inputs.zoom = elem;

    // The status bar.
    if ( !(this.elems.status = $('status')) ) {
      return false;
    }

    // Load the drawing tools.
    if (!this.initTools()) {
      return false;
    }

    // Load the extensions.
    if (!this.initExtensions()) {
      return false;
    }

    // The keyboard shortcuts.
    if (!this.init_keys()) {
      return false;
    };

    // Update the version string in Help.
    elem = $('ver');
    if (elem) {
      elem.appendChild(this.doc.createTextNode(this.toString()));
    }

    // Initialize the boxes.
    if (!this.boxes.init()) {
      return false;
    }

    this.initialized = PaintWeb.INIT_DONE;

    return true;
  };

  /**
   * Load all the configured drawing tools. Note that the loading is done 
   * asynchronously.
   *
   * @private
   * @returns {Boolean} True if the drawing tools started loading, or false if 
   * not.
   */
  this.initTools = function () {
    var i    = 0,
        n    = this.config.tools.length,
        base = this.config.toolsFolder + '/',
        id   = '';

    for (; i < n; i++) {
      id = this.config.tools[i];
      this.scriptInsert(base + id + '.js');
    }

    return true;
  };

  /**
   * Load all the extensions. Note that the loading is done asynchronously.
   *
   * @private
   * @returns {Boolean} True if the extensions started loading, or false if not.
   */
  this.initExtensions = function () {
    var i    = 0,
        n    = this.config.extensions.length,
        base = this.config.extensionsFolder + '/',
        id   = '';

    for (; i < n; i++) {
      id = this.config.extensions[i];
      this.scriptInsert(base + id + '.js');
    }

    return true;
  };

  // This function does the following:
  // - adds the keyboard shortcuts to the status messages and to the title of 
  // each affected element.
  // - adds the global keyboard event listener.
  // TODO: change all this
  this.init_keys = function () {
    var i, k, elem2,
      updateTitle = function (elem) {
        if (!elem || !elem.id) {
          return false;
        }

        if (this.lang.status['hover' + elem.id]) {
          this.lang.status['hover' + elem.id] += ' [ ' + i + ' ]';
        }

        if (elem.title) {
          elem.title += ' [ ' + i + ' ]';
        }

        return true;
      };

    for (i in this.config.keys) {
      k = this.config.keys[i];

      if (k.tool && this.tools[k.tool]) {
        updateTitle(PaintTools[k.tool].prototype._elem);
      }

      if (k.elem) {
        elem2 = this.elems[k.elem];
        if (!elem2) {
          elem2 = this.doc.getElementById(k.elem);
        }
        updateTitle(elem2);
      }
    }

    // The global keyboard events handler implements everything needed for 
    // switching between tools and for accessing any other functionality of the 
    // Web application.
    kbListener_ = new pwlib.dom.KeyboardEventListener(window,
        {keydown:  this.ev_keyboard,
         keypress: this.ev_keyboard,
         keyup: this.ev_keyboard});

    return true;
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
        containerStyle = _self.elems.container.style,
        scaleNew       = 1;

    var width  = parseInt(cs.width),
        height = parseInt(cs.height);

    if (pwlib.browser.opera) {
      // Opera zoom level detection.
      // The scaling factor is sufficiently accurate for zoom levels between 
      // 100% and 200% (in steps of 10%).

      scaleNew = _self.win.innerHeight / height;
      scaleNew = MathRound(scaleNew * 10) / 10;

    } else if (width && !isNaN(width) && width != res.dpiOptimal) {
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

      res.dpiLocal = 134;
      var appUnitsPerCSSPixel = 60;
      var devPixelsPerCSSPixel = res.dpiLocal / res.dpiOptimal;
      var appUnitsPerDevPixel = appUnitsPerCSSPixel / devPixelsPerCSSPixel;

      scaleNew = appUnitsPerCSSPixel / MathFloor(appUnitsPerDevPixel);
    }

    if (scaleNew == res.scale) {
      return;
    }

    res.scale = scaleNew;

    var styleWidth  = image.width  / res.scale * image.zoom,
        styleHeight = image.height / res.scale * image.zoom;

    image.canvasScale = styleWidth / image.width;

    bufferStyle.width  = layerStyle.width  = styleWidth  + 'px';
    bufferStyle.height = layerStyle.height = styleHeight + 'px';

    if (image.zoom <= 1) {
      containerStyle.width  = styleWidth  + 'px';
      containerStyle.height = styleHeight + 'px';
    }
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
   * @param {String} id The ID of the drawing tool to be activated.
   * @param {Event} [ev] The DOM Event object.
   *
   * @returns {Boolean} True if the tool has been activated, or false if not.
   *
   * @see PaintWeb.tools The object holding all the installed drawing tools.
   * @see PaintWeb#toolAdd Adds a new drawing tool tool.
   * @see PaintWeb#toolRemove Removes a drawing tool.
   */
  this.toolActivate = function (id, ev) {
    if (!id) {
      return false;
    }
    if (_self.tool && _self.tool._id == id) {
      return true;
    }

    var tool = _self.tools[id];
    if (!tool || tool.prototype._elem && tool.prototype._elem.className == 
        'disabled') {
      return false;
    }

    var tool_obj = new tool(_self, ev);
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
     * In the 'preActivate' event handler you can cancel the tool activation by 
     * returning a value which evaluates to false.
     */

    if ('preActivate' in tool_obj && !tool_obj.preActivate(ev)) {
      tool_obj = null;
      return false;
    }

    // Deactivate the previously active tool
    if (_self.tool) {
      if ('deactivate' in _self.tool) {
        _self.tool.deactivate(ev);
      }
      if ('_elem' in _self.tool) {
        _self.tool._elem.className = '';
      }
    }

    _self.mouse.buttonDown = false;

    if ('_elem' in tool_obj) {
      tool_obj._elem.className = 'active';
    }

    _self.tool = tool_obj;

    // Show the status message for the active tool.
    if ((id + 'Active') in _self.lang.status) {
      _self.statusShow(id + 'Active');
    } else {
      _self.statusShow('');
    }

    // Besides the "constructor", each tool can also have code which is run after the deactivation of the previous tool.
    if ('activate' in _self.tool) {
      _self.tool.activate(ev);
    }

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
      if (_self.image.canvasScale == 1) {
        _self.mouse.x = ev.layerX;
        _self.mouse.y = ev.layerY;
      } else {
        _self.mouse.x = MathRound(ev.layerX / _self.image.canvasScale);
        _self.mouse.y = MathRound(ev.layerY / _self.image.canvasScale);
      }
    } else if ('offsetX' in ev) {
      if (_self.image.canvasScale == 1) {
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
      if (ev[i] && ev.key_ != kmods[i]) {
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

  // The event handler for keys +/- (zoom in/out), and for the * (zoom to 100%).
  // FIXME
  this.key_zoom = function (ev) {
    if (ev.key_ == '*') {
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
  this.ev_change_zoom = function (ev) {
    if (!_self.ev_input_nr(ev)) {
      return false;
    } else {
      return _self.zoomTo(this.value/100);
    }
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
    } else if (level == '+') {
      level = image.zoom + config.zoomStep;
    } else if (level == '-') {
      level = image.zoom - config.zoomStep;
    } else if (isNaN(level)) {
      return false;
    }

    if (level > config.zoomMax) {
      level = config.zoomMax;
    } else if (level < config.zoomMin) {
      level = config.zoomMin;
    }

    if (level == image.zoom) {
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

    if (_self.tool && _self.tool._id == 'text' && _self.tool.textUpdate) {
      _self.tool.textUpdate();
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

    if (_self.tool && _self.tool._id == 'text' && _self.tool.textUpdate) {
      _self.tool.textUpdate();
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

    if (!ev || ev.type != 'change') {
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

    if (!ev || ev.type != 'change') {
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

    if (pos == 'undo') {
      pos = cpos-1;
    } else if (pos == 'redo') {
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

    if (pos == history.states.length) {
      btn_redo.className = 'disabled';
    } else {
      btn_redo.className = '';
    }

    if (pos == 1) {
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

  /**
   * Install a new extension to PaintWeb.
   *
   * @param {String} id The ID of the new extension.
   * @param {Function} func The constructor function of the new extension 
   * object.
   * @param {Boolean} [overwrite=false] Tells to overwrite or not an existing 
   * extension with the same ID.
   *
   * @returns {Boolean} True if the extension was successfully added, or false 
   * if not.
   *
   * @see PaintWeb#extensionRemove allows you to remove extensions.
   * @see PaintWeb#extensions Holds all the installed extensions.
   */
  this.extensionAdd = function (id, func, overwrite) {
    if (typeof id != 'string' || typeof func != 'function' || 
        (this.extensions[id] && !overwrite)) {
      return false;
    }

    func.prototype._id = id;
    this.extensions[id] = new func(_self);

    return this.extensions[id] ? true : false;
  };

  /**
   * Remove an extension from PaintWeb.
   *
   * <p>If the extension object being destructed has the 
   * <code>extensionRemove()</code> method, then it will be invoked, allowing 
   * any custom extension removal code to run.
   *
   * @param {String} id The ID of the extension object you want to remove.
   *
   * @returns {Boolean} True if the extension was removed, or false if it does 
   * not exist or some error occurred.
   *
   * @see PaintWeb#extensionAdd allows you to install new extensions.
   * @see PaintWeb#extensions Holds all the installed extensions.
   */
  this.extensionRemove = function (id) {
    if (!id || !_self.extensions[id]) {
      return false;
    }

    if (typeof _self.extensions[id].extensionRemove == 'function') {
      _self.actions[id].extensionRemove();
    }

    delete _self.extensions[id];

    return true;
  };

  /**
   * Insert a script into the document.
   *
   * @param {String} url The script URL you want to insert.
   */
  this.scriptInsert = function (url) {
    var elem = _self.doc.createElement('script');
    elem.src = url;

    _self.elems.head.appendChild(elem);
  };

  this.toString = function () {
    return 'PaintWeb v' + this.version + ' (build ' + this.build + ')';
  };

  this.elems.head = this.doc.getElementsByTagName('head')[0] || document.body;
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

// Create a PaintWeb instance.
window.PaintWebInstance = new PaintWeb();

if (!window.JSON) {
  // Ugly, but it forces the browser to load the JSON code first.
  document.write('<script type="text/javascript" ' +
    'src="includes/json2.js"></script>');

  // This does not work in all browsers.
  //PaintWebInstance.scriptInsert('json2.js');
}

window.addEventListener('load', PaintWebInstance.init, false);


// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

