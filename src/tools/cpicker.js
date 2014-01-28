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
 * $Date: 2014-01-28 12:56:15 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the color picker implementation.
 */

/**
 * @class The color picker tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.tools.cpicker = function (app) {
  var _self        = this,
      colormixer   = app.extensions.colormixer,
      context      = app.layer.context,
      gui          = app.gui,
      lang         = app.lang,
      MathRound    = Math.round,
      mouse        = app.mouse;

  /**
   * Holds the ID of the previously active tool. Once the user completes the 
   * color picking operation, the previous tool is activated.
   *
   * @private
   * @type String
   */
  var prevTool = null;

  /**
   * Holds a reference to the target color input. This is a GUI color input 
   * component.
   *
   * @private
   * @type pwlib.guiColorInput
   */
  var targetInput = null;

  /**
   * Holds the previous color values - before the user started picking 
   * a different color.
   *
   * @private
   * @type Object
   */
  var prevColor = null;

  /**
   * Tells if the color mixer is active for the current target input.
   *
   * @private
   * @type Boolean
   */
  var colormixerActive = false;

  /**
   * Tells if the current color values are accepted by the user. This value is 
   * used by the tool deactivation code.
   *
   * @private
   * @type Boolean
   */
  var colorAccepted = false;

  /**
   * The <code>preActivate</code> event handler. This method checks if the 
   * browser implements the <code>getImageData()</code> context method. If not, 
   * the color picker tool cannot be used.
   */
  this.preActivate = function () {
    // The latest versions of all browsers which implement Canvas, also 
    // implement the getImageData() method. This was only a problem with some 
    // old versions (eg. Opera 9.2).
    if (!context.getImageData) {
      alert(lang.errorCpickerUnsupported);
      return false;
    }

    if (app.tool && app.tool._id) {
      prevTool = app.tool._id;
    }

    return true;
  };

  /**
   * The <code>activate</code> event handler. This method determines the current 
   * target input in the Color Mixer, if any. Canvas shadow rendering is 
   * disallowed.
   */
  this.activate = function () {
    // When the color mixer panel is active, the color picker uses the same 
    // target input.
    if (colormixer && colormixer.targetInput) {
      targetInput = gui.colorInputs[colormixer.targetInput.id];
    }

    if (targetInput) {
      gui.statusShow('cpicker_' + targetInput.id);
    } else {
      gui.statusShow('cpickerNormal');
    }

    app.shadowDisallow();
  };

  /**
   * The <code>deactivate</code> event handler. This method allows shadow 
   * rendering again, and resets the color input values if the user did not 
   * accept the new color.
   */
  this.deactivate = function () {
    if (!colorAccepted && targetInput && prevColor) {
      updateColor(null, true);
    }

    app.shadowAllow();
  };

  /**
   * The <code>mousedown</code> event handler. This method starts the color 
   * picking operation.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousedown = function (ev) {
    // We check again, because the user might have opened/closed the color 
    // mixer.
    if (colormixer && colormixer.targetInput) {
      targetInput = gui.colorInputs[colormixer.targetInput.id];
    }

    if (targetInput) {
      colormixerActive = true;
      gui.statusShow('cpicker_' + targetInput.id);
    } else {
      colormixerActive = false;
      gui.statusShow('cpickerNormal');

      // The context menu (right-click). This is unsupported by Opera.
      // Also allow Shift+Click for changing the stroke color (making it easier for Opera users).
      if (ev.button === 2 || ev.shiftKey) {
        targetInput = gui.colorInputs.strokeStyle;
      } else {
        targetInput = gui.colorInputs.fillStyle;
      }
    }

    updatePrevColor();

    _self.mousemove = updateColor;
    updateColor(ev);

    return true;
  };

  /**
   * Perform color update. This function updates the target input or the Color 
   * Mixer to hold the color value under the mouse - it actually performs the 
   * color picking operation.
   *
   * <p>This function is also the <code>mousemove</code> event handler for this 
   * tool.
   *
   * @param {Event} ev The DOM Event object.
   * @param {Boolean} [usePrevColor=false] Tells the function to use the 
   * previous color values we have stored. This is used when the user cancels 
   * the color picking operation.
   */
  function updateColor (ev, usePrevColor) {
    if (!targetInput) {
      return;
    }

    var p = usePrevColor ? prevColor :
              context.getImageData(mouse.x, mouse.y, 1, 1),
        color = {
          red:    p.data[0] / 255,
          green:  p.data[1] / 255,
          blue:   p.data[2] / 255,
          alpha: (p.data[3] / 255).toFixed(3)
        };

    if (colormixerActive) {
      colormixer.color.red   = color.red;
      colormixer.color.green = color.green;
      colormixer.color.blue  = color.blue;
      colormixer.color.alpha = color.alpha;
      colormixer.update_color('rgb');

    } else {
      targetInput.updateColor(color);
    }
  };

  /**
   * The <code>mouseup</code> event handler. This method completes the color 
   * picking operation, and activates the previous tool.
   *
   * <p>The {@link pwlib.appEvent.configChange} application event is also 
   * dispatched for the configuration property associated to the target input.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mouseup = function (ev) {
    if (!targetInput) {
      return false;
    }

    delete _self.mousemove;
    updateColor(ev);
    colorAccepted = true;

    if (!colormixerActive) {
      var color = targetInput.color,
          configProperty = targetInput.configProperty,
          configGroup    = targetInput.configGroup,
          configGroupRef = targetInput.configGroupRef,
          prevVal = configGroupRef[configProperty],
          newVal  = 'rgba(' + MathRound(color.red   * 255) + ',' +
                              MathRound(color.green * 255) + ',' +
                              MathRound(color.blue  * 255) + ',' +
                              color.alpha + ')';

      if (prevVal !== newVal) {
        configGroupRef[configProperty] = newVal;
        app.events.dispatch(new pwlib.appEvent.configChange(newVal, prevVal, 
            configProperty, configGroup, configGroupRef));
      }
    }

    if (prevTool) {
      app.toolActivate(prevTool, ev);
    }

    return true;
  };

  /**
   * The <code>keydown</code> event handler. This method allows the user to 
   * press the <kbd>Escape</kbd> key to cancel the color picking operation. By 
   * doing so, the original color values are restored.
   *
   * @param {Event} ev The DOM Event object.
   * @returns {Boolean} True if the keyboard shortcut was recognized, or false 
   * if not.
   */
  this.keydown = function (ev) {
    if (!prevTool || ev.kid_ !== 'Escape') {
      return false;
    }

    mouse.buttonDown = false;
    app.toolActivate(prevTool, ev);

    return true;
  };

  /**
   * The <code>contextmenu</code> event handler. This method only cancels the 
   * context menu.
   */
  // Unfortunately, the contextmenu event is unsupported by Opera.
  this.contextmenu = function () {
    return true;
  };

  /**
   * Store the color values from the target color input, before this tool 
   * changes the colors. The previous color values are used when the user 
   * decides to cancel the color picking operation.
   * @private
   */
  function updatePrevColor () {
    // If the color mixer panel is visible, then we store the color values from 
    // the color mixer, instead of those from the color input object.
    var color = colormixerActive ? colormixer.color : targetInput.color;

    prevColor = {
      width: 1,
      height: 1,
      data: [
        MathRound(color.red   * 255),
        MathRound(color.green * 255),
        MathRound(color.blue  * 255),
        color.alpha * 255
      ]
    };
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

