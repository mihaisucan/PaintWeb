#! /usr/bin/env node
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
 * $Date: 2014-01-28 12:32:32 $
 */

// This is an experimental build script for PaintWeb which must be run in NodeJS 
// (see nodejs.org).
//
// You also need:
// - dryice - http://github.com/mozilla/dryice
// - Step - http://github.com/creationix/step

var dryice = require("dryice");
var Step = require("step");
var fs = require("fs");

var folder_base = __dirname;
var folder_src = "src";
var folder_tools = folder_src + "/tools";
var folder_extensions = folder_src + "/extensions";
var folder_interface = "interfaces/default";
var file_interface_script = folder_src + "/" + folder_interface + "/script.js";
var folder_includes = folder_src + "/includes";
var file_library = folder_includes + "/lib.js";
var file_paintweb = folder_src + "/paintweb.js";
var folder_build = "build";
var file_paintweb_build = folder_build + "/paintweb.dryice.js";
var file_interface_layout = "layout.xhtml";
var jsvar_filecache = "pwlib.fileCache";

function run() {
  var files = [file_library];

  Step(
    function readToolsDir() {
      fs.readdir(folder_tools, this);
    },

    function addTools(err, tools) {
      if (err) {
        throw err;
      }

      tools.forEach(function(tool) {
        if (tool != "." && tool != "..") {
          files.push(folder_tools + "/" + tool);
        }
      });

      return 1;
    },

    function readExtensionsDir(err) {
      if (err) {
        throw err;
      }

      fs.readdir(folder_extensions, this);
    },

    function addExtensions(err, extensions) {
      if (err) {
        throw err;
      }

      extensions.forEach(function(extension) {
        if (extension != "." && extension != "..") {
          files.push(folder_extensions + "/" + extension);
        }
      });

      files.push(file_interface_script, file_paintweb);

      return 1;
    },

    function buildPaintWeb(err) {
      if (err) {
        throw err;
      }

      var build = new dryice.build();
      build.basedir = folder_base;
      build.input_files = files;
      build.output_filters = [filter_addInterfaceLayout, "uglifyjs"];
      build.output_file = file_paintweb_build;

      build.run(this);
    },

    function buildDone(err) {
      if (err) {
        throw err;
      }
      console.log("build completed");
    }
  );
}

function filter_addInterfaceLayout(input) {
  var data = fs.readFileSync(folder_base + "/" + folder_src + "/" +
    folder_interface + "/" + file_interface_layout, "utf8");

  // cleanup the markup, remove indentation, trailing whitespace and comments.
  data = data.replace(/^\s+/gm, "").
              replace(/\s+$/gm, "").
              replace(/<!-- [\x00-\xff]+? -->/g, "");

  data = JSON.stringify(data);

  return input + "\n" + jsvar_filecache + "['" + folder_interface +
    "/" + file_interface_layout + "'] = " + data + ";";
}

run();

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:
