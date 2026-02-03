# CSV-Search-Provider

GNOME Shell extension to search CSV and TXT files. Rows found in the CSV are converted into results in GNOME Shell search.

<img width="1351" height="413" alt="bildschirm" src="https://github.com/user-attachments/assets/55d0181b-caf9-4e5b-86f6-32f725cc0199" />


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

**Testride after installation**

Press Super to open Gnome-shell search.

1. Type in "John Doe"
2. Type in "Jane Doe"
3. Type in "IBAN"
4. Type in "Ecosia"
5. Type in "Debug CSV"

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


## Credits

The great icons are from https://icons8.com/.
