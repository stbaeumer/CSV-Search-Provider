# Search CSV

Search CSV lässt dich Inhalte von *.txt und *.csv Dateien in einem bestimmten Ordner zeilenweise durchsuchen.

Let's say the content of appointments.txt is this:

31.12.2026, 20:00 Silvester|https://my-calender-online.de
01.01.2027 New Year|https://my-calender-online.de

And maybe the content of another file namend 'chat.csv' is this:

Max Mustermann|https://teams.microsoft.com/l/chat/0/0?users=max.mustermann@firma.de
John Doe|https://teams.microsoft.com/l/chat/0/0?users=john.doe@firma.de

Now search for John, to get 'John Doe'. Click ENTER to jump to 'https://teams.microsoft.com/l/chat/0/0?users=john.doe@firma.de'.




@workspace Die App habe ich mir als Vorlage heruntergeladen. Sie durchsucht im Moment Ordner im Dateisystem. Jetzt soll die Suchlogik (in extensions.js) wie folgt umgebaut werden:

Es sollen alle txt und csv-Dateien im Ordner /home/stefan/.csv-search-provider Zeile für Zeile indiziert werden. Jede Zeile in jeder gefundenen Datei hat zwei Spalten. Beispiel "Meine_Termine.txt":

31.12.2026, 20:00 Silvester|https://my-calender-online.de
01.01.2027 New Year|https://my-calender-online.de

Wenn der Anwender nun in der Gnome-Shell-Suche Silvester eingibt, dann soll als Suchergebnis Spalte 1 "31.12.2026, 20:00 Silvester" angezeigt werden. Wenn der Anwender das Suchergebnis klickt, soll der URL in der zweiten Spalte geöffnet werden.

Der Container um die Ergebnisse aus Termine.txt soll den Namen "Meine_Termine" bekommen. Also den Dateinamen ohne Dateiendung. Unterstriche im Dateinamen werden zu Leerzeichen.

So wie ich das verstehe, ist die Suchlogik in extensions.js. Also bitte entsprechend vorsichtig bei der Bearbeitung anderer Dateien, da das Extension-handling wohl sehr sensibel ist.






<img src="./example.png" alt="Search CSV" />


## Install

[<img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" height="100">](https://extensions.gnome.org/extension/8227/csv-search-provider/)

1. Öffne [Search CSV] auf der GNOME Shell Extensions Seite.
2. Click slider to install extension.
3. Reload page.
4. Open extension settings.
5. Setze den Such-Ordner und die App-ID (siehe Anleitung unten).

[Search CSV]: https://extensions.gnome.org/extension/8227/csv-search-provider/

## App ID

This extension needs App ID of IDE. App ID is filename of `.desktop` files in:
- `/usr/share/applications/`
- `/var/lib/flatpak/exports/share/applications/`
- `~/.local/share/applications/`

You may use [Pins](https://flathub.org/apps/io.github.fabrialberio.pinapp) app to create app for custom script.
