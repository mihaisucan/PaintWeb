/*
 * © 2009 ROBO Design
 * http://www.robodesign.ro
 *
 * $Date: 2009-05-17 22:58:52 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Minimal code used for aiding debugging PaintWeb.
 */

// Opera compatibility
if (!window.console) {
  /**
   * @namespace Holds a simple method used for debugging. Opera doesn't have the 
   * window.console API like Firefox+Firebug has.
   */
  window.console = {};
}

if (!window.console.log) {
  /**
   * Display a message in the debugger. If available, opera.postError is used, 
   * otherwise no message is displayed.
   *
   * @param {mixed} mixed Any number of arguments, each one is displayed in the 
   * debugger.
   */
  window.console.log = function () {
    var msg = '';

    for (var i = 0, n = arguments.length; i < n; i++) {
      msg += arguments[i] + ' ';
    }

    if (window.opera && window.opera.postError) {
      opera.postError(msg);
    } else {
      alert(msg);
    }
  };
}

if (!window.console.warn) {
  /**
   * Display a message in the debugger. If available, opera.postError is used, 
   * otherwise no warning is displayed.
   *
   * @param {mixed} mixed Any number of arguments, each one is displayed in the 
   * debugger.
   */
  window.console.warn = function () {
    console.log.apply(null, arguments);
  };
}

/**
 * JavaScript code performance profiler.
 * <p>Nested timers are accounted for - see the example below.
 *
 * @example
 * <code>// To profile your code just do:
 * var profiler = new $.profiler();
 *
 * profiler.start('long test');
 *   // ... more code ...
 *   profiler.start('function 1');
 *   // ... more code ...
 *   profiler.stop('function 1');
 *   // ... more code ...
 *   profiler.start('function 2');
 *   // ... more code ...
 *   profiler.stop('function 2');
 *   // ... more code ...
 * profiler.stop('long test');
 *
 * // To see the results do:
 * profiler.reportText();
 * // or ..
 * profiler.reportData();</code>
 *
 * @class JavaScript code performance profiler.
 */
var libProfiler = function () {
  /**
   * @ignore
   * @class Function timer. This is the constructor used for instancing a single 
   * timer object created by the profiler.
   *
   * @private
   * @param {String} name_ The timer name.
   * @param {Boolean} [independent_=false] Tells if the timer is independent.  
   * Means this timer will not affect the timers execution stack.
   */
  function fnTimer (name_, independent_) {
    this.avgOwnTimePerCall = 0;
    this.avgRunTimePerCall = 0;
    this.calls = 0;
    this.maxOwnTimePerCall = 0;
    this.maxRunTimePerCall = 0;
    this.minOwnTimePerCall = 0;
    this.minRunTimePerCall = 0;
    this.name = name_;
    this.ownTimeTotal = 0;
    this.runTimeTotal = 0;
    this.state = fnTimer.STATE_NONE;
    this.independent = independent_;

    var startTime_ = 0,
        subTimerStart_ = 0,
        subTime_ = 0,
        stack_ = 0;

    /*
     * Start timing function execution.
     */
    this.start = function () {
      if (this.state == fnTimer.STATE_START ||
          this.state == fnTimer.STATE_SUB) {
        stack_++;
        return;
      }

      startTime_ = (new Date ()).getTime();
      this.state = fnTimer.STATE_START;
    };

    /*
     * Stop timing function execution.
     */
    this.stop = function () {
      if (this.state == fnTimer.STATE_SUB) {
        this.subTimerEnd();
      }

      if (this.state != fnTimer.STATE_START) {
        return;
      }

      this.calls++;

      if (stack_) {
        stack_--;
        return;
      }

      var runTime = (new Date ()).getTime() - startTime_;
      var ownTime = runTime - subTime_;
      subTime_ = 0;

      this.runTimeTotal += runTime;
      this.ownTimeTotal += ownTime;

      this.avgRunTimePerCall = this.runTimeTotal / this.calls;
      this.avgOwnTimePerCall = this.ownTimeTotal / this.calls;

      if (runTime < this.minRunTimePerCall) {
        this.minRunTimePerCall = runTime;
      }

      if (runTime > this.maxRunTimePerCall) {
        this.maxRunTimePerCall = runTime;
      }

      if (ownTime < this.minOwnTimePerCall) {
        this.minOwnTimePerCall = ownTime;
      }

      if (ownTime > this.maxOwnTimePerCall) {
        this.maxOwnTimePerCall = ownTime;
      }

      this.state = fnTimer.STATE_STOP;
    };

    /*
     * Start timing sub-function execution. The sub-function execution timer is 
     * used for calculating the ownTime (runTime - sub-function execution time).
     */
    this.subTimerStart = function () {
      if (this.independent || this.state != fnTimer.STATE_START) {
        return;
      }

      subTimerStart_ = (new Date()).getTime();

      this.state = fnTimer.STATE_SUB;
    };

    /*
     * Stop timing sub-function execution.
     */
    this.subTimerEnd = function () {
      if (this.independent || this.state != fnTimer.STATE_SUB) {
        return;
      }

      subTime_ += (new Date()).getTime() - subTimerStart_;
      this.state = fnTimer.STATE_START;
    };
  };

  fnTimer.STATE_NONE    = 0;
  fnTimer.STATE_START   = 1;
  fnTimer.STATE_SUB     = 2;
  fnTimer.STATE_STOP    = 3;

  /**
   * Holds the timer objects.
   */
  this.timers = {};

  var activeTimer_ = null,
      timersStack_ = [];

  /**
   * Start/create a function timer.
   *
   * @param {String} name The timer name.
   * @param {Boolean} [independent=false] Tells if the timer should be 
   * independent or not. This means that this new function timer is not be 
   * considered affecting the execution time of existing function timers in the 
   * call stack.
   */
  this.start = function (name, independent) {
    var timer = this.timers[name];
    if (!timer) {
      timer = this.timers[name] = new fnTimer(name, independent);
    }

    if (!timer.independent && activeTimer_ != name) {
      var activeTimer = activeTimer_ ? this.timers[activeTimer_] : null;

      if (activeTimer && activeTimer.state == fnTimer.STATE_START) {
        timersStack_.push(activeTimer_);
        activeTimer.subTimerStart();
      }

      activeTimer_ = name;
    }

    timer.start();
  };

  /**
   * Stop a function timer.
   */
  this.stop = function (name) {
    var timer = this.timers[name];
    if (!timer) {
      return;
    }

    timer.stop();

    if (timer.independent || name != activeTimer_ ||
        name == activeTimer_ && timer.state == fnTimer.STATE_START) {
      return;
    }

    if (timersStack_.length > 0) {
      activeTimer_ = timersStack_.pop();

      var activeTimer = this.timers[activeTimer_];
      activeTimer.subTimerEnd();

    } else {
      activeTimer_ = null;
    }
  };

  /**
   * Generate timers report data.
   *
   * @returns {Object} Holds all the information gathered by the timers.
   */
  this.reportData = function () {
    var name, timer, timerDetails,
        data = {
          avgCallsPerTimer: 0,
          avgOwnTimePerCall: 0,
          avgOwnTimePerTimer: 0,
          avgRunTimePerCall: 0,
          avgRunTimePerTimer: 0,
          callsTotal: 0,
          maxCallsPerTimer: 0,
          maxCallsPerTimerName: '',
          maxOwnTimePerCall: 0,
          maxOwnTimePerCallName: '',
          maxRunTimePerCall: 0,
          maxRunTimePerCallName: '',
          minCallsPerTimer: 0,
          minCallsPerTimerName: '',
          minOwnTimePerCall: 0,
          minOwnTimePerCallName: '',
          minRunTimePerCall: 0,
          minRunTimePerCallName: '',
          ownTimeTotal: 0,
          runTimeTotal: 0,
          timers: 0,
          timerDetails: []
        };

    for (name in this.timers) {
      timer = this.timers[name];
      if (timer.state != fnTimer.STATE_STOP) {
        continue;
      }

      timerDetails = {
        name: name,
        avgOwnTimePerCall: timer.avgOwnTimePerCall,
        avgRunTimePerCall: timer.avgRunTimePerCall,
        calls: timer.calls,
        maxOwnTimePerCall: timer.maxOwnTimePerCall,
        maxRunTimePerCall: timer.maxRunTimePerCall,
        minOwnTimePerCall: timer.minOwnTimePerCall,
        minRunTimePerCall: timer.minRunTimePerCall,
        runTimeTotal: timer.runTimeTotal,
        ownTimeTotal: timer.ownTimeTotal
      };
      data.timerDetails.push(timerDetails);

      if (timer.calls > data.maxCallsPerTimer || !data.timers) {
        data.maxCallsPerTimer = timer.calls;
        data.maxCallsPerTimerName = name;
      }

      if (timer.maxOwnTimePerCall > data.maxOwnTimePerCall || !data.timers) {
        data.maxOwnTimePerCall = timer.maxOwnTimePerCall;
        data.maxOwnTimePerCallName = name;
      }

      if (timer.maxRunTimePerCall > data.maxRunTimePerCall || !data.timers) {
        data.maxRunTimePerCall = timer.maxRunTimePerCall;
        data.maxRunTimePerCallName = name;
      }

      if (timer.calls < data.minCallsPerTimer || !data.timers) {
        data.minCallsPerTimer = timer.calls;
        data.minCallsPerTimerName = name;
      }

      if (timer.minOwnTimePerCall < data.minOwnTimePerCall || !data.timers) {
        data.minOwnTimePerCall = timer.minOwnTimePerCall;
        data.minOwnTimePerCallName = name;
      }

      if (timer.minRunTimePerCall < data.minRunTimePerCall || !data.timers) {
        data.minRunTimePerCall = timer.minRunTimePerCall;
        data.minRunTimePerCallName = name;
      }

      data.runTimeTotal += timer.runTimeTotal;
      data.ownTimeTotal += timer.ownTimeTotal;
      data.callsTotal += timer.calls;
      data.timers++;
    }

    if (data.timers == 0) {
      return data;
    }

    data.avgCallsPerTimer = data.callsTotal / data.timers;
    data.avgOwnTimePerCall = data.ownTimeTotal / data.callsTotal;
    data.avgOwnTimePerTimer = data.ownTimeTotal / data.timers;
    data.avgRunTimePerCall = data.runTimeTotal / data.callsTotal;
    data.avgRunTimePerTimer = data.runTimeTotal / data.timers;

    return data;
  };

  /**
   * Generate a report in text format.
   *
   * @returns {String} All the information gathered by the timers, as text.
   */
  this.reportText = function () {
    var data = this.reportData(),
        timer, result = '';

    if (!data.timers) {
      return '';
    }

    for (var i = 0; i < data.timers; i++) {
      timer = data.timerDetails[i];
      result += timer.name + ":\n" +
        '  Avg ownTime / call: ' + timer.avgOwnTimePerCall + " ms\n" +
        '  Avg runTime / call: ' + timer.avgRunTimePerCall + " ms\n" +
        '  Calls: ' + timer.calls + "\n"+
        '  Max ownTime / call: ' + timer.maxOwnTimePerCall + " ms\n" +
        '  Max runTime / call: ' + timer.maxRunTimePerCall + " ms\n" +
        '  Min ownTime / call: ' + timer.minOwnTimePerCall + " ms\n" +
        '  Min runTime / call: ' + timer.minRunTimePerCall + " ms\n" +
        '  runTime: ' + timer.runTimeTotal + " ms\n" +
        '  ownTime: ' + timer.ownTimeTotal + " ms\n\n";
    }

    result += "Overview info:\n" +
      '  Avg calls / timer: ' + data.avgCallsPerTimer + "\n" +
      '  Avg ownTime / call: ' + data.avgOwnTimePerCall + " ms\n" +
      '  Avg ownTime / timer: ' + data.avgOwnTimePerTimer + " ms\n" +
      '  Avg runTime / call: ' + data.avgRunTimePerCall + " ms\n" +
      '  Avg runTime / timer: ' + data.avgRunTimePerTimer + " ms\n" +
      '  Calls total: ' + data.callsTotal + "\n" +
      '  Max calls / timer: ' + data.maxCallsPerTimer + ' (' +
           data.maxCallsPerTimerName + ")\n" +
      '  Max ownTime / call: ' + data.maxOwnTimePerCall + ' ms (' +
           data.maxOwnTimePerCallName + ")\n" +
      '  Max runTime / call: ' + data.maxRunTimePerCall + ' ms (' +
           data.maxRunTimePerCallName + ")\n" +
      '  Min calls / timer: ' + data.minCallsPerTimer + ' (' +
           data.minCallsPerTimerName + ")\n" +
      '  Min ownTime / call: ' + data.minOwnTimePerCall + ' ms (' +
           data.minOwnTimePerCallName + ")\n" +
      '  Min runTime / call: ' + data.minRunTimePerCall + ' ms (' +
           data.minRunTimePerCallName + ")\n" +
      '  Accumulated ownTime: ' + data.ownTimeTotal + " ms\n" +
      '  Accumulated runTime: ' + data.runTimeTotal + " ms\n" +
      '  Timers: ' + data.timers;

    return result;
  };

  /**
   * Reset/clear all the timers.
   */
  this.reset = function () {
    this.timers = {};
    activeTimer_ = null;
    timersStack_ = [];
  };
};

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

