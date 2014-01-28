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
 * $Date: 2014-01-28 12:52:18 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Minimal JavaScript library which provides functionality for 
 * cross-browser compatibility support.
 */

/**
 * @namespace Holds methods and properties necessary throughout the entire 
 * application.
 */
var pwlib = {};

/**
 * @namespace Holds pre-packaged files.
 * @type Object
 */
pwlib.fileCache = {};

/**
 * @namespace Holds the implementation of each drawing tool.
 *
 * @type Object
 *
 * @see PaintWeb#toolRegister Register a new drawing tool into a PaintWeb 
 * instance.
 * @see PaintWeb#toolActivate Activate a drawing tool in a PaintWeb instance.
 * @see PaintWeb#toolUnregister Unregister a drawing tool from a PaintWeb 
 * instance.
 *
 * @see PaintWeb.config.toolDefault The default tool being activated when 
 * a PaintWeb instance is initialized.
 * @see PaintWeb.config.tools Holds the list of tools to be loaded automatically 
 * when a PaintWeb instance is initialized.
 */
pwlib.tools = {};

/**
 * @namespace Holds all the PaintWeb extensions.
 *
 * @type Object
 * @see PaintWeb#extensionRegister Register a new extension into a PaintWeb 
 * instance.
 * @see PaintWeb#extensionUnregister Unregister an extension from a PaintWeb 
 * instance.
 * @see PaintWeb.config.extensions Holds the list of extensions to be loaded 
 * automatically when a PaintWeb instance is initialized.
 */
pwlib.extensions = {};

/**
 * This function extends objects.
 *
 * @example
 * <code>var <var>obj1</var> = {a: 'a1', b: 'b1', d: 'd1'},
 *     <var>obj2</var> = {a: 'a2', b: 'b2', c: 'c2'};
 * 
 * pwlib.extend(<var>obj1</var>, <var>obj2</var>);</code>
 * 
 * // Now <var>obj1.c == 'c2'</var>, while <var>obj1.a</var>, <var>obj1.b</var>
 * // and <var>obj1.d</var> remain the same.
 *
 * // If <code>pwlib.extend(true, <var>obj1</var>, <var>obj2</var>)</code> is
 * // called, then <var>obj1.a</var>, <var>obj1.b</var>, <var>obj1.c</var>
 * // become all the same as in <var>obj2</var>.
 *
 * @example
 * <code>var <var>obj1</var> = {a: 'a1', b: 'b1', extend: pwlib.extend};
 * <var>obj1</var>.extend({c: 'c1', d: 'd1'});</code>
 *
 * // In this case the destination object which is to be extend is
 * // <var>obj1</var>.
 *
 * @param {Boolean} [overwrite=false] If the first argument is a boolean, then 
 * it will be considered as a boolean flag for overwriting (or not) any existing 
 * methods and properties in the destination object. Thus, any method and 
 * property from the source object will take over those in the destination. The 
 * argument is optional, and if it's omitted, then no method/property will be 
 * overwritten.
 *
 * @param {Object} [destination=this] The second argument is the optional 
 * destination object: the object which will be extended. By default, the 
 * <var>this</var> object will be extended.
 *
 * @param {Object} source The third argument must provide list of methods and 
 * properties which will be added to the destination object.
 */
pwlib.extend = function () {
  var name, src, sval, dval;

  if (typeof arguments[0] === 'boolean') {
    force = arguments[0];
    dest  = arguments[1];
    src   = arguments[2];
  } else {
    force = false;
    dest  = arguments[0];
    src   = arguments[1];
  }

  if (typeof src === 'undefined') {
    src = dest;
    dest = this;
  }

  if (typeof dest === 'undefined') {
    return;
  }

  for (name in src) {
    sval = src[name];
    dval = dest[name];
    if (force || typeof dval === 'undefined') {
      dest[name] = sval;
    }
  }
};

/**
 * Retrieve a string formatted with the provided variables.
 *
 * <p>The language string must be available in the global <var>lang</var> 
 * object.
 *
 * <p>The string can contain any number of variables in the form of 
 * <code>{var_name}</code>.
 *
 * @example
 * lang.table_cells = "The table {name} has {n} cells.";
 *
 * // later ...
 * console.log(pwlib.strf(lang.table_cells, {'name' : 'tbl1', 'n' : 11}));
 * // The output is 'The table tbl1 has 11 cells.'
 *
 * @param {String} str The string you want to output.
 *
 * @param {Object} [vars] The variables you want to set in the language string.
 *
 * @returns {String} The string updated with the variables you provided.
 */
pwlib.strf = function (str, vars) {
  if (!str) {
    return str;
  }

  var re, i;

  for (i in vars) {
    re = new RegExp('{' + i + '}', 'g');
    str = str.replace(re, vars[i]);
  }

  return str;
};

/**
 * Parse a JSON string. This method uses the global JSON parser provided by 
 * the browser natively. The small difference is that this method allows 
 * normal JavaScript comments in the JSON string.
 *
 * @param {String} str The JSON string to parse.
 * @returns The JavaScript object that was parsed.
 */
