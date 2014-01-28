/*
 * Copyright (c) 2009-2014, Mihai Sucan
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * 
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * $URL: http://code.google.com/p/paintweb $
 * $Date: 2014-01-28 12:51:15 $
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

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:

