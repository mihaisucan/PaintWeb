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
 * $Date: 2009-06-06 18:58:07 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the implementation of the Color Mixer dialog.
 */

// For the implementation of this extension I used the following references:
// - Wikipedia articles on each subject.
// - the great brucelindbloom.com Web site - lots of information.

// TODO: make this work.

/**
 * @class The Color Mixer extension.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.extensions.colormixer = function (app) {
  var _self = this,
      doc   = app.doc,
      win   = app.win;

  /**
   * Holds references to various DOM elements.
   *
   * @private
   * @type Object
   */
  this.elems = {
    // The color editor element.
    '_self'      : false,

    // This is where we reference the current color element, associated with the color editor.
    // e.g. the fillStyle, strokeStyle and shadowColor elements
    'target'     : false,

    // This is the reference to the canvas controls (in the chart and in the slider)
    'controls'   : false,

    'chart_pos'  : false,
    'slider_pos' : false,

    // The input <select> which tells the color palette selected by the user.
    'in_cpalette' : false,

    // The container element which holds the colors of the currently selected palette.
    'out_cpalette' : false
  };

  /**
   * Holds a reference to the 2D context of the color mixer canvas element. This 
   * is where the color chart and the slider are both drawn.
   *
   * @private
   * @type CanvasRenderingContext2D
   */
  this.context2d = false;

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

  // The "absolute maximum" value is determined based on the min/max values.  
  // E.g. for min -100 and max 100, the abs_max is 200. This is relevant only 
  // for CIE Lab.
  this.abs_max  = {};

  // The hue spectrum used by the HSV charts.
  this.hue = [
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

  // These values are automatically calculated when the color editor is initialized.
  this.slider_x = false;
  this.chart_width = false;

  // This holds the ID of the active tab for the color picker. This can be:
  //   - 'cmixer': this is the color chart canvas which shows a visualisation of the active color space.
  //   - 'cpalettes': this shows the user a list of predefined color palettes.
  this.tab_picker = 'cmixer';

  // This holds the ID of the active tab for color inputs. This can be any of the color spaces: rgb, hsv, lab, cmyk.
  this.tab_inputs = 'rgb';

  // Initialize the color editor. This function is called by the PaintWeb main initialization function.
  this.extensionRegister = function (ev) {
    var elem, ce = _me.coloreditor;
    if (!ce || !ce.color || !ce.inputs || !ce.lab || !ce.init_lab || !ce.init_lab()) {
      return false;
    }

    // The color editor element.
    if ( !(elem = $('coloreditor')) ) {
      return false;
    }

    ce.elems._self = elem;

    // Initialize the color chart canvas.
    if ( !(elem = $('coloreditor-canvas')) ) {
      return false;
    }

    ce.context2d = elem.getContext('2d');
    if (!ce.context2d) {
      return false;
    }

    // Setup the color editor inputs.
    var i, form = $('coloreditor-inputs');
    if (!form) {
      return false;
    }

    for (i in ce.inputs) {
      elem = form.elements.namedItem('in-ckey-' + i);
      if (!elem) {
        return false;
      }

      elem.addEventListener('input', ce.ev_input_change, false);

      if (i != 'hex') {
        elem.addEventListener('keypress', _me.ev_input_nr, false);
        elem.setAttribute('step', ce.value_step[i]);

        if (ce.ckey_grouping[i] == 'lab') {
          elem.setAttribute('max', Math.round(ce.value_max[i]));
          elem.setAttribute('min', Math.round(ce.value_min[i]));
          ce.abs_max[i] = ce.value_max[i] - ce.value_min[i];
        } else {
          elem.setAttribute('max', ce.value_max[i]);
          elem.setAttribute('min', 0);
        }
      }

      // Store the color key, which is used by the event handler.
      elem._ckey = i;
      ce.inputs[i] = elem;
    }

    // Setup the ckey inputs of type=radio.
    var n, ckey = form['in-ckey'];
    if (!ckey) {
      return false;
    }
    for (i = 0, n = ckey.length; i < n; i++) {
      elem = ckey[i];
      if (ce.ckey_grouping[elem.value] == 'lab' && !ce.context2d.putImageData) {
        elem.disabled = true;
        continue;
      }

      elem.addEventListener('change', ce.ev_change_ckey_active, false);

      if (elem.value == ce.ckey_active) {
        elem.checked = true;
        ce.update_ckey_active(ce.ckey_active, true);
      }
    }

    // The color options.
    var id, color_opts = ['fillStyle', 'strokeStyle', 'shadowColor'];
    for (i = 0, n = color_opts.length; i < n; i++) {
      id = color_opts[i];
      if ( !(elem = $('in-' + id)) ) {
        return false;
      }

      // The property name is used by the event handlers when the color changes.
      elem._prop = id;
      elem._value = {'red': 0, 'green' : 0, 'blue' : 0, 'alpha' : 1};
      elem.style.backgroundColor = '#000';

      elem.addEventListener('click', ce.ev_click_color_opt, false);
      _me.inputs[id] = elem;
    }

    // The default colors.
    _me.img_temp.fillStyle = '#000000';
    _me.img_temp.strokeStyle = '#0000ff';
    _me.inputs.strokeStyle.style.backgroundColor = '#00f';
    _me.inputs.strokeStyle._value.blue = 1;


    // Prepare the color preview elements.
    if ( !(elem = $('coloreditor-activec')) ) {
      return false;
    }
    ce.elems.color_active = elem;

    if ( !(elem = $('coloreditor-oldc')) ) {
      return false;
    }
    elem.addEventListener('click', ce.ev_click_color, false);
    ce.elems.color_old = elem;


    // Make sure the buttons work properly.
    if ( !(elem = $('btn-ce-close')) ) {
      return false;
    }
    elem.addEventListener('click', ce.hide, false);

    if ( !(elem = $('btn-ce-cancel')) ) {
      return false;
    }
    elem.addEventListener('click', ce.btn_cancel, false);

    if ( !(elem = $('btn-ce-savec')) ) {
      return false;
    }
    elem.addEventListener('click', ce.btn_save_color, false);


    // Prepare the canvas "controls" (the chart "dot" and the slider).
    var elems = ['controls', 'chart_pos', 'slider_pos'];
    for (i = 0, n = elems.length; i < n; i++) {
      id = elems[i];
      if ( !(elem = $('coloreditor-' + id)) ) {
        return false;
      }

      elem.addEventListener('mousedown', ce.ev_canvas, false);
      elem.addEventListener('mousemove', ce.ev_canvas, false);
      elem.addEventListener('mouseup',   ce.ev_canvas, false);

      ce.elems[id] = elem;
    }
    ce.elems.controls.addEventListener('dblclick',  ce.ev_dblclick_canvas, false);

    // Make the tab buttons work.
    var tabs = ['cmixer', 'cpalettes', 'rgb', 'hsv', 'lab', 'cmyk'];
    for (i = 0, n = tabs.length; i < n; i++) {
      id = tabs[i];
      if ( !(elem = $('btn-' + id)) ) {
        return false;
      }

      elem._tab = id;

      if (ce.tab_picker == id || ce.tab_inputs == id) {
        elem.className += ' active';
      }

      elem.addEventListener('click', ce.ev_click_tab, false);
      ce.elems['btn_' + id] = elem;

      // Get the tab container with the same ID.

      if ( !(elem = $('coloreditor-' + id)) ) {
        return false;
      }

      if (ce.tab_picker == id || ce.tab_inputs == id) {
        elem.style.display = 'block';
      } else {
        elem.style.display = 'none';
      }

      ce.elems['tab_' + id] = elem;
    }

    elem = ce.elems.tab_cpalettes;
    elem.style.width  = ce.context2d.canvas.width  + 'px';
    elem.style.height = ce.context2d.canvas.height + 'px';
    elem.addEventListener('dblclick', ce.ev_dblclick_cpalettes, false);


    // The color palette <select>.
    if ( !(elem = $('in-cpalette')) ) {
      return false;
    }
    elem.addEventListener('change', ce.ev_change_cpalette, false);
    ce.elems.in_cpalette = elem;

    // Add the list of color palettes into the <select>.
    var palette;
    for (i in ce.color_palettes) {
      palette = ce.color_palettes[i];
      elem = _me.doc.createElement('option');
      elem.value = i;
      if (i == ce.palette_default) {
        elem.selected = true;
      }

      elem.appendChild( _me.doc.createTextNode(palette.title) );
      ce.elems.in_cpalette.appendChild(elem);
    }

    // This is the ordered list where we add each color (list item).
    if ( !(elem = $('out-cpalette')) ) {
      return false;
    }
    elem.addEventListener('click', ce.ev_click_color, false);
    ce.elems.out_cpalette = elem;

    ce.cpalette_load(ce.palette_default);

    ce.slider_width_   = ce.slider_width;
    ce.slider_spacing_ = ce.slider_spacing;

    return ce.update_dimensions();
  };

  // This function calculates lots of values used by the other CIE Lab-related functions.
  this.init_lab = function () {
    var cfg, ce = _me.coloreditor;
    if (!ce || !(cfg = ce.lab)) {
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
      z_b = (1 - x0_b - y0_b) / y0_b;

    var m = [
      x_r, y_r, z_r,
      x_g, y_g, z_g,
      x_b, y_b, z_b
    ];

    var m_i = ce.calc_m3inv(m);

    var s = ce.calc_m1x3([w_x, w_y, w_z], m_i);

    // The 3x3 matrix used by rgb2xyz().
    m = [
      s[0] * m[0], s[0] * m[1], s[0] * m[2],
      s[1] * m[3], s[1] * m[4], s[1] * m[5],
      s[2] * m[6], s[2] * m[7], s[2] * m[8]
    ];

    // The matrix inverse, used by xyz2rgb();
    cfg.m_i = ce.calc_m3inv(m);
    cfg.m   = m;

    // Now determine the min/max values for a and b.

    var xyz = ce.rgb2xyz([0, 1, 0]); // green gives the minimum value for a
    var lab = ce.xyz2lab(xyz),
      min = ce.value_min,
      max = ce.value_max;
    min.cie_a = lab[1];

    xyz = ce.rgb2xyz([1, 0, 1]);     // magenta gives the maximum value for a
    lab = ce.xyz2lab(xyz);
    max.cie_a = lab[1];

    xyz = ce.rgb2xyz([0, 0, 1]);     // blue gives the minimum value for b
    lab = ce.xyz2lab(xyz);
    min.cie_b = lab[2];

    xyz = ce.rgb2xyz([1, 1, 0]);     // yellow gives the maximum value for b
    lab = ce.xyz2lab(xyz);
    max.cie_b = lab[2];

    return true;
  },

  // The cancel button which sets back the old color and closes the dialog.
  this.btn_cancel = function (ev) {
    var ce = _me.coloreditor;
    if (!ce || !ce.elems || !ce.elems.color_old || !ce.elems.color_old._color) {
      return false;
    }

    ce.ev_click_color(ce.elems.color_old, true);

    return ce.hide();
  };

  // The saved color only gets added into the '_saved' color palette list. The 
  // color is not saved permanently.
  this.btn_save_color = function (ev) {
    var ce = _me.coloreditor;
    if (!ce || !ce.color || !ce.color_palettes || !ce.color_palettes._saved) {
      return false;
    }

    var color = [ce.color.red, ce.color.green, ce.color.blue],
      saved = ce.color_palettes._saved;

    saved.colors.push(color);

    ce.elems.in_cpalette.value = '_saved';
    ce.cpalette_load('_saved');
    if (ce.tab_picker != 'cpalettes') {
      ce.show_tab('cpalettes');
    }

    return true;
  };

  // The event handler for changes made to the color palette <select> input.
  this.ev_change_cpalette = function (ev) {
    return _me.coloreditor.cpalette_load(this.value);
  };

  // This function loads the desired color palette.
  this.cpalette_load = function (id) {
    var ce = _me.coloreditor;
    if (!ce || !ce.color_palettes || !id || !ce.color_palettes[id]) {
      return false;
    }

    var palette = ce.color_palettes[id];

    if (palette.file) {
      ce.xhr = new XMLHttpRequest();
      if (!ce.xhr) {
        return false;
      }
      ce.xhr.onreadystatechange = ce.cpalette_loaded;
      ce.xhr.open('GET', palette.file);
      ce.xhr.send('');

    } else if (palette.colors) {
      ce.cpalette_show(palette.colors);

    } else {
      return false;
    }

    return true;
  };

  // This is the event handler for XMLHttpRequest.onReadyStateChange.
  this.cpalette_loaded = function (ev) {
    var ce = _me.coloreditor;

    // 0 UNINITIALIZED open() has not been called yet. 1 LOADING send() has not been called yet. 2 LOADED send() has been called, headers and status are available. 3 INTERACTIVE Downloading, responseText holds the partial data. 4 COMPLETED Finished with all operations.
    if(!ce || !ce.xhr || ce.xhr.readyState != 4 || ce.xhr.status != 200 || !ce.xhr.responseText) {
      return false;
    }

    var json = ce.xhr.responseText;

    // FIXME: Security issue here.
    // The provided color palettes include mathematically-precise values (such as 1/3). JSON.parse() does not allow any kind of evaluation.
    //if (window.JSON) {
    //  json = JSON.parse(json);
    //} else {
      json = eval('(' + json + ')');
    //}

    ce.cpalette_show(json);

    json = ce.xhr = null;
    delete json, ce.xhr;

    return true;
  };

  // This function takes the colors array argument which used to add each color 
  // element to the color editor (#out-cpalette).
  this.cpalette_show = function (colors) {
    var ce = _me.coloreditor;
    if (!colors || !(colors instanceof Array) || !ce || !ce.elems || !ce.elems.out_cpalette || !_me.doc.createDocumentFragment) {
      return false;
    }

    var i, color, elem,
      frag = _me.doc.createDocumentFragment(),
      dest = ce.elems.out_cpalette;

    dest.style.display = 'none';
    while (dest.hasChildNodes()) {
      dest.removeChild(dest.firstChild);
    }

    for (i in colors) {
      color = colors[i];

      // Do not allow values higher than 1.
      color[0] = Math.min(1, color[0]);
      color[1] = Math.min(1, color[1]);
      color[2] = Math.min(1, color[2]);

      elem = _me.doc.createElement('li');
      elem._color = color;
      elem.style.backgroundColor = 'rgb(' + Math.round(color[0] * 255) + ',' + Math.round(color[1] * 255) + ',' + Math.round(color[2] * 255) + ')';

      frag.appendChild(elem);
    }
    dest.appendChild(frag);
    dest.style.display = 'block';

    colors = frag = null;
    delete frag, colors;

    return true;
  };

  // This is the 'click' event handler for colors (in the color palette list, or 
  // the old color).
  this.ev_click_color = function (ev, cancel) {
    var ce = _me.coloreditor;
    if (!ce || !ce.color || !ev) {
      return false;
    }

    if (ev.target && ev.target._color) {
      var color = ev.target._color;
    } else if (ev._color) {
      var color = ev._color;
    } else {
      return false;
    }

    ce.color.red   = color[0];
    ce.color.green = color[1];
    ce.color.blue  = color[2];

    if (typeof(color[3]) != 'undefined') {
      ce.color.alpha = color[3];
    }

    if (!cancel) {
      return ce.update_color('rgb');
    } else {
      return ce.update_target();
    }
  };

  // Calculate the dimensions and coordinates for the slider and the color chart 
  // within the canvas element.
  this.update_dimensions = function () {
    var ce = _me.coloreditor;
    if (!ce || !ce.context2d || !ce.context2d.canvas || !ce.elems) {
      return false;
    }

    var width  = ce.context2d.canvas.width,
      height = ce.context2d.canvas.height,
      style;

    ce.slider_width   = Math.round(width * ce.slider_width_);
    ce.slider_spacing = Math.round(width * ce.slider_spacing_);
    ce.slider_x       = width - ce.slider_width - 2;
    ce.chart_width    = ce.slider_x - ce.slider_spacing;

    style = ce.elems.controls.style;
    style.width  = width  + 'px';
    style.height = height + 'px';

    style = ce.elems.tab_cmixer.style;
    style.width  = width  + 'px';
    style.height = height + 'px';

    style = ce.elems.slider_pos.style;
    style.width = ce.slider_width + 'px';
    style.left  = ce.slider_x     + 'px';

    return true;
  };

  // A simple function to calculate the matrix product of two given A and 
  // B matrices. A must be one row and 3 columns. B must be 3 rows and 
  // 3 columns.
  // Both arguments must be arrays in the form of [a00, a01, a02, ... a10, a11, 
  // a12, ...].
  this.calc_m1x3 = function (a, b) {
    if (!(a instanceof Array) || !(b instanceof Array)) {
      return false;
    }

    var x = a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
      y = a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
      z = a[0] * b[2] + a[1] * b[5] + a[2] * b[8];

    return [x, y, z];
  };

  // Another simple function which calculates the matrix inverse, for a matrix 
  // of 3 rows and 3 columns.
  // The argument must be an array in the form of [a00, a01, a02, ... a10, a11, 
  // a12, ...].
  this.calc_m3inv = function (m) {
    if (!(m instanceof Array)) {
      return false;
    }

    var d = (m[0]*m[4]*m[8] + m[1]*m[5]*m[6] + m[2]*m[3]*m[7])
        - (m[2]*m[4]*m[6] + m[5]*m[7]*m[0] + m[8]*m[1]*m[3]);

    // Matrix determinant is 0: the matrix is not invertible.
    if (d == 0) {
      return false;
    }

    var i = [
       m[4]*m[8] - m[5]*m[7], -m[3]*m[8] + m[5]*m[6],  m[3]*m[7] - m[4]*m[6],
      -m[1]*m[8] + m[2]*m[7],  m[0]*m[8] - m[2]*m[6], -m[0]*m[7] + m[1]*m[6],
       m[1]*m[5] - m[2]*m[4], -m[0]*m[5] + m[2]*m[3],  m[0]*m[4] - m[1]*m[3]
    ];

    i = [
      1/d * i[0], 1/d * i[3], 1/d * i[6],
      1/d * i[1], 1/d * i[4], 1/d * i[7],
      1/d * i[2], 1/d * i[5], 1/d * i[8]
    ];

    return i;
  };

  // The click event handler for all the tab buttons.
  this.ev_click_tab = function (ev) {
    if (this._tab) {
      return _me.coloreditor.show_tab(this._tab);
    } else {
      return false;
    }
  };

  this.show_tab = function (tab) {
    var ce = _me.coloreditor;
    if (!ce || !tab) {
      return false;
    }

    if (tab == 'cmixer' || tab == 'cpalettes') {
      var group = 'picker';
    } else {
      var group = 'inputs';
    }

    var old_tab = ce['tab_' + group];

    if (old_tab == tab) {
      return true;

    } else if (old_tab) {
      var tmp = ce.elems['btn_' + old_tab];
      tmp.className = tmp.className.replace(/\s*active/ig, '');
      ce.elems['tab_' + old_tab].style.display = 'none';
    }

    ce.elems['btn_' + tab].className += ' active';
    ce.elems['tab_' + tab].style.display = 'block';

    ce['tab_' + group] = tab;

    if (tab == 'cmixer' && ce.update_canvas_needed) {
      ce.update_canvas();
    }

    return true;
  };

  // The event handler for inputs of type=radio - the inputs which allow the 
  // user to change the active color key.
  this.ev_change_ckey_active = function (ev) {
    if (!this.value || this.value == _me.coloreditor.ckey_active || _me.coloreditor.update_ckey_active(this.value)) {
      return false;
    }

    return true;
  };

  // The actual function which deals with the changes to the active color key.
  this.update_ckey_active = function (ckey, only_vars) {
    var ce = _me.coloreditor;
    if (!ce || !ckey || !ce.color || !ce.inputs[ckey]) {
      return false;
    }

    ce.ckey_active = ckey;

    var i, adjoint = [], group = ce.ckey_grouping[ckey];

    // Determine the adjoint color keys. For example, if red is active, then adjoint = ['green', 'blue'].
    for (i in ce.ckey_grouping) {
      if (ce.ckey_grouping[i] == group && i != ckey) {
        adjoint.push(i);
      }
    }

    ce.ckey_active_group  = group;
    ce.ckey_adjoint       = adjoint;

    if (!only_vars) {
      if (ce.tab_picker != 'cmixer') {
        ce.update_canvas_needed = true;
        ce.show_tab('cmixer');
      } else {
        ce.update_canvas();
      }

      if (ce.tab_inputs != group) {
        ce.show_tab(group);
      }
    }

    return true;
  };

  // This function enables/disables the color mixer. This is the event handler 
  // associated with any color option available (stroke and fill colors). The 
  // editor is given the target (the color option) picked by the user. Any 
  // changes to the color are propagated to the target.
  this.ev_click_color_opt = function (ev) {
    var i, ce  = _me.coloreditor;
    if (!ce || !ce.color || !this._value || !this._prop) {
      return false;
    }

    if (ce.elems.target && ce.elems.target.id == this.id) {
      return ce.hide();
    }

    // The color option can be disabled.
    if (this._disabled) {
      return false;
    }

    // Store the reference to the color option picked by the user.
    ce.elems.target = this;

    // Update the color editor title.
    var ttl = ce.elems._self.getElementsByTagName('h1')[0];
    if (ttl) {
      ttl.removeChild(ttl.firstChild);
      ttl.appendChild(_me.doc.createTextNode( this.title || _me.getMsg('color-editor-title') ));
    }

    // Update the internal color values to be the same as those of the color option picked by the user.
    for (i in this._value) {
      ce.color[i] = this._value[i];
    }

    // Update the "old color" element.
    i = ce.elems.color_old;
    i._color = [this._value.red, this._value.green, this._value.blue, this._value.alpha];
    i.style.backgroundColor = 'rgb(' +
        Math.round(this._value.red   * 255) + ',' +
        Math.round(this._value.green * 255) + ',' +
        Math.round(this._value.blue  * 255) + ')';
    i.style.opacity = this._value.alpha;

    i = ce.elems.color_active.style;
    i.backgroundColor = ce.elems.color_old.style.backgroundColor;
    i.opacity = this._value.alpha;

    // Convert the RGB color values to HSV, CIE Lab, CMYK, and to the hexadecimal representation, for later use.
    ce.rgb2hsv();
    ce.rgb2hex();
    ce.rgb2lab();
    ce.rgb2cmyk();

    // Update the inputs to show the RGB, HSV and HEX values.
    ce.update_inputs();

    // Update the color chart and slider (the entire color editor canvas).
    ce.update_canvas();

    // Make sure the color editor is on top.
    if (_me.boxes && _me.boxes.bringOnTop) {
      ce.elems._self.style.display = 'block';
      _me.boxes.bringOnTop(ce.elems._self.id);
    }

    return true;
  };

  // When the user double clicks the color palettes area, this event handler 
  // toggles the double size mode on/off.
  this.ev_dblclick_cpalettes = function (ev) {
    var ce = _me.coloreditor;
    if (!ce || !ce.elems || !ce.elems.tab_cpalettes) {
      return false;
    }

    var tab    = ce.elems.tab_cpalettes;
    var style = tab.style;
    var width  = parseInt(style.width),
      height = parseInt(style.height);

    if (tab.className == 'double') {
      width  /= 2;
      height /= 2;
      tab.className = '';
    } else {
      width  *= 2;
      height *= 2;
      tab.className = 'double';
    }

    style.width  = width  + 'px';
    style.height = height + 'px';

    if (ce.tab_picker != 'cpalettes') {
      return ce.show_tab('cpalettes');
    } else {
      return true;
    }
  };

  this.hide = function () {
    var ce = _me.coloreditor;

    ce.elems._self.style.display = 'none';
    ce.elems.target   = false;
    ce.ev_canvas_mode = false;

    return true;
  };

  // This is the event handler for the changes to the color editor inputs.
  this.ev_input_change = function (ev) {
    var ce = _me.coloreditor;
    if (!ce || !ce.elems.target || !this._ckey) {
      return false;
    }

    // Validate and restrict the possible values.
    // The non-HEX fields are checked by the generic ev_input_nr function (input type=number).
    // If the input is unchanged, or if the new value is invalid, the function returns false.
    // The hexadecimal input is checked with a simple regular expression.

    if ((this._ckey == 'hex' && !/^\#[a-f0-9]{6}$/i.test(this.value)) || (this._ckey != 'hex' && !_me.ev_input_nr(ev))) {
      return false;
    }

    // Update the internal color value.
    if (this._ckey == 'hex') {
      ce.color[this._ckey] = this.value;
    } else if (ce.ckey_grouping[this._ckey] == 'lab') {
      ce.color[this._ckey] = parseInt(this.value);
    } else {
      ce.color[this._ckey] = parseInt(this.value) / ce.value_max[this._ckey];
    }

    return ce.update_color(this._ckey);
  };

  // This function takes the ckey parameter which tells the updated color key.  
  // Based on which color key is updated, the other color values are also 
  // updated (e.g. RGB conversion to HSV, CIE Lab, CMYK and HEX). After the 
  // color value conversions, the inputs, the color option target, and the color 
  // editor canvas are all updated to reflect the change.
  this.update_color = function (ckey) {
    var ce = _me.coloreditor;
    if (!ce) {
      return false;
    }

    if (ckey == 'rgb' || ce.ckey_grouping[ckey] == 'rgb') {
      ce.rgb2hsv();
      ce.rgb2hex();
      ce.rgb2lab();
      ce.rgb2cmyk();
    } else if (ckey == 'hsv' || ce.ckey_grouping[ckey] == 'hsv') {
      ce.hsv2rgb();
      ce.rgb2hex();
      ce.rgb2lab();
      ce.rgb2cmyk();
    } else if (ckey == 'hex') {
      ce.hex2rgb();
      ce.rgb2hsv();
      ce.rgb2lab();
      ce.rgb2cmyk();
    } else if (ckey == 'lab' || ce.ckey_grouping[ckey] == 'lab') {
      ce.lab2rgb();
      ce.rgb2hsv();
      ce.rgb2hex();
      ce.rgb2cmyk();
    } else if (ckey == 'cmyk' || ce.ckey_grouping[ckey] == 'cmyk') {
      ce.cmyk2rgb();
      ce.rgb2lab();
      ce.rgb2hsv();
      ce.rgb2hex();
    }

    ce.update_inputs();
    ce.update_target();

    if (ckey != 'alpha') {
      ce.update_canvas(ckey);
    }

    return true;
  };

  // This function updates the color option target. It sets the current color 
  // values.
  this.update_target = function () {
    var ce = _me.coloreditor;
    if (!ce || !ce.elems.target || !_me.img_temp || !ce.color) {
      return false;
    }

    var prop  = ce.elems.target._prop,
      style = ce.elems.target.style,
      val   = ce.elems.target._value,
      i, rgba, elem;

    if (!prop || !style || !val) {
      return false;
    }

    for (i in val) {
      val[i] = ce.color[i];
    }

    var red   = Math.round(val.red   * 255),
      green = Math.round(val.green * 255),
      blue  = Math.round(val.blue  * 255);

    style.backgroundColor = 'rgb(' + red + ',' + green + ',' + blue + ')';

    // Too bad Opera does not support rgba()
    style.opacity = val.alpha;

    rgba = 'rgba(' + red + ',' + green + ',' + blue + ',' + val.alpha + ')';
    if (prop == 'shadowColor') {
      _me.img[prop] = rgba;
    } else {
      _me.img_temp[prop] = rgba;
    }

    elem = ce.elems.color_active.style;
    elem.backgroundColor = style.backgroundColor;
    elem.opacity = val.alpha;

    return true;
  };

  // Take the internal color values and show them in the inputs.
  this.update_inputs = function () {
    var i, input, ce = _me.coloreditor;
    if (!ce || !ce.inputs || !ce.color) {
      return false;
    }

    for (i in ce.inputs) {
      input = ce.inputs[i];
      input._old_value = input.value;
      if (input._ckey == 'hex') {
        input.value = ce.color[i];
      } else if (ce.ckey_grouping[input._ckey] == 'lab') {
        input.value = Math.round(ce.color[i]);
      } else {
        input.value = Math.round(ce.color[i] * ce.value_max[i]);
      }
    }

    return true;
  };

  // Quote from Wikipedia:
  // "Since RGB and CMYK spaces are both device-dependent spaces, there is no 
  // simple or general conversion formula that converts between them.  
  // Conversions are generally done through color management systems, using 
  // color profiles that describe the spaces being converted. Nevertheless, the 
  // conversions cannot be exact, since these spaces have very different 
  // gamuts."
  // Translation: this is just a simple RGB to CMYK conversion function.
  this.rgb2cmyk = function () {
    var color, ce = _me.coloreditor;
    if (!ce || !(color = ce.color)) {
      return false;
    }

    var cyan, magenta, yellow, black,
      red   = color.red,
      green = color.green,
      blue  = color.blue;

    cyan    = 1 - red;
    magenta = 1 - green;
    yellow  = 1 - blue;

    black = Math.min(cyan, magenta, yellow, 1);

    if (black == 1) {
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

    return true;
  };

  this.cmyk2rgb = function () {
    var color, ce = _me.coloreditor;
    if (!ce || !(color = ce.color)) {
      return false;
    }

    var w = 1 - color.black;

    color.red   = 1 - color.cyan    * w - color.black;
    color.green = 1 - color.magenta * w - color.black;
    color.blue  = 1 - color.yellow  * w - color.black;

    return true;
  };

  // This function takes the RGB color values and converts them to HSV.
  this.rgb2hsv = function () {
    var ce = _me.coloreditor;
    if (!ce || !ce.color) {
      return false;
    }

    var red   = ce.color.red,
      green = ce.color.green,
      blue  = ce.color.blue,
      hue, sat, val; // HSV

    var min = Math.min(red, green, blue),
      max = Math.max(red, green, blue);

    var delta = max - min,
      val   = max;

    // This is gray (red==green==blue)
    if (delta == 0) {
      hue = sat = 0;
    } else {
      sat = delta / max;

      if (max == red) {
        hue = (green -  blue) / delta;
      } else if (max == green) {
        hue = (blue  -   red) / delta + 2;
      } else if (max ==  blue) {
        hue = (red   - green) / delta + 4;
      }

      hue /= 6;
      if (hue < 0) {
        hue += 1;
      }
    }

    ce.color.hue = hue;
    ce.color.sat = sat;
    ce.color.val = val;

    return true;
  };

  // This function takes the internal HSV color values and converts them to RGB.  
  // The return value is either false (when there's any problem), or an array of 
  // three values [red, green, value] - this is the result of the HSV to RGB 
  // conversion.
  // Arguments:
  //   - no_update (boolean)
  //     Tells the function to NOT update the internal RGB color values 
  //     (ce.color). This is enabled by default.
  //   - hsv (array)
  //     Instead of using the internal HSV color values (from ce.color), the 
  //     function will use the values given in the array [hue, saturation, 
  //     light].
  this.hsv2rgb = function (no_update, hsv) {
    var color, ce = _me.coloreditor;
    if (!ce || !(color = ce.color)) {
      return false;
    }

    var red, green, blue, hue, sat, val;

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
    if (sat == 0) {
      red = green = blue = val;
    } else {
      var h = hue * 6;
      var i = Math.floor(h);
      var t1 = val * ( 1 - sat ),
        t2 = val * ( 1 - sat * ( h - i ) ),
        t3 = val * ( 1 - sat * ( 1 - (h - i) ) );

      if (i == 0 || i == 6) { //   0° Red
        red = val;  green =  t3;  blue =  t1;
      } else if (i == 1) {    //  60° Yellow
        red =  t2;  green = val;  blue =  t1;
      } else if (i == 2) {    // 120° Green
        red =  t1;  green = val;  blue =  t3;
      } else if (i == 3) {    // 180° Cyan
        red =  t1;  green =  t2;  blue = val;
      } else if (i == 4) {    // 240° Blue
        red =  t3;  green =  t1;  blue = val;
      } else if (i == 5) {    // 300° Magenta
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

  // This updates the hexadecimal representation of the color, based on the RGB values.
  this.rgb2hex = function () {
    var hex = '#', rgb = ['red', 'green', 'blue'], i, val,
      color, ce = _me.coloreditor;
    if (!ce || !(color = ce.color)) {
      return false;
    }

    for (i = 0; i < 3; i++) {
      val = Math.round(color[rgb[i]] * 255).toString(16);
      if (val.length == 1) {
        val = '0' + val;
      }
      hex += val;
    }

    color.hex = hex;

    return true;
  };

  // This updates the RGB color values, based on the hexadecimal color representation.
  this.hex2rgb = function () {
    var rgb = ['red', 'green', 'blue'], i, val, color, hex,
      ce = _me.coloreditor;
    if (!ce || !(color = ce.color) || !(hex = color.hex)) {
      return false;
    }

    hex = hex.substr(1);
    if (hex.length != 6) {
      return false;
    }

    for (i = 0; i < 3; i++) {
      val = hex.substr(i*2, 2);
      color[rgb[i]] = parseInt(val, 16)/255;
    }

    return true;
  };

  this.rgb2lab = function () {
    var color, ce = _me.coloreditor;
    if (!ce || !(color = ce.color)) {
      return false;
    }

    var lab = ce.xyz2lab(ce.rgb2xyz([color.red, color.green, color.blue]));
    color.cie_l = lab[0];
    color.cie_a = lab[1];
    color.cie_b = lab[2];

    return true;
  };

  this.lab2rgb = function () {
    var color, ce = _me.coloreditor;
    if (!ce || !(color = ce.color)) {
      return false;
    }

    var rgb = ce.xyz2rgb(ce.lab2xyz(color.cie_l, color.cie_a, color.cie_b));
    color.red   = rgb[0];
    color.green = rgb[1];
    color.blue  = rgb[2];

    return true;
  };

  this.xyz2lab = function (xyz) {
    var cfg = _me.coloreditor.lab,

      // 216/24389 or (6/29)^3 (both = 0.008856...)
      e = 216/24389,

      // 903.296296...
      k = 24389/27;

    xyz[0] /= cfg.w_x;
    xyz[1] /= cfg.w_y;
    xyz[2] /= cfg.w_z;

    if (xyz[0] > e) {
      xyz[0] = Math.pow(xyz[0], 1/3);
    } else {
      xyz[0] = (k*xyz[0] + 16)/116;
    }

    if (xyz[1] > e) {
      xyz[1] = Math.pow(xyz[1], 1/3);
    } else {
      xyz[1] = (k*xyz[1] + 16)/116;
    }

    if (xyz[2] > e) {
      xyz[2] = Math.pow(xyz[2], 1/3);
    } else {
      xyz[2] = (k*xyz[2] + 16)/116;
    }

    var cie_l = 116 *  xyz[1] - 16,
      cie_a = 500 * (xyz[0] -  xyz[1]),
      cie_b = 200 * (xyz[1] -  xyz[2]);

    return [cie_l, cie_a, cie_b];
  };

  this.lab2xyz = function (cie_l, cie_a, cie_b) {
    var y = (cie_l + 16) / 116;

    var x = y + cie_a / 500,
      z = y - cie_b / 200;

    var // 0.206896551...
      e = 6/29,

      // 7.787037...
      k = 1/3 * Math.pow(29/6, 2),

      // 0.137931...
      t = 16/116,
      cfg = _me.coloreditor.lab;

    if (x > e) {
      x = Math.pow(x, 3);
    } else {
      x = (x - t) / k;
    }

    if (y > e) {
      y = Math.pow(y, 3);
    } else {
      y = (y - t) / k;
    }

    if (z > e) {
      z = Math.pow(z, 3);
    } else {
      z = (z - t) / k;
    }

    x *= cfg.w_x;
    y *= cfg.w_y;
    z *= cfg.w_z;

    return [x, y, z];
  };

  this.xyz2rgb = function (xyz) {
    var rgb = _me.coloreditor.calc_m1x3(xyz, _me.coloreditor.lab.m_i);

    if (rgb[0] > 0.0031308) {
      rgb[0] = 1.055 * Math.pow(rgb[0], 1 / 2.4) - 0.055;
    } else {
      rgb[0] *= 12.9232;
    }

    if (rgb[1] > 0.0031308) {
      rgb[1] = 1.055 * Math.pow(rgb[1], 1 / 2.4) - 0.055;
    } else {
      rgb[1] *= 12.9232;
    }

    if (rgb[2] > 0.0031308) {
      rgb[2] = 1.055 * Math.pow(rgb[2], 1 / 2.4) - 0.055;
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

  this.rgb2xyz = function (rgb) {
    if (rgb[0] > 0.04045) {
      rgb[0] = Math.pow(( rgb[0] + 0.055 ) / 1.055, 2.4);
    } else {
      rgb[0] /= 12.9232;
    }

    if (rgb[1] > 0.04045) {
      rgb[1] = Math.pow(( rgb[1] + 0.055 ) / 1.055, 2.4);
    } else {
      rgb[1] /= 12.9232;
    }

    if (rgb[2] > 0.04045) {
      rgb[2] = Math.pow(( rgb[2] + 0.055 ) / 1.055, 2.4);
    } else {
      rgb[2] /= 12.9232;
    }

    return _me.coloreditor.calc_m1x3(rgb, _me.coloreditor.lab.m);
  };

  // This function updates/redraws the entire color editor canvas. This is done 
  // by calling two methods: draw_chart() and draw_slider(). Additionally, this 
  // function updates the coordinates of the chart dot and of the slider 
  // handler.
  // The ckey argument tells which color key has been updated. This is used to 
  // determine which canvas parts need to be updated.
  this.update_canvas = function (updated_ckey) {
    var ce = _me.coloreditor;
    if (!ce || !ce.draw_chart || !ce.draw_slider || !ce.ckey_active) {
      return false;
    }

    if (ce.tab_picker != 'cmixer') {
      ce.update_canvas_needed = true;
      return true;
    }

    ce.update_canvas_needed = false;

    var slider  = ce.elems.slider_pos.style,
      chart   = ce.elems.chart_pos.style,
      color   = ce.color,
      ckey    = ce.ckey_active,
      group   = ce.ckey_active_group,
      adjoint = ce.ckey_adjoint,
      width   = ce.chart_width,
      height  = ce.context2d.canvas.height,
      mx, my, sy;

    // Update the slider which shows the position of the active ckey.
    if (updated_ckey != adjoint[0] && updated_ckey != adjoint[1] && ce.ev_canvas_mode != 'chart') {
      if (group == 'lab') {
        sy = (color[ckey] - ce.value_min[ckey]) / ce.abs_max[ckey];
      } else {
        sy = color[ckey];
      }

      if (ckey != 'hue' && group != 'lab') {
        sy = 1 - sy;
      }

      slider.top = Math.round(sy * height) + 'px';
    }

    // Update the chart dot.
    if (updated_ckey != ckey) {
      if (group == 'lab') {
        mx = (color[adjoint[0]] - ce.value_min[adjoint[0]]) / ce.abs_max[adjoint[0]];
        my = (color[adjoint[1]] - ce.value_min[adjoint[1]]) / ce.abs_max[adjoint[1]];
      } else {
        mx = color[adjoint[0]];
        my = 1 - color[adjoint[1]];
      }

      chart.top  = Math.round(my * height) + 'px';
      chart.left = Math.round(mx *  width) + 'px';
    }

    if (!ce.draw_chart(updated_ckey) || !ce.draw_slider(updated_ckey)) {
      return false;
    } else {
      return true;
    }
  };

  // This is the handler for mouse events sent to the #controls element, which 
  // is positioned on top of the canvas. This function updates the current color 
  // key value based on the mouse coordinates on the slider. If the mouse is 
  // inside the color chart, then the adjoint color keys are updated based on 
  // the coordinates.
  this.ev_canvas = function (ev) {
    var mode, ce = _me.coloreditor;
    if (!ce || !ce.elems || !ce.elems.controls || !ce.elems.slider_pos || !ce.elems.chart_pos || !ce.context2d || !ce.chart_width || !ce.ckey_active || !ce.slider_x || !ev || !ev.target) {
      return false;
    }

    if (ev.preventDefault) {
      ev.preventDefault();
    }

    // Initialize color picking only on mousedown.
    if (ev.type == 'mousedown' && !ce.ev_canvas_mode) {
      ce.ev_canvas_mode = true;
      _me.doc.addEventListener('mouseup', ce.ev_canvas, false);
    }

    if (!ce.ev_canvas_mode) {
      return false;
    }

    // The mouseup event stops the effect of any further mousemove events.
    if (ev.type == 'mouseup') {
      ce.ev_canvas_mode = false;
      _me.doc.removeEventListener('mouseup', ce.ev_canvas, false);
    }

    var tid = ev.target.id,
      elems = ce.elems;

    // If the user is on top of the 'controls' element, determine the mouse coordinates and the 'mode' for this function: the user is either working with the slider, or he/she is working with the color chart itself.
    if (tid == elems.controls.id) {
      var mx, my,
        width  = ce.context2d.canvas.width,
        height = ce.context2d.canvas.height;

      // Get the mouse position, relative to the event target.
      if (ev.layerX || ev.layerX == 0) { // Firefox
        mx = ev.layerX;
        my = ev.layerY;
      } else if (ev.offsetX || ev.offsetX == 0) { // Opera
        mx = ev.offsetX;
        my = ev.offsetY;
      }

      if (mx >= 0 && mx <= ce.chart_width) {
        mode = 'chart';
      } else if (mx >= ce.slider_x && mx <= width) {
        mode = 'slider';
      }
    } else {
      // The user might have clicked on the chart dot, or on the slider graphic itself.
      // If yes, then determine the mode based on this.
      if (tid == elems.chart_pos.id) {
        mode = 'chart';
      } else if (tid == elems.slider_pos.id) {
        mode = 'slider';
      }
    }

    // Update the ev_canvas_mode value to include the mode name, if it's simply the true boolean.
    // This ensures that the continuous mouse movements do not go from one mode to another when the user moves out from the slider to the chart (and vice-versa).
    if (mode && ce.ev_canvas_mode === true) {
      ce.ev_canvas_mode = mode;
    }

    // Do not continue if the mode wasn't determined (the mouse is not on the slider, nor on the chart).
    // Also don't continue if the mouse is not in the same place (different mode).
    if (!mode || ce.ev_canvas_mode != mode || tid != elems.controls.id || !ce.inputs) {
      return false;
    }

    var color = ce.color,
      val_x = mx / ce.chart_width,
      val_y = my / height;

    if (mode == 'slider') {
      if (ce.ckey_active == 'hue') {
        color[ce.ckey_active] = val_y;
      } else if (ce.ckey_active_group == 'lab') {
        color[ce.ckey_active] = ce.abs_max[ce.ckey_active] * val_y + ce.value_min[ce.ckey_active];
      } else {
        color[ce.ckey_active] = 1 - val_y;
      }

      return ce.update_color(ce.ckey_active);

    } else if (mode == 'chart') {
      if (ce.ckey_active_group == 'lab') {
        val_x = ce.abs_max[ce.ckey_adjoint[0]] * val_x + ce.value_min[ce.ckey_adjoint[0]];
        val_y = ce.abs_max[ce.ckey_adjoint[1]] * val_y + ce.value_min[ce.ckey_adjoint[1]];
      } else {
        val_y = 1 - val_y;
      }

      color[ce.ckey_adjoint[0]] = val_x;
      color[ce.ckey_adjoint[1]] = val_y;

      return ce.update_color(ce.ckey_active_group);
    }

    return false;
  };

  // When the user double clicks the canvas, this event handler toggles the 
  // double size mode on/off.
  this.ev_dblclick_canvas = function (ev) {
    var ce = _me.coloreditor;
    if (!ce || !ce.elems || !ce.elems.tab_cmixer || !ce.context2d || !ce.context2d.canvas) {
      return false;
    }

    var tab    = ce.elems.tab_cmixer,
      canvas = ce.context2d.canvas;

    if (tab.className == 'double') {
      canvas.width  /= 2;
      canvas.height /= 2;
      tab.className = '';
    } else {
      canvas.width  *= 2;
      canvas.height *= 2;
      tab.className = 'double';
    }

    ce.update_dimensions();

    if (ce.tab_picker != 'cmixer') {
      ce.update_canvas_needed = true;
      return ce.show_tab('cmixer');
    } else {
      return ce.update_canvas();
    }
  };

  // Draw the canvas color chart.
  // The ckey argument tells which color key has been updated. This is used to 
  // determine if the canvas color chart needs to be updated.
  this.draw_chart = function (updated_ckey) {
    var ce = _me.coloreditor;
    if (!ce || !ce.context2d || !ce.context2d.canvas || !ce.ckey_active || !ce.inputs || !ce.inputs[ce.ckey_active]) {
      return false;
    }

    var canvas  = ce.context2d.canvas,
      context = ce.context2d,
      gradient, color, opacity, i;

    if (updated_ckey == ce.ckey_adjoint[0] || updated_ckey == ce.ckey_adjoint[1] || (ce.ev_canvas_mode == 'chart' && updated_ckey == ce.ckey_active_group)) {
      return true;
    }

    var w = ce.chart_width,
      h = canvas.height;

    context.clearRect(0, 0, w, h);

    if (ce.ckey_active == 'sat') {
      // In saturation mode the user has the slider which allows him/her to change the saturation (hSv) of the current color.
      // The chart shows the hue spectrum on the X axis, while the Y axis gives the Value (hsV).

      if (ce.color.sat > 0) {
        // Draw the hue spectrum gradient on the X axis.
        gradient = context.createLinearGradient(0, 0, w, 0);
        for (i = 0; i <= 6; i++) {
          color = 'rgb(' + ce.hue[i][0] + ', ' + ce.hue[i][1] + ', ' + ce.hue[i][2] + ')';
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

      if (ce.color.sat < 1) {
        // Draw the white to black gradient. This is used for creating the saturation effect. Lowering the saturation value makes the gradient more visible, hence the hue colors desaturate.
        opacity = 1 - ce.color.sat;
        gradient = context.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(255, 255, 255, ' + opacity + ')');
        gradient.addColorStop(1, 'rgba(  0,   0,   0, ' + opacity + ')');
        context.fillStyle = gradient;
        context.fillRect(0, 0, w, h);
      }

    } else if (ce.ckey_active == 'val') {
      // In value mode the user has the slider which allows him/her to change the value (hsV) of the current color.
      // The chart shows the hue spectrum on the X axis, while the Y axis gives the saturation (hSv).

      if (ce.color.val > 0) {
        // Draw the hue spectrum gradient on the X axis.
        gradient = context.createLinearGradient(0, 0, w, 0);
        for (i = 0; i <= 6; i++) {
          color = 'rgb(' + ce.hue[i][0] + ', ' + ce.hue[i][1] + ', ' + ce.hue[i][2] + ')';
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

      if (ce.color.val < 1) {
        // Draw a solid black color on top. This is used for darkening the hue colors gradient when the user reduces the Value (hsV).
        context.fillStyle = 'rgba(0, 0, 0, ' + (1 - ce.color.val) +')';
        context.fillRect(0, 0, w, h);
      }

    } else if (ce.ckey_active == 'hue') {
      // In hue mode the user has the slider which allows him/her to change the hue (Hsv) of the current color.
      // The chart shows the current color in the background. The X axis gives the saturation (hSv), and the Y axis gives the value (hsV).

      if (ce.color.sat == 1 && ce.color.val == 1) {
        color = [ce.color.red, ce.color.green, ce.color.blue];
      } else {
        // Determine the RGB values for the current color which has the same hue, but maximum saturation and value (hSV).
        color = ce.hsv2rgb(true, [ce.color.hue, 1, 1]);
      }
      for (i = 0; i < 3; i++) {
        color[i] = Math.round(color[i] * 255);
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

    } else if (ce.ckey_active_group == 'rgb') {
      // In any red/green/blue mode the background color becomes the one of the ckey_active. Say, for ckey_active=red the background color would be the current red value (green and blue are both set to 0).
      // On the X/Y axes the other two colors are shown. E.g. for red the X axis gives the green gradient, and the Y axis gives the blue gradient. The two gradients are drawn on top of the red background using a global composite operation (lighter) - to create the color addition effect.
      var color2, color3;

      color = {'red' : 0, 'green' : 0, 'blue' : 0};
      color[ce.ckey_active] = Math.round(ce.color[ce.ckey_active] * 255);

      color2 = {'red' : 0, 'green' : 0, 'blue' : 0};
      color2[ce.ckey_adjoint[1]] = 255;

      color3 = {'red' : 0, 'green' : 0, 'blue' : 0};
      color3[ce.ckey_adjoint[0]] = 255;

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

    } else if (ce.ckey_active_group == 'lab') {
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

      cie_x = ce.ckey_adjoint[0];
      cie_y = ce.ckey_adjoint[1];

      color = {
        'cie_l' : ce.color.cie_l,
        'cie_a' : ce.color.cie_a,
        'cie_b' : ce.color.cie_b
      };

      inc_x = ce.abs_max[cie_x] / w;
      inc_y = ce.abs_max[cie_y] / h;

      color[cie_x] = ce.value_min[cie_x];
      color[cie_y] = ce.value_min[cie_y];

      while (i < n) {
        xyz = ce.lab2xyz(color.cie_l, color.cie_a, color.cie_b);
        rgb = ce.xyz2rgb(xyz);

        pix[++i] = Math.round(rgb[0]*255);
        pix[++i] = Math.round(rgb[1]*255);
        pix[++i] = Math.round(rgb[2]*255);
        pix[++i] = 255;

        p++;
        color[cie_x] += inc_x;

        if ((p % w) == 0) {
          color[cie_x] = ce.value_min[cie_x];
          color[cie_y] += inc_y;
        }
      }

      context.putImageData(imgd, 0, 0);
    }

    return true;
  };

  // Draw the canvas color slider.
  // The ckey argument tells which color key has been updated. This is used to 
  // determine if the canvas color chart needs to be updated.
  this.draw_slider = function (updated_ckey) {
    var ce = _me.coloreditor;
    if (!ce || !ce.context2d || !ce.context2d.canvas || !ce.ckey_active || !ce.inputs || !ce.inputs[ce.ckey_active]) {
      return false;
    }

    if (ce.ckey_active == updated_ckey) {
      return true;
    }

    var context = ce.context2d,
      slider_w = ce.slider_width,
      slider_h = ce.context2d.canvas.height - 1,
      slider_x = ce.slider_x,
      slider_y = 0,
      gradient, color, opacity, i;

    gradient = context.createLinearGradient(slider_x, slider_y, slider_x, slider_h);

    if (ce.ckey_active == 'hue') {
      // Draw the hue spectrum gradient.
      for (i = 0; i <= 6; i++) {
        color = 'rgb(' + ce.hue[i][0] + ', ' + ce.hue[i][1] + ', ' + ce.hue[i][2] + ')';
        gradient.addColorStop(i * 1/6, color);
      }
      context.fillStyle = gradient;
      context.fillRect(slider_x, slider_y, slider_w, slider_h);

      if (ce.color.sat < 1) {
        context.fillStyle = 'rgba(255, 255, 255, ' + (1 - ce.color.sat) + ')';
        context.fillRect(slider_x, slider_y, slider_w, slider_h);
      }
      if (ce.color.val < 1) {
        context.fillStyle = 'rgba(0, 0, 0, ' + (1 - ce.color.val) + ')';
        context.fillRect(slider_x, slider_y, slider_w, slider_h);
      }

    } else if (ce.ckey_active == 'sat') {
      // Draw the saturation gradient for the slider.
      // The start color is the current color with maximum saturation. The bottom gradient color is the same "color" without saturation.
      // The slider allows you to desaturate the current color.

      // Determine the RGB values for the current color which has the same hue and value (HsV), but maximum saturation (hSv).
      if (ce.color.sat == 1) {
        color = [ce.color.red, ce.color.green, ce.color.blue];
      } else {
        color = ce.hsv2rgb(true, [ce.color.hue, 1, ce.color.val]);
      }

      for (i = 0; i < 3; i++) {
        color[i] = Math.round(color[i] * 255);
      }

      var gray = Math.round(ce.color.val * 255);
      gradient.addColorStop(0, 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')');
      gradient.addColorStop(1, 'rgb(' + gray     + ', ' + gray     + ', ' + gray     + ')');
      context.fillStyle = gradient;
      context.fillRect(slider_x, slider_y, slider_w, slider_h);

    } else if (ce.ckey_active == 'val') {
      // Determine the RGB values for the current color which has the same hue and saturation, but maximum value (hsV).
      if (ce.color.val == 1) {
        color = [ce.color.red, ce.color.green, ce.color.blue];
      } else {
        color = ce.hsv2rgb(true, [ce.color.hue, ce.color.sat, 1]);
      }

      for (i = 0; i < 3; i++) {
        color[i] = Math.round(color[i] * 255);
      }

      gradient.addColorStop(0, 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')');
      gradient.addColorStop(1, 'rgb(0, 0, 0)');
      context.fillStyle = gradient;
      context.fillRect(slider_x, slider_y, slider_w, slider_h);

    } else if (ce.ckey_active_group == 'rgb') {
      var red   = Math.round(ce.color.red   * 255),
        green = Math.round(ce.color.green * 255),
        blue  = Math.round(ce.color.blue  * 255);

      color = {
        'red'   : red,
        'green' : green,
        'blue'  : blue
      };
      color[ce.ckey_active] = 255;

      var color2 = {
        'red'   : red,
        'green' : green,
        'blue'  : blue
      };
      color2[ce.ckey_active] = 0;

      gradient.addColorStop(0, 'rgb(' + color.red  + ',' + color.green  + ',' + color.blue  + ')');
      gradient.addColorStop(1, 'rgb(' + color2.red + ',' + color2.green + ',' + color2.blue + ')');
      context.fillStyle = gradient;
      context.fillRect(slider_x, slider_y, slider_w, slider_h);

    } else if (ce.ckey_active_group == 'lab') {
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
        ckey = ce.ckey_active,
        i = -1, inc, xyz, rgb;

      color = {
        'cie_l' : ce.color.cie_l,
        'cie_a' : ce.color.cie_a,
        'cie_b' : ce.color.cie_b
      };

      color[ckey] = ce.value_min[ckey];
      inc = ce.abs_max[ckey] / slider_h;

      while (i < n) {
        xyz = ce.lab2xyz(color.cie_l, color.cie_a, color.cie_b);
        rgb = ce.xyz2rgb(xyz);
        pix[++i] = Math.round(rgb[0]*255);
        pix[++i] = Math.round(rgb[1]*255);
        pix[++i] = Math.round(rgb[2]*255);
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

