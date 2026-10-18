import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const CLIPBOARD_CLEAR_SECONDS = 20;

class CsvSearchProvider {
    constructor(extension) {
        this._extension = extension;
        this.id = extension.uuid;
        this._entries = [];
        this._dataDir = extension.path;
        this._clipboardTimeoutId = 0;
    }

    enable() {
        this._loadPromise = this._loadData();
        Main.overview.searchController.addProvider(this);
    }

    disable() {
        Main.overview.searchController.removeProvider(this);

        if (this._clipboardTimeoutId) {
            GLib.Source.remove(this._clipboardTimeoutId);
            this._clipboardTimeoutId = 0;
        }
    }

    _getIconNameForContent(content) {
        switch (true) {
            case content.includes('PGP MESSAGE'):
                return 'pgp.png';

            case this._isOtpEntry(content):
                return 'otp.png';

            case this._isPassEntry(content):
                return 'pass.png';

            case this._isJoplinLink(content):
                return 'joplin.png';

            case this._isUrl(content):
                return content.toLowerCase().includes('team')
                    ? 'teams.png'
                    : 'browser.png';

            case this._isEmail(content):
                return 'mail.png';

            case this._isShellScript(content):
                return 'shell.png';

            default:
                return 'clipboard.png';
        }
    }

    async _loadData() {
        this._entries = [];

        const dataDirs = [
            this._dataDir,
            GLib.build_filenamev([
                GLib.get_user_config_dir(),
                'csv-search-provider',
            ]),
        ];

        for (const dataDirPath of dataDirs) {
            const dataDir = Gio.File.new_for_path(dataDirPath);

            if (!dataDir.query_exists(null))
                continue;

            let enumerator;

            try {
                enumerator = dataDir.enumerate_children(
                    'standard::name,standard::type',
                    Gio.FileQueryInfoFlags.NONE,
                    null
                );

                let fileInfo;

                while ((fileInfo = enumerator.next_file(null)) !== null) {
                    const filename = fileInfo.get_name();

                    if (!filename.endsWith('.csv') &&
                        !filename.endsWith('.txt')) {
                        continue;
                    }

                    const filePath = GLib.build_filenamev([
                        dataDirPath,
                        filename,
                    ]);

                    const file = Gio.File.new_for_path(filePath);

                    try {
                        const [, contents] = await new Promise(
                            (resolve, reject) => {
                                file.load_contents_async(
                                    null,
                                    (source, result) => {
                                        try {
                                            resolve(
                                                source.load_contents_finish(
                                                    result
                                                )
                                            );
                                        } catch (error) {
                                            reject(error);
                                        }
                                    }
                                );
                            }
                        );

                        this._parseDataFile(
                            new TextDecoder().decode(contents)
                        );
                    } catch (error) {
                        this._logError(error, `load file ${filename}`);
                    }
                }
            } catch (error) {
                this._logError(
                    error,
                    `access data directory ${dataDirPath}`
                );
            } finally {
                if (enumerator) {
                    try {
                        enumerator.close(null);
                    } catch (error) {
                        this._logError(
                            error,
                            `close data directory ${dataDirPath}`
                        );
                    }
                }
            }
        }
    }

    _parseDataFile(text) {
        const lines = text.split(/\r?\n/);

        if (lines.at(-1) === '')
            lines.pop();

        let currentEntry = null;

        const addCurrentEntry = () => {
            if (!currentEntry ||
                !currentEntry.displayText ||
                !currentEntry.url) {
                return;
            }

            this._entries.push({
                displayText: currentEntry.displayText,
                url: currentEntry.url,
                iconName: this._getIconNameForContent(
                    currentEntry.url
                ),
            });
        };

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('#'))
                continue;

            const separatorIndex = trimmedLine.indexOf('|');

            if (separatorIndex !== -1) {
                addCurrentEntry();

                currentEntry = {
                    displayText: trimmedLine
                        .slice(0, separatorIndex)
                        .trim(),

                    url: trimmedLine
                        .slice(separatorIndex + 1)
                        .trim(),
                };
            } else if (currentEntry) {
                currentEntry.url += `\n${line}`;
            }
        }

        addCurrentEntry();
    }

    _matchEntry(entry, query) {
        return entry.displayText
            .toLowerCase()
            .includes(query.toLowerCase());
    }

    async getInitialResultSet(terms) {
        await this._loadPromise;

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

    getSubsearchResultSet(_previousResults, terms) {
        return this.getInitialResultSet(terms);
    }

    filterResults(results, max) {
        return results.slice(0, max);
    }

    _getIconForEntry(entry) {
        const iconPath = GLib.build_filenamev([
            this._extension.path,
            'icons',
            entry.iconName,
        ]);

        const file = Gio.File.new_for_path(iconPath);

        if (!file.query_exists(null))
            return null;

        return new Gio.FileIcon({ file });
    }

    getResultMeta(resultId) {
        const index = Number.parseInt(resultId, 10);
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
                    gicon,
                    icon_size: size,
                });
            },
        };
    }

    async getResultMetas(resultIds) {
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

    async _runCommand(args) {
        const process = this._spawnCommand(
            args,
            Gio.SubprocessFlags.STDOUT_PIPE |
            Gio.SubprocessFlags.STDERR_PIPE
        );

        const [, stdout, stderr] = await new Promise(
            (resolve, reject) => {
                process.communicate_utf8_async(
                    null,
                    null,
                    (source, result) => {
                        try {
                            resolve(
                                source.communicate_utf8_finish(result)
                            );
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            }
        );

        if (!process.get_successful()) {
            throw new Error(
                stderr?.trim() || `Command failed: ${args[0]}`
            );
        }

        return stdout ?? '';
    }

    _logError(error, message) {
        logError(error, `CSV Search: ${message}`);
    }

    async _copyPassToClipboard(passEntry) {
        const entryName = passEntry.trim();

        if (!entryName)
            return;

        try {
            const output = await this._runCommand([
                'pass',
                'show',
                entryName,
            ]);

            // The first line contains the password.
            const password = output.split(/\r?\n/, 1)[0];

            if (!password) {
                this._logError(
                    new Error('Empty password output.'),
                    'copy pass entry'
                );
                return;
            }

            this._copyToClipboard(
                password,
                CLIPBOARD_CLEAR_SECONDS
            );
        } catch (error) {
            this._logError(error, 'copy pass entry');

            Main.notify(
                'Password failed',
                error.message || String(error)
            );
        }
    }

    async _copyOtpToClipboard(otpEntry) {
        const entryName = otpEntry.trim();

        if (!entryName)
            return;

        try {
            const output = await this._runCommand([
                'pass',
                'otp',
                entryName,
            ]);

            const otp = output.trim();

            if (!otp)
                throw new Error('pass otp returned no OTP code.');

            this._copyToClipboard(
                otp,
                CLIPBOARD_CLEAR_SECONDS
            );
        } catch (error) {
            this._logError(error, 'copy OTP');

            Main.notify(
                'OTP failed',
                error.message || String(error)
            );
        }
    }

    _copyToClipboard(text, clearAfterSeconds = 0) {
        try {
            const clipboard = St.Clipboard.get_default();

            clipboard.set_text(
                St.ClipboardType.CLIPBOARD,
                text
            );

            Main.notify(
                'Copied to clipboard',
                'Content copied to clipboard.'
            );

            if (this._clipboardTimeoutId) {
                GLib.Source.remove(this._clipboardTimeoutId);
                this._clipboardTimeoutId = 0;
            }

            if (clearAfterSeconds > 0) {
                this._clipboardTimeoutId = GLib.timeout_add_seconds(
                    GLib.PRIORITY_DEFAULT,
                    clearAfterSeconds,
                    () => {
                        this._clipboardTimeoutId = 0;

                        // Do not erase newer clipboard contents.
                        clipboard.get_text(
                            St.ClipboardType.CLIPBOARD,
                            (_clipboard, currentText) => {
                                if (currentText === text) {
                                    clipboard.set_text(
                                        St.ClipboardType.CLIPBOARD,
                                        ''
                                    );
                                }
                            }
                        );

                        return GLib.SOURCE_REMOVE;
                    }
                );
            }
        } catch (error) {
            this._logError(error, 'copy to clipboard');
        }
    }

    _launchUri(uri) {
        try {
            Gio.AppInfo.launch_default_for_uri(uri, null);
            return true;
        } catch (error) {
            try {
                this._spawnCommand(['xdg-open', uri]);
                return true;
            } catch (spawnError) {
                this._logError(spawnError, 'open URI');
                return false;
            }
        }
    }

    _openUrl(url) {
        this._launchUri(url);
    }

    _openEmail(email) {
        const mailtoUri = email.startsWith('mailto:')
            ? email
            : `mailto:${email}`;

        this._launchUri(mailtoUri);
    }

    _openShellScript(scriptPath) {
        try {
            const hasKitty =
                GLib.find_program_in_path('kitty') !== null;

            const command =
                `bash -- "$1"; read -r -p 'Press Enter to exit...'`;

            const args = hasKitty
                ? [
                    'kitty',
                    'bash',
                    '-c',
                    command,
                    'csv-search-provider',
                    scriptPath,
                ]
                : [
                    'x-terminal-emulator',
                    '-e',
                    'bash',
                    '-c',
                    command,
                    'csv-search-provider',
                    scriptPath,
                ];

            this._spawnCommand(args);
        } catch (error) {
            this._logError(error, 'open shell script');
        }
    }

    _openJoplinLink(url) {
        this._launchUri(url.trim());
    }

    activateResult(resultId) {
        const index = Number.parseInt(resultId, 10);
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

    _isUrl(text) {
        return /^https?:\/\//i.test(text);
    }

    _isEmail(text) {
        for (const line of text.split('\n')) {
            const value = line.trim();

            if (!value)
                continue;

            if (value.startsWith('mailto:')) {
                const email = value
                    .slice('mailto:'.length)
                    .trim();

                if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
                    return true;
            }

            if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value))
                return true;
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

    getName() {
        return 'csv-search-provider';
    }

    getProviderType() {
        return 'search-provider';
    }

    getIcon() {
        const iconPath = GLib.build_filenamev([
            this._dataDir,
            'icon.png',
        ]);

        const file = Gio.File.new_for_path(iconPath);

        if (file.query_exists(null))
            return new Gio.FileIcon({ file });

        return new Gio.ThemedIcon({
            name: 'application-x-executable-symbolic',
        });
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
