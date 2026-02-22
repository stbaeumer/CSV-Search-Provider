# CSV-Search-Provider

GNOME Shell extension to search CSV and TXT files. Rows found in the CSV are converted into results in GNOME Shell search.

<img width="1380" height="682" alt="grafik" src="https://github.com/user-attachments/assets/435840b8-fd13-4ecf-8099-553f5ddc0548" />


## Installation

```bash
unzip csv-search-provider-*.zip
cd CSV-Search-Provider
chmod +x csv-search-provider.sh
./csv-search-provider.sh install
```

## Usage

Place your *.csv or *.txt file(s) in the extension folder:
`~/.local/share/gnome-shell/extensions/csv-search-provider@stbaeumer.github.com/`
Two example-files already exist here after installation. Type 'Jane Doe' in Gnome Shell to see if extension installed properly and to get a first impression.

### CSV/TXT-Format

Each line has the format:
```
key|value
```
:warning: use utf8.

:warning: use `|` as delimiter.

:warning: no header 

### Actions

| Nr | Type | Value | Action |
|----|------|-------|--------|
| 1 | URL | starts with `http://` or `https://` | Open in default browser |
| 2 | Email | mail address or starts with `mailto:` | Open mail client |
| 3 | Joplin | starts with `joplin://` | Open note link |
| 4 | `pass` / `otp` | value is `pass` or `otp` | Run `pass` or `pass-otp` and copy result to clipboard |
| 5 | Shell | ends with `.sh` | Run script in terminal |
| 6 | Default / Fallback | any other value | Copy value to clipboard |

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

## Example 4.2 - otp
Action: otp: run pass-otp and copy result to clipboard (value is 'otp')

:warning: Add otp like this: ```pass otp append webuntis```

https://github.com/user-attachments/assets/90261af2-cace-4fd4-a3fa-0d00d731a03b

## Example 5 - Shell
Action: Shell: run script in terminal (value ends with .sh)

For shell script execution, the extension prefers `kitty` terminal emulator. If not installed, the default system terminal will be used. To install kitty:

```bash
sudo apt install kitty  # Debian/Ubuntu
# or
sudo dnf install kitty  # Fedora
# or
sudo pacman -S kitty    # Arch Linux
```

https://github.com/user-attachments/assets/cc335c64-00f2-4f14-892d-4e92b5ce0f2e

## Example 6.1 - Default
Action: Default: copy value to clipboard (defaut)

https://github.com/user-attachments/assets/01122675-b0c3-4a1a-b874-8348a6e42cb1

## Example 6.2 - Default - Multiline
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

- **pass/otp not found**: Install `pass` and optionally `pass-otp` for password integration. Commands must be in `$PATH`.
- **Default terminal missing**: Install `x-terminal-emulator` or the extension will use no terminal for shell scripts. Prefer `kitty` for best experience.
- **xdg-open not working**: Some URI schemes may not be configured. Set up default applications in system settings.
- **No results**: Ensure CSV/TXT files are in the extension directory. Comments (lines starting with `#`) are ignored. Re-installation might erase csv-files.
- **Multiline values fail**: Avoid using `|` inside multiline values; use it only as field separator.

## Tips & tricks

### Create joplin.csv

```bash
sqlite3 ~/.config/joplin-desktop/database.sqlite \
".mode list" \
".separator |" \
"SELECT title || '|joplin://x-callback-url/openNote?id=' || id FROM notes;" \
> /home/stefan/.local/share/gnome-shell/extensions/csv-search-provider@stbaeumer.github.com/joplin-notes.csv
```

### Create pass.csv

```bash
CSV_FILE="/home/stefan/.local/share/gnome-shell/extensions/csv-search-provider@stbaeumer.github.com/pass.csv"

echo "📝 Creating CSV file: $CSV_FILE"
echo "name|pass" > "$CSV_FILE"

echo "🔍 Searching for password entries..."
for file in $(find ~/.password-store -name "*.gpg"); do
    entry="${file#$HOME/.password-store/}"
    entry="${entry%.gpg}"
    content=$(pass show "$entry")
    
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
done

echo "✅ CSV file created successfully"
```

## Credits

The great icons are from https://icons8.com/ & https://www.flaticon.com/.
