/*
 * © 2009 ROBO Design
 * http://www.robodesign.ro
 *
 * $Date: 2009-04-28 17:53:23 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview Extension for the paint application. Allows users to draw 
 * inside the paint application using the keyboard, without any pointing 
 * device.
 */


/**
 * @class The MouseKeys action.
 *
 * @param {Painter} app Reference to the main paint application object.
 */
function PaintMouseKeys (app) {
  var canvas = app.buffer.canvas,
      mouse  = app.mouse;

  /**
   * Holds the current mouse movement speed in pixels.
   *
   * @private
   * @type Number
   */
  var speed = 1;

  /**
   * Holds the current mouse movement acceleration, taken from the 
   * configuration.
   *
   * @private
   * @type Number
   * @see PainterConfig.mousekeys_accel The mouse keys acceleration setting.
   */
  var accel = PainterConfig.mousekeys_accel;

  if (!canvas || !canvas.parentNode) {
    return false;
  }

  /**
   * Holds a reference to the DOM element representing the pointer on top of the 
   * canvas element.
   *
   * @private
   * @type Element
   */
  var pointer = document.createElement('div');
  if (!pointer) {
    return false;
  }
  pointer.id = 'mousekeysPointer';
  pointer.style.display = 'none';
  canvas.parentNode.appendChild(pointer);

  /**
   * Track the virtual pointer coordinates, by updating the position of the 
   * <var>pointer</var> element. This allows the keyboard users to see where 
   * they moved the virtual pointer.
   *
   * @param {Event} ev The DOM Event object.
   */
  function pointerMousemove (ev) {
    if (typeof ev.x_ == 'undefined' || !ev.kobj_ || !ev.kobj_.action || 
        ev.kobj_.action != 'mousekeys') {
      if (pointer.style.display == 'block') {
        pointer.style.display = 'none';
      }
      return;
    }

    pointer.style.top  = ev.y_ + 'px';
    pointer.style.left = ev.x_ + 'px';
  };

  /**
   * Dispatch a synthetic event to the buffer canvas element.
   *
   * @private
   * @param {String} type The mouse event type to dispatch.
   * @param {Event} ev The original DOM Event object.
   */
  function dispatch (type, ev) {
    var ev_new = document.createEvent('MouseEvents');

    ev_new.initMouseEvent(type,
        ev.bubbles,  ev.cancelable,
        ev.view,     0,
        0,           0,
        0,           0,
        ev.ctrlKey,  ev.altKey,
        ev.shiftKey, ev.metaKey,
        0,           ev.relatedTarget);

    // Make sure the new coordinates are passed to the event handlers.
    ev_new.x_ = mouse.x;
    ev_new.y_ = mouse.y;

    // Make sure the event handlers can check this is a synthetic event.
    // This is needed by the pointerMousemove() function.
    ev_new.keyCode_  = ev.keyCode_;
    ev_new.key_      = ev.key_;
    ev_new.kid_      = ev.kid_;
    ev_new.kobj_     = ev.kobj_;

    canvas.dispatchEvent(ev_new);
  };

  /**
   * The <code>keydown</code> event handler.
   *
   * <p>This method requires a DOM Event object which has the 
   * <var>ev.kobj_</var> object reference from the keyboard shortcuts 
   * configuration. The <var>kobj_</var> object must have the <var>param</var> 
   * property. Support for the "Toggle" parameter is implemented. This parameter 
   * essentially means that a mouse event will be generated, either 
   * <code>mousedown</code> or <code>mouseup</code>. By alternating these two 
   * events, this method allows the user to start and stop the drawing operation 
   * at any moment using the keyboard shortcut they have configured.
   *
   * <p>Irrespective of the key the user pressed, this method does always reset 
   * the speed and acceleration of the pointer movement.
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {Boolean} True if the keyboard shortcut was recognized, or false 
   * if not.
   *
   * @see PainterConfig.keys The keyboard shortcuts configuration object.
   */
  this.keydown = function (ev) {
    speed = 1;
    accel = PainterConfig.mousekeys_accel;

    if (pointer.style.display == 'none') {
      pointer.style.display = 'block';
      pointer.style.top  = mouse.y + 'px';
      pointer.style.left = mouse.x + 'px';
    }

    if (!ev || !ev.kobj_ || ev.kobj_.param != 'Toggle') {
      return false;
    }

    var type = mouse.buttonDown ? 'mouseup' : 'mousedown';
    dispatch(type, ev);

    return true;
  };

  /**
   * The <code>keypress</code> event handler.
   *
   * <p>This method requires a DOM Event object with a <var>ev.kobj_</var> 
   * object reference to the keyboard shortcut configuration. The keyboard 
   * shortcut configuration object must have the <var>param</var> property.
   *
   * <p>This event handler implements support for the following <var>param</var>  
   * values: "SouthWest", "South", "SouthEast", "West", "East", "NorthWest", 
   * "North" and "NorthEast", All of these values indicate the movement 
   * direction. This method generates synthetic <var>movemove</var> events based 
   * on the direction desired, effectively emulating the use of a real pointing 
   * device.
   *
   * @param {Event} ev The DOM Event object.
   *
   * @returns {Boolean} True if the keyboard shortcut was recognized, or false 
   * if not.
   *
   * @see PainterConfig.keys The keyboard shortcuts configuration object.
   */
  this.keypress = function (ev) {
    if (!ev || !ev.kobj_ || !ev.kobj_.param) {
      return false;
    }

    if (ev.shiftKey) {
      speed += speed * accel * 3;
    } else {
      speed += speed * accel;
    }

    var w = canvas.width,
        h = canvas.height,
        x = mouse.x,
        y = mouse.y,
        step = Math.ceil(speed);

    switch (ev.kobj_.param) {
      case 'SouthWest':
        x -= step;
        y += step;
        break;
      case 'South':
        y += step;
        break;
      case 'SouthEast':
        x += step;
        y += step;
        break;
      case 'West':
        x -= step;
        break;
      case 'East':
        x += step;
        break;
      case 'NorthWest':
        x -= step;
        y -= step;
        break;
      case 'North':
        y -= step;
        break;
      case 'NorthEast':
        x += step;
        y -= step;
        break;
      default:
        return false;
    }

    if (x < 0) {
      x = 0;
    } else if (x > w) {
      x = w;
    }

    if (y < 0) {
      y = 0;
    } else if (y > h) {
      y = h;
    }

    mouse.x = x;
    mouse.y = y;

    dispatch('mousemove', ev);

    return true;
  };

  /**
   * Handles action removal. This will remove the pointer DOM element and the 
   * canvas event listener.
   */
  this.actionRemove = function () {
    canvas.parentNode.removeChild(pointer);
    canvas.removeEventListener('mousemove', pointerMousemove, false);
  };

  canvas.addEventListener('mousemove', pointerMousemove, false);
};

window.addEventListener('load', function () {
  // Add the MouseKeys action to the Painter instance.
  if (window.PainterInstance) {
    PainterInstance.actionAdd('mousekeys', PaintMouseKeys);
  }
}, false);

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:
