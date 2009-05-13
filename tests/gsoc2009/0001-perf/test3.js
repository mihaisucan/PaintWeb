/*
 * © 2009 ROBO Design
 * http://www.robodesign.ro
 *
 * $Date: 2009-05-11 23:34:52 +0300 $
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

  function tool_pencil () {
    profiler.start('pencil.constructor');

    var tool = this,
        context = _self.layer.context;

    this.started = false;

    this.mousedown = function (ev) {
      profiler.start('pencil.mousedown');

      if (typeof ev.x_ == 'undefined') {
        if (typeof ev.layerX != 'undefined') {
          tool.x = ev.layerX;
          tool.y = ev.layerY;
        } else if (typeof ev.offsetX != 'undefined') {
          tool.x = ev.offsetX;
          tool.y = ev.offsetY;
        }
      } else {
        tool.x = ev.x_;
        tool.y = ev.y_;
      }

      tool.started = true;
      profiler.stop('pencil.mousedown');
    };

    this.mousemove = function (ev) {
      profiler.start('pencil.mousemove');
      if (tool.started) {
        context.beginPath();
        context.moveTo(tool.x, tool.y);

        if (typeof ev.x_ == 'undefined') {
          if (typeof ev.layerX != 'undefined') {
            context.lineTo(ev.layerX, ev.layerY);
            tool.x = ev.layerX;
            tool.y = ev.layerY;
          } else if (typeof ev.offsetX != 'undefined') {
            context.lineTo(ev.offsetX, ev.offsetY);
            tool.x = ev.offsetX;
            tool.y = ev.offsetY;
          }
        } else {
          context.lineTo(ev.x_, ev.y_);
          tool.x = ev.x_;
          tool.y = ev.y_;
        }

        context.stroke();
        context.closePath();
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

  init();
})();

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:


