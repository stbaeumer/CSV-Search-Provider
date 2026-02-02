# csv-search-provider

GNOME Shell extension to search CSV and TXT files in `~/.csv-search-provider`. Rows found in the CSV are converted into results in GNOME Shell search.

## Installation

```bash
./csv-search-provider.sh install
```

## Usage

Place CSV or TXT files in `~/.csv-search-provider/`.

### Format

Each line has the format:
```
Display text|Teams URL/URL/Text/Email
```

**Example** (`~/.csv-search-provider/my.txt`):
```
John Doe|https://teams.microsoft.com/l/chat/0/0?users=john.doe@acme.com
Jane Doe|jane.doe@acme.com
Clipboard-example|clipboard-content
google|https://google.de
```

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