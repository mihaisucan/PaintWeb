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
 * $Date: 2009-06-16 23:59:04 +0300 $
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
pwlib.tools.selection = function (app) {
  var _self         = this,
      appEvent      = pwlib.appEvent,
      bufferCanvas  = app.buffer.canvas,
      bufferContext = app.buffer.context,
      clearInterval = app.win.clearInterval,
      config        = app.config.selection,
      gui           = app.gui,
      image         = app.image,
      lang          = app.lang,
      layerCanvas   = app.layer.canvas,
      layerContext  = app.layer.context,
      marqueeStyle  = null,
      MathAbs       = Math.abs,
      MathMin       = Math.min,
      MathRound     = Math.round,
      mouse         = app.mouse,
      setInterval   = app.win.setInterval,
      snapXY        = app.toolSnapXY;

  /**
   * The interval ID used for invoking the drawing operation every few 
   * milliseconds.
   *
   * @private
   * @see PaintWeb.config.toolDrawDelay
   */
  var timer = null;

  /**
   * Tells if the drawing canvas needs to be updated or not.
   *
   * @private
   * @type Boolean
   * @default false
   */
  var needsRedraw = false;

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
     * Tells if the selected ImageData has been cut out or not from the 
     * layerContext.
     *
     * @type Boolean
     * @default false
     */
    layerCleared: false,

    /**
     * Selection marquee/border element.
     * @type HTMLElement
     */
    marquee: null,

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

  // shorthands / private variables
  var sel = this.selection,
      borderDouble = config.borderWidth * 2,
      ev_canvasSizeChangeId = null,
      ev_configChangeId = null,
      ctrlKey = false,
      shiftKey = false;

  /**
   * The tool preactivation code. This function prepares the selection canvas 
   * element.
   *
   * @returns {Boolean} True if the activation did not fail, or false otherwise.  
   * If false is returned, the selection tool cannot be activated.
   */
  this.preActivate = function () {
    if (!('canvasContainer' in gui.elems)) {
      alert(lang.errorToolActivate);
      return false;
    }

    // The selection image buffer.
    sel.canvas = app.doc.createElement('canvas');
    if (!sel.canvas) {
      alert(lang.errorToolActivate);
      return false;
    }

    sel.canvas.className = gui.classPrefix + 'selectionBuffer';
    sel.canvas.width  = image.width;
    sel.canvas.height = image.height;

    sel.context = sel.canvas.getContext('2d');
    if (!sel.context) {
      alert(lang.errorToolActivate);
      return false;
    }

    sel.marquee = app.doc.createElement('div');
    if (!sel.marquee) {
      alert(lang.errorToolActivate);
      return false;
    }
    sel.marquee.className = gui.classPrefix + 'selectionMarquee';
    marqueeStyle = sel.marquee.style;

    return true;
  };

  /**
   * The tool activation code. This is run after the tool construction and after 
   * the previous tool is deactivated.
   */
  this.activate = function () {
    // Older browsers do not support get/putImageData, thus non-transparent 
    // selections cannot be used.
    if (!layerContext.putImageData || !layerContext.getImageData) {
      config.transparent = true;
    }

    marqueeHide();

    marqueeStyle.borderWidth = config.borderWidth + 'px';
    sel.marquee.addEventListener('mousedown', marqueeMousedown, false);
    sel.marquee.addEventListener('mousemove', marqueeMousemove, false);
    sel.marquee.addEventListener('mouseup',   marqueeMouseup,   false);

    gui.elems.canvasContainer.appendChild(sel.marquee);

    // Disable the Canvas shadow.
    app.shadowDisallow();

    // Application event listeners.
    ev_canvasSizeChangeId = app.events.add('canvasSizeChange', 
        ev_canvasSizeChange);
    ev_configChangeId = app.events.add('configChange', ev_configChange);

    if (!timer) {
      timer = setInterval(timerFn, app.config.toolDrawDelay);
    }

    return true;
  };

  /**
   * The tool deactivation code. This removes all event listeners and cleans up 
   * the document.
   */
  this.deactivate = function () {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    selectionBufferMerge();

    sel.marquee.removeEventListener('mousedown', marqueeMousedown, false);
    sel.marquee.removeEventListener('mousemove', marqueeMousemove, false);
    sel.marquee.removeEventListener('mouseup',   marqueeMouseup,   false);

    marqueeStyle = null;
    gui.elems.canvasContainer.removeChild(sel.marquee);

    delete sel.context, sel.canvas, sel.marquee;

    // Re-enable canvas shadow.
    app.shadowAllow();

    // Remove the application event listeners.
    if (ev_canvasSizeChangeId) {
      app.events.remove('canvasSizeChange', ev_canvasSizeChangeId);
    }
    if (ev_configChangeId) {
      app.events.remove('configChange', ev_configChangeId);
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
    if (_self.state !== _self.STATE_NONE &&
        _self.state !== _self.STATE_SELECTED) {
      return false;
    }

    // Update the current mouse position, this is used as the start position for most of the operations.
    x0 = mouse.x;
    y0 = mouse.y;

    shiftKey = ev.shiftKey;
    ctrlKey = ev.ctrlKey;

    // No selection is available, then start drawing a selection.
    if (_self.state === _self.STATE_NONE) {
      _self.state = _self.STATE_DRAWING;
      sel.marquee.style.display = '';
      gui.statusShow('selectionDraw');

      return true;
    }

    // STATE_SELECTED: selection available.
    mouseAreaUpdate();

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
        marqueeHide();
        gui.statusShow('selectionActive');
        return selectionBufferMerge(); // done

      case 'in':
        // The mouse area: 'in' for drag.
        _self.state = _self.STATE_DRAGGING;
        gui.statusShow('selectionDrag');
        break;

      case 'border':
        // 'border' for resize (the user is clicking on the borders).
        _self.state = _self.STATE_RESIZING;
        gui.statusShow('selectionResize');
    }

    // Temporarily toggle the transformation mode if the user holds the Control 
    // key down.
    if (ev.ctrlKey) {
      config.transform = !config.transform;
    }

    // If there's any ImageData currently in memory, which was "cut" out from 
    // the current layer, then put it back on the layer. This needs to be done 
    // only when the selection.transform mode is not active - that's when the 
    // drag/resize operation only changes the selection, not the pixels 
    // themselves.
    if (sel.layerCleared && !config.transform) {
      selectionBufferMerge(true);
    }

    // When the user starts dragging/resizing the ImageData we must cut out the 
    // current selection from the image layer.
    if (!sel.layerCleared && config.transform) {
      selectionBufferInit();
    }

    return true;
  };

  /**
   * The <code>mousemove</code> event handler.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mousemove = function (ev) {
    shiftKey = ev.shiftKey;
    needsRedraw = true;
  };

  /**
   * The timer function. When the mouse button is down, this method performs the 
   * dragging/resizing operation. When the mouse button is not down, this method 
   * simply tracks the mouse location for the purpose of determining the area 
   * being pointed at: the selection, the borders, or if the mouse is outside 
   * the selection.
   *
   * @private
   */
  function timerFn () {
    if (!needsRedraw) {
      return;
    }

    switch (_self.state) {
      case _self.STATE_PENDING:
        // selection dropped, switch to draw selection
        _self.state = _self.STATE_DRAWING;
        marqueeStyle.display = '';
        gui.statusShow('selectionDraw');

      case _self.STATE_DRAWING:
        selectionDraw();
        break;

      case _self.STATE_SELECTED:
        mouseAreaUpdate();
        break;

      case _self.STATE_DRAGGING:
        selectionDrag();
        break;

      case _self.STATE_RESIZING:
        selectionResize();
    }

    needsRedraw = false;
  };

  /**
   * The <code>mouseup</code> event handler. This method ends any selection 
   * operation.
   *
   * <p>This method might dispatch the {@link pwlib.appEvent.selectionChange} 
   * application event.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.mouseup = function (ev) {
    // Allow click+mousemove+click, not only mousedown+move+up
    if (_self.state !== _self.STATE_PENDING &&
        mouse.x === x0 && mouse.y === y0) {
      return true;
    }

    var result  = null;

    shiftKey = ev.shiftKey;
    if (ctrlKey) {
      config.transform = !config.transform;
    }

    needsRedraw = false;

    switch (_self.state) {
      case _self.STATE_PENDING:
        // Selection dropped? If yes, switch to the no selection state.
        _self.state = _self.STATE_NONE;
        gui.statusShow('selectionActive');
        app.events.dispatch(new appEvent.selectionChange(_self.state));

        return true;

      case _self.STATE_DRAWING:
        result = selectionDraw();
        break;

      case _self.STATE_DRAGGING:
        result = selectionDrag();
        break;

      case _self.STATE_RESIZING:
        result = selectionResize();
        break;

      default:
        return false;
    }

    if (!result) {
      _self.state = _self.STATE_NONE;
      marqueeHide();
      app.events.dispatch(new appEvent.selectionChange(_self.state));
      return false;
    }

    sel.x = result[0];
    sel.y = result[1];

    if (result.length === 4) {
      sel.width  = result[2];
      sel.height = result[3];
    }

    _self.state = _self.STATE_SELECTED;

    app.events.dispatch(new appEvent.selectionChange(_self.state, sel.x, sel.y, 
          sel.width, sel.height));

    gui.statusShow('selectionAvailable');

    return true;
  };

  /**
   * The <code>mousedown</code> event handler for the selection marquee element.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function marqueeMousedown (ev) {
    if (mouse.buttonDown) {
      return;
    }
    mouse.buttonDown = true;

    ev.preventDefault();

    _self.mousedown(ev);
  };

  /**
   * The <code>mousemove</code> event handler for the selection marquee element.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function marqueeMousemove (ev) {
    if ('layerX' in ev) {
      mouse.x = MathRound((this.offsetLeft + ev.layerX) / image.canvasScale);
      mouse.y = MathRound((this.offsetTop  + ev.layerY) / image.canvasScale);
    } else if ('offsetX' in ev) {
      mouse.x = MathRound((this.offsetLeft + ev.offsetX) / image.canvasScale);
      mouse.y = MathRound((this.offsetTop  + ev.offsetY) / image.canvasScale);
    }

    shiftKey = ev.shiftKey;
    needsRedraw = true;
  };

  /**
   * The <code>mouseup</code> event handler for the selection marquee element.
   *
   * @private
   * @param {Event} ev The DOM Event object.
   */
  function marqueeMouseup (ev) {
    if (!mouse.buttonDown) {
      return;
    }
    mouse.buttonDown = false;

    ev.preventDefault();

    _self.mouseup(ev);
  };

  /**
   * Hide the selection marquee element.
   * @private
   */
  function marqueeHide () {
    marqueeStyle.display = 'none';
    marqueeStyle.top     = '-' + borderDouble + 'px';
    marqueeStyle.left    = '-' + borderDouble + 'px';
    marqueeStyle.width   = '1px';
    marqueeStyle.height  = '1px';
  };

  /**
   * Perform the selection rectangle drawing operation.
   *
   * @private
   *
   * @returns {false|Array} False is returned if the selection is too small, 
   * otherwise an array of four elements is returned. The array holds the 
   * selection information: x, y, width and height.
   */
  function selectionDraw () {
    var x = MathMin(mouse.x,  x0),
        y = MathMin(mouse.y,  y0),
        w = MathAbs(mouse.x - x0),
        h = MathAbs(mouse.y - y0);

    // Constrain the shape to a square.
    if (shiftKey) {
      if (w > h) {
        if (y === mouse.y) {
          y -= w-h;
        }
        h = w;
      } else {
        if (x === mouse.x) {
          x -= h-w;
        }
        w = h;
      }
    }

    var mw = w * image.canvasScale - borderDouble,
        mh = h * image.canvasScale - borderDouble;

    if (mw < 1 || mh < 1) {
      return false;
    }

    // debug
    //bufferContext.clearRect(0, 0, image.width, image.height);
    //bufferContext.fillStyle = 'red';
    //bufferContext.fillRect(x, y, w, h);

    marqueeStyle.top    = (y * image.canvasScale) + 'px';
    marqueeStyle.left   = (x * image.canvasScale) + 'px';
    marqueeStyle.width  = mw + 'px';
    marqueeStyle.height = mh + 'px';

    return [x, y, w, h];
  };

  /**
   * Perform the selection drag operation.
   *
   * @private
   *
   * @returns {false|Array} False is returned if the selection is too small, 
   * otherwise an array of two elements is returned. The array holds the 
   * selection coordinates, x and y.
   */
  function selectionDrag () {
    // Snapping on the X/Y axis
    if (shiftKey) {
      snapXY(x0, y0);
    }

    var x = sel.x + mouse.x - x0,
        y = sel.y + mouse.y - y0;

    // Dragging the ImageData
    if (config.transform) {
      bufferContext.clearRect(0, 0, image.width, image.height);

      if (!config.transparent) {
        bufferContext.fillRect(x, y, sel.width, sel.height);
      }

      // Parameters:
      // source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
      bufferContext.drawImage(sel.canvas, 0, 0, sel.widthOriginal, 
          sel.heightOriginal, x, y, sel.width, sel.height);
    }

    // debug
    //bufferContext.clearRect(0, 0, image.width, image.height);
    //bufferContext.fillStyle = 'red';
    //bufferContext.fillRect(x, y, sel.width, sel.height);

    var mx   = x * image.canvasScale,
        my   = y * image.canvasScale,
        mw   = sel.width  * image.canvasScale - borderDouble,
        mh   = sel.height * image.canvasScale - borderDouble,
        maxW = image.width  * image.canvasScale,
        maxH = image.height * image.canvasScale,
        sumX = mx + mw + borderDouble,
        sumY = my + mh + borderDouble;

    if (sumX > maxW) {
      mw -= sumX - maxW;
    }

    if (sumY > maxH) {
      mh -= sumY - maxH;
    }

    marqueeStyle.top    = my + 'px';
    marqueeStyle.left   = mx + 'px';
    marqueeStyle.width  = mw + 'px';
    marqueeStyle.height = mh + 'px';

    return [x, y];
  };

  /**
   * Perform the selection resize operation.
   *
   * @private
   *
   * @returns {false|Array} False is returned if the selection is too small, 
   * otherwise an array of four elements is returned. The array holds the 
   * selection information: x, y, width and height.
   */
  function selectionResize () {
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

    // Constrain the rectangle to have the same aspect ratio as the initial 
    // rectangle.
    if (shiftKey) {
      var p  = sel.width / sel.height,
          w2 = w,
          h2 = h;

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

    var mx   = x * image.canvasScale,
        my   = y * image.canvasScale,
        mw   = w * image.canvasScale - borderDouble,
        mh   = h * image.canvasScale - borderDouble,
        maxW = image.width  * image.canvasScale,
        maxH = image.height * image.canvasScale,
        sumX = mx + mw + borderDouble,
        sumY = my + mh + borderDouble;

    if (sumX > maxW) {
      mw -= sumX - maxW;
    }

    if (sumY > maxH) {
      mh -= sumY - maxH;
    }

    if (mw < 1 || mh < 1) {
      return false;
    }

    // Resizing the ImageData
    if (config.transform) {
      bufferContext.clearRect(0, 0, image.width, image.height);

      if (!config.transparent) {
        bufferContext.fillRect(x, y, w, h);
      }

      // Parameters:
      // source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
      bufferContext.drawImage(sel.canvas, 0, 0, sel.widthOriginal, 
          sel.heightOriginal, x, y, w, h);
    }

    // debug
    //bufferContext.clearRect(0, 0, image.width, image.height);
    //bufferContext.fillStyle = 'red';
    //bufferContext.fillRect(x, y, w, h);

    marqueeStyle.top    = my + 'px';
    marqueeStyle.left   = mx + 'px';
    marqueeStyle.width  = mw + 'px';
    marqueeStyle.height = mh + 'px';

    return [x, y, w, h];
  };

  /**
   * Determine the are where the mouse is located: if it is inside or outside of 
   * the selection rectangle, or on the selection border.
   * @private
   */
  function mouseAreaUpdate () {
    var border = config.borderWidth / image.canvasScale,
        cursor = '',
        x1_out = sel.x + sel.width,
        y1_out = sel.y + sel.height,
        x1_in  = x1_out - border,
        y1_in  = y1_out - border,
        x0_out = sel.x,
        y0_out = sel.y,
        x0_in  = sel.x + border,
        y0_in  = sel.y + border;

    mouseArea = 'out';

    // Inside the rectangle
    if (mouse.x < x1_in && mouse.y < y1_in &&
        mouse.x > x0_in && mouse.y > y0_in) {
      cursor = 'move';
      mouseArea = 'in';

    } else {
      // On one of the borders (north/south)
      if (mouse.x >= x0_out && mouse.x <= x1_out &&
          mouse.y >= y0_out && mouse.y <= y0_in) {
        cursor = 'n';

      } else if (mouse.x >= x0_out && mouse.x <= x1_out &&
                 mouse.y >= y1_in  && mouse.y <= y1_out) {
        cursor = 's';
      }

      // West/east
      if (mouse.y >= y0_out && mouse.y <= y1_out &&
          mouse.x >= x0_out && mouse.x <= x0_in) {
        cursor += 'w';

      } else if (mouse.y >= y0_out && mouse.y <= y1_out &&
                 mouse.x >= x1_in  && mouse.x <= x1_out) {
        cursor += 'e';
      }

      if (cursor !== '') {
        mouseResize = cursor;
        cursor += '-resize';
        mouseArea = 'border';
      }
    }

    // Due to bug 126457 Opera will not automatically update the cursor, 
    // therefore they will not see any visual feedback.
    if (cursor !== marqueeStyle.cursor) {
      marqueeStyle.cursor = cursor;
    }
  };

  /**
   * The <code>canvasSizeChange</code> application event handler. This method 
   * makes sure the selection size stays in sync.
   *
   * @private
   * @param {pwlib.appEvent.canvasSizeChange} ev The application event object.
   */
  function ev_canvasSizeChange (ev) {
    if (_self.state !== _self.STATE_SELECTED) {
      return;
    }

    marqueeStyle.top    = (sel.y      * ev.scale) + 'px';
    marqueeStyle.left   = (sel.x      * ev.scale) + 'px';
    marqueeStyle.width  = (sel.width  * ev.scale - borderDouble) + 'px';
    marqueeStyle.height = (sel.height * ev.scale - borderDouble) + 'px';
  };

  /**
   * The <code>configChange</code> application event handler. This method makes 
   * sure that changes to the selection transparency configuration option are 
   * applied.
   *
   * @private
   * @param {pwlib.appEvent.configChange} ev The application event object.
   */
  function ev_configChange (ev) {
    // Continue only if the selection rectangle is available.
    if (ev.group !== 'selection' || ev.config !== 'transparent' ||
        !config.transform || _self.state !== _self.STATE_SELECTED) {
      return;
    }

    if (!sel.layerCleared) {
      selectionBufferInit();
    }

    bufferContext.clearRect(0, 0, image.width, image.height);

    if (!ev.value) {
      bufferContext.fillRect(sel.x, sel.y, sel.width, sel.height);
    }

    // Draw the updated selection
    bufferContext.drawImage(sel.canvas, 0, 0,
        sel.widthOriginal, sel.heightOriginal,
        sel.x, sel.y, sel.width, sel.height);
  };

  /**
   * Initialize the selection buffer, when the user starts dragging or resizing 
   * the selected pixels.
   *
   * @private
   */
  function selectionBufferInit () {
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

    if (!config.transparent) {
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

    app.historyAdd();
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
    if (!onlyMerge) {
      bufferContext.clearRect(0, 0, image.width, image.height);
      marqueeStyle.cursor = '';
      //app.btn_cut(-1);
      //app.btn_copy(-1);
    }

    if (sel.layerCleared) {
      if (!config.transparent) {
        layerContext.fillRect(sel.x, sel.y, sel.width, sel.height);
      }

      layerContext.drawImage(sel.canvas, 0, 0, sel.widthOriginal, 
          sel.heightOriginal, sel.x, sel.y, sel.width, sel.height);

      app.historyAdd();
      sel.layerCleared = false;
    }
  };

  /**
   * Cut the selected pixels. The associated ImageData is stored in 
   * <var>app.clipboard</var.
   *
   * <p>This method dispatches two application events: {@link 
   * pwlib.appEvent.clipboardUpdate} and {@link pwlib.appEvent.selectionChange}.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   */
  this.selectionCut = function () {
    if (!_self.selectionCopy()) {
      return false;
    }

    bufferContext.clearRect(0, 0, image.width, image.height);
    sel.context.clearRect(0, 0, image.width, image.height);

    if (!sel.layerCleared) {
      layerContext.clearRect(sel.x, sel.y, sel.width, sel.height);
      app.historyAdd();
    }

    sel.layerCleared = false;
    _self.state = _self.STATE_NONE;
    marqueeStyle.cursor = '';
    marqueeHide();

    app.events.dispatch(new appEvent.selectionChange(_self.state));
    gui.statusShow('selectionActive');

    return true;
  };

  /**
   * Copy the selected pixels. The associated ImageData is stored in 
   * <var>app.clipboard</var.
   *
   * <p>This method dispatches the {@link pwlib.appEvent.clipboardUpdate} 
   * application event.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   */
  this.selectionCopy = function () {
    if (_self.state !== _self.STATE_SELECTED) {
      return false;
    }

    if (!layerContext.getImageData || !layerContext.putImageData) {
      alert(lang.errorClipboardUnsupported);
      return false;
    }

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

    } else {
      app.clipboard = sel.context.getImageData(0, 0, sel.widthOriginal, 
          sel.heightOriginal);
    }

    app.events.dispatch(new appEvent.clipboardUpdate(app.clipboard));

    return true;
  };

  /**
   * Paste an image from the "clipboard". The <var>app.clipboard</var object 
   * must be an ImageData. This method will generate a new selection which will 
   * hold the pasted image.
   *
   * <p>The {@link pwlib.appEvent.selectionChange} application event is 
   * dispatched.
   *
   * <p>If the {@link PaintWeb.config.selection.transform} value is false, then 
   * it becomes true. The {@link pwlib.appEvent.configChange} application is 
   * then dispatched.
   *
   * @returns {Boolean} True if the operation was successful, or false if not.
   */
  this.clipboardPaste = function () {
    if (!app.clipboard || _self.state !== _self.STATE_NONE && _self.state !== 
        _self.STATE_SELECTED) {
      return false;
    }

    if (!layerContext.getImageData || !layerContext.putImageData) {
      alert(lang.errorClipboardUnsupported);
      return false;
    }

    // The default position for the pasted image is the top left corner of the 
    // visible area, taking into consideration the zoom level.
    var x = MathRound(gui.elems.viewport.scrollLeft / image.canvasScale),
        y = MathRound(gui.elems.viewport.scrollTop  / image.canvasScale),
        w = app.clipboard.width,
        h = app.clipboard.height;

    marqueeStyle.top     = (y * image.canvasScale) + 'px';
    marqueeStyle.left    = (x * image.canvasScale) + 'px';
    marqueeStyle.width   = (w * image.canvasScale - borderDouble) + 'px';
    marqueeStyle.height  = (h * image.canvasScale - borderDouble) + 'px';
    marqueeStyle.display = '';

    if (_self.state === _self.STATE_SELECTED) {
      bufferContext.clearRect(0, 0, image.width, image.height);
    }

    if (!config.transparent) {
      bufferContext.fillRect(x, y, w, h);
    }

    bufferContext.putImageData(app.clipboard, x, y);

    sel.context.clearRect(0, 0, image.width, image.height);
    sel.context.putImageData(app.clipboard, 0, 0);

    sel.widthOriginal  = sel.width  = w;
    sel.heightOriginal = sel.height = h;
    sel.x = x;
    sel.y = y;
    sel.layerCleared = true;
    _self.state = _self.STATE_SELECTED;

    app.events.dispatch(new appEvent.selectionChange(_self.state, sel.x, sel.y, 
          sel.width, sel.height));

    if (!config.transform) {
      config.transform = true;
      app.events.dispatch(new appEvent.configChange(true, false, 'transform', 
            'selection', config));
    }

    mouseAreaUpdate();

    gui.statusShow('selectionAvailable');

    return true;
  };

  /**
   * The <code>keydown</code> event handler. This method implements support for 
   * the following keys:
   *
   * <ul>
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
   *
   * @returns {Boolean} True if the keyboard shortcut was recognized, or false 
   * if not.
   */
  this.keydown = function (ev) {
    var sel = _self.selection;

    switch (ev.kid_) {
      case 'Enter':
        // Toggle the transformation mode.
        config.transform = !config.transform;
        break;

      case 'Delete':
        // Delete the pixels from the image if they are not deleted already.
        if (sel.layerCleared || _self.state !== _self.STATE_SELECTED) {
          return false;
        }

        layerContext.clearRect(sel.x, sel.y, sel.width, sel.height);
        app.historyAdd();

      case 'Escape':
        // Drop the selection.
        if (_self.state !== _self.STATE_SELECTED) {
          return false;
        }

        sel.layerCleared = false;
        sel.context.clearRect(0, 0, image.width, image.height);

        bufferContext.clearRect(0, 0, image.width, image.height);
        marqueeStyle.cursor = '';

        //app.btn_cut(-1);
        //app.btn_copy(-1);
        gui.statusShow('selectionActive');
        _self.state = _self.STATE_NONE;

        break;

      case 'Alt Backspace':
        // Fill the selection with fillStyle.
        if (config.transform) {
          return false;
        }

        layerContext.fillStyle = bufferContext.fillStyle;
        layerContext.fillRect(sel.x, sel.y, sel.width, sel.height);
        app.historyAdd();

        break;

      default:
        return false;
    }

    return true;
  };
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

