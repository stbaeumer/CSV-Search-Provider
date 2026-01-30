import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk'
import GLib from 'gi://GLib'
import {
  gettext as _,
  ExtensionPreferences
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

export default class CsvSearchProviderPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    let settings = this.getSettings()
    window._settings = settings

    let page = new Adw.PreferencesPage()
    window.add(page)

    let group = new Adw.PreferencesGroup({})
    page.add(group)

    let folderLabel = new Gtk.Label({
      label: settings.get_string('root') || _('No folder selected'),
      css_classes: ['dim-label'],
      ellipsize: 3,
      valign: Gtk.Align.CENTER
    })

    let folderRow = new Adw.ActionRow({
      title: _('Ordner mit CSV/TXT-Dateien auswählen')
    })

    let folderButton = new Gtk.Button({
      label: _('Auswählen'),
      valign: Gtk.Align.CENTER
    })

    let folderBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 12,
      valign: Gtk.Align.CENTER
    })
    folderBox.append(folderLabel)
    folderBox.append(folderButton)
    folderRow.add_suffix(folderBox)
    group.add(folderRow)

    folderButton.connect('clicked', () => {
      folderButton.set_sensitive(false)

      let dialog = new Gtk.FileChooserDialog({
        title: _('Ordner mit CSV/TXT-Dateien auswählen'),
        transient_for: window,
        action: Gtk.FileChooserAction.SELECT_FOLDER,
        modal: true
      })

      dialog.add_button(_('Abbrechen'), Gtk.ResponseType.CANCEL)
      dialog.add_button(_('Auswählen'), Gtk.ResponseType.ACCEPT)

      let currentFolder = settings.get_string('root')
      if (!currentFolder) {
        currentFolder = GLib.build_filenamev([GLib.get_home_dir(), '.csv-search-provider'])
      }
      if (currentFolder) {
        try {
          dialog.set_current_folder(Gtk.Gio.File.new_for_path(currentFolder))
        } catch (e) {}
      }

      dialog.connect('response', (dialog, response) => {
        import Adw from 'gi://Adw'
        import Gio from 'gi://Gio'
        import Gtk from 'gi://Gtk'
        import GLib from 'gi://GLib'
        import { gettext as _, ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

        export default class CsvSearchProviderPreferences extends ExtensionPreferences {
          fillPreferencesWindow(window) {
            let settings = this.getSettings()
            window._settings = settings

            let page = new Adw.PreferencesPage()
            window.add(page)

            let group = new Adw.PreferencesGroup({})
            page.add(group)

            let folderLabel = new Gtk.Label({
              label: settings.get_string('root') || _('No folder selected'),
              css_classes: ['dim-label'],
              ellipsize: 3,
              valign: Gtk.Align.CENTER
            })

            let folderRow = new Adw.ActionRow({
              title: _('Ordner mit CSV/TXT-Dateien auswählen')
            })

            let folderButton = new Gtk.Button({
              label: _('Auswählen'),
              valign: Gtk.Align.CENTER
            })

            let folderBox = new Gtk.Box({
              orientation: Gtk.Orientation.HORIZONTAL,
              spacing: 12,
              valign: Gtk.Align.CENTER
            })
            folderBox.append(folderLabel)
            folderBox.append(folderButton)
            folderRow.add_suffix(folderBox)
            group.add(folderRow)

            folderButton.connect('clicked', () => {
              folderButton.set_sensitive(false)

              let dialog = new Gtk.FileChooserDialog({
                title: _('Ordner mit CSV/TXT-Dateien auswählen'),
                transient_for: window,
                action: Gtk.FileChooserAction.SELECT_FOLDER,
                modal: true
              })

              dialog.add_button(_('Abbrechen'), Gtk.ResponseType.CANCEL)
              dialog.add_button(_('Auswählen'), Gtk.ResponseType.ACCEPT)

              let currentFolder = settings.get_string('root')
              if (!currentFolder) {
                currentFolder = GLib.build_filenamev([GLib.get_home_dir(), '.csv-search-provider'])
              }
              if (currentFolder) {
                try {
                  dialog.set_current_folder(Gtk.Gio.File.new_for_path(currentFolder))
                } catch (e) {}
              }

              dialog.connect('response', (dialog, response) => {
                if (response === Gtk.ResponseType.ACCEPT) {
                  let folder = dialog.get_file()
                  let path = folder.get_path()
                  settings.set_string('root', path)
                  folderLabel.set_text(path)
                }
                folderButton.set_sensitive(true)
                dialog.close()
              })
              dialog.present()
            })

            settings.connect('changed::root', () => {
              let path = settings.get_string('root')
              folderLabel.set_text(path || _('No folder selected'))
            })

            // Hinweise zur Nutzung anzeigen
            let infoGroup = new Adw.PreferencesGroup({})
            page.add(infoGroup)

            let infoLabel = new Gtk.Label({
              label: _('Hinweise zur Nutzung:') + '\n\n' +
                _('1. Wähle einen Ordner aus, in dem deine CSV- oder TXT-Dateien liegen.') + '\n\n' +
                _('2. Lege dort eine oder mehrere CSV/TXT-Dateien ab.\n   Jede Zeile muss zwei Spalten enthalten:') + '\n   - Spalte 1 = Suchtext\n   - Spalte 2 = URL (getrennt durch |)\n\nBeim Klick auf ein Suchergebnis wird die URL geöffnet.'),
              wrap: true,
              margin_start: 12,
              margin_end: 12,
              margin_top: 12,
              xalign: 0
            })
            infoGroup.add(infoLabel)
          }
        }