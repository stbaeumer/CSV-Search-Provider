import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import { overview } from 'resource:///org/gnome/shell/ui/main.js'
import Shell from 'gi://Shell'
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'

class CsvSearchProvider {
  constructor(extension) {
    this.extension = extension
    this.entries = this.#indexFiles()
  }

  #getSearchFolder() {
    // Hole den vom Nutzer gewählten Ordner aus den Einstellungen
    let settings = this.extension.getSettings()
    let folder = settings.get_string('root')
    if (!folder) {
      // Fallback auf Standardordner
      folder = GLib.build_filenamev([GLib.get_home_dir(), '.csv-search-provider'])
    }
    return folder
  }

  #indexFiles() {
    let entries = []
    let dir = Gio.File.new_for_path(this.#getSearchFolder())
    let enumerator
    try {
      enumerator = dir.enumerate_children('standard::name,standard::type', Gio.FileQueryInfoFlags.NONE, null)
      let info
      while ((info = enumerator.next_file(null)) !== null) {
        let name = info.get_name()
        if (
          info.get_file_type() === Gio.FileType.REGULAR &&
          (name.endsWith('.txt') || name.endsWith('.csv'))
        ) {
          let file = dir.get_child(name)
          let [ok, contents] = file.load_contents(null)
          if (ok) {
            let lines = imports.byteArray.toString(contents).split('\n')
            let container = name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
            for (let line of lines) {
              let [title, url] = line.split('|')
              if (title && url) {
                entries.push({
                  container,
                  title: title.trim(),
                  url: url.trim()
                })
              }
            }
          }
        }
      }
      enumerator.close(null)
    } catch (e) {
      log('CSV-Search-Provider Fehler: ' + e)
    }
    return entries
  }

  getInitialResultSet(terms) {
    return this.getSubsearchResultSet(this.entries, terms)
  }

  getSubsearchResultSet(previousResults, terms) {
    let results = previousResults
    for (let term of terms) {
      let lower = term.toLowerCase()
      results = results.filter(entry => entry.title.toLowerCase().includes(lower))
    }
    return results
  }

  getResultMetas(results) {
    return results.map(entry => ({
      id: entry.url,
      name: entry.title,
      description: entry.container
    }))
  }

  activateResult(url) {
    try {
      Gio.AppInfo.launch_default_for_uri(url, null)
    } catch (e) {
      log('CSV-Search-Provider Fehler beim Öffnen der URL: ' + e)
    }
  }
}

export default class CsvSearchProviderExtension extends Extension {
  #provider = null

  enable() {
    this.#provider = new CsvSearchProvider(this)
    overview.searchController.addProvider(this.#provider)
  }

  disable() {
    if (this.#provider) {
      overview.searchController.removeProvider(this.#provider)
      this.#provider = null
    }
  }
}
