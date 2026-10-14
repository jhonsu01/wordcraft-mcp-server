<p align="center"><img src="icon.png" width="120" alt="Icône de WordCraft Bridge"></p>

<h1 align="center">WordCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <b>Français</b> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  Laissez Claude rédiger et modifier des documents avec le <b>WordCraft</b> installé sur votre ordinateur — <b>Windows, macOS et Linux</b> :<br>
  rapports, lettres et CV, rechercher et remplacer, commentaires et suivi des modifications, publipostage, et DOCX, PDF, ODT, RTF, HTML, Markdown et LaTeX.
</p>

---

## Pourquoi

[WordCraft](https://github.com/storytold/wordcraft) est un traitement de texte open source de la classe de Word, écrit en Rust, avec une CLI sans interface (`wordcraft-cli`), 615 commandes, la prise en charge de DOCX / ODT / RTF / PDF et un mode MCP. Ce serveur [Model Context Protocol](https://modelcontextprotocol.io) transforme ce moteur en **outils fichier en entrée / fichier en sortie** pour Claude, pour demander par exemple :

> *« Rédige un rapport trimestriel de 3 pages avec table des matières, un tableau des ventes, ce graphique et des numéros de page, en DOCX et PDF. »*
> *« Dans `contrat.docx`, remplace « ACME SARL » par « ACME SAS » avec suivi des modifications et ajoute un commentaire sur la clause de paiement. »*
> *« Crée une lettre pour chaque client de `clients.xlsx`, avec son nom et sa ville. »*
> *« Accepte toutes les modifications de chaque document de `D:\Contrats` et exporte-les en PDF. »*
> *« Convertis ces notes Markdown en Word, et ce Word en LaTeX. »*

Frère de [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server) et [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## Plateformes

| OS | Paquet WordCraft à installer | Où le serveur le trouve (sans configuration) | État |
| --- | --- | --- | --- |
| **Windows** 10/11 (x64, x86, arm64) | MSI ou zip portable | `C:\Program Files\WordCraft`, `%LOCALAPPDATA%\Programs\WordCraft`, `PATH` | ✅ Vérifié (Windows 11) |
| **Linux** (x86_64, aarch64, riscv64) | `.deb`, `.rpm` ou `.tar.gz` | `/usr/bin`, `/usr/local/bin`, `/opt/wordcraft/bin`, `~/.local/bin`, `PATH` | ✅ Vérifié (Debian 12, sans interface) |
| **macOS** 11+ (Apple silicon et Intel) | `.dmg` (l'application) **plus** `wordcraft-cli-<version>-macos-universal.zip` | `/Applications/WordCraft.app`, `/usr/local/bin`, `/opt/homebrew/bin`, `~/.local/bin`, `~/bin`, `PATH` | 🟡 Pris en charge, pas encore testé sur un Mac |

Tous les téléchargements : [versions de WordCraft](https://github.com/storytold/wordcraft/releases) (il existe aussi un tar.gz pour FreeBSD ; pointez `WORDCRAFT_DIR` dessus). Ailleurs : définissez `WORDCRAFT_DIR` (dossier, racine du `.tar.gz` ou `WordCraft.app`) ou `WORDCRAFT_CLI`.

- **macOS :** le DMG ne contient que l'application. Décompressez le zip séparé de `wordcraft-cli` et déplacez `wordcraft-cli` vers `/usr/local/bin` (ou pointez `WORDCRAFT_CLI` dessus). Le premier lancement vérifie en ligne la notarisation d'Apple.
- **Linux :** l'AppImage et le Flatpak ne contiennent que l'application, pas `wordcraft-cli` ; utilisez le deb, le rpm ou le tar.gz. Pour une application AppImage, définissez `WORDCRAFT_APP` pour que `open_in_wordcraft` puisse la lancer. Sur un serveur sans GPU, la configuration vérifiée utilisait `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`.

## Fonctionnement

| Élément | Ce que c'est |
| --- | --- |
| **Moteur WordCraft** (`wordcraft-cli mcp`) | Le moteur de WordCraft lui-même : mise en page, styles, listes, tableaux, champs, références, révision, publipostage et les écrivains DOCX / PDF / ODT / RTF / HTML / Markdown / LaTeX. Démarré à neuf et **sans interface** pour chaque tâche : il ne touche jamais l'app WordCraft ni un document ouvert. |
| **Serveur MCP** (Node.js) | 11 outils de haut niveau. Construit les documents à partir d'une simple liste de blocs (titres, paragraphes, listes, tableaux, images, table des matières, notes de bas de page), garde le curseur au bon endroit entre les blocs et vérifie chaque sortie au préalable : WordCraft seul remplacerait des fichiers existants sans prévenir. |
| **App en direct** (facultatif) | `open_in_wordcraft control=true` lance l'app avec son canal de contrôle local uniquement (port 7985) et `run_wordcraft_commands live=true` la pilote. Fermez l'app quand vous avez fini. |

## Outils

| Outil | Ce qu'il fait |
| --- | --- |
| `create_document` | Un nouveau document, vierge ou depuis les modèles lettre / CV / rapport / exemple, construit à partir de blocs : titres 1–9, paragraphes (style, alignement, gras, italique, souligné, police, taille, couleur, surlignage), listes à puces et numérotées, tableaux (ligne d'en-tête, style, légende), images (largeur, texte alternatif, légende), sauts de page, table des matières et notes de bas de page ; format de page, orientation, marges, en-tête, pied de page, numéros de page et propriétés. Renvoie un aperçu de la page 1 |
| `edit_document` | Un document, une liste ou un dossier : rechercher / remplacer (casse, mot entier, caractères génériques), commentaires sur n'importe quel texte, suivi des modifications (chaque modification vérifiable), accepter ou refuser toutes les révisions, ajouter des blocs, supprimer les informations personnelles ; enregistré comme nouvelle copie |
| `mail_merge` | Lettres depuis CSV, TSV, XLSX ou ODS : un modèle avec des champs de fusion ou un corps écrit avec des marqueurs `{{Champ}}` ; un document fusionné (DOCX, PDF...) |
| `convert_document` | Un document, une liste ou un dossier → DOCX, PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, JSON WordCraft ou pages PNG, éventuellement avec les marques de révision (commentaires et modifications) |
| `get_document_info` | Pages, mots, caractères, paragraphes, propriétés, styles, titres, tableaux, images, commentaires et révisions |
| `extract_text` | Texte brut d'un document, éventuellement enregistré en `.txt` |
| `render_pages` | Pages montrées à Claude et éventuellement enregistrées en PNG |
| `list_wordcraft_catalog` | 615 commandes avec paramètres, styles, modèles, formats |
| `run_wordcraft_commands` | N'importe quelles commandes du moteur plus `type_text`, `select_text`, `get_text`, `inspect_document`... dans une session (références `$steps[N].champ`), sans interface ou en direct, puis enregistrement |
| `open_in_wordcraft` | Ouvre des documents dans l'app WordCraft (éventuellement avec le canal de contrôle) |
| `get_wordcraft_status` | Plateforme, installation, version, commandes, app / port de contrôle |

| | |
| --- | --- |
| **Ouvre** | DOCX, DOC, DOTX, DOCM, ODT, RTF, Markdown, LaTeX, HTML, TXT, JSON WordCraft ; insère PNG, JPEG, GIF, BMP, WebP, TIFF et SVG ; fusionne CSV / TSV / XLSX / ODS |
| **Enregistre** | DOCX (éventuellement protégé par mot de passe), PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, JSON WordCraft, pages PNG |

## Exemple

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

## Prérequis

- **WordCraft** avec `wordcraft-cli` (testé avec **0.6.1**) ; voir [Plateformes](#plateformes)
- Node.js ≥ 20 (fourni avec Claude Desktop pour les installations `.mcpb`)

## Installation

### Claude Desktop (recommandé, toutes plateformes)

1. Téléchargez `wordcraft-mcp-server.mcpb` depuis la [dernière version](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest).
2. Double-cliquez dessus (ou glissez-le dans Claude Desktop → *Paramètres → Extensions*) et cliquez sur **Installer**.
3. Facultatif : si WordCraft n'est pas à un emplacement standard, indiquez son dossier ou le chemin de `wordcraft-cli` dans les paramètres de l'extension.

### Sunsam Code

Installez **WordCraft Bridge** depuis la marketplace de [Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode), ou déposez le `.mcpb` dans *MCP → Installer une extension*.

### Codex (OpenAI)

**Recommandé — le marketplace (reçoit les mises à jour) :** *Plugins → Ajouter → Ajouter un marketplace*, source `jhonsu01/craft-marketplace`, référence `main`, puis installez **WordCraft Bridge** depuis **Craft Bridges** ([craft-marketplace](https://github.com/jhonsu01/craft-marketplace)). Les nouvelles versions arrivent en actualisant le marketplace. Ou envoyez le zip (Codex le garde dans votre compte et refuse un zip plus récent portant le même nom) :

1. Téléchargez `wordcraft-mcp-server-<version>-codex.zip` depuis la [dernière version](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest).
2. Dans Codex : *Plugins → Ajouter → Nouveau plugin*, choisissez le zip et cliquez sur **Ajouter le plugin**.
3. Codex lance le serveur avec `node` : Node.js ≥ 20 doit donc être dans le `PATH`. Si WordCraft n'est pas à un emplacement standard, définissez `WORDCRAFT_DIR` ou `WORDCRAFT_CLI` comme variables d'environnement système (Codex n'a pas de formulaire de paramètres pour les plugins locaux).

### DeepSeek Harness

1. *Plugins → Add plugin*, saisissez `github:jhonsu01/craft-marketplace#path:/plugins/wordcraft-mcp-server` puis cliquez sur **Install**, puis sur **Enable now**.
2. Harness lance le serveur avec son propre client MCP et `node` (Node.js ≥ 20 dans le `PATH`) ; les outils apparaissent sous la forme `mcp__wordcraft__<outil>` et les fichiers produits comme des cartes qui s'ouvrent dans Harness.
3. Harness ne met pas encore les plugins à jour tout seul : pour mettre à jour, désinstallez le plugin puis réinstallez-le avec la même adresse.

### Claude Code / autres clients MCP

```bash
git clone https://github.com/jhonsu01/wordcraft-mcp-server.git
cd wordcraft-mcp-server
npm install
npm run build
```

Windows :

```bash
claude mcp add wordcraft -- node "%CD%\dist\bundle.cjs"
```

macOS / Linux :

```bash
claude mcp add wordcraft -- node "$PWD/dist/bundle.cjs"
```

## Configuration

| Variable | Signification |
| --- | --- |
| `WORDCRAFT_DIR` | Dossier de WordCraft, l'un de ses exécutables, la racine d'un `.tar.gz` (avec `bin/`) ou `WordCraft.app`. Par défaut : détection automatique |
| `WORDCRAFT_CLI` | Chemin de `wordcraft-cli` / `wordcraft-cli.exe` (prioritaire sur `WORDCRAFT_DIR`) |
| `WORDCRAFT_APP` | Chemin de l'application de bureau si elle est ailleurs (par ex. une AppImage Linux) |
| `WORDCRAFT_CONTROL_PORT` | Port de contrôle de l'application de bureau (7985 par défaut) |
| `WORDCRAFT_MCP_TIMEOUT` | Nombre maximal de secondes par appel au moteur (3600 par défaut) |

## Sécurité

- Les fichiers ne sont **jamais écrasés** sauf avec `overwrite: true` : un nom libre (`_2`) est utilisé dans les dossiers et un `output_path` existant est une erreur. Les documents, images et données sont seulement lus ; un document modifié n'est enregistré que comme nouvelle copie.
- Tous les chemins doivent être absolus. Le moteur tourne sans interface avec des documents en mémoire et ne touche jamais à l'application WordCraft sauf avec `live: true`.
- Tout s'exécute en local, sans accès réseau. Chaque tâche utilise un moteur privé dans un dossier temporaire supprimé à la fin.

## Développement

```bash
npm run build       # TypeScript + bundle en un seul fichier (dist/bundle.cjs)
npm test            # tests unitaires (logique des chemins Windows, macOS et Linux)
npm run test:e2e    # 26 vérifications de bout en bout (28 avec `E2E_LIVE=1`) via un vrai MCP stdio (image et CSV synthétiques)
npm run pack:mcpb   # wordcraft-mcp-server.mcpb
npm run pack:codex  # zip du plugin Codex / DeepSeek Harness
```

Test Linux dans Docker (décompressez d'abord `wordcraft-<version>-linux-x86_64.tar.gz`) :

```bash
docker run --rm -v "$PWD:/work:ro" -v "/chemin/vers/wordcraft-0.6.1-linux-x86_64:/opt/wordcraft:ro" -e WORDCRAFT_DIR=/opt/wordcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## Licence

Apache-2.0. WordCraft est © ses auteurs (Storytold), MIT ou Apache-2.0.
Ce projet n'est ni affilié ni approuvé par WordCraft ou Storytold. Word est une marque d'Microsoft.
