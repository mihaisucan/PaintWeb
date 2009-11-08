# PaintWeb Makefile
#
# Copyright (C) 2008, 2009 Mihai Şucan
# 
# This file is part of PaintWeb.
# 
# PaintWeb is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# PaintWeb is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with PaintWeb.  If not, see <http://www.gnu.org/licenses/>.
# 
# $URL: http://code.google.com/p/paintweb $
# $Date: 2009-11-07 14:31:42 +0200 $

# The tools you want to have packaged
TOOLS=bcurve cbucket cpicker ellipse eraser hand insertimg line pencil polygon rectangle selection text

# The extensions you want.
EXTENSIONS=colormixer mousekeys

# The interface you want packaged.
INTERFACE=default

# The PHP binary for running PHP scripts.
# Make sure that the php binary is in the global $PATH, or else please point to 
# the location of your php binary.
BIN_PHP=php

# Make sure you have the YUI Compressor package available. Update this path to 
# point to the location of your package.
export FOLDER_YUIC=$(HOME)/src/yuicompressor

# Make sure you have the jsdoc-toolkit package available. Update this path to 
# point to the location of your package.
export FOLDER_JSDOCT=$(HOME)/src/jsdoc-toolkit

# The JSON encoder script.
BIN_JSON=$(BIN_PHP) scripts/json_encode.php

# The XHTML minifier script.
BIN_XHTML=$(BIN_PHP) scripts/xhtml_minify.php

# The script used for compressing/minifying CSS files.
# Note that the scripts/yuicompressor script is a wrapper for YUI Compressor.
BIN_CSS=scripts/yuicompressor

# The CSS images inliner script.
BIN_CSS_IMAGES=$(BIN_PHP) scripts/css_images.php

# The script used for compressing/minifying JavaScript files
BIN_JS=scripts/yuicompressor

# The script used for generating the JavaScript documentation / the API 
# reference based on the source code. Note that the scripts/jsdoc script is 
# a wrapper for jsdoc-toolkit.
BIN_JSDOC=scripts/jsdoc

# PaintWeb folders.
# Generally, you don't have to change these.
FOLDER_BUILD=build
FOLDER_SRC=src
FOLDER_INCLUDES=includes
FOLDER_TOOLS=tools
FOLDER_EXTENSIONS=extensions
FOLDER_INTERFACES=interfaces
FOLDER_LANG=lang
FOLDER_COLORS=colors
FOLDER_DOCS_API=docs/api-ref
FOLDER_TINYMCE_PLUGIN=ext/tinymce-plugin/paintweb


# vim:set spell spl=en fo=wan1croql tw=80 ts=2 sw=2 sts=0 sta noet ai cin fenc=utf-8 ff=unix:

