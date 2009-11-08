/*
 * Copyright (C) 2009 Mihai Şucan
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
 * $Date: 2009-11-08 20:20:22 +0200 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Holds the color bucket tool implementation, also known as the 
 * flood fill tool.
 */

/**
 * @class The color bucket tool.
 *
 * The implementation here is based on the seed fill algorithm of Paul S.  
 * Heckbert (1990).
 *
 * @param {PaintWeb} app Reference to the main paint application object.
 */
pwlib.tools.cbucket = function (app) {
  var _self    = this,
      config   = app.config,
      layer    = app.layer.context,
      buffer   = app.buffer.context,
      image    = app.image,
      mouse    = app.mouse,
      layerOp  = null,
      bufferOp = null;

  var stackMax = 10000; // maximum depth of stack
  var lines = []; // stack of lines
  var pixelNew, pixelNewStr;

  // Opera provides a custom 2D context for Canvas, which includes better-suited 
  // methods: getPixel(), putPixel() and lockCanvasUpdates(). These help the 
  // tool work faster.
  if (pwlib.browser.opera) {
    layerOp  = app.layer.canvas.getContext('opera-2dgame');
    bufferOp = app.buffer.canvas.getContext('opera-2dgame');
  }

  /**
   * The <code>preActivate</code> event handler. This method checks if the 
   * browser implements the <code>getImageData()</code> and 
   * <code>putImageData()</code> context methods.  If not, the color bucket tool 
   * cannot be used.
   */
  this.preActivate = function () {
    // The latest versions of all browsers which implement Canvas, also 
    // implement the getImageData() method. This was only a problem with some 
    // old versions (eg. Opera 9.2).
    if (!layer.getImageData || !layer.putImageData) {
      alert(app.lang.errorCbucketUnsupported);
      return false;
    } else {
      return true;
    }
  };

  /**
   * The <code>activate</code> event handler. Canvas shadow rendering is 
   * disabled.
   */
  this.activate = function () {
    app.shadowDisallow();
  };

  /**
   * The <code>deactivate</code> event handler. Canvas shadow rendering is 
   * allowed once again.
   */
  this.deactivate = function () {
    app.shadowAllow();
  };

  /**
   * The <code>click</code> and <code>contextmenu</code> event handler. This 
   * method performs the flood fill operation.
   *
   * @param {Event} ev The DOM Event object.
   */
  this.click = this.contextmenu = function (ev) {
    // Allow the user to right-click or hold down the Shift key to use the 
    // border color for filling the image.
    if (ev.type === 'contextmenu' || ev.button === 2 || ev.shiftKey) {
      var fillStyle = buffer.fillStyle;
      buffer.fillStyle = buffer.strokeStyle;
      buffer.fillRect(0, 0, 1, 1);
      buffer.fillStyle = fillStyle;
    } else {
      buffer.fillRect(0, 0, 1, 1);
    }

    if (bufferOp && 'getPixel' in bufferOp) {
      pixelNew = bufferOp.getPixel(0, 0);
      pixelNewStr = pixelNew;
    } else {
      pixelNew = buffer.getImageData(0, 0, 1, 1);
      pixelNewStr = pixelNew.data[0] + ';' +
                    pixelNew.data[1] + ';' +
                    pixelNew.data[2] + ';' +
                    pixelNew.data[3];
    }

    buffer.clearRect(0, 0, 1, 1);

    if (layerOp && 'lockCanvasUpdates' in layerOp) {
      layerOp.lockCanvasUpdates(true);
    }

    var res = fill(mouse.x, mouse.y);

    if (layerOp && 'lockCanvasUpdates' in layerOp && 'updateCanvas' in layerOp) 
    {
      layerOp.lockCanvasUpdates(false);
      layerOp.updateCanvas();
    }

    if (res) {
      app.historyAdd();
    }

    return true;
  };

  /**
   * Fill the image with the current fill color, starting from the <var>x</var> 
   * and <var>y</var> coordinates.
   *
   * @private
   *
   * @param {Number} x The x coordinate for the starting point.
   * @param {Number} y The y coordinate for the starting point.
   *
   * @returns {Boolean} True if the image was filled, or false otherwise.
   */
  function fill (x, y) {
    var start, x1, x2, dy, pixelOld, tmp;

    // Read pixel value at seed point.
    pixelOld = pixelRead(x, y);
    if (pixelOld === pixelNewStr || x < 0 || x > image.width || y < 0 ||
        y > image.height) {
      return false;
    }

    pushLine(y, x, x, 1);      // needed in some cases
    pushLine(y + 1, x, x, -1); // seed segment (popped 1st)

    while (lines.length > 0) {
      // pop segment off stack and fill a neighboring scan line
      tmp = lines.pop();
      dy = tmp[3];
      y  = tmp[0] + dy;
      x1 = tmp[1];
      x2 = tmp[2];

      // segment of scan line y-dy for x1 <= x <= x2 was previously filled, now 
      // explore adjacent pixels in scan line y
      x = x1;
      for (x = x1; x >= 0 && pixelRead(x, y) === pixelOld; x--) {
        pixelWrite(x, y);
      }

      if (x >= x1) {
        for (x++; x <= x2 && pixelRead(x, y) !== pixelOld; x++);
        start = x;
        if (x > x2) {
          continue;
        }

      } else {
        start = x + 1;
        if (start < x1) {
          pushLine(y, start, x1 - 1, -dy); // leak on left?
        }

        x = x1 + 1;
      }

      do {
        for (; x < image.width && pixelRead(x,y) === pixelOld; x++) {
          pixelWrite(x, y);
        }

        pushLine(y, start, x - 1, dy);
        if (x > (x2 + 1)) {
          pushLine(y, x2 + 1, x - 1, -dy);  // leak on right?
        }

        for (x++; x <= x2 && pixelRead(x, y) !== pixelOld; x++);
        start = x;

      } while (x <= x2);
    }

    return true;
  };

  var pushLine = function (y, xl, xr, dy) {
    if (lines.length < stackMax && (y+dy) >= 0 && (y+dy) <= image.height) {
      lines.push([y, xl, xr, dy]);
    }
  };

  // Pixel read and write methods. In Opera we use their proprietary methods.
  if (layerOp && 'getPixel' in layerOp && 'setPixel' in layerOp) {
    var pixelRead = function (x, y) {
        return layerOp.getPixel(x, y);
      },
      pixelWrite = function (x, y) {
        layerOp.setPixel(x, y, pixelNew);
      };

  } else {
    var pixelRead = function (x, y) {
        var p = layer.getImageData(x, y, 1, 1).data;
        // uh oh, stringify...
        return p[0] + ';' + p[1] + ';' + p[2] + ';' + p[3];
      },
      pixelWrite = function (x, y) {
        layer.putImageData(pixelNew, x, y);
      };
  }
};

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

