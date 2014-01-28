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
 * $Date: 2014-01-28 13:04:58 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the "Insert image" tool implementation.
 */

// TODO: allow inserting images from a different host, using server-side magic.

/**
 * @class The "Insert image" tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.tools.insertimg = function (app) {
  var _self         = this,
      canvasImage   = app.image,
      clearInterval = app.win.clearInterval,
      config        = app.config,
      context       = app.buffer.context,
      gui           = app.gui,
      lang          = app.lang,
      MathAbs       = Math.abs,
      MathMin       = Math.min,
      MathRound     = Math.round,
      mouse         = app.mouse,
      setInterval   = app.win.setInterval;

  /**
   * Holds the previous tool ID.
   *
   * @private
   * @type String
   */
  var prevTool = app.tool ? app.tool._id : null;

  /**
   * The interval ID used for invoking the drawing operation every few 
   * milliseconds.
   *
   * @private
   * @see PaintWeb.config.toolDrawDelay
   */
  var timer = null;

  /**
   * Tells if the <kbd>Shift</kbd> key is down or not. This is used by the 
   * drawing function.
   *
   * @private
   * @type Boolean
   * @default false
   */
  var shiftKey = false;

  /**
   * Tells if the drawing canvas needs to be updated or not.
   *
   * @private
   * @type Boolean
   * @default false
   */
  var needsRedraw = false;

  /**
   * Holds the starting point on the <var>x</var> axis of the image, for the 
   * current drawing operation.
   *
   * @private
   * @type Number
   */
  var x0 = 0;

  /**
   * Holds the starting point on the <var>y</var> axis of the image, for the 
   * current drawing operation.
   *
   * @private
   * @type Number
   */
  var y0 = 0;

  /**
   * Tells if the image element loaded or not.
   *
   * @private
   * @type Boolean
   */
  var imageLoaded = false;

  /**
   * Holds the image aspect ratio, used by the resize method.
   *
   * @private
   * @type Number
   */
  var imageRatio = 1;

  /**
   * Holds the DOM image element.
   *
   * @private
   * @type Element
   */
  var imageElement = null;

  /**
   * Holds the image address.
   * @type String
   */
  if (!this.url) {
    this.url = 'http://';
  }

  /**
   * The tool preactivation code. This function asks the user to provide an URL 
   * to the image which is desired to be inserted into the canvas.
   *
   * @returns {Boolean} True if the URL provided is correct. False is returned 
   * if the URL is not provided or if it's incorrect. When false is returned the 
   * tool activation is cancelled.
   */
  this.preActivate = function () {
    if (!gui.elems.viewport) {
      return false;
    }

    _self.url = prompt(lang.promptInsertimg, _self.url);

    if (!_self.url || _self.url.toLowerCase() === 'http://') {
      return false;
    }

    // Remember the URL.
    pwlib.extend(true, _self.constructor.prototype, {url: _self.url});

    if (!pwlib.isSameHost(_self.url, app.win.location.host)) {
      alert(lang.errorInsertimgHost);
      return false;
    }

    return true;
  };

  /**
   * The tool activation event handler. This function is called once the 
   * previous tool has been deactivated.
   */
  this.activate = function () {
    imageElement = new Image();
    imageElement.addEventListener('load', ev_imageLoaded, false);
    imageElement.src = _self.url;

    return true;
  };

  /**
   * The tool deactivation event handler.
   */
  this.deactivate = function () {
    if (imageElement) {
      imageElement = null;
    }

    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    needsRedraw = false;

    context.clearRect(0, 0, canvasImage.width, canvasImage.height);

    return true;
  };

  /**
   * The <code>load</code> event handler for the image element. This method 
   * makes sure the image dimensions are synchronized with the zoom level, and 
   * draws the image on the canvas.
   *
   * @private
   */
  function ev_imageLoaded () {
    // Did the image already load?
    if (imageLoaded) {
      return;
    }

    // The default position for the inserted image is the top left corner of the visible area, taking into consideration the zoom level.
    var x = MathRound(gui.elems.viewport.scrollLeft / canvasImage.canvasScale),
        y = MathRound(gui.elems.viewport.scrollTop  / canvasImage.canvasScale);

    context.clearRect(0, 0, canvasImage.width, canvasImage.height);

    try {
      context.drawImage(imageElement, x, y);
    } catch (err) {
      alert(lang.errorInsertimg);
      return;
    }

    imageLoaded = true;
    needsRedraw = false;

    if (!timer) {
      timer = setInterval(_self.draw, config.toolDrawDelay);
    }

    gui.statusShow('insertimgLoaded');
  };

  /**
   * The <code>mousedown</code> event handler. This method stores the current 
   * mouse location and the image aspect ratio for later reuse by the 
   * <code>draw()</code> method.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousedown = function (ev) {
    if (!imageLoaded) {
      alert(lang.errorInsertimgNotLoaded);
      return false;
    }

    x0 = mouse.x;
    y0 = mouse.y;

    // The image aspect ratio - used by the draw() method when the user holds 
    // the Shift key down.
    imageRatio = imageElement.width / imageElement.height;
    shiftKey = ev.shiftKey;

    gui.statusShow('insertimgResize');

    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
  };

  /**
   * The <code>mousemove</code> event handler.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    shiftKey = ev.shiftKey;
    needsRedraw = true;
  };

  /**
   * Perform the drawing operation. When the mouse button is not down, the user 
   * is allowed to pick where he/she wants to insert the image element, inside 
   * the canvas. Once the <code>mousedown</code> event is fired, this method 
   * allows the user to resize the image inside the canvas.
   *
   * @see PaintWeb.config.toolDrawDelay
   */
  this.draw = function () {
    if (!imageLoaded || !needsRedraw) {
      return;
    }

    context.clearRect(0, 0, canvasImage.width, canvasImage.height);

    // If the user is holding down the mouse button, then allow him/her to 
    // resize the image.
    if (mouse.buttonDown) {
      var w = MathAbs(mouse.x - x0),
          h = MathAbs(mouse.y - y0),
          x = MathMin(mouse.x,  x0),
          y = MathMin(mouse.y,  y0);

      if (!w || !h) {
        needsRedraw = false;
        return;
      }

      // If the Shift key is down, constrain the image to have the same aspect 
      // ratio as the original image element.
      if (shiftKey) {
        if (w > h) {
          if (y == mouse.y) {
            y -= w-h;
          }
          h = MathRound(w/imageRatio);
        } else {
          if (x == mouse.x) {
            x -= h-w;
          }
          w = MathRound(h*imageRatio);
        }
      }

      context.drawImage(imageElement, x, y, w, h);
    } else {
      // If the mouse button is not down, simply allow the user to pick where 
      // he/she wants to insert the image element.
      context.drawImage(imageElement, mouse.x, mouse.y);
    }

    needsRedraw = false;
  };

  /**
   * The <code>mouseup</code> event handler. This method completes the drawing 
   * operation by inserting the image in the layer canvas, and by activating the 
   * previous tool.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mouseup = function (ev) {
    if (!imageLoaded) {
      return false;
    }

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    app.layerUpdate();

    if (prevTool) {
      app.toolActivate(prevTool, ev);
    }

    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
  };

  /**
   * The <code>keydown</code> event handler allows users to press the 
   * <kbd>Escape</kbd> key to cancel the drawing operation and return to the 
   * previous tool.
   *
   * @param {Event} ev The DOM Event object.
   * @returns {Boolean} True if the key was recognized, or false if not.
   */
  this.keydown = function (ev) {
    if (!prevTool || ev.kid_ != 'Escape') {
      return false;
    }

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    mouse.buttonDown = false;
    app.toolActivate(prevTool, ev);

    return true;
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

