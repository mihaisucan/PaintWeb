/*
 * © 2009 ROBO Design
 * http://www.robodesign.ro
 *
 * $Date: 2009-05-12 20:11:26 +0300 $
 */

//if(window.addEventListener) {
//window.addEventListener('load',
(function () {
  window.profiler = new libProfiler();

  var container      = document.getElementById('container'),
      profilerOutput = document.createElement('pre'),
      runTest        = document.createElement('button'),
      resetProfiler  = document.createElement('button'),
      updateReport   = document.createElement('button');

  runTest.appendChild(document.createTextNode('Run test'));
  resetProfiler.appendChild(document.createTextNode('Reset profiler'));
  updateReport.appendChild(document.createTextNode('Update report'));

  var target  = container.parentNode,
      sibling = container.nextSibling;

  target.insertBefore(runTest,        sibling);
  target.insertBefore(resetProfiler,  sibling);
  target.insertBefore(updateReport,   sibling);
  target.insertBefore(profilerOutput, sibling);

  var context = null,
      canvas = null;

  runTest.addEventListener('click', function () {
    profiler.reset();
    profiler.start('runTest');

    canvas = PaintWebInstance.layer.canvas;
    context = PaintWebInstance.layer.context;

    var x = 0,
        y = 0,
        width  = canvas.width,
        height = canvas.height;

    context.clearRect(0, 0, width, height);

    dispatch('mousedown', x, y);

    for (var i = 0; i < 10000; i++) {
      x += 5;

      if (x >= width) {
        x = 0;
        y += 5;

        dispatch('mouseup', x, y);
        dispatch('mousedown', x, y);

        if (y >= height) {
          break;
        }
      }

      dispatch('mousemove', x, y);
    }

    dispatch('mouseup', x, y);

    profilerOutput.innerHTML = '';
    profiler.stop('runTest');
    profilerOutput.appendChild(document.createTextNode(profiler.reportText()));
  }, false);

  resetProfiler.addEventListener('click', function () {
    profiler.reset();
    profilerOutput.innerHTML = '';
  }, false);

  updateReport.addEventListener('click', function () {
    profilerOutput.innerHTML = '';
    profilerOutput.appendChild(document.createTextNode(profiler.reportText()));
  }, false);

  function dispatch (type, x, y) {
    var ev = document.createEvent('MouseEvents');

    ev.initMouseEvent(type, true, true, window, 0, 0, 0, 0, 0, false, false, 
        false, false, 0, null);

    ev.x_ = x;
    ev.y_ = y;
    canvas.dispatchEvent(ev);
  };

})();
//}, false);
