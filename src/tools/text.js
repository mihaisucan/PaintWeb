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
 * $Date: 2009-06-19 21:05:23 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the text tool implementation.
 */

// TODO: make this tool nicer to use and make it work in Opera.

/**
 * @class The text tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.tools.text = function (app) {
  var _self         = this,
      clearInterval = app.win.clearInterval,
      config        = app.config.text,
      context       = app.buffer.context,
      doc           = app.doc,
      gui           = app.gui,
      image         = app.image,
      lang          = app.lang,
      mouse         = app.mouse,
      setInterval   = app.win.setInterval;

  /**
   * The interval ID used for invoking the drawing operation every few 
   * milliseconds.
   *
   * @private
   * @see PaintWeb.config.toolDrawDelay
   */
  var timer = null;

  /**
   * Holds the previous tool ID.
   *
   * @private
   * @type String
   */
  var prevTool = app.tool ? app.tool._id : null;

  /**
   * Tells if the drawing canvas needs to be updated or not.
   *
   * @private
   * @type Boolean
   * @default false
   */
  var needsRedraw = false;

  var input_textString = null,
      input_fontFamily = null,
      ev_configChangeId = null;

  /**
   * Tool preactivation code. This method check if the browser has support for 
   * rendering text in Canvas.
   *
   * @returns {Boolean} True if the tool can be activated successfully, or false 
   * if not.
   */
  this.preActivate = function () {
    if (!gui.inputs.textString || !gui.inputs.text_fontFamily || 
        !gui.elems.viewport) {
      return false;

    } else if (!context.fillText || !context.strokeText) {
      alert(lang.errorTextUnsupported);
      return false;

    } else {
      return true;
    }
  };

  /**
   * The tool activation code. This sets up a few variables, starts the drawing 
   * timer and adds event listeners as needed.
   */
  this.activate = function () {
    // Reset the mouse coordinates to the scroll top/left corner such that the 
    // text is rendered there.
    mouse.x = Math.round(gui.elems.viewport.scrollLeft / image.canvasScale),
    mouse.y = Math.round(gui.elems.viewport.scrollTop  / image.canvasScale),

    input_fontFamily = gui.inputs.text_fontFamily;
    input_textString = gui.inputs.textString;

    input_textString.addEventListener('input', ev_configChange, false);
    input_textString.addEventListener('change', ev_configChange, false);

    ev_configChangeId = app.events.add('configChange', ev_configChange);

    if (!timer) {
      timer = setInterval(_self.draw, app.config.toolDrawDelay);
    }
    needsRedraw = true;
  };

  /**
   * The tool deactivation simply consists of removing the event listeners added 
   * when the tool was constructed, and clearing the buffer canvas.
   */
  this.deactivate = function () {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    needsRedraw = false;

    if (ev_configChangeId) {
      app.events.remove('configChange', ev_configChangeId);
    }

    input_textString.removeEventListener('input', ev_configChange, false);
    input_textString.removeEventListener('change', ev_configChange, false);

    context.clearRect(0, 0, image.width, image.height);

    return true;
  };

  /**
   * The <code>configChange</code> application event handler. This is also the 
   * <code>input</code> and <code>change</code> event handler for the text 
   * string input element.  This method updates the Canvas text-related 
   * properties as needed, and re-renders the text.
   *
   * @param {Event|pwlib.appEvent.configChange} ev The application/DOM event 
   * object.
   */
  function ev_configChange (ev) {
    if (ev.type === 'input' || ev.type === 'change' ||
        (!ev.group && ev.config === 'shapeType') ||
        (ev.group === 'line' && ev.config === 'lineWidth')) {
      needsRedraw = true;
      return;
    }

    if (ev.type !== 'configChange' && ev.group !== 'text') {
      return;
    }

    var font = '';

    switch (ev.config) {
      case 'fontFamily':
        if (ev.value === '+') {
          fontFamilyAdd(ev);
        }
      case 'bold':
      case 'italic':
      case 'fontSize':
        if (config.bold) {
          font += 'bold ';
        }
        if (config.italic) {
          font += 'italic ';
        }
        font += config.fontSize + 'px ' + config.fontFamily;
        context.font = font;

      case 'textAlign':
      case 'textBaseline':
        needsRedraw = true;
    }
  };

  /**
   * Add a new font family into the font family drop down. This function is 
   * invoked by the <code>ev_configChange()</code> function when the user 
   * attempts to add a new font family.
   *
   * @private
   *
   * @param {pwlib.appEvent.configChange} ev The application event object.
   */
  function fontFamilyAdd (ev) {
    var new_font = prompt(lang.promptTextFont) || '';
    new_font = new_font.replace(/^\s+/, '').replace(/\s+$/, '') || 
      ev.previousValue;

    // Check if the font name is already in the list.
    var opt, new_font2 = new_font.toLowerCase(),
        n = input_fontFamily.options.length;

    for (var i = 0; i < n; i++) {
      opt = input_fontFamily.options[i];
      if (opt.value.toLowerCase() == new_font2) {
        config.fontFamily = opt.value;
        input_fontFamily.selectedIndex = i;
        input_fontFamily.value = config.fontFamily;
        ev.value = config.fontFamily;

        return;
      }
    }

    // Add the new font.
    opt = doc.createElement('option');
    opt.value = new_font;
    opt.appendChild(doc.createTextNode(new_font));
    input_fontFamily.insertBefore(opt, input_fontFamily.options[n-1]);
    input_fontFamily.selectedIndex = n-1;
    input_fontFamily.value = new_font;
    ev.value = new_font;
    config.fontFamily = new_font;
  };

  /**
   * The <code>mousemove</code> event handler.
   */
  this.mousemove = function () {
    needsRedraw = true;
  };

  /**
   * Perform the drawing operation.
   *
   * @see PaintWeb.config.toolDrawDelay
   */
  this.draw = function () {
    if (!needsRedraw) {
      return;
    }

    context.clearRect(0, 0, image.width, image.height);

    if (app.config.shapeType != 'stroke') {
      context.fillText(input_textString.value, mouse.x, mouse.y);
    }

    if (app.config.shapeType != 'fill') {
      context.strokeText(input_textString.value, mouse.x, mouse.y);
    }

    needsRedraw = false;
  };

  /**
   * The <code>click</code> event handler. This method completes the drawing 
   * operation by inserting the text into the layer canvas.
   */
  this.click = function () {
    _self.draw();
    app.layerUpdate();
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
    app.toolActivate(prevTool, ev);

    return true;
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

