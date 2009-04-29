/*
 * Copyright (C) 2008 Mihai Şucan
 *
 * This file is part of Paint.Web.
 *
 * Paint.Web is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Paint.Web is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Paint.Web.  If not, see <http://www.gnu.org/licenses/>.
 *
 * $URL: http://code.google.com/p/paintweb $
 * $Date: 2008-11-06 21:22:18 +0200 $
 *
 */


/* Firefox+Firebug compatibility
if (!window.opera) {
	window.opera = {};
}

if (!window.opera.postError) {
	window.opera.postError = function (msg) {
		if (window.console && window.console.log) {
			console.log(msg);
		} else {
			alert(msg);
		}

		return true;
	};
}*/

// Opera compatibility
if (!window.console) {
	window.console = {};
}

if (!window.console.log) {
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

		return true;
	};
}

// Keep everything in anonymous function, called on window load.
if(window.addEventListener) {
window.addEventListener('load', function () {
	var _me = {};

	_me.version = 0.5;
	_me.build = 20081106;
	window.robodesign = _me;

	// The current tool.
	_me.tool = false;
	_me.tool_default = 'rect';

	// This is where most of the elements are cached.
	_me.elems = {};

	// Input elements, stored here for quick access.
	_me.inputs = {};

	// The canvas context for the image and the temporary image (the buffer).
	_me.img = false;
	_me.img_temp = false;

	// The container <div> which holds the canvas elements.
	_me.container = false;

	// The document and the window we will be working with.
	_me.doc = document;
	_me.win = window;

	// The canvas dimensions.
	_me.imgW = 0;
	_me.imgH = 0;

	// Zoom settings:
	// - step
	//   The zoom step used when increasing/decreasing the zoom level.
	// - min/max
	//   The minimum/maximum allowed zoom level.
	// These settings override those from the input#zoom attributes (step/max/min).
	_me.zoom_step = 0.05;
	_me.zoom_max = 4;
	_me.zoom_min = 0.2;

	// The current zoom level.
	_me.zoom = 1;

	// This is where we store all history ImageData.
	_me.history_img = [];

	// The current history position.
	_me.history_pos = 0;

	// The limit of history steps.
	_me.history_limit = 10;

	_me.clipboard = false;
	_me.shapeType = 'both';

	_me.messages = {
		'toString' : 'Paint.Web v%ver% (build %build%)',
		'error-init-canvas' : 'Error: the canvas element was not found.',
		'error-init-canvas2' : 'Error: adding a new canvas element failed.',
		'error-init-context' : 'Error while initializing the canvas context.',
		'error-elem' : 'Error: the following element was not found: %id%.',
		'error-init-getComputedStyle' : 'Error: window.getComputedStyle is not available.',
		'error-init-XMLHttpRequest' : 'Error: window.XMLHttpRequest is not available.',
		'error-tool-activate' : 'Error: the tool you want could not be properly activated!',
		'error-cpicker-unsupported' : 'Error: your browser does not support get/putImageData! The color picker tool cannot be used.',
		'error-clipboard-unsupported' : 'Error: your browser does not support get/putImageData! Clipboard operations like cut/copy/paste cannot be used.',
		'error-text-unsupported' : 'Error: your browser does not implement the Canvas Text API! The text tool cannot be used.',
		'error-insertimg' : 'The image could not be inserted. Maybe the address does not point to an image.',
		'error-insertimg-host' : 'The URL you provided points to a different host. The image cannot be added for security reasons.',
		'error-insertimg-not-loaded' : 'The image did not load yet, or the URL you provided does not point to an image.',
		'prompt-insertimg' : 'Type the address of the image you want to insert:',
		'prompt-image-dimensions' : 'Please input the new image dimensions you want.',
		'prompt-textFont' : 'Type the name of the font you want:',
		'color-editor-title' : 'Color editor'
	};

	_me.status_texts = {
		'cpicker-normal' : 'Click to change the fill color, and Shift+Click to change the stroke color.',
		'cpicker-fillStyle' : 'Click to pick the fill color.',
		'cpicker-strokeStyle' : 'Click to pick the stroke color.',
		'curve-active' : 'Click four times to draw the curve: start, end and two control points.',
		'curve-snapping' : 'Hold the Shift key down for vertical/horizontal snapping.',
		'drag-active' : 'Click and drag the image to scroll.',
		'ellipse-active' : 'Click and drag to draw an ellipse.',
		'ellipse-mousedown' : 'Hold the Shift key down to draw a circle.',
		'eraser-active' : 'Click and drag to erase.',
		'hover-btn-clear' : 'Clear image. Hold Shift to manually change the resolution of the image.',
		'hover-tool-select' : 'Rectangle selection',
		'hover-tool-curve' : 'Bézier curve',
		'insertimg-active' : 'Waiting for the image to load...',
		'insertimg-loaded' : 'Pick where you want to place the image. Click and drag to resize the image.',
		'insertimg-resize' : 'Hold the Shift key down to preserve the aspect ratio.',
		'line-active' : 'Click anywhere to start drawing a line.',
		'line-mousedown' : 'Hold the Shift key down for vertical/horizontal snapping.',
		'pencil-active' : 'Click and drag to draw.',
		'poly-active' : 'Click anywhere to start drawing a polygon.',
		'poly-mousedown' : 'Hold the Shift key down for vertical/horizontal snapping.',
		'poly-end' : 'To end drawing the polygon simply click in the same place as the last point.',
		'rect-active' : 'Click and drag to draw a rectangle.', 
		'rect-mousedown' : 'Hold the Shift key down to draw a square.',
		'select-active' : 'Click and drag to draw a selection.',
		'select-draw' : 'Hold the Shift key down to draw a square selection.',
		'select-available' : 'Drag or resize the selection.',
		'select-drag' : 'Hold the Shift key down for vertical/horizontal snapping.',
		'select-resize' : 'Hold the Shift key down to preserve the aspect ratio.',
		'text-active' : 'Pick where you want to place the text. Make sure you adjust the properties as desired.'
	};

	function $ (id) {
		var elem = _me.doc.getElementById(id);
		if (!elem) {
			alert( _me.getMsg('error-elem', {'id' : id}) );
			return false;
		} else {
			return elem;
		}
	}

	// The global initialization function. This is called when the main document is loaded.
	_me.init = function () {
		// Basic functionality used within the Web application.
		if (!window.getComputedStyle) {
			alert(_me.getMsg('error-init-getComputedStyle'));
			return false;
		}

		if (!window.XMLHttpRequest) {
			alert(_me.getMsg('error-init-XMLHttpRequest'));
			return false;
		}

		var canvas1 = _me.doc.getElementById('imageView');

		if (!canvas1) {
			alert( _me.getMsg('error-init-canvas') );
			return false;
		}

		// Prepare the canvas context
		try {
			_me.img = canvas1.getContext('2d');
			if (!_me.img) {
				throw 'err';
			}
		} catch (err) {
			alert( _me.getMsg('error-init-context') );
			return false;
		}

		_me.imgW = canvas1.width;
		_me.imgH = canvas1.height;

		_me.container = canvas1.parentNode;

		// Create the temporary canvas (the buffer)
		var canvas2 = _me.doc.createElement('canvas');
		if (!canvas2) {
			alert( _me.getMsg('error-init-canvas2') );
			return false;
		}

		canvas2.id = 'imageTemp';
		canvas2.width = canvas1.width;
		canvas2.height = canvas1.height;
		_me.container.insertBefore(canvas2, canvas1.nextSibling);

		var style1 = canvas1.style,
			style2 = canvas2.style,
			stylec = _me.container.style;

		style1.width  = style2.width  = stylec.width  = _me.imgW + 'px';
		style1.height = style2.height = stylec.height = _me.imgH + 'px';

		_me.img_temp = canvas2.getContext('2d');

		// The initial blank state of the image
		_me.history_add();

		// Setup the event listeners for the canvas element.
		// The event handler (ev_canvas) calls the event handlers associated with the active tool (e.g. tool.mousemove).
		var i, n, events = ['click', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'contextmenu'];
		for (i = 0, n = events.length; i < n; i++) {
			canvas2.addEventListener(events[i], _me.ev_canvas, false);
		}

		// Initialize the color editor.
		if (!_me.coloreditor.init()) {
			return false;
		}

		// Prepare the buttons
		var elem, evfunc,
			btn = {
				'undo'  : false, // disabled
				'redo'  : false,
				'clear' : true,  // enabled
				'save'  : true,
				'cut'   : false,
				'copy'  : false,
				'paste' : false,
				'help'  : true,
				'help_close' : true
			};
		for (i in btn) {
			if ( !(elem = $('btn-' + i)) ) {
				return false;
			}

			// Each button must have an event handler with the same name. E.g. btn_undo
			if ( !(evfunc = _me['btn_' + i]) ) {
				continue;
			}

			if (!elem.title && elem.textContent) {
				elem.title = elem.textContent;
			}

			elem.addEventListener('click',     evfunc,             false);
			elem.addEventListener('mouseover', _me.item_mouseover, false);
			elem.addEventListener('mouseout',  _me.item_mouseout,  false);

			if (!btn[i]) {
				elem.className = 'disabled';
			}

			_me.elems['btn_' + i] = elem;
		}

		// Initialize the properties box.
		if (!_me.init_properties()) {
			return false;
		}

		// The resize handler.
		if ( !(elem = $('resizer')) ) {
			return false;
		}
		elem.addEventListener('mousedown', _me.resizer.mousedown, false);
		_me.resizer.elem = elem;

		// The zoom input.
		if ( !(elem = $('in-zoom')) ) {
			return false;
		}

		elem.addEventListener('keypress', _me.ev_input_nr, false);
		elem.addEventListener('change',   _me.ev_change_zoom, false);
		elem._old_value = elem.value;

		// Override the attributes, based on the settings.
		elem.setAttribute('step', _me.zoom_step * 100);
		elem.setAttribute('max',  _me.zoom_max  * 100);
		elem.setAttribute('min',  _me.zoom_min  * 100);

		_me.inputs.zoom = elem;

		// The status bar.
		if ( !(_me.elems.status = $('status')) ) {
			return false;
		}

		// The tool bar.
		if (!_me.tools || !_me.init_tools()) {
			return false;
		}

		// The keyboard shortcuts.
		if (!_me.kshortcuts || !_me.init_keys()) {
			return false;
		};

		// Update the version string in Help.
		elem = $('ver');
		if (elem) {
			elem.appendChild(_me.doc.createTextNode(_me.toString()));
		}

		// Initialize the boxes.
		if (!_me.boxes || !_me.boxes.init || !_me.boxes.init()) {
			return false;
		}

		return true;
	};

	// This finds all the tools in the document, and sets up the event listeners, making the tool bar(s) interactive.
	_me.init_tools = function () {
		var elem, tool_id, tools, proto;

		if ( !(tools = $('tools')) ) {
			return false;
		}

		// Setup the events and the tools
		for (elem = tools.firstChild; elem; elem = elem.nextSibling) {
			if (!elem.id || elem.nodeType != 1) {
				continue;
			}

			// Get the tool ID
			tool_id = elem.id.replace('tool-', '');
			if (!tool_id || tool_id == elem.id || !_me.tools[tool_id]) {
				continue;
			}

			if (!elem.title && elem.textContent) {
				elem.title = elem.textContent;
			}

			elem._tool = tool_id;
			elem.addEventListener('click', _me.tool_click, false);
			elem.addEventListener('mouseover', _me.item_mouseover, false);
			elem.addEventListener('mouseout', _me.item_mouseout, false);

			proto = _me.tools[tool_id].prototype;
			proto._elem = elem;
			proto._id = tool_id;
		}

		return _me.tool_activate(_me.tool_default);
	};

	// This function does the following:
	// - adds the keyboard shortcuts to the status messages and to the title of each affected element.
	// - adds the global keyboard event listener (window.onkeypress = ev_keypress).
	_me.init_keys = function () {
		var i, k, elem2,
			updateTitle = function (elem) {
				if (!elem || !elem.id) {
					return false;
				}

				if (_me.status_texts['hover-' + elem.id]) {
					_me.status_texts['hover-' + elem.id] += ' [ ' + i + ' ]';
				}

				if (elem.title) {
					elem.title += ' [ ' + i + ' ]';
				}

				return true;
			};

		for (i in _me.kshortcuts) {
			k = _me.kshortcuts[i];
			if (!k.func && !k.tool) {
				continue;
			}

			if (k.tool && _me.tools[k.tool]) {
				updateTitle(_me.tools[k.tool].prototype._elem);
			}

			if (k.elem) {
				elem2 = _me.elems[k.elem];
				if (!elem2) {
					elem2 = _me.doc.getElementById(k.elem);
				}
				updateTitle(elem2);
			}
		}

		// The global keypress handler implements everything needed for switching between tools and for accessing any other functionality of the Web application.
		_me.win.addEventListener('keypress', _me.ev_keypress, false);

		return true;;
	};

	// This function prepares all the inputs in the Properties box.
	_me.init_properties = function () {
		var i, elem,

			ev_simple_prop = function (ev) {
				if (!this._prop || !_me.ev_input_nr(ev)) {
					return false;
				}
				_me.img_temp[this._prop] = this.value;
			},

			// Inputs of type=number.
			n, id, opt_nr = ['lineWidth', 'miterLimit', 'shadowOffsetX', 'shadowOffsetY', 'shadowBlur'];

		for (i = 0, n = opt_nr.length; i < n; i++) {
			id = opt_nr[i];
			if ( !(elem = $('in-' + id)) ) {
				return false;
			}

			elem.addEventListener('keypress', _me.ev_input_nr, false);
			elem.addEventListener('input', ev_simple_prop, false);

			elem._old_value = elem.value;
			elem._prop = id;
			_me.inputs[id] = elem;
		}

		// The icon-based options.
		var y, icons, opt_icon = ['shapeType', 'lineCap', 'lineJoin', 'textAlign'];
		for (i = 0, n = opt_icon.length; i < n; i++) {
			id = opt_icon[i];
			if ( !(elem = $('in-' + id)) ) {
				return false;
			}

			elem._prop = id;

			icons = elem.getElementsByTagName('div');

			// The first icon is also the default one for activation.
			icons[0].className = 'active';
			if (id != 'shapeType') {
				_me.img_temp[id] = icons[0].id.replace(id + '-', '');
			}

			for (y = 0; y < icons.length; y++) {
				icons[y].addEventListener('click', _me.opt_icon, false);
				if (!icons[y].title) {
					icons[y].title = icons[y].textContent;
				}
			}
		}

		// Cache several inputs
		var inputs = ['selTransform', 'selTransparent', 'textFont', 'textSize', 'textString', 'shadow_active'];
		for (i = 0, n = inputs.length; i < n; i++) {
			id = inputs[i];
			if ( !(_me.inputs[id] = $('in-' + id)) ) {
				return false;
			}
		}

		// The selection transparency cannot be disabled if the browser does not implement put/getImageData.
		if (!_me.img.getImageData || !_me.img.putImageData) {
			_me.inputs.selTransparent.parentNode.className += ' disabled';
			_me.inputs.selTransparent.disabled = true;
		}

		// The Shadow API is only supported by Firefox 3.1.
		// Opera reports all the shadow-related properties as available, even if it currently doesn't implement the Shadow API.
		elem = _me.inputs.shadow_active;
		if (!_me.img.shadowColor) {
			elem.parentNode.className += ' disabled';
			elem.disabled = true;
		}
		elem.addEventListener('change', _me.shadow_toggle, false);
		elem.checked = true;
		_me.shadow_disable();

		// The Text API is only supported by Firefox 3.1, and new WebKit builds.
		if (_me.img.fillText && _me.img.strokeText) {
			elem = _me.inputs.textSize;
			elem._old_value = elem.value;
			elem.addEventListener('keypress', _me.ev_input_nr,      false);
			elem.addEventListener('input',    _me.update_textProps, false);

			_me.inputs.textFont.addEventListener('change', _me.opt_textFont, false);

			var textStyle = ['textItalic', 'textBold'];
			for (i = 0, n = textStyle.length; i < n; i++) {
				id = textStyle[i];
				if ( !(elem = $('in-' + id)) ) {
					return false;
				}
				elem._prop = id;

				if (!elem.title && elem.textContent) {
					elem.title = elem.textContent;
				}

				elem.addEventListener('click', _me.opt_textStyle, false);
				_me[id] = false;
			}
		}

		var ttl, sections = {
			'lineOptions'      : true, // the condition to make the section available or not
			'selectionOptions' : true,
			'textOptions'      : _me.img.fillText && _me.img.strokeText,
			'shadowOptions'    : _me.img.shadowColor
		};

		// Make each section from Properties minimizable.
		// By default all sections are minimized, except lineOptions.
		for (i in sections) {
			if ( !(elem = $(i)) ) {
				return false;
			}

			_me.elems[i] = elem;

			if (i != 'lineOptions') {
				elem.className = 'minimized';
			}

			if (!sections[i]) {
				elem.style.display = 'none';
				continue;
			}

			ttl = elem.getElementsByTagName('h2')[0];
			if (!ttl) {
				continue;
			}

			ttl.addEventListener('click', function () {
				if (this.parentNode.className == 'minimized') {
					this.parentNode.className = '';
				} else {
					this.parentNode.className = 'minimized';
				}
			}, false);
		}

		return true;
	};

	// Initialize and handle the dragging of the GUI boxes.
	_me.boxes = {
		'drag' : false,
		'elem' : false,
		'zIndex' : 0,
		'zIndex_step' : 200,

		'init' : function () {
			var b = _me.boxes, ttl, id, box, cs,
				boxes = {
					'toolbar'     : false, // auto-hide?
					'main'        : false,
					'properties'  : false,
					'help'        :  true,
					'coloreditor' :  true
				};

			for (id in boxes) {
				if ( !(box = $(id)) ) {
					return false;
				}

				_me.elems[id] = box;

				cs = _me.win.getComputedStyle(box, null);
				if (!cs) {
					continue;
				}

				// Set the position in the .style for quicker usage by the mousedown handler.
				// If this is not done during initialization, it would need to be done in the mousedown handler.
				box.style.top    = cs.top;
				box.style.left   = cs.left;
				box.style.zIndex = cs.zIndex;

				if (cs.zIndex > b.zIndex) {
					b.zIndex = parseInt(cs.zIndex);
				}

				// Auto-hide
				if (boxes[id]) {
					box.style.visibility = 'visible';
					box.style.display    = 'none';
				}

				ttl = box.getElementsByTagName('h1')[0];
				if (!ttl) {
					continue;
				}

				ttl.addEventListener('mousedown', b.mousedown, false);
			}

			return true;
		},

		'mousedown' : function (ev) {
			var b = _me.boxes;
			if (!b) {
				return false;
			}

			if (b.drag) {
				b.drag = false;
			}

			b.drag  = true;
			b.mx    = ev.clientX;
			b.my    = ev.clientY;
			b.elem  = this.parentNode;
			b.btop  = parseInt(b.elem.style.top);
			b.bleft = parseInt(b.elem.style.left);

			b.zIndex += b.zIndex_step;
			b.elem.style.zIndex = b.zIndex;

			_me.doc.addEventListener('mousemove', b.mousemove, false);
			_me.doc.addEventListener('mouseup',   b.mouseup,   false);

			if (ev.preventDefault) {
				ev.preventDefault();
			}

			return true;
		},

		'mousemove' : function (ev) {
			var b = _me.boxes;
			if (!b || !b.drag || !b.elem) {
				return false;
			}

			var x = b.bleft + ev.clientX - b.mx,
				y = b.btop  + ev.clientY - b.my;

			b.elem.style.top  = y + 'px';
			b.elem.style.left = x + 'px';

			if (ev.preventDefault) {
				ev.preventDefault();
			}
		},

		'mouseup' : function (ev) {
			var b = _me.boxes;
			if (!b) {
				return false;
			}

			b.elem = b.drag = false;

			_me.doc.removeEventListener('mousemove', b.mousemove, false);
			_me.doc.removeEventListener('mouseup',   b.mouseup,   false);

			if (ev.preventDefault) {
				ev.preventDefault();
			}

			return true;
		},

		'bringOnTop' : function (box) {
			var b = _me.boxes;
			if (!b || !box) {
				return false;
			}

			box = _me.elems[box];
			if (!box) {
				return false;
			}

			b.zIndex += b.zIndex_step;
			box.style.zIndex = b.zIndex;

			return true;
		}
	};

	// This is the event handler which shows a temporary status message when hovering buttons/tools.
	_me.item_mouseover = function (ev) {
		if (!this.id) {
			return false;
		}

		if (_me.status_texts['hover-' + this.id]) {
			_me.status_show('hover-' + this.id, ev);
		} else if (this.title) {
			_me.status_show(this.title, ev);
		} else if (this.textContent) {
			_me.status_show(this.textContent, ev);
		}

		return true;
	};

	// This simply goes back to the previous status message.
	_me.item_mouseout = function (ev) {
		return _me.status_show(-1, ev);
	};

	// This function changes the status message as needed. The optional event object helps determine if the status message is temporary or not.
	// The msg parameter can be an ID from _me.status_texts or directly the message desired to show. msg can also be -1 when you want to get back to the previous message.
	_me.status_show = function (msg, ev) {
		var elem = _me.elems.status;
		if (!elem || (msg == -1 && elem._prevText === false)) {
			return false;
		}

		if (msg == -1) {
			msg = elem._prevText;
		} else {
			if (ev && ev.type == 'mouseover') {
				elem._prevText = elem.textContent;
			} else {
				elem._prevText = false;
			}

			if (msg && _me.status_texts[msg]) {
				msg = _me.status_texts[msg];
			}
		}

		if (elem.firstChild) {
			elem.removeChild(elem.firstChild);
		}

		if (!msg) {
			_me.win.status = '';
			return true;
		}

		_me.win.status = msg;
		elem.appendChild(_me.doc.createTextNode(msg));

		return true;
	};

	// Call this function to activate any tool you want by providing the tool ID. The ev parameter is an optional DOM Event object which is useful when dealing with different types of tool activation, either by keyboard or by mouse events. Tool-specific code can implement different functionality based on events.
	_me.tool_activate = function (id, ev) {
		if (!id) {
			return false;
		}

		if (_me.tool && _me.tool._id == id) {
			return true;
		}

		var tool = _me.tools[id];
		if (!tool || (tool.prototype._elem && tool.prototype._elem.className == 'disabled')) {
			return false;
		}

		var tool_obj = new tool(ev);
		if (!tool_obj) {
			alert( _me.getMsg('error-tool-activate') );
			return false;
		}

		// The activation of the tool has been cancelled. This can happen via user intervention or due to technical aspects, for example the tool "constructor" determines some APIs are not available.
		if (tool_obj._cancel) {
			tool_obj = null;
			return false;
		}

		// Deactivate the previously active tool
		if (_me.tool) {
			if (_me.tool.deactivate) {
				_me.tool.deactivate(ev);
			}
			if (_me.tool._elem) {
				_me.tool._elem.className = '';
			}
		}

		if (tool_obj._elem) {
			tool_obj._elem.className = 'active';
		}

		_me.tool = tool_obj;

		// Show the status message for the active tool.
		if (_me.status_texts[id + '-active']) {
			_me.status_show(id + '-active');
		} else {
			_me.status_show('');
		}

		// Besides the "constructor", each tool can also have code which is run after the deactivation of the previous tool.
		if (_me.tool.activate) {
			_me.tool.activate(ev);
		};

		return true;
	};

	// This is called when any tool is clicked.
	_me.tool_click = function (ev) {
		if (!this._tool) {
			return false;
		} else {
			return _me.tool_activate(this._tool, ev);
		}
	};

	// This is the handler for all the important events fired at the canvas element. The event handler will call any tool-specific event handler available. For example, for mousemove that would be tool.mousemove(ev).
	// This function also provides two additional properties for the DOM Event object: _x and _y. They represent the mouse position relative to the canvas element, taking into account the current zoom level and image scroll position. The two values can be used directly by code logic in any tool to draw at the mouse position.
	_me.ev_canvas = function (ev) {
		if (!ev || !ev.type || !_me.tool) {
			return false;
		}

		// The event handler of the current tool.
		var event_action = _me.tool[ev.type];
		if (!event_action) {
			return false;
		}

		// Update the event, to include the mouse position, relative to the canvas element
		if (ev.layerX || ev.layerX == 0) { // Firefox
			ev._x = ev.layerX;
			ev._y = ev.layerY;
		} else if (ev.offsetX || ev.offsetX == 0) { // Opera
			ev._x = ev.offsetX;
			ev._y = ev.offsetY;
		}

		// Take into account the current zoom level.
		if (_me.zoom != 1 && (ev._x || ev._y)) {
			ev._x = Math.round(ev._x / _me.zoom);
			ev._y = Math.round(ev._y / _me.zoom);
		}

		var result = event_action(ev);

		// Do not call preventDefault() when the result is false and ev.type == keypress.
		if ((result || ev.type != 'keypress') && ev.preventDefault) {
			ev.preventDefault();
		}

		return result;
	};

	// This function handles DOM events, usually of type 'keypress'. Given the DOM event object, this function changes the object by adding two properties: _kid and _key.
	// The _kid ("key ID") is a string generated based on the event that was fired, for example 'ctrl-shift-n'. This string is also used in the kshortcuts object - making it easy for the user to change the global keyboard shortcuts.
	// The _key is simply the character that was pressed, lower case. If it is a special key, it contains the name of the special key ("return", "delete", etc).
	// This is used by the global keypress event handler (ev_keypress) and other keypress event handlers which need the two properties.
	_me.ev_keypress_prepare = function (ev) {
		if (!ev) {
			return false;
		}

		// TODO:
		//   Improvements would be needed for better compatibility.
		// SEE:
		//   http://doctype.googlecode.com/svn/trunk/goog/events/events.js
		//   http://www.quirksmode.org/js/keys.html
		// In short: DOM key events suck and this function is a minor attempt to make keyboard shortcuts to work in this Web application. This function is not complete (Safari does not work too well...).

		var key, keyCode, isSpecial = false;

		// ev.which is set for all characters pressed in Firefox and Opera.
		// ev.which is unset for almost any special key in Firefox.
		// ev.which is unset for a few special keys in Opera. It is set for page up/down, insert, delete and more.
		// ev.charCode is always set for all characters pressed in Firefox. It's never set by Opera.
		// ev.keyCode is always set by both browsers. As such, we will use ev.which in Opera, and ev.charCode in Firefox.
		// Konqueor 4 seems to behave the same as Firefox 3.
		if (window.opera && ev.which) {
			keyCode = ev.which;
		} else if (ev.charCode) {
			keyCode = ev.charCode;
		} else if (ev.keyCode) {
			keyCode = ev.keyCode;
			isSpecial = true;
		} else {
			return false;
		}

		// Try to catch more special keys in Opera and Safari, we always set isSpecial for "safe" characters/key codes.
		// You have to choose between the . (dot) and the Delete key. You cannot have both (in the keypress event). The same problem applies to other keys as well.
		// I chose these special key codes.
		if (!isSpecial && (keyCode < 33 || keyCode == 35 || keyCode == 36 || keyCode == 46)) {
			isSpecial = true;
		}

		// List from the Firefox DOM.
		var special_keys = {
			3   : 'cancel',
			6   : 'help',
			8   : 'backspace',
			9   : 'tab',
			12  : 'clear',
			13  : 'return',
			// 16  : 'shift',       // from Opera
			20  : 'capslock',
			27  : 'escape',
			32  : 'space',
			33  : 'page-up',        // !
			34  : 'page-down',      // "
			35  : 'end',            // #
			36  : 'home',           // $
			37  : 'left',           // %
			38  : 'up',	            // &
			39  : 'right',          // '
			40  : 'down',           // (
			44  : 'print-screen',   // ,
			45  : 'insert',         // -
			46  : 'delete',         // .
			93  : 'context-menu',   // ]
			112 : 'f1',             // p
			113 : 'f2',             // q
			114 : 'f3',             // r
			115 : 'f4',             // s
			116 : 'f5',             // t
			117 : 'f6',             // u
			118 : 'f7',             // v
			119 : 'f8',             // w
			120 : 'f9',             // x
			121 : 'f10',            // y
			122 : 'f11',            // z
			123 : 'f12',            // {
			// 127 : 'delete',
			// 144 : 'numlock',
			// 145 : 'scrolllock',

			// Key codes for Safari 3.0.4 and older
			63232 : 'up',           // 38
			63233 : 'down',         // 40
			63234 : 'left',         // 37
			63235 : 'right',        // 39
			63236 : 'f1',           // 112
			63237 : 'f2',           // 113
			63238 : 'f3',           // 114
			63239 : 'f4',           // 115
			63240 : 'f5',           // 116
			63241 : 'f6',           // 117
			63242 : 'f7',           // 118
			63243 : 'f8',           // 119
			63244 : 'f9',           // 120
			63245 : 'f10',			// 121
			63246 : 'f11',			// 122
			63247 : 'f12',			// 123
			63248 : 'print-screen', // 44
			63272 : 'delete',       // 46
			63273 : 'home',         // 36
			63275 : 'end',          // 35
			63276 : 'page-up',      // 33
			63277 : 'page-down',    // 34
			63289 : 'numlock',      // 144
			63302 : 'insert'        // 45
		};

		// Again, for Safari 3.0.4 and older.
		if (!isSpecial && keyCode >= 63232 && special_keys[keyCode]) {
			isSpecial = true;
		}

		// This will be 'undefined' if the special key is unknown.
		if (isSpecial) {
			key = special_keys[keyCode];
			if (!key) {
				key = 'undefined';
			}
		} else {
			key = String.fromCharCode(keyCode).toLowerCase();
			if (key == ' ') {
				key = 'space';
			}
		}

		var kid = '', i, kmod,
			kmods = ['alt', 'ctrl', 'meta', 'shift'];

		for (i = 0; i < 4; i++) {
			kmod = kmods[i];
			if (ev[kmod + 'Key']) {
				kid += kmod + '-';
			}
		}

		kid += key;
		ev._kid = kid;
		ev._key = key;

		return true;
	};


	// This is the global keypress event handler.
	// The DOM event object is first prepared by ev_keypress_prepare() and then it's always passed to the ev_canvas() method. If the ev_canvas() m,method returns false (no event handler in the current active tool), then this function checks the global keyboard shortcuts list. If the key ID is found in the _me.kshortcuts object, then the associated tool/function is called.
	_me.ev_keypress = function (ev) {
		if (!ev) {
			return false;
		}

		if (ev.target && ev.target.nodeName) {
			var nodeName = ev.target.nodeName.toLowerCase();
			if (nodeName == 'input' || nodeName == 'select') {
				return;
			}
		}

		// Prepare the event object (ev._kid and ev._key).
		if (!_me.ev_keypress_prepare(ev)) {
			return false;
		}

		// Send the event to the canvas, and eventually to the keypress event handler of the currently active tool (if any).
		// The effect of calling ev_canvas() is that the event object *might* have the _x and _y coordinate properties added.
		var canvas_result = _me.ev_canvas(ev);
		if (canvas_result) {
			return true;
		}

		// If there's no event handler within active tool, or if the event handler does otherwise return false, then continue with the global keyboard shortcuts.

		var gkey = _me.kshortcuts[ev._kid];
		if (!gkey) {
			return false;
		}

		if (gkey.func) {
			gkey.func(ev);
		}

		if (gkey.tool) {
			_me.tool_activate(gkey.tool, ev);
		}

		if (ev.preventDefault) {
			ev.preventDefault();
		}

		return true;
	};

	// This is the event handler for changes in inputs of type=number. The function is associated with the following events: keypress, input and/or change.
	// This function is also called by other event handlers which are specific to various inputs. The return value (true/false) is used to check if the event target value has been updated or not, while making sure the value is a valid number.
	_me.ev_input_nr = function (ev) {
		if (!ev || !ev.target) {
			return false;
		}

		// Do not do anything if this is a synthetic DOM event.
		if (ev.type != 'keypress' && ev._invoked) {
			return true;
		}

		// Do not continue if this is a keypress event and the pressed key is not Up/Down.
		if (ev.type == 'keypress' && (!_me.ev_keypress_prepare(ev) || (ev._key != 'up' && ev._key != 'down'))) {
			return false;
		}

		// Do not continue if this is not a keypress event and the "new" value is the same as the old value.
		var target = ev.target;
		if (ev.type != 'keypress' && target.value == target._old_value) {
			return false;
		}

		// Process the value.
		var val = target.value.replace(/[,.]+/g, '.').replace(/[^0-9.\-]/g, ''),
			max = parseFloat(target.getAttribute('max')),
			min = parseFloat(target.getAttribute('min'));

		val = parseFloat(val);

		if (target.value == '') {
			val = min || 0;
		}

		// If target is not a number, then set the old value, or the minimum value. If all fails, set 0.
		if (isNaN(val)) {
			val = parseFloat(target._old_value);
			if (isNaN(val)) {
				val = min || 0;
			}
		}

		if (ev.type == 'keypress') {
			var step = parseFloat(target.getAttribute('step'));
			if (isNaN(step)) {
				step = 1;
			}

			if (ev.shiftKey) {
				step *= 2;
			}

			if (ev._key == 'down') {
				step *= -1;
			}

			val += step;
		}

		if (!isNaN(max) && val > max) {
			val = max;
		} else if (!isNaN(min) && val < min) {
			val = min;
		}

		if (val != target.value) {
			target.value = val;
		}

		// The input value was not updated by the user, so return false.
		if (val == target._old_value) {
			return false;
		}

		// This is used by this event handler only. To the rest of the event handlers target.value and target._old_value are most of the time the same.
		target._old_value = val;

		// If this is the keypress event, then dispatch the input and change events, so that the target-specific event handlers can execute.
		if (ev.type == 'keypress' && _me.doc.createEvent && target.dispatchEvent) {
			if (ev.preventDefault) {
				ev.preventDefault();
			}

			var ev_change = _me.doc.createEvent('HTMLEvents'),
				ev_input  = _me.doc.createEvent('HTMLEvents');

			ev_input.initEvent ('input',  true, true);
			ev_change.initEvent('change', true, true);

			// Let the receiving event handlers determine if this is a "fake"/synthetic event.
			ev_change._invoked = ev_input._invoked = true;

			target.dispatchEvent(ev_input);
			target.dispatchEvent(ev_change);
		}

		// The input value was updated by the user.
		return true; 
	};

	// The event handler for keys +/- (zoom in/out), and for the * (zoom to 100%).
	_me.key_zoom = function (ev) {
		if (ev._key == '*') {
			return _me.zoom_to(1);
		}

		if (ev.shiftKey) {
			_me.zoom_step *= 2;
		}

		_me.zoom_to(ev._key);

		if (ev.shiftKey) {
			_me.zoom_step /= 2;
		}
	};

	// The event handler for the Zoom input field.
	_me.ev_change_zoom = function (ev) {
		if (!_me.ev_input_nr(ev)) {
			return false;
		} else {
			return _me.zoom_to(this.value/100);
		}
	};

	// The function which changes the zoom of the image.
	_me.zoom_to = function (level) {
		if (!level) {
			return false;
		} else if (level == '+') {
			level = _me.zoom + _me.zoom_step;
		} else if (level == '-') {
			level = _me.zoom - _me.zoom_step;
		} else if (isNaN(level)) {
			return false;
		}

		if (level > _me.zoom_max) {
			level = _me.zoom_max;
		} else if (level < _me.zoom_min) {
			level = _me.zoom_min;
		}

		if (level == _me.zoom) {
			return true;
		}

		var input = _me.inputs.zoom,
			w = (_me.imgW * level) + 'px',
			h = (_me.imgH * level) + 'px',
			style1 = _me.img_temp.canvas.style,
			style2 = _me.img.canvas.style,
			stylec = _me.container.style;

		if (input.value != level*100) {
			input.value = Math.round(level*100);
		}

		style1.width  = style2.width  = w;
		style1.height = style2.height = h;

		// The container should only be smaller than the image dimensions
		if (level < 1) {
			stylec.width  = w;
			stylec.height = h;
		} else if (_me.zoom < 1) {
			stylec.width  = _me.imgW + 'px';
			stylec.height = _me.imgH + 'px';
		}

		_me.zoom = level;

		return true;
	};

	// This is the set of functions associated with the canvas resize handler.
	_me.resizer = {
		'elem' : false,
		'resizing' : false,

		// The initial position of the mouse.
		'mx' : 0,
		'my' : 0,

		// The container dimensions
		'w' : 0,
		'h' : 0,

		'mousedown' : function (ev) {
			var r = _me.resizer;
			if (r.resizing || !r.elem || !_me.doc || !_me.img || !_me.img_temp || !_me.container) {
				return false;
			}

			r.resizing = true;
			r.mx = ev.clientX;
			r.my = ev.clientY;
			r.w = parseInt(_me.container.style.width);
			r.h = parseInt(_me.container.style.height);

			_me.doc.addEventListener('mousemove', r.mousemove, false);
			_me.doc.addEventListener('mouseup',   r.mouseup,   false);

			// We do not want scroll bars while resizing.
			_me.container.style.overflow = 'hidden';

			// Make sure that the Main box is on top.
			if (_me.boxes && _me.boxes.bringOnTop) {
				_me.boxes.bringOnTop('main');
			}

			if (ev.preventDefault) {
				ev.preventDefault();
			}

			if (ev.stopPropagation) {
				ev.stopPropagation();
			}

			return true;
		},

		'mousemove' : function (ev) {
			var r = _me.resizer;
			if (!r.resizing) {
				return false;
			}

			var dx = ev.clientX - r.mx,
				dy = ev.clientY - r.my;

			_me.container.style.width  = (r.w + dx) + 'px';
			_me.container.style.height = (r.h + dy) + 'px';

			if (ev.stopPropagation) {
				ev.stopPropagation();
			}

			return true;
		},

		'mouseup' : function (ev) {
			var r = _me.resizer;
			if (!r.resizing) {
				return false;
			}

			var dx = ev.clientX - r.mx,
				dy = ev.clientY - r.my;

			var w = Math.round((r.w + dx) / _me.zoom),
				h = Math.round((r.h + dy) / _me.zoom);

			_me.resize_canvas(w, h, true);

			return r.done(ev);
		},

		'done' : function (ev) {
			var r = _me.resizer;
			if (!r.resizing) {
				return false;
			}

			r.resizing = false;
			_me.doc.removeEventListener('mousemove', r.mousemove, false);
			_me.doc.removeEventListener('mouseup',   r.mouseup,   false);
			_me.container.style.overflow = 'auto';

			if (ev.stopPropagation) {
				ev.stopPropagation();
			}

			return true;
		}
	};

	// This function resizes the canvas to the desired dimensions.
	_me.resize_canvas = function (w, h, resizer) {
		if (!w || !h || isNaN(w) || isNaN(h)) {
			return false;
		}

		if (w > 1500) {
			w = 1500;
		}

		if (h > 1500) {
			h = 1500;
		}

		if (_me.imgW == w && _me.imgH == h) {
			return false;
		}

		var w2 = Math.round(w * _me.zoom),
			h2 = Math.round(h * _me.zoom);

		if (_me.zoom <= 1) {
			_me.container.style.width  = w2 + 'px';
			_me.container.style.height = h2 + 'px';
		} else if (resizer && _me.zoom > 1) {
			return true;
		}

		_me.img_temp.canvas.style.width  = _me.img.canvas.style.width  = w2 + 'px';
		_me.img_temp.canvas.style.height = _me.img.canvas.style.height = h2 + 'px';

		// The canvas state gets reset once the dimensions change.
		var state = _me.state_save(_me.img),
			dw = Math.min(_me.imgW, w),
			dh = Math.min(_me.imgH, h);

		// The image is cleared once the dimensions change. We need to restore the image.
		// This does not work in Opera 9.2 and older, nor in Safari. This works in new WebKit builds.
		var idata = false;
		if (_me.img.getImageData) {
			idata = _me.img.getImageData(0, 0, dw, dh);
		}

		_me.img.canvas.width  = w;
		_me.img.canvas.height = h;

		if (idata && _me.img.putImageData) {
			_me.img.putImageData(idata, 0, 0);
		}

		_me.state_restore(_me.img, state);
		state = _me.state_save(_me.img_temp);

		idata = false;
		if (_me.img_temp.getImageData) {
			idata = _me.img_temp.getImageData(0, 0, dw, dh);
		}

		_me.img_temp.canvas.width  = w;
		_me.img_temp.canvas.height = h;

		if (idata && _me.img_temp.putImageData) {
			_me.img_temp.putImageData(idata, 0, 0);
		}

		_me.state_restore(_me.img_temp, state);

		_me.imgW = w;
		_me.imgH = h;

		return true;
	};

	// When the canvas is resized the state is lost. Using context.save/restore state does work only in Opera. In Firefox/Gecko and WebKit saved states are lost after resize, so there's no state to restore.
	// As such, this is the internal state save/restore mechanism. The property values are saved into a simple JS object.
	_me.state_props = ['strokeStyle', 'fillStyle', 'globalAlpha', 'lineWidth', 'lineCap', 'lineJoin', 'miterLimit', 'shadowOffsetX', 'shadowOffsetY', 'shadowBlur', 'shadowColor', 'globalCompositeOperation', 'font', 'textAlign', 'textBaseline'];

	_me.state_save = function (context) {
		if (!context || !context.canvas || !_me.state_props) {
			return false;
		}

		var stateObj = {}, state;

		for (var i = 0, n = _me.state_props.length; i < n; i++) {
			state = _me.state_props[i];
			stateObj[state] = context[state];
		}

		return stateObj;
	};

	_me.state_restore = function (context, stateObj) {
		if (!context || !context.canvas) {
			return false;
		}

		for (var state in stateObj) {
			context[state] = stateObj[state];
		}

		return true;
	};

	// This is the color editor. For the implementation I used the following references:
	// - Wikipedia articles on each subject.
	// - the great brucelindbloom.com Web sites - lots of information.
	_me.coloreditor = {
		'elems' : {
			// The color editor element.
			'_self'      : false,

			// This is where we reference the current color element, associated with the color editor.
			// e.g. the fillStyle, strokeStyle and shadowColor elements
			'target'     : false,

			// This is the reference to the canvas controls (in the chart and in the slider)
			'controls'   : false,

			'chart_pos'  : false,
			'slider_pos' : false,

			// The input <select> which tells the color palette selected by the user.
			'in_cpalette' : false,

			// The container element which holds the colors of the currently selected palette.
			'out_cpalette' : false
		},

		// This holds a reference to the 2D context of the color editor canvas.
		// This is where the color chart and the slider are both drawn.
		'context2d' : false,

		// Color values in various representations: RGB, HEX, HSV, CIE Lab, and CMYK. Except for 'hex', all the values *should* be from 0 to 1.
		'color' : {
			'red'  : false,
			'green': false,
			'blue' : false,

			'alpha' : false,
			'hex'   : false,

			'hue' : false,
			'sat' : false,
			'val' : false,

			'cyan'    : false,
			'magenta' : false,
			'yellow'  : false,
			'black'   : false,

			'cie_l' : false,
			'cie_a' : false,
			'cie_b' : false
		},

		// Input fields for the color values.
		'inputs' : {
			'red'   : false,
			'green' : false,
			'blue'  : false,

			'alpha' : false,
			'hex'   : false,

			'hue' : false,
			'sat' : false,
			'val' : false,

			'cyan'    : false,
			'magenta' : false,
			'yellow'  : false,
			'black'   : false,

			'cie_l' : false,
			'cie_a' : false,
			'cie_b' : false
		},

		// Each color editor has different minimum/maximum values for RGBA/HSV/Lab/CMYK. As such, this is a single place to configure the desired max/min value for each input field. This overrides the input[max||min] attributes.
		// The minimum values are only relevant for CIE Lab. These are determined during initialization. 
		// For RGB/HSV and Alpha, the minimum is assumed to be 0.
		'value_min' : {
			'cie_l' : 0,
			'cie_a' : -86,
			'cie_b' : -107
		},

		'value_max' : {
			'red'   : 255,
			'green' : 255,
			'blue'  : 255,
			'alpha' : 100, // percentage

			'hue' : 360, // degrees
			'sat' : 255,
			'val' : 255,

			'cyan'    : 100, // percentage
			'magenta' : 100, // percentage
			'yellow'  : 100, // percentage
			'black'  : 100, // percentage

			// Determined/updated during initialization.
			'cie_l' : 100, // percentage
			'cie_a' : 98,
			'cie_b' : 94
		},

		// The "absolute maximum" value is determined based on the min/max values. E.g. for min -100 and max 100, the abs_max is 200. This is relevant only for CIE Lab.
		'abs_max'  : {},

		// ... and the step used for key up/down.
		'value_step' : {
			'red'   : 1,
			'green' : 1,
			'blue'  : 1,
			'alpha' : 1,

			'hue' : 1,
			'sat' : 1,
			'val' : 1,

			'cyan'    : 1,
			'magenta' : 1,
			'yellow'  : 1,
			'black'   : 1,

			'cie_l' : 1,
			'cie_a' : 1,
			'cie_b' : 1
		},

		// CIE Lab configuration.
		'lab' : {
			// The RGB working space is sRGB which has the reference white point of D65.
			// These are the chromaticity coordinates for the red, green and blue primaries.
			'x_r'   : 0.64,
			'y_r'   : 0.33,
			'x_g'   : 0.3,
			'y_g'   : 0.6,
			'x_b'   : 0.13,
			'y_b'   : 0.06,

			// Standard observer: D65 (daylight), 2° (CIE 1931).
			// Chromaticity coordinates.
			'ref_x' : 0.31271,
			'ref_y' : 0.32902,

			// This is the calculated reference white point (xyY to XYZ) for D65, also known as the reference illuminant tristimulus.
			// These values are determined (updated) based on chromaticity coordinates, during initialization.
			'w_x'   : 0.95047,
			'w_y'   : 1,
			'w_z'   : 1.08883,

			// The 3x3 matrix used for multiplying the RGB values when converting RGB to XYZ.
			// The values are determined (updated) based on the chromaticity coordinates, during initialization.
			'm'     : [
				0.412424,  0.212656, 0.0193324,
				0.357579,  0.715158, 0.119193,
				0.180464, 0.0721856, 0.950444
			],

			// The same matrix, but inverted. This is used for the XYZ to RGB conversion.
			'm_i'   : [
				 3.24071,  -0.969258,   0.0556352,
				-1.53726,   1.87599,   -0.203996,
				-0.498571,  0.0415557,  1.05707
			]
		},

		// The hue spectrum used by the HSV charts.
		'hue' : [
			[255,   0,   0], // 0, Red,       0°
			[255, 255,   0], // 1, Yellow,   60°
			[  0, 255,   0], // 2, Green,   120°
			[  0, 255, 255], // 3, Cyan,    180°
			[  0,   0, 255], // 4, Blue,    240°
			[255,   0, 255], // 5, Magenta, 300°
			[255,   0,   0]  // 6, Red,     360°
		],

		// The active color key (input) determines how the color chart works.
		'ckey_active' : 'red',

		// Given a group of the inputs: red, green and blue, when one of them is active, the ckey_adjoint is set to an array of the other two input IDs.
		'ckey_adjoint' : false,
		'ckey_active_group' : false,

		'ckey_grouping' : {
			'red'   : 'rgb',
			'green' : 'rgb',
			'blue'  : 'rgb',

			'hue' : 'hsv',
			'sat' : 'hsv',
			'val' : 'hsv',

			'cyan'    : 'cmyk',
			'magenta' : 'cmyk',
			'yellow'  : 'cmyk',
			'black'   : 'cmyk',

			'cie_l' : 'lab',
			'cie_a' : 'lab',
			'cie_b' : 'lab'
		},

		// Slider width (scale), relative to the canvas width.
		// During runtime these properties will hold the actual number of pixels.
		'slider_width'   : 0.10,
		'slider_spacing' : 0.03, // spacing between the slider and the chart

		// These values are automatically calculated when the color editor is initialized.
		'slider_x'       : false,
		'chart_width'    : false,

		// This holds the ID of the active tab for the color picker. This can be:
		//   - 'cmixer': this is the color chart canvas which shows a visualisation of the active color space.
		//   - 'cpalettes': this shows the user a list of predefined color palettes.
		'tab_picker' : 'cmixer',

		// This holds the ID of the active tab for color inputs. This can be any of the color spaces: rgb, hsv, lab, cmyk.
		'tab_inputs' : 'rgb',

		// This is the list of color palettes.
		'color_palettes' : {
			'_saved' : {
				'title' : 'Saved colors',
				'colors' : [[1,1,1], [1,1,0], [1,0,1], [0,1,1], [1,0,0], [0,1,0], [0,0,1], [0,0,0]]
			},
			'windows' : {
				'title' : 'Windows',
				'file' : 'colors/windows.json'
			},
			'macos' : {
				'title' : 'Mac OS',
				'file' : 'colors/macos.json'
			},
			'web' : {
				'title' : 'Web',
				'file' : 'colors/web.json'
			},
			'anpa' : {
				'title' : 'ANPA colors',
				'file' : 'colors/anpa.json'
			},
			'trumatch' : {
				'title' : 'TRUMATCH colors',
				'file' : 'colors/trumatch.json'
			},
			'dic' : {
				'title' : 'DIC Color Guide',
				'file' : 'colors/dic.json'
			},
			'pantone-solid-coated' : {
				'title' : 'PANTONE solid coated',
				'file' : 'colors/pantone-solid-coated.json'
			},
			'toyo94' : {
				'title' : 'TOYO 94 color finder',
				'file' : 'colors/toyo94.json'
			}
		},

		'palette_default' : 'windows',

		// Initialize the color editor. This function is called by the Paint.Web main initialization function.
		'init' : function (ev) {
			var elem, ce = _me.coloreditor;
			if (!ce || !ce.color || !ce.inputs || !ce.lab || !ce.init_lab || !ce.init_lab()) {
				return false;
			}

			// The color editor element.
			if ( !(elem = $('coloreditor')) ) {
				return false;
			}

			ce.elems._self = elem;

			// Initialize the color chart canvas.
			if ( !(elem = $('coloreditor-canvas')) ) {
				return false;
			}

			ce.context2d = elem.getContext('2d');
			if (!ce.context2d) {
				return false;
			}

			// Setup the color editor inputs.
			var i, form = $('coloreditor-inputs');
			if (!form) {
				return false;
			}

			for (i in ce.inputs) {
				elem = form.elements.namedItem('in-ckey-' + i);
				if (!elem) {
					return false;
				}

				elem.addEventListener('input', ce.ev_input_change, false);

				if (i != 'hex') {
					elem.addEventListener('keypress', _me.ev_input_nr, false);
					elem.setAttribute('step', ce.value_step[i]);

					if (ce.ckey_grouping[i] == 'lab') {
						elem.setAttribute('max', Math.round(ce.value_max[i]));
						elem.setAttribute('min', Math.round(ce.value_min[i]));
						ce.abs_max[i] = ce.value_max[i] - ce.value_min[i];
					} else {
						elem.setAttribute('max', ce.value_max[i]);
						elem.setAttribute('min', 0);
					}
				}

				// Store the color key, which is used by the event handler.
				elem._ckey = i;
				ce.inputs[i] = elem;
			}

			// Setup the ckey inputs of type=radio.
			var n, ckey = form['in-ckey'];
			if (!ckey) {
				return false;
			}
			for (i = 0, n = ckey.length; i < n; i++) {
				elem = ckey[i];
				if (ce.ckey_grouping[elem.value] == 'lab' && !ce.context2d.putImageData) {
					elem.disabled = true;
					continue;
				}

				elem.addEventListener('change', ce.ev_change_ckey_active, false);

				if (elem.value == ce.ckey_active) {
					elem.checked = true;
					ce.update_ckey_active(ce.ckey_active, true);
				}
			}

			// The color options.
			var id, color_opts = ['fillStyle', 'strokeStyle', 'shadowColor'];
			for (i = 0, n = color_opts.length; i < n; i++) {
				id = color_opts[i];
				if ( !(elem = $('in-' + id)) ) {
					return false;
				}

				// The property name is used by the event handlers when the color changes.
				elem._prop = id;
				elem._value = {'red': 0, 'green' : 0, 'blue' : 0, 'alpha' : 1};
				elem.style.backgroundColor = '#000';

				elem.addEventListener('click', ce.ev_click_color_opt, false);
				_me.inputs[id] = elem;
			}

			// The default colors.
			_me.img_temp.fillStyle = '#000000';
			_me.img_temp.strokeStyle = '#0000ff';
			_me.inputs.strokeStyle.style.backgroundColor = '#00f';
			_me.inputs.strokeStyle._value.blue = 1;


			// Prepare the color preview elements.
			if ( !(elem = $('coloreditor-activec')) ) {
				return false;
			}
			ce.elems.color_active = elem;

			if ( !(elem = $('coloreditor-oldc')) ) {
				return false;
			}
			elem.addEventListener('click', ce.ev_click_color, false);
			ce.elems.color_old = elem;


			// Make sure the buttons work properly.
			if ( !(elem = $('btn-ce-close')) ) {
				return false;
			}
			elem.addEventListener('click', ce.hide, false);

			if ( !(elem = $('btn-ce-cancel')) ) {
				return false;
			}
			elem.addEventListener('click', ce.btn_cancel, false);

			if ( !(elem = $('btn-ce-savec')) ) {
				return false;
			}
			elem.addEventListener('click', ce.btn_save_color, false);


			// Prepare the canvas "controls" (the chart "dot" and the slider).
			var elems = ['controls', 'chart_pos', 'slider_pos'];
			for (i = 0, n = elems.length; i < n; i++) {
				id = elems[i];
				if ( !(elem = $('coloreditor-' + id)) ) {
					return false;
				}

				elem.addEventListener('mousedown', ce.ev_canvas, false);
				elem.addEventListener('mousemove', ce.ev_canvas, false);
				elem.addEventListener('mouseup',   ce.ev_canvas, false);

				ce.elems[id] = elem;
			}
			ce.elems.controls.addEventListener('dblclick',  ce.ev_dblclick_canvas, false);

			// Make the tab buttons work.
			var tabs = ['cmixer', 'cpalettes', 'rgb', 'hsv', 'lab', 'cmyk'];
			for (i = 0, n = tabs.length; i < n; i++) {
				id = tabs[i];
				if ( !(elem = $('btn-' + id)) ) {
					return false;
				}

				elem._tab = id;

				if (ce.tab_picker == id || ce.tab_inputs == id) {
					elem.className += ' active';
				}

				elem.addEventListener('click', ce.ev_click_tab, false);
				ce.elems['btn_' + id] = elem;

				// Get the tab container with the same ID.

				if ( !(elem = $('coloreditor-' + id)) ) {
					return false;
				}

				if (ce.tab_picker == id || ce.tab_inputs == id) {
					elem.style.display = 'block';
				} else {
					elem.style.display = 'none';
				}

				ce.elems['tab_' + id] = elem;
			}

			elem = ce.elems.tab_cpalettes;
			elem.style.width  = ce.context2d.canvas.width  + 'px';
			elem.style.height = ce.context2d.canvas.height + 'px';
			elem.addEventListener('dblclick', ce.ev_dblclick_cpalettes, false);


			// The color palette <select>.
			if ( !(elem = $('in-cpalette')) ) {
				return false;
			}
			elem.addEventListener('change', ce.ev_change_cpalette, false);
			ce.elems.in_cpalette = elem;

			// Add the list of color palettes into the <select>.
			var palette;
			for (i in ce.color_palettes) {
				palette = ce.color_palettes[i];
				elem = _me.doc.createElement('option');
				elem.value = i;
				if (i == ce.palette_default) {
					elem.selected = true;
				}

				elem.appendChild( _me.doc.createTextNode(palette.title) );
				ce.elems.in_cpalette.appendChild(elem);
			}

			// This is the ordered list where we add each color (list item).
			if ( !(elem = $('out-cpalette')) ) {
				return false;
			}
			elem.addEventListener('click', ce.ev_click_color, false);
			ce.elems.out_cpalette = elem;

			ce.cpalette_load(ce.palette_default);

			ce.slider_width_   = ce.slider_width;
			ce.slider_spacing_ = ce.slider_spacing;

			return ce.update_dimensions();
		},

		// This function calculates lots of values used by the other CIE Lab-related functions.
		'init_lab' : function () {
			var cfg, ce = _me.coloreditor;
			if (!ce || !(cfg = ce.lab)) {
				return false;
			}

			// Chromaticity coordinates for the RGB primaries.
			var x0_r = cfg.x_r,
				y0_r = cfg.y_r,
				x0_g = cfg.x_g,
				y0_g = cfg.y_g,
				x0_b = cfg.x_b,
				y0_b = cfg.y_b,

				// The reference white point (xyY to XYZ).
				w_x = cfg.ref_x / cfg.ref_y,
				w_y = 1,
				w_z = (1 - cfg.ref_x - cfg.ref_y) / cfg.ref_y;

			cfg.w_x = w_x;
			cfg.w_y = w_y;
			cfg.w_z = w_z;

			// Again, xyY to XYZ for each RGB primary. Y=1.
			var x_r = x0_r / y0_r,
				y_r = 1,
				z_r = (1 - x0_r - y0_r) / y0_r,
				x_g = x0_g / y0_g,
				y_g = 1,
				z_g = (1 - x0_g - y0_g) / y0_g,
				x_b = x0_b / y0_b,
				y_b = 1,
				z_b = (1 - x0_b - y0_b) / y0_b;

			var m = [
				x_r, y_r, z_r,
				x_g, y_g, z_g,
				x_b, y_b, z_b
			];

			var m_i = ce.calc_m3inv(m);

			var s = ce.calc_m1x3([w_x, w_y, w_z], m_i);

			// The 3x3 matrix used by rgb2xyz().
			m = [
				s[0] * m[0], s[0] * m[1], s[0] * m[2],
				s[1] * m[3], s[1] * m[4], s[1] * m[5],
				s[2] * m[6], s[2] * m[7], s[2] * m[8]
			];

			// The matrix inverse, used by xyz2rgb();
			cfg.m_i = ce.calc_m3inv(m);
			cfg.m   = m;

			// Now determine the min/max values for a and b.

			var xyz = ce.rgb2xyz([0, 1, 0]); // green gives the minimum value for a
			var lab = ce.xyz2lab(xyz),
				min = ce.value_min,
				max = ce.value_max;
			min.cie_a = lab[1];

			xyz = ce.rgb2xyz([1, 0, 1]);     // magenta gives the maximum value for a
			lab = ce.xyz2lab(xyz);
			max.cie_a = lab[1];

			xyz = ce.rgb2xyz([0, 0, 1]);     // blue gives the minimum value for b
			lab = ce.xyz2lab(xyz);
			min.cie_b = lab[2];

			xyz = ce.rgb2xyz([1, 1, 0]);     // yellow gives the maximum value for b
			lab = ce.xyz2lab(xyz);
			max.cie_b = lab[2];

			return true;
		},

		// The cancel button which sets back the old color and closes the dialog.
		'btn_cancel' : function (ev) {
			var ce = _me.coloreditor;
			if (!ce || !ce.elems || !ce.elems.color_old || !ce.elems.color_old._color) {
				return false;
			}

			ce.ev_click_color(ce.elems.color_old, true);

			return ce.hide();
		},

		// The saved color only gets added into the '_saved' color palette list. The color is not saved permanently.
		'btn_save_color' : function (ev) {
			var ce = _me.coloreditor;
			if (!ce || !ce.color || !ce.color_palettes || !ce.color_palettes._saved) {
				return false;
			}

			var color = [ce.color.red, ce.color.green, ce.color.blue],
				saved = ce.color_palettes._saved;

			saved.colors.push(color);

			ce.elems.in_cpalette.value = '_saved';
			ce.cpalette_load('_saved');
			if (ce.tab_picker != 'cpalettes') {
				ce.show_tab('cpalettes');
			}

			return true;
		},

		// The event handler for changes made to the color palette <select> input.
		'ev_change_cpalette' : function (ev) {
			return _me.coloreditor.cpalette_load(this.value);
		},

		// This function loads the desired color palette.
		'cpalette_load' : function (id) {
			var ce = _me.coloreditor;
			if (!ce || !ce.color_palettes || !id || !ce.color_palettes[id]) {
				return false;
			}

			var palette = ce.color_palettes[id];

			if (palette.file) {
				ce.xhr = new XMLHttpRequest();
				if (!ce.xhr) {
					return false;
				}
				ce.xhr.onreadystatechange = ce.cpalette_loaded;
				ce.xhr.open('GET', palette.file);
				ce.xhr.send('');

			} else if (palette.colors) {
				ce.cpalette_show(palette.colors);

			} else {
				return false;
			}

			return true;
		},

		// This is the event handler for XMLHttpRequest.onReadyStateChange.
		'cpalette_loaded' : function (ev) {
			var ce = _me.coloreditor;

			// 0 UNINITIALIZED open() has not been called yet. 1 LOADING send() has not been called yet. 2 LOADED send() has been called, headers and status are available. 3 INTERACTIVE Downloading, responseText holds the partial data. 4 COMPLETED Finished with all operations.
			if(!ce || !ce.xhr || ce.xhr.readyState != 4 || ce.xhr.status != 200 || !ce.xhr.responseText) {
				return false;
			}

			var json = ce.xhr.responseText;

			// FIXME: Security issue here.
			// The provided color palettes include mathematically-precise values (such as 1/3). JSON.parse() does not allow any kind of evaluation.
			//if (window.JSON) {
			//	json = JSON.parse(json);
			//} else {
				json = eval('(' + json + ')');
			//}

			ce.cpalette_show(json);

			json = ce.xhr = null;
			delete json, ce.xhr;

			return true;
		},

		// This function takes the colors array argument which used to add each color element to the color editor (#out-cpalette).
		'cpalette_show' : function (colors) {
			var ce = _me.coloreditor;
			if (!colors || !(colors instanceof Array) || !ce || !ce.elems || !ce.elems.out_cpalette || !_me.doc.createDocumentFragment) {
				return false;
			}

			var i, color, elem,
				frag = _me.doc.createDocumentFragment(),
				dest = ce.elems.out_cpalette;

			dest.style.display = 'none';
			while (dest.hasChildNodes()) {
				dest.removeChild(dest.firstChild);
			}

			for (i in colors) {
				color = colors[i];

				// Do not allow values higher than 1.
				color[0] = Math.min(1, color[0]);
				color[1] = Math.min(1, color[1]);
				color[2] = Math.min(1, color[2]);

				elem = _me.doc.createElement('li');
				elem._color = color;
				elem.style.backgroundColor = 'rgb(' + Math.round(color[0] * 255) + ',' + Math.round(color[1] * 255) + ',' + Math.round(color[2] * 255) + ')';

				frag.appendChild(elem);
			}
			dest.appendChild(frag);
			dest.style.display = 'block';

			colors = frag = null;
			delete frag, colors;

			return true;
		},

		// This is the 'click' event handler for colors (in the color palette list, or the old color).
		'ev_click_color' : function (ev, cancel) {
			var ce = _me.coloreditor;
			if (!ce || !ce.color || !ev) {
				return false;
			}

			if (ev.target && ev.target._color) {
				var color = ev.target._color;
			} else if (ev._color) {
				var color = ev._color;
			} else {
				return false;
			}

			ce.color.red   = color[0];
			ce.color.green = color[1];
			ce.color.blue  = color[2];

			if (typeof(color[3]) != 'undefined') {
				ce.color.alpha = color[3];
			}

			if (!cancel) {
				return ce.update_color('rgb');
			} else {
				return ce.update_target();
			}
		},

		// Calculate the dimensions and coordinates for the slider and the color chart within the canvas element.
		'update_dimensions' : function () {
			var ce = _me.coloreditor;
			if (!ce || !ce.context2d || !ce.context2d.canvas || !ce.elems) {
				return false;
			}

			var width  = ce.context2d.canvas.width,
				height = ce.context2d.canvas.height,
				style;

			ce.slider_width   = Math.round(width * ce.slider_width_);
			ce.slider_spacing = Math.round(width * ce.slider_spacing_);
			ce.slider_x       = width - ce.slider_width - 2;
			ce.chart_width    = ce.slider_x - ce.slider_spacing;

			style = ce.elems.controls.style;
			style.width  = width  + 'px';
			style.height = height + 'px';

			style = ce.elems.tab_cmixer.style;
			style.width  = width  + 'px';
			style.height = height + 'px';

			style = ce.elems.slider_pos.style;
			style.width = ce.slider_width + 'px';
			style.left  = ce.slider_x     + 'px';

			return true;
		},

		// A simple function to calculate the matrix product of two given A and B matrices. A must be one row and 3 columns. B must be 3 rows and 3 columns.
		// Both arguments must be arrays in the form of [a00, a01, a02, ... a10, a11, a12, ...].
		'calc_m1x3' : function (a, b) {
			if (!(a instanceof Array) || !(b instanceof Array)) {
				return false;
			}

			var x = a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
				y = a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
				z = a[0] * b[2] + a[1] * b[5] + a[2] * b[8];

			return [x, y, z];
		},

		// Another simple function which calculates the matrix inverse, for a matrix of 3 rows and 3 columns.
		// The argument must be an array in the form of [a00, a01, a02, ... a10, a11, a12, ...].
		'calc_m3inv' : function (m) {
			if (!(m instanceof Array)) {
				return false;
			}

			var d = (m[0]*m[4]*m[8] + m[1]*m[5]*m[6] + m[2]*m[3]*m[7])
				  - (m[2]*m[4]*m[6] + m[5]*m[7]*m[0] + m[8]*m[1]*m[3]);

			// Matrix determinant is 0: the matrix is not invertible.
			if (d == 0) {
				return false;
			}

			var i = [
				 m[4]*m[8] - m[5]*m[7], -m[3]*m[8] + m[5]*m[6],  m[3]*m[7] - m[4]*m[6],
				-m[1]*m[8] + m[2]*m[7],  m[0]*m[8] - m[2]*m[6], -m[0]*m[7] + m[1]*m[6],
				 m[1]*m[5] - m[2]*m[4], -m[0]*m[5] + m[2]*m[3],  m[0]*m[4] - m[1]*m[3]
			];

			i = [
				1/d * i[0], 1/d * i[3], 1/d * i[6],
				1/d * i[1], 1/d * i[4], 1/d * i[7],
				1/d * i[2], 1/d * i[5], 1/d * i[8]
			];

			return i;
		},

		// The click event handler for all the tab buttons.
		'ev_click_tab' : function (ev) {
			if (this._tab) {
				return _me.coloreditor.show_tab(this._tab);
			} else {
				return false;
			}
		},

		'show_tab' : function (tab) {
			var ce = _me.coloreditor;
			if (!ce || !tab) {
				return false;
			}

			if (tab == 'cmixer' || tab == 'cpalettes') {
				var group = 'picker';
			} else {
				var group = 'inputs';
			}

			var old_tab = ce['tab_' + group];

			if (old_tab == tab) {
				return true;

			} else if (old_tab) {
				var tmp = ce.elems['btn_' + old_tab];
				tmp.className = tmp.className.replace(/\s*active/ig, '');
				ce.elems['tab_' + old_tab].style.display = 'none';
			}

			ce.elems['btn_' + tab].className += ' active';
			ce.elems['tab_' + tab].style.display = 'block';

			ce['tab_' + group] = tab;

			if (tab == 'cmixer' && ce.update_canvas_needed) {
				ce.update_canvas();
			}

			return true;
		},

		// The event handler for inputs of type=radio - the inputs which allow the user to change the active color key.
		'ev_change_ckey_active' : function (ev) {
			if (!this.value || this.value == _me.coloreditor.ckey_active || _me.coloreditor.update_ckey_active(this.value)) {
				return false;
			}

			return true;
		},

		// The actual function which deals with the changes to the active color key.
		'update_ckey_active' : function (ckey, only_vars) {
			var ce = _me.coloreditor;
			if (!ce || !ckey || !ce.color || !ce.inputs[ckey]) {
				return false;
			}

			ce.ckey_active = ckey;

			var i, adjoint = [], group = ce.ckey_grouping[ckey];

			// Determine the adjoint color keys. For example, if red is active, then adjoint = ['green', 'blue'].
			for (i in ce.ckey_grouping) {
				if (ce.ckey_grouping[i] == group && i != ckey) {
					adjoint.push(i);
				}
			}

			ce.ckey_active_group  = group;
			ce.ckey_adjoint       = adjoint;

			if (!only_vars) {
				if (ce.tab_picker != 'cmixer') {
					ce.update_canvas_needed = true;
					ce.show_tab('cmixer');
				} else {
					ce.update_canvas();
				}

				if (ce.tab_inputs != group) {
					ce.show_tab(group);
				}
			}

			return true;
		},

		// This function enables/disables the color editor. This is the event handler associated with any color option available (stroke and fill colors). The editor is given the target (the color option) picked by the user. Any changes to the color are propagated to the target.
		'ev_click_color_opt' : function (ev) {
			var i, ce  = _me.coloreditor;
			if (!ce || !ce.color || !this._value || !this._prop) {
				return false;
			}

			if (ce.elems.target && ce.elems.target.id == this.id) {
				return ce.hide();
			}

			// The color option can be disabled.
			if (this._disabled) {
				return false;
			}

			// Store the reference to the color option picked by the user.
			ce.elems.target = this;

			// Update the color editor title.
			var ttl = ce.elems._self.getElementsByTagName('h1')[0];
			if (ttl) {
				ttl.removeChild(ttl.firstChild);
				ttl.appendChild(_me.doc.createTextNode( this.title || _me.getMsg('color-editor-title') ));
			}

			// Update the internal color values to be the same as those of the color option picked by the user.
			for (i in this._value) {
				ce.color[i] = this._value[i];
			}

			// Update the "old color" element.
			i = ce.elems.color_old;
			i._color = [this._value.red, this._value.green, this._value.blue, this._value.alpha];
			i.style.backgroundColor = 'rgb(' +
					Math.round(this._value.red   * 255) + ',' +
					Math.round(this._value.green * 255) + ',' +
					Math.round(this._value.blue  * 255) + ')';
			i.style.opacity = this._value.alpha;

			i = ce.elems.color_active.style;
			i.backgroundColor = ce.elems.color_old.style.backgroundColor;
			i.opacity = this._value.alpha;

			// Convert the RGB color values to HSV, CIE Lab, CMYK, and to the hexadecimal representation, for later use.
			ce.rgb2hsv();
			ce.rgb2hex();
			ce.rgb2lab();
			ce.rgb2cmyk();

			// Update the inputs to show the RGB, HSV and HEX values.
			ce.update_inputs();

			// Update the color chart and slider (the entire color editor canvas).
			ce.update_canvas();

			// Make sure the color editor is on top.
			if (_me.boxes && _me.boxes.bringOnTop) {
				ce.elems._self.style.display = 'block';
				_me.boxes.bringOnTop(ce.elems._self.id);
			}

			return true;
		},

		// When the user double clicks the color palettes area, this event handler toggles the double size mode on/off.
		'ev_dblclick_cpalettes' : function (ev) {
			var ce = _me.coloreditor;
			if (!ce || !ce.elems || !ce.elems.tab_cpalettes) {
				return false;
			}

			var tab    = ce.elems.tab_cpalettes;
			var style = tab.style;
			var width  = parseInt(style.width),
				height = parseInt(style.height);

			if (tab.className == 'double') {
				width  /= 2;
				height /= 2;
				tab.className = '';
			} else {
				width  *= 2;
				height *= 2;
				tab.className = 'double';
			}

			style.width  = width  + 'px';
			style.height = height + 'px';

			if (ce.tab_picker != 'cpalettes') {
				return ce.show_tab('cpalettes');
			} else {
				return true;
			}
		},

		'hide' : function () {
			var ce = _me.coloreditor;

			ce.elems._self.style.display = 'none';
			ce.elems.target   = false;
			ce.ev_canvas_mode = false;

			return true;
		},

		// This is the event handler for the changes to the color editor inputs.
		'ev_input_change' : function (ev) {
			var ce = _me.coloreditor;
			if (!ce || !ce.elems.target || !this._ckey) {
				return false;
			}

			// Validate and restrict the possible values.
			// The non-HEX fields are checked by the generic ev_input_nr function (input type=number).
			// If the input is unchanged, or if the new value is invalid, the function returns false.
			// The hexadecimal input is checked with a simple regular expression.

			if ((this._ckey == 'hex' && !/^\#[a-f0-9]{6}$/i.test(this.value)) || (this._ckey != 'hex' && !_me.ev_input_nr(ev))) {
				return false;
			}

			// Update the internal color value.
			if (this._ckey == 'hex') {
				ce.color[this._ckey] = this.value;
			} else if (ce.ckey_grouping[this._ckey] == 'lab') {
				ce.color[this._ckey] = parseInt(this.value);
			} else {
				ce.color[this._ckey] = parseInt(this.value) / ce.value_max[this._ckey];
			}

			return ce.update_color(this._ckey);
		},

		// This function takes the ckey parameter which tells the updated color key. Based on which color key is updated, the other color values are also updated (e.g. RGB conversion to HSV, CIE Lab, CMYK and HEX). After the color value conversions, the inputs, the color option target, and the color editor canvas are all updated to reflect the change.
		'update_color' : function (ckey) {
			var ce = _me.coloreditor;
			if (!ce) {
				return false;
			}

			if (ckey == 'rgb' || ce.ckey_grouping[ckey] == 'rgb') {
				ce.rgb2hsv();
				ce.rgb2hex();
				ce.rgb2lab();
				ce.rgb2cmyk();
			} else if (ckey == 'hsv' || ce.ckey_grouping[ckey] == 'hsv') {
				ce.hsv2rgb();
				ce.rgb2hex();
				ce.rgb2lab();
				ce.rgb2cmyk();
			} else if (ckey == 'hex') {
				ce.hex2rgb();
				ce.rgb2hsv();
				ce.rgb2lab();
				ce.rgb2cmyk();
			} else if (ckey == 'lab' || ce.ckey_grouping[ckey] == 'lab') {
				ce.lab2rgb();
				ce.rgb2hsv();
				ce.rgb2hex();
				ce.rgb2cmyk();
			} else if (ckey == 'cmyk' || ce.ckey_grouping[ckey] == 'cmyk') {
				ce.cmyk2rgb();
				ce.rgb2lab();
				ce.rgb2hsv();
				ce.rgb2hex();
			}

			ce.update_inputs();
			ce.update_target();

			if (ckey != 'alpha') {
				ce.update_canvas(ckey);
			}

			return true;
		},

		// This function updates the color option target. It sets the current color values.
		'update_target' : function () {
			var ce = _me.coloreditor;
			if (!ce || !ce.elems.target || !_me.img_temp || !ce.color) {
				return false;
			}

			var prop  = ce.elems.target._prop,
				style = ce.elems.target.style,
				val   = ce.elems.target._value,
				i, rgba, elem;

			if (!prop || !style || !val) {
				return false;
			}

			for (i in val) {
				val[i] = ce.color[i];
			}

			var red   = Math.round(val.red   * 255),
				green = Math.round(val.green * 255),
				blue  = Math.round(val.blue  * 255);

			style.backgroundColor = 'rgb(' + red + ',' + green + ',' + blue + ')';

			// Too bad Opera does not support rgba()
			style.opacity = val.alpha;

			rgba = 'rgba(' + red + ',' + green + ',' + blue + ',' + val.alpha + ')';
			if (prop == 'shadowColor') {
				_me.img[prop] = rgba;
			} else {
				_me.img_temp[prop] = rgba;
			}

			elem = ce.elems.color_active.style;
			elem.backgroundColor = style.backgroundColor;
			elem.opacity = val.alpha;

			return true;
		},

		// Take the internal color values and show them in the inputs.
		'update_inputs' : function () {
			var i, input, ce = _me.coloreditor;
			if (!ce || !ce.inputs || !ce.color) {
				return false;
			}

			for (i in ce.inputs) {
				input = ce.inputs[i];
				input._old_value = input.value;
				if (input._ckey == 'hex') {
					input.value = ce.color[i];
				} else if (ce.ckey_grouping[input._ckey] == 'lab') {
					input.value = Math.round(ce.color[i]);
				} else {
					input.value = Math.round(ce.color[i] * ce.value_max[i]);
				}
			}

			return true;
		},

		// Quote from Wikipedia:
		// "Since RGB and CMYK spaces are both device-dependent spaces, there is no simple or general conversion formula that converts between them. Conversions are generally done through color management systems, using color profiles that describe the spaces being converted. Nevertheless, the conversions cannot be exact, since these spaces have very different gamuts."
		// Translation: this is just a simple RGB to CMYK conversion function.
		'rgb2cmyk' : function () {
			var color, ce = _me.coloreditor;
			if (!ce || !(color = ce.color)) {
				return false;
			}

			var cyan, magenta, yellow, black,
				red   = color.red,
				green = color.green,
				blue  = color.blue;

			cyan    = 1 - red;
			magenta = 1 - green;
			yellow  = 1 - blue;

			black = Math.min(cyan, magenta, yellow, 1);

			if (black == 1) {
				cyan = magenta = yellow = 0;
			} else {
				var w = 1 - black;
				cyan    = (cyan    - black) / w;
				magenta = (magenta - black) / w;
				yellow  = (yellow  - black) / w;
			}

			color.cyan    = cyan;
			color.magenta = magenta;
			color.yellow  = yellow;
			color.black   = black;

			return true;
		},

		'cmyk2rgb' : function () {
			var color, ce = _me.coloreditor;
			if (!ce || !(color = ce.color)) {
				return false;
			}

			var w = 1 - color.black;

			color.red   = 1 - color.cyan    * w - color.black;
			color.green = 1 - color.magenta * w - color.black;
			color.blue  = 1 - color.yellow  * w - color.black;

			return true;
		},

		// This function takes the RGB color values and converts them to HSV.
		'rgb2hsv' : function () {
			var ce = _me.coloreditor;
			if (!ce || !ce.color) {
				return false;
			}

			var red   = ce.color.red,
				green = ce.color.green,
				blue  = ce.color.blue,
				hue, sat, val; // HSV

			var min = Math.min(red, green, blue),
				max = Math.max(red, green, blue);

			var delta = max - min,
				val   = max;

			// This is gray (red==green==blue)
			if (delta == 0) {
				hue = sat = 0;
			} else {
				sat = delta / max;

				if (max == red) {
					hue = (green -  blue) / delta;
				} else if (max == green) {
					hue = (blue  -   red) / delta + 2;
				} else if (max ==  blue) {
					hue = (red   - green) / delta + 4;
				}

				hue /= 6;
				if (hue < 0) {
					hue += 1;
				}
			}

			ce.color.hue = hue;
			ce.color.sat = sat;
			ce.color.val = val;

			return true;
		},

		// This function takes the internal HSV color values and converts them to RGB. The return value is either false (when there's any problem), or an array of three values [red, green, value] - this is the result of the HSV to RGB conversion.
		// Arguments:
		//   - no_update (boolean)
		//     Tells the function to NOT update the internal RGB color values (ce.color). This is enabled by default.
		//   - hsv (array)
		//     Instead of using the internal HSV color values (from ce.color), the function will use the values given in the array [hue, saturation, light].
		'hsv2rgb' : function (no_update, hsv) {
			var color, ce = _me.coloreditor;
			if (!ce || !(color = ce.color)) {
				return false;
			}

			var red, green, blue, hue, sat, val;

			// Use custom HSV values or the current color.
			if (hsv) {
				hue = hsv[0];
				sat = hsv[1];
				val = hsv[2];
			} else {
				hue = color.hue,
				sat = color.sat,
				val = color.val;
			}

			// achromatic (grey)
			if (sat == 0) {
				red = green = blue = val;
			} else {
				var h = hue * 6;
				var i = Math.floor(h);
				var t1 = val * ( 1 - sat ),
					t2 = val * ( 1 - sat * ( h - i ) ),
					t3 = val * ( 1 - sat * ( 1 - (h - i) ) );

				if (i == 0 || i == 6) { //   0° Red
					red = val;  green =  t3;  blue =  t1;
				} else if (i == 1) {    //  60° Yellow
					red =  t2;  green = val;  blue =  t1;
				} else if (i == 2) {    // 120° Green
					red =  t1;  green = val;  blue =  t3;
				} else if (i == 3) {    // 180° Cyan
					red =  t1;  green =  t2;  blue = val;
				} else if (i == 4) {    // 240° Blue
					red =  t3;  green =  t1;  blue = val;
				} else if (i == 5) {    // 300° Magenta
					red = val;  green =  t1;  blue =  t2;
				}
			}

			if (!no_update) {
				color.red   = red;
				color.green = green;
				color.blue  = blue;
			}

			return [red, green, blue];
		},

		// This updates the hexadecimal representation of the color, based on the RGB values.
		'rgb2hex' : function () {
			var hex = '#', rgb = ['red', 'green', 'blue'], i, val,
				color, ce = _me.coloreditor;
			if (!ce || !(color = ce.color)) {
				return false;
			}

			for (i = 0; i < 3; i++) {
				val = Math.round(color[rgb[i]] * 255).toString(16);
				if (val.length == 1) {
					val = '0' + val;
				}
				hex += val;
			}

			color.hex = hex;

			return true;
		},

		// This updates the RGB color values, based on the hexadecimal color representation.
		'hex2rgb' : function () {
			var rgb = ['red', 'green', 'blue'], i, val, color, hex,
				ce = _me.coloreditor;
			if (!ce || !(color = ce.color) || !(hex = color.hex)) {
				return false;
			}

			hex = hex.substr(1);
			if (hex.length != 6) {
				return false;
			}

			for (i = 0; i < 3; i++) {
				val = hex.substr(i*2, 2);
				color[rgb[i]] = parseInt(val, 16)/255;
			}

			return true;
		},

		'rgb2lab' : function () {
			var color, ce = _me.coloreditor;
			if (!ce || !(color = ce.color)) {
				return false;
			}

			var lab = ce.xyz2lab(ce.rgb2xyz([color.red, color.green, color.blue]));
			color.cie_l = lab[0];
			color.cie_a = lab[1];
			color.cie_b = lab[2];

			return true;
		},

		'lab2rgb' : function () {
			var color, ce = _me.coloreditor;
			if (!ce || !(color = ce.color)) {
				return false;
			}

			var rgb = ce.xyz2rgb(ce.lab2xyz(color.cie_l, color.cie_a, color.cie_b));
			color.red   = rgb[0];
			color.green = rgb[1];
			color.blue  = rgb[2];

			return true;
		},

		'xyz2lab' : function (xyz) {
			var cfg = _me.coloreditor.lab,

				// 216/24389 or (6/29)^3 (both = 0.008856...)
				e = 216/24389,

				// 903.296296...
				k = 24389/27;

			xyz[0] /= cfg.w_x;
			xyz[1] /= cfg.w_y;
			xyz[2] /= cfg.w_z;

			if (xyz[0] > e) {
				xyz[0] = Math.pow(xyz[0], 1/3);
			} else {
				xyz[0] = (k*xyz[0] + 16)/116;
			}

			if (xyz[1] > e) {
				xyz[1] = Math.pow(xyz[1], 1/3);
			} else {
				xyz[1] = (k*xyz[1] + 16)/116;
			}

			if (xyz[2] > e) {
				xyz[2] = Math.pow(xyz[2], 1/3);
			} else {
				xyz[2] = (k*xyz[2] + 16)/116;
			}

			var cie_l = 116 *  xyz[1] - 16,
				cie_a = 500 * (xyz[0] -  xyz[1]),
				cie_b = 200 * (xyz[1] -  xyz[2]);

			return [cie_l, cie_a, cie_b];
		},

		'lab2xyz' : function (cie_l, cie_a, cie_b) {
			var y = (cie_l + 16) / 116;

			var x = y + cie_a / 500,
				z = y - cie_b / 200;

			var // 0.206896551...
				e = 6/29,

				// 7.787037...
				k = 1/3 * Math.pow(29/6, 2),

				// 0.137931...
				t = 16/116,
				cfg = _me.coloreditor.lab;

			if (x > e) {
				x = Math.pow(x, 3);
			} else {
				x = (x - t) / k;
			}

			if (y > e) {
				y = Math.pow(y, 3);
			} else {
				y = (y - t) / k;
			}

			if (z > e) {
				z = Math.pow(z, 3);
			} else {
				z = (z - t) / k;
			}

			x *= cfg.w_x;
			y *= cfg.w_y;
			z *= cfg.w_z;

			return [x, y, z];
		},

		'xyz2rgb' : function (xyz) {
			var rgb = _me.coloreditor.calc_m1x3(xyz, _me.coloreditor.lab.m_i);

			if (rgb[0] > 0.0031308) {
				rgb[0] = 1.055 * Math.pow(rgb[0], 1 / 2.4) - 0.055;
			} else {
				rgb[0] *= 12.9232;
			}

			if (rgb[1] > 0.0031308) {
				rgb[1] = 1.055 * Math.pow(rgb[1], 1 / 2.4) - 0.055;
			} else {
				rgb[1] *= 12.9232;
			}

			if (rgb[2] > 0.0031308) {
				rgb[2] = 1.055 * Math.pow(rgb[2], 1 / 2.4) - 0.055;
			} else {
				rgb[2] *= 12.9232;
			}

			if (rgb[0] < 0) {
				rgb[0] = 0;
			} else if (rgb[0] > 1) {
				rgb[0] = 1;
			}

			if (rgb[1] < 0) {
				rgb[1] = 0;
			} else if (rgb[1] > 1) {
				rgb[1] = 1;
			}

			if (rgb[2] < 0) {
				rgb[2] = 0;
			} else if (rgb[2] > 1) {
				rgb[2] = 1;
			}

			return rgb;
		},

		'rgb2xyz' : function (rgb) {
			if (rgb[0] > 0.04045) {
				rgb[0] = Math.pow(( rgb[0] + 0.055 ) / 1.055, 2.4);
			} else {
				rgb[0] /= 12.9232;
			}

			if (rgb[1] > 0.04045) {
				rgb[1] = Math.pow(( rgb[1] + 0.055 ) / 1.055, 2.4);
			} else {
				rgb[1] /= 12.9232;
			}

			if (rgb[2] > 0.04045) {
				rgb[2] = Math.pow(( rgb[2] + 0.055 ) / 1.055, 2.4);
			} else {
				rgb[2] /= 12.9232;
			}

			return _me.coloreditor.calc_m1x3(rgb, _me.coloreditor.lab.m);
		},

		// This function updates/redraws the entire color editor canvas. This is done by calling two methods: draw_chart() and draw_slider(). Additionally, this function updates the coordinates of the chart dot and of the slider handler.
		// The ckey argument tells which color key has been updated. This is used to determine which canvas parts need to be updated.
		'update_canvas' : function (updated_ckey) {
			var ce = _me.coloreditor;
			if (!ce || !ce.draw_chart || !ce.draw_slider || !ce.ckey_active) {
				return false;
			}

			if (ce.tab_picker != 'cmixer') {
				ce.update_canvas_needed = true;
				return true;
			}

			ce.update_canvas_needed = false;

			var slider  = ce.elems.slider_pos.style,
				chart   = ce.elems.chart_pos.style,
				color   = ce.color,
				ckey    = ce.ckey_active,
				group   = ce.ckey_active_group,
				adjoint = ce.ckey_adjoint,
				width   = ce.chart_width,
				height  = ce.context2d.canvas.height,
				mx, my, sy;

			// Update the slider which shows the position of the active ckey.
			if (updated_ckey != adjoint[0] && updated_ckey != adjoint[1] && ce.ev_canvas_mode != 'chart') {
				if (group == 'lab') {
					sy = (color[ckey] - ce.value_min[ckey]) / ce.abs_max[ckey];
				} else {
					sy = color[ckey];
				}

				if (ckey != 'hue' && group != 'lab') {
					sy = 1 - sy;
				}

				slider.top = Math.round(sy * height) + 'px';
			}

			// Update the chart dot.
			if (updated_ckey != ckey) {
				if (group == 'lab') {
					mx = (color[adjoint[0]] - ce.value_min[adjoint[0]]) / ce.abs_max[adjoint[0]];
					my = (color[adjoint[1]] - ce.value_min[adjoint[1]]) / ce.abs_max[adjoint[1]];
				} else {
					mx = color[adjoint[0]];
					my = 1 - color[adjoint[1]];
				}

				chart.top  = Math.round(my * height) + 'px';
				chart.left = Math.round(mx *  width) + 'px';
			}

			if (!ce.draw_chart(updated_ckey) || !ce.draw_slider(updated_ckey)) {
				return false;
			} else {
				return true;
			}
		},

		// This is the handler for mouse events sent to the #controls element, which is positioned on top of the canvas. This function updates the current color key value based on the mouse coordinates on the slider. If the mouse is inside the color chart, then the adjoint color keys are updated based on the coordinates.
		'ev_canvas' : function (ev) {
			var mode, ce = _me.coloreditor;
			if (!ce || !ce.elems || !ce.elems.controls || !ce.elems.slider_pos || !ce.elems.chart_pos || !ce.context2d || !ce.chart_width || !ce.ckey_active || !ce.slider_x || !ev || !ev.target) {
				return false;
			}

			if (ev.preventDefault) {
				ev.preventDefault();
			}

			// Initialize color picking only on mousedown.
			if (ev.type == 'mousedown' && !ce.ev_canvas_mode) {
				ce.ev_canvas_mode = true;
				_me.doc.addEventListener('mouseup', ce.ev_canvas, false);
			}

			if (!ce.ev_canvas_mode) {
				return false;
			}

			// The mouseup event stops the effect of any further mousemove events.
			if (ev.type == 'mouseup') {
				ce.ev_canvas_mode = false;
				_me.doc.removeEventListener('mouseup', ce.ev_canvas, false);
			}

			var tid = ev.target.id,
				elems = ce.elems;

			// If the user is on top of the 'controls' element, determine the mouse coordinates and the 'mode' for this function: the user is either working with the slider, or he/she is working with the color chart itself.
			if (tid == elems.controls.id) {
				var mx, my,
					width  = ce.context2d.canvas.width,
					height = ce.context2d.canvas.height;

				// Get the mouse position, relative to the event target.
				if (ev.layerX || ev.layerX == 0) { // Firefox
					mx = ev.layerX;
					my = ev.layerY;
				} else if (ev.offsetX || ev.offsetX == 0) { // Opera
					mx = ev.offsetX;
					my = ev.offsetY;
				}

				if (mx >= 0 && mx <= ce.chart_width) {
					mode = 'chart';
				} else if (mx >= ce.slider_x && mx <= width) {
					mode = 'slider';
				}
			} else {
				// The user might have clicked on the chart dot, or on the slider graphic itself.
				// If yes, then determine the mode based on this.
				if (tid == elems.chart_pos.id) {
					mode = 'chart';
				} else if (tid == elems.slider_pos.id) {
					mode = 'slider';
				}
			}

			// Update the ev_canvas_mode value to include the mode name, if it's simply the true boolean.
			// This ensures that the continuous mouse movements do not go from one mode to another when the user moves out from the slider to the chart (and vice-versa).
			if (mode && ce.ev_canvas_mode === true) {
				ce.ev_canvas_mode = mode;
			}

			// Do not continue if the mode wasn't determined (the mouse is not on the slider, nor on the chart).
			// Also don't continue if the mouse is not in the same place (different mode).
			if (!mode || ce.ev_canvas_mode != mode || tid != elems.controls.id || !ce.inputs) {
				return false;
			}

			var color = ce.color,
				val_x = mx / ce.chart_width,
				val_y = my / height;

			if (mode == 'slider') {
				if (ce.ckey_active == 'hue') {
					color[ce.ckey_active] = val_y;
				} else if (ce.ckey_active_group == 'lab') {
					color[ce.ckey_active] = ce.abs_max[ce.ckey_active] * val_y + ce.value_min[ce.ckey_active];
				} else {
					color[ce.ckey_active] = 1 - val_y;
				}

				return ce.update_color(ce.ckey_active);

			} else if (mode == 'chart') {
				if (ce.ckey_active_group == 'lab') {
					val_x = ce.abs_max[ce.ckey_adjoint[0]] * val_x + ce.value_min[ce.ckey_adjoint[0]];
					val_y = ce.abs_max[ce.ckey_adjoint[1]] * val_y + ce.value_min[ce.ckey_adjoint[1]];
				} else {
					val_y = 1 - val_y;
				}

				color[ce.ckey_adjoint[0]] = val_x;
				color[ce.ckey_adjoint[1]] = val_y;

				return ce.update_color(ce.ckey_active_group);
			}

			return false;
		},

		// When the user double clicks the canvas, this event handler toggles the double size mode on/off.
		'ev_dblclick_canvas' : function (ev) {
			var ce = _me.coloreditor;
			if (!ce || !ce.elems || !ce.elems.tab_cmixer || !ce.context2d || !ce.context2d.canvas) {
				return false;
			}

			var tab    = ce.elems.tab_cmixer,
				canvas = ce.context2d.canvas;

			if (tab.className == 'double') {
				canvas.width  /= 2;
				canvas.height /= 2;
				tab.className = '';
			} else {
				canvas.width  *= 2;
				canvas.height *= 2;
				tab.className = 'double';
			}

			ce.update_dimensions();

			if (ce.tab_picker != 'cmixer') {
				ce.update_canvas_needed = true;
				return ce.show_tab('cmixer');
			} else {
				return ce.update_canvas();
			}
		},

		// Draw the canvas color chart.
		// The ckey argument tells which color key has been updated. This is used to determine if the canvas color chart needs to be updated.
		'draw_chart' : function (updated_ckey) {
			var ce = _me.coloreditor;
			if (!ce || !ce.context2d || !ce.context2d.canvas || !ce.ckey_active || !ce.inputs || !ce.inputs[ce.ckey_active]) {
				return false;
			}

			var canvas  = ce.context2d.canvas,
				context = ce.context2d,
				gradient, color, opacity, i;

			if (updated_ckey == ce.ckey_adjoint[0] || updated_ckey == ce.ckey_adjoint[1] || (ce.ev_canvas_mode == 'chart' && updated_ckey == ce.ckey_active_group)) {
				return true;
			}

			var w = ce.chart_width,
				h = canvas.height;

			context.clearRect(0, 0, w, h);

			if (ce.ckey_active == 'sat') {
				// In saturation mode the user has the slider which allows him/her to change the saturation (hSv) of the current color.
				// The chart shows the hue spectrum on the X axis, while the Y axis gives the Value (hsV).

				if (ce.color.sat > 0) {
					// Draw the hue spectrum gradient on the X axis.
					gradient = context.createLinearGradient(0, 0, w, 0);
					for (i = 0; i <= 6; i++) {
						color = 'rgb(' + ce.hue[i][0] + ', ' + ce.hue[i][1] + ', ' + ce.hue[i][2] + ')';
						gradient.addColorStop(i * 1/6, color);
					}
					context.fillStyle = gradient;
					context.fillRect(0, 0, w, h);

					// Draw the gradient which darkens the hue spectrum on the Y axis.
					gradient = context.createLinearGradient(0, 0, 0, h);
					gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
					gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
					context.fillStyle = gradient;
					context.fillRect(0, 0, w, h);
				}

				if (ce.color.sat < 1) {
					// Draw the white to black gradient. This is used for creating the saturation effect. Lowering the saturation value makes the gradient more visible, hence the hue colors desaturate.
					opacity = 1 - ce.color.sat;
					gradient = context.createLinearGradient(0, 0, 0, h);
					gradient.addColorStop(0, 'rgba(255, 255, 255, ' + opacity + ')');
					gradient.addColorStop(1, 'rgba(  0,   0,   0, ' + opacity + ')');
					context.fillStyle = gradient;
					context.fillRect(0, 0, w, h);
				}

			} else if (ce.ckey_active == 'val') {
				// In value mode the user has the slider which allows him/her to change the value (hsV) of the current color.
				// The chart shows the hue spectrum on the X axis, while the Y axis gives the saturation (hSv).

				if (ce.color.val > 0) {
					// Draw the hue spectrum gradient on the X axis.
					gradient = context.createLinearGradient(0, 0, w, 0);
					for (i = 0; i <= 6; i++) {
						color = 'rgb(' + ce.hue[i][0] + ', ' + ce.hue[i][1] + ', ' + ce.hue[i][2] + ')';
						gradient.addColorStop(i * 1/6, color);
					}
					context.fillStyle = gradient;
					context.fillRect(0, 0, w, h);

					// Draw the gradient which lightens the hue spectrum on the Y axis.
					gradient = context.createLinearGradient(0, 0, 0, h);
					gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
					gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
					context.fillStyle = gradient;
					context.fillRect(0, 0, w, h);
				}

				if (ce.color.val < 1) {
					// Draw a solid black color on top. This is used for darkening the hue colors gradient when the user reduces the Value (hsV).
					context.fillStyle = 'rgba(0, 0, 0, ' + (1 - ce.color.val) +')';
					context.fillRect(0, 0, w, h);
				}

			} else if (ce.ckey_active == 'hue') {
				// In hue mode the user has the slider which allows him/her to change the hue (Hsv) of the current color.
				// The chart shows the current color in the background. The X axis gives the saturation (hSv), and the Y axis gives the value (hsV).

				if (ce.color.sat == 1 && ce.color.val == 1) {
					color = [ce.color.red, ce.color.green, ce.color.blue];
				} else {
					// Determine the RGB values for the current color which has the same hue, but maximum saturation and value (hSV).
					color = ce.hsv2rgb(true, [ce.color.hue, 1, 1]);
				}
				for (i = 0; i < 3; i++) {
					color[i] = Math.round(color[i] * 255);
				}

				context.fillStyle = 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')';
				context.fillRect(0, 0, w, h);

				// Draw the white gradient for saturation (X axis, hSv).
				gradient = context.createLinearGradient(0, 0, w, 0);
				gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
				gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
				context.fillStyle = gradient;
				context.fillRect(0, 0, w, h);

				// Draw the black gradient for value (Y axis, hsV).
				gradient = context.createLinearGradient(0, 0, 0, h);
				gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
				gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
				context.fillStyle = gradient;
				context.fillRect(0, 0, w, h);

			} else if (ce.ckey_active_group == 'rgb') {
				// In any red/green/blue mode the background color becomes the one of the ckey_active. Say, for ckey_active=red the background color would be the current red value (green and blue are both set to 0).
				// On the X/Y axes the other two colors are shown. E.g. for red the X axis gives the green gradient, and the Y axis gives the blue gradient. The two gradients are drawn on top of the red background using a global composite operation (lighter) - to create the color addition effect.
				var color2, color3;

				color = {'red' : 0, 'green' : 0, 'blue' : 0};
				color[ce.ckey_active] = Math.round(ce.color[ce.ckey_active] * 255);

				color2 = {'red' : 0, 'green' : 0, 'blue' : 0};
				color2[ce.ckey_adjoint[1]] = 255;

				color3 = {'red' : 0, 'green' : 0, 'blue' : 0};
				color3[ce.ckey_adjoint[0]] = 255;

				// The background.
				context.fillStyle = 'rgb(' + color.red + ',' + color.green + ',' + color.blue + ')';
				context.fillRect(0, 0, w, h);

				// This doesn't work in Opera 9.2 and older versions.
				var op = context.globalCompositeOperation;
				context.globalCompositeOperation = 'lighter';

				// The Y axis gradient.
				gradient = context.createLinearGradient(0, 0, 0, h);
				gradient.addColorStop(0, 'rgba(' + color2.red + ',' + color2.green + ',' + color2.blue + ', 1)');
				gradient.addColorStop(1, 'rgba(' + color2.red + ',' + color2.green + ',' + color2.blue + ', 0)');
				context.fillStyle = gradient;
				context.fillRect(0, 0, w, h);

				// The X axis gradient.
				gradient = context.createLinearGradient(0, 0, w, 0);
				gradient.addColorStop(0, 'rgba(' + color3.red + ',' + color3.green + ',' + color3.blue + ', 0)');
				gradient.addColorStop(1, 'rgba(' + color3.red + ',' + color3.green + ',' + color3.blue + ', 1)');
				context.fillStyle = gradient;
				context.fillRect(0, 0, w, h);

				context.globalCompositeOperation = op;

			} else if (ce.ckey_active_group == 'lab') {
				// The chart plots the CIE Lab colors. The non-active color keys give the X/Y axes. For example, if cie_l (lightness) is active, then the cie_a values give the X axis, and the Y axis is given by the values of cie_b.
				// The chart is drawn manually, pixel-by-pixel, due to the special way CIE Lab works. This is very slow in today's UAs.

				var imgd = false;

				if (context.createImageData) {
					imgd = context.createImageData(w, h);
				} else if (context.getImageData) {
					imgd = context.getImageData(0, 0, w, h);
				} else {
					imgd = {
						'width'  : w,
						'height' : h,
						'data'   : new Array(w*h*4)
					};
				}

				var pix = imgd.data,
					n = imgd.data.length - 1,
					i = -1, p = 0, inc_x, inc_y, xyz = [], rgb = [], cie_x, cie_y;

				cie_x = ce.ckey_adjoint[0];
				cie_y = ce.ckey_adjoint[1];

				color = {
					'cie_l' : ce.color.cie_l,
					'cie_a' : ce.color.cie_a,
					'cie_b' : ce.color.cie_b
				};

				inc_x = ce.abs_max[cie_x] / w;
				inc_y = ce.abs_max[cie_y] / h;

				color[cie_x] = ce.value_min[cie_x];
				color[cie_y] = ce.value_min[cie_y];

				while (i < n) {
					xyz = ce.lab2xyz(color.cie_l, color.cie_a, color.cie_b);
					rgb = ce.xyz2rgb(xyz);

					pix[++i] = Math.round(rgb[0]*255);
					pix[++i] = Math.round(rgb[1]*255);
					pix[++i] = Math.round(rgb[2]*255);
					pix[++i] = 255;

					p++;
					color[cie_x] += inc_x;

					if ((p % w) == 0) {
						color[cie_x] = ce.value_min[cie_x];
						color[cie_y] += inc_y;
					}
				}

				context.putImageData(imgd, 0, 0);
			}

			return true;
		},

		// Draw the canvas color slider.
		// The ckey argument tells which color key has been updated. This is used to determine if the canvas color chart needs to be updated.
		'draw_slider' : function (updated_ckey) {
			var ce = _me.coloreditor;
			if (!ce || !ce.context2d || !ce.context2d.canvas || !ce.ckey_active || !ce.inputs || !ce.inputs[ce.ckey_active]) {
				return false;
			}

			if (ce.ckey_active == updated_ckey) {
				return true;
			}

			var context = ce.context2d,
				slider_w = ce.slider_width,
				slider_h = ce.context2d.canvas.height - 1,
				slider_x = ce.slider_x,
				slider_y = 0,
				gradient, color, opacity, i;

			gradient = context.createLinearGradient(slider_x, slider_y, slider_x, slider_h);

			if (ce.ckey_active == 'hue') {
				// Draw the hue spectrum gradient.
				for (i = 0; i <= 6; i++) {
					color = 'rgb(' + ce.hue[i][0] + ', ' + ce.hue[i][1] + ', ' + ce.hue[i][2] + ')';
					gradient.addColorStop(i * 1/6, color);
				}
				context.fillStyle = gradient;
				context.fillRect(slider_x, slider_y, slider_w, slider_h);

				if (ce.color.sat < 1) {
					context.fillStyle = 'rgba(255, 255, 255, ' + (1 - ce.color.sat) + ')';
					context.fillRect(slider_x, slider_y, slider_w, slider_h);
				}
				if (ce.color.val < 1) {
					context.fillStyle = 'rgba(0, 0, 0, ' + (1 - ce.color.val) + ')';
					context.fillRect(slider_x, slider_y, slider_w, slider_h);
				}

			} else if (ce.ckey_active == 'sat') {
				// Draw the saturation gradient for the slider.
				// The start color is the current color with maximum saturation. The bottom gradient color is the same "color" without saturation.
				// The slider allows you to desaturate the current color.

				// Determine the RGB values for the current color which has the same hue and value (HsV), but maximum saturation (hSv).
				if (ce.color.sat == 1) {
					color = [ce.color.red, ce.color.green, ce.color.blue];
				} else {
					color = ce.hsv2rgb(true, [ce.color.hue, 1, ce.color.val]);
				}

				for (i = 0; i < 3; i++) {
					color[i] = Math.round(color[i] * 255);
				}

				var gray = Math.round(ce.color.val * 255);
				gradient.addColorStop(0, 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')');
				gradient.addColorStop(1, 'rgb(' + gray     + ', ' + gray     + ', ' + gray     + ')');
				context.fillStyle = gradient;
				context.fillRect(slider_x, slider_y, slider_w, slider_h);

			} else if (ce.ckey_active == 'val') {
				// Determine the RGB values for the current color which has the same hue and saturation, but maximum value (hsV).
				if (ce.color.val == 1) {
					color = [ce.color.red, ce.color.green, ce.color.blue];
				} else {
					color = ce.hsv2rgb(true, [ce.color.hue, ce.color.sat, 1]);
				}

				for (i = 0; i < 3; i++) {
					color[i] = Math.round(color[i] * 255);
				}

				gradient.addColorStop(0, 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')');
				gradient.addColorStop(1, 'rgb(0, 0, 0)');
				context.fillStyle = gradient;
				context.fillRect(slider_x, slider_y, slider_w, slider_h);

			} else if (ce.ckey_active_group == 'rgb') {
				var red   = Math.round(ce.color.red   * 255),
					green = Math.round(ce.color.green * 255),
					blue  = Math.round(ce.color.blue  * 255);

				color = {
					'red'   : red,
					'green' : green,
					'blue'  : blue
				};
				color[ce.ckey_active] = 255;

				var color2 = {
					'red'   : red,
					'green' : green,
					'blue'  : blue
				};
				color2[ce.ckey_active] = 0;

				gradient.addColorStop(0, 'rgb(' + color.red  + ',' + color.green  + ',' + color.blue  + ')');
				gradient.addColorStop(1, 'rgb(' + color2.red + ',' + color2.green + ',' + color2.blue + ')');
				context.fillStyle = gradient;
				context.fillRect(slider_x, slider_y, slider_w, slider_h);

			} else if (ce.ckey_active_group == 'lab') {
				// The slider shows a gradient with the current color key going from the minimum to the maximum value. The gradient is calculated pixel by pixel, due to the special way CIE Lab is defined.

				var imgd = false;

				if (context.createImageData) {
					imgd = context.createImageData(1, slider_h);
				} else if (context.getImageData) {
					imgd = context.getImageData(0, 0, 1, slider_h);
				} else {
					imgd = {
						'width'  : 1,
						'height' : slider_h,
						'data'   : new Array(slider_h*4)
					};
				}

				var pix = imgd.data,
					n = imgd.data.length - 1,
					ckey = ce.ckey_active,
					i = -1, inc, xyz, rgb;

				color = {
					'cie_l' : ce.color.cie_l,
					'cie_a' : ce.color.cie_a,
					'cie_b' : ce.color.cie_b
				};

				color[ckey] = ce.value_min[ckey];
				inc = ce.abs_max[ckey] / slider_h;

				while (i < n) {
					xyz = ce.lab2xyz(color.cie_l, color.cie_a, color.cie_b);
					rgb = ce.xyz2rgb(xyz);
					pix[++i] = Math.round(rgb[0]*255);
					pix[++i] = Math.round(rgb[1]*255);
					pix[++i] = Math.round(rgb[2]*255);
					pix[++i] = 255;

					color[ckey] += inc;
				}

				for (i = 0; i <= slider_w; i++) {
					context.putImageData(imgd, slider_x+i, slider_y);
				}
			}

			context.strokeStyle = '#6d6d6d';
			context.strokeRect(slider_x, slider_y, slider_w, slider_h);

			return true;
		},

		// Just like in Photoshop, if the user presses X, the fill/stroke colors are swapped.
		'swap_fill_stroke' : function (ev) {
			var ce = _me.coloreditor;
			if (!ce) {
				return false;
			}

			var tmp,
				fill   = _me.inputs.fillStyle,
				stroke = _me.inputs.strokeStyle,
				img    = _me.img_temp;

			if (!fill || !stroke || !img) {
				return false;
			}

			// Hide the color editor.
			if (ce.elems.target) {
				ce.hide();
			}

			tmp = img.fillStyle;
			img.fillStyle   = img.strokeStyle;
			img.strokeStyle = tmp;

			tmp = fill._value;
			fill._value   = stroke._value;
			stroke._value = tmp;

			fill   = fill.style;
			stroke = stroke.style;

			tmp = fill.backgroundColor;
			fill.backgroundColor   = stroke.backgroundColor;
			stroke.backgroundColor = tmp;

			tmp = fill.opacity;
			fill.opacity   = stroke.opacity;
			stroke.opacity = tmp;

			return true;
		}
	};

	// This is the event handler for most of the icon-based options. It used for shapeType, lineJoin, lineCap and textAlign
	_me.opt_icon = function (ev) {
		if (!this.id) {
			return false;
		}

		var pelem = this.parentNode;
		if (!pelem._prop) {
			return false;
		}

		var old_val = '', val = this.id.replace(pelem._prop + '-', '');
		if (pelem._prop == 'shapeType') {
			old_val = _me.shapeType;
			_me.shapeType = val;
		} else {
			old_val = _me.img_temp[pelem._prop];
			_me.img_temp[pelem._prop] = val;
		}

		var elem = _me.doc.getElementById(pelem._prop + '-' + old_val);
		if (elem) {
			elem.className = '';
		}

		this.className = 'active';

		if (_me.tool && _me.tool._id == 'text' && _me.tool.text_update) {
			_me.tool.text_update();
		}

		return true;
	};

	// The event handler for the text Bold/Italic icons.
	_me.opt_textStyle = function (ev) {
		if (!this._prop) {
			return false;
		}

		if (this.className == 'active') {
			_me[this._prop] = false;
			this.className  = '';
		} else {
			_me[this._prop] = true;
			this.className  = 'active';
		}

		return _me.update_textProps(ev);
	};

	// This is event handler for changes to the text font input. If the user wants to pick another font, then he/she can type the new font name to easily add it to the list of available fonts.
	_me.opt_textFont = function (ev) {
		if (this.value != '+') {
			return _me.update_textProps(ev);
		}

		var new_font = prompt(_me.getMsg('prompt-textFont'));
		if (!new_font) {
			this.selectedIndex = 0;
			this.value = this.options[0].value;
			return _me.update_textProps(ev);
		}

		new_font = new_font.replace(/^\s+/, '').replace(/\s+$/, '');

		// Check if the font name is already in the list.
		var opt, i, new_font2 = new_font.toLowerCase(),
			n = this.options.length;
		for (i = 0; i < n; i++) {
			opt = this.options[i];
			if (opt.value.toLowerCase() == new_font2) {
				this.selectedIndex = i;
				this.value = opt.value;
				return _me.update_textProps(ev);
			}
		}

		opt = _me.doc.createElement('option');
		opt.value = new_font;
		opt.appendChild(_me.doc.createTextNode(new_font));
		this.insertBefore(opt, this.options[n-1]);
		this.selectedIndex = n-1;
		this.value = new_font;

		return _me.update_textProps(ev);
	};

	// This event handler simply builds the font CSS property for use with the Text API.
	_me.update_textProps = function (ev) {
		if (!_me || !_me.img || !_me.img_temp || !_me.img.fillText || !_me.inputs || !_me.inputs.textFont || !_me.inputs.textSize) {
			return false;
		}

		// If this is the textSize input, then call _me.ev_input_nr(ev) to check the input value (the number).
		// Don't do anything if the value is invalid, or if it was not really updated.
		if (ev.target && ev.target.id == _me.inputs.textSize.id && !_me.ev_input_nr(ev)) {
			return false;
		}

		var my_font   = _me.inputs.textFont.value,
			my_size   = _me.inputs.textSize.value,
			my_bold   = _me.textBold,
			my_italic = _me.textItalic,
			prop      = '';

		if (my_bold) {
			prop += 'bold ';
		}
		if (my_italic) {
			prop += 'italic ';
		}
		if (my_size) {
			prop += my_size + 'px ';
		}
		if (my_font) {
			prop += my_font;
		}

		_me.img.font = _me.img_temp.font = prop;

		if (_me.tool && _me.tool._id == 'text' && _me.tool.text_update) {
			_me.tool.text_update();
		}

		return true;
	};

	// This function can be used to quickly toggle the canvas shadow.
	// This is also the event handler for the "Draw shadows" check box.
	_me.shadow_toggle = function (ev) {
		var input;
		if (!_me.inputs || !(input = _me.inputs.shadow_active)) {
			return false;
		}

		if (input.checked) {
			return _me.shadow_enable();
		} else {
			return _me.shadow_disable();
		}
	};

	// Shadows are applied as a post-effect: once the drawing operation is completed.
	_me.shadow_enable = function (ev) {
		var input, shadowColor;
		if (!_me.inputs || !(shadowColor = _me.inputs.shadowColor) || !(input = _me.inputs.shadow_active)) {
			return false;
		}

		if (!ev || ev.type != 'change') {
			input.checked = true;
		} else if (input.checked) {
			return true;
		}

		var _value = shadowColor._value;

		_me.img.shadowColor = 'rgba(' +
				Math.round(_value.red   * 255) + ', ' +
				Math.round(_value.green * 255) + ', ' +
				Math.round(_value.blue  * 255) + ', ' +
				           _value.alpha +')';

		shadowColor._disabled = false;

		var parentNode = shadowColor.parentNode.parentNode;
		parentNode.className = parentNode.className.replace(' disabled', '', 'g');

		var id, i, n, props = ['shadowOffsetX', 'shadowOffsetY', 'shadowBlur'];
		for (i = 0, n = props.length; i < n; i++) {
			id = props[i];
			input = _me.inputs[id];
			if (!input) {
				continue;
			}

			input.disabled = false;

			parentNode = input.parentNode;
			parentNode.className = parentNode.className.replace(' disabled', '', 'g');

			_me.img[id] = input.value;
		}

		return true;
	};

	_me.shadow_disable = function (ev) {
		var input;
		if (!_me.inputs || !_me.inputs.shadowColor || !(input = _me.inputs.shadow_active)) {
			return false;
		}

		if (!ev || ev.type != 'change') {
			input.checked = false;
		} else if (!input.checked) {
			return true;
		}

		_me.img.shadowColor = _me.img_temp.shadowColor = 'rgba(0, 0, 0, 0)';

		input = _me.inputs.shadowColor;
		input._disabled = true;
		input.parentNode.parentNode.className += ' disabled';

		var id, i, n, props = ['shadowOffsetX', 'shadowOffsetY', 'shadowBlur'];
		for (i = 0, n = props.length; i < n; i++) {
			id = props[i];
			input = _me.inputs[id];
			if (!input) {
				continue;
			}

			input.disabled = true;
			input.parentNode.className += ' disabled';
			_me.img[id] = 0;
		}

		return true;
	};


	// What follows are the event handlers for several buttons used in the application.

	_me.btn_help = function (ev) {
		var elem = _me.elems.help.style,
			btn = _me.elems.btn_help;
		if (!elem || !btn) {
			return false;
		}

		if (elem.display == 'none') {
			elem.display = 'block';
			btn.className = 'active';
			if (_me.boxes && _me.boxes.zIndex) {
				_me.boxes.zIndex += 200;
				elem.zIndex = _me.boxes.zIndex;
			}
		} else {
			elem.display = 'none';
			btn.className = '';
		}

		return true;
	};
	_me.btn_help_close = _me.btn_help;

	_me.btn_undo = function (ev) {
		_me.history_goto('-');
	};

	_me.btn_redo = function (ev) {
		_me.history_goto('+');
	};

	// This event handler simply clears the image. If the user holds the Shift key down, then he/she is given the option to define the new size of the image.
	_me.btn_clear = function (ev) {
		if (!ev || !ev.shiftKey) {
			_me.img.clearRect(0, 0, _me.imgW, _me.imgH);
			_me.history_add();
			return true;
		}

		// If the user holds the Shift key when he/she activates the "Clear image" button.

		var res = prompt(_me.getMsg('prompt-image-dimensions'), _me.imgW + 'x' + _me.imgH);
		if (!res) {
			return false;
		}

		res = res.replace(/\D/, ' ').replace(/\s+/, ' ').replace(/^\s+/, '').replace(/\s+$/, '');
		if (!res) {
			return false;
		}

		res = res.split(' ');
		if (res.length < 2) {
			return false;
		}

		var w = parseInt(res[0]),
			h = parseInt(res[1]);
		if (w > 1500) {
			w = 1500;
		}
		if (h > 1500) {
			h = 1500;
		}

		if (_me.imgW == w && _me.imgH == h) {
			return false;
		}

		_me.resize_canvas(w, h);
		_me.img.clearRect(0, 0, _me.imgW, _me.imgH);
		_me.history_add();

		return true;
	};

	// For the "Save image" option we simply open a new window/tab which contains the image saved as a PNG, using a data: URL.
	_me.btn_save = function (ev) {
		if (!_me || !_me.img || !_me.img.canvas || !_me.img.canvas.toDataURL) {
			return false;
		}

		var idata = _me.img.canvas.toDataURL();
		if (!idata || idata.toLowerCase() == 'data:') {
			return false;
		}

		var imgwin = window.open();
		if (!imgwin) {
			return false;
		}

		imgwin.location = idata;
		idata = null;

		return true;
	};

	_me.btn_cut = function (ev) {
		var elem = _me.elems.btn_cut;
		if (ev == -1 || ev == 1) {
			var nClass = ev == 1 ? '' : 'disabled';

			if (elem.className != nClass) {
				elem.className = nClass;
			}

			return true;
		}

		if (elem.className == 'disabled' || _me.tool._id != 'select') {
			return false;
		}

		return _me.tool.sel_cut(ev);
	};

	_me.btn_copy = function (ev) {
		var elem = _me.elems.btn_copy;
		if (ev == -1 || ev == 1) {
			var nClass = ev == 1 ? '' : 'disabled';

			if (elem.className != nClass) {
				elem.className = nClass;
			}

			return true;
		}

		if (elem.className == 'disabled' || _me.tool._id != 'select') {
			return false;
		}

		return _me.tool.sel_copy(ev);
	};

	_me.btn_paste = function (ev) {
		var elem = _me.elems.btn_paste;
		if (ev == -1 || ev == 1) {
			var nClass = ev == 1 ? '' : 'disabled';

			if (elem.className != nClass) {
				elem.className = nClass;
			}

			return true;
		}

		if (elem.className == 'disabled' || !_me.clipboard) {
			return false;
		}

		if (!_me.tool_activate('select', ev)) {
			return false;
		} else {
			return _me.tool.sel_paste(ev);
		}
	};

	// This function is used by most of the tools once the user completes the drawing action on the image buffer (img_temp). What it does is a simple merge of img_temp into img, after which img_temp is cleared, and the image is added to history.
	_me.img_update = function () {
		_me.img.drawImage(_me.img_temp.canvas, 0, 0);
		_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
		_me.history_add();

		return true;
	};

	// Add the current image to the history.
	_me.history_add = function () {
		// The get/putImageData methods do not work in Opera Merlin, nor in Safari (tested with 20080324 svn trunk, webkitgtk). However, in webkit svn trunk revision 37376 (20081007) these methods finally work (meaning Safari 4 might work).
		if (!_me.img.getImageData) {
			return false;
		}

		var n = _me.history_img.length;

		// We are in an undo-step, trim until the end, eliminating any possible redo-steps.
		if (_me.history_pos < n) {
			n -= _me.history_pos;
			_me.history_img.splice(_me.history_pos, n);
		}

		_me.history_img.push(_me.img.getImageData(0, 0, _me.imgW, _me.imgH));
		_me.history_pos++;
		n++;

		// If we have too many history ImageDatas, remove the oldest ones
		if (n > _me.history_limit) {
			n -= _me.history_limit;
			_me.history_img.splice(0, n);
			n = _me.history_pos = _me.history_img.length;
		}

		if(_me.elems.btn_redo) {
			_me.elems.btn_redo.className = 'disabled';
		}

		if(_me.elems.btn_undo) {
			_me.elems.btn_undo.className = '';
		}

		return true;
	};

	// Jump to any ImageData in the history. The position parameter can be specified as 'undo'/'-'/'redo'/'+' as well, for the purpose of navigating the history.
	_me.history_goto = function (pos) {
		if (!_me.history_img.length || !_me.img.putImageData) {
			return false;
		}

		var cpos = _me.history_pos;

		if (pos == 'undo' || pos == '-') {
			pos = cpos-1;
		} else if (pos == 'redo' || pos == '+') {
			pos = cpos+1;
		}
		pos = parseInt(pos);
		if (pos == cpos || isNaN(pos) || pos < 1 || pos > _me.history_img.length) {
			return false;
		}

		var himg = _me.history_img[pos-1];
		if (!himg) {
			return false;
		}

		// Each image in the history can have a different size. As such, the script must take this into consideration.
		var w = Math.min(_me.imgW,  himg.width),
			h = Math.min(_me.imgH, himg.height);

		_me.img.clearRect(0, 0, _me.imgW, _me.imgH);
		try {
			// Firefox 3 does not clip the image, if needed.
			_me.img.putImageData(himg, 0, 0, 0, 0, w, h);

		} catch (err) {
			// The workaround is to use a new canvas from which we can copy the history image without causing any exceptions.
			var tmp    = _me.doc.createElement('canvas');
			tmp.width  = himg.width;
			tmp.height = himg.height;

			var tmp2 = tmp.getContext('2d');
			tmp2.putImageData(himg, 0, 0);

			_me.img.drawImage(tmp, 0, 0);
			delete tmp2, tmp;
		}

		_me.history_pos = pos;

		var btn_redo = _me.elems.btn_redo,
			btn_undo = _me.elems.btn_undo;

		if (!btn_redo || !btn_undo) {
			return true;
		}

		if (pos == _me.history_img.length) {
			btn_redo.className = 'disabled';
		} else {
			btn_redo.className = '';
		}

		if (pos == 1) {
			btn_undo.className = 'disabled';
		} else {
			btn_undo.className = '';
		}

		return true;
	};

	// Each tool with the associated actions for each canvas event.
	_me.tools = {
		'rect' : function () {
			var _tool = this;
			_tool.start = false;

			_tool.deactivate = function () {
				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
				_tool.start = false;
				delete _tool.mousemove, _tool.mouseup;

				return true;
			};

			_tool.mousedown = function (ev) {
				if (_tool.start) {
					return false;
				}

				_tool.start = true;

				// Make sure the tool actions are called
				_tool.mousemove = _tool._mousemove;
				_tool.mouseup   = _tool._mouseup;
				_tool.x = ev._x;
				_tool.y = ev._y;
				_me.status_show('rect-mousedown');

				return true;
			};

			_tool._mousemove = function (ev) {
				if (!_tool.start) {
					return false;
				}

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);

				var x = Math.min(ev._x,  _tool.x),
					y = Math.min(ev._y,  _tool.y),
					w = Math.abs(ev._x - _tool.x),
					h = Math.abs(ev._y - _tool.y);

				if (!w || !h) {
					return false;
				}

				// Constrain the shape to a square
				if (ev.shiftKey) {
					if (w > h) {
						if (y == ev._y) {
							y -= w-h;
						}
						h = w;
					} else {
						if (x == ev._x) {
							x -= h-w;
						}
						w = h;
					}
				}

				if (_me.shapeType != 'stroke') {
					_me.img_temp.fillRect(x, y, w, h);
				}

				if (_me.shapeType != 'fill') {
					_me.img_temp.strokeRect(x, y, w, h);
				}

				return true;
			};

			_tool._mouseup = function (ev) {
				if (!_tool.start) {
					return false;
				}

				// Allow click+mousemove, not only mousedown+move+up
				if (ev._x == _tool.x && ev._y == _tool.y) {
					return true;
				}

				_tool.start = false;
				delete _tool.mousemove, _tool.mouseup;

				_me.img_update();
				_me.status_show('rect-active');

				return true;
			};

			// Escape cancels the current rectangle.
			_tool.keypress = function (ev) {
				if (!_tool.start || ev._kid != 'escape') {
					return false;
				}

				_tool.deactivate(ev);
				_me.status_show('rect-active');

				return true;
			};

			return true;
		},

		'line' : function () {
			var _tool = this;
			_tool.start = false;

			_tool.deactivate = function () {
				if (!_tool.start) {
					return true;
				}

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
				_tool.start = false;
				delete _tool.mousemove, _tool.mouseup;

				return true;
			};

			_tool.mousedown = function (ev) {
				if (_tool.start) {
					return false;
				}

				_tool.start = true;

				_tool.mousemove = _tool._mousemove;
				_tool.mouseup   = _tool._mouseup;
				_tool.x = ev._x;
				_tool.y = ev._y;

				_me.status_show('line-mousedown');

				return true;
			};

			_tool._mousemove = function (ev) {
				if (!_tool.start) {
					return false;
				}

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);

				// Snapping on the X/Y axis.
				if (ev.shiftKey) {
					_me.tool_snapXY(ev, _tool.x, _tool.y);
				}

				_me.img_temp.beginPath();
				_me.img_temp.moveTo(_tool.x, _tool.y);
				_me.img_temp.lineTo(ev._x, ev._y);
				_me.img_temp.stroke();
				_me.img_temp.closePath();

				return true;
			};

			_tool._mouseup = function (ev) {
				if (!_tool.start) {
					return false;
				}

				// Allow users to click then drag, not only mousedown+drag+mouseup.
				if (ev._x == _tool.x && ev._y == _tool.y) {
					return true;
				}

				_me.status_show('line-active');

				_tool.start = false;
				delete _tool.mousemove, _tool.mouseup;

				_me.img_update();

				return true;
			};

			// Escape cancels the current line.
			_tool.keypress = function (ev) {
				if (!_tool.start || ev._kid != 'escape') {
					return false;
				}

				_tool.deactivate(ev);
				_me.status_show('line-active');

				return true;
			};

			return true;
		},

		'pencil' : function () {
			var _tool = this;
			_tool.start = false;

			_tool.deactivate = function () {
				if (_tool.start) {
					_me.img_temp.closePath();
				}

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
				_tool.start = false;
				delete _tool.mousemove, _tool.mouseup;

				return true;
			};

			_tool.mousedown = function (ev) {
				if (_tool.start) {
					return false;
				}

				_tool.start = true;

				_tool.mousemove = _tool._mousemove;
				_tool.mouseup   = _tool._mouseup;
				_tool.x = ev._x;
				_tool.y = ev._y;

				_me.img_temp.beginPath();
				_me.img_temp.moveTo(ev._x, ev._y);

				return true;
			};

			_tool._mousemove = function (ev) {
				if (!_tool.start) {
					return false;
				}

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
				_me.img_temp.lineTo(ev._x, ev._y);
				_me.img_temp.stroke();

				return true;
			};

			_tool._mouseup = function (ev) {
				if (!_tool.start) {
					return false;
				}

				_tool.start = false;
				delete _tool.mousemove, _tool.mouseup;

				if (ev._x == _tool.x && ev._y == _tool.y) {
					_me.img_temp.lineTo(ev._x, ev._y+1);
					_me.img_temp.stroke();
				}

				_me.img_temp.closePath();
				_me.img_update();

				return true;
			};

			return true;
		},

		'poly' : function () {
			var _tool = this;

			_tool.start = false;

			// The points in the polygon
			_tool.points = [];

			_tool.deactivate = function () {
				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
				_tool.start = false;
				_tool.points = [];
				delete _tool.mousemove;

				return true;
			};

			_tool.click = function (ev) {
				if (_tool.start) {
					// Snapping on the X/Y axis.
					if (ev.shiftKey) {
						_me.tool_snapXY(ev, _tool.x1, _tool.y1);
					}

					var diffx1 = Math.abs(ev._x - _tool.x0),
						diffy1 = Math.abs(ev._y - _tool.y0),
						diffx2 = Math.abs(ev._x - _tool.x1),
						diffy2 = Math.abs(ev._y - _tool.y1);

					// End the polygon if the new point is close enough to the first/last point.
					if ((diffx1 < 5 && diffy1 < 5) || (diffx2 < 5 && diffy2 < 5)) {
						// Add the start point to complete the polygon shape.
						_tool.points.push([_tool.x0, _tool.y0]);

						_tool._mousemove();
						_tool.start = false;
						_tool.points = [];
						delete _tool.mousemove;

						_me.status_show('poly-active');
						_me.img_update();

						return true;
					}
				}

				// Remember the last pointer position.
				_tool.x1 = ev._x;
				_tool.y1 = ev._y;

				if (!_tool.start) {
					_tool.start = true;

					_tool.mousemove = _tool._mousemove;

					// Remember the first pointer position.
					_tool.x0 = ev._x;
					_tool.y0 = ev._y;

					_me.status_show('poly-mousedown');
				}

				_tool.points.push([ev._x, ev._y]);

				// Users need to know how to end drawing the polygon.
				if (_tool.points.length > 3) {
					_me.status_show('poly-end');
				}

				_tool._mousemove();

				return true;
			};

			_tool._mousemove = function (ev) {
				var p, i,
					n         = _tool.points.length,
					fillStyle = _me.img_temp.fillStyle;
				if (!_tool.start || !n || (n == 1 && !ev)) {
					return false;
				}

				// Store the last ev._x and ev._y, for later use.
				if (ev) {
					_tool.ex = ev._x;
					_tool.ey = ev._y;
				}

				// Snapping on the X/Y axis for the current point (if available).
				if (ev && ev.shiftKey) {
					_me.tool_snapXY(ev, _tool.x1, _tool.y1);
				}

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
				_me.img_temp.beginPath();
				_me.img_temp.moveTo(_tool.points[0][0], _tool.points[0][1]);

				// Draw the path of the polygon
				for (i = 0; i < n; i++) {
					p = _tool.points[i];
					_me.img_temp.lineTo(p[0], p[1]);
				}

				// If there's a current event, then draw the temporary point as well.
				if (ev) {
					_me.img_temp.lineTo(ev._x, ev._y);
				}

				if (_me.shapeType != 'stroke') {
					_me.img_temp.fill();
				}

				if (_me.shapeType != 'fill' || n == 1) {
					// In the case where we only have a straight line, draw a stroke even if no stroke should be drawn, such that the user has better visual feedback.

					if (n == 1 && ev && _me.shapeType == 'fill') {
						var strokeStyle = _me.img_temp.strokeStyle,
							lineWidth   = _me.img_temp.lineWidth;

						_me.img_temp.strokeStyle = _me.img_temp.fillStyle;
						_me.img_temp.lineWidth   = 1;
						_me.img_temp.stroke();
						_me.img_temp.strokeStyle = strokeStyle;
						_me.img_temp.lineWidth   = lineWidth;
					} else {
						_me.img_temp.stroke();
					}
				}

				_me.img_temp.closePath();

				// Draw blue squares for each point to provide live feedback for the user. The squares will not show when the final drawing is complete.
				if (ev) {
					_me.img_temp.fillStyle = '#0000ff';
					for (i = 0; i < n; i++) {
						p = _tool.points[i];
						_me.img_temp.fillRect(p[0], p[1], 4, 4);
					}
					_me.img_temp.fillStyle = fillStyle;
				}

				return true;
			};

			// Escape cancels the current polygon.
			// Return completes drawing the current polygon.
			_tool.keypress = function (ev) {
				if (!_tool.start || (ev._kid != 'escape' && ev._kid != 'return')) {
					return false;
				}

				if (ev._kid == 'escape') {
					_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
				} else if (ev._kid == 'return') {
					// Add the point of the last mousemove event, and the start point, to complete the polygon.
					_tool.points.push([_tool.ex, _tool.ey]);
					_tool.points.push([_tool.x0, _tool.y0]);
					_tool._mousemove();

					_me.img_update();
				}

				_tool.start = false;
				_tool.points = [];
				delete _tool.mousemove;

				_me.status_show('poly-active');

				return true;
			};

			return true;
		},

		'curve' : function () {
			var _tool = this;

			_tool.start = false;
			_tool.points = [];

			_tool.deactivate = function () {
				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
				_tool.start = false;
				_tool.points = [];
				delete _tool.mousemove, _tool.mouseup;

				return true;
			};

			_tool.mousedown = function (ev) {
				if (_tool.start) {
					return true;
				}

				_tool.start = true;
				_tool.mousemove = _tool.draw;
				_tool.mouseup = _tool._mouseup;

				return _tool.draw(ev);
			};

			_tool._mouseup = function (ev) {
				if (!_tool.start) {
					return false;
				}

				if (_tool.points.length == 0) {
					_me.status_show('curve-snapping');
				}

				if (_tool.points.length == 1) {
					// Snapping on the X/Y axis for the current point.
					if (ev.shiftKey) {
						_me.tool_snapXY(ev, _tool.points[0][0], _tool.points[0][1]);
					}

					_me.status_show('curve-active');
				}

				// We need 4 points to draw the Bézier curve: start, end, and two control points.
				if (_tool.points.length < 4) {
					_tool.points.push([ev._x, ev._y]);

					if (!_tool.draw()) {
						return false;
					}
				}

				if (_tool.points.length == 4) {
					_tool.points = [];
					_tool.start = false;
					delete _tool.mousemove, _tool.mouseup;

					return _me.img_update();
				}

				return true;
			};

			_tool.draw = function (ev) {
				var p = _tool.points;
				var y, i,
					n           = p.length,
					lineWidth   = _me.img_temp.lineWidth,
					strokeStyle = _me.img_temp.strokeStyle,
					fillStyle   = _me.img_temp.fillStyle,
					img         = _me.img_temp;

				// If there's an event, we can use the new point for live feedback.
				if (ev) {
					n++;
				}

				if (!n) {
					return false;
				}

				img.clearRect(0, 0, _me.imgW, _me.imgH);

				// Draw the main line
				if (n == 2) {
					// Snapping on the X/Y axis for the current point (if available).
					if (ev && ev.shiftKey) {
						_me.tool_snapXY(ev, p[0][0], p[0][1]);
					}

					img.beginPath();
					img.moveTo(p[0][0], p[0][1]+2);
					i = p[1];
					if (!i) {
						i = [ev._x, ev._y];
					}
					img.lineTo(i[0], i[1]+2);
					img.lineWidth = 1;
					img.strokeStyle = '#000000';
					img.stroke();
					img.closePath();

					img.lineWidth = lineWidth;
					img.strokeStyle = strokeStyle;
				}

				// Draw the points
				if (n < 4 || (n == 4 && ev)) {
					img.fillStyle = '#0000ff';
					for (i = 0; i < n; i++) {
						y = p[i];
						if (!y) {
							y = [ev._x, ev._y];
						}

						img.fillRect(y[0], y[1], 4, 4);
					}
					img.fillStyle = fillStyle;
				}

				// If we do not have at least 3 points we cannot draw any Bézier curve
				if (n < 3) {
					return true;
				}

				// The fourth point
				var p4 = p[3];
				if (!p4) {
					// If the fourth point is not available, then use the current event or the third point.
					if (ev) {
						p4 = [ev._x, ev._y];
					} else {
						p4 = p[2];
					}
				}

				var p3 = p[2];
				if (!p3) {
					p3 = [ev._x, ev._y];
				}

				img.beginPath();
				img.moveTo(p[0][0], p[0][1]);
				img.bezierCurveTo(p3[0], p3[1],
					p4[0], p4[1],
					p[1][0], p[1][1]);

				if (_me.shapeType != 'stroke') {
					img.fill();
				}
				if (_me.shapeType != 'fill') {
					img.stroke();
				}

				img.closePath();

				return true;
			};

			// Escape cancels drawing the current curve.
			_tool.keypress = function (ev) {
				if (!_tool.start || ev._kid != 'escape') {
					return false;
				}

				_tool.deactivate(ev);
				_me.status_show('curve-active');

				return true;
			};

			return true;
		},

		'ellipse' : function () {
			var _tool = this;
			_tool.start = false;
			_tool.K = 4*((Math.SQRT2-1)/3);

			_tool.deactivate = function () {
				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
				_tool.start = false;
				delete _tool.mousemove, _tool.mouseup;

				return true;
			};

			_tool.mousedown = function (ev) {
				if (_tool.start) {
					return false;
				}

				_tool.start = true;
				_tool.mousemove = _tool._mousemove;
				_tool.mouseup = _tool._mouseup;

				// The mouse start position
				_tool.x = ev._x;
				_tool.y = ev._y;

				_me.status_show('ellipse-mousedown');

				return true;
			};

			_tool._mousemove = function (ev) {
				if (!_tool.start) {
					return false;
				}

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);

				var rectx0 = Math.min(ev._x, _tool.x),
					rectx1 = Math.max(ev._x, _tool.x),
					recty0 = Math.min(ev._y, _tool.y),
					recty1 = Math.max(ev._y, _tool.y);

				/*
					ABCD - rectangle
					A(rectx0, recty0), B(rectx1, recty0), C(rectx1, recty1), D(rectx0, recty1)
				*/

				var w = rectx1-rectx0,
					h = recty1-recty0;

				if (!w || !h) {
					return false;
				}

				// Constrain the ellipse to be a circle
				if (ev.shiftKey) {
					if (w > h) {
						recty1 = recty0+w;
						if (recty0 == ev._y) {
							recty0 -= w-h;
							recty1 -= w-h;
						}
						h = w;
					} else {
						rectx1 = rectx0+h;
						if (rectx0 == ev._x) {
							rectx0 -= h-w;
							rectx1 -= h-w;
						}
						w = h;
					}
				}

				// Ellipse radius
				var rx = w/2,
					ry = h/2;	

				// Ellipse center
				var cx = rectx0+rx,
					cy = recty0+ry;

				// Ellipse radius*Kappa, for the Bézier curve control points
				rx *= _tool.K;
				ry *= _tool.K;

				_me.img_temp.beginPath();

				// startX, startY
				_me.img_temp.moveTo(cx, recty0);

				// Control points: cp1x, cp1y, cp2x, cp2y, destx, desty
				// go clockwise: top-middle, right-middle, bottom-middle, then left-middle
				_me.img_temp.bezierCurveTo(cx + rx, recty0, rectx1, cy - ry, rectx1, cy);
				_me.img_temp.bezierCurveTo(rectx1, cy + ry, cx + rx, recty1, cx, recty1);
				_me.img_temp.bezierCurveTo(cx - rx, recty1, rectx0, cy + ry, rectx0, cy);
				_me.img_temp.bezierCurveTo(rectx0, cy - ry, cx - rx, recty0, cx, recty0);

				if (_me.shapeType != 'stroke') {
					_me.img_temp.fill();
				}
				if (_me.shapeType != 'fill') {
					_me.img_temp.stroke();
				}

				_me.img_temp.closePath();

				return true;
			};

			_tool._mouseup = function (ev) {
				if (!_tool.start) {
					return false;
				}

				// Allow click+mousemove, not only mousedown+move+up
				if (ev._x == _tool.x && ev._y == _tool.y) {
					return true;
				}

				_tool.start = false;
				delete _tool.mousemove, _tool.mouseup;

				_me.status_show('ellipse-active');

				return _me.img_update();
			};

			// Escape cancels drawing the current ellipse.
			_tool.keypress = function (ev) {
				if (!_tool.start || ev._kid != 'escape') {
					return false;
				}

				_tool.deactivate(ev);
				_me.status_show('ellipse-active');

				return true;
			};

			return true;
		},

		// Color picker
		'cpicker' : function () {
			var _tool = this;

			// There are problems with Safari (tested 20080324 svn trunk, webkitgtk) and Opera Merlin (Opera versions older than 9.5).
			// Safari makes the get/putImageData methods visible, even if they seem unimplemented.
			if (!_me.img.getImageData) {
				alert( _me.getMsg('error-cpicker-unsupported') );
				_tool._cancel = true;
				return false;
			}

			_tool.prev_tool = false;
			_tool.target = false;

			if (_me.tool && _me.tool._id) {
				_tool.prev_tool = _me.tool._id;
			}

			var ce = _me.coloreditor;

			// The color picker "dialog" is active
			if (ce.elems.target) {
				_tool.target = ce.elems.target;
				_me.status_texts['cpicker-active'] = _me.status_texts['cpicker-' + _tool.target._prop];
			} else {
				_me.status_texts['cpicker-active'] = _me.status_texts['cpicker-normal'];
			}

			_tool.mousedown = function (ev) {
				if (!_tool.target) {
					// The context menu (right-click). This is unsupported by Opera.
					// Also allow Shift+Click for changing the stroke color (making it easier for Opera users).
					if (ev.button == 2 || ev.shiftKey) {
						_tool.target = _me.inputs.strokeStyle;
					} else {
						_tool.target = _me.inputs.fillStyle;
					}
					_tool.store_pcolor();
				}

				_tool.mouseout = _tool.mousemove = _tool.update_color;
				_tool.mouseup = _tool._mouseup;

				return _tool.update_color(ev);
			};

			_tool._mouseup = function (ev) {
				if (!_tool.target) {
					return false;
				}

				_tool.update_color(ev);

				// Hide the current color picker and update the canvas coordinates once the user picks the color.
				if (_me.elems.colorpicker_target) {
					_me.colorpicker_hide(ev);
				} else {
					delete _tool.mousemove, _tool.mouseup, _tool.mouseout;
				}

				if (_tool.prev_tool) {
					_me.tool_activate(_tool.prev_tool, ev);
				}

				return true;
			};

			// Escape returns to the previous tool.
			_tool.keypress = function (ev) {
				if (!_tool.prev_tool || ev._kid != 'escape') {
					return false;
				}

				_me.tool_activate(_tool.prev_tool, ev);
				return true;
			};

			// Unfortunately, the contextmenu event is unsupported by Opera
			_tool.contextmenu = function (ev) {
				// This is already done by ev_canvas()
				ev.preventDefault();
			};

			_tool.update_color = function (ev) {
				if (!ev || !_tool.target || !_tool.target._prop) {
					return false;
				}

				if (ev.type != 'mouseout') {
					var p = _me.img.getImageData(ev._x, ev._y, 1, 1);
				} else if (ev.type == 'mouseout' && _tool.prev_color) {
					var p = _tool.prev_color;
				} else {
					return false;
				}

				var op = p.data[3]/255;
				op = op.toFixed(3);

				if (ev.type == 'mouseup') {
					_me.img_temp[_tool.target._prop] = 'rgba(' + p.data[0] + ',' + p.data[1] + ',' + p.data[2] + ',' + op + ')';
					_tool.target._value = {
						'red'   : p.data[0] / 255,
						'green' : p.data[1] / 255,
						'blue'  : p.data[2] / 255,
						'alpha' : op
					};
				}

				_tool.target.style.backgroundColor = 'rgb(' + p.data[0] + ',' + p.data[1] + ',' + p.data[2] + ')';
				_tool.target.style.opacity = op;

				// If the color picker is visible, then update the field values as well.
				if (ce.elems.target) {
					ce.color.red   = p.data[0] / 255;
					ce.color.green = p.data[1] / 255;
					ce.color.blue  = p.data[2] / 255;
					ce.color.alpha = op;
					ce.update_color('rgb');
				}

				return true;
			};

			// This function stores the initial color.
			_tool.store_pcolor = function () {
				if (!_tool.target || !_tool.target._value) {
					return false;
				}

				var color = _tool.target._value;

				_tool.prev_color = {'width' : 1,
					'height' : 1,
					'data' : [
						Math.round(color.red   * 255),
						Math.round(color.green * 255),
						Math.round(color.blue  * 255),
						color.alpha * 255
					]
				};

				return true;
			};

			// If the target is available, it means that the color selector is already visible. As such, color picking can start automatically.
			if (_tool.target) {
				_tool.mouseout = _tool.mousemove = _tool.update_color;
				_tool.store_pcolor();
			}

			return true;
		},

		'eraser' : function () {
			var _tool = this;

			if (!_me.tools || !_me.tools.pencil) {
				alert( _me.getMsg('error-tool-activate') );
				_tool._cancel = true;
				return false;
			}

			// The eraser actually uses the pencil tool with some changes.
			_tool.pencil = new _me.tools.pencil();
			_tool.strokeStyle = _me.img_temp.strokeStyle;

			// Activation code. This is run after the tool construction and after the deactivation of the previous tool.
			_tool.activate = function () {
				// Disable the canvas shadow.
				if (_me.inputs.shadow_active) {
					_tool.shadow_active = _me.inputs.shadow_active.checked;
					_me.shadow_disable();
					_me.inputs.shadow_active.disabled = true;
				}

				return true;
			};

			_tool.deactivate = function (ev) {
				_tool.pencil.deactivate(ev);

				if (_tool.strokeStyle) {
					_me.img_temp.strokeStyle = _tool.strokeStyle;
				}

				// Enable canvas shadow.
				if (_me.inputs.shadow_active) {
					_me.inputs.shadow_active.disabled = false;
					if (_tool.shadow_active) {
						_me.shadow_enable();
					}
				}

				return true;
			};

			// The mousedown event remembers the current strokeStyle and sets a white colored stroke (same as the background), such that the user gets live feedback of what he/she erases.
			_tool.mousedown = function (ev) {
				_tool.strokeStyle = _me.img_temp.strokeStyle;
				_me.img_temp.strokeStyle = 'rgb(255,255,255)';

				_tool.pencil.mousedown(ev);

				if (_tool.pencil.mousemove) {
					_tool.mousemove = _tool.pencil.mousemove;
				}
				if (_tool.pencil.mouseup) {
					_tool.mouseup = _tool._mouseup;
				}

				return true;
			};

			// The mouseup event function changes the globalCompositeOperation to destination-out such that the white pencil path drawn by the user cuts out/clears the destination image
			_tool._mouseup = function (ev) {
				if (_tool.pencil.mouseup) {
					var op = _me.img.globalCompositeOperation;
					_me.img.globalCompositeOperation = 'destination-out';
					_tool.pencil.mouseup(ev);
					_me.img.globalCompositeOperation = op;
				}

				_me.img_temp.strokeStyle = _tool.strokeStyle;
				delete _tool.mousemove, _tool.mouseup;

				return true;
			};

			return true;
		},

		'select' : function () {
			var _tool = this;

			/* Steps:
			 * -1 - selection dropped after mousedown. The script can switch to step 1 (drawing) if the mouse moves, or to step 0 if it does not (allowing to completely drop the selection).
			 * 0 - no selection
			 * 1 - drawing selection rectangle
			 * 2 - selection rectangle available
			 * 3 - dragging selection
			 * 4 - resizing selection
			 * 5 - dragging ImageData
			 * 6 - resizing ImageData
			 */
			_tool.step = 0;

			// The following properties are initialised more for the purpose of explaining them

			// The start position for any operation
			_tool.x0 = false;
			_tool.y0 = false;

			// The selection start position and the end position, including and excluding borders
			_tool.sx0b = _tool.sx0 = false;
			_tool.sy0b = _tool.sy0 = false;
			_tool.sx1b = _tool.sx1 = false;
			_tool.sy1b = _tool.sy1 = false;

			// The inner selection width/height (sw1/sh1).
			// The normal selection width/height (sw2/sh2) are the values used by strokeRect(). They include the lineWidth.
			_tool.sw1 =_tool.sh1 = _tool.sw2 =_tool.sh2 = false;

			// During step 2 (selection available) the mouse position can be: inside, outside, or on the border/resizer of the selection rectangle.
			_tool.mpos = false; // 'in' || 'out' || 'r'

			// During steps 4 and 6 (resizing selection/ImageData) the resizer can be: n, ne, e, s, sw, w, nw.
			_tool.resizer = false;

			// The last _me.img_temp.lineWidth, and ceil(lineWidth/2)
			_tool.lineWidth = _tool.lineWidth2 = false;

			// Remember if the selected ImageData from _me.img has been cut out or not.
			_tool.cleared = false;

			// Check the availability of important properties and elements.
			if (!_me.img_temp || !_me.img_temp.canvas || !_me.img_temp.canvas.style || !_me.inputs || !_me.inputs.selTransparent || !_me.inputs.selTransform || !_me.doc || !_me.img || !_me.img.canvas || !_me.container || !_me.inputs.strokeStyle || !_me.inputs.strokeStyle._value || !_me.elems.selectionOptions) {
				alert( _me.getMsg('error-tool-activate') );
				_tool._cancel = true;
				return false;
			}

			// Show the selection options.
			_me.elems.selectionOptions.className = '';

			_tool.canvasStyle = _me.img_temp.canvas.style;

			if (!_me.img.putImageData || !_me.img.getImageData) {
				_me.inputs.selTransparent.checked = true;
			}
			_tool.transparency = _me.inputs.selTransparent.checked;
			_tool.transform = _me.inputs.selTransform.checked;

			// Make sure that the selection rectangle is visible enough
			var strokeStyle = _me.inputs.strokeStyle;
			if (parseFloat(strokeStyle._value.a) < 0.5) {
				strokeStyle._value.a = 1;
				strokeStyle.style.opacity = 1;
				_me.img_temp[strokeStyle._prop] = 'rgb(' + strokeStyle._value.r + ',' + strokeStyle._value.g + ',' + strokeStyle._value.b + ')';
			}
			delete strokeStyle;

			// The selection buffer
			_tool.selbuffer = _me.doc.createElement('canvas');
			if (!_tool.selbuffer) {
				alert( _me.getMsg('error-tool-activate') );
				_tool._cancel = true;
				return false;
			}
			_tool.selbuffer.id = 'selBuffer';
			_tool.selbuffer.width = _me.imgW;
			_tool.selbuffer.height = _me.imgH;

			_me.container.appendChild(_tool.selbuffer);

			_tool.selbuffer = _tool.selbuffer.getContext('2d');
			if (!_tool.selbuffer) {
				alert( _me.getMsg('error-tool-activate') );
				_tool._cancel = true;
				return false;
			}

			// Activation code. This is run after the tool construction and after the deactivation of the previous tool.
			_tool.activate = function () {
				// Disable the canvas shadow.
				if (_me.inputs.shadow_active) {
					_tool.shadow_active = _me.inputs.shadow_active.checked;
					_me.shadow_disable();
					_me.inputs.shadow_active.disabled = true;
				}

				return true;
			};

			_tool.deactivate = function (ev) {
				_tool.selbuffer_merge(ev);

				_me.container.removeChild(_tool.selbuffer.canvas);
				delete _tool.selbuffer;

				_me.inputs.selTransparent.removeEventListener('change', _tool.update_transparency, false);

				// Minimize the selection options.
				_me.elems.selectionOptions.className = 'minimized';

				// Enable canvas shadow.
				if (_me.inputs.shadow_active) {
					_me.inputs.shadow_active.disabled = false;
					if (_tool.shadow_active) {
						_me.shadow_enable();
					}
				}

				return true;
			};

			_tool.mousedown = function (ev) {
				// While drawing/dragging/resizing the selection/ImageData, mousedown has no effect.
				// This is needed for allowing operations via click+mousemove+click, instead of just mousedown+mousemove+mouseup
				if (_tool.step != 0 && _tool.step != 2) {
					return false;
				}

				// Update the current mouse position, this is used as the start position for most of the operations.
				_tool.x0 = ev._x;
				_tool.y0 = ev._y;

				// No selection is available, then start drawing a selection (step 1)
				if (_tool.step == 0) {
					_tool.update_lineWidth(ev);
					_tool.step = 1;
					_me.status_show('select-draw');

					return true;
				}


				// Step 2: selection available.

				_tool.update_mpos(ev);
				_tool.update_lineWidth(ev);

				// The user clicked outside the selection: drop the selection, go back to step -1, clear img_temp and put the current _tool.selbuffer on the final image.
				// If the user moves the mouse without taking the finger off the mouse button, then a new selection rectangle will start to be drawn: the script will switch to step 1 - drawing selection.
				// If the user simply takes the finger off the mouse button (mouseup), then the script will only switch to step 0 (no selection available).
				if (_tool.mpos == 'out') {
					_tool.step = -1;
					_me.status_show('select-active');
					return _tool.selbuffer_merge(ev);
				}

				// Depending on the selection mode the script will manipulate the ImageData or just the selection rectangle, when dragging/resizing.
				_tool.transform = _me.inputs.selTransform.checked;

				// The mouse position: 'in' for drag.
				if (_tool.mpos == 'in') {
					if (!_tool.transform) {
						_tool.step = 3; // dragging selection
					} else {
						_tool.step = 5; // dragging ImageData
					}
					_me.status_show('select-drag');

				} else if (_tool.mpos == 'r') {
					// 'r' for resize (the user clicked on the borders)

					if (!_tool.transform) {
						_tool.step = 4; // resizing selection
					} else {
						_tool.step = 6; // resizing ImageData
					}
					_me.status_show('select-resize');
				}

				// If there's any ImageData currently in memory, which was "cut" out from _me.img, then put the current ImageData on the final image (_me.img), when dragging/resizing the selection
				if (_tool.cleared && (_tool.step == 3 || _tool.step == 4)) {
					_tool.selbuffer_merge(ev);
				}

				// When the user drags/resizes the ImageData: cut out the current selection from _me.img
				if (!_tool.cleared && (_tool.step == 5 || _tool.step == 6)) {
					_tool.selbuffer_init(ev);
				}

				_tool.sx0 -= _tool.lineWidth2;
				_tool.sy0 -= _tool.lineWidth2;

				// Dragging selection (3) or ImageData (5)
				if (_tool.step == 3 || _tool.step == 5) {
					_tool.sx0 -= _tool.x0;
					_tool.sy0 -= _tool.y0;
				}

				return true;
			};

			_tool.mousemove = function (ev) {
				// Selection dropped, then mouse moves? If yes, switch to drawing a selection (1)
				if (_tool.step == -1) {
					_tool.step = 1;
					_me.status_show('select-draw');
				}

				// Selection available
				if (_tool.step == 2) {
					return _tool.update_mpos(ev);
				} else if (_tool.step < 1 || _tool.step > 6) {
					return false; // Unknown step
				}

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);

				// Drawing selection rectangle
				if (_tool.step == 1) {
					var x = Math.min(ev._x,  _tool.x0),
						y = Math.min(ev._y,  _tool.y0),
						w = Math.abs(ev._x - _tool.x0),
						h = Math.abs(ev._y - _tool.y0);

					// Constrain the shape to a square
					if (ev.shiftKey) {
						if (w > h) {
							if (y == ev._y) {
								y -= w-h;
							}
							h = w;
						} else {
							if (x == ev._x) {
								x -= h-w;
							}
							w = h;
						}
					}

				} else if (_tool.step == 3 || _tool.step == 5) {
					// Dragging selection (3) or ImageData (5)

					// Snapping on the X/Y axis
					if (ev.shiftKey) {
						_me.tool_snapXY(ev, _tool.x0, _tool.y0);
					}

					var x = _tool.sx0 + ev._x,
						y = _tool.sy0 + ev._y,
						w = _tool.sw2,
						h = _tool.sh2;

					if (_tool.step == 5) {
						var dw = _tool.sw1,
							dh = _tool.sh1;
					}

				} else if (_tool.step == 4 || _tool.step == 6) {
					// Resizing selection (4) or ImageData (6)

					var param = _tool.calc_resize(ev);

					// The rectangle is too small
					if (!param) {
						return false;
					}

					var x = param[0],
						y = param[1],
						w = param[2],
						h = param[3];

					if (_tool.step == 6) {
						var dw = w - _tool.lineWidth,
							dh = h - _tool.lineWidth;
					}
				}

				if (!w || !h) {
					return false;
				}

				// Dragging (5) or resizing (6) ImageData
				if (dw && dh && (_tool.step == 5 || _tool.step == 6)) {
					var sb = _tool.selbuffer;

					// Parameters:
					// source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
					_me.img_temp.drawImage(sb.canvas, 0, 0, sb._sw, sb._sh,
						x + _tool.lineWidth2, y + _tool.lineWidth2,
						dw, dh);
				}

				_me.img_temp.strokeRect(x, y, w, h);

				return true;
			};

			_tool.mouseup = function (ev) {
				// Selection dropped? If yes, switch to no selection.
				if (_tool.step == -1) {
					_tool.step = 0;
					_me.status_show('select-active');
					return true;
				}

				// Allow click+mousemove+click, not only mousedown+move+up
				if (ev._x == _tool.x0 && ev._y == _tool.y0) {
					return true;
				}

				// Skip any unknown step
				if (_tool.step < 1 || _tool.step > 6 || _tool.step == 2) {
					return false;

				} else if (_tool.step == 4 || _tool.step == 6) {
					// Resizing selection (4) or ImageData (6)	

					var newVal = _tool.calc_resize(ev);
					if (!newVal) {
						_tool.step = 0;
						_me.btn_cut(-1);
						_me.btn_copy(-1);
						return false;
					}

					_tool.sx0 = newVal[0];
					_tool.sy0 = newVal[1];
					_tool.sw2 = newVal[2];
					_tool.sh2 = newVal[3];
				}

				// Update all the selection info
				_tool.calc_selinfo(ev);

				// Back to step 2: selection available
				_tool.step = 2;
				_me.btn_cut(1);
				_me.btn_copy(1);
				_me.status_show('select-available');

				return true;
			};

			// Determine the mouse position: if it's inside/outside the selection rectangle, or on the border
			_tool.update_mpos = function (ev) {
				var ncur = '';

				_tool.mpos = 'out';

				// Inside the rectangle
				if (ev._x < _tool.sx1 && ev._y < _tool.sy1 && ev._x > _tool.sx0 && ev._y > _tool.sy0) {
					ncur = 'move';
					_tool.mpos = 'in';
				} else {
					// On one of the borders (north/south)
					if (ev._x >= _tool.sx0b && ev._x <= _tool.sx1b && ev._y >= _tool.sy0b && ev._y <= _tool.sy0) {
						ncur = 'n';
					} else if (ev._x >= _tool.sx0b && ev._x <= _tool.sx1b && ev._y >= _tool.sy1 && ev._y <= _tool.sy1b) {
						ncur = 's';
					}

					// West/east
					if (ev._y >= _tool.sy0b && ev._y <= _tool.sy1b && ev._x >= _tool.sx0b && ev._x <= _tool.sx0) {
						ncur += 'w';
					} else if (ev._y >= _tool.sy0b && ev._y <= _tool.sy1b && ev._x >= _tool.sx1 && ev._x <= _tool.sx1b) {
						ncur += 'e';
					}

					if (ncur != '') {
						_tool.resizer = ncur;
						ncur += '-resize';
						_tool.mpos = 'r';
					}
				}

				// Due to bug 126457 Opera will not automatically update the cursor, therefore Opera users will not see any visual feedback.
				if (ncur != _tool.canvasStyle.cursor) {
					_tool.canvasStyle.cursor = ncur;
				}

				return true;
			};

			// Used to update _tool.lineWidth, handling all the cases
			_tool.update_lineWidth = function (ev) {
				if (_tool.lineWidth == _me.img_temp.lineWidth) {
					return false;
				}

				_tool.lineWidth = _me.img_temp.lineWidth;
				// When lineWidth is an odd number ... tiny pixel errors show
				if ((_tool.lineWidth % 2) != 0) {
					_tool.lineWidth++;
					_me.img_temp.lineWidth = _tool.lineWidth;
					_me.inputs.lineWidth.value = _tool.lineWidth;
				}
				_tool.lineWidth2 = _tool.lineWidth/2;

				// Selection available (2)
				if (_tool.step < 2) {
					return true;
				}

				// Continue with updating the selection info

				_tool.sx0 -= _tool.lineWidth2;
				_tool.sy0 -= _tool.lineWidth2;
				_tool.sw2 = _tool.sw1 + _tool.lineWidth;
				_tool.sh2 = _tool.sh1 + _tool.lineWidth;

				return _tool.calc_selinfo(ev);
			};

			// This method handles enabling/disabling selection transparency
			_tool.update_transparency = function (ev) {
				_tool.transform = _me.inputs.selTransform.checked;

				// Selection available (step 2)
				if (!_tool.transform || _tool.step != 2 || this.checked == _tool.transparency) {
					return false;
				}

				if (!_me.img.getImageData || !_me.img.putImageData) {
					_tool.transparency = this.checked = true;
					return false;
				}

				_tool.transparency = this.checked;

				var sb = _tool.selbuffer;

				if (!_tool.cleared) {
					_tool.selbuffer_init(ev);

					// Parameters:
					// source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
					_me.img_temp.drawImage(sb.canvas, 0, 0, sb._sw, sb._sh,
						_tool.sx0 + _tool.lineWidth2, _tool.sy0 + _tool.lineWidth2,
						_tool.sw1, _tool.sh1);
				}

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);

				if (_tool.transparency) {
					// If we have the original ImageData, then put it into the selection buffer
					if (sb._imgd) {
						sb.putImageData(sb._imgd, 0, 0);
					}

					sb._imgd = false;
				} else {
					// Draw the selection background and put the ImageData on top.
					_me.img_temp.fillRect(0, 0, sb._sw, sb._sh);
					_me.img_temp.drawImage(sb.canvas, 0, 0);

					// Store the original ImageData
					sb._imgd = sb.getImageData(0, 0, sb._sw, sb._sh);

					// Copy the selection background with the ImageData merged on top, in the selection buffer
					sb.clearRect(0, 0, sb._sw, sb._sh);
					sb.drawImage(_me.img_temp.canvas, 0, 0);

					_me.img_temp.clearRect(0, 0, sb._sw, sb._sh);

					// Side note: simply drawing the background and using putImageData does not work, because putImageData replaces all the pixels on the destination. putImageData does not draw the ImageData on top of the destination.
				}

				// Draw the updated selection
				_me.img_temp.drawImage(sb.canvas, 0, 0, sb._sw, sb._sh, _tool.sx0, _tool.sy0, _tool.sw1, _tool.sh1);
				_me.img_temp.strokeRect(_tool.sx0b + _tool.lineWidth2, _tool.sy0b + _tool.lineWidth2, _tool.sw2, _tool.sh2);

				return true;
			};
			_me.inputs.selTransparent.addEventListener('change', _tool.update_transparency, false);

			// Calculate the new coordinates of the selection rectangle, and the dimension, based on the mouse position
			_tool.calc_resize = function (ev) {
				var diffx = ev._x - _tool.x0,
					diffy = ev._y - _tool.y0,
					x = _tool.sx0, y = _tool.sy0,
					w = _tool.sw2, h = _tool.sh2,
					r = _tool.resizer;

				if (r.charAt(0) == 'n') {
					y += diffy;
					h -= diffy;
				} else if (r.charAt(0) == 's') {
					h += diffy;
				}

				if (r == 'e' || r == 'se' || r == 'ne') {
					w += diffx;
				} else if (r == 'w' || r == 'nw' || r == 'sw') {
					x += diffx;
					w -= diffx;
				}

				if (!w || !h) {
					return false;
				}

				// Constrain the rectangle to have the same aspect ratio as the initial rectangle.
				if (ev.shiftKey) {
					var p = _tool.sw2 / _tool.sh2,
						w2 = w, h2 = h;

					if (r.charAt(0) == 'n' || r.charAt(0) == 's') {
						w2 = (w < 0 ? -1 : 1) * Math.abs(Math.round(h*p));
					} else {
						h2 = (h < 0 ? -1 : 1) * Math.abs(Math.round(w/p));
					}

					if (r == 'nw' || r == 'sw') {
						x -= w2 - w;
						y -= h2 - h;
					}

					w = w2;
					h = h2;
				}

				if (w < 0) {
					x += w;
					w = Math.abs(w);
				}
				if (h < 0) {
					y += h;
					h = Math.abs(h);
				}

				return [x, y, w, h];
			};

			// This method calculates all the needed selection boundaries. Most of these boundaries are used by other methods, while resizing, dragging, etc. For better performance while performing "intensive" operations, it's best that the UA does as little as possible during mousemove
			_tool.calc_selinfo = function (ev) {
				// Drawing selection rectangle
				if (_tool.step == 1) {
					var minX = Math.min(ev._x, _tool.x0),
						minY = Math.min(ev._y, _tool.y0),
						maxX = Math.max(ev._x, _tool.x0),
						maxY = Math.max(ev._y, _tool.y0);

				} else if (_tool.step == 3 || _tool.step == 5) {
					// Dragging selection (3) or ImageData (5)

					// Snapping on the X/Y axis
					if (ev.shiftKey) {
						_me.tool_snapXY(ev, _tool.x0, _tool.y0);
					}

					var minX = _tool.sx0 + ev._x,
						minY = _tool.sy0 + ev._y;

				} else if (_tool.step == 2 || _tool.step == 4 || _tool.step == 6) {
					// Selection available (2), resizing selection (4), resizing ImageData (6)

					var minX = _tool.sx0,
						minY = _tool.sy0;

				} else {
					return false;
				}

				if (_tool.step != 1) {
					var maxX = minX + _tool.sw2,
						maxY = minY + _tool.sh2;
				}

				// Store the selection start and end pos
				_tool.sx0 = minX + _tool.lineWidth2;
				_tool.sy0 = minY + _tool.lineWidth2;
				_tool.sx1 = maxX - _tool.lineWidth2;
				_tool.sy1 = maxY - _tool.lineWidth2;

				// ... including the borders
				_tool.sx0b = minX - _tool.lineWidth2;
				_tool.sy0b = minY - _tool.lineWidth2;
				_tool.sx1b = maxX + _tool.lineWidth2;
				_tool.sy1b = maxY + _tool.lineWidth2;

				// inner width and height
				_tool.sw1 = _tool.sx1 - _tool.sx0;
				_tool.sh1 = _tool.sy1 - _tool.sy0;

				if (_tool.step == 1) {
					// "normal" width and height (as used by the strokeRect method)
					_tool.sw2 = maxX - minX;
					_tool.sh2 = maxY - minY;
				}

				return true;
			};

			// Initialize the selection buffer, when the user starts dragging (5) or resizing (6) ImageData
			_tool.selbuffer_init = function (ev) {
				var x = _tool.sx0, y = _tool.sy0,
					w = _tool.sw1, h = _tool.sh1,
					sumX = _tool.sx0 + _tool.sw1,
					sumY = _tool.sy0 + _tool.sh1,
					dx = 0, dy = 0,
					sb = _tool.selbuffer;

				sb._sw = w;
				sb._sh = h;

				if (x < 0) {
					w += x;
					dx -= x;
					x = 0;
				}
				if (y < 0) {
					h += y;
					dy -= y;
					y = 0;
				}

				if (sumX > _me.imgW) {
					w -= sumX - _me.imgW;
				}
				if (sumY > _me.imgH) {
					h -= sumY - _me.imgH;
				}

				// Copy the currently selected ImageData into the temporary canvas (img_temp)
				_me.img_temp.drawImage(_me.img.canvas, x, y, w, h, x, y, w, h);

				sb.clearRect(0, 0, _me.imgW, _me.imgH);

				// Set a non-transparent background for the selection buffer, if the user does not want the selection to have a transparent background.
				sb._imgd = false;
				if (!_tool.transparency && _me.img.getImageData) {
					// Store the selection ImageData as-is
					sb._imgd = _me.img.getImageData(x, y, w, h);
					sb.fillStyle = _me.img_temp.fillStyle;
					sb.fillRect(0, 0, sb._sw, sb._sh);
				}

				// Also put the selected ImageData into the selection buffer canvas (selbuffer).
				// Parameters: source image, src x, src y, src width, src height, dest x, dest y, dest w, dest h
				sb.drawImage(_me.img.canvas, x, y, w, h, dx, dy, w, h);

				// Clear the selected pixels from the image
				_me.img.clearRect(x, y, w, h);
				_tool.cleared = true;

				_me.history_add();

				return true;
			};

			// Merge the ImageData from the selection buffer, when the user stops dragging (5) or resizing (6) ImageData.
			_tool.selbuffer_merge = function (ev) {
				var sb = _tool.selbuffer;
				if (!sb) {
					return false;
				}

				if (_tool.step == 3 || _tool.step == 4) {
					_me.img_temp.clearRect(_tool.sx0, _tool.sy0, _tool.sw1, _tool.sh1);
				} else {
					_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
				}

				if (_tool.cleared && sb._sw && sb._sh) {
					_me.img.drawImage(sb.canvas, 0, 0, sb._sw, sb._sh, _tool.sx0, _tool.sy0, _tool.sw1, _tool.sh1);
					_me.history_add();
					_tool.cleared = false;
				}

				sb._imgd = false;
				_tool.canvasStyle.cursor = '';
				_me.btn_cut(-1);
				_me.btn_copy(-1);

				return true;
			};

			_tool.sel_cut = function (ev) {
				if (!_tool.sel_copy(ev)) {
					return false;
				}

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
				_tool.selbuffer.clearRect(0, 0, _me.imgW, _me.imgH);

				if (!_tool.cleared) {
					_me.img.clearRect(_tool.sx0, _tool.sy0, _tool.sw1, _tool.sh1);
					_me.history_add();
				}

				_tool_cleared = false;
				_tool.selbuffer._imgd = false;
				_tool.step = 0;
				_tool.canvasStyle.cursor = '';

				_me.btn_cut(-1);
				_me.btn_copy(-1);
				_me.status_show('select-active');

				return true;
			};

			_tool.sel_copy = function (ev) {
				if (_tool.step != 2) {
					return false;
				}

				if (!_me.img.getImageData || !_me.img.putImageData) {
					alert(_me.getMsg('error-clipboard-unsupported'));
					return false;
				}

				if (!_tool.cleared) {
					_me.clipboard = _me.img.getImageData(_tool.sx0, _tool.sy0, _tool.sw1, _tool.sh1);
					return _me.btn_paste(1);
				}

				var sb = _tool.selbuffer;

				if (sb._imgd) {
					_me.clipboard = sb._imgd;
				} else {
					_me.clipboard = sb.getImageData(0, 0, sb._sw, sb._sh);
				}

				return _me.btn_paste(1);
			};

			_tool.sel_paste = function (ev) {
				if (_tool.step != 0 && _tool.step != 2) {
					return false;
				}

				if (!_me.img.getImageData || !_me.img.putImageData) {
					alert(_me.getMsg('error-clipboard-unsupported'));
					return false;
				}

				// The default position for the pasted image is the top left corner of the visible area, taking into consideration the zoom level.
				var sb = _tool.selbuffer,
					x = Math.round(_me.container.scrollLeft / _me.zoom),
					y = Math.round(_me.container.scrollTop  / _me.zoom),
					w = _me.clipboard.width,
					h = _me.clipboard.height;

				x += _tool.lineWidth;
				y += _tool.lineWidth;

				if (_tool.step == 2) {
					_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
					_tool.canvasStyle.cursor = '';
					sb._imgd = false;
				}

				// The following code block sucks:
				// you can't use negative values, nor do you have a good globalCompositeOperation
				sb.putImageData(_me.clipboard, 0, 0);
				if (_tool.transparency) {
					_me.img_temp.putImageData(_me.clipboard, x, y);
				} else {
					_me.img_temp.fillRect(x, y, w, h);
					_me.img_temp.drawImage(sb.canvas, x, y);
					sb._imgd = _me.img_temp.getImageData(x, y, w, h);

					sb.putImageData(sb._imgd, 0, 0);
					sb._imgd = _me.clipboard;
				}

				sb._sw = _tool.sw1 = w;
				sb._sh = _tool.sh1 = h;
				_tool.sw2 = w + _tool.lineWidth2;
				_tool.sh2 = h + _tool.lineWidth2;
				_tool.sx0 = x;
				_tool.sy0 = y;
				_tool.sx0b = x - _tool.lineWidth;
				_tool.sy0b = y - _tool.lineWidth;
				_tool.sx1 = w + x;
				_tool.sy1 = h + y;
				_tool.sx1b = _tool.sx1 + _tool.lineWidth;
				_tool.sy1b = _tool.sy1 + _tool.lineWidth;
				_tool.transform = _me.inputs.selTransform.checked = true;
				_tool.cleared = true;
				_tool.step = 2;

				_me.btn_cut(1);
				_me.btn_copy(1);
				_me.status_show('select-available');

				_me.img_temp.strokeRect(_tool.sx0b + _tool.lineWidth2, _tool.sy0b + _tool.lineWidth2, _tool.sw2, _tool.sh2);

				_tool.update_mpos(ev);

				return true;
			};

			// Return: quickly enable/disable the transformation mode.
			// Delete: delete the selected pixels.
			// Escape: drop selection.
			// Alt-Backspace: fill the selection with a flat color (fillStyle). This only works when transformation mode is disabled.
			_tool.keypress = function (ev) {
				// Toggle transformation mode
				if (ev._kid == 'return') {
					_tool.transform = !_me.inputs.selTransform.checked;
					_me.inputs.selTransform.checked = _tool.transform;

				} else if ((ev._kid == 'delete' || ev._kid == 'escape') && _tool.step == 2) {
					// Delete the selected pixels and/or drop the selection (when the selection is available).

					// Delete the pixels from the image if they are not deleted already.
					if (!_tool.cleared && ev._kid == 'delete') {
						_me.img.clearRect(_tool.sx0, _tool.sy0, _tool.sw1, _tool.sh1);
						_me.history_add();
					}

					_tool.step = 0;
					_tool.cleared = false;
					_tool.canvasStyle.cursor = '';
					_tool.selbuffer._imgd = false;

					_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
					_me.btn_cut(-1);
					_me.btn_copy(-1);
					_me.status_show('select-active');

				} else if (ev._kid == 'alt-backspace' && !_tool.transform) {
					// Fill the selection with a flat color (fillStyle).

					_me.img.fillStyle = _me.img_temp.fillStyle;
					_me.img.fillRect(_tool.sx0, _tool.sy0, _tool.sw1, _tool.sh1);
					_me.history_add();

				} else {
					return false;
				}

				return true;
			};

			_tool.update_lineWidth();

			return true;
		},

		'insertimg' : function () {
			var _tool = this;

			if (!_me.img || !_me.img.canvas || !_me.container || !_me.img_temp || !_me.tool || !_me.tool._id) {
				alert( _me.getMsg('error-tool-activate') );
				_tool._cancel = true;
				return false;
			}

			// Once the image is inserted, the user goes back to the previous tool.
			_tool.prev_tool = _me.tool._id;

			// The default URL
			if (!_me.tools.insertimg._url) {
				_me.tools.insertimg._url = 'http://';
			}

			_tool.url = prompt(_me.getMsg('prompt-insertimg'), _me.tools.insertimg._url);
			if (!_tool.url || _tool.url.toLowerCase() == 'http://' || _tool.url.substr(0, 7).toLowerCase() != 'http://') {
				_tool._cancel = true;
				return false;
			}
			_me.tools.insertimg._url = _tool.url;

			_tool.get_host = function (url) {
				url = url.substr(7);
				var pos = url.indexOf('/');
				if (pos > -1) {
					url = url.substr(0, pos);
				}

				return url;
			};

			if (_tool.get_host(_tool.url) != _me.win.location.host) {
				alert( _me.getMsg('error-insertimg-host') );
				_tool._cancel = true;
				return false;
			}

			// Make sure the image dimensions are synchronized with the zoom level.
			_tool.ev_img_load = function (ev) {
				// Did the image already load?
				if (_tool.img_loaded) {
					return true;
				}

				// The default position for the inserted image is the top left corner of the visible area, taking into consideration the zoom level.
				var x = Math.round(_me.container.scrollLeft / _me.zoom),
					y = Math.round(_me.container.scrollTop  / _me.zoom);

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);

				try {
					_me.img_temp.drawImage(_tool.img, x, y);
					_tool.img_loaded = true;
					_me.status_show('insertimg-loaded');
				} catch (err) {
					alert( _me.getMsg('error-insertimg') );
				}

				return true;
			};
			_tool.img_loaded = false;

			// The mouse start position, used when the user also resizes the image with the mousdown+mousemove+mouseup sequence.
			_tool._x = _tool._y = 0;

			_tool.img = new Image();
			_tool.img.addEventListener('load', _tool.ev_img_load, false);
			_tool.img.src = _tool.url;

			_tool.mousedown = function (ev) {
				if (!_tool.img_loaded) {
					alert(_me.getMsg('error-insertimg-not-loaded'));
					return false;
				}

				_tool._x = ev._x;
				_tool._y = ev._y;

				_tool.mousemove_img(ev);

				// Switch to the image resize "mode" of the tool.
				_tool.mousemove = _tool.mousemove_resize;

				// The image aspect ratio - used by the resizer when the user holds the Shift key down.
				_tool.imgar = _tool.img.width / _tool.img.height;

				_me.status_show('insertimg-resize');

				if (ev.stopPropagation) {
					ev.stopPropagation();
				}
			};

			// This is the initial mousemove event handler. It keeps the image position in sync with the mouse, such that the user can pick where to put the image on the canvas.
			_tool.mousemove_img = function (ev) {
				if (!_tool.img_loaded) {
					return false;
				}

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
				_me.img_temp.drawImage(_tool.img, ev._x, ev._y);
			};
			_tool.mousemove = _tool.mousemove_img;

			// After mousedown the mousemove event handler becomes this function. By doing so, users are allowed to resize the image.
			_tool.mousemove_resize = function (ev) {
				var w = Math.abs(ev._x - _tool._x),
					h = Math.abs(ev._y - _tool._y),
					x = Math.min(ev._x, _tool._x),
					y = Math.min(ev._y, _tool._y);

				// Constrain the image to have the same aspect ratio as the original
				if (ev.shiftKey) {
					if (w > h) {
						if (y == ev._y) {
							y -= w-h;
						}
						h = Math.round(w/_tool.imgar);
					} else {
						if (x == ev._x) {
							x -= h-w;
						}
						w = Math.round(h*_tool.imgar);
					}
				}

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);
				_me.img_temp.drawImage(_tool.img, x, y, w, h);
			};

			_tool.mouseup = function (ev) {
				if (!_tool.img_loaded) {
					return false;
				}

				if (ev._x != _tool._x || ev._y != _tool._y) {
					_tool.mousemove_resize(ev);
				}

				_me.img_update();

				if (_tool.prev_tool) {
					_me.tool_activate(_tool.prev_tool, ev);
				}

				if (ev.stopPropagation) {
					ev.stopPropagation();
				}
			};

			_tool.deactivate = function (ev) {
				if (_tool.img) {
					_tool.img = null;
					delete _tool.img;
				}

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);

				return true;
			};

			// Escape returns to the previous tool.
			_tool.keypress = function (ev) {
				if (!_tool.prev_tool || ev._kid != 'escape') {
					return false;
				}

				_me.tool_activate(_tool.prev_tool, ev);
				return true;
			};

			return true;
		},

		'text' : function () {
			var _tool = this;

			if (!_me.img || !_me.img.canvas || !_me.container || !_me.img_temp || !_me.resizer || !_me.resizer.elem || !_me.tool || !_me.tool._id || !_me.inputs || !_me.inputs.textString || !_me.elems.textOptions) {
				alert( _me.getMsg('error-tool-activate') );
				_tool._cancel = true;
				return false;
			}

			if (!_me.img.fillText || !_me.img.strokeText) {
				alert( _me.getMsg('error-text-unsupported') );
				_tool._cancel = true;
				return false;
			}

			// Once the text is inserted, the user goes back to the previous tool
			_tool.prev_tool = _me.tool._id;

			// The last text position, but by default it's in the center of the image.
			_tool.x = Math.round(_me.imgW / 2);
			_tool.y = Math.round(_me.imgH / 2);

			// Show the text options.
			_me.elems.textOptions.className = '';

			// The event handler for the text field and the other text options.
			_tool.text_update = function (ev) {
				if (!ev) {
					ev = {};
				}

				ev._x = _tool.x;
				ev._y = _tool.y;

				_tool.mousemove(ev);
			};

			_tool.setup_events = function (act) {
				var ev, i, listeners = ['textString', 'textFont', 'textSize', 'lineWidth'];

				for (i in listeners) {
					i = listeners[i];
					i = _me.inputs[i];
					if (!i) {
						continue;
					}
					if (i.tagName.toLowerCase() == 'select' || i.type == 'checkbox') {
						ev = 'change';
					} else {
						ev = 'input';
					}
					if (act == 'add') {
						i.addEventListener(ev, _tool.text_update, false);
					} else {
						i.removeEventListener(ev, _tool.text_update, false);
					}
				}
			};
			_tool.setup_events('add');

			_tool.mousemove = function (ev) {
				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);

				if (_me.shapeType != 'stroke') {
					_me.img_temp.fillText(_me.inputs.textString.value, ev._x, ev._y);
				}

				if (_me.shapeType != 'fill') {
					_me.img_temp.strokeText(_me.inputs.textString.value, ev._x, ev._y);
				}

				_tool.x = ev._x;
				_tool.y = ev._y;
			};

			_tool.click = function (ev) {
				_tool.mousemove(ev);

				_me.img_update();

				_me.tool_activate(_tool.prev_tool, ev);

				if (ev.stopPropagation) {
					ev.stopPropagation();
				}
			};

			// The following event handler runs post-construction and post-deactivation of the previous tool.
			_tool.activate = _tool.text_update;

			_tool.deactivate = function (ev) {
				_tool.setup_events('remove');

				_me.img_temp.clearRect(0, 0, _me.imgW, _me.imgH);

				// Minimize the text options.
				_me.elems.textOptions.className = 'minimized';

				return true;
			};

			// Escape returns to the previous tool.
			_tool.keypress = function (ev) {
				if (!_tool.prev_tool || ev._kid != 'escape') {
					return false;
				}

				_me.tool_activate(_tool.prev_tool, ev);
				return true;
			};

			return true;
		},

		'drag' : function () {
			var _tool = this;

			if (!_me.img_temp || !_me.doc || !_me.doc.body) {
				alert( _me.getMsg('error-tool-activate') );
				_tool._cancel = true;
				return false;
			}

			_tool.start = false;
			_me.img_temp.canvas.style.cursor = 'move';

			// If Escape key is pressed, the user goes back to the previous tool
			_tool.prev_tool = _me.tool._id;

			_tool.mousedown = function (ev) {
				_tool.x0 = Math.round(ev._x * _me.zoom);
				_tool.y0 = Math.round(ev._y * _me.zoom);
				_tool.start = true;
			};

			_tool.mousemove = function (ev) {
				if (!_tool.start) {
					return false;
				}

				var dx = Math.round(ev._x * _me.zoom) - _tool.x0,
					dy = Math.round(ev._y * _me.zoom) - _tool.y0;

				_me.container.scrollTop -= dy;
				_me.container.scrollLeft -= dx;
			};

			_tool.mouseup = function (ev) {
				_tool.start = false;
			};

			_tool.deactivate = function (ev) {
				_me.img_temp.canvas.style.cursor = '';
			};

			// Escape returns to the previous tool.
			_tool.keypress = function (ev) {
				if (!_tool.prev_tool || ev._kid != 'escape') {
					return false;
				}

				_me.tool_activate(_tool.prev_tool, ev);
				return true;
			};

			return true;
		}
	};

	_me.tool_snapXY = function (ev, x, y) {
		var diffx = Math.abs(ev._x - x),
			diffy = Math.abs(ev._y - y);

		if (diffx > diffy) {
			ev._y = y;
		} else {
			ev._x = x;
		}
	};

	// Global keyboard shortcuts. These can access functions and/or tools.
	// For each keyboard shortcut an element can be associated. During initialization the script will add the keyboard shortcut to the title of each element.
	_me.kshortcuts = {
		'ctrl-z' : {
			'func' : _me.btn_undo,
			'elem' : 'btn_undo'
		},
		'ctrl-y' : {
			'func' : _me.btn_redo,
			'elem' : 'btn_redo'
		},
		'ctrl-x' : {
			'func' : _me.btn_cut,
			'elem' : 'btn_cut'
		},
		'shift-delete' : { 'func' : _me.btn_cut },
		'ctrl-c' : {
			'func' : _me.btn_copy,
			'elem' : 'btn_copy'
		},
		'ctrl-v' : {
			'func' : _me.btn_paste,
			'elem' : 'btn_paste'
		},
		'ctrl-n' : {
			'func' : _me.btn_clear,
			'elem' : 'btn_clear'
		},
		'ctrl-shift-n' : { 'func' : _me.btn_clear },
		'ctrl-s' : {
			'func' : _me.btn_save,
			'elem' : 'btn_save'
		},

		'?' : {
			'func' : _me.btn_help,
			'elem' : 'btn_help'
		},
		'shift-?' : { 'func' : _me.btn_help },

		'+' : { 'func' : _me.key_zoom },
		'-' : { 'func' : _me.key_zoom },
		'*' : { 'func' : _me.key_zoom },
		'shift-+' : { 'func' : _me.key_zoom },
		'shift--' : { 'func' : _me.key_zoom },
		'shift-*' : { 'func' : _me.key_zoom },

		'c' : { 'tool' : 'cpicker' },
		'e' : { 'tool' : 'ellipse' },
		'g' : { 'tool' : 'poly' },
		'h' : { 'tool' : 'drag' },
		'i' : { 'tool' : 'insertimg' },
		'l' : { 'tool' : 'line' },
		'o' : { 'tool' : 'eraser' },
		'p' : { 'tool' : 'pencil' },
		'r' : { 'tool' : 'rect' },
		't' : { 'tool' : 'text' },
		's' : { 'tool' : 'select' },
		'v' : { 'tool' : 'curve' },
		'x' : { 'func' : _me.coloreditor.swap_fill_stroke }
	};

	// @id - Message ID (must be in _me.messages)
	// @vars - An object {'param' : 'value', ...}. This pair is used for substitution in the message, so variables can be used within the messages.
	_me.getMsg = function (id, vars) {
		var msg, re, i;

		if (!id || !_me.messages || !(msg = _me.messages[id])) {
			return _me.messages['internal-error'] || 'Internal error';
		} else if (!vars) {
			return msg;
		}

		for (i in vars) {
			re = new RegExp('%' + i + '%', 'g');
			msg = msg.replace(re, vars[i]);
		}

		return msg;
	};

	_me.toString = function () {
		return _me.getMsg('toString', {'build' : _me.build, 'ver' : _me.version});
	};

	return _me.init();

}, false); }

// vim:set ts=4 sw=4 sts=4 sta noet fenc=utf-8 ff=unix:

