# PaintWeb Makefile
#
# Copyright (c) 2009-2014, Mihai Sucan
# All rights reserved.
# 
# Redistribution and use in source and binary forms, with or without modification,
# are permitted provided that the following conditions are met:
# 
# 1. Redistributions of source code must retain the above copyright notice, this
#    list of conditions and the following disclaimer.
# 
# 2. Redistributions in binary form must reproduce the above copyright notice,
#    this list of conditions and the following disclaimer in the documentation
#    and/or other materials provided with the distribution.
# 
# 3. Neither the name of the copyright holder nor the names of its contributors
#    may be used to endorse or promote products derived from this software without
#    specific prior written permission.
# 
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
# ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
# ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
# ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
# 
# $URL: http://code.google.com/p/paintweb $
# $Date: 2014-01-28 12:30:08 $

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

