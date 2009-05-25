/*
 * © 2009 ROBO Design
 * http://www.robodesign.ro
 *
 * $Date: 2009-05-25 21:48:09 +0300 $
 */

function tool_pencil (app) {
  profiler.start('pencil.constructor');

  var _self = this,
      context = app.layer.context,
      mouse = app.mouse,
      width = app.image.width,
      height = app.image.height,
      timer = null,
      points = [],
      delay = 100,
      setInterval = window.setInterval,
      clearInterval = window.clearInterval;

  this.mousedown = function (ev) {
    _self.x = ev.x_;
    _self.y = ev.y_;

    points = [];
    timer = setInterval(draw, delay);

    return true;
  };

  this.mousemove = function (ev) {
    if (mouse.buttonDown) {
      points.push(ev.x_, ev.y_);
    }
  };

  this.mouseup = function () {
    clearInterval(timer);
    draw();
    return true;
  };

  function draw () {
    var i = 0, x = 0, y = 0,
        n = points.length;
    
    if (!n) {
      return;
    }

    context.beginPath();
    context.moveTo(_self.x, _self.y);

    while (i < n) {
      x = points[i++];
      y = points[i++];
      context.lineTo(x, y);
    }
    _self.x = x;
    _self.y = y;

    context.stroke();
    context.closePath();

    points = [];
  };

  profiler.stop('pencil.constructor');
};

var PaintWebInstance = new (function () {
  var _self = this;
  this.layer = {canvas: null, context: null};
  this.tool = null;
  this.doc = document;
  this.win = window;
  this.mouse = {x: 0, y: 0, buttonDown: false};
  this.image = {width: 0, height: 0, zoom: 1};

  var MathRound = Math.round,
      mouse = this.mouse,
      image = this.image,
      dpiOptimal = 96,
      tool = null;

  var dpiLocal = dpiOptimal;

  function init () {
    profiler.start('init');

    var canvas = _self.doc.getElementById('imageView');

    _self.layer.canvas = canvas;
    _self.layer.context = canvas.getContext('2d');
    _self.image.width = canvas.width;
    _self.image.height = canvas.height;

    var resInfo = _self.doc.getElementById('resInfo');
    var cs = _self.win.getComputedStyle(resInfo, null);

    var width  = parseInt(cs.width),
        height = parseInt(cs.height),
        scale = 1;

    if (_self.win.opera) {
      // Opera zoom level detection.
      // The scaling factor is sufficiently accurate for zoom levels between 
      // 100% and 200% (in steps of 10%).

      scale = _self.win.innerHeight / height;
      scale = MathRound(scale * 10) / 10;

      /*console.log('scale ' + scale + ' innerHeight ' + _self.win.innerHeight +
          ' height ' + height);*/

    } else if (width && !isNaN(width) && width != dpiOptimal) {
      // Page DPI detection. This only works in Gecko 1.9.1.

      dpiLocal = width;

      // The scaling factor is the same as in Gecko.
      scale = Math.floor(dpiLocal / dpiOptimal);
      //console.log('dpiLocal ' + dpiLocal + ' scale ' + scale);

    } else if (_self.win.navigator.userAgent.indexOf('olpc') != -1) {
      // Support for the default Gecko included on the OLPC XO-1 system.
      //
      // See:
      // http://mxr.mozilla.org/mozilla-central/source/gfx/src/thebes/nsThebesDeviceContext.cpp#725
      // dotsArePixels = false on the XO due to a hard-coded patch.
      // Thanks go to roc from Mozilla for his feedback on making this work.
      dpiLocal = 134;
      var appUnitsPerCSSPixel = 60;
      var devPixelsPerCSSPixel = dpiLocal / dpiOptimal;
      var appUnitsPerDevPixel = appUnitsPerCSSPixel / devPixelsPerCSSPixel;

      scale = appUnitsPerCSSPixel / Math.floor(appUnitsPerDevPixel);

      /*console.log('dpiLocal ' + dpiLocal + ' scale ' + scale +
          ' devPixelsPerCSSPixel ' + devPixelsPerCSSPixel +
          ' appUnitsPerDevPixel ' + appUnitsPerDevPixel);*/
    }

    if (scale != 1) {
      image.zoom = 1 / scale;

      var sw = canvas.width  / scale,
          sh = canvas.height / scale;

      /*console.log('w ' + canvas.width + ' h ' + canvas.height + ' sw ' + sw +
          ' sh ' + sh);*/

      canvas.style.width  = sw + 'px';
      canvas.style.height = sh + 'px';
    }

    _self.tool = new tool_pencil(_self);
    tool = _self.tool;

    canvas.addEventListener('mousedown', _self.ev_canvas, false);
    canvas.addEventListener('mousemove', _self.ev_canvas, false);
    canvas.addEventListener('mouseup',   _self.ev_canvas, false);

    profiler.stop('init');
  };

  // The general-purpose event handler. This function just determines the mouse 
  // position relative to the canvas element.
  this.ev_canvas = function (ev) {
    if (!tool) {
      return false;

    }

    switch (ev.type) {
      case 'mousedown':
        if (mouse.buttonDown) {
          return false;
        }
        mouse.buttonDown = true;
        break;

      case 'mouseup':
        if (!mouse.buttonDown) {
          return false;
        }
        mouse.buttonDown = false;
    }

    if (!('x_' in ev)) {
      if ('layerX' in ev) {
        if (image.zoom == 1) {
          ev.x_ = mouse.x = ev.layerX;
          ev.y_ = mouse.y = ev.layerY;
        } else {
          ev.x_ = mouse.x = MathRound(ev.layerX / image.zoom);
          ev.y_ = mouse.y = MathRound(ev.layerY / image.zoom);
        }
      } else if ('offsetX' in ev) {
        if (image.zoom == 1) {
          ev.x_ = mouse.x = ev.offsetX;
          ev.y_ = mouse.y = ev.offsetY;
        } else {
          ev.x_ = mouse.x = MathRound(ev.offsetX / image.zoom);
          ev.y_ = mouse.y = MathRound(ev.offsetY / image.zoom);
        }
      }
    }

    //console.log(ev.x_ + ' ' + ev.y_ + ' ' + ev.layerX + ' ' + ev.layerY);

    if (ev.type in tool && tool[ev.type](ev)) {
      ev.preventDefault();
      return true;
    } else {
      return false;
    }
  };

  init();
})();

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