pwlib.jsonParse = function (str) {
  str = str.replace(/\s*\/\*(\s|.)+?\*\//g, '').
            replace(/^\s*\/\/.*$/gm,        '');

  return JSON.parse(str);
};

/**
 * Load a file from a given URL using XMLHttpRequest.
 *
 * @param {String} url The URL you want to load.
 *
 * @param {Function} handler The <code>onreadystatechange</code> event handler 
 * for the XMLHttpRequest object. Your event handler will always receive the 
 * XMLHttpRequest object as the first parameter.
 *
 * @param {String} [method="GET"] The HTTP method to use for loading the URL.
 *
 * @param {String} [send=null] The string you want to send in an HTTP POST 
 * request.
 *
 * @param {Object} [headers] An object holding the header names and values you 
 * want to set for the request.
 *
 * @returns {XMLHttpRequest} The XMLHttpRequest object created by this method.
 *
 * @throws {TypeError} If the <var>url</var> is not a string.
 */
pwlib.xhrLoad = function (url, handler, method, send, headers) {
  if (typeof url !== 'string') {
    throw new TypeError('The first argument must be a string!');
  }

  if (!method) {
    method = 'GET';
  }

  if (!headers) {
    headers = {};
  }

  if (!send) {
    send = null;
  }

  /** @ignore */
  var xhr = new XMLHttpRequest();
  /** @ignore */
  xhr.onreadystatechange = function () { handler(xhr); };
  xhr.open(method, url);

  for (var header in headers) {
    xhr.setRequestHeader(header, headers[header]);
  }

  xhr.send(send);

  return xhr;
};

/**
 * Check if an URL points to a resource from the same host as the desired one.
 *
 * <p>Note that data URIs always return true.
 *
 * @param {String} url The URL you want to check.
 * @param {String} host The host you want in the URL. The host name can include 
 * the port definition as well.
 *
 * @returns {Boolean} True if the <var>url</var> points to a resource from the 
 * <var>host</var> given, or false otherwise.
 */
pwlib.isSameHost = function (url, host) {
  if (!url || !host) {
    return false;
  }

  var pos = url.indexOf(':'),
      proto = url.substr(0, pos + 1).toLowerCase();

  if (proto === 'data:') {
    return true;
  }

  if (proto !== 'http:' && proto !== 'https:') {
    return false;
  }

  var urlHost = url.replace(/^https?:\/\//i, '');
  pos  = urlHost.indexOf('/');
  if (pos > -1) {
    urlHost = urlHost.substr(0, pos);
  }

  // remove default port (80)
  urlHost = urlHost.replace(/:80$/, '');
  host = host.replace(/:80$/, '');

  if (!urlHost || !host || urlHost !== host) {
    return false;
  }

  return true;
};

/**
 * @class Custom application event.
 *
 * @param {String} type Event type.
 * @param {Boolean} [cancelable=false] Tells if the event can be cancelled or 
 * not.
 *
 * @throws {TypeError} If the <var>type</var> parameter is not a string.
 * @throws {TypeError} If the <var>cancelable</var> parameter is not a string.
 *
 * @see pwlib.appEvents for the application events interface which allows adding 
 * and removing event listeners.
 */
pwlib.appEvent = function (type, cancelable) {
  if (typeof type !== 'string') {
    throw new TypeError('The first argument must be a string');
  } else if (typeof cancelable === 'undefined') {
    cancelable = false;
  } else if (typeof cancelable !== 'boolean') {
    throw new TypeError('The second argument must be a boolean');
  }

  /**
   * Event target object.
   * @type Object
   */
  this.target = null;

  /**
   * Tells if the event can be cancelled or not.
   * @type Boolean
   */
  this.cancelable = cancelable;

  /**
   * Tells if the event has the default action prevented or not.
   * @type Boolean
   */
  this.defaultPrevented = false;

  /**
   * Event type.
   * @type String
   */
  this.type = type;

  /**
   * Prevent the default action of the event.
   */
  this.preventDefault = function () {
    if (cancelable) {
      this.defaultPrevented = true;
    }
  };

  /**
   * Stop the event propagation to other event handlers.
   */
  this.stopPropagation = function () {
    this.propagationStopped_ = true;
  };

  this.toString = function () {
    return '[pwlib.appEvent.' + this.type + ']';
  };
};

/**
 * @class Application initialization event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {Number} state The initialization state.
 * @param {String} [errorMessage] The error message, if any.
 *
 * @throws {TypeError} If the <var>state</var> is not a number.
 */
pwlib.appEvent.appInit = function (state, errorMessage) {
  if (typeof state !== 'number') {
    throw new TypeError('The first argument must be a number.');
  }

  /**
   * Application initialization not started.
   * @constant
   */
  this.INIT_NOT_STARTED = 0;

  /**
   * Application initialization started.
   * @constant
   */
  this.INIT_STARTED = 1;

  /**
   * Application initialization completed successfully.
   * @constant
   */
  this.INIT_DONE = 2;

  /**
   * Application initialization failed.
   * @constant
   */
  this.INIT_ERROR = -1;

  /**
   * Initialization state.
   * @type Number
   */
  this.state = state;

  /**
   * Initialization error message, if any.
   * @type String|null
   */
  this.errorMessage = errorMessage || null;

  pwlib.appEvent.call(this, 'appInit');
};

/**
 * @class Application destroy event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 */
pwlib.appEvent.appDestroy = function () {
  pwlib.appEvent.call(this, 'appDestroy');
};

/**
 * @class GUI show event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 */
pwlib.appEvent.guiShow = function () {
  pwlib.appEvent.call(this, 'guiShow');
};

/**
 * @class GUI hide event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 */
pwlib.appEvent.guiHide = function () {
  pwlib.appEvent.call(this, 'guiHide');
};

/**
 * @class Tool preactivation event. This event is cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {String} id The ID of the new tool being activated.
 * @param {String|null} prevId The ID of the previous tool.
 *
 * @throws {TypeError} If the <var>id</var> is not a string.
 * @throws {TypeError} If the <var>prevId</var> is not a string or null.
 */
pwlib.appEvent.toolPreactivate = function (id, prevId) {
  if (typeof id !== 'string') {
    throw new TypeError('The first argument must be a string.');
  } else if (prevId !== null && typeof prevId !== 'string') {
    throw new TypeError('The second argument must be a string or null.');
  }

  /**
   * Tool ID.
   * @type String
   */
  this.id = id;

  /**
   * Previous tool ID.
   * @type String
   */
  this.prevId = prevId;

  pwlib.appEvent.call(this, 'toolPreactivate', true);
};

/**
 * @class Tool activation event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {String} id The ID the tool which was activated.
 * @param {String|null} prevId The ID of the previous tool.
 *
 * @throws {TypeError} If the <var>id</var> is not a string.
 * @throws {TypeError} If the <var>prevId</var> is not a string or null.
 */
pwlib.appEvent.toolActivate = function (id, prevId) {
  if (typeof id !== 'string') {
    throw new TypeError('The first argument must be a string.');
  } else if (prevId !== null && typeof prevId !== 'string') {
    throw new TypeError('The second argument must be a string or null.');
  }

  /**
   * Tool ID.
   * @type String
   */
  this.id = id;

  /**
   * Previous tool ID.
   * @type String
   */
  this.prevId = prevId;

  pwlib.appEvent.call(this, 'toolActivate');
};

/**
 * @class Tool registration event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {String} id The ID of the tool being registered in an active PaintWeb 
 * instance.
 *
 * @throws {TypeError} If the <var>id</var> is not a string.
 */
pwlib.appEvent.toolRegister = function (id) {
  if (typeof id !== 'string') {
    throw new TypeError('The first argument must be a string.');
  }

  /**
   * Tool ID.
   * @type String
   */
  this.id = id;

  pwlib.appEvent.call(this, 'toolRegister');
};

/**
 * @class Tool removal event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {String} id The ID of the tool being unregistered in an active 
 * PaintWeb instance.
 *
 * @throws {TypeError} If the <var>id</var> is not a string.
 */
pwlib.appEvent.toolUnregister = function (id) {
  if (typeof id !== 'string') {
    throw new TypeError('The first argument must be a string.');
  }

  /**
   * Tool ID.
   * @type String
   */
  this.id = id;

  pwlib.appEvent.call(this, 'toolUnregister');
};

/**
 * @class Extension registration event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {String} id The ID of the extension being registered in an active 
 * PaintWeb instance.
 *
 * @throws {TypeError} If the <var>id</var> is not a string.
 */
pwlib.appEvent.extensionRegister = function (id) {
  if (typeof id !== 'string') {
    throw new TypeError('The first argument must be a string.');
  }

  /**
   * Extension ID.
   * @type String
   */
  this.id = id;

  pwlib.appEvent.call(this, 'extensionRegister');
};

/**
 * @class Extension removal event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {String} id The ID of the extension being unregistered in an active 
 * PaintWeb instance.
 *
 * @throws {TypeError} If the <var>id</var> is not a string.
 */
pwlib.appEvent.extensionUnregister = function (id) {
  if (typeof id !== 'string') {
    throw new TypeError('The first argument must be a string.');
  }

  /**
   * Extension ID.
   * @type String
   */
  this.id = id;

  pwlib.appEvent.call(this, 'extensionUnregister');
};

/**
 * @class Command registration event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {String} id The ID of the command being registered in an active 
 * PaintWeb instance.
 *
 * @throws {TypeError} If the <var>id</var> is not a string.
 */
pwlib.appEvent.commandRegister = function (id) {
  if (typeof id !== 'string') {
    throw new TypeError('The first argument must be a string.');
  }

  /**
   * Command ID.
   * @type String
   */
  this.id = id;

  pwlib.appEvent.call(this, 'commandRegister');
};

/**
 * @class Command removal event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {String} id The ID of the command being unregistered in an active 
 * PaintWeb instance.
 *
 * @throws {TypeError} If the <var>id</var> is not a string.
 */
pwlib.appEvent.commandUnregister = function (id) {
  if (typeof id !== 'string') {
    throw new TypeError('The first argument must be a string.');
  }

  /**
   * Command ID.
   * @type String
   */
  this.id = id;

  pwlib.appEvent.call(this, 'commandUnregister');
};

/**
 * @class The image save event. This event is cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {String} dataURL The data URL generated by the browser holding the 
 * pixels of the image being saved, in PNG format.
 * @param {Number} width The image width.
 * @param {Number} height The image height.
 */
pwlib.appEvent.imageSave = function (dataURL, width, height) {
  /**
   * The image saved by the browser, using the base64 encoding.
   * @type String
   */
  this.dataURL = dataURL;

  /**
   * Image width.
   * @type Number
   */
  this.width = width;

  /**
   * Image height.
   * @type Number
   */
  this.height = height;

  pwlib.appEvent.call(this, 'imageSave', true);
};
/**
 * @class The image save result event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {Boolean} successful Tells if the image save was successful or not.
 * @param {String} [url] The image address.
 * @param {String} [urlNew] The new image address. Provide this parameter, if, 
 * for example, you allow saving images from a remote server to a local server.  
 * In such cases the image address changes.
 */
pwlib.appEvent.imageSaveResult = function (successful, url, urlNew) {
  /**
   * Tells if the image save was successful or not.
   * @type String
   */
  this.successful = successful;

  /**
   * The image address.
   * @type String|null
   */
  this.url = url;

  /**
   * The new image address.
   * @type String|null
   */
  this.urlNew = urlNew;

  pwlib.appEvent.call(this, 'imageSaveResult');
};

/**
 * @class History navigation event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {Number} currentPos The new history position.
 * @param {Number} previousPos The previous history position.
 * @param {Number} states The number of history states available.
 *
 * @throws {TypeError} If any of the arguments are not numbers.
 */
pwlib.appEvent.historyUpdate = function (currentPos, previousPos, states) {
  if (typeof currentPos !== 'number' || typeof previousPos !== 'number' || 
      typeof states !== 'number') {
    throw new TypeError('All arguments must be numbers.');
  }

  /**
   * Current history position.
   * @type Number
   */
  this.currentPos = currentPos;

  /**
   * Previous history position.
   * @type Number
   */
  this.previousPos = previousPos;

  /**
   * History states count.
   * @type Number
   */
  this.states = states;

  pwlib.appEvent.call(this, 'historyUpdate');
};

/**
 * @class Image size change event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {Number} width The new image width.
 * @param {Number} height The new image height.
 *
 * @throws {TypeError} If any of the arguments are not numbers.
 */
pwlib.appEvent.imageSizeChange = function (width, height) {
  if (typeof width !== 'number' || typeof height !== 'number') {
    throw new TypeError('Both arguments must be numbers.');
  }

  /**
   * New image width.
   * @type Number
   */
  this.width  = width;

  /**
   * New image height.
   * @type Number
   */
  this.height = height;

  pwlib.appEvent.call(this, 'imageSizeChange');
};

/**
 * @class Canvas size change event. This event is not cancelable.
 *
 * <p>Note that the Canvas size is not the same as the image size. Canvas size 
 * refers to the scaling of the Canvas elements being applied (due to image 
 * zooming or due to browser zoom / DPI).
 *
 * @augments pwlib.appEvent
 *
 * @param {Number} width The new Canvas style width.
 * @param {Number} height The new Canvas style height.
 * @param {Number} scale The new Canvas scaling factor.
 *
 * @throws {TypeError} If any of the arguments are not numbers.
 */
pwlib.appEvent.canvasSizeChange = function (width, height, scale) {
  if (typeof width !== 'number' || typeof height !== 'number' || typeof scale 
      !== 'number') {
    throw new TypeError('All the arguments must be numbers.');
  }

  /**
   * New Canvas style width.
   * @type Number
   */
  this.width  = width;

  /**
   * New Canvas style height.
   * @type Number
   */
  this.height = height;

  /**
   * The new Canvas scaling factor.
   * @type Number
   */
  this.scale  = scale;

  pwlib.appEvent.call(this, 'canvasSizeChange');
};

/**
 * @class Image viewport size change event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {String} width The new viewport width. This must be a CSS length 
 * value, like "100px", "100%" or "100em".
 *
 * @param {String} height The new viewport height. This must be a CSS length 
 * value, like "100px", "100%" or "100em".
 */
pwlib.appEvent.viewportSizeChange = function (width, height) {
  /**
   * New viewport width.
   * @type String
   */
  this.width  = width;

  /**
   * New viewport height.
   * @type String
   */
  this.height = height;

  pwlib.appEvent.call(this, 'viewportSizeChange');
};


/**
 * @class Image zoom event. This event is cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {Number} zoom The new image zoom level.
 *
 * @throws {TypeError} If the <var>zoom</var> argument is not a number.
 */
pwlib.appEvent.imageZoom = function (zoom) {
  if (typeof zoom !== 'number') {
    throw new TypeError('The first argument must be a number.');
  }

  /**
   * The new image zoom level.
   * @type Number
   */
  this.zoom = zoom;

  pwlib.appEvent.call(this, 'imageZoom', true);
};

/**
 * @class Image crop event. This event is cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {Number} x The crop start position on the x-axis.
 * @param {Number} y The crop start position on the y-axis.
 * @param {Number} width The cropped image width.
 * @param {Number} height The cropped image height.
 *
 * @throws {TypeError} If any of the arguments are not numbers.
 */
pwlib.appEvent.imageCrop = function (x, y, width, height) {
  if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 
      'number' || typeof height !== 'number') {
    throw new TypeError('All arguments must be numbers.');
  }

  /**
   * The crop start position the x-axis.
   * @type Number
   */
  this.x = x;

  /**
   * The crop start position the y-axis.
   * @type Number
   */
  this.y = y;

  /**
   * The cropped image width.
   * @type Number
   */
  this.width  = width;

  /**
   * The cropped image height.
   * @type Number
   */
  this.height = height;

  pwlib.appEvent.call(this, 'imageCrop', true);
};

/**
 * @class Configuration change event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {String|Number|Boolean} value The new value.
 * @param {String|Number|Boolean} previousValue The previous value.
 * @param {String} config The configuration property that just changed.
 * @param {String} group The configuration group where the property is found.
 * @param {Object} groupRef The configuration group object reference.
 *
 * @throws {TypeError} If the <var>prop</var> argument is not a string.
 * @throws {TypeError} If the <var>group</var> argument is not a string.
 * @throws {TypeError} If the <var>groupRef</var> argument is not an object.
 */
pwlib.appEvent.configChange = function (value, previousValue, config, group, 
    groupRef) {
  if (typeof config !== 'string') {
    throw new TypeError('The third argument must be a string.');
  } else if (typeof group !== 'string') {
    throw new TypeError('The fourth argument must be a string.');
  } else if (typeof groupRef !== 'object') {
    throw new TypeError('The fifth argument must be an object.');
  }

  /**
   * The new value.
   */
  this.value = value;

  /**
   * The previous value.
   */
  this.previousValue = previousValue;

  /**
   * Configuration property name.
   * @type String
   */
  this.config = config;

  /**
   * Configuration group name.
   * @type String
   */
  this.group = group;

  /**
   * Reference to the object holding the configuration property.
   * @type Object
   */
  this.groupRef = groupRef;

  pwlib.appEvent.call(this, 'configChange');
};

/**
 * @class Canvas shadows allowed change event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {Boolean} allowed Tells the new allowance value.
 *
 * @throws {TypeError} If the argument is not a boolean value.
 */
pwlib.appEvent.shadowAllow = function (allowed) {
  if (typeof allowed !== 'boolean') {
    throw new TypeError('The first argument must be a boolean.');
  }

  /**
   * Tells if the Canvas shadows are allowed or not.
   * @type Boolean
   */
  this.allowed = allowed;

  pwlib.appEvent.call(this, 'shadowAllow');
};

/**
 * @class Clipboard update event. This event is not cancelable.
 *
 * @augments pwlib.appEvent
 *
 * @param {ImageData} data Holds the clipboard ImageData.
 */
pwlib.appEvent.clipboardUpdate = function (data) {
  /**
   * The clipboard image data.
   * @type ImageData
   */
  this.data = data;

  pwlib.appEvent.call(this, 'clipboardUpdate');
};

/**
 * @class An interface for adding, removing and dispatching of custom 
 * application events.
 *
 * @param {Object} target_ The target for all the events.
 *
 * @see pwlib.appEvent to create application event objects.
 */
pwlib.appEvents = function (target_) {
  /**
   * Holds the list of event types and event handlers.
   *
   * @private
   * @type Object
   */
  var events_ = {};

  var eventID_ = 1;

  /**
   * Add an event listener.
   *
   * @param {String} type The event you want to listen for.
   * @param {Function} handler The event handler.
   *
   * @returns {Number} The event ID.
   *
   * @throws {TypeError} If the <var>type</var> argument is not a string.
   * @throws {TypeError} If the <var>handler</var> argument is not a function.
   *
   * @see pwlib.appEvents#remove to remove events.
   * @see pwlib.appEvents#dispatch to dispatch an event.
   */
  this.add = function (type, handler) {
    if (typeof type !== 'string') {
      throw new TypeError('The first argument must be a string.');
    } else if (typeof handler !== 'function') {
      throw new TypeError('The second argument must be a function.');
    }

    var id = eventID_++;

    if (!(type in events_)) {
      events_[type] = {};
    }

    events_[type][id] = handler;

    return id;
  };

  /**
   * Remove an event listener.
   *
   * @param {String} type The event type.
   * @param {Number} id The event ID.
   *
   * @throws {TypeError} If the <var>type</var> argument is not a string.
   *
   * @see pwlib.appEvents#add to add events.
   * @see pwlib.appEvents#dispatch to dispatch an event.
   */
  this.remove = function (type, id) {
    if (typeof type !== 'string') {
      throw new TypeError('The first argument must be a string.');
    }

    if (!(type in events_) || !(id in events_[type])) {
      return;
    }

    delete events_[type][id];
  };

  /**
   * Dispatch an event.
   *
   * @param {String} type The event type.
   * @param {pwlib.appEvent} ev The event object.
   *
   * @returns {Boolean} True if the <code>event.preventDefault()</code> has been 
   * invoked by one of the event handlers, or false if not.
   *
   * @throws {TypeError} If the <var>type</var> parameter is not a string.
   * @throws {TypeError} If the <var>ev</var> parameter is not an object.
   *
   * @see pwlib.appEvents#add to add events.
   * @see pwlib.appEvents#remove to remove events.
   * @see pwlib.appEvent the generic event object.
   */
  this.dispatch = function (ev) {
    if (typeof ev !== 'object') {
      throw new TypeError('The second argument must be an object.');
    } else if (typeof ev.type !== 'string') {
      throw new TypeError('The second argument must be an application event ' +
        'object.');
    }

    // No event handlers.
    if (!(ev.type in events_)) {
      return false;
    }

    ev.target = target_;

    var id, handlers = events_[ev.type];
    for (id in handlers) {
      handlers[id].call(target_, ev);

      if (ev.propagationStopped_) {
        break;
      }
    }

    return ev.defaultPrevented;
  };
};


/**
 * @namespace Holds browser information.
 */
pwlib.browser = {};

(function () {
var ua = '';

if (window.navigator && window.navigator.userAgent) {
  ua = window.navigator.userAgent.toLowerCase();
}

/**
 * @type Boolean
 */
pwlib.browser.opera = window.opera || /\bopera\b/.test(ua);

/**
 * Webkit is the render engine used primarily by Safari. It's also used by 
 * Google Chrome and GNOME Epiphany.
 *
 * @type Boolean
 */
pwlib.browser.webkit = !pwlib.browser.opera &&
                       /\b(applewebkit|webkit)\b/.test(ua);

/**
 * Firefox uses the Gecko render engine.
 *
 * @type Boolean
 */
// In some variations of the User Agent strings provided by Opera, Firefox is 
// mentioned.
pwlib.browser.firefox = /\bfirefox\b/.test(ua) && !pwlib.browser.opera;

/**
 * Gecko is the render engine used by Firefox and related products.
 *
 * @type Boolean
 */
// Typically, the user agent string of WebKit also mentions Gecko. Additionally, 
// Opera mentions Gecko for tricking some sites.
pwlib.browser.gecko = /\bgecko\b/.test(ua) && !pwlib.browser.opera &&
                      !pwlib.browser.webkit;

/**
 * Microsoft Internet Explorer. The future of computing.
 *
 * @type Boolean
 */
// Again, Opera allows users to easily fake the UA.
pwlib.browser.msie = /\bmsie\b/.test(ua) && !pwlib.browser.opera;

/**
 * Presto is the render engine used by Opera.
 *
 * @type Boolean
 */
// Older versions of Opera did not mention Presto in the UA string.
pwlib.browser.presto = /\bpresto\b/.test(ua) || pwlib.browser.opera;


/**
 * Browser operating system
 *
 * @type String
 */
pwlib.browser.os = (ua.match(/\b(windows|linux)\b/) || [])[1];

/**
 * Tells if the browser is running on an OLPC XO. Typically, only the default 
 * Gecko-based browser includes the OLPC XO tokens in the user agent string.
 *
 * @type Boolean
 */
pwlib.browser.olpcxo = /\bolpc\b/.test(ua) && /\bxo\b/.test(ua);

delete ua;
})();


/**
 * @namespace Holds methods and properties necessary for DOM manipulation.
 */
pwlib.dom = {};

/**
 * @namespace Holds the list of virtual key identifiers and a few characters, 
 * each being associated to a key code commonly used by Web browsers.
 *
 * @private
 */
pwlib.dom.keyNames = {
  Help:          6,
  Backspace:     8,
  Tab:           9,
  Clear:         12,
  Enter:         13,
  Shift:         16,
  Control:       17,
  Alt:           18,
  Pause:         19,
  CapsLock:      20,
  Cancel:        24,
  'Escape':      27,
  Space:         32,
  PageUp:        33,
  PageDown:      34,
  End:           35,
  Home:          36,
  Left:          37,
  Up:            38,
  Right:         39,
  Down:          40,
  PrintScreen:   44,
  Insert:        45,
  'Delete':      46,
  Win:           91,
  ContextMenu:   93,
  '*':           106,
  '+':           107,
  F1:            112,
  F2:            113,
  F3:            114,
  F4:            115,
  F5:            116,
  F6:            117,
  F7:            118,
  F8:            119,
  F9:            120,
  F10:           121,
  F11:           122,
  F12:           123,
  NumLock:       144,
  ';':           186,
  '=':           187,
  ',':           188,
  '-':           189,
  '.':           190,
  '/':           191,
  '`':           192,
  '[':           219,
  '\\':          220,
  ']':           221,
  "'":           222
};

/**
 * @namespace Holds the list of codes, each being associated to a virtual key 
 * identifier.
 *
 * @private
 */
pwlib.dom.keyCodes = {
  /*
   * For almost each key code, these comments give the key name, the 
   * keyIdentifier from the DOM 3 Events spec and the Unicode character 
   * information (if you would use the decimal code for direct conversion to 
   * a character, e.g. String.fromCharCode()). Obviously, the Unicode character 
   * information is not to be used, since these are only virtual key codes (not 
   * really char codes) associated to key names.
   *
   * Each key name in here tries to follow the same style as the defined 
   * keyIdentifiers from the DOM 3 Events. Thus for the Page Down button, 
   * 'PageDown' is used (not other variations like 'pag-up'), and so on.
   *
   * Multiple key codes might be associated to the same key - it's not an error.
   *
   * Note that this list is not an exhaustive key codes list. This means that 
   * for key A or for key 0, the script will do String.fromCharCode(keyCode), to 
   * determine the key. For the case of alpha-numeric keys, this works fine.
   */

  /*
   * Key: Enter
   * Unicode: U+0003 [End of text]
   *
   * Note 1: This keyCode is only used in Safari 2 (older Webkit) for the Enter 
   * key.
   *
   * Note 2: In Gecko this keyCode is used for the Cancel key (see 
   * DOM_VK_CANCEL).
   */
  3: 'Enter',

  /*
   * Key: Help
   * Unicode: U+0006 [Acknowledge]
   *
   * Note: Taken from Gecko (DOM_VK_HELP).
   */
  6: 'Help',

  /*
   * Key: Backspace
   * Unicode: U+0008 [Backspace]
   * keyIdentifier: U+0008
   */
  8: 'Backspace',

  /*
   * Key: Tab
   * Unicode: U+0009 [Horizontal tab]
   * keyIdentifier: U+0009
   */
  9: 'Tab',

  /*
   * Key: Enter
   * Unicode: U+0010 [Line feed (LF) / New line (NL) / End of line (EOL)]
   *
   * Note: Taken from the Unicode characters list. If it ends up as a keyCode in 
   * some event, it's simply considered as being the Enter key.
   */
  10: 'Enter',

  /*
   * Key: NumPad_Center
   * Unicode: U+000C [Form feed]
   * keyIdentifier: Clear
   *
   * Note 1: This keyCode is used when NumLock is off, and the user pressed the 
   * 5 key on the numeric pad.
   *
   * Note 2: Safari 2 (older Webkit) assigns this keyCode to the NumLock key 
   * itself.
   */
  12: 'Clear',

  /*
   * Key: Enter
   * Unicode: U+000D [Carriage return (CR)]
   * keyIdentifier: Enter
   *
   * Note 1: This is the keyCode used by most of the Web browsers when the Enter 
   * key is pressed.
   *
   * Note 2: Gecko associates the DOM_VK_RETURN to this keyCode.
   */
  13: 'Enter',

  /*
   * Key: Enter
   * Unicode: U+000E [Shift out]
   *
   * Note: Taken from Gecko (DOM_VK_ENTER).
   */
  14: 'Enter',

  /*
   * Key: Shift
   * Unicode: U+0010 [Data link escape]
   * keyIdentifier: Shift
   *
   * Note: In older Safari (Webkit) versions Shift+Tab is assigned a different 
   * keyCode: keyCode 25.
   */
  16: 'Shift',

  /*
   * Key: Control
   * Unicode: U+0011 [Device control one]
   * keyIdentifier: Control
   */
  17: 'Control',

  /*
   * Key: Alt
   * Unicode: U+0012 [Device control two]
   * keyIdentifier: Alt
   */
  18: 'Alt',

  /*
   * Key: Pause
   * Unicode: U+0013 [Device control three]
   * keyIdentifier: Pause
   */
  19: 'Pause',

  /*
   * Key: CapsLock
   * Unicode: U+0014 [Device control four]
   * keyIdentifier: CapsLock
   */
  20: 'CapsLock',

  /*
   * Key: Cancel
   * Unicode: U+0018 [Cancel]
   * keyIdentifier: U+0018
   */
  24: 'Cancel',

  /*
   * Key: Escape
   * Unicode: U+001B [Escape]
   * keyIdentifier: U+001B
   */
  27: 'Escape',

  /*
   * Key: Space
   * Unicode: U+0020 [Space]
   * keyIdentifier: U+0020
   */
  32: 'Space',

  /*
   * Key: PageUp or NumPad_North_East
   * Unicode: U+0021 ! [Exclamation mark]
   * keyIdentifier: PageUp
   */
  33: 'PageUp',

  /*
   * Key: PageDown or NumPad_South_East
   * Unicode: U+0022 " [Quotation mark]
   * keyIdentifier: PageDown
   */
  34: 'PageDown',

  /*
   * Key: End or NumPad_South_West
   * Unicode: U+0023 # [Number sign]
   * keyIdentifier: PageDown
   */
  35: 'End',

  /*
   * Key: Home or NumPad_North_West
   * Unicode: U+0024 $ [Dollar sign]
   * keyIdentifier: Home
   */
  36: 'Home',

  /*
   * Key: Left or NumPad_West
   * Unicode: U+0025 % [Percent sign]
   * keyIdentifier: Left
   */
  37: 'Left',

  /*
   * Key: Up or NumPad_North
   * Unicode: U+0026 & [Ampersand]
   * keyIdentifier: Up
   */
  38: 'Up',

  /*
   * Key: Right or NumPad_East
   * Unicode: U+0027 ' [Apostrophe]
   * keyIdentifier: Right
   */
  39: 'Right',

  /*
   * Key: Down or NumPad_South
   * Unicode: U+0028 ( [Left parenthesis]
   * keyIdentifier: Down
   */
  40: 'Down',

  /*
   * Key: PrintScreen
   * Unicode: U+002C , [Comma]
   * keyIdentifier: PrintScreen
   */
  //44: 'PrintScreen',

  /*
   * Key: Insert or NumPad_Insert
   * Unicode: U+002D - [Hyphen-Minus]
   * keyIdentifier: Insert
   */
  45: 'Insert',

  /*
   * Key: Delete or NumPad_Delete
   * Unicode: U+002E . [Full stop / period]
   * keyIdentifier: U+007F
   */
  46: 'Delete',

  /*
   * Key: WinLeft
   * Unicode: U+005B [ [Left square bracket]
   * keyIdentifier: Win
   *
   * Disabled: rarely needed.
   */
  //91: 'Win',

  /*
   * Key: WinRight
   * Unicode: U+005C \ [Reverse solidus / Backslash]
   * keyIdentifier: Win
   */
  //92: 'Win',

  /*
   * Key: Menu/ContextMenu
   * Unicode: U+005D ] [Right square bracket]
   * keyIdentifier: ...
   *
   * Disabled: Is it Meta? Is it Menu, ContextMenu, what? Too much mess.
   */
  //93: 'ContextMenu',

  /*
   * Key: NumPad_0
   * Unicode: U+0060 ` [Grave accent]
   * keyIdentifier: 0
   */
  96: '0',

  /*
   * Key: NumPad_1
   * Unicode: U+0061 a [Latin small letter a]
   * keyIdentifier: 1
   */
  97: '1',

  /*
   * Key: NumPad_2
   * Unicode: U+0062 b [Latin small letter b]
   * keyIdentifier: 2
   */
  98: '2',

  /*
   * Key: NumPad_3
   * Unicode: U+0063 c [Latin small letter c]
   * keyIdentifier: 3
   */
  99: '3',

  /*
   * Key: NumPad_4
   * Unicode: U+0064 d [Latin small letter d]
   * keyIdentifier: 4
   */
  100: '4',

  /*
   * Key: NumPad_5
   * Unicode: U+0065 e [Latin small letter e]
   * keyIdentifier: 5
   */
  101: '5',

  /*
   * Key: NumPad_6
   * Unicode: U+0066 f [Latin small letter f]
   * keyIdentifier: 6
   */
  102: '6',

  /*
   * Key: NumPad_7
   * Unicode: U+0067 g [Latin small letter g]
   * keyIdentifier: 7
   */
  103: '7',

  /*
   * Key: NumPad_8
   * Unicode: U+0068 h [Latin small letter h]
   * keyIdentifier: 8
   */
  104: '8',

  /*
   * Key: NumPad_9
   * Unicode: U+0069 i [Latin small letter i]
   * keyIdentifier: 9
   */
  105: '9',

  /*
   * Key: NumPad_Multiply
   * Unicode: U+0070 j [Latin small letter j]
   * keyIdentifier: U+002A * [Asterisk / Star]
   */
  106: '*',

  /*
   * Key: NumPad_Plus
   * Unicode: U+0071 k [Latin small letter k]
   * keyIdentifier: U+002B + [Plus]
   */
  107: '+',

  /*
   * Key: NumPad_Minus
   * Unicode: U+0073 m [Latin small letter m]
   * keyIdentifier: U+002D + [Hyphen / Minus]
   */
  109: '-',

  /*
   * Key: NumPad_Period
   * Unicode: U+0074 n [Latin small letter n]
   * keyIdentifier: U+002E . [Period]
   */
  110: '.',

  /*
   * Key: NumPad_Division
   * Unicode: U+0075 o [Latin small letter o]
   * keyIdentifier: U+002F / [Solidus / Slash]
   */
  111: '/',

  112: 'F1',                // p
  113: 'F2',                // q
  114: 'F3',                // r
  115: 'F4',                // s
  116: 'F5',                // t
  117: 'F6',                // u
  118: 'F7',                // v
  119: 'F8',                // w
  120: 'F9',                // x
  121: 'F10',               // y
  122: 'F11',               // z
  123: 'F12',               // {

  /*
   * Key: Delete
   * Unicode: U+007F [Delete]
   * keyIdentifier: U+007F
   */
  127: 'Delete',

  /*
   * Key: NumLock
   * Unicode: U+0090 [Device control string]
   * keyIdentifier: NumLock
   */
  144: 'NumLock',

  186: ';',                 // º (Masculine ordinal indicator)
  187: '=',                 // »
  188: ',',                 // ¼
  189: '-',                 // ½
  190: '.',                 // ¾
  191: '/',                 // ¿
  192: '`',                 // À
  219: '[',                 // Û
  220: '\\',                // Ü
  221: ']',                 // Ý
  222: "'"                  // Þ (Latin capital letter thorn)

  //224: 'Win',               // à
  //229: 'WinIME',            // å or WinIME or something else in Webkit
  //255: 'NumLock',           // ÿ, Gecko and Chrome, Windows XP in VirtualBox
  //376: 'NumLock'            // Ÿ, Opera, Windows XP in VirtualBox
};

if (pwlib.browser.gecko) {
  pwlib.dom.keyCodes[3] = 'Cancel'; // DOM_VK_CANCEL
}

/**
 * @namespace Holds a list of common wrong key codes in Web browsers.
 *
 * @private
 */
pwlib.dom.keyCodes_fixes = {
  42:   pwlib.dom.keyNames['*'],        // char * to key *
  47:   pwlib.dom.keyNames['/'],        // char / to key /
  59:   pwlib.dom.keyNames[';'],        // char ; to key ;
  61:   pwlib.dom.keyNames['='],        // char = to key =
  96:   48,                             // NumPad_0 to char 0
  97:   49,                             // NumPad_1 to char 1
  98:   50,                             // NumPad_2 to char 2
  99:   51,                             // NumPad_3 to char 3
  100:  52,                             // NumPad_4 to char 4
  101:  53,                             // NumPad_5 to char 5
  102:  54,                             // NumPad_6 to char 6
  103:  55,                             // NumPad_7 to char 7
  104:  56,                             // NumPad_8 to char 8
  105:  57,                             // NumPad_9 to char 9
  //106:  56,                           // NumPad_Multiply to char 8
  //107:  187,                          // NumPad_Plus to key =
  109:  pwlib.dom.keyNames['-'],        // NumPad_Minus to key -
  110:  pwlib.dom.keyNames['.'],        // NumPad_Period to key .
  111:  pwlib.dom.keyNames['/']         // NumPad_Division to key /
};

/**
 * @namespace Holds the list of broken key codes generated by older Webkit 
 * (Safari 2).
 *
 * @private
 */
pwlib.dom.keyCodes_Safari2 = {
  63232: pwlib.dom.keyNames.Up,               // 38
  63233: pwlib.dom.keyNames.Down,             // 40
  63234: pwlib.dom.keyNames.Left,             // 37
  63235: pwlib.dom.keyNames.Right,            // 39
  63236: pwlib.dom.keyNames.F1,               // 112
  63237: pwlib.dom.keyNames.F2,               // 113
  63238: pwlib.dom.keyNames.F3,               // 114
  63239: pwlib.dom.keyNames.F4,               // 115
  63240: pwlib.dom.keyNames.F5,               // 116
  63241: pwlib.dom.keyNames.F6,               // 117
  63242: pwlib.dom.keyNames.F7,               // 118
  63243: pwlib.dom.keyNames.F8,               // 119
  63244: pwlib.dom.keyNames.F9,               // 120
  63245: pwlib.dom.keyNames.F10,              // 121
  63246: pwlib.dom.keyNames.F11,              // 122
  63247: pwlib.dom.keyNames.F12,              // 123
  63248: pwlib.dom.keyNames.PrintScreen,      // 44
  63272: pwlib.dom.keyNames['Delete'],        // 46
  63273: pwlib.dom.keyNames.Home,             // 36
  63275: pwlib.dom.keyNames.End,              // 35
  63276: pwlib.dom.keyNames.PageUp,           // 33
  63277: pwlib.dom.keyNames.PageDown,         // 34
  63289: pwlib.dom.keyNames.NumLock,          // 144
  63302: pwlib.dom.keyNames.Insert            // 45
};


/**
 * A complete keyboard events cross-browser compatibility layer.
 *
 * <p>Unfortunately, due to the important differences across Web browsers, 
 * simply using the available properties in a single keyboard event is not 
 * enough to accurately determine the key the user pressed. Thus, one needs to 
 * have event handlers for all keyboard-related events <code>keydown</code>, 
 * <code>keypress</code> and <code>keyup</code>.
 *
 * <p>This class provides a complete keyboard event compatibility layer. For any 
 * new instance you provide the DOM element you want to listen events for, and 
 * the event handlers for any of the three events <code>keydown</code> 
 * / <code>keypress</code> / <code>keyup</code>.
 *
 * <p>Your event handlers will receive the original DOM Event object, with 
 * several new properties defined:
 *
 * <ul>
 *   <li><var>event.keyCode_</var> holds the correct code for event key.
 *
 *   <li><var>event.key_</var> holds the key the user pressed. It can be either 
 *   a key name like "PageDown", "Delete", "Enter", or it is a character like 
 *   "A", "1", or "[".
 *
 *   <li><var>event.charCode_</var> holds the Unicode character decimal code.
 *
 *   <li><var>event.char_</var> holds the character generated by the event.
 *
 *   <li><var>event.repeat_</var> is a boolean property telling if the 
 *   <code>keypress</code> event is repeated - the user is holding down the key 
 *   for a long-enough period of time to generate multiple events.
 * </ul>
 *
 * <p>The character-related properties, <var>charCode_</var> and 
 * <var>char_</var> are only available in the <code>keypress</code> and 
 * <code>keyup</code> event objects.
 *
 * <p>This class will ensure that the <code>keypress</code> event is always 
 * fired in Webkit and MSIE for all keys, except modifiers. For modifier keys 
 * like <kbd>Shift</kbd>, <kbd>Control</kbd>, and <kbd>Alt</kbd>, the 
 * <code>keypress</code> event will not be fired, even if the Web browser does 
 * it.
 *
 * <p>Some user agents like Webkit repeat the <code>keydown</code> event while 
 * the user holds down a key. This class will ensure that only the 
 * <code>keypress</code> event is repeated.
 *
 * <p>If you want to prevent the default action for an event, you should prevent 
 * it on <code>keypress</code>. This class will prevent the default action for 
 * <code>keydown</code> if need (in MSIE).
 *
 * @example
 * <code>var <var>klogger</var> = function (<var>ev</var>) {
 *   console.log(<var>ev</var>.type +
 *     ' keyCode_ ' + <var>ev</var>.keyCode_ +
 *     ' key_ ' + <var>ev</var>.key_ +
 *     ' charCode_ ' + <var>ev</var>.charCode_ +
 *     ' char_ ' + <var>ev</var>.char_ +
 *     ' repeat_ ' + <var>ev</var>.repeat_);
 * };
 *
 * var <var>kbListener</var> = new pwlib.dom.KeyboardEventListener(window,
 *               {keydown: <var>klogger</var>,
 *                keypress: <var>klogger</var>,
 *                keyup: <var>klogger</var>});</code>
 *
 * // later when you're done...
 * <code><var>kbListener</var>.detach();</code>
 *
 * @class A complete keyboard events cross-browser compatibility layer.
 *
 * @param {Element} elem_ The DOM Element you want to listen events for.
 *
 * @param {Object} handlers_ The object holding the list of event handlers 
 * associated to the name of each keyboard event you want to listen. To listen 
 * for all the three keyboard events use <code>{keydown: <var>fn1</var>, 
 * keypress: <var>fn2</var>, keyup: <var>fn3</var>}</code>.
 *
 * @throws {TypeError} If the <var>handlers_</var> object does not contain any 
 * event handler.
 */
pwlib.dom.KeyboardEventListener = function (elem_, handlers_) {
  /*
    Technical details:

    For the keyup and keydown events the keyCode provided is that of the virtual 
    key irrespective of other modifiers (e.g. Shift). Generally, during the 
    keypress event, the keyCode holds the Unicode value of the character 
    resulted from the key press, say an alphabetic upper/lower-case char, 
    depending on the actual intent of the user and depending on the currently 
    active keyboard layout.

    Examples:
    * Pressing p you get keyCode 80 in keyup/keydown, and keyCode 112 in 
    keypress.  String.fromCharCode(80) = 'P' and String.fromCharCode(112) = 'p'.
    * Pressing P you get keyCode 80 in all events.
    * Pressing F1 you get keyCode 112 in keyup, keydown and keypress.
    * Pressing 9 you get keyCode 57 in all events.
    * Pressing Shift+9 you get keyCode 57 in keyup/keydown, and keyCode 40 in 
    keypress. String.fromCharCode(57) = '9' and String.fromCharCode(40) = '('.

    * Using the Greek layout when you press v on an US keyboard you get the 
    output character ω. The keyup/keydown events hold keyCode 86 which is V.  
    This does make sense, since it's the virtual key code we are dealing with 
    - not the character code, not the result of pressing the key. The keypress 
    event will hold keyCode 969 (ω).

    * Pressing NumPad_Minus you get keyCode 109 in keyup/keydown and keyCode 45 
    in keypress. Again, this happens because in keyup/keydown you don't get the 
    character code, you get the key code, as indicated above. For
    your information: String.fromCharCode(109) = 'm' and String.fromCharCode(45) 
    = '-'.

    Therefore, we need to map all the codes of several keys, like F1-F12, 
    Escape, Enter, Tab, etc. This map is held by pwlib.dom.keyCodes. It 
    associates, for example, code 112 to F1, or 13 to Enter. This map is used to 
    detect virtual keys in all events.

    (This is only the general story, details about browser-specific differences 
    follow below.)

    If the code given by the browser doesn't appear in keyCode maps, it's used 
    as is.  The key_ returned is that of String.fromCharCode(keyCode).

    In all browsers we consider all events having keyCode <= 32, as being events  
    generated by a virtual key (not a character). As such, the keyCode value is 
    always searched in pwlib.dom.keyCodes.

    As you might notice from the above description, in the keypress event we 
    cannot tell the difference from say F1 and p, because both give the code 
    112. In Gecko and Webkit we can tell the difference because these UAs also 
    set the charCode event property when the key generates a character. If F1 is 
    pressed, or some other virtual key, charCode is never set.

    In Opera the charCode property is never set. However, the 'which' event 
    property is not set for several virtual keys. This means we can tell the 
    difference between a character and a virtual key. However, there's a catch: 
    not *all* virtual keys have the 'which' property unset. Known exceptions: 
    Backspace (8), Tab (9), Enter (13), Shift (16), Control (17), Alt (18), 
    Pause (19), Escape (27), End (35), Home (36), Insert (45), Delete (46) and 
    NumLock (144). Given we already consider any keyCode <= 32 being one of some 
    virtual key, fewer exceptions remain. We only have the End, Home, Insert, 
    Delete and the NumLock keys which cannot be 100% properly detected in the 
    keypress event, in Opera. To properly detect End/Home we can check if the 
    Shift modifier is active or not. If the user wants # instead of End, then 
    Shift must be active. The same goes for $ and Home. Thus we now only have 
    the '-' (Insert) and the '.' (Delete) characters incorrectly detected as 
    being Insert/Delete.
    
    The above brings us to one of the main visible difference, when comparing 
    the pwlib.dom.KeyboardEventListener class and the simple 
    pwlib.dom.KeyboardEvent.getKey() function. In getKey(), for the keypress 
    event we cannot accurately determine the exact key, because it requires
    checking the keyCode used for the keydown event. The KeyboardEventListener
    class monitors all the keyboard events, ensuring a more accurate key 
    detection.

    Different keyboard layouts and international characters are generally 
    supported. Tested and known to work with the Cyrillic alphabet (Greek 
    keyboard layout) and with the US Dvorak keyboard layouts.

    Opera does not fire the keyup event for international characters when 
    running on Linux. For example, this happens with the Greek keyboard layout, 
    when trying Cyrillic characters.

    Gecko gives no keyCode/charCode/which for international characters when 
    running on Linux, in the keyup/keydown events. Thus, all such keys remain 
    unidentified for these two events. For the keypress event there are no 
    issues with such characters.

    Webkit and Konqueror 4 also implement the keyIdentifier property from the 
    DOM 3 Events specification. In theory, this should be great, but it's not 
    without problems.  Sometimes keyCode/charCode/which are all 0, but 
    keyIdentifier is properly set. For several virtual keys the keyIdentifier 
    value is simply 'U+0000'. Thus, the keyIdentifier is used only if the value 
    is not 'Unidentified' / 'U+0000', and only when keyCode/charCode/which are 
    not available.

    Konqueror 4 does not use the 'U+XXXX' notation for Unicode characters. It 
    simply gives the character, directly.

    Additionally, Konqueror seems to have some problems with several keyCodes in 
    keydown/keyup. For example, the key '[' gives keyCode 91 instead of 219.  
    Thus, it effectively gives the Unicode for the character, not the key code.  
    This issue is visible with other key as well.

    NumPad_Clear is unidentified on Linux in all browsers, but it works on 
    Windows.

    In MSIE the keypress event is only fired for characters and for Escape, 
    Space and Enter. Similarly, Webkit only fires the keypress event for 
    characters. However, Webkit does not fire keypress for Escape.

    International characters and different keyboard layouts seem to work fine in 
    MSIE as well.

    As of MSIE 4.0, the keypress event fires for the following keys:
      * Letters: A - Z (uppercase and lowercase)
      * Numerals: 0 - 9
      * Symbols: ! @ # $ % ^ & * ( ) _ - + = < [ ] { } , . / ? \ | ' ` " ~
      * System: Escape (27), Space (32), Enter (13)

    Documentation about the keypress event:
    http://msdn.microsoft.com/en-us/library/ms536939(VS.85).aspx

    As of MSIE 4.0, the keydown event fires for the following keys:
      * Editing: Delete (46), Insert (45)
      * Function: F1 - F12
      * Letters: A - Z (uppercase and lowercase)
      * Navigation: Home, End, Left, Right, Up, Down
      * Numerals: 0 - 9
      * Symbols: ! @ # $ % ^ & * ( ) _ - + = < [ ] { } , . / ? \ | ' ` " ~
      * System: Escape (27), Space (32), Shift (16), Tab (9)

    As of MSIE 5, the event also fires for the following keys:
      * Editing: Backspace (8)
      * Navigation: PageUp (33), PageDown (34)
      * System: Shift+Tab (9)

    Documentation about the keydown event:
    http://msdn.microsoft.com/en-us/library/ms536938(VS.85).aspx

    As of MSIE 4.0, the keyup event fires for the following keys:
      * Editing: Delete, Insert
      * Function: F1 - F12
      * Letters: A - Z (uppercase and lowercase)
      * Navigation: Home (36), End (35), Left (37), Right (39), Up (38), Down (40)
      * Numerals: 0 - 9
      * Symbols: ! @ # $ % ^ & * ( ) _ - + = < [ ] { } , . / ? \ | ' ` " ~
      * System: Escape (27), Space (32), Shift (16), Tab (9)

    As of MSIE 5, the event also fires for the following keys:
      * Editing: Backspace (8)
      * Navigation: PageUp (33), PageDown (34)
      * System: Shift+Tab (9)

    Documentation about the keyup event:
    http://msdn.microsoft.com/en-us/library/ms536940(VS.85).aspx

    For further gory details and a different implementation see:
    http://code.google.com/p/doctype/source/browse/trunk/goog/events/keycodes.js
    http://code.google.com/p/doctype/source/browse/trunk/goog/events/keyhandler.js

    Opera keydown/keyup:
      These events fire for all keys, including for modifiers.
      keyCode is always set.
      charCode is never set.
      which is always set.
      keyIdentifier is always undefined.

    Opera keypress:
      This event fires for all keys, except for modifiers themselves.
      keyCode is always set.
      charCode is never set.
      which is set for all characters. which = 0 for several virtual keys.
      which is known to be set for: Backspace (8), Tab (9), Enter (13), Shift 
      (16), Control (17), Alt (18), Pause (19), Escape (27), End (35), Home 
      (36), Insert (45), Delete (46), NumLock (144).
      which is known to be unset for: F1 - F12, PageUp (33), PageDown (34), Left 
      (37), Up (38), Right (39), Down (40).
      keyIdentifier is always undefined.

    MSIE keyup/keypress/keydown:
      Event firing conditions are described above.
      keyCode is always set.
      charCode is never set.
      which is never set.
      keyIdentifier is always undefined.

    Webkit keydown/keyup:
      These events fires for all keys, including for modifiers.
      keyCode is always set.
      charCode is never set.
      which is always set.
      keyIdentifier is always set.

    Webkit keypress:
      This event fires for characters keys, similarly to MSIE (see above info).
      keyCode is always set.
      charCode is always set for all characters.
      which is always set.
      keyIdentifier is null.

    Gecko keydown/keyup:
      These events fire for all keys, including for modifiers.
      keyCode is always set.
      charCode is never set.
      which is always set.
      keyIdentifier is always undefined.

    Gecko keypress:
      This event fires for all keys, except for modifiers themselves.
      keyCode is only set for virtual keys, not for characters.
      charCode is always set for all characters.
      which is always set for all characters and for the Enter virtual key.
      keyIdentifier is always undefined.

    Another important difference between the KeyboardEventListener class and the 
    getKey() function is that the class tries to ensure that the keypress event 
    is fired for the handler, even if the Web browser does not do it natively.  
    Also, the class tries to provide a consistent approach to keyboard event 
    repetition when the user holds down a key for longer periods of time, by 
    repeating only the keypress event.

    On Linux, Opera, Firefox and Konqueror do not repeat the keydown event, only 
    keypress. On Windows, Opera, Firefox and MSIE do repeat the keydown and 
    keypress events while the user holds down the key. Webkit  repeats the 
    keydown and the keypress (when it fires) events on both systems.

    The default action can be prevented for during keydown in MSIE, and during 
    keypress for the other browsers. In Webkit when keypress doesn't fire, 
    keydown needs to be prevented.

    The KeyboardEventListener class tries to bring consistency. The keydown 
    event never repeats, only the keypress event repeats and it always fires for 
    all keys. The keypress event never fires for modifiers. Events should always 
    be prevented during keypress - the class deals with preventing the event 
    during keydown or keypress as needed in Webkit and MSIE.

    If no code/keyIdentifier is given by the browser, the getKey() function 
    returns null. In the case of the KeyboardEventListener class, keyCode_ 
    / key_ / charCode_ / char_ will be null or undefined.
   */

  /**
   * During a keyboard event flow, this holds the current key code, starting 
   * from the <code>keydown</code> event.
   *
   * @private
   * @type Number
   */
  var keyCode_ = null;

  /**
   * During a keyboard event flow, this holds the current key, starting from the 
   * <code>keydown</code> event.
   *
   * @private
   * @type String
   */
  var key_ = null;

  /**
   * During a keyboard event flow, this holds the current character code, 
   * starting from the <code>keypress</code> event.
   *
   * @private
   * @type Number
   */
  var charCode_ = null;

  /**
   * During a keyboard event flow, this holds the current character, starting 
   * from the <code>keypress</code> event.
   *
   * @private
   * @type String
   */
  var char_ = null;

  /**
   * True if the current keyboard event is repeating. This happens when the user 
   * holds down a key for longer periods of time.
   *
   * @private
   * @type Boolean
   */
  var repeat_ = false;


  if (!handlers_) {
    throw new TypeError('The first argument must be of type an object.');
  }

  if (!handlers_.keydown && !handlers_.keypress && !handlers_.keyup) {
    throw new TypeError('The provided handlers object has no keyboard event' +
        'handler.');
  }

  if (handlers_.keydown && typeof handlers_.keydown !== 'function') {
    throw new TypeError('The keydown event handler is not a function!');
  }
  if (handlers_.keypress && typeof handlers_.keypress !== 'function') {
    throw new TypeError('The keypress event handler is not a function!');
  }
  if (handlers_.keyup && typeof handlers_.keyup !== 'function') {
    throw new TypeError('The keyup event handler is not a function!');
  }

  /**
   * Attach the keyboard event listeners to the current DOM element.
   */
  this.attach = function () {
    keyCode_ = null;
    key_ = null;
    charCode_ = null;
    char_ = null;
    repeat_ = false;

    // FIXME: I have some ideas for a solution to the problem of having multiple 
    // event handlers like these attached to the same element. Somehow, only one 
    // should do all the needed work.

    elem_.addEventListener('keydown',  keydown,  false);
    elem_.addEventListener('keypress', keypress, false);
    elem_.addEventListener('keyup',    keyup,    false);
  };

  /**
   * Detach the keyboard event listeners from the current DOM element.
   */
  this.detach = function () {
    elem_.removeEventListener('keydown',  keydown,  false);
    elem_.removeEventListener('keypress', keypress, false);
    elem_.removeEventListener('keyup',    keyup,    false);

    keyCode_ = null;
    key_ = null;
    charCode_ = null;
    char_ = null;
    repeat_ = false;
  };

  /**
   * Dispatch an event.
   *
   * <p>This function simply invokes the handler for the event of the given 
   * <var>type</var>. The handler receives the <var>ev</var> event.
   *
   * @private
   * @param {String} type The event type to dispatch.
   * @param {Event} ev The DOM Event object to dispatch to the handler.
   */
  function dispatch (type, ev) {
    if (!handlers_[type]) {
      return;
    }

    var handler = handlers_[type];

    if (type === ev.type) {
      handler.call(elem_, ev);

    } else {
      // This happens when the keydown event tries to dispatch a keypress event.

      // FIXME: I could use createEvent() ... food for thought for later.

      /** @ignore */
      var ev_new = {};
      pwlib.extend(ev_new, ev);
      ev_new.type = type;

      // Make sure preventDefault() is not borked...
      /** @ignore */
      ev_new.preventDefault = function () {
        ev.preventDefault();
      };

      handler.call(elem_, ev_new);
    }
  };

  /**
   * The <code>keydown</code> event handler. This function determines the key 
   * pressed by the user, and checks if the <code>keypress</code> event will 
   * fire in the current Web browser, or not. If it does not, a synthetic 
   * <code>keypress</code> event will be fired.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function keydown (ev) {
    var prevKey = key_;

    charCode_ = null;
    char_ = null;

    findKeyCode(ev);

    ev.keyCode_ = keyCode_;
    ev.key_ = key_;
    ev.repeat_ = key_ && prevKey === key_ ? true : false;

    repeat_ = ev.repeat_;

    // When the user holds down a key for a longer period of time, the keypress 
    // event is generally repeated. However, in Webkit keydown is repeated (and 
    // keypress if it fires keypress for the key). As such, we do not dispatch 
    // the keydown event when a key event starts to be repeated.
    if (!repeat_) {
      dispatch('keydown', ev);
    }

    // MSIE and Webkit only fire the keypress event for characters 
    // (alpha-numeric and symbols).
    if (!isModifierKey(key_) && !firesKeyPress(ev)) {
      ev.type_ = 'keydown';
      keypress(ev);
    }
  };

  /**
   * The <code>keypress</code> event handler. This function determines the 
   * character generated by the keyboard event.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function keypress (ev) {
    // We reuse the keyCode_/key_ from the keydown event, because ev.keyCode 
    // generally holds the character code during the keypress event.
    // However, if keyCode_ is not available, try to determine the key for this 
    // event as well.
    if (!keyCode_) {
      findKeyCode(ev);
      repeat_ = false;
    }

    ev.keyCode_ = keyCode_;
    ev.key_ = key_;

    findCharCode(ev);

    ev.charCode_ = charCode_;
    ev.char_ = char_;

    // Any subsequent keypress event is considered a repeated keypress (the user 
    // is holding down the key).
    ev.repeat_ = repeat_;
    if (!repeat_) {
      repeat_ = true;
    }

    if (!isModifierKey(key_)) {
      dispatch('keypress', ev);
    }
  };

  /**
   * The <code>keyup</code> event handler.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function keyup (ev) {
    /*
     * Try to determine the keyCode_ for keyup again, even if we might already 
     * have it from keydown. This is needed because the user might press some 
     * key which only generates the keydown and keypress events, after which 
     * a sudden keyup event is fired for a completely different key.
     *
     * Example: in Opera press F2 then Escape. It will first generate two 
     * events, keydown and keypress, for the F2 key. When you press Escape to 
     * close the dialog box, the script receives keyup for Escape.
     */
    findKeyCode(ev);

    ev.keyCode_ = keyCode_;
    ev.key_ = key_;

    // Provide the character info from the keypress event in keyup as well.
    ev.charCode_ = charCode_;
    ev.char_ = char_;

    dispatch('keyup', ev);

    keyCode_ = null;
    key_ = null;
    charCode_ = null;
    char_ = null;
    repeat_ = false;
  };

  /**
   * Tells if the <var>key</var> is a modifier or not.
   *
   * @private
   * @param {String} key The key name.
   * @returns {Boolean} True if the <var>key</var> is a modifier, or false if 
   * not.
   */
  function isModifierKey (key) {
    switch (key) {
      case 'Shift':
      case 'Control':
      case 'Alt':
      case 'Meta':
      case 'Win':
        return true;
      default:
        return false;
    }
  };

  /**
   * Tells if the current Web browser will fire the <code>keypress</code> event 
   * for the current <code>keydown</code> event object.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   * @returns {Boolean} True if the Web browser will fire 
   * a <code>keypress</code> event, or false if not.
   */
  function firesKeyPress (ev) {
    // Gecko does not fire keypress for the Up/Down arrows when the target is an 
    // input element.
    if ((key_ === 'Up' || key_ === 'Down') && pwlib.browser.gecko && ev.target 
        && ev.target.tagName.toLowerCase() === 'input') {
      return false;
    }

    if (!pwlib.browser.msie && !pwlib.browser.webkit) {
      return true;
    }

    // Check if the key is a character key, or not.
    // If it's not a character, then keypress will not fire.
    // Known exceptions: keypress fires for Space, Enter and Escape in MSIE.
    if (key_ && key_ !== 'Space' && key_ !== 'Enter' && key_ !== 'Escape' && 
        key_.length !== 1) {
      return false;
    }

    // Webkit doesn't fire keypress for Escape as well ...
    if (pwlib.browser.webkit && key_ === 'Escape') {
      return false;
    }

    // MSIE does not fire keypress if you hold Control / Alt down, while Shift 
    // is off. Albeit, based on testing I am not completely sure if Shift needs 
    // to be down or not. Sometimes MSIE won't fire keypress even if I hold 
    // Shift down, and sometimes it does. Eh.
    if (pwlib.browser.msie && !ev.shiftKey && (ev.ctrlKey || ev.altKey)) {
      return false;
    }

    return true;
  };

  /**
   * Determine the key and the key code for the current DOM Event object. This 
   * function updates the <var>keyCode_</var> and the <var>key_</var> variables 
   * to hold the result.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function findKeyCode (ev) {
    /*
     * If the event has no keyCode/which/keyIdentifier values, then simply do 
     * not overwrite any existing keyCode_/key_.
     */
    if (ev.type === 'keyup' && !ev.keyCode && !ev.which && (!ev.keyIdentifier || 
          ev.keyIdentifier === 'Unidentified' || ev.keyIdentifier === 'U+0000')) {
      return;
    }

    keyCode_ = null;
    key_ = null;

    // Try to use keyCode/which.
    if (ev.keyCode || ev.which) {
      keyCode_ = ev.keyCode || ev.which;

      // Fix Webkit quirks
      if (pwlib.browser.webkit) {
        // Old Webkit gives keyCode 25 when Shift+Tab is used.
        if (keyCode_ == 25 && this.shiftKey) {
          keyCode_ = pwlib.dom.keyNames.Tab;
        } else if (keyCode_ >= 63232 && keyCode_ in pwlib.dom.keyCodes_Safari2) {
          // Old Webkit gives wrong values for several keys.
          keyCode_ = pwlib.dom.keyCodes_Safari2[keyCode_];
        }
      }

      // Fix keyCode quirks in all browsers.
      if (keyCode_ in pwlib.dom.keyCodes_fixes) {
        keyCode_ = pwlib.dom.keyCodes_fixes[keyCode_];
      }

      key_ = pwlib.dom.keyCodes[keyCode_] || String.fromCharCode(keyCode_);

      return;
    }

    // Try to use ev.keyIdentifier. This is only available in Webkit and 
    // Konqueror 4, each having some quirks. Sometimes the property is needed, 
    // because keyCode/which are not always available.

    var key = null,
        keyCode = null,
        id = ev.keyIdentifier;

    if (!id || id === 'Unidentified' || id === 'U+0000') {
      return;
    }

    if (id.substr(0, 2) === 'U+') {
      // Webkit gives character codes using the 'U+XXXX' notation, as per spec.
      keyCode = parseInt(id.substr(2), 16);

    } else if (id.length === 1) {
      // Konqueror 4 implements keyIdentifier, and they provide the Unicode 
      // character directly, instead of using the 'U+XXXX' notation.
      keyCode = id.charCodeAt(0);
      key = id;

    } else {
      /*
       * Common keyIdentifiers like 'PageDown' are used as they are.
       * We determine the common keyCode used by Web browsers, from the 
       * pwlib.dom.keyNames object.
       */
      keyCode_ = pwlib.dom.keyNames[id] || null;
      key_ = id;

      return;
    }

    // Some keyIdentifiers like 'U+007F' (127: Delete) need to become key names.
    if (keyCode in pwlib.dom.keyCodes && (keyCode <= 32 || keyCode == 127 || 
          keyCode == 144)) {
      key_ = pwlib.dom.keyCodes[keyCode];
    } else {
      if (!key) {
        key = String.fromCharCode(keyCode);
      }

      // Konqueror gives lower-case chars
      key_ = key.toUpperCase();
      if (key !== key_) {
        keyCode = key_.charCodeAt(0);
      }
    }

    // Correct the keyCode, make sure it's a common keyCode, not the Unicode 
    // decimal representation of the character.
    if (key_ === 'Delete' || key_.length === 1 && key_ in pwlib.dom.keyNames) {
      keyCode = pwlib.dom.keyNames[key_];
    }

    keyCode_ = keyCode;
  };

  /**
   * Determine the character and the character code for the current DOM Event 
   * object. This function updates the <var>charCode_</var> and the 
   * <var>char_</var> variables to hold the result.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function findCharCode (ev) {
    charCode_ = null;
    char_ = null;

    // Webkit and Gecko implement ev.charCode.
    if (ev.charCode) {
      charCode_ = ev.charCode;
      char_ = String.fromCharCode(ev.charCode);

      return;
    }

    // Try the keyCode mess.
    if (ev.keyCode || ev.which) {
      var keyCode = ev.keyCode || ev.which;

      var force = false;

      // We accept some keyCodes.
      switch (keyCode) {
        case pwlib.dom.keyNames.Tab:
        case pwlib.dom.keyNames.Enter:
        case pwlib.dom.keyNames.Space:
          force = true;
      }

      // Do not consider the keyCode a character code, if during the keydown 
      // event it was determined the key does not generate a character, unless 
      // it's Tab, Enter or Space.
      if (!force && key_ && key_.length !== 1) {
        return;
      }

      // If the keypress event at hand is synthetically dispatched by keydown, 
      // then special treatment is needed. This happens only in Webkit and MSIE.
      if (ev.type_ === 'keydown') {
        var key = pwlib.dom.keyCodes[keyCode];
        // Check if the keyCode points to a single character.
        // If it does, use it.
        if (key && key.length === 1) {
          charCode_ = key.charCodeAt(0); // keyCodes != charCodes
          char_ = key;
        }
      } else if (keyCode >= 32 || force) {
        // For normal keypress events, we are done.
        charCode_ = keyCode;
        char_ = String.fromCharCode(keyCode);
      }

      if (charCode_) {
        return;
      }
    }

    /*
     * Webkit and Konqueror do not provide a keyIdentifier in the keypress 
     * event, as per spec. However, in the unlikely case when the keyCode is 
     * missing, and the keyIdentifier is available, we use it.
     *
     * This property might be used when a synthetic keypress event is generated 
     * by the keydown event, and keyCode/charCode/which are all not available.
     */

    var c = null,
        charCode = null,
        id = ev.keyIdentifier;

    if (id && id !== 'Unidentified' && id !== 'U+0000' &&
        (id.substr(0, 2) === 'U+' || id.length === 1)) {

      // Characters in Konqueror...
      if (id.length === 1) {
        charCode = id.charCodeAt(0);
        c = id;

      } else {
        // Webkit uses the 'U+XXXX' notation as per spec.
        charCode = parseInt(id.substr(2), 16);
      }

      if (charCode == pwlib.dom.keyNames.Tab ||
          charCode == pwlib.dom.keyNames.Enter ||
          charCode >= 32 && charCode != 127 &&
          charCode != pwlib.dom.keyNames.NumLock) {

        charCode_ = charCode;
        char_ = c || String.fromCharCode(charCode);

        return;
      }
    }

    // Try to use the key determined from the previous keydown event, if it 
    // holds a character.
    if (key_ && key_.length === 1) {
      charCode_ = key_.charCodeAt(0);
      char_ = key_;
    }
  };

  this.attach();
};

// Check out the libmacrame project: http://code.google.com/p/libmacrame.

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

