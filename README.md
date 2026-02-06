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
Display text|teams-url/url/text/email/shell-script
```
### Example #1 - copy to clipboard

https://github.com/user-attachments/assets/01122675-b0c3-4a1a-b874-8348a6e42cb1

### Example #2 - open in browser

https://github.com/user-attachments/assets/f76c1272-cfa2-42ba-bda8-a1409a45de31

### Example #3 - open new mail dialog

https://github.com/user-attachments/assets/4afd04f8-8740-4303-b93f-eb2c2f550fa0

### Example #4 - open in joplin

https://github.com/user-attachments/assets/6d50fc52-ada1-42fa-a0c2-9b12a259ab5c

### Example #5 - copy multiline pgp-message to clipboard

https://github.com/user-attachments/assets/106f6af4-c287-4ec0-bac8-a6021c805055

### Example #6 - get password from pass and copy to clipboard

https://github.com/user-attachments/assets/b4fe7c05-0000-4f26-bead-faab8bf1a41c

### Example #7 - get otp from pass and copy to clipboard

https://github.com/user-attachments/assets/90261af2-cace-4fd4-a3fa-0d00d731a03b

### Example #8 - run *.sh-script 


**Special values in column 2:**
- `pass` -> fetches password from pass database using column 1 as entry name -> copies to clipboard
- `otp` -> fetches OTP from pass database using column 1 as entry name -> copies to clipboard
- `joplin...` -> opens Joplin using the selected entry (e.g. `joplin://x-callback-url/...`)

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

1. Type in "John Doe" -> open Teams-Chat with John Doe in Browser
2. Type in "Jane Doe" -> open mailclient
3. Type in "IBAN" -> copy DE12 1234 1234 1234 12 to clipboard
4. Type in "Ecosia" -> open Ecosia Browser
5. Type in "Debug CSV" -> run shellscript in kitty 

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

The great icons are from https://icons8.com/ & https://www.flaticon.com/.
