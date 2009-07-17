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
 * $Date: 2009-07-17 22:43:13 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview This is a plugin for TinyMCE which integrates PaintWeb.
 */

(function() {
var paintwebInstance = null,
    paintwebConfig = null,
    targetImage = null,
    targetEditor = null,
    targetContainer = null,
    overlayButton = null,
    pluginBar = null;

if (!window.tinymce) {
  alert('It looks like the PaintWeb plugin for TinyMCE cannot run.' +
    'TinyMCE was not detected!');
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
  paintwebConfig = paintwebInstance.config;

  var config = targetEditor.getParam('paintweb_config'),
      textarea = targetEditor.getElement();
      pNode = targetContainer.parentNode,
      pwContainer = document.createElement('div');

  pNode.insertBefore(pwContainer, textarea.nextSibling);

  PaintWeb.baseFolder = config.tinymce.paintwebFolder;
  config.imagePreload = targetImage;
  config.guiPlaceholder = pwContainer;
  config.lang = targetEditor.getParam('language');

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
  if (ev.state !== PaintWeb.INIT_DONE) {
    alert('PaintWeb initialization failed! ' + ev.errorMessage);
    return;
  }

  paintwebInstance.events.add('imageSave', paintwebSave);
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
 * The "imageSave" application event handler for PaintWeb. When the user elects 
 * to save the image in PaintWeb, this function is invoked to ensure PaintWeb is 
 * hidden and the TinyMCE editor is shown again.
 */
function paintwebSave (ev) {
  ev.preventDefault();

  if (paintwebConfig.tinymce.imageSaveDataURI) {
    targetImage.src = ev.dataURI;
  }

  paintwebHide();
};

/**
 * Start PaintWeb. This function performs the actual PaintWeb invocation.
 */
function paintwebEditStart () {
  if (!checkEditableImage(targetImage)) {
    targetImage = null;
    return;
  }

  if (overlayButton && overlayButton.parentNode && targetEditor) {
    overlayButton.title = targetEditor.getLang('paintweb.loading', 'Loading');
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

  var imageFile = targetImage.src,
      statusStr = '',
      guiPlaceholder = paintwebConfig.guiPlaceholder;

  if (imageFile.substr(0, 5) === 'data:') {
    imageFile = 'data URI';
  } else {
    imageFile = imageFile.substr(imageFile.lastIndexOf('/') + 1);
  }

  statusStr = targetEditor.getLang('paintweb.statusImageEditing',
      'You are editing %file%.').replace('%file%', imageFile);

  pluginBar.replaceChild(document.createTextNode(statusStr), 
      pluginBar.firstChild);

  if (!pluginBar.parentNode) {
    guiPlaceholder.parentNode.insertBefore(pluginBar, guiPlaceholder);
  }
};

/**
 * Hide PaintWeb from the screen. This hides the PaintWeb target object of the 
 * current instance, and displays back the TinyMCE container element.
 */
function paintwebHide () {
  paintwebInstance.gui.hide();

  if (overlayButton && overlayButton.parentNode && targetEditor) {
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

  targetEditor.focus();
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
    ed.addCommand('paintwebEdit', paintwebEditCommand);

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
      ed.onInit.add(this.edInit);

      overlayButton = document.createElement('a');

      overlayButton.className = 'paintwebOverlayButton';
      overlayButton.title = ed.getLang('paintweb.overlayButton', 'Edit');
      overlayButton.appendChild(document.createTextNode(overlayButton.title));

      overlayButton.style.position = 'absolute';
      overlayButton.style.background = '#fff';
      overlayButton.style.padding = '4px 6px';
      overlayButton.style.border = '1px solid #000';
      overlayButton.style.textDecoration = 'none';
      overlayButton.style.color = '#000';
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
          statusStr = '';

      statusStr = ed.getLang('paintweb.statusImageEditing',
          'You are editing %file%.');

      saveBtn.className = 'paintweb_tinymce_save';
      saveBtn.href = '#';
      saveBtn.title = ed.getLang('paintweb.imageSaveButton', 'Save');
      saveBtn.appendChild(document.createTextNode(saveBtn.title));
      saveBtn.addEventListener('click', pluginSaveButton, false);

      cancelBtn.className = 'paintweb_tinymce_cancel';
      cancelBtn.href = '#';
      cancelBtn.title = ed.getLang('paintweb.cancelEditButton', 'Cancel');
      cancelBtn.appendChild(document.createTextNode(cancelBtn.title));
      cancelBtn.addEventListener('click', pluginCancelButton, false);

      pluginBar.className = 'paintweb_tinymce_status';
      pluginBar.style.display = 'none';
      pluginBar.appendChild(document.createTextNode(statusStr));
      pluginBar.appendChild(saveBtn);
      pluginBar.appendChild(cancelBtn);
    }
  },

  /**
   * The <code>init</code> event handler for the editor instance. This makes 
   * sure that the iframe DOM document does not contain any PaintWeb overlay 
   * button. Firefox remembers the overlay button after a page refresh.
   *
   * @param {tinymce.Editor} ed The editor instance that the plugin is 
   * initialized in.
   */
  edInit: function (ed) {
    if (!ed || !ed.getDoc) {
      return;
    }

    var iframe = ed.getDoc();
    if (!iframe || !iframe.getElementsByClassName) {
      return;
    }

    var elems = iframe.getElementsByClassName('paintwebOverlayButton'),
        pNode;

    for (var i = 0; i < elems.length; i++) {
      pNode = elems[i].parentNode;
      pNode.removeChild(elems[i]);
    }
  },

  /**
   * The <code>preProcess</code> and <code>beforeGetContent</code> event 
   * handler. This method removes the PaintWeb overlay button.
   */
  edPreProcess: function () {
    // Remove the overlay button.
    if (overlayButton && overlayButton.parentNode) {
      overlayButton._targetImage = null;

      pNode = overlayButton.parentNode;
      pNode.removeChild(overlayButton);
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
   * @param {tinymce.ControlManager} cm The control manager.
   * @param {Node} n The DOM node for which the event is fired.
   */
  edNodeChange: function (ed, cm, n) {
    // Do not do anything inside the overlay button.
    if (!targetImage && overlayButton && n === overlayButton && 
        overlayButton._targetImage) {
      return;
    }

    var disabled = !checkEditableImage(n),
        pNode = null;

    cm.setDisabled('paintwebEdit', disabled);

    if (!overlayButton) {
      return;
    }

    if (disabled) {
      // Remove the overlay button.
      if (overlayButton.parentNode) {
        overlayButton._targetImage = null;

        pNode = overlayButton.parentNode;
        pNode.removeChild(overlayButton);
      }

    } else {
      // Add the overlay button.
      overlayButton._targetImage = n;
      overlayButton.style.top  = (n.offsetTop  + 5) + 'px';
      overlayButton.style.left = (n.offsetLeft + 5) + 'px';

      pNode = n.parentNode;
      pNode.appendChild(overlayButton);
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
    if (!targetImage && overlayButton && ev.target === overlayButton && 
        overlayButton._targetImage) {
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

