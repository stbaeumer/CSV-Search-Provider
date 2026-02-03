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

Place your *.csv or *.txt files in the extension folder:
`~/.local/share/gnome-shell/extensions/csv-search-provider@stbaeumer.github.com/`
Two example-files already exist here after installation.

### Format

Each line has the format:
```
Display text|teams-url/url/text/email/shell-script
```

**Example** (e.g., `example.txt` in the extension folder):
```
John Doe|https://teams.microsoft.com/l/chat/0/0?users=john.doe@acme.com
IBAN|DE12 3456 1234 1234 1234 00
Debug CSV-Search-Provider|/home/stefan/Dokumente/CSV-Search-Provider/csv-search-provider.sh debug
Ecosia Browser|https://ecosia.org
John Doe|https://teams.microsoft.com/l/chat/0/0?users=john.doe@acme.com
Jane Doe|jane.doe@acme.com
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