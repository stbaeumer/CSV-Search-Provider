/* -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*- */
/**
 * CSV Search Provider for GNOME Shell (Downloads CSV)
 *
 * Copyright (c) 2026 Stefan Bäumer <baeumer@posteo.de>
 *
 * Lizenz: GPLv3
 */

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';
import * as Search from 'resource:///org/gnome/shell/ui/search.js';

let csvApp = null;

const emblems = {
    'NX': ['remmina-nx', 'org.remmina.Remmina-nx'],
    'RDP': ['remmina-rdp', 'org.remmina.Remmina-rdp'],
    'SFTP': ['remmina-sftp', 'org.remmina.Remmina-sftp'],
    'SPICE': ['remmina-spice', 'org.remmina.Remmina-spice'],
    'SSH': ['remmina-ssh', 'org.remmina.Remmina-ssh', 'gnome-terminal', 'org.gnome.Terminal', 'x-term'],
    'VNC': ['remmina-vnc', 'org.remmina.Remmina-vnc'],
    'XDMCP': ['remmina-xdmcp', 'org.remmina.Remmina-xdmcp']
};

let provider = null;

var CsvSearchProvider = class CsvSearchProvider_SearchProvider {
    constructor() {
        log("[CSV] Initializing CSV Search Provider");

        this.theme = new St.IconTheme();
        this._sessions = [];
        this._csvMonitors = [];

        // Download-Ordner des Users
        const downloadsDir = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOWNLOAD);
        if (!downloadsDir) {
            log("[CSV] Download-Verzeichnis konnte nicht ermittelt werden.");
            return;
        }
        log("[CSV] Monitoring CSV directory: " + downloadsDir);
        this._monitorCsvDir(downloadsDir);
    }

    _monitorCsvDir(path) {
        let dir = Gio.file_new_for_path(path);
        let monitor = dir.monitor_directory(Gio.FileMonitorFlags.NONE, null);
        monitor.connect('changed', (monitor, file, other_file, type) => {
            this._onMonitorChanged(monitor, file, other_file, type);
        });
        this._csvMonitors.push(monitor);

        // Initial alle Dateien einlesen
        this._listDirAsync(dir, (files) => {
            files.forEach((f) => {
                let name = f.get_name();
                if (name.toLowerCase().endsWith('.csv')) {
                    log(`[CSV][DEBUG] Initial load CSV: ${name}`);
                    let file_path = GLib.build_filenamev([path, name]);
                    let file = Gio.file_new_for_path(file_path);
                    this._parseCsvFile(file);
                }
            });
        });
    }

    _onMonitorChanged(monitor, file, other_file, type) {
        let path = file.get_path();
        if (type === Gio.FileMonitorEvent.CREATED || 
            type === Gio.FileMonitorEvent.CHANGED || 
            type === Gio.FileMonitorEvent.CHANGES_DONE_HINT) {
            if (path.toLowerCase().endsWith('.csv')) {
                log(`[CSV][DEBUG] CSV geändert/neu: ${path}`);
                this._parseCsvFile(file);
            }
        } else if (type === Gio.FileMonitorEvent.DELETED) {
            this._sessions = this._sessions.filter(s => s.file !== path);
            log(`[CSV][DEBUG] CSV gelöscht: ${path}`);
        }
    }

    _parseCsvFile(file) {
        let path = file.get_path();
        try {
            let [ok, contents] = file.load_contents(null);
            if (!ok) return;

            let text = imports.byteArray.toString(contents);
            let lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
            log(`[CSV][DEBUG] Datei gefunden: ${path}, Zeilen: ${lines.length}`);

            let newSessions = [];

            lines.forEach((line, index) => {
                // Trenne Spalten: | oder ; und evtl. in ""
                let parts = line.match(/(".*?"|[^|;]+)(?=\||;|$)/g);
                if (!parts || parts.length < 3) return;

                let name = parts[0].replace(/^"|"$/g, '').trim();
                let url = parts[1].replace(/^"|"$/g, '').trim();
                let iconKey = parts[2].replace(/^"|"$/g, '').trim();
                if (!emblems[iconKey]) iconKey = Object.keys(emblems)[0];

                let sessionId = `${path}:${index}`;
                newSessions.push({ id: sessionId, name, url, iconKey, file: path });

                log(`[CSV][DEBUG] Zeile ${index}: '${name}' -> '${url}', icon='${iconKey}'`);
            });

            // Alte Zeilen der gleichen Datei entfernen, neue hinzufügen
            this._sessions = this._sessions.filter(s => s.file !== path);
            this._sessions.push(...newSessions);

        } catch (e) {
            log("[CSV][DEBUG] Fehler beim Lesen der CSV: " + path + " : " + e.toString());
        }
    }

    _listDirAsync(file, callback) {
        let allFiles = [];
        file.enumerate_children_async('standard::name,standard::type',
                                      Gio.FileQueryInfoFlags.NONE,
                                      GLib.PRIORITY_LOW, null,
                                      function (obj, res) {
                                          let enumerator = obj.enumerate_children_finish(res);
                                          function onNextFileComplete(obj, res) {
                                              let files = obj.next_files_finish(res);
                                              if (files.length) {
                                                  allFiles = allFiles.concat(files);
                                                  enumerator.next_files_async(100, GLib.PRIORITY_LOW, null, onNextFileComplete);
                                              } else {
                                                  enumerator.close(null);
                                                  callback(allFiles);
                                              }
                                          }
                                          enumerator.next_files_async(100, GLib.PRIORITY_LOW, null, onNextFileComplete);
                                      });
    }

    createResultObject(metaInfo, terms) {
        metaInfo.createIcon = (size) => {
            let box = new St.BoxLayout();
            let names = emblems[metaInfo.iconKey] || emblems[Object.keys(emblems)[0]];
            let name = names[0];
            let emblem = new St.Icon({ gicon: new Gio.ThemedIcon({name: name}), icon_size: 22 });
            box.add_child(emblem);
            return box;
        };
        return new Search.GridSearchResult(provider, metaInfo, Main.overview.searchController._searchResults);
    }

    filterResults(results, max) {
        return results.slice(0, max);
    }

    async getResultMetas(ids, cancellable) {
        let metas = [];
        for (let id of ids) {
            let session = this._sessions.find(s => s.id === id);
            if (session) {
                metas.push({ id: session.id, name: session.name, description: session.url, iconKey: session.iconKey });
            }
        }
        return metas;
    }

    activateResult(id, terms) {
        let session = this._sessions.find(s => s.id === id);
        if (session) {
            log("[CSV][DEBUG] Öffne Treffer: " + session.name + " -> " + session.url);
            Util.spawn(['xdg-open', session.url]);
        }
        Main.overview.hide();
    }

    _getResultSet(sessions, terms, cancellable) {
        let results = [];
        let regexes = terms.map(t => new RegExp(t, 'i'));
        for (let s of sessions) {
            if (regexes.every(r => r.test(s.name))) {
                results.push(s.id);
            }
        }
        return results;
    }

    async getInitialResultSet(terms, cancellable) {
        return this._getResultSet(this._sessions, terms, cancellable);
    }

    async getSubsearchResultSet(results, terms, cancellable) {
        return this.getInitialResultSet(terms, cancellable);
    }
};

export default class CsvSearchProviderExtension {
    enable() {
        log("[CSV] Enabling CSV Search Provider Extension");

        if (!provider) {
            provider = new CsvSearchProvider();
            Main.overview.searchController.addProvider(provider);
        }
    }

    disable() {
        if (provider) {
            Main.overview.searchController.removeProvider(provider);
            provider._csvMonitors.forEach(m => m.cancel());
            provider = null;
        }
    }
}
