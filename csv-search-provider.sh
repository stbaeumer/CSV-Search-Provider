#!/bin/bash
# csv-search-provider.sh
# Installiert, aktiviert oder deinstalliert die Extension
# Parameter: install | uninstall | debug

EXT_ID="csv-search-provider@stbaeumer.github.com"
EXT_SRC="$(dirname "$0")"
EXT_DEST="$HOME/.local/share/gnome-shell/extensions/$EXT_ID"
DATA_DIR="$HOME/.csv-search-provider"

function install_extension() {
  echo "Installiere Extension nach $EXT_DEST ..."
  rm -rf "$EXT_DEST"
  mkdir -p "$EXT_DEST"
  mkdir -p "$DATA_DIR"
  cp -r "$EXT_SRC"/* "$EXT_DEST"/ 2>/dev/null || true
  rm -f "$EXT_DEST/csv-search-provider.sh"
  gnome-extensions disable "$EXT_ID" 2>/dev/null
  gnome-extensions enable "$EXT_ID"
  echo "Extension installiert und aktiviert."
  echo "Datendirectory erstellt: $DATA_DIR"
  echo "Bitte gnome-shell neustarten oder abmelden und anmelden."
}

function uninstall_extension() {
  echo "Deinstalliere Extension ..."
  gnome-extensions disable "$EXT_ID" 2>/dev/null
  gnome-extensions uninstall "$EXT_ID" 2>/dev/null
  rm -rf "$EXT_DEST"
  echo "Extension deinstalliert."
  echo "Bitte gnome-shell neustarten oder abmelden und anmelden."
}

function debug_extension() {
  echo "--- Extension-Ordner: $EXT_DEST ---"
  ls -l "$EXT_DEST" 2>/dev/null || echo "Nicht installiert"
  echo
  echo "--- metadata.json ---"
  cat "$EXT_DEST/metadata.json" 2>/dev/null || echo "Nicht gefunden"
  echo
  echo "--- Daten-Verzeichnis: $DATA_DIR ---"
  ls -lh "$DATA_DIR" 2>/dev/null || echo "Verzeichnis existiert nicht"
  echo
  echo "--- CSV/TXT-Dateien in $DATA_DIR ---"
  find "$DATA_DIR" -maxdepth 1 -type f \( -iname '*.csv' -o -iname '*.txt' \) -exec ls -lh {} + 2>/dev/null || echo "Keine Dateien gefunden"
  echo
  echo "--- Icons in $DATA_DIR ---"
  ls -lh "$DATA_DIR"/*.png "$DATA_DIR"/*.svg 2>/dev/null || echo "Keine Icons gefunden"
  echo
  echo "--- gnome-shell --version ---"
  gnome-shell --version
  echo
  echo "--- Extension Status ---"
  gnome-extensions info "$EXT_ID" 2>/dev/null || echo "Extension nicht installiert"
  echo
  echo "--- GNOME Shell Logs (letzte 20 Zeilen mit 'csv-search-provider') ---"
  journalctl -n 50 -o cat /usr/bin/gnome-shell 2>/dev/null | grep -i csv-search-provider | tail -20
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