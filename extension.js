import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const CUSTOM_ICON_EXTENSIONS = [
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.webp',
    '.gif',
    '.bmp',
    '.ico',
];

class CsvSearchProvider {
    constructor(extension) {
        this._extension = extension;
        this.id = extension.uuid;
        this._entries = [];
        this._dataDir = extension.path;
        this._passwordStoreDataDir = GLib.build_filenamev([
            GLib.get_home_dir(),
            'password-store',
            'csv-search-provider',
        ]);
    }

    enable() {
        this._loadPromise = this._loadData();
        Main.overview.searchController.addProvider(this);
    }

    disable() {
        Main.overview.searchController.removeProvider(this);
    }

    _getIconNameForContent(content) {
        switch (true) {
            case content.includes('PGP MESSAGE'):
                return 'pgp.png';

            case this._isJoplinLink(content):
                return 'joplin.png';

            case this._isUrl(content):
                return content.toLowerCase().includes('team')
                    ? 'teams.png'
                    : 'browser.png';

            case this._isEmail(content):
                return 'mail.png';

            case this._isShellAction(content):
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
            this._passwordStoreDataDir,
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
                !currentEntry.key ||
                !currentEntry.url) {
                return;
            }

            this._entries.push({
                key: currentEntry.key,
                displayText: this._getDisplayText(currentEntry.key),
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
                    key: trimmedLine
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

    _getDisplayText(key) {
        const pathBlocks = key.split('/').filter(Boolean);

        if (pathBlocks.length < 3)
            return key;

        return pathBlocks.slice(-2).join('/');
    }

    _matchEntry(entry, query) {
        return entry.key
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
        const customIcon = this._getCustomIconForEntry(entry);

        if (customIcon)
            return customIcon;

        const iconDirs = [
            GLib.build_filenamev([
                this._passwordStoreDataDir,
                'icons',
            ]),
            GLib.build_filenamev([
                this._extension.path,
                'icons',
            ]),
        ];

        for (const iconDir of iconDirs) {
            const iconPath = GLib.build_filenamev([
                iconDir,
                entry.iconName,
            ]);
            const file = Gio.File.new_for_path(iconPath);

            if (file.query_exists(null))
                return new Gio.FileIcon({ file });
        }

        return null;
    }

    _getCustomIconForEntry(entry) {
        const key = entry.key;

        if (!key || key.includes('\\')) {
            return null;
        }

        const keyParts = key
            .split('/')
            .filter(part => part && part !== '.' && part !== '..')
            .reverse();

        const iconDirs = [
            GLib.build_filenamev([
                GLib.get_user_config_dir(),
                'csv-search-provider',
            ]),
            GLib.build_filenamev([
                this._passwordStoreDataDir,
                'icons',
            ]),
            GLib.build_filenamev([
                GLib.get_user_data_dir(),
                'icons',
            ]),
        ];

        const iconNames = keyParts.flatMap(keyPart => [
            keyPart,
            ...keyPart
                .trim()
                .split(/\s+/)
                .filter(word => word !== keyPart),
        ]);

        for (const iconName of iconNames) {
            const filenames = [
                ...CUSTOM_ICON_EXTENSIONS.map(
                    extension => `${iconName}${extension}`
                ),
                iconName,
            ];

            for (const iconDir of iconDirs) {
                for (const filename of filenames) {
                    const iconPath = GLib.build_filenamev([
                        iconDir,
                        filename,
                    ]);
                    const file = Gio.File.new_for_path(iconPath);

                    if (!file.query_exists(null))
                        continue;

                    try {
                        const info = file.query_info(
                            'standard::type,standard::content-type',
                            Gio.FileQueryInfoFlags.NONE,
                            null
                        );
                        const contentType = info.get_content_type();

                        if (info.get_file_type() === Gio.FileType.REGULAR &&
                            contentType?.startsWith('image/')) {
                            return new Gio.FileIcon({ file });
                        }
                    } catch (error) {
                        this._logError(
                            error,
                            `read custom icon ${iconPath}`
                        );
                    }
                }
            }
        }

        return null;
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

    _logError(error, message) {
        logError(error, `CSV Search: ${message}`);
    }

    _copyToClipboard(text) {
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

    _openInTerminal(command, commandArgs = []) {
        try {
            const hasKitty =
                GLib.find_program_in_path('kitty') !== null;

            const args = hasKitty
                ? [
                    'kitty',
                    'bash',
                    '-c',
                    command,
                    'csv-search-provider',
                ]
                : [
                    'x-terminal-emulator',
                    '-e',
                    'bash',
                    '-c',
                    command,
                    'csv-search-provider',
                ];

            this._spawnCommand([...args, ...commandArgs]);
        } catch (error) {
            this._logError(error, 'open terminal command');
        }
    }

    _openShellScript(scriptPath, parameter) {
        const command = [
            'if [[ "$1" == */* ]]; then script="$1";',
            'else script=$(command -v -- "$1") || {',
            'printf "Script not found: %s\\n" "$1" >&2;',
            "read -r -p 'Press Enter to exit...'; exit 127; }; fi;",
            'bash -- "$script" "$2"; status=$?;',
            "read -r -p 'Press Enter to exit...'; exit \"$status\";",
        ].join(' ');

        this._openInTerminal(command, [scriptPath, parameter]);
    }

    _getShellCommandParameters(shellCommand, key) {
        if (!shellCommand.includes('$@'))
            return [];

        return key
            .trim()
            .split(/\s+/)
            .filter(Boolean);
    }

    _openShellCommand(shellCommand, parameters) {
        const command = [
            'bash -c "$1" csv-search-provider "${@:2}"; status=$?;',
            "read -r -p 'Press Enter to exit...'; exit \"$status\";",
        ].join(' ');

        this._openInTerminal(command, [shellCommand, ...parameters]);
    }

    _runShellCommandInBackground(shellCommand, parameters) {
        try {
            const logPath = this._getBackgroundLogPath();
            const command = [
                'bash -c "$1" csv-search-provider "${@:3}" >> "$2" 2>&1;',
                'status=$?;',
                'if (( status != 0 )); then',
                'printf "Shell command exited with status %s\\n" "$status" >> "$2";',
                'fi;',
                'exit "$status"',
            ].join(' ');

            this._spawnCommand([
                'bash',
                '-c',
                command,
                'csv-search-provider',
                shellCommand,
                logPath,
                ...parameters,
            ]);
        } catch (error) {
            this._logError(error, 'run background shell command');

            Main.notify(
                'Background shell command failed',
                error.message || String(error)
            );
        }
    }

    _getBackgroundLogPath() {
        const configDirPath = GLib.build_filenamev([
            GLib.get_user_config_dir(),
            'csv-search-provider',
        ]);
        const configDir = Gio.File.new_for_path(configDirPath);

        if (!configDir.query_exists(null))
            configDir.make_directory_with_parents(null);

        return GLib.build_filenamev([
            configDirPath,
            'error.txt',
        ]);
    }

    _runShellScriptInBackground(scriptPath, parameter) {
        let logPath;
        const command = [
            'if [[ "$1" == */* ]]; then script="$1";',
            'else script=$(command -v -- "$1" 2>> "$3") || {',
            'printf "Script not found: %s\\n" "$1" >> "$3";',
            'exit 127; }; fi;',
            'bash -- "$script" "$2" >> "$3" 2>&1;',
            'status=$?;',
            'if (( status != 0 )); then',
            'printf "Script exited with status %s: %s\\n" "$status" "$script" >> "$3";',
            'fi;',
            'exit "$status"',
        ].join(' ');

        try {
            logPath = this._getBackgroundLogPath();

            this._spawnCommand([
                'bash',
                '-c',
                command,
                'csv-search-provider',
                scriptPath,
                parameter,
                logPath,
            ]);
        } catch (error) {
            this._logError(error, 'run background shell script');

            Main.notify(
                'Background script failed',
                error.message || String(error)
            );
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
        const shellAction = this._getShellActionInfo(content);

        if (this._isJoplinLink(content)) {
            this._openJoplinLink(content);
        } else if (shellAction) {
            if (shellAction.simpleScript) {
                if (shellAction.background) {
                    this._runShellScriptInBackground(
                        shellAction.scriptPath,
                        entry.key
                    );
                } else {
                    this._openShellScript(
                        shellAction.scriptPath,
                        entry.key
                    );
                }
            } else if (shellAction.background) {
                const parameters = this._getShellCommandParameters(
                    shellAction.command,
                    entry.key
                );
                this._runShellCommandInBackground(
                    shellAction.command,
                    parameters
                );
            } else {
                const parameters = this._getShellCommandParameters(
                    shellAction.command,
                    entry.key
                );
                this._openShellCommand(shellAction.command, parameters);
            }
        } else if (this._isUrl(content)) {
            this._openUrl(content);
        } else if (this._isEmail(content)) {
            this._openEmail(content);
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

    _getShellActionInfo(text) {
        const value = text.trim();
        const background = /^background:/i.test(value);
        const command = background
            ? value.replace(/^background:\s*/i, '')
            : value;
        const scriptMatch = command.match(
            /(?:^|[\s"'=])([^\s"'|;&]*\.sh)(?=$|[\s"'|;&])/i
        );
        const hasBash = /(?:^|[\s|])bash(?=\s|$)/i.test(command);
        const hasPipeline = command.includes('|');

        if (!scriptMatch && !hasBash && !hasPipeline)
            return null;

        const simpleScriptMatch = command.match(
            /^(?:"([^"]+\.sh)"|'([^']+\.sh)'|([^\s"'|;&]+\.sh))$/i
        );

        return {
            command,
            background,
            scriptPath: simpleScriptMatch?.[1] ??
                simpleScriptMatch?.[2] ??
                simpleScriptMatch?.[3] ??
                scriptMatch?.[1] ??
                null,
            simpleScript: simpleScriptMatch !== null,
        };
    }

    _isShellAction(text) {
        return this._getShellActionInfo(text) !== null;
    }

    _isJoplinLink(text) {
        return text.trim().startsWith('joplin://');
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
