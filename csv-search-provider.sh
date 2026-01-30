#!/bin/bash
# csv-search-provider.sh
# Installiert, aktiviert oder deinstalliert die Extension stbaeumer.github.com

EXT_ID="csv-search-provider@stbaeumer.github.com"
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
  gnome-extensions enable "$EXT_ID"
  echo "Extension installiert und aktiviert."
}

function uninstall_extension() {
  echo "Deinstalliere Extension ..."
  gnome-extensions disable "$EXT_ID"
  gnome-extensions uninstall "$EXT_ID"
  rm -rf "$EXT_DEST"
  echo "Extension deinstalliert."
}

case "$1" in
  install)
    install_extension
    ;;
  uninstall)
    uninstall_extension
    ;;
  *)
    echo "Verwendung: $0 {install|uninstall}"
    exit 1
    ;;
esac
