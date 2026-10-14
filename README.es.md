<p align="center"><img src="icon.png" width="120" alt="Icono de WordCraft Bridge"></p>

<h1 align="center">WordCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <b>Español</b> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  Deja que Claude escriba y edite documentos con el <b>WordCraft</b> instalado en tu equipo — <b>Windows, macOS y Linux</b>:<br>
  informes, cartas y hojas de vida, buscar y reemplazar, comentarios y control de cambios, combinación de correspondencia, y DOCX, PDF, ODT, RTF, HTML, Markdown y LaTeX.
</p>

---

## Por qué

[WordCraft](https://github.com/storytold/wordcraft) es un procesador de textos de código abierto al estilo de Word, escrito en Rust, con una CLI sin interfaz (`wordcraft-cli`), 615 comandos, soporte de DOCX / ODT / RTF / PDF y un modo MCP. Este servidor [Model Context Protocol](https://modelcontextprotocol.io) convierte ese motor en **herramientas de archivo de entrada / archivo de salida** para Claude, para que puedas pedir cosas como:

> *"Escribe un informe trimestral de 3 páginas con índice, una tabla de ventas, este gráfico y números de página, en DOCX y PDF."*
> *"En `contrato.docx`, cambia 'ACME Ltda.' por 'ACME S.A.S.' con control de cambios y añade un comentario en la cláusula de pago."*
> *"Crea una carta para cada cliente de `clientes.xlsx`, con su nombre y ciudad."*
> *"Acepta todos los cambios de cada documento de `D:\Contratos` y expórtalos como PDF."*
> *"Convierte estas notas en Markdown a Word, y este Word a LaTeX."*

Hermano de [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server) y [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## Plataformas

| SO | Paquete de WordCraft que instalar | Dónde lo encuentra el servidor (sin configurar nada) | Estado |
| --- | --- | --- | --- |
| **Windows** 10/11 (x64, x86, arm64) | MSI o zip portable | `C:\Program Files\WordCraft`, `%LOCALAPPDATA%\Programs\WordCraft`, `PATH` | ✅ Verificado (Windows 11) |
| **Linux** (x86_64, aarch64, riscv64) | `.deb`, `.rpm` o `.tar.gz` | `/usr/bin`, `/usr/local/bin`, `/opt/wordcraft/bin`, `~/.local/bin`, `PATH` | ✅ Verificado (Debian 12, sin interfaz) |
| **macOS** 11+ (Apple silicon e Intel) | `.dmg` (la app) **más** `wordcraft-cli-<versión>-macos-universal.zip` | `/Applications/WordCraft.app`, `/usr/local/bin`, `/opt/homebrew/bin`, `~/.local/bin`, `~/bin`, `PATH` | 🟡 Soportado, aún sin probar en un Mac |

Todas las descargas: [versiones de WordCraft](https://github.com/storytold/wordcraft/releases) (también hay un tar.gz para FreeBSD; apunta `WORDCRAFT_DIR` a él). En cualquier otra ubicación: define `WORDCRAFT_DIR` (carpeta, raíz del `.tar.gz` o `WordCraft.app`) o `WORDCRAFT_CLI`.

- **macOS:** el DMG solo contiene la app. Descomprime el zip aparte de `wordcraft-cli` y mueve `wordcraft-cli` a `/usr/local/bin` (o apunta `WORDCRAFT_CLI` a él). La primera ejecución comprueba en línea la notarización de Apple.
- **Linux:** la AppImage y el Flatpak solo contienen la app, no `wordcraft-cli`; usa el deb, el rpm o el tar.gz. Para una app AppImage, define `WORDCRAFT_APP` para que `open_in_wordcraft` pueda abrirla. En un servidor sin GPU, la configuración verificada usó `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`.

## Cómo funciona

| Parte | Qué es |
| --- | --- |
| **Motor de WordCraft** (`wordcraft-cli mcp`) | El propio motor de WordCraft: diseño de página, estilos, listas, tablas, campos, referencias, revisión, correspondencia y los escritores DOCX / PDF / ODT / RTF / HTML / Markdown / LaTeX. Se inicia nuevo y **sin interfaz** en cada trabajo, así que nunca toca la app de WordCraft ni un documento abierto. |
| **Servidor MCP** (Node.js) | 11 herramientas de alto nivel. Construye documentos a partir de una lista sencilla de bloques (títulos, párrafos, listas, tablas, imágenes, índice, notas al pie), mantiene el cursor donde corresponde entre bloques y comprueba cada salida antes: WordCraft por sí solo reemplazaría archivos existentes sin avisar. |
| **App en vivo** (opcional) | `open_in_wordcraft control=true` abre la app con su canal de control solo local (puerto 7985) y `run_wordcraft_commands live=true` la maneja. Cierra la app cuando termines. |

## Herramientas

| Herramienta | Qué hace |
| --- | --- |
| `create_document` | Un documento nuevo, en blanco o desde las plantillas carta / hoja de vida / informe / muestra, hecho de bloques: títulos 1–9, párrafos (estilo, alineación, negrita, cursiva, subrayado, fuente, tamaño, color, resaltado), listas con viñetas y numeradas, tablas (fila de encabezado, estilo, leyenda), imágenes (ancho, texto alternativo, leyenda), saltos de página, índice y notas al pie; tamaño de página, orientación, márgenes, encabezado, pie, números de página y propiedades. Devuelve una vista previa de la página 1 |
| `edit_document` | Un documento, una lista o una carpeta: buscar / reemplazar (mayúsculas, palabra completa, comodines), comentarios sobre cualquier texto, control de cambios (para revisar cada edición), aceptar o rechazar todas las revisiones, añadir bloques, quitar información personal; se guarda como copia nueva |
| `mail_merge` | Cartas desde CSV, TSV, XLSX u ODS: una plantilla con campos de combinación o un cuerpo escrito con marcadores `{{Campo}}`; un documento combinado (DOCX, PDF...) |
| `convert_document` | Un documento, una lista o una carpeta → DOCX, PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, JSON de WordCraft o páginas PNG, opcionalmente con marcas de revisión (comentarios y cambios) |
| `get_document_info` | Páginas, palabras, caracteres, párrafos, propiedades, estilos, títulos, tablas, imágenes, comentarios y revisiones |
| `extract_text` | Texto plano de un documento, opcionalmente guardado como `.txt` |
| `render_pages` | Páginas que ve Claude y que opcionalmente se guardan como PNG |
| `list_wordcraft_catalog` | 615 comandos con parámetros, estilos, plantillas, formatos |
| `run_wordcraft_commands` | Cualquier comando del motor más `type_text`, `select_text`, `get_text`, `inspect_document`... en una sesión (referencias `$steps[N].campo`), sin interfaz o en vivo, y luego guardar |
| `open_in_wordcraft` | Abre documentos en la app de WordCraft (opcionalmente con el canal de control) |
| `get_wordcraft_status` | Plataforma, instalación, versión, comandos, app / puerto de control |

| | |
| --- | --- |
| **Abre** | DOCX, DOC, DOTX, DOCM, ODT, RTF, Markdown, LaTeX, HTML, TXT, JSON de WordCraft; inserta PNG, JPEG, GIF, BMP, WebP, TIFF y SVG; combina CSV / TSV / XLSX / ODS |
| **Guarda** | DOCX (opcionalmente con contraseña), PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, JSON de WordCraft, páginas PNG |

## Ejemplo

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

## Requisitos

- **WordCraft** con `wordcraft-cli` (probado con **0.6.1**); ver [Plataformas](#plataformas)
- Node.js ≥ 20 (incluido en Claude Desktop para instalaciones `.mcpb`)

## Instalación

### Claude Desktop (recomendado, todas las plataformas)

1. Descarga `wordcraft-mcp-server.mcpb` de la [última versión](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest).
2. Haz doble clic (o arrástralo a Claude Desktop → *Configuración → Extensiones*) y pulsa **Instalar**.
3. Opcional: si WordCraft no está en una ubicación estándar, indica su carpeta o la ruta de `wordcraft-cli` en la configuración de la extensión.

### Sunsam Code

Instala **WordCraft Bridge** desde el marketplace de [Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode), o suelta el `.mcpb` en *MCP → Instalar extensión*.

### Codex (OpenAI)

**Recomendado — el marketplace (recibe actualizaciones):** *Complementos → Añadir → Añadir marketplace*, origen `jhonsu01/craft-marketplace`, referencia `main`, y luego instala **WordCraft Bridge** desde **Craft Bridges** ([craft-marketplace](https://github.com/jhonsu01/craft-marketplace)). Las versiones nuevas llegan al actualizar el marketplace. O sube el zip (Codex lo guarda en tu cuenta y rechaza un zip más nuevo con el mismo nombre):

1. Descarga `wordcraft-mcp-server-<versión>-codex.zip` de la [última versión](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest).
2. En Codex: *Complementos → Añadir → Nuevo complemento*, elige el zip y pulsa **Añadir complemento**.
3. Codex arranca el servidor con `node`, así que Node.js ≥ 20 debe estar en el `PATH`. Si WordCraft no está en una ubicación estándar, define `WORDCRAFT_DIR` o `WORDCRAFT_CLI` como variables de entorno del sistema (Codex no tiene formulario de configuración para complementos locales).

### DeepSeek Harness

1. *Plugins → Add plugin*, escribe `github:jhonsu01/craft-marketplace#path:/plugins/wordcraft-mcp-server` y pulsa **Install** y luego **Enable now**.
2. Harness arranca el servidor con su propio cliente MCP y `node` (Node.js ≥ 20 en el `PATH`); las herramientas aparecen como `mcp__wordcraft__<herramienta>` y los archivos de salida como tarjetas que se abren en Harness.
3. Harness aún no actualiza los plugins por sí solo: para actualizar, desinstala el plugin y vuelve a instalarlo con la misma dirección.

### Claude Code / otros clientes MCP

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

## Configuración

| Variable | Significado |
| --- | --- |
| `WORDCRAFT_DIR` | Carpeta de WordCraft, uno de sus ejecutables, la raíz de un `.tar.gz` (con `bin/`) o `WordCraft.app`. Por defecto: detección automática |
| `WORDCRAFT_CLI` | Ruta de `wordcraft-cli` / `wordcraft-cli.exe` (tiene prioridad sobre `WORDCRAFT_DIR`) |
| `WORDCRAFT_APP` | Ruta de la app de escritorio cuando está en otro sitio (p. ej. una AppImage de Linux) |
| `WORDCRAFT_CONTROL_PORT` | Puerto de control de la app de escritorio (por defecto 7985) |
| `WORDCRAFT_MCP_TIMEOUT` | Segundos máximos por llamada al motor (por defecto 3600) |

## Seguridad

- Los archivos **nunca se sobrescriben** salvo con `overwrite: true`: en carpetas se usa un nombre libre (`_2`) y un `output_path` existente es un error. Los documentos, imágenes y datos solo se leen; un documento editado solo se guarda como copia nueva.
- Todas las rutas deben ser absolutas. El motor se ejecuta sin interfaz con documentos en memoria y nunca toca la app de WordCraft salvo con `live: true`.
- Todo se ejecuta en local, sin acceso a la red. Cada tarea usa un motor privado en una carpeta temporal que se borra al final.

## Desarrollo

```bash
npm run build       # TypeScript + bundle de un solo archivo (dist/bundle.cjs)
npm test            # pruebas unitarias (lógica de rutas de Windows, macOS y Linux)
npm run test:e2e    # 26 comprobaciones de extremo a extremo (28 con `E2E_LIVE=1`) por MCP stdio real (imagen y CSV sintéticos)
npm run pack:mcpb   # wordcraft-mcp-server.mcpb
npm run pack:codex  # zip del plugin para Codex / DeepSeek Harness
```

Prueba de Linux en Docker (descomprime antes `wordcraft-<versión>-linux-x86_64.tar.gz`):

```bash
docker run --rm -v "$PWD:/work:ro" -v "/ruta/a/wordcraft-0.6.1-linux-x86_64:/opt/wordcraft:ro" -e WORDCRAFT_DIR=/opt/wordcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## Licencia

Apache-2.0. WordCraft es © de sus autores (Storytold), MIT o Apache-2.0.
Este proyecto no está afiliado ni respaldado por WordCraft ni Storytold. Word es una marca de Microsoft.
