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

### Actions

| Nr | Type | Value | Action |
|----|------|-------|--------|
| 1 | URL | starts with `http://` or `https://` | Open in default browser |
| 2 | Email | mail address or starts with `mailto:` | Open mail client |
| 3 | Joplin | starts with `joplin://` | Open note link |
| 4 | Shell command | contains a `.sh` filename, `bash`, or a shell pipeline | Run as a command; `background:` runs without a terminal |
| 5 | Default | any other value | Copy value to clipboard |

## Examples and video directions

The snippets below show the contents of a CSV/TXT file. Add them to a file in
`~/.config/csv-search-provider`, then reload the extension. Each video direction
is a short recording plan that can later be replaced with the finished video.
Use a clean demo profile and test data; never show private emails or personal
notes in a recording.

### Example 1 - URL

```text
Project website|https://github.com/stbaeumer/CSV-Search-Provider
```

**Action:** Opens the URL in the default browser.

**Video direction:** Show the CSV row, open GNOME Shell search, type
`Project website`, and activate the result. Record the browser opening the
project page. Do not show unrelated browser tabs or personal bookmarks.

### Example 2 - Email

Both a plain email address and a `mailto:` value open the mail client:

```text
Project contact|hello@example.com
Support contact|mailto:support@example.com
```

**Action:** Opens a new message in the default mail client; it does not send
the message.

**Video direction:** Search for `Project contact`, activate the result, and
show the mail client with the recipient filled in. Do not type or send a
message. Repeat with `Support contact` only if you want to demonstrate the
`mailto:` form.

### Example 3 - Joplin

```text
Demo note|joplin://x-callback-url/openNote?id=00000000000000000000000000000000
```

Replace the example ID with the ID of a disposable note in your Joplin
installation.

**Action:** Opens the note in Joplin.

**Video direction:** Show the example row, search for `Demo note`, and activate
the result. Capture Joplin opening the disposable note. Keep private notes and
notebook names out of the recording.

### Example 4 - Shell scripts and commands

A bare script filename receives the entry key as its first argument:

```text
posteo.de|xdgopen.sh
google.de|xdgopen.sh
backup|background:backup.sh
```

The script must be available by name in `$PATH`, or use a script path instead.
For example, `xdgopen.sh` receives `posteo.de` or `google.de`; the background
script receives `backup`. Background output and errors are appended to
`~/.config/csv-search-provider/error.txt`.

A value containing a `.sh` filename, `bash`, or a pipe is run as a shell
command. To pass the CSV key to the command, put `"$@"` exactly where its
arguments should go. The key is split at whitespace, and each word becomes a
separate argument. Without `"$@"`, the command receives no arguments from the
CSV key. This lets you mix the key's words with fixed arguments or leave them
out entirely:

```text
Show date|date | cat
Show date quietly|background:date | cat
Show arguments|printf 'argument=<%s>\n' "$@" | cat
webuntis admin|pass skripte/xdgopen-otp | bash -s -- "$@"
hours|pass scripts/uptime.sh | bash -s -- "$@"
minutes 15|pass scripts/uptime.sh | bash -s -- "$@"
minutes 15|background:pass scripts/uptime.sh | bash -s -- "$@"
```

In the `webuntis admin` example, the script receives `webuntis` as `$1` and
`admin` as `$2`; the script's `for kw in $SEARCH_TERM` loop searches for both
words. The `printf` example shows each key word as a separate argument.
`bash -s -- "$@"` reads the script from standard input and forwards those
arguments. You can put `"$@"` before or after fixed arguments to control their
position; if the command does not contain `"$@"`, no CSV-key arguments are
forwarded. For background commands, output and errors are appended to
`~/.config/csv-search-provider/error.txt`.

**Action:** Runs a matching script or command. By default it opens a terminal;
the `background:` prefix runs without one.

**Video direction:** First show `Show date`, activate it, and capture the
terminal displaying the date. Then search for `Show date quietly`, activate
it, and show that no terminal opens. If demonstrating a script, use a harmless
demo script that prints a message and its received arguments. Never run a
command that changes or deletes files during recording.

For commands that open a terminal, the extension prefers the `kitty` terminal
emulator. If it is not installed, the default system terminal is used. To
install kitty:

