#!/bin/bash
# csv-search-provider.sh
# Installs, activates, or uninstalls the extension
# Parameters: install | uninstall | debug

EXT_ID="csv-search-provider@stbaeumer.github.com"
EXT_SRC="$(dirname "$0")"
EXT_DEST="$HOME/.local/share/gnome-shell/extensions/$EXT_ID"

function install_extension() {
  echo "Installing extension to $EXT_DEST ..."
  rm -rf "$EXT_DEST"
  mkdir -p "$EXT_DEST"
  cp -r "$EXT_SRC"/* "$EXT_DEST"/ 2>/dev/null || true
  rm -f "$EXT_DEST/csv-search-provider.sh"
  
  # Remove old data directory if it exists
  OLD_DATA_DIR="$HOME/.csv-search-provider"
  if [ -d "$OLD_DATA_DIR" ]; then
    echo "Removing old data directory: $OLD_DATA_DIR"
    rm -rf "$OLD_DATA_DIR"
  fi
  
  gnome-extensions disable "$EXT_ID" 2>/dev/null
  gnome-extensions enable "$EXT_ID"
  echo "Extension installed and activated."
  echo "CSV/TXT files can be placed in $EXT_DEST."
  echo "Please restart gnome-shell or log out and log back in."
  echo "Please activate the extension in the GNOME Extensions app or using the gnome-extensions command."
}

function uninstall_extension() {
  echo "Uninstalling extension ..."
  gnome-extensions disable "$EXT_ID" 2>/dev/null
  gnome-extensions uninstall "$EXT_ID" 2>/dev/null
  rm -rf "$EXT_DEST"
  echo "Extension uninstalled."
  echo "Please restart gnome-shell or log out and log back in."
}

function debug_extension() {
  echo "--- Extension directory: $EXT_DEST ---"
  ls -l "$EXT_DEST" 2>/dev/null || echo "Not installed"
  echo
  echo "--- metadata.json ---"
  cat "$EXT_DEST/metadata.json" 2>/dev/null || echo "Not found"
  echo
  echo "--- CSV/TXT files in extension directory ---"
  find "$EXT_DEST" -maxdepth 1 -type f \( -iname '*.csv' -o -iname '*.txt' \) -exec ls -lh {} + 2>/dev/null || echo "No files found"
  echo
  echo "--- Icons in extension directory ---"
  ls -lh "$EXT_DEST"/icons/*.png "$EXT_DEST"/icons/*.svg 2>/dev/null || echo "No icons found"
  echo
  echo "--- gnome-shell --version ---"
  gnome-shell --version
  echo
  echo "--- Extension status ---"
  gnome-extensions info "$EXT_ID" 2>/dev/null || echo "Extension not installed"
  echo
  echo "--- GNOME Shell logs (last 20 lines with 'csv-search-provider') ---"
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
    echo "Usage: $0 {install|uninstall|debug}"
    exit 1
    ;;
esac