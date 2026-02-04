import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Clutter from 'gi://Clutter';
import Meta from 'gi://Meta';

class CsvSearchProvider {
    constructor(extension) {
        this._extension = extension;
        this.id = extension.uuid;
        this._entries = [];
        this._dataDir = extension.path;
    }

    enable() {
        this._loadData();
        Main.overview.searchController.addProvider(this);
    }

    disable() {
        Main.overview.searchController.removeProvider(this);
    }

    //
    // ICON-ZUWEISUNG
    //
    _getIconNameForContent(content) {
        if (content.includes('PGP MESSAGE')) {
            return 'pgp.png';
        } else if (this._isUrl(content)) {
            if (content.toLowerCase().includes('team')) {
                return 'teams.png';
            }
            return 'browser.png';
        } else if (this._isEmail(content)) {
            return 'mail.png';
        } else if (this._isShellScript(content)) {
            return 'shell.png';
        }
        return 'clipboard.png';
    }

    //
    // DATEN LADEN
    //
    async _loadData() {
        this._entries = [];

        const dataDir = Gio.File.new_for_path(this._dataDir);
        
        if (!dataDir.query_exists(null)) {
            return;
        }

        try {
            const enumerator = dataDir.enumerate_children(
                'standard::name,standard::type',
                Gio.FileQueryInfoFlags.NONE,
                null
            );

            let fileInfo;
            let totalFiles = 0;
            
            while ((fileInfo = enumerator.next_file(null)) !== null) {
                const filename = fileInfo.get_name();
                
                if (!filename.endsWith('.csv') && !filename.endsWith('.txt')) {
                    continue;
                }

                totalFiles++;
                const filePath = GLib.build_filenamev([this._dataDir, filename]);
                const file = Gio.File.new_for_path(filePath);

                try {
                    const [, contents] = await new Promise((resolve, reject) => {
                        file.load_contents_async(null, (source, result) => {
                            try {
                                resolve(source.load_contents_finish(result));
                            } catch (e) {
                                reject(e);
                            }
                        });
                    });
                    const text = new TextDecoder().decode(contents);

                    const lines = text.split('\n');

                    let currentEntry = null;
                    
                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        
                        // Kommentare überspringen
                        if (trimmedLine.startsWith('#')) {
                            continue;
                        }
                        
                        // Neue Zeile beginnt, wenn der Delimiter "|" enthalten ist
                        if (trimmedLine.includes('|')) {
                            // Vorherigen Eintrag speichern, falls vorhanden
                            if (currentEntry && currentEntry.displayText && currentEntry.url) {
                                const iconName = this._getIconNameForContent(currentEntry.url);
                                this._entries.push({
                                    displayText: currentEntry.displayText,
                                    url: currentEntry.url.trim(),
                                    iconName,
                                    filename,
                                });
                            }
                            
                            // Neuen Eintrag starten
                            const parts = trimmedLine.split('|');
                            currentEntry = {
                                displayText: (parts[0] || '').trim(),
                                url: (parts.slice(1).join('|') || '').trim(),
                            };
                        } else if (currentEntry) {
                            // Mehrzeiliger Inhalt: zur URL hinzufügen (auch Leerzeilen)
                            currentEntry.url += '\n' + trimmedLine;
                        }
                    }
                    
                    // Letzten Eintrag speichern
                    if (currentEntry && currentEntry.displayText && currentEntry.url) {
                        const iconName = this._getIconNameForContent(currentEntry.url);
                        this._entries.push({
                            displayText: currentEntry.displayText,
                            url: currentEntry.url.trim(),
                            iconName,
                            filename,
                        });
                    }
                } catch (e) {
                    logError(e, `Error loading file ${filename}`);
                }
            }

        } catch (e) {
            logError(e, `Error accessing data directory`);
        }
    }

    //
    // SUCHE
    //
    _matchEntry(entry, query) {
        const q = query.toLowerCase();
        return entry.displayText.toLowerCase().includes(q);
    }

    getInitialResultSet(terms) {
        const query = terms.join(' ').trim();
        if (!query)
            return [];

        const results = [];

        this._entries.forEach((entry, index) => {
            if (this._matchEntry(entry, query))
                results.push(index.toString());
        });

        return results;
    }

    getSubsearchResultSet(previousResults, terms) {
        return this.getInitialResultSet(terms);
    }

    filterResults(results, max) {
        return results.slice(0, max);
    }

    //
    // ICONS
    //
    _getIconForEntry(entry) {
        const iconName = entry.iconName;
        const extensionPath = this._extension.path;
        const iconPath = GLib.build_filenamev([extensionPath, 'icons', iconName]);

        let file = Gio.File.new_for_path(iconPath);
        
        if (file.query_exists(null)) {
            return new Gio.FileIcon({ file });
        }
        
        return null;
    }

    //
    // METADATEN
    //
    getResultMeta(resultId) {
        const index = parseInt(resultId);
        const entry = this._entries[index];

        if (!entry)
            return null;

        return {
            id: resultId,
            name: entry.displayText,
            description: entry.url,
            createIcon: size => {
                const gicon = this._getIconForEntry(entry);
                if (!gicon) {
                    return new St.Icon({
                        icon_name: 'application-x-executable-symbolic',
                        icon_size: size,
                    });
                }
                return new St.Icon({
                    gicon: gicon,
                    icon_size: size,
                });
            },
        };
    }

    async getResultMetas(resultIds, cancellable) {
        const metas = [];
        for (const id of resultIds) {
            const meta = this.getResultMeta(id);
            if (meta)
                metas.push(meta);
        }
        return metas;
    }

    //
    // AKTIONEN
    //
    _isUrl(text) {
        return text.match(/^https?:\/\//i) !== null;
    }

    _isEmail(text) {
        const lines = text.split('\n');
        for (const line of lines) {
            const value = line.trim();
            if (!value) {
                continue;
            }
            if (value.startsWith('mailto:')) {
                const email = value.substring('mailto:'.length).trim();
                if (email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/) !== null) {
                    return true;
                }
            }
            if (value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/) !== null) {
                return true;
            }
        }
        return false;
    }

    _isShellScript(text) {
        return text.endsWith('.sh') || text.includes('.sh ');
    }

    _copyToClipboard(text) {
        try {
            const clipboard = St.Clipboard.get_default();
            clipboard.set_text(St.ClipboardType.CLIPBOARD, text);
            
            // Notification anzeigen
            const title = 'In Zwischenablage kopiert';
            const body = text.length > 50 ? text.substring(0, 50) + '...' : text;
            const notification = new Main.MessageTray.Notification(
                this._extension,
                title,
                body
            );
            Main.messageTray.add(notification);
            notification.showNotification();
        } catch (e) {
            logError(e, 'Error copying to clipboard');
        }
    }

    _openUrl(url) {
        try {
            Gio.AppInfo.launch_default_for_uri(url, null);
        } catch (e) {
            logError(e, `Error opening URL ${url}`);
        }
    }

    _openEmail(email) {
        try {
            // Ensure we have a mailto: URI
            const mailtoUri = email.startsWith('mailto:') ? email : `mailto:${email}`;
            
            // Try default method first
            try {
                Gio.AppInfo.launch_default_for_uri(mailtoUri, null);
                return;
            } catch (e) {
                // Fallback: use xdg-open
                try {
                    const launcher = new Gio.SubprocessLauncher({
                        flags: Gio.SubprocessFlags.NONE
                    });
                    launcher.spawnv(['xdg-open', mailtoUri]);
                } catch (spawnError) {
                    logError(spawnError, `Error opening email with fallback`);
                }
            }
        } catch (e) {
            logError(e, `Error opening email ${email}`);
        }
    }

    _openShellScript(scriptPath) {
        try {
            const launcher = new Gio.SubprocessLauncher({
                flags: Gio.SubprocessFlags.NONE
            });
            
            // Prüfe, ob kitty verfügbar ist
            const hasKitty = GLib.find_program_in_path('kitty') !== null;
            
            const args = hasKitty
                ? ['kitty', 'bash', '-c', `bash -c '${scriptPath}'; read -p 'Drücke Enter zum Beenden...'`]
                : ['x-terminal-emulator', '-e', 'bash', '-c', `bash -c '${scriptPath}'; read -p 'Drücke Enter zum Beenden...'`];
            
            launcher.spawnv(args);
        } catch (e) {
            logError(e, `Error opening shell script ${scriptPath}`);
        }
    }

    activateResult(resultId, terms) {
        const index = parseInt(resultId);
        const entry = this._entries[index];
        if (!entry)
            return;

        const content = entry.url;

        if (this._isUrl(content)) {
            this._openUrl(content);
        } else if (this._isEmail(content)) {
            this._openEmail(content);
        } else if (this._isShellScript(content)) {
            this._openShellScript(content);
        } else {
            this._copyToClipboard(content);
        }
    }

    //
    // PROVIDER-INFOS
    //
    getName() {
        return 'csv-search-provider';
    }

    getProviderType() {
        return 'search-provider';
    }

    getIcon() {
        const defaultIconPath = GLib.build_filenamev([this._dataDir, 'icon.png']);
        const file = Gio.File.new_for_path(defaultIconPath);
        
        if (file.query_exists(null)) {
            return new Gio.FileIcon({ file });
        }
        
        return new Gio.ThemedIcon({ name: 'application-x-executable-symbolic' });
    }
}

export default class CsvSearchProviderExtension extends Extension {
    enable() {        
        this._provider = new CsvSearchProvider(this);
        this._provider.enable();
    }

    disable() {
        if (this._provider) {
            this._provider.disable();
            this._provider = null;
        }
    }
}