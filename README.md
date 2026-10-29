# CSV-Search-Provider

GNOME Shell extension to search *.csv and *.txt files. Rows found in the files are converted into results in GNOME Shell search.

<img width="1380" height="682" alt="grafik" src="https://github.com/user-attachments/assets/435840b8-fd13-4ecf-8099-553f5ddc0548" />


## Installation

```bash
unzip csv-search-provider-*.zip
cd CSV-Search-Provider
chmod +x csv-search-provider.sh
./csv-search-provider.sh install
```

## Usage

Place your *.csv or *.txt file(s) in config folder `~/.config/csv-search-provider` or extension folder. The installer creates `~/.config/csv-search-provider` automatically.
Two example-files already exist in extension folder `~/.local/share/gnome-shell/extensions/csv-search-provider@stbaeumer.github.com/` after installation. Type 'Jane Doe' in Gnome Shell to see if extension installed properly and to get a first impression.

### CSV/TXT-Format

Each line has the format:
```
key|value
```
:warning: use utf8.

:warning: use `|` as delimiter.

:warning: no header 

Continuation lines in multiline values are kept as written.

For keys with three or more slash-separated blocks, search results show only the last two blocks. The complete key is still used for searching and actions. For example, `dienste/cloud/posteo.de/baeumer` is displayed as `posteo.de/baeumer`.

### Actions

| Nr | Type | Value | Action |
|----|------|-------|--------|
| 1 | URL | starts with `http://` or `https://` | Open in default browser |
| 2 | Email | mail address or starts with `mailto:` | Open mail client |
| 3 | Joplin | starts with `joplin://` | Open note link |
| 4 | `pass` / `pass-<field>` / `otp` | value is `pass`, `pass-<field>`, or `otp` | Copy the password, a named field, or generate the OTP from the entry's `otpauth://` URI |
| 5 | Shell script | contains a filename matching `*.sh` | Run that script in a terminal; the key is passed as its first argument |
| 6 | Shell command | contains `|` | Run the command in a terminal |
| 7 | Default / Fallback | any other value | Copy value to clipboard |

## Example 1 - URL
Action: URL: open in default browser (value starts with http/https)

https://github.com/user-attachments/assets/f76c1272-cfa2-42ba-bda8-a1409a45de31

## Example 2 - Email
Action: Email: open mail client (value is a mail address or starts with mailto:)

https://github.com/user-attachments/assets/4afd04f8-8740-4303-b93f-eb2c2f550fa0

