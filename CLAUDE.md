# Projekt Stephan – Lern-PWA für die Dachdecker-Meisterprüfung

## Projektkontext

Dies ist eine PWA (Progressive Web App) zum Vorbereiten auf die Meisterprüfung
im Dachdeckerhandwerk. Endnutzer ist **Stephan**, ein Freund von Phil. Die App
soll vor allem **während der Arbeit über AirPods** genutzt werden — Fragen
werden vorgelesen, Antworten per Sprache gegeben.

- **Zielgerät**: iPhone (Safari + Homescreen-Installation als PWA)
- **Hosting**: GitHub Pages, Repo `HarveyHayes/Stephan`
- **Live-URL**: https://harveyhayes.github.io/Stephan/
- **Kein App Store, kein Apple-Developer-Account**, keine native iOS-App.

## Verzeichnisstruktur

```
Stephan/
├── *.docx, *.pdf       Quelldaten: 20 Prüfungsfragen-Kataloge (Word + PDF)
├── _extract.py         DOCX → questions.json (Farbe-basierte Q/A-Extraktion)
├── _icons.py           Generiert App-Icons (PNG)
├── _analyse.py         Debug-Tool für DOCX-Inspektion
├── _inspect.py         Debug-Tool für Farbe/Run-Analyse
├── app/                Die deploy-bare PWA
│   ├── index.html      Komplette App (HTML+CSS+JS in einer Datei)
│   ├── questions.json  Generiert aus DOCX, ~260 Fragen
│   ├── manifest.json
│   ├── service-worker.js
│   ├── icon-192.png
│   ├── icon-512.png
│   └── ANLEITUNG.md
├── ARCHITECTURE.md     Architektur-Dokumentation
├── CLAUDE.md           Diese Datei
└── ../Stephan-repo/    Lokal geklontes GitHub-Repo (Push-Ziel)
```

`Stephan-repo/` ist das Git-Repo. `app/` ist die Arbeitskopie. **Vor jedem
Push: `app/`-Dateien nach `Stephan-repo/` kopieren, dann committen+pushen.**

## Workflow für Änderungen

1. **Datei in `app/` ändern** (nie direkt in `Stephan-repo/`)
2. **Syntax-Check** für `index.html`:
   ```bash
   python -c "import sys, io; sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8'); \
     s=open(r'app/index.html', encoding='utf-8').read(); \
     start=s.find('<script>')+len('<script>'); end=s.find('</script>'); \
     sys.stdout.write(s[start:end])" > /tmp/check.js && node --check /tmp/check.js
   ```
3. **Datei in Repo kopieren und pushen**:
   ```bash
   cp app/<file> ../Stephan-repo/<file>
   cd ../Stephan-repo
   git add <file>
   git -c user.name="HarveyHayes" -c user.email="phil.krauss@gmail.com" \
     commit -m "<message>"
   git push
   ```
4. **Cache-Version hochzählen** (wenn Service-Worker oder index.html geändert):
   - `service-worker.js`: `meister-lernen-vN` → `vN+1`
   - `index.html`: dieselbe Cache-Version im SW-Reg-Code aktualisieren
5. **Nach Push warten**, bis live (~30–60s):
   ```bash
   curl -s https://harveyhayes.github.io/Stephan/index.html | grep <neue-zeile>
   ```

## Pflicht-Checks vor Push

- [ ] **JS-Syntax**: `node --check` über extrahierten Script-Block laufen lassen.
  Frühere Bugs entstanden durch vermischte Anführungszeichen `"…„X""` —
  das schließende `"` beendete den String unbeabsichtigt.
- [ ] **Strings mit `„…"`**: Wenn der String mit `"` umschlossen ist und
  deutsche Anführungszeichen enthält, **mit `'` oder Backticks** umschließen.
- [ ] **Service-Worker-Cache-Version** hochgezählt, falls App-Logik geändert.

## Datenextraktion (DOCX → questions.json)

Siehe `_extract.py`. Wichtige Heuristiken:
- Schriftfarbe **rot (≥50% der Zeichen rot)** = Antwortzeile, **schwarz** = Frage
- Pro Datei wird automatisch erkannt, ob "rot=Antwort" (Standard) oder
  "rot=Frage" gilt (`detect_red_role`) — das Schema variiert pro Datei
- Tabellen werden extra behandelt (Spalte 1 = Begriff, Spalte 2 = Erklärung)
- Bei Änderungen an Quelldaten: `python _extract.py` erneut laufen lassen,
  dann `app/questions.json` und `Stephan-repo/questions.json` aktualisieren

Eine Datei (`Bitumen-Abkuerzungen ... .doc`) liegt im alten .doc-Format und
muss vorher mit Word zu .docx konvertiert werden (siehe Bash-Skript zur
Word-COM-Automation in der Historie).

## Stand der Funktionen

- ✅ Lernmodus (Hands-free Vorlesen, Reihenfolge oder zufällig)
- ✅ Testmodus (Voice-Steuerung: „weiter", „antwort", „ja/teils/nein", „nochmal")
- ✅ Statistik-Tab (pro Kategorie, schwächste Fragen, neue Fragen)
- ✅ Einstellungen (Stimmenwahl, Geschwindigkeit, Cache-Reset)
- ✅ Diagnose-Banner für JS-Fehler (sichtbar ohne F12)
- ✅ Aussprache-Vorverarbeitung für Abkürzungen + Einheiten
- ✅ Spaced-Repetition (lokal in localStorage)

## Einstellungen / GitHub-Auth

- `gh` CLI installiert: `C:/Program Files/GitHub CLI/gh.exe`
- Eingeloggt als **HarveyHayes** (`phil.krauss@gmail.com`)
- Token-Scopes: `repo`, `workflow`
- Kein gespeicherter Token im Projekt — Auth läuft über `gh`

## Nicht-Funktionale Hinweise

- **Browser-Support**: iPhone Safari ist primär; Chrome auf iPhone hat
  KEINE Spracherkennung (Web Speech Recognition fehlt) und nutzt nicht
  die Premium-Siri-Stimmen — nur in Safari.
- **Offline**: Service-Worker ist `network-first`, fällt auf Cache zurück.
- **Daten privat**: Alles läuft im Browser, keine Server-Komponente.
