# CSV-Search-Provider

GNOME Shell extension to search CSV and TXT files. Rows found in the CSV are converted into results in GNOME Shell search.

## Installation

```bash
unzip csv-search-provider-*.zip
cd CSV-Search-Provider
chmod +x csv-search-provider.sh
./csv-search-provider.sh install
```

## Usage

Place *.csv or *.txt files in the extension folder:
`~/.local/share/gnome-shell/extensions/csv-search-provider@stbaeumer.github.com/`

### Format

Each line has the format:
```
Display text|teams-url/url/text/email/shell-script
```

**Example** (e.g., `my.txt` in the extension folder):
```
John Doe|https://teams.microsoft.com/l/chat/0/0?users=john.doe@acme.com
Jane Doe|jane.doe@acme.com
Clipboard-example|clipboard-content
Ecosia|https://ecosia.org
Debug Extension|/path/to/script.sh debug
```

**Shell Scripts with Parameters:**
- Lines containing `.sh ` (with space) are treated as shell scripts with parameters
- Example: `Debug|/home/user/script.sh --verbose`

See `example.txt` and `example.csv` for reference.

### Comments

Lines starting with `#` are ignored.

### Reload

Simply toggle the extension off and on again in the extension manager. The new lines should then appear. If necessary, log out and back in.

## Uninstallation

```bash
./csv-search-provider.sh uninstall
```

## Debug

```bash
./csv-search-provider.sh debug
```