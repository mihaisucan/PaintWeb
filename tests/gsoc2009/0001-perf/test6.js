/*
 * © 2009 ROBO Design
 * http://www.robodesign.ro
 *
 * $Date: 2009-05-13 13:47:25 +0300 $
 */

function tool_pencil (app) {
  profiler.start('pencil.constructor');

  var _self = this,
      context = app.layer.context,
      mouse = app.mouse,
      width = app.image.width,
      height = app.image.height;

  this.mousedown = function (ev) {
    profiler.start('pencil.mousedown');
    _self.x = ev.x_;
    _self.y = ev.y_;
    profiler.stop('pencil.mousedown');
  };

  this.mousemove = function (ev) {
    profiler.start('pencil.mousemove');
    if (mouse.buttonDown) {
      context.beginPath();
      context.moveTo(_self.x, _self.y);
      context.lineTo(ev.x_, ev.y_);
      context.stroke();
      context.closePath();
      _self.x = ev.x_;
      _self.y = ev.y_;
    }
    profiler.stop('pencil.mousemove');
  };

  this.mouseup = function (ev) {
    profiler.start('pencil.mouseup');
    if (mouse.buttonDown) {
      _self.mousemove(ev);
    }
    profiler.stop('pencil.mouseup');
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

  function init () {
    profiler.start('init');

    _self.layer.canvas = _self.doc.getElementById('imageView');
    _self.layer.context = _self.layer.canvas.getContext('2d');
    _self.image.width = _self.layer.canvas.width;
    _self.image.height = _self.layer.canvas.height;

    _self.tool = new tool_pencil(_self);

    _self.layer.canvas.addEventListener('mousedown', _self.ev_canvas, false);
    _self.layer.canvas.addEventListener('mousemove', _self.ev_canvas, false);
    _self.layer.canvas.addEventListener('mouseup',   _self.ev_canvas, false);

    profiler.stop('init');
  };

  // The general-purpose event handler. This function just determines the mouse 
  // position relative to the canvas element.
  this.ev_canvas = function (ev) {
    profiler.start('ev_canvas');

    if (!_self.tool) {
      profiler.stop('ev_canvas');
      return false;
    }

    if (_self.mouse.buttonDown && ev.type == 'mousedown') {
      profiler.stop('ev_canvas');
      return false;
    }

    if (typeof ev.x_ == 'undefined') {
      if (typeof ev.layerX != 'undefined') {
        ev.x_ = ev.layerX;
        ev.y_ = ev.layerY;
      } else if (typeof ev.offsetX != 'undefined') {
        ev.x_ = ev.offsetX;
        ev.y_ = ev.offsetY;
      }

      if (_self.image.zoom != 1 && (ev.x_ || ev.y_)) {
        ev.x_ = Math.round(ev.x_ / _self.image.zoom);
        ev.y_ = Math.round(ev.y_ / _self.image.zoom);
      }

      switch (ev.type) {
        case 'mousedown':
        case 'mousemove':
        case 'mouseup':
          _self.mouse.x = ev.x_;
          _self.mouse.y = ev.y_;
      }
    }

    if (ev.type == 'mousedown') {
      _self.mouse.buttonDown = true;
    }

    var result = false,
        event_action = _self.tool[ev.type];

    if (typeof event_action == 'function') {
      result = event_action(ev);
    }

    if (ev.type == 'mouseup') {
      _self.mouse.buttonDown = false;
    }

    // Do not call preventDefault() when the result is false.
    if (result && ev.preventDefault) {
      ev.preventDefault();
    }

    profiler.stop('ev_canvas');

    return result;
  };

  init();
})();

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:


