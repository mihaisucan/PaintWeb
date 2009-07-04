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
 * $Date: 2009-07-04 23:17:36 +0300 $
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
    targetContainer = null;

function paintwebLoad () {
  if (window.PaintWeb) {
    paintwebLoaded();
    return;
  }

  var config = targetEditor.getParam('paintweb_config'),
      src = config.baseFolder + 'paintweb.js';

  tinymce.ScriptLoader.load(src, paintwebLoaded);
};

function paintwebLoaded () {
  if (paintwebInstance) {
    return;
  }

  paintwebInstance = new PaintWeb();
  paintwebConfig = paintwebInstance.config;

  var config = targetEditor.getParam('paintweb_config'),
      container = document.createElement('div');

  targetContainer.parentNode.appendChild(container);

  config.imagePreload = targetImage;
  config.guiPlaceholder = container;

  for (var prop in config) {
    paintwebConfig[prop] = config[prop];
  }

  paintwebInstance.init(paintwebInitialized);
};

function paintwebInitialized (ev) {
  if (ev.state === PaintWeb.INIT_DONE) {
    targetContainer.style.display = 'none';
    paintwebInstance.events.add('imageSave', paintwebSave);

  } else {
    alert('PaintWeb initialization failed! ' + ev.errorMessage);
  }
};

function paintwebSave (ev) {
  ev.preventDefault();

  targetImage.src = ev.dataURI;
  var guiPlaceholder = this.config.guiPlaceholder;
  guiPlaceholder.style.display = 'none';
  guiPlaceholder.className = '';
  targetContainer.style.display = '';
};

function paintwebEditCommand () {
  targetEditor = this;
  targetContainer = this.getContainer();
  targetImage = this.selection.getNode();

  if (paintwebInstance) {
    paintwebInstance.imageLoad(targetImage);
    paintwebConfig.guiPlaceholder.style.display = '';
    paintwebConfig.guiPlaceholder.className = 'paintweb_placeholder';
    targetContainer.style.display = 'none';

  } else {
    paintwebLoad();
  }
};

// Load plugin specific language pack
tinymce.PluginManager.requireLangPack('paintweb');

tinymce.create('tinymce.plugins.paintweb', {
  /**
   * Initializes the plugin, this will be executed after the plugin has been 
   * created.
   * This call is done before the editor instance has finished it's 
   * initialization so use the onInit event
   * of the editor instance to intercept that event.
   *
   * @param {tinymce.Editor} ed Editor instance that the plugin is initialized 
   * in.
   * @param {String} url Absolute URL to where the plugin is located.
   */
  init: function (ed, url) {
    // Register the command so that it can be invoked by using 
    // tinyMCE.activeEditor.execCommand('paintwebEdit');
    ed.addCommand('paintwebEdit', paintwebEditCommand);

    // Register example button
    ed.addButton('paintwebEdit', {
      title : 'paintweb.editButton',
      cmd : 'paintwebEdit',
      image : url + '/img/paintweb_icon.png'
    });

    // Add a node change handler, selects the button in the UI when a image is 
    // selected
    ed.onNodeChange.add(function(ed, cm, n) {
      cm.setActive('paintwebEdit', n.nodeName === 'IMG');
    });
  },

  /**
   * Creates control instances based in the incomming name. This method is 
   * normally not needed since the addButton method of the tinymce.Editor class 
   * is a more easy way of adding buttons but you sometimes need to create more 
   * complex controls like listboxes, split buttons etc then this method can be 
   * used to create those.
   *
   * @param {String} n Name of the control to create.
   * @param {tinymce.ControlManager} cm Control manager to use inorder to create 
   * new control.
   *
   * @returns {tinymce.ui.Control} New control instance or null if no control 
   * was created.
   */
  createControl: function (n, cm) {
    return null;
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

