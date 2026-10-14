<p align="center"><img src="icon.png" width="120" alt="WordCraft Bridge icon"></p>

<h1 align="center">WordCraft MCP Server</h1>

<p align="center">
  <b>English</b> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  Let Claude write and edit documents with the <b>WordCraft</b> installed on your computer — <b>Windows, macOS and Linux</b>:<br>
  reports, letters and resumes, find and replace, comments and tracked changes, mail merge, and DOCX, PDF, ODT, RTF, HTML, Markdown and LaTeX.
</p>

---

## Why

[WordCraft](https://github.com/storytold/wordcraft) is an open-source, Word-class word processor written in Rust, with a headless CLI (`wordcraft-cli`), 615 commands, DOCX / ODT / RTF / PDF support and an MCP mode. This [Model Context Protocol](https://modelcontextprotocol.io) server turns that engine into **file-in / file-out tools** for Claude, so you can ask things like:

> *"Write a 3-page quarterly report with a table of contents, a sales table, this chart and page numbers, as DOCX and PDF."*
> *"In `contract.docx`, change 'ACME Ltd.' to 'ACME S.A.S.' with tracked changes and add a comment on the payment clause."*
> *"Create a letter for every customer in `customers.xlsx`, with their name and city."*
> *"Accept all changes in every document in `D:\Contracts` and export them as PDF."*
> *"Convert these Markdown notes to Word, and this Word file to LaTeX."*

Sibling of [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server) and [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## Platforms

| OS | WordCraft package to install | Where the server finds it (no setup needed) | Status |
| --- | --- | --- | --- |
| **Windows** 10/11 (x64, x86, arm64) | MSI or portable zip | `C:\Program Files\WordCraft`, `%LOCALAPPDATA%\Programs\WordCraft`, `PATH` | ✅ Verified (Windows 11) |
| **Linux** (x86_64, aarch64, riscv64) | `.deb`, `.rpm` or `.tar.gz` | `/usr/bin`, `/usr/local/bin`, `/opt/wordcraft/bin`, `~/.local/bin`, `PATH` | ✅ Verified (Debian 12, headless) |
| **macOS** 11+ (Apple silicon and Intel) | `.dmg` (the app) **plus** `wordcraft-cli-<version>-macos-universal.zip` | `/Applications/WordCraft.app`, `/usr/local/bin`, `/opt/homebrew/bin`, `~/.local/bin`, `~/bin`, `PATH` | 🟡 Supported, not yet tested on a Mac |

All downloads: [WordCraft releases](https://github.com/storytold/wordcraft/releases) (there is also a FreeBSD tar.gz; set `WORDCRAFT_DIR` to it). Anywhere else: set `WORDCRAFT_DIR` (folder, `.tar.gz` root or `WordCraft.app`) or `WORDCRAFT_CLI`.

- **macOS:** the DMG contains only the app. Unzip the separate `wordcraft-cli` zip and move `wordcraft-cli` to `/usr/local/bin` (or point `WORDCRAFT_CLI` at it). The first run checks Apple's notarization online.
- **Linux:** the AppImage and Flatpak contain only the app, not `wordcraft-cli`; use the deb, rpm or tar.gz. For an AppImage app, set `WORDCRAFT_APP` so `open_in_wordcraft` can start it. On a server without a GPU, the verified setup used `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`.

## How it works

| Part | What it is |
| --- | --- |
| **WordCraft engine** (`wordcraft-cli mcp`) | WordCraft's own engine: layout, styles, lists, tables, fields, references, review, mailings and the DOCX / PDF / ODT / RTF / HTML / Markdown / LaTeX writers. Started fresh and **headless** for each job, so it never touches the WordCraft app or an open document. |
| **MCP server** (Node.js) | 11 high-level tools. Builds documents from a simple list of blocks (headings, paragraphs, lists, tables, images, table of contents, footnotes), keeps the caret where it belongs between blocks, and checks every output first: WordCraft itself would replace existing files silently. |
| **Live app** (optional) | `open_in_wordcraft control=true` starts the app with its loopback-only control channel (port 7985) and `run_wordcraft_commands live=true` drives it. Close the app when you are done. |

## Tools

| Tool | What it does |
| --- | --- |
| `create_document` | A new document, blank or from the letter / resume / report / sample templates, built from blocks: headings 1–9, paragraphs (style, alignment, bold, italic, underline, font, size, colour, highlight), bullet and numbered lists, tables (header row, style, caption), images (width, alt text, caption), page breaks, a table of contents and footnotes; page size, orientation, margins, header, footer, page numbers and document properties. Returns a preview of page 1 |
| `edit_document` | One document, a list or a folder: find / replace (match case, whole word, wildcards), comments on any text, tracked changes (so every edit is reviewable), accept or reject all revisions, append blocks, remove personal information; written as a new copy |
| `mail_merge` | Letters from CSV, TSV, XLSX or ODS: an existing template with merge fields, or a body written with `{{Field}}` placeholders; one merged document (DOCX, PDF...) |
| `convert_document` | One document, a list or a folder → DOCX, PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, WordCraft JSON or PNG pages, optionally with Print Markup (comments and changes) |
| `get_document_info` | Pages, words, characters, paragraphs, properties, styles, headings, tables, images, comments and revisions |
| `extract_text` | Plain text of a document, optionally saved as `.txt` |
| `render_pages` | Pages shown to Claude and optionally saved as PNG |
| `list_wordcraft_catalog` | 615 commands with parameters, styles, templates, formats |
| `run_wordcraft_commands` | Any engine commands plus `type_text`, `select_text`, `get_text`, `inspect_document`... in one session (`$steps[N].field` references), headless or live, then save |
| `open_in_wordcraft` | Open documents in the WordCraft app (optionally with the control channel) |
| `get_wordcraft_status` | Platform, installation, version, commands, app / control port |

| | |
| --- | --- |
| **Opens** | DOCX, DOC, DOTX, DOCM, ODT, RTF, Markdown, LaTeX, HTML, TXT, WordCraft JSON; places PNG, JPEG, GIF, BMP, WebP, TIFF and SVG; merges CSV / TSV / XLSX / ODS |
| **Saves** | DOCX (optionally password-protected), PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, WordCraft JSON, PNG pages |

## Example

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

## Requirements

- **WordCraft** with `wordcraft-cli` (tested with **0.6.1**); see [Platforms](#platforms)
- Node.js ≥ 20 (bundled with Claude Desktop for `.mcpb` installs)

## Installation

### Claude Desktop (recommended, all platforms)

1. Download `wordcraft-mcp-server.mcpb` from the [latest release](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest).
2. Double-click it (or drag it into Claude Desktop → *Settings → Extensions*) and click **Install**.
3. Optional: if WordCraft is not in a standard location, fill in its folder or the `wordcraft-cli` path in the extension settings.

### Sunsam Code

Install **WordCraft Bridge** from the [Sunsam Code marketplace](https://github.com/jhonsu01/marketplace-SunsamCode), or drop the `.mcpb` into *MCP → Install extension*.

### Codex (OpenAI)

**Recommended — the marketplace (gets updates):** *Plugins → Add → Add marketplace*, source `jhonsu01/craft-marketplace`, reference `main`, then install **WordCraft Bridge** from **Craft Bridges** ([craft-marketplace](https://github.com/jhonsu01/craft-marketplace)). New versions arrive by refreshing the marketplace. Or upload the zip (Codex then keeps it in your account and refuses a newer zip with the same name):

1. Download `wordcraft-mcp-server-<version>-codex.zip` from the [latest release](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest).
2. In Codex: *Plugins → Add → New plugin*, choose the zip and click **Add plugin**.
3. Codex starts the server with `node`, so Node.js ≥ 20 must be on `PATH`. If WordCraft is not in a standard location, set `WORDCRAFT_DIR` or `WORDCRAFT_CLI` as system environment variables (Codex has no settings form for local plugins).

### DeepSeek Harness

1. *Plugins → Add plugin*, enter `github:jhonsu01/craft-marketplace#path:/plugins/wordcraft-mcp-server` and click **Install**, then **Enable now**.
2. Harness runs the server with its own MCP client and `node` (Node.js ≥ 20 on `PATH`); the tools appear as `mcp__wordcraft__<tool>` and the output files as cards that open in Harness.
3. Harness does not update plugins by itself yet: to upgrade, uninstall the plugin and install it again with the same address.

### Claude Code / other MCP clients

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

## Configuration

| Variable | Meaning |
| --- | --- |
| `WORDCRAFT_DIR` | WordCraft folder, one of its executables, a `.tar.gz` root (with `bin/`) or `WordCraft.app`. Default: auto-detect |
| `WORDCRAFT_CLI` | Path of `wordcraft-cli` / `wordcraft-cli.exe` (wins over `WORDCRAFT_DIR`) |
| `WORDCRAFT_APP` | Path of the desktop app when it lives elsewhere (e.g. a Linux AppImage) |
| `WORDCRAFT_CONTROL_PORT` | Control port of the desktop app (default 7985) |
| `WORDCRAFT_MCP_TIMEOUT` | Maximum seconds per engine call (default 3600) |

## Safety

- Files are **never overwritten** unless `overwrite: true`: a free name (`_2`) is used in folders and an existing `output_path` is an error. Documents, images and data are only read; an edited document is saved only as a new copy (`_edited`).
- All paths must be absolute. The engine runs headless and never touches the WordCraft app unless `live: true`.
- Everything runs locally with no network access. Each job uses a private engine in a temporary folder that is deleted at the end.

## Development

```bash
npm run build       # TypeScript + single-file bundle (dist/bundle.cjs)
npm test            # unit tests (Windows, macOS and Linux path logic)
npm run test:e2e    # 26 end-to-end checks (28 with `E2E_LIVE=1`) over real MCP stdio (synthetic image and CSV)
npm run pack:mcpb   # wordcraft-mcp-server.mcpb
npm run pack:codex  # Codex / DeepSeek Harness plugin zip
```

Linux test in Docker (unpack `wordcraft-<version>-linux-x86_64.tar.gz` first):

```bash
docker run --rm -v "$PWD:/work:ro" -v "/path/to/wordcraft-0.6.1-linux-x86_64:/opt/wordcraft:ro" -e WORDCRAFT_DIR=/opt/wordcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## License

Apache-2.0. WordCraft is © its authors (Storytold), MIT or Apache-2.0.
This project is not affiliated with or endorsed by WordCraft or Storytold. Word is a trademark of Microsoft.
