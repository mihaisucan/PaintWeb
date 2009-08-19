/*
 * Copyright (C) 2009 Mihai Şucan
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
 * $Date: 2009-08-19 20:09:54 +0300 $
 */

/**
 * @author <a lang="ro" href="http://www.robodesign.ro/mihai">Mihai Şucan</a>
 * @fileOverview This script allows the user to create a new image to edit 
 * inside PaintWeb, directly from TinyMCE.
 */

tinyMCEPopup.requireLangPack();

tinyMCEPopup.onInit.add(function() {
  var newImageForm = document.getElementById('newimageform'),
      imgWidth     = document.getElementById('imgWidth'),
      imgHeight    = document.getElementById('imgHeight'),
      imgBgrColor  = document.getElementById('imgBgrColor'),
      imgTitle     = document.getElementById('imgTitle'),
      altText      = document.getElementById('altText'),
      btnCancel    = document.getElementById('cancel');

  newImageForm.onsubmit = function (ev) {
    var fn = tinyMCEPopup.getWindowArg('newImageFn');

    if (fn) {
      fn(imgWidth.value, imgHeight.value, imgBgrColor.value, altText.value, 
        imgTitle.value);
    }

    tinyMCEPopup.close();
  };

  imgBgrColor.parentNode.lastChild.innerHTML 
    = ' ' + getColorPickerHTML('imgBgrColor_pick',
    'imgBgrColor');

  imgBgrColor.onchange = function () { updateColor('imgBgrColor_pick', 
      'imgBgrColor'); };

  updateColor('imgBgrColor_pick', 'imgBgrColor');

  btnCancel.onclick = function () { tinyMCEPopup.close(); };
});

// vim:set spell spl=en fo=wan1croqlt tw=80 ts=2 sw=2 sts=2 sta et ai cin fenc=utf-8 ff=unix:
