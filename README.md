# csv-search-provider

GNOME Shell Extension zum Durchsuchen von CSV- und TXT-Dateien in `~/.csv-search-provider`.

## Installation

```bash
./csv-search-provider.sh install
```

## Verwendung

Lege CSV- oder TXT-Dateien in `~/.csv-search-provider/` ab.

### Format

Jede Zeile hat das Format:
```
Anzeigetext|URL|icon.png
```

**Beispiel** (`~/.csv-search-provider/teams-chat.txt`):
```
John Doe|https://teams.microsoft.com/l/chat/0/0?users=john.doe@acme.com|teams.png
Jane Doe|https://teams.microsoft.com/l/chat/0/0?users=jane.doe@acme.com|teams.png
```

### Icons

- Icon-Dateien liegen in `~/.csv-search-provider/`
- Fallback-Icon: `icon.png` (Standard-Icon wenn keine Icon-Spalte angegeben)
- Icons können `.png` oder `.svg` sein

### Kommentare

Zeilen die mit `#` beginnen, werden ignoriert.

### Neuladen

Einfach den Schalter im Extensionmanager auf aus und wieder auf an stellen. Anschließend sollten die neuen Zeilen angezeigt werden. Notfalls in Gnome ab- und wieder anmelden.

## Deinstallation

```bash
./csv-search-provider.sh uninstall
```

## Debug

```bash
./csv-search-provider.sh debug
```