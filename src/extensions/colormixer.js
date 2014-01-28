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
 * $Date: 2014-01-28 12:48:53 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the implementation of the Color Mixer dialog.
 */

// For the implementation of this extension I used the following references:
// - Wikipedia articles on each subject.
// - the great brucelindbloom.com Web site - lots of information.

/**
 * @class The Color Mixer extension.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.extensions.colormixer = function (app) {
  var _self     = this,
      config    = app.config.colormixer,
      doc       = app.doc,
      gui       = app.gui,
      lang      = app.lang.colormixer,
      MathFloor = Math.floor,
      MathMax   = Math.max,
      MathMin   = Math.min,
      MathPow   = Math.pow,
      MathRound = Math.round,
      resScale  = app.resolution.scale;

  /**
   * Holds references to various DOM elements.
   *
   * @private
   * @type Object
   */
  this.elems = {
    /**
     * Reference to the element which holds Canvas controls (the dot on the 
     * Canvas, and the slider).
     * @type Element
     */
    'controls': null,

    /**
     * Reference to the dot element that is rendered on top of the color space 
     * visualisation.
     * @type Element
     */
    'chartDot': null,

    /**
     * Reference to the slider element.
     * @type Element
     */
    'slider': null,

    /**
     * Reference to the input element that allows the user to pick the color 
     * palette to be displayed.
     * @type Element
     */
    'cpaletteInput': null,

    /**
     * The container element which holds the colors of the currently selected 
     * palette.
     * @type Element
     */
    'cpaletteOutput': null,

    /**
     * Reference to the element which displays the current color.
     * @type Element
     */
    "colorActive": null,

    /**
     * Reference to the element which displays the old color.
     * @type Element
     */
    "colorOld": null
  };

  /**
   * Reference to the Color Mixer floating panel GUI component object.
   *
   * @private
   * @type pwlib.guiFloatingPanel
   */
  this.panel = null;

  /**
   * Reference to the Color Mixer tab panel GUI component object which holds the 
   * inputs.
   *
   * @private
   * @type pwlib.guiTabPanel
   */
  this.panelInputs = null;

  /**
   * Reference to the Color Mixer tab panel GUI component object which holds the 
   * Canvas used for color space visualisation and the color palettes selector.
   *
   * @private
   * @type pwlib.guiTabPanel
   */
  this.panelSelector = null;

  /**
   * Holds a reference to the 2D context of the color mixer Canvas element. This 
   * is where the color chart and the slider are both drawn.
   *
   * @private
   * @type CanvasRenderingContext2D
   */
  this.context2d = false;

  /**
   * Target input hooks. This object must hold two methods:
   *
   * <ul>
   *   <li><code>show()</code> which is invoked by this extension when the Color 
   *   Mixer panel shows up on screen.
   *
   *   <li><code>hide()</code> which is invoked when the Color Mixer panel is 
   *   hidden from the screen.
   * </ul>
   *
   * <p>The object must also hold information about the associated configuration 
   * property: <var>configProperty</var>, <var>configGroup</var> and 
   * <var>configGroupRef</var>.
   *
   * @type Object
   */
  this.targetInput = null;

  /**
   * Holds the current color in several formats: RGB, HEX, HSV, CIE Lab, and 
   * CMYK. Except for 'hex', all the values should be from 0 to 1.
   *
   * @type Object
   */
  this.color = {
    // RGB
    red  : 0,
    green: 0,
    blue : 0,

    alpha : 0,
    hex   : 0,

    // HSV
    hue : 0,
    sat : 0,
    val : 0,

    // CMYK
    cyan    : 0,
    magenta : 0,
    yellow  : 0,
    black   : 0,

    // CIE Lab
    cie_l : 0,
    cie_a : 0,
    cie_b : 0
  };

  /**
   * Holds references to all the DOM input fields, for each color channel.
   *
   * @private
   * @type Object
   */
  this.inputs = {
    red   : null,
    green : null,
    blue  : null,

    alpha : null,
    hex   : null,

    hue : null,
    sat : null,
    val : null,

    cyan    : null,
    magenta : null,
    yellow  : null,
    black   : null,

    cie_l : null,
    cie_a : null,
    cie_b : null
  };

  /**
   * The "absolute maximum" value is determined based on the min/max values.  
   * For min -100 and max 100, the abs_max is 200.
   * @private
   *
   */
  this.abs_max  = {};

  // The hue spectrum used by the HSV charts.
  var hueSpectrum = [
    [255,   0,   0], // 0, Red,       0°
    [255, 255,   0], // 1, Yellow,   60°
    [  0, 255,   0], // 2, Green,   120°
    [  0, 255, 255], // 3, Cyan,    180°
    [  0,   0, 255], // 4, Blue,    240°
    [255,   0, 255], // 5, Magenta, 300°
    [255,   0,   0]  // 6, Red,     360°
  ];

  // The active color key (input) determines how the color chart works.
  this.ckey_active = 'red';

  // Given a group of the inputs: red, green and blue, when one of them is active, the ckey_adjoint is set to an array of the other two input IDs.
  this.ckey_adjoint = false;
  this.ckey_active_group = false;

  this.ckey_grouping = {
    'red'   : 'rgb',
    'green' : 'rgb',
    'blue'  : 'rgb',

    'hue' : 'hsv',
    'sat' : 'hsv',
    'val' : 'hsv',

    'cyan'    : 'cmyk',
    'magenta' : 'cmyk',
    'yellow'  : 'cmyk',
    'black'   : 'cmyk',

    'cie_l' : 'lab',
    'cie_a' : 'lab',
    'cie_b' : 'lab'
  };

  // These values are automatically calculated when the color mixer is 
  // initialized.
  this.sliderX = 0;
  this.sliderWidth = 0;
  this.sliderHeight = 0;
  this.sliderSpacing = 0;
  this.chartWidth = 0;
  this.chartHeight = 0;

  /**
   * Register the Color Mixer extension.
   *
   * @returns {Boolean} True if the extension can be registered properly, or 
   * false if not.
   */
  this.extensionRegister = function (ev) {
    if (!gui.elems || !gui.elems.colormixer_canvas || !gui.floatingPanels || 
        !gui.floatingPanels.colormixer || !gui.tabPanels || 
        !gui.tabPanels.colormixer_inputs || !gui.tabPanels.colormixer_selector 
        || !_self.init_lab()) {
      return false;
    }

    _self.panel = gui.floatingPanels.colormixer;
    _self.panelSelector = gui.tabPanels.colormixer_selector;
    _self.panelInputs = gui.tabPanels.colormixer_inputs;

    // Initialize the color mixer Canvas element.
    _self.context2d = gui.elems.colormixer_canvas.getContext('2d');
    if (!_self.context2d) {
      return false;
    }

    // Setup the color mixer inputs.
    var elem, label, labelElem,
        inputValues = config.inputValues,
        form = _self.panelInputs.container;
    if (!form) {
      return false;
    }

    for (var i in _self.inputs) {
      elem = form.elements.namedItem('ckey_' + i) || gui.inputs['ckey_' + i];
      if (!elem) {
        return false;
      }

      if (i === 'hex' || i === 'alpha') {
        label = lang.inputs[i];
      } else {
        label = lang.inputs[_self.ckey_grouping[i] + '_' + i];
      }

      labelElem = elem.parentNode;
      labelElem.replaceChild(doc.createTextNode(label), labelElem.firstChild);

      elem.addEventListener('input',  _self.ev_input_change, false);
      elem.addEventListener('change', _self.ev_input_change, false);

      if (i !== 'hex') {
        elem.setAttribute('step', inputValues[i][2]);

        elem.setAttribute('max', MathRound(inputValues[i][1]));
        elem.setAttribute('min', MathRound(inputValues[i][0]));
        _self.abs_max[i] = inputValues[i][1] - inputValues[i][0];
      }

      // Store the color key, which is used by the event handler.
      elem._ckey = i;
      _self.inputs[i] = elem;
    }

    // Setup the ckey inputs of type=radio.
    var ckey = form.ckey;
    if (!ckey) {
      return false;
    }
    for (var i = 0, n = ckey.length; i < n; i++) {
      elem = ckey[i];
      if (_self.ckey_grouping[elem.value] === 'lab' && 
          !_self.context2d.putImageData) {
        elem.disabled = true;
        continue;
      }

      elem.addEventListener('change', _self.ev_change_ckey_active, false);

      if (elem.value === _self.ckey_active) {
        elem.checked = true;
        _self.update_ckey_active(_self.ckey_active, true);
      }
    }

    // Prepare the color preview elements.
    _self.elems.colorActive = gui.elems.colormixer_colorActive.firstChild;
    _self.elems.colorOld = gui.elems.colormixer_colorOld.firstChild;
    _self.elems.colorOld.addEventListener('click', _self.ev_click_color, false);

    // Make sure the buttons work properly.
    var anchor, btn, buttons = ['accept', 'cancel', 'saveColor', 'pickColor'];
    for (var i = 0, n = buttons.length; i < n; i++) {
      btn = gui.elems['colormixer_btn_' + buttons[i]];
      if (!btn) {
        continue;
      }

      anchor = doc.createElement('a');
      anchor.href = '#';
      anchor.appendChild(doc.createTextNode(lang.buttons[buttons[i]]));
      anchor.addEventListener('click', _self['ev_click_' + buttons[i]], false);

      btn.replaceChild(anchor, btn.firstChild);
    }

    // Prepare the canvas "controls" (the chart "dot" and the slider).
    var id, elems = ['controls', 'chartDot', 'slider'];
    for (var i = 0, n = elems.length; i < n; i++) {
      id = elems[i];
      elem = gui.elems['colormixer_' + id];
      if (!elem) {
        return false;
      }

      elem.addEventListener('mousedown', _self.ev_canvas, false);
      elem.addEventListener('mousemove', _self.ev_canvas, false);
      elem.addEventListener('mouseup',   _self.ev_canvas, false);

      _self.elems[id] = elem;
    }

    // The color palette <select>.
    _self.elems.cpaletteInput = gui.inputs.colormixer_cpaletteInput;
    _self.elems.cpaletteInput.addEventListener('change', 
        _self.ev_change_cpalette, false);

    // Add the list of color palettes into the <select>.
    var palette;
    for (var i in config.colorPalettes) {
      palette = config.colorPalettes[i];
      elem = doc.createElement('option');
      elem.value = i;
      if (i === config.paletteDefault) {
        elem.selected = true;
      }

      elem.appendChild( doc.createTextNode(lang.colorPalettes[i]) );
      _self.elems.cpaletteInput.appendChild(elem);
    }

    // This is the ordered list where we add each color (list item).
    _self.elems.cpaletteOutput = gui.elems.colormixer_cpaletteOutput;
    _self.elems.cpaletteOutput.addEventListener('click', _self.ev_click_color, 
        false);

    _self.cpalette_load(config.paletteDefault);

    // Make sure the Canvas element scale is in sync with the application.
    app.events.add('canvasSizeChange', _self.update_dimensions);

    _self.panelSelector.events.add('guiTabActivate', _self.ev_tabActivate);

    // Make sure the Color Mixer is properly closed when the floating panel is 
    // closed.
    _self.panel.events.add('guiFloatingPanelStateChange', 
        _self.ev_panel_stateChange);

    return true;
  };

  /**
   * This function calculates lots of values used by the other CIE Lab-related 
   * functions.
   *
   * @private
   * @returns {Boolean} True if the initialization was successful, or false if 
   * not.
   */
  this.init_lab = function () {
    var cfg = config.lab;
    if (!cfg) {
      return false;
    }

    // Chromaticity coordinates for the RGB primaries.
    var x0_r = cfg.x_r,
        y0_r = cfg.y_r,
        x0_g = cfg.x_g,
        y0_g = cfg.y_g,
        x0_b = cfg.x_b,
        y0_b = cfg.y_b,

        // The reference white point (xyY to XYZ).
        w_x = cfg.ref_x / cfg.ref_y,
        w_y = 1,
        w_z = (1 - cfg.ref_x - cfg.ref_y) / cfg.ref_y;

    cfg.w_x = w_x;
    cfg.w_y = w_y;
    cfg.w_z = w_z;

    // Again, xyY to XYZ for each RGB primary. Y=1.
    var x_r = x0_r / y0_r,
        y_r = 1,
        z_r = (1 - x0_r - y0_r) / y0_r,
        x_g = x0_g / y0_g,
        y_g = 1,
        z_g = (1 - x0_g - y0_g) / y0_g,
        x_b = x0_b / y0_b,
        y_b = 1,
        z_b = (1 - x0_b - y0_b) / y0_b,
        m   = [x_r, y_r, z_r,
               x_g, y_g, z_g,
               x_b, y_b, z_b],
        m_i = _self.calc_m3inv(m),
        s   = _self.calc_m1x3([w_x, w_y, w_z], m_i);

    // The 3x3 matrix used by rgb2xyz().
    m = [s[0] * m[0], s[0] * m[1], s[0] * m[2],
         s[1] * m[3], s[1] * m[4], s[1] * m[5],
         s[2] * m[6], s[2] * m[7], s[2] * m[8]];

    // The matrix inverse, used by xyz2rgb();
    cfg.m_i = _self.calc_m3inv(m);
    cfg.m   = m;

    // Now determine the min/max values for a and b.

    var xyz = _self.rgb2xyz([0, 1, 0]), // green gives the minimum value for a
        lab = _self.xyz2lab(xyz),
        values = config.inputValues;
    values.cie_a[0] = lab[1];

    xyz = _self.rgb2xyz([1, 0, 1]);     // magenta gives the maximum value for a
    lab = _self.xyz2lab(xyz);
    values.cie_a[1] = lab[1];

    xyz = _self.rgb2xyz([0, 0, 1]);     // blue gives the minimum value for b
    lab = _self.xyz2lab(xyz);
    values.cie_b[0] = lab[2];

    xyz = _self.rgb2xyz([1, 1, 0]);     // yellow gives the maximum value for b
    lab = _self.xyz2lab(xyz);
    values.cie_b[1] = lab[2];

    return true;
  };

  /**
   * The <code>guiTabActivate</code> event handler for the tab panel which holds 
   * the color mixer and the color palettes. When switching back to the color 
   * mixer, this method updates the Canvas.
   *
   * @private
   * @param {pwlib.appEvent.guiTabActivate} ev The application event object.
   */
  this.ev_tabActivate = function (ev) {
    if (ev.tabId === 'mixer' && _self.update_canvas_needed) {
      _self.update_canvas(null, true);
    }
  };

  /**
   * The <code>click</code> event handler for the Accept button. This method 
   * dispatches the {@link pwlib.appEvent.configChange} application event for 
   * the configuration property associated to the target input, and hides the 
   * Color Mixer floating panel.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  this.ev_click_accept = function (ev) {
    ev.preventDefault();

    var configProperty = _self.targetInput.configProperty,
        configGroup    = _self.targetInput.configGroup,
        configGroupRef = _self.targetInput.configGroupRef,
        prevVal = configGroupRef[configProperty],
        newVal  = 'rgba(' + MathRound(_self.color.red   * 255) + ',' +
                            MathRound(_self.color.green * 255) + ',' +
                            MathRound(_self.color.blue  * 255) + ',' +
                            _self.color.alpha + ')';

    _self.hide();

    if (prevVal !== newVal) {
      configGroupRef[configProperty] = newVal;
      app.events.dispatch(new pwlib.appEvent.configChange(newVal, prevVal, 
          configProperty, configGroup, configGroupRef));
    }
  };

  /**
   * The <code>click</code> event handler for the Cancel button. This method 
   * hides the Color Mixer floating panel.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  this.ev_click_cancel = function (ev) {
    ev.preventDefault();
    _self.hide();
  };

  /**
   * The <code>click</code> event handler for the "Save color" button. This 
   * method adds the current color into the "_saved" color palette.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  // TODO: provide a way to save the color palette permanently. This should use 
  // some application event.
  this.ev_click_saveColor = function (ev) {
    ev.preventDefault();

    var color = [_self.color.red, _self.color.green, _self.color.blue],
        saved = config.colorPalettes._saved;

    saved.colors.push(color);

    _self.elems.cpaletteInput.value = '_saved';
    _self.cpalette_load('_saved');
    _self.panelSelector.tabActivate('cpalettes');

    return true;
  };

  /**
   * The <code>click</code> event handler for the "Pick color" button. This 
   * method activates the color picker tool.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  this.ev_click_pickColor = function (ev) {
    ev.preventDefault();
    app.toolActivate('cpicker', ev);
  };

  /**
   * The <code>change</code> event handler for the color palette input element.  
   * This loads the color palette the user selected.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  this.ev_change_cpalette = function (ev) {
    _self.cpalette_load(this.value);
  };

  /**
   * Load a color palette. Loading is performed asynchronously.
   *
   * @param {String} id The color palette ID.
   *
   * @returns {Boolean} True if the load was successful, or false if not.
   */
  this.cpalette_load = function (id) {
    if (!id || !(id in config.colorPalettes)) {
      return false;
    }

    var palette = config.colorPalettes[id];

    if (palette.file) {
      pwlib.xhrLoad(PaintWeb.baseFolder + palette.file, this.cpalette_loaded);

      return true;

    } else if (palette.colors) {
      return this.cpalette_show(palette.colors);

    } else {
      return false;
    }
  };

  /**
   * The <code>onreadystatechange</code> event handler for the color palette 
   * XMLHttpRequest object.
   *
   * @private
   * @param {XMLHttpRequest} xhr The XMLHttpRequest object.
   */
  this.cpalette_loaded = function (xhr) {
    if (!xhr || xhr.readyState !== 4) {
      return;
    }

    if ((xhr.status !== 304 && xhr.status !== 200) || !xhr.responseText) {
      alert(lang.failedColorPaletteLoad);
      return;
    }

    var colors = JSON.parse(xhr.responseText);
    xhr = null;
    _self.cpalette_show(colors);
  };

  /**
   * Show a color palette. This method adds all the colors in the DOM as 
   * individual anchor elements which users can click on.
   *
   * @private
   *
   * @param {Array} colors The array which holds each color in the palette.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   */
  this.cpalette_show = function (colors) {
    if (!colors || !(colors instanceof Array)) {
      return false;
    }

    var color, anchor, rgbValue,
        frag = doc.createDocumentFragment(),
        dest = this.elems.cpaletteOutput;

    dest.style.display = 'none';
    while (dest.hasChildNodes()) {
      dest.removeChild(dest.firstChild);
    }

    for (var i = 0, n = colors.length; i < n; i++) {
      color = colors[i];

      // Do not allow values higher than 1.
      color[0] = MathMin(1, color[0]);
      color[1] = MathMin(1, color[1]);
      color[2] = MathMin(1, color[2]);

      rgbValue = 'rgb(' + MathRound(color[0] * 255) + ',' +
          MathRound(color[1] * 255) + ',' +
          MathRound(color[2] * 255) + ')';

      anchor = doc.createElement('a');
      anchor.href = '#';
      anchor._color = color;
      anchor.style.backgroundColor = rgbValue;
      anchor.appendChild(doc.createTextNode(rgbValue));

      frag.appendChild(anchor);
    }

    dest.appendChild(frag);
    dest.style.display = 'block';

    colors = frag = null;

    return true;
  };

  /**
   * The <code>click</code> event handler for colors in the color palette list.  
   * This event handler is also used for the "old color" element. This method 
   * updates the color mixer to use the color the user picked.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  this.ev_click_color = function (ev) {
    var color = ev.target._color;
    if (!color) {
      return;
    }

    ev.preventDefault();

    _self.color.red   = color[0];
    _self.color.green = color[1];
    _self.color.blue  = color[2];

    if (typeof(color[3]) !== 'undefined') {
      _self.color.alpha = color[3];
    }

    _self.update_color('rgb');
  };

  /**
   * Recalculate the dimensions and coordinates for the slider and for the color 
   * space visualisation within the Canvas element.
   *
   * <p>This method is an event handler for the {@link 
   * pwlib.appEvent.canvasSizeChange} application event.
   *
   * @private
   */
  this.update_dimensions = function () {
    if (resScale === app.resolution.scale) {
      return;
    }

    resScale = app.resolution.scale;

    var canvas  = _self.context2d.canvas,
        width   = canvas.width,
        height  = canvas.height,
        sWidth  = width  / resScale,
        sHeight = height / resScale,
        style;

    _self.sliderWidth   = MathRound(width * config.sliderWidth);
    _self.sliderHeight  = height - 1;
    _self.sliderSpacing = MathRound(width * config.sliderSpacing);
    _self.sliderX       = width - _self.sliderWidth - 2;
    _self.chartWidth    = _self.sliderX - _self.sliderSpacing;
    _self.chartHeight   = height;

    style = _self.elems.controls.style;
    style.width  = sWidth  + 'px';
    style.height = sHeight + 'px';

    style = _self.elems.slider.style;
    style.width = (_self.sliderWidth / resScale) + 'px';
    style.left  = (_self.sliderX     / resScale) + 'px';

    style = canvas.style;
    style.width  = sWidth  + 'px';
    style.height = sHeight + 'px';

    if (_self.panel.state !== _self.panel.STATE_HIDDEN) {
      _self.update_canvas();
    }
  };

  /**
   * Calculate the product of two matrices.
   *
   * <p>Matrices are one-dimensional arrays of the form <code>[a0, a1, a2, ..., 
   * b0, b1, b2, ...]</code> where each element from the matrix is given in 
   * order, from the left to the right, row by row from the top to the bottom.
   *
   * @param {Array} a The first matrix must be one row and three columns.
   * @param {Array} b The second matrix must be three rows and three columns.
   *
   * @returns {Array} The matrix product, one row and three columns.
   */
  // Note: for obvious reasons, this method is not a full-fledged matrix product 
  // calculator. It's as simple as possible - fitting only the very specific 
  // needs of the color mixer.
  this.calc_m1x3 = function (a, b) {
    if (!(a instanceof Array) || !(b instanceof Array)) {
      return false;
    } else {
      return [
        a[0] * b[0] + a[1] * b[3] + a[2] * b[6], // x
        a[0] * b[1] + a[1] * b[4] + a[2] * b[7], // y
        a[0] * b[2] + a[1] * b[5] + a[2] * b[8]  // z
      ];
    }
  };

  /**
   * Calculate the matrix inverse.
   *
   * <p>Matrices are one-dimensional arrays of the form <code>[a0, a1, a2, ..., 
   * b0, b1, b2, ...]</code> where each element from the matrix is given in 
   * order, from the left to the right, row by row from the top to the bottom.
   *
   * @private
   *
   * @param {Array} m The square matrix which must have three rows and three 
   * columns.
   *
   * @returns {Array|false} The computed matrix inverse, or false if the matrix 
   * determinant was 0 - the given matrix is not invertible.
   */
  // Note: for obvious reasons, this method is not a full-fledged matrix inverse 
  // calculator. It's as simple as possible - fitting only the very specific 
  // needs of the color mixer.
  this.calc_m3inv = function (m) {
    if (!(m instanceof Array)) {
      return false;
    }

    var d = (m[0]*m[4]*m[8] + m[1]*m[5]*m[6] + m[2]*m[3]*m[7]) -
            (m[2]*m[4]*m[6] + m[5]*m[7]*m[0] + m[8]*m[1]*m[3]);

    // Matrix determinant is 0: the matrix is not invertible.
    if (d === 0) {
      return false;
    }

    var i = [
       m[4]*m[8] - m[5]*m[7], -m[3]*m[8] + m[5]*m[6],  m[3]*m[7] - m[4]*m[6],
      -m[1]*m[8] + m[2]*m[7],  m[0]*m[8] - m[2]*m[6], -m[0]*m[7] + m[1]*m[6],
       m[1]*m[5] - m[2]*m[4], -m[0]*m[5] + m[2]*m[3],  m[0]*m[4] - m[1]*m[3]
    ];

    i = [1/d * i[0], 1/d * i[3], 1/d * i[6],
         1/d * i[1], 1/d * i[4], 1/d * i[7],
         1/d * i[2], 1/d * i[5], 1/d * i[8]];

    return i;
  };

  /**
   * The <code>change</code> event handler for the Color Mixer inputs of 
   * type=radio. This method allows users to change the active color key - used 
   * for the color space visualisation.
   * @private
   */
  this.ev_change_ckey_active = function () {
    if (this.value && this.value !== _self.ckey_active) {
      _self.update_ckey_active(this.value);
    }
  };

  /**
   * Update the active color key. This method updates the Canvas accordingly.
   *
   * @private
   *
   * @param {String} ckey The color key you want to be active.
   * @param {Boolean} [only_vars] Tells if you want only the variables to be 
   * updated - no Canvas updates. This is true only during the Color Mixer 
   * initialization.
   *
   * @return {Boolean} True if the operation was successful, or false if not.
   */
  this.update_ckey_active = function (ckey, only_vars) {
    if (!_self.inputs[ckey]) {
      return false;
    }

    _self.ckey_active = ckey;

    var  adjoint = [], group = _self.ckey_grouping[ckey];

    // Determine the adjoint color keys. For example, if red is active, then adjoint = ['green', 'blue'].
    for (var i in _self.ckey_grouping) {
      if (_self.ckey_grouping[i] === group && i !== ckey) {
        adjoint.push(i);
      }
    }

    _self.ckey_active_group  = group;
    _self.ckey_adjoint       = adjoint;

    if (!only_vars) {
      if (_self.panelSelector.tabId !== 'mixer') {
        _self.update_canvas_needed = true;
        _self.panelSelector.tabActivate('mixer');
      } else {
        _self.update_canvas();
      }

      if (_self.panelInputs.tabId !== group) {
        _self.panelInputs.tabActivate(group);
      }
    }

    return true;
  };

  /**
   * Show the Color Mixer.
   *
   * @param {Object} target The target input object.
   *
   * @param {Object} color The color you want to set before the Color Mixer is 
   * shown. The object must have four properties: <var>red</var>, 
   * <var>green</var>, <var>blue</var> and <var>alpha</var>. All the values must 
   * be between 0 and 1. This color becomes the "active color" and the "old 
   * color".
   *
   * @see this.targetInput for more information about the <var>target</var> 
   * object.
   */
  this.show = function (target, color) {
      var styleActive = _self.elems.colorActive.style,
          colorOld    = _self.elems.colorOld,
          styleOld    = colorOld.style;

    if (target) {
      if (_self.targetInput) {
        _self.targetInput.hide();
      }

      _self.targetInput = target;
      _self.targetInput.show();
    }

    if (color) {
      _self.color.red   = color.red;
      _self.color.green = color.green;
      _self.color.blue  = color.blue;
      _self.color.alpha = color.alpha;

      _self.update_color('rgb');

      styleOld.backgroundColor = styleActive.backgroundColor;
      styleOld.opacity = styleActive.opacity;
      colorOld._color = [color.red, color.green, color.blue, color.alpha];
    }

    _self.panel.show();
  };

  /**
   * Hide the Color Mixer floating panel. This method invokes the 
   * <code>hide()</code> method provided by the target input.
   */
  this.hide = function () {
    _self.panel.hide();
    _self.ev_canvas_mode = false;
  };

  /**
   * The <code>guiFloatingPanelStateChange</code> event handler for the Color 
   * Mixer panel. This method ensures the Color Mixer is properly closed.
   *
   * @param {pwlib.appEvent.guiFloatingPanelStateChange} ev The application 
   * event object.
   */
  this.ev_panel_stateChange = function (ev) {
    if (ev.state === ev.STATE_HIDDEN) {
      if (_self.targetInput) {
        _self.targetInput.hide();
        _self.targetInput = null;
      }
      _self.ev_canvas_mode = false;
    }
  };

  /**
   * The <code>input</code> and <code>change</code> event handler for all the 
   * Color Mixer inputs.
   * @private
   */
  this.ev_input_change = function () {
    if (!this._ckey) {
      return;
    }

    // Validate and restrict the possible values.
    // If the input is unchanged, or if the new value is invalid, the function 
    // stops.
    // The hexadecimal input is checked with a simple regular expression.

    if ((this._ckey === 'hex' && !/^\#[a-f0-9]{6}$/i.test(this.value))) {
      return;
    }

    if (this.getAttribute('type') === 'number') {
      var val = parseInt(this.value),
          min = this.getAttribute('min'),
          max = this.getAttribute('max');

      if (isNaN(val)) {
        val = min;
      }

      if (val < min) {
        val = min;
      } else if (val > max) {
        val = max;
      }

      if (val != this.value) {
        this.value = val;
      }
    }

    // Update the internal color value.
    if (this._ckey === 'hex') {
      _self.color[this._ckey] = this.value;
    } else if (_self.ckey_grouping[this._ckey] === 'lab') {
      _self.color[this._ckey] = parseInt(this.value);
    } else {
      _self.color[this._ckey] = parseInt(this.value) 
        / config.inputValues[this._ckey][1];
    }

    _self.update_color(this._ckey);
  };

  /**
   * Update the current color. Once a color value is updated, this method is 
   * called to keep the rest of the color mixer in sync: for example, when a RGB 
   * value is updated, it needs to be converted to HSV, CMYK and all of the 
   * other formats. Additionally, this method updates the color preview, the 
   * controls on the Canvas and the input values.
   *
   * <p>You need to call this function whenever you update the color manually.
   *
   * @param {String} ckey The color key that was updated.
   */
  this.update_color = function (ckey) {
    var group = _self.ckey_grouping[ckey] || ckey;

    switch (group) {
      case 'rgb':
        _self.rgb2hsv();
        _self.rgb2hex();
        _self.rgb2lab();
        _self.rgb2cmyk();
        break;

      case 'hsv':
        _self.hsv2rgb();
        _self.rgb2hex();
        _self.rgb2lab();
        _self.rgb2cmyk();
        break;

      case 'hex':
        _self.hex2rgb();
        _self.rgb2hsv();
        _self.rgb2lab();
        _self.rgb2cmyk();
        break;

      case 'lab':
        _self.lab2rgb();
        _self.rgb2hsv();
        _self.rgb2hex();
        _self.rgb2cmyk();
        break;

      case 'cmyk':
        _self.cmyk2rgb();
        _self.rgb2lab();
        _self.rgb2hsv();
        _self.rgb2hex();
    }

    _self.update_preview();
    _self.update_inputs();

    if (ckey !== 'alpha') {
      _self.update_canvas(ckey);
    }
  };

  /**
   * Update the color preview.
   * @private
   */
  this.update_preview = function () {
    var red   = MathRound(_self.color.red   * 255),
        green = MathRound(_self.color.green * 255),
        blue  = MathRound(_self.color.blue  * 255),
        style = _self.elems.colorActive.style;

    style.backgroundColor = 'rgb(' + red + ',' + green + ',' + blue + ')';
    style.opacity = _self.color.alpha;
  };

  /**
   * Update the color inputs. This method takes the internal color values and 
   * shows them in the DOM input elements.
   * @private
   */
  this.update_inputs = function () {
    var input;
    for (var i in _self.inputs) {
      input = _self.inputs[i];
      input._old_value = input.value;
      if (input._ckey === 'hex') {
        input.value = _self.color[i];
      } else if (_self.ckey_grouping[input._ckey] === 'lab') {
        input.value = MathRound(_self.color[i]);
      } else {
        input.value = MathRound(_self.color[i] * config.inputValues[i][1]);
      }
    }
  };

  /**
   * Convert RGB to CMYK. This uses the current color RGB values and updates the 
   * CMYK values accordingly.
   * @private
   */
  // Quote from Wikipedia:
  // "Since RGB and CMYK spaces are both device-dependent spaces, there is no 
  // simple or general conversion formula that converts between them.  
  // Conversions are generally done through color management systems, using 
  // color profiles that describe the spaces being converted. Nevertheless, the 
  // conversions cannot be exact, since these spaces have very different 
  // gamuts."
  // Translation: this is just a simple RGB to CMYK conversion function.
  this.rgb2cmyk = function () {
    var color = _self.color,
        cyan, magenta, yellow, black,
        red   = color.red,
        green = color.green,
        blue  = color.blue;

    cyan    = 1 - red;
    magenta = 1 - green;
    yellow  = 1 - blue;

    black = MathMin(cyan, magenta, yellow, 1);

    if (black === 1) {
      cyan = magenta = yellow = 0;
    } else {
      var w = 1 - black;
      cyan    = (cyan    - black) / w;
      magenta = (magenta - black) / w;
      yellow  = (yellow  - black) / w;
    }

    color.cyan    = cyan;
    color.magenta = magenta;
    color.yellow  = yellow;
    color.black   = black;
  };

  /**
   * Convert CMYK to RGB (internally).
   * @private
   */
  this.cmyk2rgb = function () {
    var color = _self.color,
        w = 1 - color.black;

    color.red   = 1 - color.cyan    * w - color.black;
    color.green = 1 - color.magenta * w - color.black;
    color.blue  = 1 - color.yellow  * w - color.black;
  };

  /**
   * Convert RGB to HSV (internally).
   * @private
   */
  this.rgb2hsv = function () {
    var hue, sat, val, // HSV
        red   = _self.color.red,
        green = _self.color.green,
        blue  = _self.color.blue,
        min   = MathMin(red, green, blue),
        max   = MathMax(red, green, blue),
        delta = max - min,
        val   = max;

    // This is gray (red==green==blue)
    if (delta === 0) {
      hue = sat = 0;
    } else {
      sat = delta / max;

      if (max === red) {
        hue = (green -  blue) / delta;
      } else if (max === green) {
        hue = (blue  -   red) / delta + 2;
      } else if (max ===  blue) {
        hue = (red   - green) / delta + 4;
      }

      hue /= 6;
      if (hue < 0) {
        hue += 1;
      }
    }

    _self.color.hue = hue;
    _self.color.sat = sat;
    _self.color.val = val;
  };

  /**
   * Convert HSV to RGB.
   *
   * @private
   *
   * @param {Boolean} [no_update] Tells the function to not update the internal 
   * RGB color values.
   * @param {Array} [hsv] The array holding the HSV values you want to convert 
   * to RGB. This array must have three elements ordered as: <var>hue</var>, 
   * <var>saturation</var> and <var>value</var> - all between 0 and 1. If you do 
   * not provide the array, then the internal HSV color values are used.
   *
   * @returns {Array} The RGB values converted from HSV. The array has three 
   * elements ordered as: <var>red</var>, <var>green</var> and <var>blue</var> 
   * - all with values between 0 and 1.
   */
  this.hsv2rgb = function (no_update, hsv) {
    var color = _self.color,
        red, green, blue, hue, sat, val;

    // Use custom HSV values or the current color.
    if (hsv) {
      hue = hsv[0];
      sat = hsv[1];
      val = hsv[2];
    } else {
      hue = color.hue,
      sat = color.sat,
      val = color.val;
    }

    // achromatic (grey)
    if (sat === 0) {
      red = green = blue = val;
    } else {
      var h = hue * 6;
      var i = MathFloor(h);
      var t1 = val * ( 1 - sat ),
          t2 = val * ( 1 - sat * ( h - i ) ),
          t3 = val * ( 1 - sat * ( 1 - (h - i) ) );

      if (i === 0 || i === 6) { //   0° Red
        red = val;  green =  t3;  blue =  t1;
      } else if (i === 1) {    //  60° Yellow
        red =  t2;  green = val;  blue =  t1;
      } else if (i === 2) {    // 120° Green
        red =  t1;  green = val;  blue =  t3;
      } else if (i === 3) {    // 180° Cyan
        red =  t1;  green =  t2;  blue = val;
      } else if (i === 4) {    // 240° Blue
        red =  t3;  green =  t1;  blue = val;
      } else if (i === 5) {    // 300° Magenta
        red = val;  green =  t1;  blue =  t2;
      }
    }

    if (!no_update) {
      color.red   = red;
      color.green = green;
      color.blue  = blue;
    }

    return [red, green, blue];
  };

  /**
   * Convert RGB to hexadecimal representation (internally).
   * @private
   */
  this.rgb2hex = function () {
    var hex = '#', rgb = ['red', 'green', 'blue'], i, val,
        color = _self.color;

    for (i = 0; i < 3; i++) {
      val = MathRound(color[rgb[i]] * 255).toString(16);
      if (val.length === 1) {
        val = '0' + val;
      }
      hex += val;
    }

    color.hex = hex;
  };

  /**
   * Convert the hexadecimal representation of color to RGB values (internally).
   * @private
   */
  this.hex2rgb = function () {
    var rgb = ['red', 'green', 'blue'], i, val,
        color = _self.color,
        hex   = color.hex;

    hex = hex.substr(1);
    if (hex.length !== 6) {
      return;
    }

    for (i = 0; i < 3; i++) {
      val = hex.substr(i*2, 2);
      color[rgb[i]] = parseInt(val, 16)/255;
    }
  };

  /**
   * Convert RGB to CIE Lab (internally).
   * @private
   */
  this.rgb2lab = function () {
    var color = _self.color,
        lab   = _self.xyz2lab(_self.rgb2xyz([color.red, color.green, 
              color.blue]));

    color.cie_l = lab[0];
    color.cie_a = lab[1];
    color.cie_b = lab[2];
  };

  /**
   * Convert CIE Lab values to RGB values (internally).
   * @private
   */
  this.lab2rgb = function () {
    var color = _self.color,
        rgb   = _self.xyz2rgb(_self.lab2xyz(color.cie_l, color.cie_a, 
              color.cie_b));

    color.red   = rgb[0];
    color.green = rgb[1];
    color.blue  = rgb[2];
  };

  /**
   * Convert XYZ color values into CIE Lab values.
   *
   * @private
   *
   * @param {Array} xyz The array holding the XYZ color values in order: 
   * <var>X</var>, <var>Y</var> and <var>Z</var>.
   *
   * @returns {Array} An array holding the CIE Lab values in order: 
   * <var>L</var>, <var>a</var> and <var>b</var>.
   */
  this.xyz2lab = function (xyz) {
    var cfg = config.lab,

        // 216/24389 or (6/29)^3 (both = 0.008856...)
        e = 216/24389,

        // 903.296296...
        k = 24389/27;

    xyz[0] /= cfg.w_x;
    xyz[1] /= cfg.w_y;
    xyz[2] /= cfg.w_z;

    if (xyz[0] > e) {
      xyz[0] = MathPow(xyz[0], 1/3);
    } else {
      xyz[0] = (k*xyz[0] + 16)/116;
    }

    if (xyz[1] > e) {
      xyz[1] = MathPow(xyz[1], 1/3);
    } else {
      xyz[1] = (k*xyz[1] + 16)/116;
    }

    if (xyz[2] > e) {
      xyz[2] = MathPow(xyz[2], 1/3);
    } else {
      xyz[2] = (k*xyz[2] + 16)/116;
    }

    var cie_l = 116 *  xyz[1] - 16,
        cie_a = 500 * (xyz[0] -  xyz[1]),
        cie_b = 200 * (xyz[1] -  xyz[2]);

    return [cie_l, cie_a, cie_b];
  };

  /**
   * Convert CIE Lab values to XYZ color values.
   *
   * @private
   *
   * @param {Number} cie_l The color lightness value.
   * @param {Number} cie_a The a* color opponent.
   * @param {Number} cie_b The b* color opponent.
   *
   * @returns {Array} An array holding the XYZ color values in order: 
   * <var>X</var>, <var>Y</var> and <var>Z</var>.
   */
  this.lab2xyz = function (cie_l, cie_a, cie_b) {
    var y = (cie_l + 16) / 116,
        x = y + cie_a / 500,
        z = y - cie_b / 200,

        // 0.206896551...
        e = 6/29,

        // 7.787037...
        k = 1/3 * MathPow(29/6, 2),

        // 0.137931...
        t = 16/116,
        cfg = config.lab;

    if (x > e) {
      x = MathPow(x, 3);
    } else {
      x = (x - t) / k;
    }

    if (y > e) {
      y = MathPow(y, 3);
    } else {
      y = (y - t) / k;
    }

    if (z > e) {
      z = MathPow(z, 3);
    } else {
      z = (z - t) / k;
    }

    x *= cfg.w_x;
    y *= cfg.w_y;
    z *= cfg.w_z;

    return [x, y, z];
  };

  /**
   * Convert XYZ color values to RGB.
   *
   * @private
   *
   * @param {Array} xyz The array holding the XYZ color values in order: 
   * <var>X</var>, <var>Y</var> and <var>Z</var>
   *
   * @returns {Array} An array holding the RGB values in order: <var>red</var>, 
   * <var>green</var> and <var>blue</var>.
   */
  this.xyz2rgb = function (xyz) {
    var rgb = _self.calc_m1x3(xyz, config.lab.m_i);

    if (rgb[0] > 0.0031308) {
      rgb[0] = 1.055 * MathPow(rgb[0], 1 / 2.4) - 0.055;
    } else {
      rgb[0] *= 12.9232;
    }

    if (rgb[1] > 0.0031308) {
      rgb[1] = 1.055 * MathPow(rgb[1], 1 / 2.4) - 0.055;
    } else {
      rgb[1] *= 12.9232;
    }

    if (rgb[2] > 0.0031308) {
      rgb[2] = 1.055 * MathPow(rgb[2], 1 / 2.4) - 0.055;
    } else {
      rgb[2] *= 12.9232;
    }

    if (rgb[0] < 0) {
      rgb[0] = 0;
    } else if (rgb[0] > 1) {
      rgb[0] = 1;
    }

    if (rgb[1] < 0) {
      rgb[1] = 0;
    } else if (rgb[1] > 1) {
      rgb[1] = 1;
    }

    if (rgb[2] < 0) {
      rgb[2] = 0;
    } else if (rgb[2] > 1) {
      rgb[2] = 1;
    }

    return rgb;
  };

  /**
   * Convert RGB values to XYZ color values.
   *
   * @private
   *
   * @param {Array} rgb The array holding the RGB values in order: 
   * <var>red</var>, <var>green</var> and <var>blue</var>.
   *
   * @returns {Array} An array holding the XYZ color values in order: 
   * <var>X</var>, <var>Y</var> and <var>Z</var>.
   */
  this.rgb2xyz = function (rgb) {
    if (rgb[0] > 0.04045) {
      rgb[0] = MathPow(( rgb[0] + 0.055 ) / 1.055, 2.4);
    } else {
      rgb[0] /= 12.9232;
    }

    if (rgb[1] > 0.04045) {
      rgb[1] = MathPow(( rgb[1] + 0.055 ) / 1.055, 2.4);
    } else {
      rgb[1] /= 12.9232;
    }

    if (rgb[2] > 0.04045) {
      rgb[2] = MathPow(( rgb[2] + 0.055 ) / 1.055, 2.4);
    } else {
      rgb[2] /= 12.9232;
    }

    return _self.calc_m1x3(rgb, config.lab.m);
  };

  /**
   * Update the color space visualisation. This method updates the color chart 
   * and/or the color slider, and the associated controls, each as needed when 
   * a color key is updated.
   *
   * @private
   *
   * @param {String} updated_ckey The color key that was updated.
   * @param {Boolean} [force=false] Tells the function to force an update. The 
   * Canvas is not updated when the color mixer panel is not visible.
   *
   * @returns {Boolean} If the operation was successful, or false if not.
   */
  this.update_canvas = function (updated_ckey, force) {
    if (_self.panelSelector.tabId !== 'mixer' && !force) {
      _self.update_canvas_needed = true;
      return true;
    }

    _self.update_canvas_needed = false;

    var slider  = _self.elems.slider.style,
        chart   = _self.elems.chartDot.style,
        color   = _self.color,
        ckey    = _self.ckey_active,
        group   = _self.ckey_active_group,
        adjoint = _self.ckey_adjoint,
        width   = _self.chartWidth  / resScale,
        height  = _self.chartHeight / resScale,
        mx, my, sy;

    // Update the slider which shows the position of the active ckey.
    if (updated_ckey !== adjoint[0] && updated_ckey !== adjoint[1] && 
        _self.ev_canvas_mode !== 'chart') {
      if (group === 'lab') {
        sy = (color[ckey] - config.inputValues[ckey][0]) / _self.abs_max[ckey];
      } else {
        sy = color[ckey];
      }

      if (ckey !== 'hue' && group !== 'lab') {
        sy = 1 - sy;
      }

      slider.top = MathRound(sy * height) + 'px';
    }

    // Update the chart dot.
    if (updated_ckey !== ckey) {
      if (group === 'lab') {
        mx = (color[adjoint[0]] - config.inputValues[adjoint[0]][0]) 
          / _self.abs_max[adjoint[0]];
        my = (color[adjoint[1]] - config.inputValues[adjoint[1]][0]) 
          / _self.abs_max[adjoint[1]];
      } else {
        mx = color[adjoint[0]];
        my = 1 - color[adjoint[1]];
      }

      chart.top  = MathRound(my * height) + 'px';
      chart.left = MathRound(mx *  width) + 'px';
    }

    if (!_self.draw_chart(updated_ckey) || !_self.draw_slider(updated_ckey)) {
      return false;
    } else {
      return true;
    }
  };

  /**
   * The mouse events handler for the Canvas controls. This method determines 
   * the region the user is using, and it also updates the color values for the 
   * active color key. The Canvas and all the inputs in the color mixer are 
   * updated as needed.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  this.ev_canvas = function (ev) {
    ev.preventDefault();

    // Initialize color picking only on mousedown.
    if (ev.type === 'mousedown' && !_self.ev_canvas_mode) {
      _self.ev_canvas_mode = true;
      doc.addEventListener('mouseup', _self.ev_canvas, false);
    }

    if (!_self.ev_canvas_mode) {
      return false;
    }

    // The mouseup event stops the effect of any further mousemove events.
    if (ev.type === 'mouseup') {
      _self.ev_canvas_mode = false;
      doc.removeEventListener('mouseup', _self.ev_canvas, false);
    }

    var elems = _self.elems;

    // If the user is on top of the 'controls' element, determine the mouse coordinates and the 'mode' for this function: the user is either working with the slider, or he/she is working with the color chart itself.
    if (ev.target === elems.controls) {
      var mx, my,
          width  = _self.context2d.canvas.width,
          height = _self.context2d.canvas.height;

      // Get the mouse position, relative to the event target.
      if (ev.layerX || ev.layerX === 0) { // Firefox
        mx = ev.layerX * resScale;
        my = ev.layerY * resScale;
      } else if (ev.offsetX || ev.offsetX === 0) { // Opera
        mx = ev.offsetX * resScale;
        my = ev.offsetY * resScale;
      }

      if (mx >= 0 && mx <= _self.chartWidth) {
        mode = 'chart';
      } else if (mx >= _self.sliderX && mx <= width) {
        mode = 'slider';
      }
    } else {
      // The user might have clicked on the chart dot, or on the slider graphic 
      // itself.
      // If yes, then determine the mode based on this.
      if (ev.target === elems.chartDot) {
        mode = 'chart';
      } else if (ev.target === elems.slider) {
        mode = 'slider';
      }
    }

    // Update the ev_canvas_mode value to include the mode name, if it's simply 
    // the true boolean.
    // This ensures that the continuous mouse movements do not go from one mode 
    // to another when the user moves out from the slider to the chart (and 
    // vice-versa).
    if (mode && _self.ev_canvas_mode === true) {
      _self.ev_canvas_mode = mode;
    }

    // Do not continue if the mode wasn't determined (the mouse is not on the 
    // slider, nor on the chart).
    // Also don't continue if the mouse is not in the same place (different 
    // mode).
    if (!mode || _self.ev_canvas_mode !== mode || ev.target !== elems.controls) 
    {
      return false;
    }

    var color = _self.color,
        val_x = mx / _self.chartWidth,
        val_y = my / height;

    if (mode === 'slider') {
      if (_self.ckey_active === 'hue') {
        color[_self.ckey_active] = val_y;
      } else if (_self.ckey_active_group === 'lab') {
        color[_self.ckey_active] = _self.abs_max[_self.ckey_active] * val_y 
          + config.inputValues[_self.ckey_active][0];
      } else {
        color[_self.ckey_active] = 1 - val_y;
      }

      return _self.update_color(_self.ckey_active);

    } else if (mode === 'chart') {
      if (val_x > 1) {
        return false;
      }

      if (_self.ckey_active_group === 'lab') {
        val_x = _self.abs_max[_self.ckey_adjoint[0]] * val_x 
          + config.inputValues[_self.ckey_adjoint[0]][0];
        val_y = _self.abs_max[_self.ckey_adjoint[1]] * val_y 
          + config.inputValues[_self.ckey_adjoint[1]][0];
      } else {
        val_y = 1 - val_y;
      }

      color[_self.ckey_adjoint[0]] = val_x;
      color[_self.ckey_adjoint[1]] = val_y;

      return _self.update_color(_self.ckey_active_group);
    }

    return false;
  };

  /**
   * Draw the color space visualisation.
   *
   * @private
   *
   * @param {String} updated_ckey The color key that was updated. This is used 
   * to determine if the Canvas needs to be updated or not.
   */
  this.draw_chart = function (updated_ckey) {
    var context = _self.context2d,
        gradient, color, opacity, i;

    if (updated_ckey === _self.ckey_adjoint[0] || updated_ckey === 
        _self.ckey_adjoint[1] || (_self.ev_canvas_mode === 'chart' && 
          updated_ckey === _self.ckey_active_group)) {
      return true;
    }

    var w = _self.chartWidth,
        h = _self.chartHeight;

    context.clearRect(0, 0, w, h);

    if (_self.ckey_active === 'sat') {
      // In saturation mode the user has the slider which allows him/her to 
      // change the saturation (hSv) of the current color.
      // The chart shows the hue spectrum on the X axis, while the Y axis gives 
      // the Value (hsV).

      if (_self.color.sat > 0) {
        // Draw the hue spectrum gradient on the X axis.
        gradient = context.createLinearGradient(0, 0, w, 0);
        for (i = 0; i <= 6; i++) {
          color = 'rgb(' + hueSpectrum[i][0] + ', ' +
              hueSpectrum[i][1] + ', ' +
              hueSpectrum[i][2] + ')';
          gradient.addColorStop(i * 1/6, color);
        }
        context.fillStyle = gradient;
        context.fillRect(0, 0, w, h);

        // Draw the gradient which darkens the hue spectrum on the Y axis.
        gradient = context.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, w, h);
      }

      if (_self.color.sat < 1) {
        // Draw the white to black gradient. This is used for creating the 
        // saturation effect. Lowering the saturation value makes the gradient 
        // more visible, hence the hue colors desaturate.
        opacity = 1 - _self.color.sat;
        gradient = context.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(255, 255, 255, ' + opacity + ')');
        gradient.addColorStop(1, 'rgba(  0,   0,   0, ' + opacity + ')');
        context.fillStyle = gradient;
        context.fillRect(0, 0, w, h);
      }

    } else if (_self.ckey_active === 'val') {
      // In value mode the user has the slider which allows him/her to change the value (hsV) of the current color.
      // The chart shows the hue spectrum on the X axis, while the Y axis gives the saturation (hSv).

      if (_self.color.val > 0) {
        // Draw the hue spectrum gradient on the X axis.
        gradient = context.createLinearGradient(0, 0, w, 0);
        for (i = 0; i <= 6; i++) {
          color = 'rgb(' + hueSpectrum[i][0] + ', ' +
            hueSpectrum[i][1] + ', ' +
            hueSpectrum[i][2] + ')';
          gradient.addColorStop(i * 1/6, color);
        }
        context.fillStyle = gradient;
        context.fillRect(0, 0, w, h);

        // Draw the gradient which lightens the hue spectrum on the Y axis.
        gradient = context.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, w, h);
      }

      if (_self.color.val < 1) {
        // Draw a solid black color on top. This is used for darkening the hue colors gradient when the user reduces the Value (hsV).
        context.fillStyle = 'rgba(0, 0, 0, ' + (1 - _self.color.val) +')';
        context.fillRect(0, 0, w, h);
      }

    } else if (_self.ckey_active === 'hue') {
      // In hue mode the user has the slider which allows him/her to change the hue (Hsv) of the current color.
      // The chart shows the current color in the background. The X axis gives the saturation (hSv), and the Y axis gives the value (hsV).

      if (_self.color.sat === 1 && _self.color.val === 1) {
        color = [_self.color.red, _self.color.green, _self.color.blue];
      } else {
        // Determine the RGB values for the current color which has the same hue, but maximum saturation and value (hSV).
        color = _self.hsv2rgb(true, [_self.color.hue, 1, 1]);
      }
      for (i = 0; i < 3; i++) {
        color[i] = MathRound(color[i] * 255);
      }

      context.fillStyle = 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')';
      context.fillRect(0, 0, w, h);

      // Draw the white gradient for saturation (X axis, hSv).
      gradient = context.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, w, h);

      // Draw the black gradient for value (Y axis, hsV).
      gradient = context.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, w, h);

    } else if (_self.ckey_active_group === 'rgb') {
      // In any red/green/blue mode the background color becomes the one of the ckey_active. Say, for ckey_active=red the background color would be the current red value (green and blue are both set to 0).
      // On the X/Y axes the other two colors are shown. E.g. for red the X axis gives the green gradient, and the Y axis gives the blue gradient. The two gradients are drawn on top of the red background using a global composite operation (lighter) - to create the color addition effect.
      var color2, color3;

      color = {'red' : 0, 'green' : 0, 'blue' : 0};
      color[_self.ckey_active] = MathRound(_self.color[_self.ckey_active] 
          * 255);

      color2 = {'red' : 0, 'green' : 0, 'blue' : 0};
      color2[_self.ckey_adjoint[1]] = 255;

      color3 = {'red' : 0, 'green' : 0, 'blue' : 0};
      color3[_self.ckey_adjoint[0]] = 255;

      // The background.
      context.fillStyle = 'rgb(' + color.red + ',' + color.green + ',' + color.blue + ')';
      context.fillRect(0, 0, w, h);

      // This doesn't work in Opera 9.2 and older versions.
      var op = context.globalCompositeOperation;
      context.globalCompositeOperation = 'lighter';

      // The Y axis gradient.
      gradient = context.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, 'rgba(' + color2.red + ',' + color2.green + ',' + color2.blue + ', 1)');
      gradient.addColorStop(1, 'rgba(' + color2.red + ',' + color2.green + ',' + color2.blue + ', 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, w, h);

      // The X axis gradient.
      gradient = context.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, 'rgba(' + color3.red + ',' + color3.green + ',' + color3.blue + ', 0)');
      gradient.addColorStop(1, 'rgba(' + color3.red + ',' + color3.green + ',' + color3.blue + ', 1)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, w, h);

      context.globalCompositeOperation = op;

    } else if (_self.ckey_active_group === 'lab') {
      // The chart plots the CIE Lab colors. The non-active color keys give the X/Y axes. For example, if cie_l (lightness) is active, then the cie_a values give the X axis, and the Y axis is given by the values of cie_b.
      // The chart is drawn manually, pixel-by-pixel, due to the special way CIE Lab works. This is very slow in today's UAs.

      var imgd = false;

      if (context.createImageData) {
        imgd = context.createImageData(w, h);
      } else if (context.getImageData) {
        imgd = context.getImageData(0, 0, w, h);
      } else {
        imgd = {
          'width'  : w,
          'height' : h,
          'data'   : new Array(w*h*4)
        };
      }

      var pix = imgd.data,
          n = imgd.data.length - 1,
          i = -1, p = 0, inc_x, inc_y, xyz = [], rgb = [], cie_x, cie_y;

      cie_x = _self.ckey_adjoint[0];
      cie_y = _self.ckey_adjoint[1];

      color = {
        'cie_l' : _self.color.cie_l,
        'cie_a' : _self.color.cie_a,
        'cie_b' : _self.color.cie_b
      };

      inc_x = _self.abs_max[cie_x] / w;
      inc_y = _self.abs_max[cie_y] / h;

      color[cie_x] = config.inputValues[cie_x][0];
      color[cie_y] = config.inputValues[cie_y][0];

      while (i < n) {
        xyz = _self.lab2xyz(color.cie_l, color.cie_a, color.cie_b);
        rgb = _self.xyz2rgb(xyz);

        pix[++i] = MathRound(rgb[0]*255);
        pix[++i] = MathRound(rgb[1]*255);
        pix[++i] = MathRound(rgb[2]*255);
        pix[++i] = 255;

        p++;
        color[cie_x] += inc_x;

        if ((p % w) === 0) {
          color[cie_x] = config.inputValues[cie_x][0];
          color[cie_y] += inc_y;
        }
      }

      context.putImageData(imgd, 0, 0);
    }

    return true;
  };

  /**
   * Draw the color slider on the Canvas element.
   *
   * @private
   *
   * @param {String} updated_ckey The color key that was updated. This is used 
   * to determine if the Canvas needs to be updated or not.
   */
  this.draw_slider = function (updated_ckey) {
    if (_self.ckey_active === updated_ckey) {
      return true;
    }

    var context  = _self.context2d,
        slider_w = _self.sliderWidth,
        slider_h = _self.sliderHeight,
        slider_x = _self.sliderX,
        slider_y = 0,
        gradient, color, i;

    gradient = context.createLinearGradient(slider_x, slider_y, slider_x, slider_h);

    if (_self.ckey_active === 'hue') {
      // Draw the hue spectrum gradient.
      for (i = 0; i <= 6; i++) {
        color = 'rgb(' + hueSpectrum[i][0] + ', ' +
            hueSpectrum[i][1] + ', ' +
            hueSpectrum[i][2] + ')';
        gradient.addColorStop(i * 1/6, color);
      }
      context.fillStyle = gradient;
      context.fillRect(slider_x, slider_y, slider_w, slider_h);

      if (_self.color.sat < 1) {
        context.fillStyle = 'rgba(255, 255, 255, ' +
          (1 - _self.color.sat) + ')';
        context.fillRect(slider_x, slider_y, slider_w, slider_h);
      }
      if (_self.color.val < 1) {
        context.fillStyle = 'rgba(0, 0, 0, ' + (1 - _self.color.val) + ')';
        context.fillRect(slider_x, slider_y, slider_w, slider_h);
      }

    } else if (_self.ckey_active === 'sat') {
      // Draw the saturation gradient for the slider.
      // The start color is the current color with maximum saturation. The bottom gradient color is the same "color" without saturation.
      // The slider allows you to desaturate the current color.

      // Determine the RGB values for the current color which has the same hue and value (HsV), but maximum saturation (hSv).
      if (_self.color.sat === 1) {
        color = [_self.color.red, _self.color.green, _self.color.blue];
      } else {
        color = _self.hsv2rgb(true, [_self.color.hue, 1, _self.color.val]);
      }

      for (i = 0; i < 3; i++) {
        color[i] = MathRound(color[i] * 255);
      }

      var gray = MathRound(_self.color.val * 255);
      gradient.addColorStop(0, 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')');
      gradient.addColorStop(1, 'rgb(' + gray     + ', ' + gray     + ', ' + gray     + ')');
      context.fillStyle = gradient;
      context.fillRect(slider_x, slider_y, slider_w, slider_h);

    } else if (_self.ckey_active === 'val') {
      // Determine the RGB values for the current color which has the same hue and saturation, but maximum value (hsV).
      if (_self.color.val === 1) {
        color = [_self.color.red, _self.color.green, _self.color.blue];
      } else {
        color = _self.hsv2rgb(true, [_self.color.hue, _self.color.sat, 1]);
      }

      for (i = 0; i < 3; i++) {
        color[i] = MathRound(color[i] * 255);
      }

      gradient.addColorStop(0, 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')');
      gradient.addColorStop(1, 'rgb(0, 0, 0)');
      context.fillStyle = gradient;
      context.fillRect(slider_x, slider_y, slider_w, slider_h);

    } else if (_self.ckey_active_group === 'rgb') {
      var red   = MathRound(_self.color.red   * 255),
          green = MathRound(_self.color.green * 255),
          blue  = MathRound(_self.color.blue  * 255);

      color = {
        'red'   : red,
        'green' : green,
        'blue'  : blue
      };
      color[_self.ckey_active] = 255;

      var color2 = {
        'red'   : red,
        'green' : green,
        'blue'  : blue
      };
      color2[_self.ckey_active] = 0;

      gradient.addColorStop(0, 'rgb(' + color.red  + ',' + color.green  + ',' + color.blue  + ')');
      gradient.addColorStop(1, 'rgb(' + color2.red + ',' + color2.green + ',' + color2.blue + ')');
      context.fillStyle = gradient;
      context.fillRect(slider_x, slider_y, slider_w, slider_h);

    } else if (_self.ckey_active_group === 'lab') {
      // The slider shows a gradient with the current color key going from the minimum to the maximum value. The gradient is calculated pixel by pixel, due to the special way CIE Lab is defined.

      var imgd = false;

      if (context.createImageData) {
        imgd = context.createImageData(1, slider_h);
      } else if (context.getImageData) {
        imgd = context.getImageData(0, 0, 1, slider_h);
      } else {
        imgd = {
          'width'  : 1,
          'height' : slider_h,
          'data'   : new Array(slider_h*4)
        };
      }

      var pix = imgd.data,
          n = imgd.data.length - 1,
          ckey = _self.ckey_active,
          i = -1, inc, xyz, rgb;

      color = {
        'cie_l' : _self.color.cie_l,
        'cie_a' : _self.color.cie_a,
        'cie_b' : _self.color.cie_b
      };

      color[ckey] = config.inputValues[ckey][0];
      inc = _self.abs_max[ckey] / slider_h;

      while (i < n) {
        xyz = _self.lab2xyz(color.cie_l, color.cie_a, color.cie_b);
        rgb = _self.xyz2rgb(xyz);
        pix[++i] = MathRound(rgb[0]*255);
        pix[++i] = MathRound(rgb[1]*255);
        pix[++i] = MathRound(rgb[2]*255);
        pix[++i] = 255;

        color[ckey] += inc;
      }

      for (i = 0; i <= slider_w; i++) {
        context.putImageData(imgd, slider_x+i, slider_y);
      }
    }

    context.strokeStyle = '#6d6d6d';
    context.strokeRect(slider_x, slider_y, slider_w, slider_h);

    return true;
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

