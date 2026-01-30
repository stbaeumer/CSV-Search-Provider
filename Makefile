.PHONY: test clean build local

po/csv-search-provider.pot: prefs.js
	xgettext -o po/csv-search-provider.pot prefs.js
po/csv-search-provider.pot: prefs.js
	xgettext -o po/csv-search-provider.pot prefs.js

test: build

clean:
	rm -f *.zip

build: clean po/csv-search-provider.pot
build: clean po/csv-search-provider.pot
	gnome-extensions pack --extra-source=./provider.js ./

local: build
	gnome-extensions install -f *.zip

debug: local
	dbus-run-session -- gnome-shell --nested --wayland
