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
 * $Date: 2009-06-18 21:50:44 +0300 $
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
      gui           = app.gui,
      image         = app.image,
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

  var textString = null,
      ev_configChangeId = null;

  /**
   * Tool preactivation code. This method is invoked when the user attempts to 
   * activate the text tool.
   *
   * @returns {Boolean} True if the tool can be activated successfully, or false 
   * if not.
   */
  this.preActivate = function () {
    if (!gui.inputs.textString) {
      return false;

    } else if (!context.fillText || !context.strokeText) {
      alert(app.lang.errorTextUnsupported);
      return false;

    } else {
      return true;
    }
  };

  /**
   * The tool activation code. This runs after the text tool is constructed, and 
   * after the previous tool has been deactivated.
   */
  this.activate = function () {
    // Reset mouse coordinates in the center of the image, for the purpose of 
    // placing the text there.
    mouse.x = Math.round(image.width  / 2);
    mouse.y = Math.round(image.height / 2);

    textString = gui.inputs.textString;
    textString.addEventListener('input', ev_configChange, false);
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

    textString.removeEventListener('input', ev_configChange, false);

    context.clearRect(0, 0, image.width, image.height);

    return true;
  };

  /**
   * The <code>configChange</code> application event handler. This is also the 
   * <code>input</code> event handler for the text string input element. This 
   * method updates the Canvas text-related properties as needed, and re-renders 
   * the text.
   *
   * @param {Event|pwlib.appEvent.configChange} ev The application/DOM event 
   * object.
   */
  function ev_configChange (ev) {
    if (ev.type === 'input') {
      needsRedraw = true;

    } else if (ev.type !== 'configChange' || ev.group !== 'text') {
      return;
    }

    var font = '';

    switch (ev.config) {
      case 'bold':
      case 'italic':
      case 'fontSize':
      case 'fontFamily':
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

    if (config.shapeType != 'stroke') {
      context.fillText(textString.value, mouse.x, mouse.y);
    }

    if (config.shapeType != 'fill') {
      context.strokeText(textString.value, mouse.x, mouse.y);
    }

    needsRedraw = false;
  };

  /**
   * The <code>click</code> event handler. This method completes the drawing 
   * operation by inserting the text into the layer canvas, and by activating 
   * the previous tool.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.click = function (ev) {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    _self.draw();
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

    mouse.buttonDown = false;
    app.toolActivate(prevTool, ev);

    return true;
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

