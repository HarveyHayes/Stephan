# Architektur — Lern-PWA Dachdecker-Meisterprüfung

## Überblick

Statische, clientseitige PWA. Eine HTML-Datei + JSON + Service-Worker. Kein
Backend, keine Build-Pipeline, keine Frameworks. Bewusst simpel gehalten,
damit auch in 5 Jahren ohne Toolchain wartbar.

```
┌──────────────────────────────────────────────────────────────┐
│  iPhone Safari (oder Chrome am PC)                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  index.html (HTML+CSS+JS in 1 Datei, ~46 KB)            │ │
│  │  ├─ UI-Schichten (Tabs: Lernen, Statistik, ⚙)           │ │
│  │  ├─ Voice-Engine (Web Speech: TTS + Recognition)        │ │
│  │  ├─ Spaced-Repetition-Logik (in-memory)                 │ │
│  │  └─ State (localStorage)                                │ │
│  └─────────────────────────────────────────────────────────┘ │
│             ↓ fetch                       ↓ caches API       │
│  ┌─────────────────────┐    ┌──────────────────────────┐    │
│  │  questions.json     │    │  service-worker.js       │    │
│  │  ~91 KB, 259 Q&A    │    │  network-first cache     │    │
│  └─────────────────────┘    └──────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                                ↑
                                │ HTTPS
                                │
┌───────────────────────────────────────────┐
│  GitHub Pages                             │
│  HarveyHayes/Stephan @ main               │
│  Source: / (root)                         │
└───────────────────────────────────────────┘
                                ↑
                                │ git push
                                │
┌───────────────────────────────────────────┐
│  Lokaler Build & Push                     │
│                                           │
│  Stephan/                                 │
│   ├─ *.docx ──► _extract.py ──► JSON     │
│   └─ app/* ──► copy ──► Stephan-repo/    │
│                                  │         │
│                                  ▼         │
│                              git push      │
└───────────────────────────────────────────┘
```

## Komponenten

### 1. Datenextraktion (`_extract.py`)
- Liest Word-Dokumente (`python-docx`).
- Pro Datei: `detect_red_role()` ermittelt heuristisch, ob rote Schrift
  Fragen oder Antworten markiert (Schemata variieren).
- `paragraph_is_red()`: rot, wenn ≥50% der Zeichen rot sind (toleriert
  schwarze Bullet-Marker vor rotem Text).
- Erkennt versteckte Folgefragen in Antwort-Blöcken (Frage-Wörter +
  Fragezeichen).
- Tabellen werden eigens behandelt (`extract_from_tables`).
- Output: `app/questions.json` als Array `[{kategorie, frage, antworten[]}]`.

### 2. UI-Schichten in `index.html`

**Screens** (CSS-Klasse `.screen.active` → einer sichtbar):
- `screen-start` — Modusauswahl, Themenauswahl, Start-Button
- `screen-quiz` — laufende Sitzung
- `screen-end` — Endbildschirm
- `screen-statistik` — Auswertung pro Kategorie + Listen
- `screen-einstellungen` — Stimme, Tempo, Cache, Diagnose

**Tabs** (`#tabs`) erlauben Wechsel zwischen Start, Statistik, Einstellungen.
Während einer aktiven Session sind die Tabs **gesperrt** (siehe Tab-Handler).

### 3. Modi
- `MODE = "lernen"` — Frage + Lösung am Stück vorgelesen, Auto-Next.
  Sub-Option `LERNEN_ORDER`: `random` | `sequential`.
- `MODE = "test"` — Frage vorgelesen, dann auf Sprachbefehl reagieren.
  Sub-Option `TEST_FILTER`: `random` | `due` | `weak`.

### 4. Voice-Engine

**TTS** (Sprachausgabe):
- `pickGermanVoice()` wählt: User-Wahl > Siri (iOS Premium) > Anna/Helena/etc.
  > erste deutsche Stimme.
- `preprocessForSpeech(text)` ersetzt:
  - Einheiten: `W/(m²K)` → "Watt pro Quadratmeter Kelvin"
  - Abkürzungen über `ABBREV_MAP`: `PYE` → "P Y E"
  - Großbuchstaben-Wörter (3–6 Zeichen): einzeln buchstabieren
  - Slashes, Kommas in Zahlen, Grad-Zeichen
- `speak(text, {rate, onEnd, raw})` setzt Stimme + globale Rate `SPEECH_RATE`.

**Spracherkennung**:
- `webkitSpeechRecognition`, deutsch, einzelne Aufnahmen
  (`continuous: false` — iOS unterstützt continuous unzuverlässig).
- `scheduleRestart()` startet das Mikrofon nach jeder Erkennung neu, sobald
  TTS fertig ist. Damit ist hands-free möglich.
- `handleVoiceCommand(alts)`: Phrasen-Matching gegen feste Befehlslisten
  ("weiter", "antwort", "ja/teils/nein", "nochmal", "stopp" + Synonyme).
- Visueller Mic-Status in `#voice-bar` mit Pulsation während des Hörens.

### 5. Spaced-Repetition (sehr simpel)

Pro Frage: `{seen, good, right, partial, wrong, lastSeen}` in `STATE.items`.
- `good` wächst bei "ja", sinkt bei "nein", bleibt bei "teils".
- `dueDate(item)`: `lastSeen + intervals[good] * Tage`,
  `intervals = [0,1,3,7,14,30]`.
- `isDue(q)`: noch nie gesehen ODER `Date.now() >= dueDate`.
- `weakScore(q)`: Anteil "wrong" + `1/(good+1)` → höher = bevorzugen.

### 6. Persistenz

- `localStorage["stephan-lernen-v1"]` → Lernstand (`STATE`)
- `localStorage["stephan-settings"]` → Stimme + Tempo
- Keine externe Datenbank, kein Login.

### 7. Service-Worker

- `meister-lernen-vN` mit hochzählender Versionsnummer.
- **Network-first**: immer frisch laden, Fallback nur bei Offline.
- Beim Aktivieren werden alte Caches gelöscht.
- Beim Boot der App werden alte Versionen ebenfalls verworfen.

## Browser-Kompatibilität

| Feature             | iPhone Safari | iPhone Chrome | Desktop Chrome  | Desktop Firefox |
|---------------------|--------------|---------------|-----------------|-----------------|
| TTS (Web Speech)    | ✅ + Siri    | ⚠ nur Anna   | ✅ System-Voice | ✅              |
| Spracherkennung     | ✅           | ❌            | ✅              | ❌              |
| PWA Installation    | ✅ (Teilen)  | ✅ (Menü)    | ✅              | ⚠ teilweise     |
| Service Worker      | ✅           | ✅            | ✅              | ✅              |

Empfehlung an User: **iPhone Safari** für volle Funktionalität.

## Häufige Fallstricke (Lessons learned)

1. **Anführungszeichen-Konflikt in JS-Strings**: deutsche `„…"` zusammen mit
   ASCII-`"` als String-Delimiter führt zu Syntax-Fehlern (das schließende
   Zeichen ist in beiden Stilen das gleiche `"`). → IMMER `'` oder Backticks
   verwenden, wenn `„…"` im String vorkommt. **Pflicht-Check**: `node --check`
   vor jedem Push.

2. **Service-Worker-Cache klebt**: alte SW-Versionen liefern hartnäckig
   alte Inhalte, auch nach Hard-Reload. Lösung: User über ⚙ → "Cache leeren"
   oder Browser-DevTools → Application → "Clear site data".

3. **iOS Mikrofon-Permission**: Beim allerersten Voice-Befehl muss der
   User einmal in der Sitzung den Bildschirm berührt haben. Wir triggern
   das mit `getUserMedia({audio:true})` direkt nach dem Klick auf "Lernen
   starten", damit der Permission-Dialog sofort erscheint.

4. **Stimmen-Liste ist lazy**: `speechSynthesis.getVoices()` ist zunächst
   leer, wird über `onvoiceschanged` befüllt. `pickGermanVoice()` wird
   sowohl initial als auch bei diesem Event aufgerufen.

5. **Chrome auf iOS** ist faktisch Safari im Hintergrund, hat aber
   beschränkten Zugriff auf Sprach-APIs. Für die App ist Safari deutlich
   besser.

## Was bewusst NICHT da ist

- Keine Server-Komponente, kein Login, keine Cloud-Sync zwischen Geräten.
- Keine Build-Pipeline (Webpack/Vite/etc.) — pure HTML/JS/CSS.
- Keine UI-Library (kein React/Vue) — Vanilla DOM.
- Keine KI-API-Integration — Antwortbewertung läuft per Selbstbewertung
  („wusste ich" / „teils" / „nein"), nicht über NLP-Vergleich. Bewusst,
  weil verlässlich, kostenlos und offline-fähig.
- Kein Test-Framework — manuelles Testen im Browser.

Wenn diese Beschränkungen mal nicht mehr passen, sind das die Stellen für
den nächsten Architektur-Schritt:
- Cloud-Sync → Supabase oder Firebase, würde Login einführen.
- KI-Antwortvergleich → Anthropic API mit API-Key serverseitig (kleine
  Edge-Function oder Worker), pro Antwort ~1c Kosten.
