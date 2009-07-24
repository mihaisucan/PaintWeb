/*
 * Copyright (C) 2009 Mihai Şucan
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
 * $Date: 2009-07-24 21:53:23 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview This is a plugin for TinyMCE which integrates PaintWeb.
 */

(function() {
var overlayButton = null,
    paintwebConfig = null,
    paintwebInstance = null,
    pluginBar = null,
    pluginBarDelay = 5000, // 5 seconds
    pluginBarTimeout = null,
    pwDestroyDelay = 30000, // 30 seconds
    pwDestroyTimer = null,
    pwSaveReturn = false,
    targetContainer = null,
    targetEditor = null,
    targetFile = null,
    targetImage = null;

if (!window.tinymce) {
  alert('It looks like the PaintWeb plugin for TinyMCE cannot run.' +
    'TinyMCE was not detected!');
  return;
}

// Basic functionality used by PaintWeb.
if (!window.XMLHttpRequest || !window.getComputedStyle || 
  !document.createElement('canvas').getContext) {
  return;
}

/**
 * Load PaintWeb. This function tells TinyMCE to load the PaintWeb script.
 */
function paintwebLoad () {
  if (window.PaintWeb) {
    paintwebLoaded();
    return;
  }

  var config = targetEditor.getParam('paintweb_config'),
      src = config.tinymce.paintwebFolder + 'paintweb.js';

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
      pwContainer = document.createElement('div');

  pNode.insertBefore(pwContainer, textarea.nextSibling);

  PaintWeb.baseFolder   = config.tinymce.paintwebFolder;
  config.imageLoad      = targetImage;
  config.guiPlaceholder = pwContainer;

  if (!config.lang) {
    config.lang = targetEditor.getParam('language');
  }

  for (var prop in config) {
    paintwebConfig[prop] = config[prop];
  }

  paintwebInstance.init(paintwebInitialized);
};

/**
 * The initialization event handler for PaintWeb. When PaintWeb is initialized 
 * this method configures the PaintWeb instance to work properly. A bar 
 * representing the plugin is also added, to let the user save/cancel image 
 * edits.
 */
function paintwebInitialized (ev) {
  if (overlayButton && targetEditor) {
    overlayButton.title = targetEditor.getLang('paintweb.overlayButton', 
        'Edit');
    overlayButton.replaceChild(document.createTextNode(overlayButton.title), 
        overlayButton.firstChild);
  }

  if (ev.state !== PaintWeb.INIT_DONE) {
    alert('PaintWeb initialization failed! ' + ev.errorMessage);
    paintwebInstance = null;

    return;
  }

  paintwebInstance.events.add('imageSave',       paintwebSave);
  paintwebInstance.events.add('imageSaveResult', paintwebSaveResult);
  paintwebShow();
};

/**
 * The <code>click</code> event handler for the Save button displayed on the 
 * plugin bar.
 *
 * @param {Event} ev The DOM Event object.
 */
function pluginSaveButton (ev) {
  ev.preventDefault();
  pwSaveReturn = true;
  paintwebInstance.imageSave();
};

/**
 * The <code>click</code> event handler for the Cancel button displayed on the 
 * plugin bar.
 *
 * @param {Event} ev The DOM Event object.
 */
function pluginCancelButton (ev) {
  ev.preventDefault();
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

    var url = targetFile === 'dataURL' ? '-' 
      : targetEditor.dom.getAttrib(targetImage, 
          'src');

    paintwebInstance.events.dispatch(new pwlib.appEvent.imageSaveResult(true, 
          url, ev.dataURL));

  } else if (pluginBar && targetEditor && !pluginBarTimeout) {
    if (targetFile === 'dataURL') {
      str = targetEditor.getLang('paintweb.statusSavingDataURL',
              'Saving image data URL...');
    } else {
      str = targetEditor.getLang('paintweb.statusSavingImage',
              'Saving image {file}...').
                replace('{file}', '<strong>' + targetFile + '</strong>');
    }
    pluginBar.firstChild.innerHTML = str;
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

    pluginBarTimeout = setTimeout(pluginBarResetContent, pluginBarDelay);
  }

  if (ev.successful) {
    if (ev.urlNew) {
      targetEditor.dom.setAttrib(targetImage, 'src', ev.urlNew);
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
  if (!pluginBar || !targetImage || !targetFile) {
    return;
  }

  pluginBarTimeout = null;

  var str = '';

  if (targetFile === 'dataURL') {
    str = targetEditor.getLang('paintweb.statusEditingDataURL');
  } else {
    str = targetEditor.getLang('paintweb.statusImageEditing',
        'You are editing {file}.').
      replace('{file}', '<strong>' + targetFile + '</strong>');
  }

  pluginBar.firstChild.innerHTML = str;
};

/**
 * Start PaintWeb. This function performs the actual PaintWeb invocation.
 */
function paintwebEditStart () {
  if (!checkEditableImage(targetImage)) {
    targetImage = null;
    targetFile = null;
    return;
  }

  if (pwDestroyTimer) {
    clearTimeout(pwDestroyTimer);
    pwDestroyTimer = null;
  }

  targetFile = targetEditor.dom.getAttrib(targetImage, 'src');

  if (targetFile.substr(0, 5) === 'data:') {
    targetFile = 'dataURL';
  } else {
    targetFile = targetFile.substr(targetFile.lastIndexOf('/') + 1);
  }

  if (overlayButton && overlayButton.parentNode && targetEditor) {
    overlayButton.title = targetEditor.getLang('paintweb.overlayLoading', 
        'Loading PaintWeb...');
    overlayButton.replaceChild(document.createTextNode(overlayButton.title), 
        overlayButton.firstChild);
  }

  if (paintwebInstance) {
    paintwebInstance.imageLoad(targetImage);
    paintwebShow();
  } else {
    paintwebLoad();
  }
};

/**
 * Show PaintWeb on-screen. This function hides the current TinyMCE editor 
 * instance and shows up the PaintWeb instance.
 */
function paintwebShow () {
  paintwebInstance.gui.show();
  targetContainer.style.display = 'none';

  if (!pluginBar) {
    return;
  }

  pluginBarResetContent();

  var placeholder = paintwebConfig.guiPlaceholder;
  if (!pluginBar.parentNode) {
    placeholder.parentNode.insertBefore(pluginBar, placeholder);
  }
};

/**
 * Hide PaintWeb from the screen. This hides the PaintWeb target object of the 
 * current instance, and displays back the TinyMCE container element.
 */
function paintwebHide () {
  paintwebInstance.gui.hide();

  if (overlayButton && targetEditor) {
    overlayButton.title = targetEditor.getLang('paintweb.overlayButton', 
        'Edit');
    overlayButton.replaceChild(document.createTextNode(overlayButton.title), 
        overlayButton.firstChild);
  }

  if (pluginBar && pluginBar.parentNode) {
    targetContainer.parentNode.removeChild(pluginBar);
  }

  targetContainer.style.display = '';
  targetImage = null;
  targetFile  = null;

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

  targetEditor = this;
  targetContainer = this.getContainer();
  targetImage = this.selection.getNode();

  paintwebEditStart();
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
 * The <code>init</code> and <code>preProcess</code> event handler for the 
 * TinyMCE editor instance.  This makes sure that the iframe DOM document does 
 * not contain any PaintWeb overlay button.  Firefox remembers the overlay 
 * button after a page refresh.
 *
 * @param {tinymce.Editor} ed The editor instance that the plugin is 
 * initialized in.
 */
function overlayButtonCleanup (ed) {
  if (!ed || !ed.getDoc) {
    return;
  }

  var iframe = ed.getDoc();
  if (!iframe || !iframe.getElementsByClassName) {
    return;
  }

  var elems = iframe.getElementsByClassName(overlayButton.className),
      pNode;

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
    // Register the command so that it can be invoked by using 
    // tinyMCE.activeEditor.execCommand('paintwebEdit');
    ed.addCommand('paintwebEdit', paintwebEditCommand, ed);

    // Register PaintWeb button
    ed.addButton('paintwebEdit', {
      title : 'paintweb.toolbarButton',
      cmd : 'paintwebEdit',
      image : url + '/img/paintweb.gif'
    });

    // Add a node change handler which enables the PaintWeb button in the UI 
    // when an image is selected.
    ed.onNodeChange.add(this.edNodeChange);

    var config = ed.getParam('paintweb_config') || {};
    if (!config.tinymce) {
      config.tinymce = {};
    }

    // Integrate into the ContextMenu plugin if the user desires so.
    if (config.tinymce.contextMenuItem && ed.plugins.contextmenu) {
      ed.plugins.contextmenu.onContextMenu.add(this.pluginContextMenu);
    }

    // Create the overlay button element if the configuration allows so.
    if (config.tinymce.overlayButton) {
      ed.onClick.add(this.edClick);
      ed.onPreProcess.add(this.edPreProcess);
      ed.onBeforeGetContent.add(this.edPreProcess);
      ed.onRemove.add(this.edPreProcess);
      ed.onInit.add(overlayButtonCleanup);

      overlayButton = document.createElement('a');
      overlayStyle = overlayButton.style;

      overlayButton.className = 'paintwebOverlayButton';
      overlayButton.title = ed.getLang('paintweb.overlayButton', 'Edit');
      overlayButton.appendChild(document.createTextNode(overlayButton.title));

      overlayStyle.position = 'absolute';
      overlayStyle.background = '#fff';
      overlayStyle.padding = '4px 6px';
      overlayStyle.border = '1px solid #000';
      overlayStyle.textDecoration = 'none';
      overlayStyle.color = '#000';
    }

    // Handle the dblclick events for image elements, if the user wants it.
    if (config.tinymce.dblclickHandler) {
      ed.onDblClick.add(this.edDblClick);
    }

    // Add a "plugin bar" above the PaintWeb editor, when PaintWeb is active.  
    // This bar shows the image file name being edited, and provides two buttons 
    // for image save and for cancelling any image edits.
    if (config.tinymce.pluginBar) {
      pluginBar = document.createElement('div');

      var saveBtn   = document.createElement('a'),
          cancelBtn = document.createElement('a'),
          textSpan  = document.createElement('span');

      saveBtn.className = 'paintweb_tinymce_save';
      saveBtn.href = '#';
      saveBtn.title = ed.getLang('paintweb.imageSaveButtonTitle',
          'Save the image and return to TinyMCE.');

      saveBtn.appendChild(document.createTextNode(ed.getLang('paintweb.imageSaveButton', 
              'Save')));
      saveBtn.addEventListener('click', pluginSaveButton, false);

      cancelBtn.className = 'paintweb_tinymce_cancel';
      cancelBtn.href = '#';
      cancelBtn.title = ed.getLang('paintweb.cancelEditButtonTitle',
          'Cancel image edits and return to TinyMCE.');
      cancelBtn.appendChild(document.createTextNode(ed.getLang('paintweb.cancelEditButton', 
              'Cancel')));
      cancelBtn.addEventListener('click', pluginCancelButton, false);

      pluginBar.className = 'paintweb_tinymce_status';
      pluginBar.style.display = 'none';
      pluginBar.appendChild(textSpan);
      pluginBar.appendChild(saveBtn);
      pluginBar.appendChild(cancelBtn);
    }
  },

  /**
   * The <code>preProcess</code> and <code>beforeGetContent</code> event 
   * handler. This method removes the PaintWeb overlay button.
   *
   * @param {tinymce.Editor} ed The editor instance that the plugin is 
   * initialized in.
   */
  edPreProcess: function (ed) {
    // Remove the overlay button.
    if (overlayButton && overlayButton.parentNode) {
      overlayButton._targetImage = null;

      pNode = overlayButton.parentNode;
      pNode.removeChild(overlayButton);
    }

    overlayButtonCleanup(ed);
  },

  /**
   * The <code>nodeChange</code> event handler for the TinyMCE editor. This 
   * method provides visual feedback for editable image elements.
   *
   * @private
   *
   * @param {tinymce.Editor} ed The editor instance that the plugin is 
   * initialized in.
   * @param {tinymce.ControlManager} cm The control manager.
   * @param {Node} n The DOM node for which the event is fired.
   */
  edNodeChange: function (ed, cm, n) {
    // Do not do anything inside the overlay button.
    if (!targetImage && overlayButton && n && n.className === 
        overlayButton.className && n._targetImage === n.previousSibling) {
      return;
    }

    var disabled = !checkEditableImage(n),
        pNode = null;

    cm.setDisabled('paintwebEdit', disabled);

    if (!overlayButton) {
      return;
    }

    // Remove the overlay button.
    if (overlayButton.parentNode) {
      overlayButton._targetImage = null;

      pNode = overlayButton.parentNode;
      pNode.removeChild(overlayButton);
    }

    if (n.nextSibling && n.nextSibling.className === overlayButton.className) {
      pNode = n.parentNode;
      pNode.removeChild(n.nextSibling);
    }

    if (n.className === overlayButton.className) {
      pNode = n.parentNode;
      pNode.removeChild(n);
    }

    if (!disabled) {
      // Add the overlay button.
      overlayButton._targetImage = n;
      overlayButton.style.top  = (n.offsetTop  + 5) + 'px';
      overlayButton.style.left = (n.offsetLeft + 5) + 'px';
      overlayButton.title = ed.getLang('paintweb.overlayButton', 'Edit');
      overlayButton.replaceChild(document.createTextNode(overlayButton.title), 
          overlayButton.firstChild);

      pNode = n.parentNode;
      pNode.insertBefore(overlayButton, n.nextSibling);
    } else if (overlayButton._targetImage) {
      overlayButton._targetImage = null;
    }
  },

  /**
   * The <code>click</code> event handler for the editor. This method starts 
   * PaintWeb when the user clicks the "Edit" overlay button.
   *
   * @param {tinymce.Editor} ed The TinyMCE editor instance.
   * @param {Event} ev The DOM Event object.
   */
  edClick: function (ed, ev) {
    // If the user clicked the Edit overlay button, then we consider the user 
    // wants to start PaintWeb.
    if (!targetImage && overlayButton && ev.target && ev.target.className === 
        overlayButton.className && overlayButton._targetImage) {
      targetEditor = ed;
      targetContainer = ed.getContainer();
      targetImage = overlayButton._targetImage;

      paintwebEditStart();
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
      menu.add({title: 'paintweb.contextMenuEdit', cmd: 'paintwebEdit'});
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
      longname: 'PaintWeb - online painting application',
      author: 'Mihai Şucan',
      authorurl: 'http://www.robodesign.ro/mihai',
      infourl: 'http://code.google.com/p/paintweb',
      version: '0.9'
    };
  }
});

// Register the PaintWeb plugin
tinymce.PluginManager.add('paintweb', tinymce.plugins.paintweb);
})();

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