```bash
sudo apt install kitty  # Debian/Ubuntu
# or
sudo dnf install kitty  # Fedora
# or
sudo pacman -S kitty    # Arch Linux
```

### Example 5 - Default copy and multiline values

Values that do not match another action are copied to the clipboard:

```text
Guest Wi-Fi|Network: ExampleGuest; password: EXAMPLE-ONLY
Meeting notes|First line of the note
Second line of the note
Third line of the note
Demo PGP marker|-----BEGIN PGP MESSAGE-----
[Demo placeholder; this is not an encrypted message]
-----END PGP MESSAGE-----
```

The multiline value belongs to the key on the line containing the first `|`.
Continuation lines are kept as written. Do not put another `|` in a multiline
value: it is reserved as the key/value separator. A value containing `PGP
MESSAGE` uses the PGP icon by default.

**Action:** Copies the complete value, including any continuation lines, to
the clipboard.

**Video direction:** Search for `Meeting notes`, activate the result, and
paste the value into a plain-text editor to show that all three lines were
copied. Then search for `Demo PGP marker` and briefly show its result and PGP
icon. Keep the placeholder label visible so viewers do not mistake it for
real encrypted data.

### Example 6 - Comments and long keys

Lines starting with `#` are ignored, and keys with at least three slash-
separated parts display only their last two parts. The complete key remains
searchable:

```text
# A comment: this line is ignored
work/accounts/example.com|https://example.com
```

**Video direction:** Show the comment and entry in the data file. Search for
`work/accounts/example.com` and show that the result is displayed as
`accounts/example.com`, then activate it to open the URL. This demonstrates
that the full key can be searched even though the result uses a shorter
display name.


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

For keys with three or more slash-separated blocks, search results show only the last two blocks. The complete key is still used for searching and actions. For example, `dienste/cloud/posteo.de/baeumer` is displayed as `posteo.de/baeumer`.


## Troubleshooting

- **Default terminal missing**: Install `x-terminal-emulator` or the extension will use no terminal for shell scripts. Prefer `kitty` for best experience.
- **xdg-open not working**: Some URI schemes may not be configured. Set up default applications in system settings.
- **No results**: Ensure CSV/TXT files are in the extension directory. Comments (lines starting with `#`) are ignored. Re-installation might erase csv-files.
- **Multiline values fail**: Avoid using `|` inside multiline values; use it only as field separator.

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

### Change icons

To use your own icons, replace the PNG files in the extension's `icons` folder. Keep the existing filenames so the extension can find them. The folder is usually:

```text
~/.local/share/gnome-shell/extensions/csv-search-provider@stbaeumer.github.com/icons/
```

The icon is selected automatically based on the value in the CSV/TXT entry. Replace the corresponding file:

| Entry type | Icon file |
|------------|-----------|
| PGP message | `pgp.png` |
| Joplin link | `joplin.png` |
| URL containing `team` | `teams.png` |
| Other URL | `browser.png` |
| Email | `mail.png` |
| Shell script | `shell.png` |
| Other values | `clipboard.png` |

Use PNG images and retain the filenames shown above. After replacing an icon, reload the extension (or log out and back in) to see the change.

### Per-entry icons

You can override the standard icon for a CSV/TXT entry by adding an image named after one of the slash-separated parts of its key. The parts are checked from right to left, from specific to general. For `computer/repositories/github.com/github|https://github.com`, the search order is:

```text
github
github.com
repositories
computer
```

Thus, if both `github.com.png` and `computer.png` exist, `github.com.png` is used. Each name can use `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`, `.gif`, `.bmp`, or `.ico`, or have no extension. For each name, an image in `~/.config/csv-search-provider` takes precedence over one in `~/.local/share/icons`. For example:

If a slash-separated key part contains multiple words separated by spaces, the full part is checked first, followed by each word from left to right. For example, `computer/my laptop` checks `my laptop` first, then `my`, then `laptop`, so `laptop.png` can provide the icon if no more specific match exists.

```text
~/.config/csv-search-provider/github.com.png
~/.local/share/icons/computer.png
```

If no matching image exists, the normal type-based icon is shown.


## Credits

The great icons are from https://icons8.com/ & https://www.flaticon.com/.
