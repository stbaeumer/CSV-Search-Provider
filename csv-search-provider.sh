#!/bin/bash
# csv-search-provider.sh
# Installiert, aktiviert oder deinstalliert die Extension stbaeumer.github.com
# Parameter: install | uninstall | debug

EXT_ID="csv-search-provider@stbaeumer.github.com"
# ...existing code...
EXT_SRC="$(dirname "$0")"
EXT_DEST="$HOME/.local/share/gnome-shell/extensions/$EXT_ID"

function install_extension() {
  echo "Installiere Extension nach $EXT_DEST ..."
  rm -rf "$EXT_DEST"
  mkdir -p "$EXT_DEST"
  cp -r "$EXT_SRC"/* "$EXT_DEST"/
  # Schema kompilieren, falls vorhanden
  if [ -d "$EXT_DEST/schemas" ]; then
    glib-compile-schemas "$EXT_DEST/schemas"
  fi
  gnome-extensions disable "$EXT_ID" 2>/dev/null
  gnome-extensions enable "$EXT_ID"
  echo "Extension installiert und aktiviert."
  echo "Melde GNOME-Sitzung ab ..."
  gnome-session-quit --no-prompt
}

function uninstall_extension() {
  echo "Deinstalliere Extension ..."
  gnome-extensions disable "$EXT_ID"
  gnome-extensions uninstall "$EXT_ID"
  rm -rf "$EXT_DEST"
  echo "Extension deinstalliert."
  echo "Melde GNOME-Sitzung ab ..."
  gnome-session-quit --no-prompt
}

function debug_extension() {
  echo "--- Extension-Ordner: $EXT_DEST ---"
  ls -l "$EXT_DEST"
  echo
  echo "--- metadata.json ---"
  cat "$EXT_DEST/metadata.json"
  echo
  # Lies den Suchordner aus den Extension-Settings
  SUCHORDNER=$(gsettings get org.gnome.shell.extensions.csv-search-provider root | sed -e "s/^'//" -e "s/'$//")
  if [ -z "$SUCHORDNER" ] || [ "$SUCHORDNER" = "" ]; then
    SUCHORDNER="$HOME/Downloads"
  fi
  echo "--- CSV/TXT-Dateien im Suchordner: $SUCHORDNER ---"
  find "$SUCHORDNER" -maxdepth 1 -type f \( -iname '*.csv' -o -iname '*.txt' \) -exec ls -lh {} +
  echo
  echo "--- Suche nach 'Silvester' in $SUCHORDNER ---"
  ERGEBNIS=$(grep -i 'Silvester' "$SUCHORDNER"/*.csv "$SUCHORDNER"/*.txt 2>/dev/null)
  if [ -n "$ERGEBNIS" ]; then
    echo "$ERGEBNIS"
  else
    echo "Nicht gefunden"
  fi
  echo
  echo "--- gnome-shell --version ---"
  gnome-shell --version
  echo
  echo "--- Icons ls -la \"$(dirname \"$0\")/icons/\"---"
  ls -la "$(dirname "$0")/icons/"
  echo
  echo "--- Icons ~/.local/share/gnome-shell/extensions/csv-search-provider@stbaeumer.github.com/icons/ ---"
  ls -la ~/.local/share/gnome-shell/extensions/csv-search-provider@stbaeumer.github.com/icons/
  echo
  echo "--- Check if extension is loaded ---"
  gnome-extensions list | grep -q csv-search-provider || echo "nicht installiert"
  echo
  echo "--- Check extension status ---"
  gnome-extensions info csv-search-provider@stbaeumer.github.com
  echo
  echo "--- GNOME Shell Log (journalctl /usr/bin/gnome-shell -f, STRG+C zum Beenden) ---"
  journalctl -f _EXE=/usr/bin/gnome-shell | grep -i csv
}

case "$1" in
  install)
    install_extension
    ;;
  uninstall)
    uninstall_extension
    ;;
  debug)
    debug_extension
    ;;
  *)
    echo "Verwendung: $0 {install|uninstall|debug}"
    exit 1
    ;;
esac

