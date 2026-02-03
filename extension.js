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
        if (this._isUrl(content)) {
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
    _loadData() {
        this._entries = [];

        log(`[csv-search-provider] Searching for CSV/TXT files in ${this._dataDir}`);

        const dataDir = Gio.File.new_for_path(this._dataDir);
        
        if (!dataDir.query_exists(null)) {
            log(`[csv-search-provider] Directory does not exist: ${this._dataDir}`);
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
                    const [, contents] = file.load_contents(null);
                    const text = new TextDecoder().decode(contents);

                    const lines = text
                        .split('\n')
                        .map(l => l.trim())
                        .filter(l => l.length > 0 && !l.startsWith('#'));

                    log(`[csv-search-provider] File ${filename} found with ${lines.length} lines`);

                    for (const line of lines) {
                        const parts = line.split('|').map(p => p.trim());

                        const displayText = (parts[0] || '').trim();
                        const url = (parts[1] || '').trim();
                        
                        if (!displayText || !url) {
                            continue;
                        }
                        
                        // Icon automatisch basierend auf Inhaltstyp zuweisen
                        const iconName = this._getIconNameForContent(url);
                        
                        const entry = {
                            displayText,
                            url,
                            iconName,
                            filename,
                        };

                        this._entries.push(entry);
                    }
                } catch (e) {
                    log(`[csv-search-provider] Error loading file ${filename}: ${e}`);
                }
            }

            log(`[csv-search-provider] Total ${totalFiles} file(s) found, ${this._entries.length} entries loaded`);
            
        } catch (e) {
            log(`[csv-search-provider] Error accessing ${this._dataDir}: ${e}`);
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
        
        log(`[csv-search-provider] Icon not found: ${iconPath}`);
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

        log(`[csv-search-provider] Metadata for result ${resultId}: ${entry.displayText}`);

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
        return text.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/) !== null;
    }

    _isShellScript(text) {
        return text.endsWith('.sh') || text.includes('.sh ');
    }

    _copyToClipboard(text) {
        try {
            const clipboard = St.Clipboard.get_default();
            clipboard.set_text(St.ClipboardType.CLIPBOARD, text);
            log(`[csv-search-provider] Copied to clipboard: ${text}`);
            
            // Show notification
            Main.notify('CSV Search Provider', `Copied to clipboard: ${text}`);
        } catch (e) {
            log(`[csv-search-provider] Error copying to clipboard: ${e}`);
        }
    }

    _openUrl(url) {
        try {
            Gio.AppInfo.launch_default_for_uri(url, null);
            log(`[csv-search-provider] URL opened: ${url}`);
        } catch (e) {
            log(`[csv-search-provider] Error opening URL ${url}: ${e}`);
        }
    }

    _openEmail(email) {
        try {
            // Ensure we have a mailto: URI
            const mailtoUri = email.startsWith('mailto:') ? email : `mailto:${email}`;
            
            // Try default method first
            try {
                Gio.AppInfo.launch_default_for_uri(mailtoUri, null);
                log(`[csv-search-provider] Email opened: ${email}`);
                return;
            } catch (e) {
                log(`[csv-search-provider] Default method failed, trying xdg-open: ${e}`);
            }
            
            // Fallback: use xdg-open
            GLib.spawn_async(
                null,
                ['xdg-open', mailtoUri],
                null,
                GLib.SpawnFlags.SEARCH_PATH,
                null
            );
            log(`[csv-search-provider] Email opened with xdg-open: ${email}`);
        } catch (e) {
            log(`[csv-search-provider] Error opening email ${email}: ${e}`);
        }
    }

    _openShellScript(scriptPath) {
        try {
            const escapedPath = scriptPath.replace(/'/g, "'\\''" );
            
            // Prüfe, ob kitty verfügbar ist
            let terminalCommand = null;
            try {
                GLib.spawn_command_line_sync('which kitty');
                // kitty ist verfügbar
                terminalCommand = `kitty bash -c "bash -c '${escapedPath}'; read -p 'Drücke Enter zum Beenden...';"`;
                log(`[csv-search-provider] Verwende kitty für Shell-Script`);
            } catch (e) {
                // kitty nicht verfügbar, verwende Standard-Terminal
                terminalCommand = `x-terminal-emulator -e bash -c "bash -c '${escapedPath}'; read -p 'Drücke Enter zum Beenden...';"`;
                log(`[csv-search-provider] kitty nicht gefunden, verwende Standard-Terminal`);
            }
            
            const appInfo = Gio.AppInfo.create_from_commandline(
                terminalCommand,
                'Terminal',
                Gio.AppInfoCreateFlags.NONE
            );
            appInfo.launch([], null);
            log(`[csv-search-provider] Shell-Script geöffnet: ${scriptPath}`);
        } catch (e) {
            log(`[csv-search-provider] Fehler beim Öffnen des Shell-Scripts ${scriptPath}: ${e}`);
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
        log('[csv-search-provider] Enabled');
    }

    disable() {
        if (this._provider) {
            this._provider.disable();
            this._provider = null;
            log('[csv-search-provider] Disabled');
        }
    }
}