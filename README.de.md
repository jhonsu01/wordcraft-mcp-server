<p align="center"><img src="icon.png" width="120" alt="WordCraft-Bridge-Symbol"></p>

<h1 align="center">WordCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <b>Deutsch</b> · <a href="README.ru.md">Русский</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  Lass Claude Dokumente mit dem auf deinem Computer installierten <b>WordCraft</b> schreiben und bearbeiten — <b>Windows, macOS und Linux</b>:<br>
  Berichte, Briefe und Lebensläufe, Suchen und Ersetzen, Kommentare und Änderungsverfolgung, Serienbriefe sowie DOCX, PDF, ODT, RTF, HTML, Markdown und LaTeX.
</p>

---

## Warum

[WordCraft](https://github.com/storytold/wordcraft) ist eine quelloffene Textverarbeitung der Word-Klasse, geschrieben in Rust, mit einer CLI ohne Oberfläche (`wordcraft-cli`), 615 Befehlen, Unterstützung für DOCX / ODT / RTF / PDF und einem MCP-Modus. Dieser [Model Context Protocol](https://modelcontextprotocol.io)-Server macht aus dieser Engine **Datei-rein / Datei-raus-Werkzeuge** für Claude, sodass du zum Beispiel fragen kannst:

> *„Schreib einen dreiseitigen Quartalsbericht mit Inhaltsverzeichnis, einer Umsatztabelle, diesem Diagramm und Seitenzahlen, als DOCX und PDF."*
> *„Ändere in `vertrag.docx` 'ACME GmbH' in 'ACME AG' mit Änderungsverfolgung und füge einen Kommentar zur Zahlungsklausel hinzu."*
> *„Erstelle für jeden Kunden in `kunden.xlsx` einen Brief mit Name und Stadt."*
> *„Nimm alle Änderungen in jedem Dokument in `D:\Verträge` an und exportiere sie als PDF."*
> *„Wandle diese Markdown-Notizen in Word um und dieses Word-Dokument in LaTeX."*

Geschwister von [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server) und [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## Plattformen

| Betriebssystem | Zu installierendes WordCraft-Paket | Wo der Server es findet (ohne Einrichtung) | Status |
| --- | --- | --- | --- |
| **Windows** 10/11 (x64, x86, arm64) | MSI oder portables Zip | `C:\Program Files\WordCraft`, `%LOCALAPPDATA%\Programs\WordCraft`, `PATH` | ✅ Geprüft (Windows 11) |
| **Linux** (x86_64, aarch64, riscv64) | `.deb`, `.rpm` oder `.tar.gz` | `/usr/bin`, `/usr/local/bin`, `/opt/wordcraft/bin`, `~/.local/bin`, `PATH` | ✅ Geprüft (Debian 12, ohne Oberfläche) |
| **macOS** 11+ (Apple Silicon und Intel) | `.dmg` (die App) **plus** `wordcraft-cli-<version>-macos-universal.zip` | `/Applications/WordCraft.app`, `/usr/local/bin`, `/opt/homebrew/bin`, `~/.local/bin`, `~/bin`, `PATH` | 🟡 Unterstützt, noch nicht auf einem Mac getestet |

Alle Downloads: [WordCraft-Releases](https://github.com/storytold/wordcraft/releases) (es gibt auch ein FreeBSD-tar.gz; setzen Sie `WORDCRAFT_DIR` darauf). An jedem anderen Ort: `WORDCRAFT_DIR` (Ordner, `.tar.gz`-Wurzel oder `WordCraft.app`) oder `WORDCRAFT_CLI` setzen.

- **macOS:** Das DMG enthält nur die App. Entpacken Sie das separate `wordcraft-cli`-Zip und verschieben Sie `wordcraft-cli` nach `/usr/local/bin` (oder setzen Sie `WORDCRAFT_CLI` darauf). Beim ersten Start wird Apples Notarisierung online geprüft.
- **Linux:** AppImage und Flatpak enthalten nur die App, nicht `wordcraft-cli`; verwenden Sie deb, rpm oder tar.gz. Für eine AppImage-App setzen Sie `WORDCRAFT_APP`, damit `open_in_wordcraft` sie starten kann. Auf einem Server ohne GPU nutzte die geprüfte Einrichtung `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`.

## Funktionsweise

| Teil | Was es ist |
| --- | --- |
| **WordCraft-Engine** (`wordcraft-cli mcp`) | WordCrafts eigene Engine: Seitenlayout, Formatvorlagen, Listen, Tabellen, Felder, Verweise, Überarbeitung, Sendungen und die Writer für DOCX / PDF / ODT / RTF / HTML / Markdown / LaTeX. Für jeden Auftrag frisch und **ohne Oberfläche** gestartet, sodass sie nie die WordCraft-App oder ein geöffnetes Dokument berührt. |
| **MCP-Server** (Node.js) | 11 übergeordnete Werkzeuge. Baut Dokumente aus einer einfachen Liste von Blöcken (Überschriften, Absätze, Listen, Tabellen, Bilder, Inhaltsverzeichnis, Fußnoten), hält den Cursor zwischen den Blöcken an der richtigen Stelle und prüft jede Ausgabe vorab: WordCraft selbst würde vorhandene Dateien stillschweigend ersetzen. |
| **Live-App** (optional) | `open_in_wordcraft control=true` startet die App mit ihrem nur lokalen Steuerkanal (Port 7985) und `run_wordcraft_commands live=true` steuert sie. Schließe die App, wenn du fertig bist. |

## Werkzeuge

| Werkzeug | Was es tut |
| --- | --- |
| `create_document` | Ein neues Dokument, leer oder aus den Vorlagen Brief / Lebenslauf / Bericht / Beispiel, aufgebaut aus Blöcken: Überschriften 1–9, Absätze (Formatvorlage, Ausrichtung, fett, kursiv, unterstrichen, Schrift, Größe, Farbe, Hervorhebung), Aufzählungen und nummerierte Listen, Tabellen (Kopfzeile, Formatvorlage, Beschriftung), Bilder (Breite, Alternativtext, Beschriftung), Seitenumbrüche, Inhaltsverzeichnis und Fußnoten; Seitenformat, Ausrichtung, Ränder, Kopfzeile, Fußzeile, Seitenzahlen und Eigenschaften. Liefert eine Vorschau von Seite 1 |
| `edit_document` | Ein Dokument, eine Liste oder ein Ordner: Suchen / Ersetzen (Groß-/Kleinschreibung, ganzes Wort, Platzhalter), Kommentare zu beliebigem Text, Änderungsverfolgung (jede Bearbeitung prüfbar), alle Überarbeitungen annehmen oder ablehnen, Blöcke anhängen, persönliche Informationen entfernen; als neue Kopie gespeichert |
| `mail_merge` | Briefe aus CSV, TSV, XLSX oder ODS: eine Vorlage mit Seriendruckfeldern oder ein Text mit `{{Feld}}`-Platzhaltern; ein zusammengeführtes Dokument (DOCX, PDF...) |
| `convert_document` | Ein Dokument, eine Liste oder ein Ordner → DOCX, PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, WordCraft-JSON oder PNG-Seiten, optional mit Markups (Kommentare und Änderungen) |
| `get_document_info` | Seiten, Wörter, Zeichen, Absätze, Eigenschaften, Formatvorlagen, Überschriften, Tabellen, Bilder, Kommentare und Überarbeitungen |
| `extract_text` | Reiner Text eines Dokuments, optional als `.txt` gespeichert |
| `render_pages` | Seiten, die Claude gezeigt und optional als PNG gespeichert werden |
| `list_wordcraft_catalog` | 615 Befehle mit Parametern, Formatvorlagen, Vorlagen, Formate |
| `run_wordcraft_commands` | Beliebige Engine-Befehle plus `type_text`, `select_text`, `get_text`, `inspect_document`... in einer Sitzung (Verweise `$steps[N].feld`), ohne Oberfläche oder live, danach speichern |
| `open_in_wordcraft` | Öffnet Dokumente in der WordCraft-App (optional mit dem Steuerkanal) |
| `get_wordcraft_status` | Plattform, Installation, Version, Befehle, App / Steuerport |

| | |
| --- | --- |
| **Öffnet** | DOCX, DOC, DOTX, DOCM, ODT, RTF, Markdown, LaTeX, HTML, TXT, WordCraft-JSON; fügt PNG, JPEG, GIF, BMP, WebP, TIFF und SVG ein; führt CSV / TSV / XLSX / ODS zusammen |
| **Speichert** | DOCX (optional mit Passwort), PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, WordCraft-JSON, PNG-Seiten |

## Beispiel

```json
{
  "name": "Quarterly report",
  "template": "blank",
  "page_size": "A4",
  "margins": "normal",
  "header": "ACME S.A.S.",
  "page_numbers": "bottom",
  "title": "Quarterly report 2026",
  "author": "Finance",
  "blocks": [
    { "type": "paragraph", "text": "Quarterly report 2026", "style": "Title" },
    { "type": "toc", "levels": 2 },
    { "type": "heading", "text": "Summary", "level": 1 },
    { "type": "paragraph", "text": "Sales grew 12 % over the last quarter." },
    { "type": "paragraph", "text": "Highlight in bold red.", "bold": true, "color": "#c00000", "align": "center" },
    { "type": "bullets", "items": ["Grow in Colombia", "Open Peru", "Cut costs"] },
    { "type": "heading", "text": "Results", "level": 1 },
    { "type": "table", "caption": "Sales by region", "rows": [["Region", "Sales", "Change"], ["North", "1,200", "+8 %"], ["South", "950", "+15 %"]] },
    { "type": "image", "path": "C:\\Reports\\chart.png", "width": 360, "caption": "Sales by month" },
    { "type": "footnote", "text": "Source: internal data." }
  ],
  "formats": ["docx", "pdf"],
  "output_dir": "C:\\Reports"
}
```

## Voraussetzungen

- **WordCraft** mit `wordcraft-cli` (getestet mit **0.6.1**); siehe [Plattformen](#plattformen)
- Node.js ≥ 20 (bei `.mcpb`-Installationen in Claude Desktop enthalten)

## Installation

### Claude Desktop (empfohlen, alle Plattformen)

1. Laden Sie `wordcraft-mcp-server.mcpb` aus dem [neuesten Release](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest) herunter.
2. Doppelklicken Sie darauf (oder ziehen Sie sie in Claude Desktop → *Einstellungen → Erweiterungen*) und klicken Sie auf **Installieren**.
3. Optional: Liegt WordCraft nicht an einem Standardort, geben Sie in den Einstellungen der Erweiterung den Ordner oder den Pfad zu `wordcraft-cli` an.

### Sunsam Code

Installiere **WordCraft Bridge** aus dem Marketplace von [Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode) oder zieh die `.mcpb` in *MCP → Erweiterung installieren*.

### Codex (OpenAI)

**Empfohlen — der Marketplace (erhält Updates):** *Plugins → Hinzufügen → Marketplace hinzufügen*, Quelle `jhonsu01/craft-marketplace`, Referenz `main`, dann **WordCraft Bridge** aus **Craft Bridges** installieren ([craft-marketplace](https://github.com/jhonsu01/craft-marketplace)). Neue Versionen kommen durch Aktualisieren des Marketplace. Oder das Zip hochladen (Codex speichert es in Ihrem Konto und lehnt ein neueres Zip mit demselben Namen ab):

1. Laden Sie `wordcraft-mcp-server-<version>-codex.zip` aus dem [neuesten Release](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest) herunter.
2. In Codex: *Plugins → Hinzufügen → Neues Plugin*, das Zip wählen und auf **Plugin hinzufügen** klicken.
3. Codex startet den Server mit `node`, daher muss Node.js ≥ 20 im `PATH` liegen. Liegt WordCraft nicht an einem Standardort, setzen Sie `WORDCRAFT_DIR` oder `WORDCRAFT_CLI` als Systemumgebungsvariablen (Codex hat für lokale Plugins kein Einstellungsformular).

### DeepSeek Harness

1. *Plugins → Add plugin*, `github:jhonsu01/craft-marketplace#path:/plugins/wordcraft-mcp-server` eingeben, auf **Install** und dann auf **Enable now** klicken.
2. Harness startet den Server mit seinem eigenen MCP-Client und `node` (Node.js ≥ 20 im `PATH`); die Werkzeuge erscheinen als `mcp__wordcraft__<werkzeug>`, die Ausgabedateien als Karten, die sich in Harness öffnen.
3. Harness aktualisiert Plugins noch nicht selbst: Zum Aktualisieren das Plugin deinstallieren und mit derselben Adresse neu installieren.

### Claude Code / andere MCP-Clients

```bash
git clone https://github.com/jhonsu01/wordcraft-mcp-server.git
cd wordcraft-mcp-server
npm install
npm run build
```

Windows:

```bash
claude mcp add wordcraft -- node "%CD%\dist\bundle.cjs"
```

macOS / Linux:

```bash
claude mcp add wordcraft -- node "$PWD/dist/bundle.cjs"
```

## Konfiguration

| Variable | Bedeutung |
| --- | --- |
| `WORDCRAFT_DIR` | WordCraft-Ordner, eine seiner ausführbaren Dateien, eine `.tar.gz`-Wurzel (mit `bin/`) oder `WordCraft.app`. Standard: automatische Erkennung |
| `WORDCRAFT_CLI` | Pfad zu `wordcraft-cli` / `wordcraft-cli.exe` (hat Vorrang vor `WORDCRAFT_DIR`) |
| `WORDCRAFT_APP` | Pfad der Desktop-App, wenn sie woanders liegt (z. B. ein Linux-AppImage) |
| `WORDCRAFT_CONTROL_PORT` | Steuerport der Desktop-App (Standard 7985) |
| `WORDCRAFT_MCP_TIMEOUT` | Maximale Sekunden pro Engine-Aufruf (Standard 3600) |

## Sicherheit

- Dateien werden **nie überschrieben**, außer mit `overwrite: true`: In Ordnern wird ein freier Name (`_2`) verwendet, ein vorhandener `output_path` ist ein Fehler. Dokumente, Bilder und Daten werden nur gelesen; ein bearbeitetes Dokument wird nur als neue Kopie gespeichert.
- Alle Pfade müssen absolut sein. Die Engine läuft ohne Oberfläche mit Dokumenten im Speicher und berührt die WordCraft-App nie, außer mit `live: true`.
- Alles läuft lokal ohne Netzwerkzugriff. Jeder Auftrag nutzt eine eigene Engine in einem temporären Ordner, der am Ende gelöscht wird.

## Entwicklung

```bash
npm run build       # TypeScript + Ein-Datei-Bundle (dist/bundle.cjs)
npm test            # Unit-Tests (Pfadlogik für Windows, macOS und Linux)
npm run test:e2e    # 26 End-to-End-Prüfungen (28 mit `E2E_LIVE=1`) über echtes MCP-stdio (synthetisches Bild und CSV)
npm run pack:mcpb   # wordcraft-mcp-server.mcpb
npm run pack:codex  # Plugin-Zip für Codex / DeepSeek Harness
```

Linux-Test in Docker (zuerst `wordcraft-<version>-linux-x86_64.tar.gz` entpacken):

```bash
docker run --rm -v "$PWD:/work:ro" -v "/pfad/zu/wordcraft-0.6.1-linux-x86_64:/opt/wordcraft:ro" -e WORDCRAFT_DIR=/opt/wordcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## Lizenz

Apache-2.0. WordCraft ist © seiner Autoren (Storytold), MIT oder Apache-2.0.
Dieses Projekt ist weder mit WordCraft noch mit Storytold verbunden oder von ihnen unterstützt. Word ist eine Marke von Microsoft.
