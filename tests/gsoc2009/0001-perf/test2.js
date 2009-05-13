/*
 * © 2009 ROBO Design
 * http://www.robodesign.ro
 *
 * $Date: 2009-05-11 20:20:59 +0300 $
 */

var PaintWebInstance = new (function () {
  var _self = this;
  this.layer = {canvas: null, context: null};
  this.tool = null;
  this.doc = document;
  this.win = window;

  function init () {
    profiler.start('init');

    _self.layer.canvas = _self.doc.getElementById('imageView');

    _self.layer.context = _self.layer.canvas.getContext('2d');
    _self.tool = new tool_pencil();

    _self.layer.canvas.addEventListener('mousedown', _self.ev_canvas, false);
    _self.layer.canvas.addEventListener('mousemove', _self.ev_canvas, false);
    _self.layer.canvas.addEventListener('mouseup',   _self.ev_canvas, false);

    profiler.stop('init');
  };

  function tool_pencil () {
    profiler.start('pencil.constructor');

    var tool = this,
        context = _self.layer.context,
        width = _self.layer.canvas.width,
        height = _self.layer.canvas.height;

    this.started = false;

    this.mousedown = function (ev) {
      profiler.start('pencil.mousedown');
      tool.x = ev.x_;
      tool.y = ev.y_;
      tool.started = true;
      profiler.stop('pencil.mousedown');
    };

    this.mousemove = function (ev) {
      profiler.start('pencil.mousemove');
      if (tool.started) {
        context.beginPath();
        context.moveTo(tool.x, tool.y);
        context.lineTo(ev.x_, ev.y_);
        context.stroke();
        context.closePath();
        tool.x = ev.x_;
        tool.y = ev.y_;
      }
      profiler.stop('pencil.mousemove');
    };

    this.mouseup = function (ev) {
      profiler.start('pencil.mouseup');
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
      }
      profiler.stop('pencil.mouseup');
    };

    profiler.stop('pencil.constructor');
  };

  // The general-purpose event handler. This function just determines the mouse 
  // position relative to the canvas element.
  this.ev_canvas = function (ev) {
    profiler.start('ev_canvas');

    if (typeof ev.x_ == 'undefined') {
      if (typeof ev.layerX != 'undefined') {
        ev.x_ = ev.layerX;
        ev.y_ = ev.layerY;
      } else if (typeof ev.offsetX != 'undefined') {
        ev.x_ = ev.offsetX;
        ev.y_ = ev.offsetY;
      }
    }

    var func = _self.tool[ev.type];
    if (func) {
      func(ev);
    }

    profiler.stop('ev_canvas');
  };

  init();
})();

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

