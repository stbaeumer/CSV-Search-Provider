import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

class CsvSearchProvider {
    constructor(extension) {
        this._extension = extension;
        this.id = extension.uuid;

        this._entries = [];   // komplette CSV-Daten
    }

    enable() {
        this._loadCsv();
        Main.overview.searchController.addProvider(this);
    }

    disable() {
        Main.overview.searchController.removeProvider(this);
    }

    //
    // CSV LADEN
    //
    _loadCsv() {
        this._entries = [];

        const csvPath = `${this._extension.path}/data/data.csv`;
        const file = Gio.File.new_for_path(csvPath);

        try {
            const [, contents] = file.load_contents(null);
            const text = new TextDecoder().decode(contents);

            const lines = text
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.length > 0 && !l.startsWith('#'));

            for (const line of lines) {
                const parts = line.split(';');

                const name = (parts[0] || '').trim();
                const description = (parts[1] || '').trim();
                const value = (parts[2] || '').trim();
                const col4 = (parts[3] || '').trim();
                const icon = col4;

                const entry = {
                    name,
                    description,
                    value,
                    icon,
                };

                if (entry.name)
                    this._entries.push(entry);
            }
        } catch (e) {
            log(`CSV-Search-Provider: Fehler beim Laden der CSV (${csvPath}): ${e}`);
        }
    }

    //
    // SUCHE
    //
    _matchEntry(entry, query) {
        const q = query.toLowerCase();
        return (
            entry.name.toLowerCase().includes(q) ||
            entry.description.toLowerCase().includes(q) ||
            entry.value.toLowerCase().includes(q)
        );
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
        // Für Einfachheit: neu suchen
        return this.getInitialResultSet(terms);
    }

    filterResults(results, max) {
        return results.slice(0, max);
    }

    //
    // ICONS
    //
    _getIconForEntry(entry) {
        const iconsDir = `${this._extension.path}/icons`;
        const defaultIcon = 'search-icon.svg';

        let iconPath = '';

        if (entry.icon) {
            if (entry.icon.startsWith('/') || entry.icon.startsWith('~'))
                iconPath = entry.icon;
            else
                iconPath = `${iconsDir}/${entry.icon}`;
        }

        if (!iconPath)
            iconPath = `${iconsDir}/${defaultIcon}`;

        let file = Gio.File.new_for_path(iconPath);
        if (!file.query_exists(null)) {
            log(`CSV-Search-Provider: Icon nicht gefunden: ${iconPath}, nutze Default`);
            file = Gio.File.new_for_path(`${iconsDir}/${defaultIcon}`);
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

        // Dynamische Beschreibung
        let subtitle = entry.description;
        if (!subtitle) {
            switch (entry.category) {
                case 'web':
                    subtitle = `Öffne URL: ${entry.value}`;
                    break;
                case 'file':
                    subtitle = `Öffne Datei: ${entry.value}`;
                    break;
                case 'copy':
                    subtitle = `In Zwischenablage kopieren: ${entry.value}`;
                    break;
                case 'exec':
                    subtitle = `Kommando ausführen: ${entry.value}`;
                    break;
                default:
                    subtitle = entry.value;
            }
        }

        return {
            id: resultId,
            name: entry.name,
            description: subtitle,
            createIcon: size => new St.Icon({
                gicon: this._getIconForEntry(entry),
                icon_size: size,
            }),
        };
    }

    getResultMetas(resultIds) {
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
    _openUrl(url) {
        try {
            Gio.AppInfo.launch_default_for_uri(url, null);
        } catch (e) {
            log(`CSV-Search-Provider: Fehler beim Öffnen der URL ${url}: ${e}`);
        }
    }

    _openFile(path) {
        try {
            const file = Gio.File.new_for_path(path);
            const uri = file.get_uri();
            Gio.AppInfo.launch_default_for_uri(uri, null);
        } catch (e) {
            log(`CSV-Search-Provider: Fehler beim Öffnen der Datei ${path}: ${e}`);
        }
    }

    _copyToClipboard(text) {
        const clipboard = St.Clipboard.get_default();
        clipboard.set_text(St.ClipboardType.CLIPBOARD, text);
        Main.notify('CSV Search Provider', 'In Zwischenablage kopiert.');
    }

    _execCommand(cmd) {
        try {
            GLib.spawn_command_line_async(cmd);
        } catch (e) {
            log(`CSV-Search-Provider: Fehler beim Ausführen von ${cmd}: ${e}`);
        }
    }

    activateResult(resultId, terms) {
        const index = parseInt(resultId);
        const entry = this._entries[index];
        if (!entry)
            return;

        const value = entry.value;

        // Wenn Kategorie gesetzt ist, hat sie Vorrang
        switch (entry.category) {
            case 'web':
                this._openUrl(value);
                return;
            case 'file':
                this._openFile(value);
                return;
            case 'copy':
                this._copyToClipboard(value);
                return;
            case 'exec':
                this._execCommand(value);
                return;
        }

        // Fallback: heuristisch
        if (value.startsWith('http://') || value.startsWith('https://')) {
            this._openUrl(value);
        } else if (value.startsWith('/') || value.startsWith('~')) {
            // Datei oder Script
            this._openFile(value);
        } else {
            // Default: kopieren
            this._copyToClipboard(value);
        }
    }

    //
    // PROVIDER-INFOS
    //
    getName() {
        return 'CSV Search Provider';
    }

    getProviderType() {
        // Zeilenweise Darstellung im gemeinsamen Container (wie Einstellungen/Bookmarks)
        return 'list';
    }

    getIcon() {
        // Icon für den Provider selbst (z.B. in Einstellungen)
        const iconPath = `${this._extension.path}/icons/search-icon.svg`;
        const file = Gio.File.new_for_path(iconPath);
        return new Gio.FileIcon({ file });
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
