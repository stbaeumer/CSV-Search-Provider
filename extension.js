import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

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

    _getIconNameForContent(content) {
        if (content.includes('PGP MESSAGE')) {
            return 'pgp.png';
        } else if (this._isOtpEntry(content)) {
            return 'otp.png';
        } else if (this._isPassEntry(content)) {
            return 'pass.png';
        } else if (this._isJoplinLink(content)) {
            return 'joplin.png';
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
            
            while ((fileInfo = enumerator.next_file(null)) !== null) {
                const filename = fileInfo.get_name();
                
                if (!filename.endsWith('.csv') && !filename.endsWith('.txt')) {
                    continue;
                }

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
                        
                        if (trimmedLine.startsWith('#')) {
                            continue;
                        }
                        
                        if (trimmedLine.includes('|')) {
                            if (currentEntry && currentEntry.displayText && currentEntry.url) {
                                const iconName = this._getIconNameForContent(currentEntry.url);
                                this._entries.push({
                                    displayText: currentEntry.displayText,
                                    url: currentEntry.url.trim(),
                                    iconName,
                                    filename,
                                });
                            }
                            
                            const parts = trimmedLine.split('|');
                            currentEntry = {
                                displayText: (parts[0] || '').trim(),
                                url: (parts.slice(1).join('|') || '').trim(),
                            };
                        } else if (currentEntry) {
                            currentEntry.url += '\n' + trimmedLine;
                        }
                    }
                    
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
                    this._logError(e, 'load file');
                }
            }

        } catch (e) {
            this._logError(e, 'access data directory');
        }
    }

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

    _spawnCommand(args, flags = Gio.SubprocessFlags.NONE) {
        const launcher = new Gio.SubprocessLauncher({ flags });
        return launcher.spawnv(args);
    }

    _logError(error, message) {
        logError(error, `CSV Search: ${message}`);
    }

    _readFirstLineSync(stream) {
        const dataStream = new Gio.DataInputStream({ base_stream: stream });
        const [line] = dataStream.read_line_utf8(null);
        dataStream.close(null);
        return line;
    }

    _readFirstLineAsync(stream) {
        return new Promise((resolve, reject) => {
            const dataStream = new Gio.DataInputStream({ base_stream: stream });
            dataStream.read_line_async(GLib.PRIORITY_DEFAULT, null, (s, result) => {
                try {
                    const [line] = s.read_line_finish_utf8(result);
                    dataStream.close(null);
                    resolve(line);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

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

    _isJoplinLink(text) {
        return text.trim().startsWith('joplin://');
    }

    _isPassEntry(text) {
        return text.trim() === 'pass';
    }

    _isOtpEntry(text) {
        const value = text.trim();
        return value === 'otp' || value.startsWith('otpauth');
    }

    _copyPassToClipboard(passEntry) {
        try {
            const entryName = passEntry.trim();
            if (!entryName) {
                return;
            }

            const process = this._spawnCommand(
                ['pass', 'show', entryName],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );
            const line = this._readFirstLineSync(process.get_stdout_pipe());
            if (!line) {
                return;
            }

            this._copyToClipboard(line);
        } catch (e) {
            this._logError(e, 'copy pass entry');
        }
    }

    async _copyOtpToClipboard(otpEntry) {
        try {
            const entryName = otpEntry.trim();
            if (!entryName) {
                return;
            }

            const process = this._spawnCommand(
                ['pass', 'otp', entryName],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );
            const line = await this._readFirstLineAsync(process.get_stdout_pipe());
            if (line) {
                this._copyToClipboard(line.trim());
            }
        } catch (e) {
            this._logError(e, 'copy otp');
        }
    }

    _copyToClipboard(text) {
        try {
            const clipboard = St.Clipboard.get_default();
            clipboard.set_text(St.ClipboardType.CLIPBOARD, text);
            
            const title = 'In Zwischenablage kopiert';
            const body = text.length > 50 ? text.substring(0, 50) + '...' : text;
            Main.notify(title, body);
        } catch (e) {
            this._logError(e, 'copy to clipboard');
        }
    }

    _launchUri(uri) {
        try {
            Gio.AppInfo.launch_default_for_uri(uri, null);
            return true;
        } catch (e) {
            try {
                this._spawnCommand(['xdg-open', uri]);
                return true;
            } catch (spawnError) {
                this._logError(spawnError, 'open uri');
                return false;
            }
        }
    }

    _openUrl(url) {
        try {
            this._launchUri(url);
        } catch (e) {
            this._logError(e, 'open url');
        }
    }

    _openEmail(email) {
        try {
            const mailtoUri = email.startsWith('mailto:') ? email : `mailto:${email}`;
            this._launchUri(mailtoUri);
        } catch (e) {
            this._logError(e, 'open email');
        }
    }

    _openShellScript(scriptPath) {
        try {
            const hasKitty = GLib.find_program_in_path('kitty') !== null;
            
            const args = hasKitty
                ? ['kitty', 'bash', '-c', `bash -c '${scriptPath}'; read -p 'Drücke Enter zum Beenden...'`]
                : ['x-terminal-emulator', '-e', 'bash', '-c', `bash -c '${scriptPath}'; read -p 'Drücke Enter zum Beenden...'`];
            
            this._spawnCommand(args);
        } catch (e) {
            this._logError(e, 'open shell script');
        }
    }

    _openJoplinLink(url) {
        try {
            this._launchUri(url.trim());
        } catch (e) {
            this._logError(e, 'open joplin link');
        }
    }

    activateResult(resultId, terms) {
        const index = parseInt(resultId);
        const entry = this._entries[index];
        if (!entry)
            return;

        const content = entry.url;

        if (this._isOtpEntry(content)) {
            this._copyOtpToClipboard(entry.displayText);
        } else if (this._isPassEntry(content)) {
            this._copyPassToClipboard(entry.displayText);
        } else if (this._isJoplinLink(content)) {
            this._openJoplinLink(content);
        } else if (this._isUrl(content)) {
            this._openUrl(content);
        } else if (this._isEmail(content)) {
            this._openEmail(content);
        } else if (this._isShellScript(content)) {
            this._openShellScript(content);
        } else {
            this._copyToClipboard(content);
        }
    }

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