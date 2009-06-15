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
 * $Date: 2009-06-15 20:27:08 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the hand tool implementation.
 */

/**
 * @class The hand tool. This tool allows the user to drag the image canvas 
 * inside the viewport.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.tools.hand = function (app) {
  var _self         = this,
      bufferCanvas  = app.buffer.canvas,
      bufferStyle   = bufferCanvas.style,
      config        = app.config;
      clearInterval = app.win.clearInterval,
      image         = app.image,
      MathRound     = Math.round,
      mouse         = app.mouse,
      viewport      = app.gui.elems.viewport,
      vheight       = 0,
      vwidth        = 0,
      setInterval   = app.win.setInterval;

  /**
   * The interval ID used for invoking the viewport drag operation every few 
   * milliseconds.
   *
   * @private
   * @see PaintWeb.config.toolDrawDelay
   */
  var timer = null;

  /**
   * Tells if the viewport needs to be scrolled.
   *
   * @private
   * @type Boolean
   * @default false
   */
  var needsScroll = false;

  /**
   * Holds the previous tool ID.
   *
   * @private
   * @type String
   */
  this.prevTool = null;

  var x0 = 0, y0 = 0,
      x1 = 0, y1 = 0,
      l0 = 0, t0 = 0;

  /**
   * Tool preactivation event handler.
   *
   * @returns {Boolean} True if the tool can become active, or false if not.
   */
  this.preActivate = function () {
    if (!viewport) {
      return false;
    }

    _self.prevTool = app.tool._id;

    // Check if the image canvas can be scrolled within the viewport.

    var cs      = app.win.getComputedStyle(viewport, null),
        bwidth  = parseInt(bufferStyle.width),
        bheight = parseInt(bufferStyle.height);

    vwidth  = parseInt(cs.width),
    vheight = parseInt(cs.height);

    if (vheight < bheight || vwidth < bwidth) {
      return true;
    } else {
      return false;
    }
  };

  /**
   * Tool activation event handler.
   */
  this.activate = function () {
    bufferStyle.cursor = 'move';
    app.shadowDisallow();
  };

  /**
   * Tool deactivation event handler.
   */
  this.deactivate = function (ev) {
    if (timer) {
      clearInterval(timer);
      timer = null;
      app.doc.removeEventListener('mousemove', ev_mousemove, false);
      app.doc.removeEventListener('mouseup',   ev_mouseup, false);
    }

    bufferStyle.cursor = '';
    app.shadowAllow();
  };

  /**
   * Initialize the canvas drag.
   *
   * @param {Event} ev The DOM event object.
   */
  this.mousedown = function (ev) {
    x0 = ev.clientX;
    y0 = ev.clientY;
    l0 = viewport.scrollLeft;
    t0 = viewport.scrollTop;

    needsScroll = false;

    app.doc.addEventListener('mousemove', ev_mousemove, false);
    app.doc.addEventListener('mouseup',   ev_mouseup, false);

    if (!timer) {
      timer = setInterval(viewportScroll, config.toolDrawDelay);
    }

    return true;
  };

  /**
   * The <code>mousemove</code> event handler. This simply stores the current 
   * mouse location.
   *
   * @param {Event} ev The DOM Event object.
   */
  function ev_mousemove (ev) {
    x1 = ev.clientX;
    y1 = ev.clientY;
    needsScroll = true;
  };

  /**
   * Perform the canvas drag operation. This function is called every few 
   * milliseconds.
   *
   * <p>Press <kbd>Escape</kbd> to stop dragging and to get back to the previous 
   * tool.
   */
  function viewportScroll () {
    if (needsScroll) {
      viewport.scrollTop  = t0 - y1 + y0;
      viewport.scrollLeft = l0 - x1 + x0;
      needsScroll = false;
    }
  };

  /**
   * The <code>mouseup</code> event handler.
   */
  function ev_mouseup (ev) {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    ev_mousemove(ev);
    viewportScroll();

    app.doc.removeEventListener('mousemove', ev_mousemove, false);
    app.doc.removeEventListener('mouseup',   ev_mouseup, false);

    mouse.buttonDown = false;
  };

  /**
   * Allows the user to press <kbd>Escape</kbd> to stop dragging the canvas, and 
   * to return to the previous tool.
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {Boolean} True if the key was recognized, or false if not.
   */
  this.keydown = function (ev) {
    if (!_self.prevTool || ev.kid_ != 'Escape') {
      return false;
    }

    app.toolActivate(_self.prevTool, ev);
    return true;
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

