#! /usr/bin/env node
/*
 * Copyright (C) 2011 Mihai Şucan
 *
 * This file is part of PaintWeb.
 *
 * PaintWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * PaintWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with PaintWeb.  If not, see <http://www.gnu.org/licenses/>.
 *
 * $URL: http://code.google.com/p/paintweb $
 * $Date: 2011-01-05 14:47:37 $
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
