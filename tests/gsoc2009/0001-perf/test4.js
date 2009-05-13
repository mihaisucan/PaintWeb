/*
 * © 2009 ROBO Design
 * http://www.robodesign.ro
 *
 * $Date: 2009-05-12 16:14:01 +0300 $
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

    _self.layer.canvas.addEventListener('mousedown', _self.tool.mousedown, false);
    _self.layer.canvas.addEventListener('mousemove', _self.tool.mousemove, false);
    _self.layer.canvas.addEventListener('mouseup',   _self.tool.mouseup, false);

    profiler.stop('init');
  };

  // known, it fails... you can't actuall draw. you simply run the test.
  function tool_pencil () {
    profiler.start('pencil.constructor');

    var tool = this,
        context = _self.layer.context;

    var started = false, x0, y0;

    this.mousedown = function (ev) {
      profiler.start('pencil.mousedown');

      x0 = ev.x_;
      y0 = ev.y_;

      started = true;
      profiler.stop('pencil.mousedown');
    };

    this.mousemove = function (ev) {
      profiler.start('pencil.mousemove');
      if (started) {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(ev.x_, ev.y_);
        context.stroke();
        context.closePath();

        x0 = ev.x_;
        y0 = ev.y_;
      }
      profiler.stop('pencil.mousemove');
    };

    this.mouseup = function (ev) {
      profiler.start('pencil.mouseup');
      if (started) {
        tool.mousemove(ev);
        started = false;
      }
      profiler.stop('pencil.mouseup');
    };

    profiler.stop('pencil.constructor');
  };

  init();
})();

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:



