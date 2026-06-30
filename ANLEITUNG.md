# Meisterprüfung Dachdecker — Lern-App

## Was ist das?
Eine kleine Web-App, die alle Prüfungsfragen aus den Word-Dateien
vorliest, eine Pause zum Antworten lässt und die Lösung vorliest.
Stephan bewertet selbst, ob er es wusste — die App zeigt ihm
nicht-gewusste Fragen häufiger.

**446 Fragen aus 30 Themenbereichen sind enthalten.**

## Inhalt des `app/`-Ordners
- `index.html` — die App selbst
- `questions.json` — die extrahierten Fragen
- `manifest.json`, `service-worker.js`, `icon-*.png` — für die iPhone-Installation

## Wie auf das iPhone bringen?

### Variante A: GitHub Pages (empfohlen, kostenlos)

1. **Account anlegen** auf https://github.com (kostenlos, 2 Min)
2. **Neues Repository** erstellen, z.B. „dachdecker-lernen", *public*
3. Auf den Button **„uploading an existing file"** klicken
4. Alle 6 Dateien aus dem `app/`-Ordner per Drag & Drop hochladen,
   commit
5. **Settings → Pages**: Source = „Deploy from a branch", Branch = `main`,
   Folder = `/ (root)`. Save.
6. Nach ein paar Minuten ist die App unter
   `https://DEINNAME.github.io/dachdecker-lernen/` erreichbar.
7. Stephan öffnet diese URL in **Safari** auf dem iPhone, tippt auf
   das Teilen-Symbol und wählt **„Zum Home-Bildschirm"**. Fertig —
   App-Icon liegt auf dem Homescreen.

### Variante B: Lokal testen (zur Vorschau auf dem PC)

```
cd app
python -m http.server 8765
```
Im Browser: http://localhost:8765

## Bedienung in der App

- **Themen wählen**: Häkchen setzen, welche Bereiche abgefragt werden
- **Modus**:
  - *Gemischt*: zufällige Auswahl aus allen gewählten Themen
  - *Nur fällige*: nur Fragen, die laut Lernplan dran sind
  - *Nur Vorlesen*: Hands-free — Frage + Antwort werden am Stück
    vorgelesen, danach automatisch zur nächsten Frage. Ideal für
    unterwegs auf der Baustelle ohne Bildschirmkontakt.
- **Quiz**:
  1. Frage wird vorgelesen
  2. Stephan antwortet laut (für sich)
  3. „Antwort anzeigen & vorlesen" tippen
  4. Selbstbewertung: Nein / Teils / Ja
- Falsche Fragen kommen nach 0–1 Tagen wieder, gewusste nach 3–14 Tagen
  (einfaches Spaced-Repetition)
- Lernfortschritt wird auf dem iPhone gespeichert (LocalStorage)

## AirPods / Bluetooth

Die Vorlese-Funktion läuft über jede Audio-Verbindung, die das
iPhone aktiv hat (AirPods, Auto, Bluetooth-Lautsprecher). Im
*Nur Vorlesen*-Modus muss er nicht auf den Bildschirm tippen.

## Wenn neue Fragen dazukommen

Neue oder geänderte DOCX-Datei in den Stephan-Ordner legen, dann:

```
python _extract.py
```

Das überschreibt `app/questions.json`. Diese eine Datei dann auf
GitHub neu hochladen — die App auf dem iPhone zieht das Update
automatisch.

## Wenn die `Bitumen`-Datei wieder als `.doc` (alt) kommt

Das Skript erwartet `.docx`. Konvertieren mit:

```
powershell -Command "..."
```
oder einfach in Word „Speichern unter → .docx".
