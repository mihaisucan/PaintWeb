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
 * $Date: 2014-01-28 12:49:45 $
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
 * <p><strong>Note:</strong> This extension is supposed to work with Moodle 1.9 
 * and Moodle 2.0.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.extensions.moodle = function (app) {
  var _self         = this,
      appEvent      = pwlib.appEvent,
      config        = app.config,
      gui           = app.gui,
      lang          = app.lang.moodle,
      moodleServer  = config.moodleServer,
      tinymceEditor = null,
      qfErrorShown  = false;

  // Holds information related to Moodle.
  var moodleInfo = {
    // Holds the URL of the image the user is saving.
    imageURL: null,

    // The class name for the element which holds the textarea buttons (toggle 
    // on/off).
    // This element exists only in Moodle 1.9.
    textareaButtons: 'textareaicons',

    // The image save handler script on the server-side. The path is relative to 
    // the PaintWeb base folder.
    // This used with Moodle 2.0.
    imageSaveHandler20: '../ext/moodle/imagesave20.php',

    // The image save handler script for Moodle 1.9.
    imageSaveHandler19: '../ext/moodle/imagesave19.php',

    // This holds the release version of Moodle being used. This should be 1.9 
    // or 2.0.
    release: 0,

    // Moodle 2.0 draft item ID used for file storage.
    draftitemid: null
  };

  /**
   * The <code>extensionRegister</code> event handler. Setup event listeners, 
   * determine Moodle version, and more.
   *
   * @returns {Boolean} True if the extension initialized successfully, or false 
   * if not.
   */
  this.extensionRegister = function () {
    // Register application events.
    app.events.add('guiShow',   this.guiShow);
    app.events.add('guiHide',   this.guiHide);
    app.events.add('imageSave', this.imageSave);

    if (moodleServer && moodleServer.release) {
      var matches = moodleServer.release.match(/^\s*(\d+\.\d+)/);
      if (matches && matches[1]) {
        moodleInfo.release = parseFloat(matches[1]);
      }
    }

    if (typeof window.qf_errorHandler === 'function' && config.tinymce && 
        !config.tinymce.onSubmitUnsaved) {
      config.tinymce.onSubmitUnsaved = this.onSubmitUnsaved;
    }

    return true;
  };

  /**
   * The <code>submit</code> event handler for the form to which the PaintWeb 
   * instance is attached to. This method is invoked by the TinyMCE plugin when 
   * the form is submitted while the user edits an image with unsaved changes.
   * @private
   */
  this.onSubmitUnsaved = function () {
    var tmce           = config.tinymceEditor,
        textarea       = tmce ? tmce.getElement() : null,
        guiPlaceholder = config.guiPlaceholder,
        prevSibling    = guiPlaceholder.previousSibling;

    if (tmce && textarea && window.qf_errorHandler) {
      try {
        qf_errorHandler(textarea, "\n - " + lang.errorSubmitUnsaved);
      } catch (err) {
        return;
      }

      qfErrorShown = true;

      // Due to the styling of the error shown by Moodle, PaintWeb must have 
      // clear:right.
      if (prevSibling && prevSibling.className && 
          prevSibling.className.indexOf('paintweb_tinymce_status') !== -1) {
        prevSibling.style.clear = 'right';
      } else {
        guiPlaceholder.style.clear = 'right';
      }
    }
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

    moodleInfo.imageURL = config.imageLoad.src;
    if (!moodleInfo.imageURL || moodleInfo.imageURL.substr(0, 5) === 'data:') {
      moodleInfo.imageURL = '-';
    }

    if (config.moodleSaveMethod === 'dataURL') {
      app.events.dispatch(new appEvent.imageSaveResult(true, 
            moodleInfo.imageURL, ev.dataURL));

    } else {
      var handlerURL = PaintWeb.baseFolder,
          send       = 'url=' + encodeURIComponent(moodleInfo.imageURL) +
                       '&dataURL=' + encodeURIComponent(ev.dataURL),
          headers    = {'Content-Type': 'application/x-www-form-urlencoded'};

      // In Moodle 2.0 we include the context ID and the draft item ID, such 
      // that the image save script can properly save the new image inside the 
      // current draft area of the current textarea element.
      if (moodleInfo.release >= 2) {
        handlerURL += moodleInfo.imageSaveHandler20;
        if (moodleServer.contextid) {
          send += '&contextid=' + encodeURIComponent(moodleServer.contextid);
        }
        if (moodleInfo.draftitemid) {
          send += '&draftitemid=' + encodeURIComponent(moodleInfo.draftitemid);
        }

      } else {
        handlerURL += moodleInfo.imageSaveHandler19;
      }

      pwlib.xhrLoad(handlerURL, imageSaveReady, 'POST', send, headers);
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

    var result = {successful: false, url: moodleInfo.imageURL};

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
      if (result.url !== moodleInfo.imageURL) {
        alert(pwlib.strf(lang.urlMismatch, {
                url: moodleInfo.imageURL,
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
        textareaButtons  
          = pNode.getElementsByClassName(moodleInfo.textareaButtons)[0];

    // These show in Moodle 1.9.
    if (textareaButtons) {
      textareaButtons.style.display = 'none';
    }

    qfErrorShown = false;

    // For Moodle 2.0 we must determine the draft item ID in order to properly 
    // perform the image save operation into the current draft area.
    if (moodleInfo.release < 2) {
      return;
    }

    // Typically the TinyMCE editor instance is attached to a textarea element 
    // which has a name=whatever[text] or similar form. In the same form as the 
    // textarea, there must be a hidden input element with the 
    // name=whatever[itemid]. The value of that input holds the draft item ID.
    var tmce     = config.tinymceEditor,
        textarea = tmce ? tmce.getElement() : null,
        frm      = textarea ? textarea.form : null;

    if (!tmce || !textarea || !textarea.name || !frm) {
      return;
    }

    var fieldname = textarea.name.replace(/\[text\]$/, '');
    if (!fieldname) {
      return;
    }

    var draftitemid = frm.elements.namedItem(fieldname + '[itemid]'),
        format = frm.elements.namedItem(fieldname + '[format]');

    if (draftitemid) {
      moodleInfo.draftitemid = draftitemid.value;
    }

    if (format) {
      format.style.display = 'none';
    }
  };

  /**
   * The <code>guiHide</code> application event handler. When the PaintWeb GUI 
   * is hidden, we must show again the textarea icons for the current textarea 
   * element, inside a Moodle page.
   * @private
   */
  this.guiHide = function () {
    var guiPlaceholder = config.guiPlaceholder,
        prevSibling = guiPlaceholder.previousSibling;
        pNode = guiPlaceholder.parentNode,
        textareaButtons 
          = pNode.getElementsByClassName(moodleInfo.textareaButtons)[0];

    // These show in Moodle 1.9.
    if (textareaButtons) {
      textareaButtons.style.display = '';
    }

    var tmce     = config.tinymceEditor,
        textarea = tmce ? tmce.getElement() : null,
        frm      = textarea ? textarea.form : null;

    if (!tmce || !textarea || !textarea.name || !frm) {
      return;
    }

    if (qfErrorShown) {
      if (window.qf_errorHandler) {
        qf_errorHandler(textarea, '');
      }

      if (prevSibling && prevSibling.className && 
          prevSibling.className.indexOf('paintweb_tinymce_status') !== -1) {
        prevSibling.style.clear = '';
      } else {
        guiPlaceholder.style.clear = '';
      }
    }

    // The format input element only shows in Moodle 2.0.
    if (moodleInfo.release >= 2) {
      var fieldname = textarea.name.replace(/\[text\]$/, '');
      if (!fieldname) {
        return;
      }

      var format = frm.elements.namedItem(fieldname + '[format]');

      if (format) {
        format.style.display = '';
      }
    }
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

