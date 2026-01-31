/* -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*- */
/**
 * CSV Search Provider für GNOME Shell
 *
 * Copyright (c) 2024 Stefan Bäumer
 * Lizenz: GPLv3
 */

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';
import * as Search from 'resource:///org/gnome/shell/ui/search.js';

const SEARCH_DIR = GLib.build_filenamev([GLib.get_home_dir(), '.csv-search-provider']);
const DEFAULT_ICON = GLib.build_filenamev([SEARCH_DIR, 'icon.png']);
let provider = null;

function readCsvFiles() {
    let sessions = [];
    let dir = Gio.file_new_for_path(SEARCH_DIR);
    if (!dir.query_exists(null)) return sessions;

    let enumerator = dir.enumerate_children('standard::name,standard::type', Gio.FileQueryInfoFlags.NONE, null);
    let fileInfo;
    while ((fileInfo = enumerator.next_file(null)) !== null) {
        let name = fileInfo.get_name();
        if (!name.match(/\.(csv|txt)$/i)) continue;
        let filePath = GLib.build_filenamev([SEARCH_DIR, name]);
        try {
            let content = GLib.file_get_contents(filePath)[1].toString();
            let lines = content.split('\n');
            for (let line of lines) {
                if (line.trim() === '') continue;
                let [col1, col2, col3] = line.split('|');
                if (!col1 || !col2) continue;
                sessions.push({
                    display: col1.trim(),
                    url: col2.trim(),
                    icon: col3 ? GLib.build_filenamev([SEARCH_DIR, col3.trim()]) : DEFAULT_ICON
                });
            }
        } catch (e) {
            log(`Fehler beim Lesen von ${filePath}: ${e}`);
        }
    }
    return sessions;
}

var CsvSearchProvider = class {
    constructor() {
        this.id = 'csv-search-provider';
        this._sessions = readCsvFiles();
        this._monitor = Gio.file_new_for_path(SEARCH_DIR)
            .monitor_directory(Gio.FileMonitorFlags.NONE, null);
        this._monitor.connect('changed', () => {
            this._sessions = readCsvFiles();
        });
    }

    getInitialResultSet(terms, cancellable) {
        let results = [];
        let lowerTerms = terms.map(t => t.toLowerCase());
        for (let session of this._sessions) {
            if (lowerTerms.every(term => session.display.toLowerCase().includes(term))) {
                results.push(session);
            }
        }
        return results.map((s, i) => i.toString());
    }

    getResultMetas(ids, cancellable) {
        return ids.map(id => {
            let s = this._sessions[parseInt(id)];
            return {
                id: id,
                name: s.display,
                description: s.url,
                createIcon: size => {
                    let iconPath = Gio.file_new_for_path(s.icon);
                    let icon = St.TextureCache.get_default().load_uri_async(iconPath.get_uri(), size, size);
                    let box = new St.BoxLayout();
                    box.add_child(icon);
                    return box;
                }
            };
        });
    }

    activateResult(id, terms) {
        let s = this._sessions[parseInt(id)];
        if (s && s.url) {
            Util.spawn(['xdg-open', s.url]);
        }
        Main.overview.hide();
    }

    getSubsearchResultSet(results, terms, cancellable) {
        return this.getInitialResultSet(terms, cancellable);
    }
};

export default class CsvSearchProviderExtension {
    enable() {
        if (!provider) {
            provider = new CsvSearchProvider();
            Main.overview.searchController.addProvider(provider);
        }
    }
    disable() {
        if (provider) {
            Main.overview.searchController.removeProvider(provider);
            provider = null;
        }
    }
}