## Example 3 - Joplin
Action: Joplin: open note link (value starts with joplin://)

https://github.com/user-attachments/assets/6d50fc52-ada1-42fa-a0c2-9b12a259ab5c

## Example 4.1 - pass
Action: pass: run pass and copy result to clipboard (value is 'pass')

https://github.com/user-attachments/assets/b4fe7c05-0000-4f26-bead-faab8bf1a41c

## Example 4.2 - pass and otp

A `pass` entry can contain the password on its first line and additional fields below it. Put the OTP URI on its own line, either directly or after `otp:`:

```text
Th3Gr3at3stPassw0rd
username: JohnDoe
email: john@example.com
otp: otpauth://totp/example?secret=ABCDCBABCDCBABCD
url: https://example.com
pin: 1234
```

The `otp:` prefix is optional; a line beginning directly with `otpauth://` works as well. In the CSV/TXT file, use the pass entry name with `pass` to copy its first line, `otp` to generate and copy a code from its TOTP URI, or `pass-<field>` to copy a named field:

```text
john.Doe|pass
john.Doe|otp
john.Doe|pass-pin
john.Doe|pass-anwendungspasswort
```

For `pass-<field>`, the extension copies the value after the matching `<field>:` line in the password entry (case-insensitive field name). For example, `pass-pin` copies `1234` from `pin: 1234`. If the field is missing, it copies `<field> does not exist in item` to the clipboard.

Treat the password and OTP secret as highly sensitive. Anyone who obtains the OTP URI may be able to generate your codes.

https://github.com/user-attachments/assets/90261af2-cace-4fd4-a3fa-0d00d731a03b

## Example 5 - Shell script
Action: If the value contains a filename ending in `.sh`, that script is run in a terminal. The key (the part before the CSV delimiter) is passed as the script's first argument; it does not need to end in `.sh`:

```text
posteo.de|xdgopen.sh
google.de|xdgopen.sh
```

In this example, `xdgopen.sh` receives `posteo.de` or `google.de` as its first argument. A value that contains a shell pipeline, such as the next example, is run as a shell command instead.

## Example 6 - Shell command
Action: Run the value as a shell command in a terminal (value contains `|`):

```text
neomutt|pass neomutt-start.sh | bash
```

The command is run as written, so the pipeline feeds the output of `pass neomutt-start.sh` to `bash`.

For shell script execution, the extension prefers `kitty` terminal emulator. If not installed, the default system terminal will be used. To install kitty:

```bash
sudo apt install kitty  # Debian/Ubuntu
# or
sudo dnf install kitty  # Fedora
# or
sudo pacman -S kitty    # Arch Linux
```

https://github.com/user-attachments/assets/cc335c64-00f2-4f14-892d-4e92b5ce0f2e

## Example 7.1 - Default
Action: Default: copy value to clipboard (defaut)

https://github.com/user-attachments/assets/01122675-b0c3-4a1a-b874-8348a6e42cb1

## Example 7.2 - Default - Multiline
Action: default copy with icon override when value contains `PGP MESSAGE`.
Note: multiline values must not contain `|`.

https://github.com/user-attachments/assets/106f6af4-c287-4ec0-bac8-a6021c805055


## Comments

Lines starting with `#` are ignored.

## Reload

Simply toggle the extension off and on again in the extension manager. The new lines should then appear. If necessary, log out and back in.

## Uninstallation

```bash
./csv-search-provider.sh uninstall
```

## Debug

```bash
./csv-search-provider.sh debug
```

## Troubleshooting

- **pass/otp not found**: Install `pass` and `oathtool`; both commands must be in `$PATH`. The `pass-otp` extension is also needed for entries whose URI starts directly with `otpauth://`.
- **OTP does nothing**: Check that the matching password-store entry contains an `otpauth://` URI. A URI on a line starting with `otp:` requires `oathtool`; a URI on a line starting directly with `otpauth://` requires the `pass-otp` extension. The extension shows an error notification if OTP generation fails.
- **Default terminal missing**: Install `x-terminal-emulator` or the extension will use no terminal for shell scripts. Prefer `kitty` for best experience.
- **xdg-open not working**: Some URI schemes may not be configured. Set up default applications in system settings.
- **No results**: Ensure CSV/TXT files are in the extension directory. Comments (lines starting with `#`) are ignored. Re-installation might erase csv-files.
- **Multiline values fail**: Avoid using `|` inside multiline values; use it only as field separator.
- **not in the password-store**: Try `ln -s "$HOME/.passify" "$HOME/.password-store"`, if using different location.

## Tips & tricks

### Protect private data

If your CSV/TXT files contain passwords, OTP-related entries, or other private data, restrict access to the config directory and its files:

```bash
chmod 700 ~/.config/csv-search-provider
chmod 600 ~/.config/csv-search-provider/*.csv ~/.config/csv-search-provider/*.txt
```

Run these commands after creating the directory and adding files. They allow your user account to access the files while denying access to other local users. Programs running as your user and the root user can still access them.

### Create generate-joplin-csv.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

# Configuration
CONFIG_DIR="$HOME/.config/csv-search-provider"
CSV_FILE="$CONFIG_DIR/joplin-notes.csv"
JOPLIN_DB="$HOME/.config/joplin-desktop/database.sqlite"

# Check if sqlite3 is installed
if ! command -v sqlite3 &>/dev/null; then
    echo "❌ Error: sqlite3 is not installed. Please install it first (e.g., sudo apt install sqlite3)." >&2
    exit 1
fi

# Check if the Joplin database exists
if [ ! -f "$JOPLIN_DB" ]; then
    echo "❌ Error: Joplin database not found at $JOPLIN_DB." >&2
    exit 1
fi

# Create target directory if it doesn't exist
mkdir -p "$CONFIG_DIR"

echo "📝 Exporting Joplin notes to CSV: $CSV_FILE"

# Extract notes from database
sqlite3 "$JOPLIN_DB" \
    ".mode list" \
    ".separator |" \
    "SELECT title || '|joplin://x-callback-url/openNote?id=' || id FROM notes WHERE is_conflict = 0 AND deleted_time = 0;" \
    > "$CSV_FILE"

# Count exported entries
entry_count=$(wc -l < "$CSV_FILE" | tr -d ' ')

echo "✅ Successfully exported $entry_count Joplin notes to: $CSV_FILE"
```

### Create generate-pass-csv.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

# Configuration
CONFIG_DIR="$HOME/.config/csv-search-provider"
CSV_FILE="$CONFIG_DIR/pass.csv"
PASSWORD_STORE_DIR="$HOME/.password-store"

# Check if the password store directory exists
if [ ! -d "$PASSWORD_STORE_DIR" ]; then
    echo "❌ Error: Password store not found at $PASSWORD_STORE_DIR." >&2
    exit 1
fi

# Create target directory if it doesn't exist
mkdir -p "$CONFIG_DIR"

echo "📝 Creating CSV file: $CSV_FILE"
echo "name|pass" > "$CSV_FILE"

echo "🔍 Searching password store..."

# Safe loop for file names (handles paths with spaces properly)
while IFS= read -r -d '' file; do
    # Strip the base path and .gpg extension to get the entry name
    entry="${file#$PASSWORD_STORE_DIR/}"
    entry="${entry%.gpg}"
    
    # Retrieve content from pass (suppress stderr errors)
    if ! content=$(pass show "$entry" 2>/dev/null); then
        echo "⚠️  Could not read entry: $entry"
        continue
    fi
    
    if echo "$content" | grep -q "otpauth://"; then
        echo "🔐 OTP found: $entry"
        echo "$entry|otp" >> "$CSV_FILE"
    else
        password=$(echo "$content" | head -n 1)
        if [ -n "$password" ]; then
            echo "🔑 Password found: $entry"
            echo "$entry|pass" >> "$CSV_FILE"
        else
            echo "⏭️  Skipped empty: $entry"
        fi
    fi
done < <(find "$PASSWORD_STORE_DIR" -type f -name "*.gpg" -print0)

echo "✅ CSV file successfully created at: $CSV_FILE"
```

### Change icons

To use your own icons, replace the PNG files in the extension's `icons` folder. Keep the existing filenames so the extension can find them. The folder is usually:

```text
~/.local/share/gnome-shell/extensions/csv-search-provider@stbaeumer.github.com/icons/
```

The icon is selected automatically based on the value in the CSV/TXT entry. Replace the corresponding file:

| Entry type | Icon file |
|------------|-----------|
| PGP message | `pgp.png` |
| OTP | `otp.png` |
| Password (`pass`) | `pass.png` |
| Joplin link | `joplin.png` |
| URL containing `team` | `teams.png` |
| Other URL | `browser.png` |
| Email | `mail.png` |
| Shell script | `shell.png` |
| Other values | `clipboard.png` |

Use PNG images and retain the filenames shown above. After replacing an icon, reload the extension (or log out and back in) to see the change.

### Per-entry icons

You can override the standard icon for a CSV/TXT entry by adding an image named after one of the slash-separated parts of its key. The parts are checked from right to left, from specific to general. For `computer/repositories/github.com/github|otp`, the search order is:

```text
github
github.com
repositories
computer
```

Thus, if both `github.com.png` and `computer.png` exist, `github.com.png` is used. Each name can use `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`, `.gif`, `.bmp`, or `.ico`, or have no extension. For each name, an image in `~/.config/csv-search-provider` takes precedence over one in `~/.local/share/icons`. For example:

```text
~/.config/csv-search-provider/github.com.png
~/.local/share/icons/computer.png
```

If no matching image exists, the normal type-based icon is shown.


## Credits

The great icons are from https://icons8.com/ & https://www.flaticon.com/.
