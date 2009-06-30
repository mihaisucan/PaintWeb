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
# $Date: 2009-06-30 23:00:23 +0300 $


#### Config:start #####################################################
# You can make changes below

# The tools you want to have packaged
TOOLS=selection hand rectangle ellipse polygon line text bcurve insertimg pencil cpicker eraser

# The extensions you want
EXTENSIONS=colormixer mousekeys

# The interface you want packaged
INTERFACE=default

# The JSON encoder script
BIN_JSON=scripts/json_encode.php

# The XHTML minifier script
BIN_XHTML=scripts/xhtml_minify.php

# The CSS images inliner script
BIN_CSS_IMAGES=scripts/css_images.php

# The compressor used for JavaScript files
BIN_JS=scripts/yuicompressor

# The compressor used for CSS files
BIN_CSS=scripts/yuicompressor

# Folders
FOLDER_BUILD=build
FOLDER_SRC=src
FOLDER_INCLUDES=includes
FOLDER_TOOLS=tools
FOLDER_EXTENSIONS=extensions
FOLDER_INTERFACES=interfaces
FOLDER_LANG=lang
FOLDER_COLORS=colors

# Changes below this line are not recommended
#### Config:end #######################################################

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

#### Make rules

# The default rule
all: $(FOLDER_BUILD)/$(FILE_PAINTWEB) \
	$(FOLDER_BUILD)/$(FILE_JSONLIB) \
	$(FOLDER_BUILD)/$(FOLDER_INTERFACE) \
	$(FOLDER_BUILD)/$(FOLDER_COLORS) \
	$(FOLDER_BUILD)/$(FOLDER_LANG) \
	$(FOLDER_BUILD)/$(FILE_CONFIG)

# The main PaintWeb script file.
$(FOLDER_BUILD)/$(FILE_PAINTWEB): $(FILE_PAINTWEB_DEPS)
	mkdir -p $(FOLDER_BUILD)
	cat $(FILE_PAINTWEB_CAT) > $(@:.js=.src.js)
	# Add the interface layout.
	echo "$(JSVAR_fileCache)'$(INTERFACE_LAYOUT)']=" >> $(@:.js=.src.js)
	$(BIN_XHTML) < $(FOLDER_SRC)/$(INTERFACE_LAYOUT) | $(BIN_JSON) >> $(@:.js=.src.js)
	echo ";" >> $(@:.js=.src.js)
	# Add the final script: PaintWeb itself
	cat $(FOLDER_SRC)/$(FILE_PAINTWEB) >> $(@:.js=.src.js)
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

# The interface folder: just minify the CSS
$(FOLDER_BUILD)/$(FOLDER_INTERFACE): $(FOLDER_SRC)/$(INTERFACE_STYLE)
	mkdir -p $@
	$(BIN_CSS) $^ > $^.tmp
	$(BIN_CSS_IMAGES) $^.tmp > $(FOLDER_BUILD)/$(INTERFACE_STYLE)
	rm $^.tmp

# Copy the example configuration file
$(FOLDER_BUILD)/$(FILE_CONFIG): $(FOLDER_SRC)/$(FILE_CONFIG)
	cp $^ $@


.PHONY : clean
clean:
	rm $(FILE_PAINTWEB:.js=.src.js)


# vim:set spell spl=en fo=wan1croql tw=80 ts=2 sw=2 sts=0 sta noet ai cin fenc=utf-8 ff=unix:

