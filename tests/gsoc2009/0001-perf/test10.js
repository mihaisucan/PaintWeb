/*
 * © 2009 ROBO Design
 * http://www.robodesign.ro
 *
 * $Date: 2009-05-13 14:32:21 +0300 $
 */

function tool_pencil (app) {
  profiler.start('pencil.constructor');

  var _self = this,
      context = app.layer.context,
      mouse = app.mouse,
      width = app.image.width,
      height = app.image.height;

  this.mousedown = function (ev) {
    _self.x = ev.x_;
    _self.y = ev.y_;
    return true;
  };

  this.mousemove = function (points) {
    if (!mouse.buttonDown) {
      return false;
    }

    var i = 0, x = 0, y = 0,
        n = points.length;

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

    return true;
  };

  this.mouseup = function (ev) {
    return _self.mousemove(ev);
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
      tool = null,
      mousemove_timer = null,
      mousemove_points = [],
      mousemove_delay = 100,
      setInterval = window.setInterval,
      clearInterval = window.clearInterval;

  function init () {
    profiler.start('init');

    var canvas = _self.doc.getElementById('imageView');

    _self.layer.canvas = canvas;
    _self.layer.context = canvas.getContext('2d');
    _self.image.width = canvas.width;
    _self.image.height = canvas.height;

    _self.tool = new tool_pencil(_self);
    tool = _self.tool;

    canvas.addEventListener('mouseover', _self.ev_canvas, false);
    canvas.addEventListener('mouseout',  _self.ev_canvas, false);
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
        _self.mousemove_flush();
        mouse.buttonDown = true;
        break;

      case 'mouseup':
        if (!mouse.buttonDown) {
          return false;
        }
        _self.mousemove_flush();
        mouse.buttonDown = false;
        break;

      case 'mouseover':
        if ('mousemove' in tool) {
          mousemove_points = [];
          mousemove_timer = setInterval(_self.mousemove_flush, mousemove_delay);
        }
        return true;

      case 'mouseout':
        if (mousemove_timer) {
          clearInterval(mousemove_timer);
          mousemove_timer = null;
          _self.mousemove_flush();
        }
        return true;
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

    if (ev.type == 'mousemove' && 'mousemove' in tool) {
      mousemove_points.push(ev.x_, ev.y_);
      ev.preventDefault();
      return true;
    } else if (ev.type in tool && tool[ev.type](ev)) {
      ev.preventDefault();
      return true;
    } else {
      return false;
    }
  };

  this.mousemove_flush = function () {
    if ('mousemove' in tool && '0' in mousemove_points) {
      tool.mousemove(mousemove_points);
    }
    mousemove_points = [];
  };

  init();
})();

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

