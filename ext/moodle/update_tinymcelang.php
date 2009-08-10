<?php
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
 * $Date: 2009-08-10 21:12:30 +0300 $
 */

// This script allows you to update the TinyMCE language files from Moodle to 
// hold the new strings of the TinyMCE plugin provided by PaintWeb.

// In a typical setup, Moodle holds PaintWeb in lib/paintweb.

// If you execute this script without any arguments, all the language files 
// found in the TinyMCE plugin folder will be converted to the Moodle PHP 
// language file format. The new strings will be appended to the 
// editor_tinymce.php file from the Moodle languages folder.
//
// Optionally, you can give this script one argument, to tell it which language 
// you want to update. This allows you to update only one language file, instead 
// of all at once.

// This script works only with Moodle 2.0.

$pluginlangdir = '../tinymce-plugin/paintweb/langs';
$moodlelangdir = '../../../../lang';
$tinymcelangfile = 'editor_tinymce.php';

if (!is_dir($pluginlangdir)) {
    echo "The TinyMCE plugin folder could not be found: $paintweblangdir\n";
    return 1;
}

if (!is_dir($moodlelangdir)) {
    echo "The Moodle folder could not be found: $moodlelangdir\n";
    return 1;
}

if (isset($_SERVER['argv'][1])) {
    $file = $_SERVER['argv'][1] . '.js';

    if (!file_exists($pluginlangdir . '/' . $file)) {
        echo "The TinyMCE plugin language file was not found: $pluginlangdir/$file\n";
        return 1;
    }

    if (!paintweb_update_tinymcelang($file)) {
        return 0;
    } else {
        return 1;
    }
}

$files = glob($pluginlangdir . '/*.js');
foreach ($files as $file) {
    echo "Reading $file.\n";
    paintweb_update_tinymcelang($file);
}

/**
 * Update a TinyMCE language file from the Moodle language folder 
 * (editor_tinymce.php) to include the language strings from the TinyMCE plugin 
 * provided by PaintWeb (see ext/tinymce-plugin/paintweb/langs).
 *
 * @param string $file The TinyMCE plugin language file (for example en.js) you 
 * want to read in order to update the associated editor_tinymce.php file from 
 * the Moodle language folder.
 *
 * @return boolean True if the operation was successful or false otherwise.
 */
function paintweb_update_tinymcelang($file) {
    global $moodlelangdir, $tinymcelangfile, $pluginlangdir;

    if (empty($file)) {
        return false;
    }

    $file = basename($file);
    $lang = substr($file, 0, 2);

    $content = file_get_contents($pluginlangdir . '/' . $file);
    if (empty($content)) {
        echo "Failed to read $pluginlangdir/$file\n";
        return false;
    }

    if ($lang === 'en') {
        $filephp = "$moodlelangdir/en_utf8/$tinymcelangfile";
    } else {
        $filephp = "$moodlelangdir/$lang/$tinymcelangfile";
    }

    if (!file_exists($filephp)) {
        echo "Skipping $lang. File not found: $filephp\n";
        return false;
    }

    $output = file_get_contents($filephp);
    if (empty($output)) {
        echo "Failed to read $filephp\n";
        return false;
    }
    include($filephp);

    $group = '';
    $content = explode("\n", $content);
    $json = '';
    foreach ($content as $line) {
        $matches = array();

        if (empty($line)) {
            continue;
        }

        if (preg_match('/tinymce\.addi18n\s*\([\'"][a-z]+\.([^\']+)[\'"]\s*,\s*\{/i', $line, $matches)) {
            $group = $matches[1];

        } else if (!empty($group) && preg_match('/}\s*\)\s*;*/', $line)) {
            $group = '';

        } else if (!empty($group) && preg_match('/^\s*([\'"]*)(.+?)\1\s*:\s*([\'"])(.+?)\3\s*,?/', $line, $matches)) {
            $json .= ',"' . $group . ':' . $matches[2] .'": "' . $matches[4] . "\"";
        }
    }

    if (empty($json)) {
        echo "No string was found in the language file $pluginlangdir/$file\n";
        return false;
    }

    $json = json_decode('{' . substr($json, 1) . '}');

    if (empty($json)) {
        echo "Failed to parse the language file $pluginlangdir/$file\n";
        return false;
    }

    foreach ($json as $key => $val) {
        $key2 = var_export($key, true);
        $val = var_export($val, true);
        $line = "\$string[$key2] = $val;\n";

        if (isset($string[$key])) {
            $output = preg_replace('/^\$string[' . $key2 . '].+$/', $line, $output);
        } else {
            $output .= $line;
        }
    }

    if (file_put_contents($filephp, $output)) {
        echo "Updated $filephp.\n";
        return true;
    } else {
        echo "Failed to update $filephp.\n";
        return false;
    }
}

// vim:set spell spl=en fo=tanqrowcb tw=80 ts=4 sw=4 sts=4 sta et noai nocin fenc=utf-8 ff=unix: 

