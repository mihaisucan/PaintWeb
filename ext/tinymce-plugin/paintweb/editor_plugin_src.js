/*
 * Copyright (C) 2009, 2010 Mihai Şucan
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
 * $Date: 2010-06-26 22:10:30 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview This is a plugin for TinyMCE which integrates PaintWeb.
 */

(function() {
// The plugin URL. This points to the location of this TinyMCE plugin.
var pluginUrl = null;

// Reference to the DOM element of the overlay button displayed on top of the 
// selected image.
var overlayButton = null;

// Reference to the PaintWeb configuration object.
var paintwebConfig = null;

// Reference to the current PaintWeb instance object.
var paintwebInstance = null;

// Reference to the TinyMCE "plugin bar" displayed above PaintWeb, when PaintWeb 
// is displayed. This "plugin bar" allows the user to save/cancel image edits.
var pluginBar = null;

// The delay used for displaying temporary messages in the plugin bar.
var pluginBarDelay = 10000; // 10 seconds

// The timeout ID used for the plugin bar when a temporary message is displayed.
var pluginBarTimeout = null;

// Once PaintWeb is closed, the instance remains active. This value controls how 
// long the PaintWeb instance is kept alive. Once the time elapsed, the PaintWeb 
// instance is destroyed entirely.
var pwDestroyDelay = 30000; // 30 seconds

// The timeout ID used for destroying the PaintWeb instance.
var pwDestroyTimer = null;

// Tells if the user intends to save the image and return to TinyMCE or not.  
// This value is set to true when the user clicks the "Save" button in the 
// plugin bar.
var pwSaveReturn = false;

// Reference to the container of the current TinyMCE editor instance.
var targetContainer = null;

// The current TinyMCE editor instance.
var targetEditor = null;

// Reference to the image element being edited.
var targetImage = null;

// Tells if the image being edited uses a data URL or not.
var imgIsDataURL = false;

// The new image URL. Once the user saves the image, the remote server might 
// require a change for the image URL.
var imgNewUrl = null;

// Tells if the current image has been ever updated using "image save".
var imgSaved = false;

var pwlib = null;

if (!window.tinymce) {
  alert('It looks like the PaintWeb plugin for TinyMCE cannot run.' +
    'TinyMCE was not detected!');
  return;
}

// Basic functionality used by PaintWeb.
if (!window.XMLHttpRequest || !document.createElement('canvas').getContext) {
  return;
}

if (!window.getComputedStyle) {
  try {
    if (!window.getComputedStyle(document.createElement('div'), null)) {
      return;
    }
  } catch (err) {
    return;
  }
}

var isOpera, isWebkit, isGecko;

// Image data URLs are considered external resources when they are drawn in 
// a Canvas element. This happens only in Gecko 1.9.0 or older (Firefox 3.0) and  
// in Webkit (Chrome/Safari). This is a problem because PaintWeb cannot save the 
// image once such data URL is loaded.
var dataURLfilterNeeded = (function () {
  var ua   = navigator.userAgent.toLowerCase();
  isOpera  = window.opera || /\b(opera|presto)\b/.test(ua);
  isWebkit = !isOpera && /\b(applewebkit|webkit)\b/.test(ua);
  isGecko  = !isOpera && !isWebkit && /\bgecko\b/.test(ua);

  if (isWebkit) {
    return true;
  }

  if (isGecko) {
    var geckoRev = /\brv\:([^;\)\s]+)[;\)\s]/.exec(ua);
    if (geckoRev && geckoRev[1]) {
      geckoRev = geckoRev[1].replace(/[^\d]+$/, '').split('.');
      if (geckoRev[0] == 1 && geckoRev[1] <= 9 && geckoRev[2] < 1) {
        return true;
      }
    }
  }

  return false;
})();

/**
 * Load PaintWeb. This function tells TinyMCE to load the PaintWeb script.
 */
function paintwebLoad () {
  if (window.PaintWeb) {
    paintwebLoaded();
    return;
  }

  var config = targetEditor.getParam('paintweb_config'),
      src    = config.tinymce.paintwebFolder + 'paintweb.js';

  tinymce.ScriptLoader.load(src, paintwebLoaded);
};

/**
 * The event handler for the PaintWeb script load. This function creates a new 
 * instance of PaintWeb and configures it.
 */
function paintwebLoaded () {
  if (paintwebInstance) {
    return;
  }

  paintwebInstance = new PaintWeb();
  paintwebConfig   = paintwebInstance.config;

  var config      = targetEditor.getParam('paintweb_config'),
      textarea    = targetEditor.getElement();
      pNode       = targetContainer.parentNode,
      pwContainer = tinymce.DOM.create('div');

  pNode.insertBefore(pwContainer, textarea.nextSibling);

  if (!PaintWeb.baseFolder) {
    PaintWeb.baseFolder = config.tinymce.paintwebFolder;
  }

  config.imageLoad      = targetImage;
  config.guiPlaceholder = pwContainer;

  if (!config.lang) {
    config.lang = targetEditor.getParam('language');
  }

  for (var prop in config) {
    paintwebConfig[prop] = config[prop];
  }

  // Give PaintWeb access to the TinyMCE editor instance.
  paintwebConfig.tinymceEditor = targetEditor;

  paintwebInstance.init(paintwebInitialized);
};

/**
 * The initialization event handler for PaintWeb. When PaintWeb is initialized 
 * this method configures the PaintWeb instance to work properly. A bar 
 * representing the plugin is also added, to let the user save/cancel image 
 * edits.
 *
 * @param {pwlib.appEvent.appInit} ev The PaintWeb application event object.
 */
function paintwebInitialized (ev) {
  if (overlayButton && targetEditor) {
    overlayButton.value = targetEditor.getLang('paintweb.overlayButton', 
        'Edit');
  }

  if (ev.state !== PaintWeb.INIT_DONE) {
    alert('PaintWeb initialization failed! ' + ev.errorMessage);
    paintwebInstance = null;
    targetImage = null;
    targetEditor = null;

    return;
  }

  pwlib = window.pwlib;
  paintwebInstance.events.add('imageSave',       paintwebSave);
  paintwebInstance.events.add('imageSaveResult', paintwebSaveResult);

  if (pluginBar) {
    paintwebInstance.events.add('viewportSizeChange', 
        paintwebViewportSizeChange);
  }

  paintwebShow(ev);
};

/**
 * The <code>click</code> event handler for the Save button displayed on the 
 * plugin bar.
 */
function pluginSaveButton () {
  pwSaveReturn = true;
  paintwebInstance.imageSave();
};

/**
 * The <code>click</code> event handler for the Cancel button displayed on the 
 * plugin bar.
 */
function pluginCancelButton () {
  paintwebHide();
};

/**
 * The <code>imageSave</code> application event handler for PaintWeb. When the 
 * user elects to save the image in PaintWeb, this function is invoked to 
 * provide visual feedback in the plugin bar.
 * 
 * <p>If the <var>imageSaveDataURL</var> boolean property is set to true, then 
 * the source of the image is also updated to hold the new data URL.
 *
 * @param {pwlib.appEvent.imageSave} ev The PaintWeb application event object.
 */
function paintwebSave (ev) {
  if (paintwebConfig.tinymce.imageSaveDataURL) {
    ev.preventDefault();

    var url = imgIsDataURL ? '-' : targetEditor.dom.getAttrib(targetImage, 
        'src');

    paintwebInstance.events.dispatch(new pwlib.appEvent.imageSaveResult(true, 
          url, ev.dataURL));

  } else if (pluginBar) {
    if (pluginBarTimeout) {
      clearTimeout(pluginBarTimeout);
      pluginBarTimeout = null;
    }

    pluginBar.firstChild.innerHTML 
      = targetEditor.getLang('paintweb.statusSavingImage', 'Saving image...');
  }
};

/**
 * The <code>imageSaveResult</code> application event handler for PaintWeb.
 *
 * @param {pwlib.appEvent.imageSaveResult} ev The PaintWeb application event 
 * object.
 */
function paintwebSaveResult (ev) {
  if (!targetImage) {
    return;
  }

  // Update the status message in the "plugin bar".
  if (pluginBar) {
    if (ev.successful) {
      pluginBar.firstChild.innerHTML 
        = targetEditor.getLang('paintweb.statusImageSaved',
            'Image save was succesful!');
    } else {
      pluginBar.firstChild.innerHTML 
        = targetEditor.getLang('paintweb.statusImageSaveFailed',
            'Image save failed!');
    }

    if (pluginBarTimeout) {
      clearTimeout(pluginBarTimeout);
    }

    pluginBarTimeout = setTimeout(pluginBarResetContent, pluginBarDelay);
  }

  if (ev.successful) {
    imgSaved = true;

    if (ev.urlNew) {
      // store the new URL. When PaintWeb is closed, the image src attribute is 
      // updated.
      imgNewUrl = ev.urlNew;
    }

    if (pwSaveReturn) {
      pwSaveReturn = false;
      paintwebHide();
    }
  }
};

/**
 * Reset the text content of the plugin bar.
 */
function pluginBarResetContent () {
  if (!pluginBar) {
    return;
  }

  pluginBarTimeout = null;

  pluginBar.firstChild.innerHTML 
    = targetEditor.getLang('paintweb.statusImageEditing',
        'You are editing an image from TinyMCE.');
};

/**
 * The <code>viewportSizeChange</code> PaintWeb application event handler. This 
 * synchronises the size of the TinyMCE plugin bar with that of the PaintWeb 
 * GUI.
 *
 * @param {pwlib.appEvent.viewportSizeChange} ev The application event object.
 */
function paintwebViewportSizeChange (ev) {
  tinymce.DOM.setStyle(pluginBar, 'width', ev.width);
};

/**
 * Start PaintWeb. This function performs the actual PaintWeb invocation.
 *
 * @returns {Boolean} True PaintWeb is about to start, or false otherwise.
 */
function paintwebEditStart () {
  if (!checkEditableImage(targetImage)) {
    targetImage = null;
    return false;
  }

  if (pwDestroyTimer) {
    clearTimeout(pwDestroyTimer);
    pwDestroyTimer = null;
  }

  var pwStart = function () {
    if (overlayButton && overlayButton.parentNode) {
      overlayButton.value = targetEditor.getLang('paintweb.overlayLoading', 
          'Loading PaintWeb...');
    }

    if (paintwebInstance) {
      paintwebInstance.imageLoad(targetImage);
      paintwebShow();
    } else {
      paintwebLoad();
    }
  };

  var dataURLfilterLoaded = function () {
    tinymce.dom.Event.remove(targetImage, 'load', dataURLfilterLoaded);
    imgIsDataURL = false;
    pwStart();
  };

  var src = targetEditor.dom.getAttrib(targetImage, 'src');

  if (src.substr(0, 5) === 'data:') {
    imgIsDataURL = true;
  } else {
    imgIsDataURL = false;
  }

  var cfg = imgIsDataURL && dataURLfilterNeeded ?
              targetEditor.getParam('paintweb_config') : null;

  if (cfg && cfg.tinymce.imageDataURLfilter) {
    tinymce.util.XHR.send({
      url: cfg.tinymce.imageDataURLfilter,
      content_type: 'application/x-www-form-urlencoded',
      data: 'url=-&dataURL=' + encodeURIComponent(src),

      error: function () {
        if (window.console && console.log) {
          console.log('TinyMCE.PaintWeb: failed to preload image data URL!');
        }
        pwStart();
      },

      success: function (result) {
        if (!result) {
          pwStart();
          return;
        }

        result = tinymce.util.JSON.parse(result);
        if (!result || !result.successful || !result.urlNew) {
          pwStart();
          return;
        }

        imgNewUrl = targetImage.src;
        tinymce.dom.Event.add(targetImage, 'load', dataURLfilterLoaded);
        targetEditor.dom.setAttrib(targetImage, 'src', result.urlNew);
      }
    });

  } else {
    pwStart();
  }

  src = null;

  return true;
};

/**
 * Create a new image and start PaintWeb.
 *
 * @param {Number} width The image width.
 * @param {Number} height The image height.
 * @param {String} [bgrColor] The image background color.
 * @param {String} [alt] The alternative text / the value for the "alt" 
 * attribute.
 * @param {String} [title]
 */
function paintwebNewImage (width, height, bgrColor, alt, title) {
  width  = parseInt(width) || 0;
  height = parseInt(height) || 0;
  if (!width || !height) {
    return;
  }

  var canvas  = tinymce.DOM.create('canvas', {
                  'width':  width,
                  'height': height}),
      context = canvas.getContext('2d');

  if (bgrColor) {
    context.fillStyle = bgrColor;
    context.fillRect(0, 0, width, height);
  }

  targetEditor.execCommand('mceInsertContent', false,
      '<img id="paintwebNewImage">');

  var elem = targetEditor.dom.get('paintwebNewImage');
  if (!elem || elem.id !== 'paintwebNewImage' || elem.nodeName.toLowerCase() !== 
      'img') {
    return;
  }

  if (alt) {
    targetEditor.dom.setAttrib(elem, 'alt', alt);
  }
  if (title) {
    targetEditor.dom.setAttrib(elem, 'title', title);
  }
  elem.src = canvas.toDataURL();
  elem.setAttribute('mce_src', elem.src);
  elem.removeAttribute('id');

  targetImage = elem;
  canvas      = null;
  context     = null;

  paintwebEditStart();
};

/**
 * Show PaintWeb on-screen. This function hides the current TinyMCE editor 
 * instance and shows up the PaintWeb instance.
 *
 * @param [ev] Event object.
 */
function paintwebShow (ev) {
  var rect = null;
  if (paintwebConfig.tinymce.syncViewportSize) {
    rect = tinymce.DOM.getRect(targetEditor.getContentAreaContainer());
  }

  tinymce.DOM.setStyle(targetContainer, 'display', 'none');

  // Give PaintWeb access to the TinyMCE editor instance.
  paintwebConfig.tinymceEditor = targetEditor;
  if (!ev || ev.type !== 'appInit') {
    paintwebInstance.gui.show();
  }

  if (rect && rect.w && rect.h) {
    paintwebInstance.gui.resizeTo(rect.w + 'px', rect.h + 'px');
  }

  if (pluginBar) {
    pluginBarResetContent();

    var placeholder = paintwebConfig.guiPlaceholder;
    if (!pluginBar.parentNode) {
      placeholder.parentNode.insertBefore(pluginBar, placeholder);
    }
  }
};

/**
 * Hide PaintWeb from the screen. This hides the PaintWeb target object of the 
 * current instance, and displays back the TinyMCE container element.
 */
function paintwebHide () {
  paintwebInstance.gui.hide();

  if (overlayButton && targetEditor) {
    overlayButton.value = targetEditor.getLang('paintweb.overlayButton', 
        'Edit');
  }

  if (pluginBar && pluginBar.parentNode) {
    targetContainer.parentNode.removeChild(pluginBar);
  }

  // Update the target image src attribute if needed.
  if (imgNewUrl) {
    // The tinymce.utl.URI class mangles data URLs.
    if (imgNewUrl.substr(0, 5) !== 'data:') {
      targetEditor.dom.setAttrib(targetImage, 'src', imgNewUrl);
    } else {
      targetImage.src = imgNewUrl;
      if (targetImage.hasAttribute('mce_src')) {
        targetImage.setAttribute('mce_src', imgNewUrl);
      }
    }

    imgNewUrl = null;

  } else if (!imgIsDataURL && imgSaved) {
    // Force a refresh for the target image from the server.

    var src = targetEditor.dom.getAttrib(targetImage, 'src'),
        rnd = (new Date()).getMilliseconds() * Math.round(Math.random() * 100);

    if (src.indexOf('?') === -1) {
      src += '?' + rnd;
    } else {
      if (/\?[0-9]+$/.test(src)) {
        src = src.replace(/\?[0-9]+$/, '?' + rnd);
      } else if (/&[0-9]+$/.test(src)) {
        src = src.replace(/&[0-9]+$/, '&' + rnd);
      } else {
        src += '&' + rnd;
      }
    }

    targetEditor.dom.setAttrib(targetImage, 'src', src);
  }

  targetContainer.style.display = '';
  targetImage = null;
  imgSaved = false;

  targetEditor.focus();

  if (!pwDestroyTimer) {
    pwDestroyTimer = setTimeout(paintwebDestroy, pwDestroyDelay);
  }
};

/**
 * After a given time of idleness, when the user stops from working with 
 * PaintWeb, we destroy the current PaintWeb instance, to release some memory.
 */
function paintwebDestroy () {
  if (paintwebInstance) {
    paintwebInstance.destroy();

    var pNode = paintwebConfig.guiPlaceholder.parentNode;
    pNode.removeChild(paintwebConfig.guiPlaceholder);

    paintwebInstance = null;
    paintwebConfig = null;
    pwDestroyTimer = null;
  }
};

/**
 * The "paintwebEdit" command. This function is invoked when the user clicks the 
 * PaintWeb button on the toolbar.
 */
function paintwebEditCommand () {
  if (targetImage) {
    return;
  }

  var n = this.selection.getNode(),
      tag = n.nodeName.toLowerCase();

  if (tag !== 'img' && overlayButton && overlayButton.parentNode && 
      overlayButton._targetImage) {
    n = overlayButton._targetImage;
    tag = n.nodeName.toLowerCase();
  }

  targetEditor    = this;
  targetContainer = this.getContainer();
  targetImage     = n;

  // If PaintWeb won't start, then we create a new image.
  if (!paintwebEditStart() && tag !== 'img') {
    this.windowManager.open(
      {
        file:   pluginUrl + '/newimage.html',
        width:  350 + parseInt(this.getLang('paintweb.dlg_delta_width',  0)),
        height: 200 + parseInt(this.getLang('paintweb.dlg_delta_height', 0)),
        inline: 1
      },
      {
        plugin_url: pluginUrl,
        newImageFn: paintwebNewImage
      }
    );
  }
};

/**
 * Check if an image element can be edited with PaintWeb. The image element 
 * source must be a data URI or it must be an image from the same domain as 
 * the page.
 *
 * @param {HTMLImageElement} n The image element.
 * @returns {Boolean} True if the image can be edited, or false otherwise.
 */
function checkEditableImage (n) {
  if (!n) {
    return false;
  }

  var url = n.src;
  if (n.nodeName.toLowerCase() !== 'img' || !url) {
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

  var host = url.replace(/^https?:\/\//i, '');
  pos = host.indexOf('/');
  if (pos > -1) {
    host = host.substr(0, pos);
  }

  if (host !== window.location.host) {
    return false;
  }

  return true;
};

/**
 * Add the overlay button to an image element node.
 *
 * @param {tinymce.Editor} ed The TinyMCE editor instance.
 * @param {Element} n The image element node you want to add to the overlay 
 * button.
 */
function overlayButtonAdd (ed, n) {
  if (!overlayButton || !ed || !n) {
    return;
  }

  var offsetTop  = 5,
      offsetLeft = 5,
      sibling    = null,
      pNode;

  // Try to avoid adding the overlay button inside an anchor.
  if (n.parentNode.nodeName.toLowerCase() === 'a') {
    pNode   = n.parentNode.parentNode;
    sibling = n.parentNode.nextSibling;
  } else {
    pNode   = n.parentNode;
    sibling = n.nextSibling;
  }

  overlayButton._targetImage = n;

  ed.dom.setStyles(overlayButton, {
     'top':  (n.offsetTop  + offsetTop)  + 'px',
     'left': (n.offsetLeft + offsetLeft) + 'px'});

  overlayButton.value = ed.getLang('paintweb.overlayButton', 'Edit');
  pNode.insertBefore(overlayButton, sibling);
};

/**
 * Clear the document of the TinyMCE editor instance of any possible PaintWeb 
 * overlay button remnant. This makes sure that the iframe DOM document does not 
 * contain any PaintWeb overlay button. Firefox remembers the overlay button 
 * after a page refresh.
 *
 * @param {tinymce.Editor} ed The editor instance that the plugin is 
 * initialized in.
 */
function overlayButtonCleanup (ed) {
  if (!overlayButton || !ed || !ed.getDoc) {
    return;
  }

  var root, elems, pNode;

  if (overlayButton) {
    if (overlayButton.parentNode) {
      pNode = overlayButton.parentNode;
      pNode.removeChild(overlayButton);
    }

    overlayButton._targetImage = null;
  }

  root = ed.getDoc();
  if (!root || !root.getElementsByClassName) {
    return;
  }

  elems = root.getElementsByClassName(overlayButton.className);

  for (var i = 0; i < elems.length; i++) {
    pNode = elems[i].parentNode;
    pNode.removeChild(elems[i]);
  }
};

// Load plugin specific language pack
tinymce.PluginManager.requireLangPack('paintweb');

tinymce.create('tinymce.plugins.paintweb', {
  /**
   * Initializes the plugin. This method sets-up the current editor instance, by 
   * adding a new button, <var>paintwebEdit</var>, and by setting up several 
   * event listeners.
   *
   * @param {tinymce.Editor} ed Editor instance that the plugin is initialized 
   * in.
   * @param {String} url Absolute URL to where the plugin is located.
   */
  init: function (ed, url) {
    var t = this;

    pluginUrl = url;

    // Register the command so that it can be invoked by using 
    // tinyMCE.activeEditor.execCommand('paintwebEdit');
    ed.addCommand('paintwebEdit', paintwebEditCommand, ed);

    // Register PaintWeb button
    ed.addButton('paintwebEdit', {
      title: 'paintweb.toolbarButton',
      cmd:   'paintwebEdit',
      image: pluginUrl + '/img/paintweb2.gif'
    });

    // Add a node change handler which enables the PaintWeb button in the UI 
    // when an image is selected.
    if (isOpera) {
      // In Opera, due to bug DSK-265135, we only listen for the keyup and 
      // mouseup events.
      ed.onKeyUp.add(this.edNodeChange);
      ed.onMouseUp.add(this.edNodeChange);
    } else {
      ed.onNodeChange.add(this.edNodeChange);
    }

    var config = ed.getParam('paintweb_config') || {};
    if (!config.tinymce) {
      config.tinymce = {};
    }

    // Integrate into the ContextMenu plugin if the user desires so.
    if (config.tinymce.contextMenuItem && ed.plugins.contextmenu) {
      ed.plugins.contextmenu.onContextMenu.add(this.pluginContextMenu);
    }

    // Listen for the form submission event. This is needed when the user is 
    // inside PaintWeb, editing an image. The user is warned that image changed 
    // and it's not saved, and the form submission event is cancelled.
    ed.onSubmit.add(this.edSubmit);

    // Create the overlay button element if the configuration allows so.
    if (config.tinymce.overlayButton) {
      // Make sure the button doesn't show up in the article.
      ed.onBeforeGetContent.add(overlayButtonCleanup);

      ed.onInit.add(function (ed) {
        // Cleanup after initialization. Firefox remembers the content between 
        // page reloads.
        overlayButtonCleanup(ed);

        ed.onKeyDown.addToTop(t.overlayButtonEvent);
        ed.onMouseDown.addToTop(t.overlayButtonEvent);
      });

      overlayButton = tinymce.DOM.create('input', {
          'type':  'button',
          'class': 'paintweb_tinymce_overlayButton',
          'style': 'position:absolute',
          'value': ed.getLang('paintweb.overlayButton', 'Edit')});
    }

    // Handle the dblclick events for image elements, if the user wants it.
    if (config.tinymce.dblclickHandler) {
      ed.onDblClick.add(this.edDblClick);
    }

    // Add a "plugin bar" above the PaintWeb editor, when PaintWeb is active.  
    // This bar shows the image file name being edited, and provides two buttons 
    // for image save and for cancelling any image edits.
    if (config.tinymce.pluginBar) {
      pluginBar = tinymce.DOM.create('div', {
          'class': 'paintweb_tinymce_status',
          'style': 'display:none'});

      var saveBtn  = tinymce.DOM.create('input', {
          'type':  'button',
          'class': 'paintweb_tinymce_save',
          'title': ed.getLang('paintweb.imageSaveButtonTitle',
                     'Save the image and return to TinyMCE.'),
          'value': ed.getLang('paintweb.imageSaveButton', 'Save')});

      saveBtn.addEventListener('click', pluginSaveButton, false);

      var cancelBtn = tinymce.DOM.create('input', {
          'type':  'button',
          'class': 'paintweb_tinymce_cancel',
          'title': ed.getLang('paintweb.cancelEditButtonTitle',
                     'Cancel image edits and return to TinyMCE.'),
          'value': ed.getLang('paintweb.cancelEditButton', 'Cancel')});

      cancelBtn.addEventListener('click', pluginCancelButton, false);

      var textSpan = tinymce.DOM.create('span');

      pluginBar.appendChild(textSpan);
      pluginBar.appendChild(saveBtn);
      pluginBar.appendChild(cancelBtn);
    }
  },

  /**
   * The <code>nodeChange</code> event handler for the TinyMCE editor. This 
   * method provides visual feedback for editable image elements.
   *
   * @private
   *
   * @param {tinymce.Editor} ed The editor instance that the plugin is 
   * initialized in.
   */
  edNodeChange: function (ed) {
    var cm = ed.controlManager,
        n = ed.selection.getNode();

    // Do not do anything inside the overlay button.
    if (!n || overlayButton && overlayButton._targetImage && n && n.className 
        === overlayButton.className) {
      return;
    }

    var disabled = !checkEditableImage(n);

    if (n.nodeName.toLowerCase() === 'img' && disabled) {
      cm.setDisabled('paintwebEdit', true);
      cm.setActive('paintwebEdit', false);
    } else {
      cm.setDisabled('paintwebEdit', false);
      cm.setActive('paintwebEdit', !disabled);
    }

    if (!overlayButton) {
      return;
    }

    if (!disabled) {
      overlayButtonAdd(ed, n);
    } else if (overlayButton._targetImage) {
      overlayButton._targetImage = null;
    }
  },

  /**
   * The <code>mousedown</code> and <code>keydown</code> event handler for the 
   * editor. This method starts PaintWeb when the user clicks the "Edit" overlay 
   * button, or cleans the document of any overlay button element.
   *
   * @param {tinymce.Editor} ed The TinyMCE editor instance.
   * @param {Event} ev The DOM Event object.
   */
  overlayButtonEvent: function (ed, ev) {
    var n = ev.type === 'mousedown' ? ev.target : ed.selection.getNode();

    // If the user clicked the Edit overlay button, then we consider the user 
    // wants to start PaintWeb.
    if (!targetImage && ev.type === 'mousedown' && overlayButton && n && 
        n.className === overlayButton.className && overlayButton._targetImage) {
      targetEditor = ed;
      targetContainer = ed.getContainer();
      targetImage = overlayButton._targetImage;

      paintwebEditStart();

    } else if (n && n.nodeName.toLowerCase() !== 'img') {
      // ... otherwise make sure the document is clean.
      overlayButtonCleanup(ed);
    }
  },

  /**
   * The <code>dblclick</code> event handler for the editor. This method starts 
   * PaintWeb when the user double clicks an editable image element.
   *
   * @param {tinymce.Editor} ed The TinyMCE editor instance.
   * @param {Event} ev The DOM Event object.
   */
  edDblClick: function (ed, ev) {
    if (!targetImage && checkEditableImage(ev.target)) {
      targetEditor = ed;
      targetContainer = ed.getContainer();
      targetImage = ev.target;
      ev.target.focus();

      paintwebEditStart();
    }
  },

  /**
   * The <code>submit</code> event handler for the form associated to the 
   * textarea of the current TinyMCE editor instance. This method checks if the 
   * current PaintWeb instance is open and if the user has made changes to the 
   * image. If yes, then the form submission is cancelled and the user is warned 
   * about losing unsaved changes.
   *
   * @param {tinymce.Editor} ed The TinyMCE editor instance.
   * @param {Event} ev The DOM Event object.
   */
  edSubmit: function (ed, ev) {
    // Check if PaintWeb is active.
    if (!targetImage || !paintwebInstance) {
      return;
    }

    // Check if the image has been modified.
    if (!paintwebInstance.image.modified) {
      // If not, then hide PaintWeb so we can update the target image.
      paintwebHide();
      // Save the textarea content once again.
      ed.save();
      return;
    }

    // The image is not saved, thus we prevent form submission.
    ev.preventDefault();

    if (pluginBar) {
      var str = ed.getLang('paintweb.submitUnsaved',
            'The image is not saved! You cannot submit the form. Please save ' +
            'the image changes, or cancel image editing, then try again.');
      pluginBar.firstChild.innerHTML = str;

      if (pluginBarTimeout) {
        clearTimeout(pluginBarTimeout);
      }

      pluginBarTimeout = setTimeout(pluginBarResetContent, pluginBarDelay);

      // tabIndex is needed so we can focus and scroll to the plugin bar.
      pluginBar.tabIndex = 5;
      pluginBar.focus();
      pluginBar.tabIndex = -1;
    }

    if (typeof paintwebConfig.tinymce.onSubmitUnsaved === 'function') {
      paintwebConfig.tinymce.onSubmitUnsaved(ev, ed, paintwebInstance);
    }
  },

  /**
   * This is the <code>contextmenu</code> event handler for the ContextMenu 
   * plugin provided in the default TinyMCE installation.
   *
   * @param {tinymce.plugin.contextmenu} plugin Instance of the ContextMenu 
   * plugin of TinyMCE.
   * @param {tinymce.ui.DropMenu} menu The dropmenu instance.
   * @param {Element} elem The selected element.
   */
  pluginContextMenu: function (plugin, menu, elem) {
    if (checkEditableImage(elem)) {
      menu.add({
        title: 'paintweb.contextMenuEdit',
        cmd:   'paintwebEdit',
        image: pluginUrl + '/img/paintweb2.gif'
      });
    }
  },

  /**
   * Returns information about the plugin as a name/value array.
   * The current keys are longname, author, authorurl, infourl and version.
   *
   * @returns {Object} Name/value array containing information about the plugin.
   */
  getInfo: function () {
    return {
      longname:  'PaintWeb - online painting application',
      author:    'Mihai Şucan',
      authorurl: 'http://www.robodesign.ro/mihai',
      infourl:   'http://code.google.com/p/paintweb',
      version:   '0.9'
    };
  }
});

// Register the PaintWeb plugin
tinymce.PluginManager.add('paintweb', tinymce.plugins.paintweb);
})();

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

