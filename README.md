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

Place your *.csv or *.txt file(s) in config folder: `~/.config/csv-search-provider` or extension folder.
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

To add OTP support to a `pass` entry, first make sure the entry exists. If it does not, create it:

```bash
pass insert GITHUBSECRET
```

Get the OTP setup key or `otpauth://` URI from the service's two-factor authentication setup. If the service gives you a setup key instead of a URI, build a URI in this format:

```text
otpauth://totp/ISSUER:ACCOUNT?secret=BASE32_SECRET&issuer=ISSUER
```

Replace the placeholders with the issuer, account name, and the service-provided Base32 secret. Do not use your password or a current six-digit code. Then attach the URI to the `pass` entry:

```bash
pass otp append GITHUBSECRET
```

When prompted, paste the complete URI twice. Treat the URI and secret as highly sensitive: anyone who obtains them may be able to generate your OTP codes. Verify the entry in a terminal:

```bash
pass otp GITHUBSECRET
```

Use the same entry name in the CSV/TXT file:

```text
GITHUBSECRET|otp
```

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
- **OTP does nothing**: Check that the matching password-store entry contains an OTP secret and that `pass otp GMAILSECRET` works in a terminal (replace `GMAILSECRET` with the entry name). The extension now shows an error notification if `pass otp` fails or returns no code.
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


## Credits

The great icons are from https://icons8.com/ & https://www.flaticon.com/.
