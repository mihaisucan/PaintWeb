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
 * $Date: 2014-01-28 12:50:10 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Allows users to draw in PaintWeb using the keyboard, without 
 * any pointing device.
 */

/**
 * @class The MouseKeys extension.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.extensions.mousekeys = function (app) {
  var _self     = this,
      canvas    = app.buffer.canvas,
      config    = app.config,
      container = app.gui.elems.canvasContainer,
      doc       = app.doc,
      gui       = app.gui,
      image     = app.image,
      MathCeil  = Math.ceil,
      mouse     = app.mouse,
      tool      = app.tool || {};

  /**
   * Holds the current mouse movement speed in pixels.
   *
   * @private
   * @type Number
   */
  var speed = 1;

  /**
   * Holds the current mouse movement acceleration, taken from the 
   * configuration.
   *
   * @private
   * @type Number
   * @see PaintWeb.config.mousekeys.accel The mouse keys acceleration setting.
   */
  var accel = 0.1;

  /**
   * Holds a reference to the DOM element representing the pointer on top of the 
   * canvas element.
   *
   * @private
   * @type Element
   */
  var pointer = null;
  var pointerStyle = null;

  /**
   * The <code>extensionRegister</code> event handler. This initializes the 
   * extension by adding the pointer DOM element and by setting up the keyboard 
   * shortcuts.
   *
   * @returns {Boolean} True if the extension initialized successfully, or false 
   * if not.
   */
  this.extensionRegister = function () {
    accel = config.mousekeys.accel;

    pointer = doc.createElement('div');
    if (!pointer) {
      return false;
    }
    pointerStyle = pointer.style;

    pointer.className = gui.classPrefix + 'mousekeysPointer';
    pointerStyle.display = 'none';
    container.appendChild(pointer);

    canvas.addEventListener('mousemove', pointerMousemove, false);

    var action, keys, i, n, result = {};

    for (action in config.mousekeys.actions) {
      keys = config.mousekeys.actions[action];

      for (i = 0, n = keys.length; i < n; i++) {
        result[keys[i]] = {'extension': _self._id, 'action': action};
      }
    };

    pwlib.extend(config.keys, result);

    return true;
  };

  /**
   * The <code>extensionUnregister</code> event handler. This will remove the 
   * pointer DOM element and the canvas event listener.
   */
  this.extensionUnregister = function () {
    container.removeChild(pointer);
    canvas.removeEventListener('mousemove', pointerMousemove, false);

    var key, kobj;
    for (key in config.keys) {
      kobj = config.keys[key];
      if (kobj.extension === _self._id) {
        delete config.keys[key];
      }
    }
  };

  /**
   * Track the virtual pointer coordinates, by updating the position of the 
   * <var>pointer</var> element. This allows the keyboard users to see where 
   * they moved the virtual pointer.
   *
   * @param {Event} ev The DOM Event object.
   */
  function pointerMousemove (ev) {
    if (!('kobj_' in ev) || !('extension' in ev.kobj_) ||
        ev.kobj_.extension !== _self._id) {
      if (pointerStyle.display === 'block') {
        pointerStyle.display = 'none';
      }
    }
  };

  /**
   * The <code>keydown</code> event handler.
   *
   * <p>This method requires a DOM Event object which has the 
   * <var>ev.kobj_</var> object reference from the keyboard shortcuts 
   * configuration. The <var>kobj_</var> object must have the <var>action</var> 
   * property. Support for the "ButtonToggle" and the "ButtonClick" actions is 
   * implemented.
   * 
   * <p>The "ButtonToggle" action essentially means that a mouse event will be 
   * generated, either <code>mousedown</code> or <code>mouseup</code>. By 
   * alternating these two events, this method allows the user to start and stop 
   * the drawing operation at any moment using the keyboard shortcut they have 
   * configured.
   *
   * <p>Under typical usage, the "ButtonClick" action translates the 
   * <code>keydown</code> event to <code>mousedown</code>. The 
   * <code>keyup</code> event handler will also fire the <code>mouseup</code> 
   * event. This allows the user to simulate holding down the mouse button, 
   * while he/she holds down a key.
   *
   * <p>A <code>click</code> event is always fired after the firing of 
   * a <code>mouseup</code> event.
   *
   * <p>Irrespective of the key the user pressed, this method does always reset 
   * the speed and acceleration of the pointer movement.
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {Boolean} True if the keyboard shortcut was recognized, or false 
   * if not.
   *
   * @see PaintWeb.config.mousekeys.actions The keyboard shortcuts configuration 
   * object.
   */
  this.keydown = function (ev) {
    speed = 1;
    accel = config.mousekeys.accel;

    if (pointerStyle.display === 'none') {
      pointerStyle.display = 'block';
      pointerStyle.top  = (mouse.y * image.canvasScale) + 'px';
      pointerStyle.left = (mouse.x * image.canvasScale) + 'px';

      if (mouse.buttonDown) {
        pointer.className += ' ' + gui.classPrefix + 'mouseDown';
      } else {
        pointer.className = pointer.className.replace(' ' + gui.classPrefix 
            + 'mouseDown', '');
      }
    }

    tool = app.tool || {};

    switch (ev.kobj_.action) {
      case 'ButtonToggle':
        if (mouse.buttonDown) {
          mouse.buttonDown = false;
          if ('mouseup' in tool) {
            tool.mouseup(ev);
          }
          if ('click' in tool) {
            tool.click(ev);
          }

        } else {
          mouse.buttonDown = true;

          if ('mousedown' in tool) {
            tool.mousedown(ev);
          }
        }
        break;

      case 'ButtonClick':
        if (!mouse.buttonDown) {
          mouse.buttonDown = true;

          if ('mousedown' in tool) {
            tool.mousedown(ev);
          }
        }

        break;

      default:
        return false;
    }

    if (mouse.buttonDown) {
      pointer.className += ' ' + gui.classPrefix + 'mouseDown';
    } else {
      pointer.className = pointer.className.replace(' ' + gui.classPrefix 
          + 'mouseDown', '');
    }

    return true;
  };

  /**
   * The <code>keypress</code> event handler.
   *
   * <p>This method requires a DOM Event object with a <var>ev.kobj_</var> 
   * object reference to the keyboard shortcut configuration. The keyboard 
   * shortcut configuration object must have the <var>action</var> property.
   *
   * <p>This event handler implements support for the following <var>param</var>  
   * values: "SouthWest", "South", "SouthEast", "West", "East", "NorthWest", 
   * "North" and "NorthEast", All of these values indicate the movement 
   * direction. This method generates synthetic <var>movemove</var> events based 
   * on the direction desired, effectively emulating the use of a real pointing 
   * device.
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {Boolean} True if the keyboard shortcut was recognized, or false 
   * if not.
   *
   * @see PaintWeb.config.mousekeys.actions The keyboard shortcuts configuration 
   * object.
   */
  this.keypress = function (ev) {
    if (ev.shiftKey) {
      speed += speed * accel * 3;
    } else {
      speed += speed * accel;
    }

    var step = MathCeil(speed);

    switch (ev.kobj_.action) {
      case 'SouthWest':
        mouse.x -= step;
        mouse.y += step;
        break;
      case 'South':
        mouse.y += step;
        break;
      case 'SouthEast':
        mouse.x += step;
        mouse.y += step;
        break;
      case 'West':
        mouse.x -= step;
        break;
      case 'East':
        mouse.x += step;
        break;
      case 'NorthWest':
        mouse.x -= step;
        mouse.y -= step;
        break;
      case 'North':
        mouse.y -= step;
        break;
      case 'NorthEast':
        mouse.x += step;
        mouse.y -= step;
        break;
      default:
        return false;
    }

    if (mouse.x < 0) {
      mouse.x = 0;
    } else if (mouse.x > image.width) {
      mouse.x = image.width;
    }

    if (mouse.y < 0) {
      mouse.y = 0;
    } else if (mouse.y > image.height) {
      mouse.y = image.height;
    }

    pointerStyle.top  = (mouse.y * image.canvasScale) + 'px';
    pointerStyle.left = (mouse.x * image.canvasScale) + 'px';

    if ('mousemove' in tool) {
      tool.mousemove(ev);
    }

    return true;
  };

  /**
   * The <code>keyup</code> event handler.
   *
   * <p>This method requires a DOM Event object which has the 
   * <var>ev.kobj_</var> object reference from the keyboard shortcuts 
   * configuration. The <var>kobj_</var> object must have the <var>action</var> 
   * property. Support for the "ButtonClick" action is implemented.
   * 
   * <p>Under typical usage, the "ButtonClick" action translates the 
   * <code>keydown</code> event to <code>mousedown</code>. This event handler 
   * fires the <code>mouseup</code> event. This allows the user to simulate 
   * holding down the mouse button, while he/she holds down a key.
   *
   * <p>A <code>click</code> event is always fired after the firing of the 
   * <code>mouseup</code> event.
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {Boolean} True if the keyboard shortcut was recognized, or false 
   * if not.
   *
   * @see PaintWeb.config.mousekeys.actions The keyboard shortcuts configuration 
   * object.
   */
  this.keyup = function (ev) {
    if (ev.kobj_.action == 'ButtonClick' && mouse.buttonDown) {
      mouse.buttonDown = false;

      if ('mouseup' in tool) {
        tool.mouseup(ev);
      }
      if ('click' in tool) {
        tool.click(ev);
      }

      pointer.className = pointer.className.replace(' ' + gui.classPrefix 
          + 'mouseDown', '');
      return true;
    }

    return false;
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

