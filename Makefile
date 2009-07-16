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
# $Date: 2009-07-16 18:43:06 +0300 $


#### Config:start #####################################################
# You can make changes below

# The tools you want to have packaged
TOOLS=selection hand rectangle ellipse polygon line text bcurve insertimg pencil cpicker eraser

# The extensions you want
EXTENSIONS=colormixer mousekeys

# The interface you want packaged
INTERFACE=default

# The PHP binary for running PHP scripts
BIN_PHP=php

# The JSON encoder script
BIN_JSON=$(BIN_PHP) scripts/json_encode.php

# The XHTML minifier script
BIN_XHTML=$(BIN_PHP) scripts/xhtml_minify.php

# The compressor used for CSS files
BIN_CSS=scripts/yuicompressor

# The CSS images inliner script
BIN_CSS_IMAGES=$(BIN_PHP) scripts/css_images.php

# The compressor used for JavaScript files
BIN_JS=scripts/yuicompressor

# The jsdoc script
BIN_JSDOC=scripts/jsdoc

# Folders
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

# Changes below this line are not recommended
#### Config:end #######################################################

# This holds the absolute path to the parent of the current working directory.  
# Given /home/robod/src/paintweb this variable will hold /home/robod/src/.
FOLDER_PARENT=$(dir $(CURDIR))

# This holds the name of the current working directory. Given 
# /home/robod/src/paintweb this variable will hold only "paintweb".
FOLDER_SELF=$(subst $(FOLDER_PARENT),,$(CURDIR))

# Package output file
FILE_PAINTWEB=paintweb.js
FILE_PWLIB=$(FOLDER_INCLUDES)/lib.js
FILE_JSONLIB=$(FOLDER_INCLUDES)/json2.js
FILE_CONFIG=config-example.json

# Generate the paths to the tools and extensions
FILES_EXTENSIONS=$(addprefix $(FOLDER_SRC)/$(FOLDER_EXTENSIONS)/, $(addsuffix .js, $(EXTENSIONS)))
FILES_TOOLS=$(addprefix $(FOLDER_SRC)/$(FOLDER_TOOLS)/, $(addsuffix .js, $(TOOLS)))

# Alternatively... include all extensions and tools
#FILES_EXTENSIONS=$(wildcard $(FOLDER_SRC)/$(FOLDER_EXTENSIONS)/*.js)
#FILES_TOOLS=$(wildcard $(FOLDER_SRC)/$(FOLDER_TOOLS)/*.js)

