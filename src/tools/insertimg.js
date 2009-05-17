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
 * $Date: 2009-05-16 21:22:30 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the "Insert image" tool implementation.
 */

/**
 * @class The "Insert image" tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
// TODO: allow inserting images from a different host, using server-side magic.
PaintWebInstance.toolAdd('insertimg', function (app) {
  var _self        = this,
      canvasImage  = app.image,
      container    = app.elems.container,
      context      = app.buffer.context,
      lang         = app.lang,
      layerUpdate  = app.layerUpdate,
      MathAbs      = Math.abs,
      MathMin      = Math.min,
      MathRound    = Math.round,
      mouse        = app.mouse,
      statusShow   = app.statusShow,
      toolActivate = app.toolActivate;

  /**
   * Holds the previous tool ID.
   *
   * @private
   * @type String
   */
  var prevTool = app.tool._id;

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
   * Holds the image address.
   * @type String
   */
  this.url = prompt(lang.promptInsertimg, this.url || 'http://');

  if (!this.url || this.url.toLowerCase() == 'http://' ||
      this.url.substr(0, 7).toLowerCase() != 'http://') {
    this._cancel = true;
    return false;
  }

  // Remember the URL.
  pwlib.extend(true, this.constructor.prototype, {url: this.url});

  /**
   * Determine the host from the given HTTP address.
   *
   * @param {String} url The HTTP address.
   * @returns {String} The host name.
   */
  function getHost (url) {
    url = url.substr(7);
    var pos = url.indexOf('/');
    if (pos > -1) {
      url = url.substr(0, pos);
    }

    return url;
  };

  if (getHost(this.url) != app.win.location.host) {
    alert(lang.errorInsertimgHost);
    this._cancel = true;
    return false;
  }

  /**
   * The <code>load</code> event handler for the image element. This method 
   * makes sure the image dimensions are synchronized with the zoom level, and 
   * draws the image on the canvas.
   */
  function ev_imageLoaded () {
    // Did the image already load?
    if (imageLoaded) {
      return;
    }

    // The default position for the inserted image is the top left corner of the visible area, taking into consideration the zoom level.
    var x = MathRound(container.scrollLeft / canvasImage.zoom),
        y = MathRound(container.scrollTop  / canvasImage.zoom);

    context.clearRect(0, 0, canvasImage.width, canvasImage.height);

    try {
      context.drawImage(imageElement, x, y);
      imageLoaded = true;
      statusShow('insertimgLoaded');
    } catch (err) {
      alert(lang.errorInsertimg);
    }
  };

  /**
   * Holds the DOM image element.
   *
   * @private
   * @type Element
   */
  var imageElement = new Image();
  imageElement.addEventListener('load', ev_imageLoaded, false);
  imageElement.src = this.url;

  /**
   * The <code>mousedown</code> event handler. This method stores the current 
   * mouse location and the image aspect ratio for later reuse by the 
   * <code>mousemove</code> event handler.
   */
  this.mousedown = function () {
    if (!imageLoaded) {
      alert(lang.errorInsertimgNotLoaded);
      return false;
    }

    x0 = mouse.x;
    y0 = mouse.y;

    // The image aspect ratio - used by the mousemove method when the user holds 
    // the Shift key down.
    imageRatio = imageElement.width / imageElement.height;

    statusShow('insertimgResize');

    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
  };

  /**
   * The <code>mousemove</code> event handler. When the mouse button is not 
   * down, the user is allowed to pick where he/she wants to insert the image 
   * element, inside the canvas. Once the <code>mousedown</code> event is fired, 
   * this method allows the user to resize the image inside the canvas.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    if (!imageLoaded) {
      return false;
    }

    context.clearRect(0, 0, canvasImage.width, canvasImage.height);

    // If the user is holding down the mouse button, then allow him/her to 
    // resize the image.
    if (mouse.buttonDown) {
      var w = MathAbs(mouse.x - x0),
          h = MathAbs(mouse.y - y0),
          x = MathMin(mouse.x,  x0),
          y = MathMin(mouse.y,  y0);

      // If the Shift key is down, constrain the image to have the same aspect 
      // ratio as the original image element.
      if (ev.shiftKey) {
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

    layerUpdate();

    if (prevTool) {
      toolActivate(prevTool, ev);
    }

    if (ev.stopPropagation) {
      ev.stopPropagation();
    }
  };

  /**
   * The tool deactivation event handler.
   */
  this.deactivate = function () {
    if (imageElement) {
      imageElement = null;
      delete imageElement;
    }

    context.clearRect(0, 0, canvasImage.width, canvasImage.height);

    return true;
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

    mouse.buttonDown = false;

    toolActivate(prevTool, ev);

    return true;
  };

  // TODO: check this ...
  return true;
});

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:


