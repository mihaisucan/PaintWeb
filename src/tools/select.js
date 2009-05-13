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
 * $Date: 2009-05-13 23:25:56 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the selection tool implementation.
 */

/**
 * @class The selection tool.
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
PaintWebInstance.toolAdd('select', function (app) {
  var _self         = this,
      bufferCanvas  = app.buffer.canvas,
      bufferContext = app.buffer.context,
      bufferStyle   = app.buffer.canvas.style,
      config        = app.config,
      elems         = app.elems,
      historyAdd    = app.historyAdd,
      image         = app.image,
      inputs        = app.inputs,
      layerCanvas   = app.layer.canvas,
      layerContext  = app.layer.context,
      MathAbs       = Math.abs,
      MathMin       = Math.min,
      MathRound     = Math.round,
      mouse         = app.mouse,
      snapXY        = app.toolSnapXY,
      statusShow    = app.statusShow;

  /**
   * The selection has been dropped, and the mouse button is down. The user has 
   * two choices: he releases the mouse button, thus the selection is dropped 
   * and the tool switches to STATE_NONE, or he moves the mouse in order to 
   * start a new selection (STATE_DRAWING).
   * @constant
   */
  this.STATE_PENDING = -1;

  /**
   * No selection is available.
   * @constant
   */
  this.STATE_NONE = 0;

  /**
   * The user is drawing a selection.
   * @constant
   */
  this.STATE_DRAWING = 1;

  /**
   * The selection rectangle is available.
   * @constant
   */
  this.STATE_SELECTED = 2;

  /**
   * The user is dragging/moving the selection rectangle.
   * @constant
   */
  this.STATE_DRAGGING = 3;

  /**
   * The user is resizing the selection rectangle.
   * @constant
   */
  this.STATE_RESIZING = 4;

  /**
   * Selection state. Known states:
   *
   * <ul>
   *   <li>{@link this.STATE_PENDING} - Selection dropped after the 
   *   <code>mousedown</code> event is fired. The script can switch to 
   *   STATE_DRAWING if the mouse moves, or to STATE_NONE if it does not 
   *   (allowing the user to drop the selection).
   *
   *   <li>{@link this.STATE_NONE} - No selection is available.
   *
   *   <li>{@link this.STATE_DRAWING} - The user is drawing the selection 
   *   rectangle.
   *
   *   <li>{@link this.STATE_SELECTED} - The selection rectangle is available.
   *
   *   <li>{@link this.STATE_DRAGGING} - The user is dragging/moving the current 
   *   selection.
   *
   *   <li>{@link this.STATE_RESIZING} - The user is resizing the current 
   *   selection.
   * </ul>
   *
   * @type Number
   * @default this.STATE_NONE
   */
  this.state = this.STATE_NONE;

  /**
   * Holds the starting point on the <var>x</var> axis of the image, for any 
   * ongoing operation.
   *
   * @private
   * @type Number
   */
  var x0 = 0;

  /**
   * Holds the starting point on the <var>y</var> axis of the image, for the any  
   * ongoing operation.
   *
   * @private
   * @type Number
   */
  var y0 = 0;

  /**
   * Holds selection information and image.
   * @type Object
   */
  this.selection = {
    /**
     * Selection start point, on the <var>x</var> axis.
     * @type Number
     */
    x: 0,

    /**
     * Selection start point, on the <var>y</var> axis.
     * @type Number
     */
    y: 0,

    /**
     * Selection width.
     * @type Number
     */
    width: 0,

    /**
     * Selection height.
     * @type Number
     */
    height: 0,

    /**
     * Selection original width. The user can make a selection rectangle of 
     * a given width and height, but after that he/she can resize the selection.
     * @type Number
     */
    widthOriginal: 0,

    /**
     * Selection original height. The user can make a selection rectangle of 
     * a given width and height, but after that he/she can resize the selection.
     * @type Number
     */
    heightOriginal: 0,

    /**
     * The last <var>bufferContext.lineWidth</var>, used for drawing the 
     * selection rectangle border.
     * @type Number
     */
    lineWidth: 0,

    /**
     * Tells if the selected ImageData has been cut out or not from the 
     * layerContext.
     *
     * @type Boolean
     * @default false
     */
    layerCleared: false,

    /**
     * Tells if the selection background is transparent or not.
     *
     * @type Boolean
     * @default false
     */
    transparent: false,

    /**
     * Tells if the selection transformation mode is active or not. During 
     * transformation mode any drag/resize operation will also cause the 
     * dragging/resizing to be applied to the selected pixels. Otherwise, only 
     * the selection rectangle itself is affected.
     *
     * @type Boolean
     * @default false
     */
    transform: false,

    /**
     * Selection buffer context which holds the selected pixels.
     * @type CanvasRenderingContext2D
     */
    context: null,

    /**
     * Selection buffer canvas which holds the selected pixels.
     * @type HTMLCanvasElement
     */
    canvas: null
  };

  /**
   * The area type under the current mouse location.
   * 
   * <p>During state 2 (selection available) the mouse location can be on 
   * top/inside the selection rectangle, on the border of the selection, or 
   * outside the selection.
   *
   * <p>Possible values: 'in', 'out', 'border'.
   *
   * @private
   * @type String
   * @default 'out'
   */
  var mouseArea = 'out';

  /**
   * The resize type. If the mouse is on top of the selection border, then the 
   * selection can be resized. The direction of the resize operation is 
   * determined by the location of the mouse.
   * 
   * <p>During the states 4 and 6 (resizing selection/ImageData) the property 
   * can hold the following values: 'n' (North), 'ne' (North-East), 'e' (East), 
   * 'se' (South-East), 's' (South), 'sw' (South-West), 'w' (West), 'nw' 
   * (North-West).
   *
   * @private
   * @type String
   * @default null
   */
  var mouseResize = null;

  /**
   * Tells if the shadow effect was enabled before activating the selection 
   * tool.
   *
   * @private
   * @type Boolean
   * @default false
   */
  var shadowActive = false;

  /**
   * Tool initialization logic. This method is run automatically when the tool 
   * object is instanced/constructed.
   *
   * @private
   */
  function init () {
    var sel = _self.selection;

    // Show the selection options.
    elems.selectionOptions.className = '';

    // Older browsers do not support get/putImageData, thus non-transparent 
    // selections cannot be used.
    if (!layerContext.putImageData || !layerContext.getImageData) {
      inputs.selTransparent.checked = true;
    }

    sel.transparent = inputs.selTransparent.checked;
    sel.transform   = inputs.selTransform.checked;

    // Make sure that the selection rectangle is visible enough.
    var strokeStyle = inputs.strokeStyle;
    if (strokeStyle && parseFloat(strokeStyle._value.a) < 0.5) {
      // FIXME: this is not working, at the moment. Needs the ColorEditor 
      // extension.
      strokeStyle._value.a = 1;
      strokeStyle.style.opacity = 1;
      bufferContext[strokeStyle._prop] = 'rgb(' + strokeStyle._value.r + ',' 
          + strokeStyle._value.g + ',' + strokeStyle._value.b + ')';
    }

    // The selection image buffer.
    sel.canvas = app.doc.createElement('canvas');
    if (!sel.canvas) {
      alert(lang.errorToolActivate);
      _self._cancel = true;
      return false;
    }

    sel.canvas.id     = 'selBuffer';
    sel.canvas.width  = image.width;
    sel.canvas.height = image.height;

    elems.container.appendChild(sel.canvas);

    sel.context = sel.canvas.getContext('2d');
    if (!sel.context) {
      alert(lang.errorToolActivate);
      _self._cancel = true;
      return false;
    }

    inputs.selTransparent.addEventListener('change', transparencyChange, false);

    lineWidthUpdate();

    return true;
  };

  /**
   * The tool activation code. This is run after the tool construction and after 
   * the previous tool object is destructed.
   */
  this.activate = function () {
    // Disable the bufferCanvas shadow.
    if (inputs.shadowActive) {
      shadowActive = inputs.shadowActive.checked;
      app.shadowDisable();
      inputs.shadowActive.disabled = true;
    }

    return true;
  };

  /**
   * The tool deactivation code.
   */
  this.deactivate = function () {
    selectionBufferMerge();

    var sel = _self.selection;

    elems.container.removeChild(sel.canvas);
    delete sel.context, sel.canvas;

    inputs.selTransparent.removeEventListener('change', transparencyChange, 
        false);

    // Minimize the selection options.
    elems.selectionOptions.className = 'minimized';

    // Re-enable canvas shadow.
    if (inputs.shadowActive) {
      inputs.shadowActive.disabled = false;
      if (shadowActive) {
        app.shadowEnable();
      }
    }

    return true;
  };

  /**
   * The <code>mousedown</code> event handler. Depending on the mouse location, 
   * this method does initiate different selection operations: drawing, 
   * dropping, dragging or resizing.
   *
   * <p>Hold the <kbd>Control</kbd> key down to temporarily toggle the 
   * transformation mode.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousedown = function (ev) {
    if (_self.state != _self.STATE_NONE &&
        _self.state != _self.STATE_SELECTED) {
      return false;
    }

    // Update the current mouse position, this is used as the start position for most of the operations.
    x0 = mouse.x;
    y0 = mouse.y;

    lineWidthUpdate();

    // No selection is available, then start drawing a selection.
    if (_self.state == _self.STATE_NONE) {
      _self.state = _self.STATE_DRAWING;
      statusShow('selectDraw');

      return true;
    }

    // STATE_SELECTED: selection available.
    mouseAreaUpdate(ev);

    var sel = _self.selection;

    /*
     * Check if the user clicked outside the selection: drop the selection, 
     * switch to STATE_PENDING, clear the image buffer and put the current 
     * selection buffer in the image layer.
     *
     * If the user moves the mouse without taking the finger off the mouse 
     * button, then a new selection rectangle will start to be drawn: the script 
     * will switch to STATE_DRAWING.
     *
     * If the user simply takes the finger off the mouse button (mouseup), then 
     * the script will switch to STATE_NONE (no selection available).
     */
    switch (mouseArea) {
      case 'out':
        _self.state = _self.STATE_PENDING;
        statusShow('selectActive');
        return selectionBufferMerge(); // done

      case 'in':
        // The mouse area: 'in' for drag.
        _self.state = _self.STATE_DRAGGING;
        statusShow('selectDrag');
        break;

      case 'border':
        // 'border' for resize (the user is clicking on the borders).
        _self.state = _self.STATE_RESIZING;
        statusShow('selectResize');
    }

    // Update the boolean from the input.
    sel.transform = inputs.selTransform.checked;

    // Temporarily toggle the transformation mode if the user holds the Control 
    // key down.
    if (ev.ctrlKey) {
      sel.transform = !sel.transform;
    }

    // If there's any ImageData currently in memory, which was "cut" out from 
    // the current layer, then put it back on the layer. This needs to be done 
    // only when the selection.transform mode is not active - that's when the 
    // drag/resize operation only changes the selection, not the pixels 
    // themselves.
    if (sel.layerCleared && !sel.transform) {
      selectionBufferMerge(true);
    }

    // When the user starts dragging/resizing the ImageData we must cut out the 
    // current selection from the image layer.
    if (!sel.layerCleared && sel.transform) {
      selectionBufferInit();
    }

    return true;
  };

  /**
   * The <code>mousemove</code> event handler. When the mouse button is down, 
   * this method performs the dragging/resizing operation. When the mouse button 
   * is not down, this method simply tracks the mouse location for the purpose 
   * of determining the area being pointed at: the selection, the borders, or if 
   * the mouse is outside the selection.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    switch (_self.state) {
      case _self.STATE_PENDING:
        // selection dropped, switch to draw selection
        _self.state = _self.STATE_DRAWING;
        statusShow('selectDraw');

      case _self.STATE_DRAWING:
        return selectionDraw(ev);

      case _self.STATE_SELECTED:
        return mouseAreaUpdate(ev);

      case _self.STATE_DRAGGING:
        return selectionDrag(ev);

      case _self.STATE_RESIZING:
        return selectionResize(ev);

      default: // unknown state
        return false;
    }
  };

  /**
   * The <code>mouseup</code> event handler. This method ends any selection 
   * operation.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mouseup = function (ev) {
    // Allow click+mousemove+click, not only mousedown+move+up
    if (_self.state != _self.STATE_PENDING &&
        mouse.x == x0 && mouse.y == y0) {
      return true;
    }

    var result = null,
        sel = _self.selection;

    switch (_self.state) {
      case _self.STATE_PENDING:
        // Selection dropped? If yes, switch to the no selection state.
        _self.state = _self.STATE_NONE;
        statusShow('selectActive');
        return true;

      case _self.STATE_DRAWING:
        result = selectionDraw(ev);
        if (result) {
          result[0] += sel.lineWidth / 2;
          result[1] += sel.lineWidth / 2;
          result[2] -= sel.lineWidth;
          result[2] -= sel.lineWidth;
        }

        break;

      case _self.STATE_DRAGGING:
        result = selectionDrag(ev);
        break;

      case _self.STATE_RESIZING:
        result = selectionResize(ev);
        break;

      default:
        return false;
    }

    if (!result) {
      _self.state = _self.STATE_NONE;
      app.btn_cut(-1);
      app.btn_copy(-1);
      return false;
    }

    sel.x = result[0];
    sel.y = result[1];

    if (result.length == 4) {
      sel.width  = result[2];
      sel.height = result[3];
    }

    _self.state = _self.STATE_SELECTED;

    app.btn_cut(1);
    app.btn_copy(1);
    statusShow('selectAvailable');

    return true;
  };

  /**
   * Perform the selection rectangle drawing operation.
   *
   * @private
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {false|Array} False is returned if the selection is too small, 
   * otherwise an array of four elements is returned. The array holds the 
   * selection information: x, y, width and height.
   */
  function selectionDraw (ev) {
    var x = MathMin(mouse.x,  x0),
        y = MathMin(mouse.y,  y0),
        w = MathAbs(mouse.x - x0),
        h = MathAbs(mouse.y - y0);

    // Constrain the shape to a square.
    if (ev.shiftKey) {
      if (w > h) {
        if (y == mouse.y) {
          y -= w-h;
        }
        h = w;
      } else {
        if (x == mouse.x) {
          x -= h-w;
        }
        w = h;
      }
    }

    bufferContext.clearRect(0, 0, image.width, image.height);

    if (!w || !h) {
      return false;
    }

    bufferContext.strokeRect(x, y, w, h);

    return [x, y, w, h];
  };

  /**
   * Perform the selection drag operation.
   *
   * @private
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {false|Array} False is returned if the selection is too small, 
   * otherwise an array of two elements is returned. The array holds the 
   * selection coordinates, x and y.
   */
  function selectionDrag (ev) {
    // Snapping on the X/Y axis
    if (ev.shiftKey) {
      snapXY(x0, y0);
    }

    var sel = _self.selection;

    var x = sel.x + mouse.x - x0,
        y = sel.y + mouse.y - y0;

    bufferContext.clearRect(0, 0, image.width, image.height);

    // Dragging the ImageData
    if (sel.transform) {
      if (!sel.transparent) {
        bufferContext.fillRect(x, y, sel.width, sel.height);
      }

      // Parameters:
      // source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
      bufferContext.drawImage(sel.canvas, 0, 0, sel.widthOriginal, 
          sel.heightOriginal, x, y, sel.width, sel.height);
    }

    bufferContext.strokeRect(x - sel.lineWidth / 2, y - sel.lineWidth / 2, 
        sel.width + sel.lineWidth, sel.height + sel.lineWidth);

    return [x, y];
  };

  /**
   * Perform the selection resize operation.
   *
   * @private
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {false|Array} False is returned if the selection is too small, 
   * otherwise an array of four elements is returned. The array holds the 
   * selection information: x, y, width and height.
   */
  function selectionResize (ev) {
    var sel = _self.selection;

    var diffx = mouse.x - x0,
        diffy = mouse.y - y0,
        x     = sel.x,
        y     = sel.y,
        w     = sel.width,
        h     = sel.height;

    switch (mouseResize) {
      case 'nw':
        x += diffx;
        y += diffy;
        w -= diffx;
        h -= diffy;
        break;
      case 'n':
        y += diffy;
        h -= diffy;
        break;
      case 'ne':
        y += diffy;
        w += diffx;
        h -= diffy;
        break;
      case 'e':
        w += diffx;
        break;
      case 'se':
        w += diffx;
        h += diffy;
        break;
      case 's':
        h += diffy;
        break;
      case 'sw':
        x += diffx;
        w -= diffx;
        h += diffy;
        break;
      case 'w':
        x += diffx;
        w -= diffx;
        break;
      default:
        return false;
    }

    if (!w || !h) {
      return false;
    }

    // Constrain the rectangle to have the same aspect ratio as the initial rectangle.
    if (ev.shiftKey) {
      var p = sel.width / sel.height,
          w2 = w, h2 = h;

      switch (mouseResize.charAt(0)) {
        case 'n':
        case 's':
          w2 = MathRound(h*p);
          break;
        default:
          h2 = MathRound(w/p);
      }

      switch (mouseResize) {
        case 'nw':
        case 'sw':
          x -= w2 - w;
          y -= h2 - h;
      }

      w = w2;
      h = h2;
    }

    if (w < 0) {
      x += w;
      w *= -1;
    }
    if (h < 0) {
      y += h;
      h *= -1;
    }

    bufferContext.clearRect(0, 0, image.width, image.height);

    // Resizing the ImageData
    if (sel.transform) {
      if (!sel.transparent) {
        bufferContext.fillRect(x, y, w, h);
      }

      // Parameters:
      // source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
      bufferContext.drawImage(sel.canvas, 0, 0, sel.widthOriginal, 
          sel.heightOriginal, x, y, w, h);
    }

    bufferContext.strokeRect(x - sel.lineWidth / 2, y - sel.lineWidth / 2, 
        w + sel.lineWidth, h + sel.lineWidth);

    return [x, y, w, h];
  };

  /**
   * Determine the are where the mouse is located: if it is inside or outside of 
   * the selection rectangle, or on the selection border.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function mouseAreaUpdate (ev) {
    var cursor = '',
        sel    = _self.selection;

    var x1     = sel.x  + sel.width,
        y1     = sel.y  + sel.height;

    var x0_out = sel.x  - sel.lineWidth,
        y0_out = sel.y  - sel.lineWidth,
        x1_out =     x1 + sel.lineWidth,
        y1_out =     y1 + sel.lineWidth;

    mouseArea = 'out';

    // Inside the rectangle
    if (mouse.x <     x1 && mouse.y <     y1 &&
        mouse.x > sel.x  && mouse.y > sel.y) {
      cursor = 'move';
      mouseArea = 'in';

    } else {
      // On one of the borders (north/south)
      if (mouse.x >= x0_out && mouse.x <= x1_out &&
          mouse.y >= y0_out && mouse.y <= sel.y) {
        cursor = 'n';

      } else if (mouse.x >= x0_out && mouse.x <= x1_out &&
                 mouse.y >= y1     && mouse.y <= y1_out) {
        cursor = 's';
      }

      // West/east
      if (mouse.y >= y0_out && mouse.y <= y1_out &&
          mouse.x >= x0_out && mouse.x <= sel.x) {
        cursor += 'w';

      } else if (mouse.y >= y0_out && mouse.y <= y1_out &&
                 mouse.x >= x1     && mouse.x <= x1_out) {
        cursor += 'e';
      }

      if (cursor != '') {
        mouseResize = cursor;
        cursor += '-resize';
        mouseArea = 'border';
      }
    }

    // Due to bug 126457 Opera will not automatically update the cursor, 
    // therefore they will not see any visual feedback.
    if (cursor != bufferStyle.cursor) {
      bufferStyle.cursor = cursor;
    }
  };

  /**
   * Update <var>selection.lineWidth</var>.
   *
   * @private
   */
  function lineWidthUpdate () {
    var sel = _self.selection;
    if (sel.lineWidth == bufferContext.lineWidth) {
      return;
    }

    sel.lineWidth = bufferContext.lineWidth;

    // When lineWidth is an odd number ... tiny pixel errors show
    if ((sel.lineWidth % 2) != 0) {
      sel.lineWidth++;
      bufferContext.lineWidth = sel.lineWidth;
      inputs.lineWidth.value = sel.lineWidth;
    }
  };

  /**
   * The <code>change</code> event handler for the selection transparency 
   * check-box input element.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function transparencyChange (ev) {
    var sel = _self.selection;

    sel.transparent = this.checked;

    // Continue only if the selection rectangle is available.
    if (!sel.transform || _self.state != _self.STATE_SELECTED) {
      return false;
    }

    if (!sel.layerCleared) {
      selectionBufferInit();
    }

    bufferContext.clearRect(0, 0, image.width, image.height);

    if (!sel.transparent) {
      bufferContext.fillRect(sel.x, sel.y, sel.width, sel.height);
    }

    // Draw the updated selection
    bufferContext.drawImage(sel.canvas, 0, 0,
        sel.widthOriginal, sel.heightOriginal,
        sel.x, sel.y, sel.width, sel.height);

    bufferContext.strokeRect(sel.x - sel.lineWidth / 2, sel.y - sel.lineWidth / 2,
        sel.width + sel.lineWidth, sel.height + sel.lineWidth);

    return true;
  };

  /**
   * Initialize the selection buffer, when the user starts dragging or resizing 
   * the selected pixels.
   *
   * @private
   */
  function selectionBufferInit () {
    var sel = _self.selection;

    var x = sel.x,
        y = sel.y,
        w = sel.width,
        h = sel.height,
        sumX = sel.x + sel.width,
        sumY = sel.y + sel.height,
        dx = 0, dy = 0;

    sel.widthOriginal  = w;
    sel.heightOriginal = h;

    if (x < 0) {
      w += x;
      dx -= x;
      x = 0;
    }
    if (y < 0) {
      h += y;
      dy -= y;
      y = 0;
    }

    if (sumX > image.width) {
      w = image.width - sel.x;
    }
    if (sumY > image.height) {
      h = image.height - sel.y;
    }

    if (!sel.transparent) {
      bufferContext.fillRect(x, y, w, h);
    }

    // Copy the currently selected ImageData into the buffer canvas
    bufferContext.drawImage(layerCanvas, x, y, w, h, x, y, w, h);

    sel.context.clearRect(0, 0, image.width, image.height);

    // Also put the selected ImageData into the selection buffer.
    // Parameters: source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
    sel.context.drawImage(layerCanvas, x, y, w, h, dx, dy, w, h);

    // Clear the selected pixels from the image
    layerContext.clearRect(x, y, w, h);
    sel.layerCleared = true;

    historyAdd();
  };

  /**
   * Merge the ImageData from the selection buffer, when the user stops dragging 
   * or resizing the selection.
   *
   * @private
   * @param {Boolean} [onlyMerge=false] Only merge the selection buffer onto the 
   * image layer. Do not clear the image buffer.
   */
  function selectionBufferMerge (onlyMerge) {
    var sel = _self.selection;

    if (!onlyMerge) {
      bufferContext.clearRect(0, 0, image.width, image.height);
      bufferStyle.cursor = '';
      app.btn_cut(-1);
      app.btn_copy(-1);
    }

    if (sel.layerCleared) {
      if (!sel.transparent) {
        layerContext.fillRect(sel.x, sel.y, sel.width, sel.height);
      }

      layerContext.drawImage(sel.canvas, 0, 0, sel.widthOriginal, 
          sel.heightOriginal, sel.x, sel.y, sel.width, sel.height);

      historyAdd();
      sel.layerCleared = false;
    }
  };

  /**
   * Cut the selected pixels. The associated ImageData is stored in 
   * <var>app.clipboard</var.
   */
  this.selectionCut = function () {
    if (!_self.selectionCopy()) {
      return false;
    }

    var sel = _self.selection;

    bufferContext.clearRect(0, 0, image.width, image.height);
    sel.context.clearRect(0, 0, image.width, image.height);

    if (!sel.layerCleared) {
      layerContext.clearRect(sel.x, sel.y, sel.width, sel.height);
      historyAdd();
    }

    sel.layerCleared = false;
    _self.state = _self.STATE_NONE;
    bufferStyle.cursor = '';

    app.btn_cut(-1);
    app.btn_copy(-1);
    statusShow('selectActive');

    return true;
  };

  /**
   * Copy the selected pixels. The associated ImageData is stored in 
   * <var>app.clipboard</var.
   */
  this.selectionCopy = function () {
    if (_self.state != _self.STATE_SELECTED) {
      return false;
    }

    if (!layerContext.getImageData || !layerContext.putImageData) {
      alert(lang.errorClipboardUnsupported);
      return false;
    }

    var sel = _self.selection;

    if (!sel.layerCleared) {
      var w    = sel.width,
          h    = sel.height,
          sumX = sel.width  + sel.x;
          sumY = sel.height + sel.y;

      if (sumX > image.width) {
        w = image.width - sel.x;
      }
      if (sumY > image.height) {
        h = image.height - sel.y;
      }

      app.clipboard = layerContext.getImageData(sel.x, sel.y, w, h);

      return app.btn_paste(1);
    }

    app.clipboard = sel.context.getImageData(0, 0, sel.widthOriginal, 
        sel.heightOriginal);

    return app.btn_paste(1);
  };

  /**
   * Paste an image from the "clipboard". The <var>app.clipboard</var object 
   * must be an ImageData. This method will generate a new selection which will 
   * hold the image pasted.
   */
  this.selectionPaste = function () {
    if (_self.state != _self.STATE_NONE &&
        _self.state != _self.STATE_SELECTED) {
      return false;
    }

    if (!layerContext.getImageData || !layerContext.putImageData) {
      alert(lang.errorClipboardUnsupported);
      return false;
    }

    // The default position for the pasted image is the top left corner of the 
    // visible area, taking into consideration the zoom level.
    var x   = MathRound(elems.container.scrollLeft / image.zoom),
        y   = MathRound(elems.container.scrollTop  / image.zoom),
        w   = app.clipboard.width,
        h   = app.clipboard.height,
        sel = _self.selection;

    x += sel.lineWidth;
    y += sel.lineWidth;

    if (_self.state == _self.STATE_SELECTED) {
      bufferContext.clearRect(0, 0, image.width, image.height);
      bufferStyle.cursor = '';
    }

    if (!sel.transparent) {
      bufferContext.fillRect(x, y, w, h);
    }

    bufferContext.putImageData(app.clipboard, x, y);

    bufferContext.strokeRect(x - sel.lineWidth / 2, y - sel.lineWidth / 2,
        w + sel.lineWidth, h + sel.lineWidth);

    sel.context.clearRect(0, 0, image.width, image.height);
    sel.context.putImageData(app.clipboard, 0, 0);

    sel.widthOriginal  = sel.width = w;
    sel.heightOriginal = sel.height = h;
    sel.x = x;
    sel.y = y;
    sel.transform = inputs.selTransform.checked = true;
    sel.layerCleared = true;
    _self.state = _self.STATE_SELECTED;

    app.btn_cut(1);
    app.btn_copy(1);
    statusShow('selectAvailable');

    return true;
  };

  /**
   * The <code>keydown</code> event handler. This method implements support for 
   * the following keys:
   *
   * <ul>
   *   <li><kbd>Control X</kbd> - Cut the selected pixels.
   *
   *   <li><kbd>Control C</kbd> - Copy the selected pixels to the PaintWeb 
   *   application clipboard. The ImageData is stored in 
   *   <var>app.clipboard</var>.
   *
   *   <li><kbd>Enter</kbd> - Toggle the transformation mode. When 
   *   transformation mode is enabled, any selection changes also affects the 
   *   selected pixels.
   *
   *   <li><kbd>Delete</kbd> - Delete the selected pixels.
   *
   *   <li><kbd>Escape</kbd> - Drop the selection / deselect.
   *
   *   <li><kbd>Alt Backspace</kbd> - Fill the selection with the current 
   *   <var>fillStyle</var>. This is only allowed when transformation mode is 
   *   disabled.
   * </ul>
   *
   * @param {Event} ev The DOM Event object.
   */
  this.keydown = function (ev) {
    var sel = _self.selection;

    switch (ev.kid_) {
      case 'Control X':
        return _self.selectionCut();

      case 'Control C':
        return _self.selectionCopy();

      case 'Enter':
        // Toggle the transformation mode.
        sel.transform = inputs.selTransform.checked = !sel.transform;
        break;

      case 'Delete':
        // Delete the pixels from the image if they are not deleted already.
        if (sel.layerCleared || _self.state != _self.STATE_SELECTED) {
          return false;
        }

        layerContext.clearRect(sel.x, sel.y, sel.width, sel.height);
        historyAdd();
        console.log('Delete');

      case 'Escape':
        // Drop the selection.
        if (_self.state != _self.STATE_SELECTED) {
          return false;
        }

        sel.layerCleared = false;
        sel.context.clearRect(0, 0, image.width, image.height);

        bufferContext.clearRect(0, 0, image.width, image.height);
        bufferStyle.cursor = '';

        app.btn_cut(-1);
        app.btn_copy(-1);
        statusShow('selectActive');
        _self.state = _self.STATE_NONE;

        break;

      case 'Alt Backspace':
        // Fill the selection with fillStyle.
        if (sel.transform) {
          return false;
        }

        layerContext.fillStyle = bufferContext.fillStyle;
        layerContext.fillRect(sel.x, sel.y, sel.width, sel.height);
        historyAdd();

        break;

      default:
        return false;
    }

    return true;
  };

  // TODO: check this...
  return init();
});

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