FILES_COLORS=$(wildcard $(FOLDER_SRC)/$(FOLDER_COLORS)/*.json)
FILES_LANG=$(wildcard $(FOLDER_SRC)/$(FOLDER_LANG)/*.json)

FOLDER_INTERFACE=$(FOLDER_INTERFACES)/$(INTERFACE)
INTERFACE_LAYOUT=$(FOLDER_INTERFACE)/layout.xhtml
INTERFACE_SCRIPT=$(FOLDER_INTERFACE)/script.js
INTERFACE_STYLE=$(FOLDER_INTERFACE)/style.css

# Dependencies of the main PaintWeb file
FILE_PAINTWEB_DEPS=$(FOLDER_SRC)/$(FILE_PWLIB) \
							 $(FILES_TOOLS) \
							 $(FILES_EXTENSIONS) \
							 $(FOLDER_SRC)/$(INTERFACE_SCRIPT) \
							 $(FOLDER_SRC)/$(INTERFACE_LAYOUT) \
							 $(FOLDER_SRC)/$(FILE_PAINTWEB)

# Files which only need to be concatenated into the main PaintWeb package
FILE_PAINTWEB_CAT=$(FOLDER_SRC)/$(FILE_PWLIB) \
							 $(FILES_TOOLS) \
							 $(FILES_EXTENSIONS) \
							 $(FOLDER_SRC)/$(INTERFACE_SCRIPT)

JSVAR_fileCache=pwlib.fileCache[

BUILD_VERSION=$(shell sed -rn 's~\s+this.version = ([0-9.]+); //!~\1~p' $(FOLDER_SRC)/$(FILE_PAINTWEB))
BUILD_DATE=$(shell date +'%Y%m%d')

#### Make rules

# The default rule
all: $(FOLDER_BUILD)/$(FILE_PAINTWEB) \
	$(FOLDER_BUILD)/$(FILE_JSONLIB) \
	$(FOLDER_BUILD)/$(INTERFACE_STYLE) \
	$(FOLDER_BUILD)/$(FOLDER_COLORS) \
	$(FOLDER_BUILD)/$(FOLDER_LANG) \
	$(FOLDER_BUILD)/$(FILE_CONFIG) \
	$(FOLDER_TINYMCE_PLUGIN)/editor_plugin.js

# The main PaintWeb script file.
$(FOLDER_BUILD)/$(FILE_PAINTWEB): $(FILE_PAINTWEB_DEPS)
	mkdir -p $(FOLDER_BUILD)
	cat $(FILE_PAINTWEB_CAT) > $(@:.js=.src.js)
	# Add the interface layout.
	echo "$(JSVAR_fileCache)'$(INTERFACE_LAYOUT)'] = " >> $(@:.js=.src.js)
	$(BIN_XHTML) < $(FOLDER_SRC)/$(INTERFACE_LAYOUT) | $(BIN_JSON) >> $(@:.js=.src.js)
	echo ";" >> $(@:.js=.src.js)
	# Add the final script: PaintWeb itself
	sed -e 's~this.build = -1; //!~this.build = $(BUILD_DATE);~1' $(FOLDER_SRC)/$(FILE_PAINTWEB) >> $(@:.js=.src.js)
	$(BIN_JS) $(@:.js=.src.js) > $@

# The color palettes
$(FOLDER_BUILD)/$(FOLDER_COLORS): $(FILES_COLORS)
	mkdir -p $(FOLDER_BUILD)/$(FOLDER_COLORS)
	cp $^ $(FOLDER_BUILD)/$(FOLDER_COLORS)

# The language files
$(FOLDER_BUILD)/$(FOLDER_LANG): $(FILES_LANG)
	mkdir -p $(FOLDER_BUILD)/$(FOLDER_LANG)
	cp $^ $(FOLDER_BUILD)/$(FOLDER_LANG)

# The JSON library file.
$(FOLDER_BUILD)/$(FILE_JSONLIB): $(FOLDER_SRC)/$(FILE_JSONLIB)
	mkdir -p $(FOLDER_BUILD)/$(FOLDER_INCLUDES)
	$(BIN_JS) $^ > $@

# The interface stylesheet.
$(FOLDER_BUILD)/$(INTERFACE_STYLE): $(FOLDER_SRC)/$(INTERFACE_STYLE)
	mkdir -p $(FOLDER_BUILD)/$(FOLDER_INTERFACE)
	$(BIN_CSS) $^ > $^.tmp
	$(BIN_CSS_IMAGES) $^.tmp > $(FOLDER_BUILD)/$(INTERFACE_STYLE)
	rm $^.tmp

# Copy the example configuration file.
$(FOLDER_BUILD)/$(FILE_CONFIG): $(FOLDER_SRC)/$(FILE_CONFIG)
	cp $^ $@

# Compress the TinyMCE plugin.
$(FOLDER_TINYMCE_PLUGIN)/editor_plugin.js: $(FOLDER_TINYMCE_PLUGIN)/editor_plugin_src.js
	$(BIN_JS) $^ > $@

.PHONY : docs release snapshot package tags moodle
docs:
	$(BIN_JSDOC) $(FOLDER_SRC) $(FOLDER_DOCS_API)

release: package
	mv /tmp/paintweb.tar.bz2 ./paintweb-$(BUILD_VERSION).tar.bz2

snapshot: package
	mv /tmp/paintweb.tar.bz2 ./paintweb-$(BUILD_VERSION)-$(BUILD_DATE).tar.bz2

# Create the PaintWeb package.
package:
	tar --exclude=".*" --exclude="*~" --exclude="*bak" --exclude="*bz2" --exclude="tags" \
		-C $(FOLDER_PARENT) -cjvf /tmp/paintweb.tar.bz2 $(FOLDER_SELF)

# Generate the tags file for the project.
tags:
	ctags -R $(FOLDER_SRC) --JavaScript-kinds=fcm --fields=afiklmnsSt

# Generate a custom Moodle build.
moodle: EXTENSIONS=colormixer moodle
moodle: all

# vim:set spell spl=en fo=wan1croql tw=80 ts=2 sw=2 sts=0 sta noet ai cin fenc=utf-8 ff=unix:

