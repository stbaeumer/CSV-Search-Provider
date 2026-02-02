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
        this._dataDir = GLib.build_filenamev([GLib.get_home_dir(), '.csv-search-provider']);
    }

    enable() {
        this._loadData();
        Main.overview.searchController.addProvider(this);
    }

    disable() {
        Main.overview.searchController.removeProvider(this);
    }

    //
    // DATEN LADEN
    //
    _loadData() {
        this._entries = [];

        log(`[csv-search-provider] Suche nach CSV/TXT-Dateien in ${this._dataDir}`);

        const dataDir = Gio.File.new_for_path(this._dataDir);
        
        if (!dataDir.query_exists(null)) {
            log(`[csv-search-provider] Verzeichnis existiert nicht: ${this._dataDir}`);
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

                    log(`[csv-search-provider] Datei ${filename} gefunden mit ${lines.length} Zeilen`);

                    for (const line of lines) {
                        const parts = line.split('|').map(p => p.trim());

                        const displayText = (parts[0] || '').trim();
                        const url = (parts[1] || '').trim();
                        const iconName = (parts[2] || '').trim();
                        
                        const entry = {
                            displayText,
                            url,
                            iconName,
                            filename,
                        };

                        if (entry.displayText && entry.url) {
                            this._entries.push(entry);
                        }
                    }
                } catch (e) {
                    log(`[csv-search-provider] Fehler beim Laden der Datei ${filename}: ${e}`);
                }
            }

            log(`[csv-search-provider] Insgesamt ${totalFiles} Datei(en) gefunden, ${this._entries.length} Einträge geladen`);
            
        } catch (e) {
            log(`[csv-search-provider] Fehler beim Zugriff auf ${this._dataDir}: ${e}`);
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
        const defaultIconName = 'icon.png';
        const iconName = entry.iconName || defaultIconName;
        const iconPath = GLib.build_filenamev([this._dataDir, iconName]);

        let file = Gio.File.new_for_path(iconPath);
        
        if (!file.query_exists(null)) {
            const defaultPath = GLib.build_filenamev([this._dataDir, defaultIconName]);
            file = Gio.File.new_for_path(defaultPath);
            
            if (!file.query_exists(null)) {
                log(`[csv-search-provider] Icon nicht gefunden: ${iconPath} und fallback ${defaultPath}`);
                return null;
            }
            log(`[csv-search-provider] Icon nicht gefunden: ${iconPath}, nutze Fallback ${defaultPath}`);
        }

        return new Gio.FileIcon({ file });
    }

    //
    // METADATEN
    //
    getResultMeta(resultId) {
        const index = parseInt(resultId);
        const entry = this._entries[index];

        if (!entry)
            return null;

        log(`[csv-search-provider] Metadaten für Ergebnis ${resultId}: ${entry.displayText}`);

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
        return text.endsWith('.sh');
    }

    _copyToClipboard(text) {
        try {
            const clipboard = St.Clipboard.get_default();
            clipboard.set_text(St.ClipboardType.CLIPBOARD, text);
            log(`[csv-search-provider] In Zwischenablage kopiert: ${text}`);
            
            // Benachrichtigung anzeigen
            Main.notify('CSV Search Provider', `In Zwischenablage kopiert: ${text}`);
        } catch (e) {
            log(`[csv-search-provider] Fehler beim Kopieren in Zwischenablage: ${e}`);
        }
    }

    _openUrl(url) {
        try {
            Gio.AppInfo.launch_default_for_uri(url, null);
            log(`[csv-search-provider] URL geöffnet: ${url}`);
        } catch (e) {
            log(`[csv-search-provider] Fehler beim Öffnen der URL ${url}: ${e}`);
        }
    }

    _openEmail(email) {
        try {
            // Stelle sicher, dass wir eine mailto:-URI haben
            const mailtoUri = email.startsWith('mailto:') ? email : `mailto:${email}`;
            
            // Versuche zuerst die Standard-Methode
            try {
                Gio.AppInfo.launch_default_for_uri(mailtoUri, null);
                log(`[csv-search-provider] E-Mail geöffnet: ${email}`);
                return;
            } catch (e) {
                log(`[csv-search-provider] Standard-Methode fehlgeschlagen, versuche xdg-open: ${e}`);
            }
            
            // Fallback: xdg-open verwenden
            GLib.spawn_async(
                null,
                ['xdg-open', mailtoUri],
                null,
                GLib.SpawnFlags.SEARCH_PATH,
                null
            );
            log(`[csv-search-provider] E-Mail mit xdg-open geöffnet: ${email}`);
        } catch (e) {
            log(`[csv-search-provider] Fehler beim Öffnen der E-Mail ${email}: ${e}`);
        }
    }

    _openShellScript(scriptPath) {
        try {
            const appInfo = Gio.AppInfo.create_from_commandline(
                `kitty bash -c "bash '${scriptPath}'; read -p 'Drücke Enter zum Beenden...';"`,
                'kitty',
                Gio.AppInfoCreateFlags.NONE
            );
            appInfo.launch([], null);
            log(`[csv-search-provider] Shell-Script in kitty geöffnet: ${scriptPath}`);
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
        log('[csv-search-provider] Aktiviert');
    }

    disable() {
        if (this._provider) {
            this._provider.disable();
            this._provider = null;
            log('[csv-search-provider] Deaktiviert');
        }
    }
}