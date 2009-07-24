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
 * $Date: 2009-07-24 21:59:45 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the integration code for PaintWeb inside <a 
 * href="http://www.moodle.org">Moodle</a>.
 */

/**
 * @class The Moodle extension for PaintWeb. This extension handles the Moodle 
 * integration inside the PaintWeb code.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.extensions.moodle = function (app) {
  var _self    = this,
      appEvent = pwlib.appEvent,
      config   = app.config,
      gui      = app.gui,
      lang     = app.lang.moodle;

  // Holds properties related to Moodle.
  var moodle = {
    // Holds the URL of the image the user is saving.
    imageURL: null,

    // The class name for the element which holds the textarea buttons (toggle 
    // on/off).
    textareaButtons: 'textareaicons',

    // The image save handler script on the server-side. The path is relative to 
    // the PaintWeb base folder. If the value is set to '-' then the image src 
    // attribute is updated to hold the generated dataURL.
    //imageSaveHandler: '../ext/moodle/imagesave.php'
    imageSaveHandler: '-'
  };

  /**
   * The <code>extensionRegister</code> event handler.
   *
   * @returns {Boolean} True if the extension initialized successfully, or false 
   * if not.
   */
  this.extensionRegister = function () {
    // Register application events.
    app.events.add('guiShow',   this.guiShow);
    app.events.add('guiHide',   this.guiHide);
    app.events.add('imageSave', this.imageSave);

    return true;
  };

  /**
   * The <code>extensionUnregister</code> event handler.
   */
  this.extensionUnregister = function () {
    return;
  };

  /**
   * The <code>imageSave</code> application event handler. When the user 
   * attempts to save an image, this extension handles the event by sending the 
   * image data to the Moodle server, to perform the actual save operation.
   *
   * @private
   * @param {pwlib.appEvent.imageSave} ev The application event object.
   */
  this.imageSave = function (ev) {
    if (!ev.dataURL) {
      return;
    }

    ev.preventDefault();

    moodle.imageURL = config.imageLoad.src;
    if (!moodle.imageURL || moodle.imageURL.substr(0, 5) === 'data:') {
      moodle.imageURL = '-';
    }

    if (moodle.imageSaveHandler === '-') {
      app.events.dispatch(new appEvent.imageSaveResult(true, moodle.imageURL, 
            ev.dataURL));
    } else {
      var handlerURL = PaintWeb.baseFolder + moodle.imageSaveHandler,
          send       = 'url=' + encodeURIComponent(moodle.imageURL) +
                       '&dataURL=' + encodeURIComponent(ev.dataURL);

      pwlib.xhrLoad(handlerURL, imageSaveReady, 'POST', send);
    }
  };

  /**
   * The image save <code>onreadystatechange</code> event handler for the 
   * <code>XMLHttpRequest</code> which performs the image save. This function 
   * uses the reply to determine if the image save operation is successful or 
   * not.
   *
   * <p>The {@link pwlib.appEvent.imageSaveResult} application event is 
   * dispatched.
   *
   * <p>The server-side script must reply with a JSON object with the following 
   * properties:
   *
   * <ul>
   *   <li><var>successful</var> which tells if the image save operation was 
   *   successful or not;
   *
   *   <li><var>url</var> which must tell the same URL as the image we just 
   *   saved (sanity/security check);
   *
   *   <li><var>urlNew</var> is optional. This allows the server-side script to 
   *   change the image URL;
   *
   *   <li><var>errorMessage</var> is optional. When the image save was not 
   *   successful, an error message can be displayed.
   * </ul>
   *
   * @private
   * @param {XMLHttpRequest} xhr The XMLHttpRequest object.
   */
  function imageSaveReady (xhr) {
    if (!xhr || xhr.readyState !== 4) {
      return;
    }

    var result = {successful: false, url: moodle.imageURL};

    if ((xhr.status !== 304 && xhr.status !== 200) || !xhr.responseText) {
      alert(lang.xhrRequestFailed);

      app.events.dispatch(new appEvent.imageSaveResult(false, result.url, null, 
            lang.xhrRequestFailed));

      return;
    }

    try {
      result = JSON.parse(xhr.responseText);
    } catch (err) {
      result.errorMessage = lang.jsonParseFailed + "\n" + err;
      alert(result.errorMessage);
    }

    if (result.successful) {
      if (result.url !== moodle.imageURL) {
        alert(pwlib.strf(lang.urlMismatch, {
                url: moodle.imageURL,
                urlServer: result.url || 'null'}));
      }
    } else {
      if (result.errorMessage) {
        alert(lang.imageSaveFailed + "\n" + result.errorMessage);
      } else {
        alert(lang.imageSaveFailed);
      }
    }

    app.events.dispatch(new appEvent.imageSaveResult(result.successful, 
          result.url, result.urlNew, result.errorMessage));
  };

  /**
   * The <code>guiShow</code> application event handler. When the PaintWeb GUI 
   * is shown, we must hide the textarea icons for the current textarea element, 
   * inside a Moodle page.
   * @private
   */
  this.guiShow = function () {
    var pNode = config.guiPlaceholder.parentNode,
        elem = pNode.getElementsByClassName(moodle.textareaButtons)[0];

    if (elem) {
      elem.style.display = 'none';
    }
  };

  /**
   * The <code>guiHide</code> application event handler. When the PaintWeb GUI 
   * is hidden, we must show again the textarea icons for the current textarea 
   * element, inside a Moodle page.
   * @private
   */
  this.guiHide = function () {
    var pNode = config.guiPlaceholder.parentNode,
        elem = pNode.getElementsByClassName(moodle.textareaButtons)[0];

    if (elem) {
      elem.style.display = '';
    }
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

