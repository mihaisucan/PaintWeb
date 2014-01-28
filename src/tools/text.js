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
 * $Date: 2014-01-28 13:07:03 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the text tool implementation.
 */

// TODO: make this tool nicer to use.

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
      MathRound     = Math.round,
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

  var inputString = null,
      input_fontFamily = null,
      ev_configChangeId = null,
      ns_svg = "http://www.w3.org/2000/svg",
      svgDoc = null,
      svgText = null,
      textWidth = 0,
      textHeight = 0;

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

    }

    // Canvas 2D Text API
    if (context.fillText && context.strokeText) {
      return true;
    }

    // Opera can only render text via SVG Text.
    // Note: support for Opera has been disabled.
    // There are severe SVG redraw issues when updating the SVG text element.
    // Besides, there are important memory leaks.
    // Ultimately, there's a deal breaker: security violation. The SVG document 
    // which is rendered inside Canvas is considered "external" 
    // - get/putImageData() and toDataURL() stop working after drawImage(svg) is 
    // invoked. Eh.
    /*if (pwlib.browser.opera) {
      return true;
    }*/

    // Gecko 1.9.0 had its own proprietary Canvas 2D Text API.
    if (context.mozPathText) {
      return true;
    }

    alert(lang.errorTextUnsupported);
    return false;
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
    inputString = gui.inputs.textString;

    if (!context.fillText && pwlib.browser.opera) {
      ev_configChangeId = app.events.add('configChange', ev_configChange_opera);
      inputString.addEventListener('input',  ev_configChange_opera, false);
      inputString.addEventListener('change', ev_configChange_opera, false);
    } else {
      ev_configChangeId = app.events.add('configChange', ev_configChange);
      inputString.addEventListener('input',  ev_configChange, false);
      inputString.addEventListener('change', ev_configChange, false);
    }

    // Render text using the Canvas 2D context text API defined by HTML 5.
    if (context.fillText && context.strokeText) {
      _self.draw = _self.draw_spec;

    } else if (pwlib.browser.opera) {
      // Render text using a SVG Text element which is copied into Canvas using 
      // drawImage().
      _self.draw = _self.draw_opera;
      initOpera();

    } else if (context.mozPathText) {
      // Render text using proprietary API available in Gecko 1.9.0.
      _self.draw = _self.draw_moz;
      textWidth = context.mozMeasureText(inputString.value);
    }

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

    if (!context.fillText && pwlib.browser.opera) {
      inputString.removeEventListener('input',  ev_configChange_opera, false);
      inputString.removeEventListener('change', ev_configChange_opera, false);
    } else {
      inputString.removeEventListener('input',  ev_configChange, false);
      inputString.removeEventListener('change', ev_configChange, false);
    }

    svgText = null;
    svgDoc = null;

    context.clearRect(0, 0, image.width, image.height);

    return true;
  };

  /**
   * Initialize the SVG document for Opera. This is used for rendering the text.
   * @private
   */
  function initOpera () {
    svgDoc = doc.createElementNS(ns_svg, 'svg');
    svgDoc.setAttributeNS(ns_svg, 'version', '1.1');

    svgText = doc.createElementNS(ns_svg, 'text');
    svgText.appendChild(doc.createTextNode(inputString.value));
    svgDoc.appendChild(svgText);

    svgText.style.font = context.font;

    if (app.config.shapeType !== 'stroke') {
      svgText.style.fill = context.fillStyle;
    } else {
      svgText.style.fill = 'none';
    }

    if (app.config.shapeType !== 'fill') {
      svgText.style.stroke = context.strokeStyle;
      svgText.style.strokeWidth = context.lineWidth;
    } else {
      svgText.style.stroke = 'none';
      svgText.style.strokeWidth = context.lineWidth;
    }

    textWidth  = svgText.getComputedTextLength();
    textHeight = svgText.getBBox().height;

    svgDoc.setAttributeNS(ns_svg, 'width',  textWidth);
    svgDoc.setAttributeNS(ns_svg, 'height', textHeight + 10);
    svgText.setAttributeNS(ns_svg, 'x', 0);
    svgText.setAttributeNS(ns_svg, 'y', textHeight);
  };

  /**
   * The <code>configChange</code> application event handler. This is also the 
   * <code>input</code> and <code>change</code> event handler for the text 
   * string input element.  This method updates the Canvas text-related 
   * properties as needed, and re-renders the text.
   *
   * <p>This function is not used on Opera.
   *
   * @param {Event|pwlib.appEvent.configChange} ev The application/DOM event 
   * object.
   */
  function ev_configChange (ev) {
    if (ev.type === 'input' || ev.type === 'change' ||
        (!ev.group && ev.config === 'shapeType') ||
        (ev.group === 'line' && ev.config === 'lineWidth')) {
      needsRedraw = true;

      // Update the text width.
      if (!context.fillText && context.mozMeasureText) {
        textWidth = context.mozMeasureText(inputString.value);
      }
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

        if ('mozTextStyle' in context) {
          context.mozTextStyle = font;
        }

      case 'textAlign':
      case 'textBaseline':
        needsRedraw = true;
    }

    // Update the text width.
    if (ev.config !== 'textAlign' && ev.config !== 'textBaseline' && 
        !context.fillText && context.mozMeasureText) {
      textWidth = context.mozMeasureText(inputString.value);
    }
  };

  /**
   * The <code>configChange</code> application event handler. This is also the 
   * <code>input</code> and <code>change</code> event handler for the text 
   * string input element.  This method updates the Canvas text-related 
   * properties as needed, and re-renders the text.
   *
   * <p>This is function is specific to Opera.
   *
   * @param {Event|pwlib.appEvent.configChange} ev The application/DOM event 
   * object.
   */
  function ev_configChange_opera (ev) {
    if (ev.type === 'input' || ev.type === 'change') {
      svgText.replaceChild(doc.createTextNode(this.value), svgText.firstChild);
      needsRedraw = true;
    }

    if (!ev.group && ev.config === 'shapeType') {
      if (ev.value !== 'stroke') {
        svgText.style.fill = context.fillStyle;
      } else {
        svgText.style.fill = 'none';
      }

      if (ev.value !== 'fill') {
        svgText.style.stroke = context.strokeStyle;
        svgText.style.strokeWidth = context.lineWidth;
      } else {
        svgText.style.stroke = 'none';
        svgText.style.strokeWidth = context.lineWidth;
      }
      needsRedraw = true;
    }

    if (!ev.group && ev.config === 'fillStyle') {
      if (app.config.shapeType !== 'stroke') {
        svgText.style.fill = ev.value;
        needsRedraw = true;
      }
    }

    if ((!ev.group && ev.config === 'strokeStyle') ||
        (ev.group === 'line' && ev.config === 'lineWidth')) {
      if (app.config.shapeType !== 'fill') {
        svgText.style.stroke = context.strokeStyle;
        svgText.style.strokeWidth = context.lineWidth;
        needsRedraw = true;
      }
    }

    if (ev.type === 'configChange' && ev.group === 'text') {
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
          svgText.style.font = font;

        case 'textAlign':
        case 'textBaseline':
          needsRedraw = true;
      }
    }

    textWidth  = svgText.getComputedTextLength();
    textHeight = svgText.getBBox().height;

    svgDoc.setAttributeNS(ns_svg, 'width',  textWidth);
    svgDoc.setAttributeNS(ns_svg, 'height', textHeight + 10);
    svgText.setAttributeNS(ns_svg, 'x', 0);
    svgText.setAttributeNS(ns_svg, 'y', textHeight);
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
   * Perform the drawing operation using standard 2D context methods.
   *
   * @see PaintWeb.config.toolDrawDelay
   */
  this.draw_spec = function () {
    if (!needsRedraw) {
      return;
    }

    context.clearRect(0, 0, image.width, image.height);

    if (app.config.shapeType != 'stroke') {
      context.fillText(inputString.value, mouse.x, mouse.y);
    }

    if (app.config.shapeType != 'fill') {
      context.beginPath();
      context.strokeText(inputString.value, mouse.x, mouse.y);
      context.closePath();
    }

    needsRedraw = false;
  };

  /**
   * Perform the drawing operation in Gecko 1.9.0.
   */
  this.draw_moz = function () {
    if (!needsRedraw) {
      return;
    }

    context.clearRect(0, 0, image.width, image.height);

    var x = mouse.x,
        y = mouse.y;

    if (config.textAlign === 'center') {
      x -= MathRound(textWidth / 2);
    } else if (config.textAlign === 'right') {
      x -= textWidth;
    }

    if (config.textBaseline === 'top') {
      y += config.fontSize;
    } else if (config.textBaseline === 'middle') {
      y += MathRound(config.fontSize / 2);
    }

    context.setTransform(1, 0, 0, 1, x, y);
    context.beginPath();
    context.mozPathText(inputString.value);

    if (app.config.shapeType != 'stroke') {
      context.fill();
    }

    if (app.config.shapeType != 'fill') {
      context.stroke();
    }
    context.closePath();
    context.setTransform(1, 0, 0, 1, 0, 0);

    needsRedraw = false;
  };

  /**
   * Perform the drawing operation in Opera using SVG.
   */
  this.draw_opera = function () {
    if (!needsRedraw) {
      return;
    }

    context.clearRect(0, 0, image.width, image.height);

    var x = mouse.x,
        y = mouse.y;

    if (config.textAlign === 'center') {
      x -= MathRound(textWidth / 2);
    } else if (config.textAlign === 'right') {
      x -= textWidth;
    }

    if (config.textBaseline === 'bottom') {
      y -= textHeight;
    } else if (config.textBaseline === 'middle') {
      y -= MathRound(textHeight / 2);
    }

    context.drawImage(svgDoc, x, y);

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

