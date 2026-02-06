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

**Optional:** For shell script execution, the extension prefers `kitty` terminal emulator. If not installed, the default system terminal will be used. To install kitty:

```bash
sudo apt install kitty  # Debian/Ubuntu
# or
sudo dnf install kitty  # Fedora
# or
sudo pacman -S kitty    # Arch Linux
```


## Usage

Place your *.csv or *.txt files in the extension folder:
`~/.local/share/gnome-shell/extensions/csv-search-provider@stbaeumer.github.com/`
Two example-files already exist here after installation.

### Format

Each line has the format:
```
key|value
```
:warning: use utf8. 

:warning: use `|` as delimiter.

## Example #1 - copy to clipboard

:warning: default rule, unless any of the following rules apply

https://github.com/user-attachments/assets/01122675-b0c3-4a1a-b874-8348a6e42cb1

## Example #2 - open in browser

:warning: applies to any value that starts with `http`

https://github.com/user-attachments/assets/f76c1272-cfa2-42ba-bda8-a1409a45de31

## Example #3 - open new mail dialog

:warning: applies to any value being a `mail-address`

https://github.com/user-attachments/assets/4afd04f8-8740-4303-b93f-eb2c2f550fa0

## Example #4 - open in joplin

:warning: applies to any value that starts with `joplin://`

https://github.com/user-attachments/assets/6d50fc52-ada1-42fa-a0c2-9b12a259ab5c

## Example #5 - copy multiline pgp-message to clipboard

:warning: applies to any multiline value

:warning: take care not to use `|` inside value

:warning: gpg-icon used if value contains `PGP MESSAGE`

https://github.com/user-attachments/assets/106f6af4-c287-4ec0-bac8-a6021c805055

## Example #6 - get password from pass and copy to clipboard

:warning: works with `pass` installed and configured

https://github.com/user-attachments/assets/b4fe7c05-0000-4f26-bead-faab8bf1a41c

## Example #7 - get otp from pass and copy to clipboard

:warning: works with `pass-otp` installed and configured

https://github.com/user-attachments/assets/90261af2-cace-4fd4-a3fa-0d00d731a03b

## Example #8 - run *.sh-script 

:warning: works with `kitty` installed

https://github.com/user-attachments/assets/cc335c64-00f2-4f14-892d-4e92b5ce0f2e

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

echo "📝 Erstelle CSV-Datei: $CSV_FILE"
echo "name|pass" > "$CSV_FILE"

echo "🔍 Suche nach Passwort-Einträgen..."
for file in $(find ~/.password-store -name "*.gpg"); do
    entry="${file#$HOME/.password-store/}"
    entry="${entry%.gpg}"
    content=$(pass show "$entry")
    
    # Prüfe auf otpauth URLs
    if echo "$content" | grep -q "otpauth://"; then
        echo "🔐 OTP gefunden: $entry"
        echo "$entry|otp" >> "$CSV_FILE"
    else
        # Prüfe auf Passwort
        password=$(echo "$content" | head -n 1)
        if [ -n "$password" ]; then
            echo "🔑 Passwort gefunden: $entry"
            echo "$entry|pass" >> "$CSV_FILE"
        else
            echo "⏭️  Leer übersprungen: $entry"
        fi
    fi
done

echo "✅ CSV-Datei erfolgreich erstellt"
```

## Credits

The great icons are from https://icons8.com/ & https://www.flaticon.com/.
