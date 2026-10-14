<p align="center"><img src="icon.png" width="120" alt="Значок WordCraft Bridge"></p>

<h1 align="center">WordCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <b>Русский</b> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  Позвольте Claude писать и редактировать документы с помощью <b>WordCraft</b>, установленного на вашем компьютере, — <b>Windows, macOS и Linux</b>:<br>
  отчёты, письма и резюме, поиск и замена, комментарии и отслеживание изменений, слияние, а также DOCX, PDF, ODT, RTF, HTML, Markdown и LaTeX.
</p>

---

## Зачем

[WordCraft](https://github.com/storytold/wordcraft) — текстовый процессор с открытым исходным кодом уровня Word, написанный на Rust, с CLI без интерфейса (`wordcraft-cli`), 615 командами, поддержкой DOCX / ODT / RTF / PDF и режимом MCP. Этот сервер [Model Context Protocol](https://modelcontextprotocol.io) превращает движок в **инструменты «файл на входе / файл на выходе»** для Claude, чтобы можно было просить, например:

> *«Напиши квартальный отчёт на 3 страницы с оглавлением, таблицей продаж, этим графиком и номерами страниц, в DOCX и PDF.»*
> *«В `договор.docx` замени «ООО АКМЕ» на «АО АКМЕ» с отслеживанием изменений и добавь комментарий к пункту об оплате.»*
> *«Создай письмо для каждого клиента из `клиенты.xlsx` с его именем и городом.»*
> *«Прими все изменения во всех документах из `D:\Договоры` и экспортируй их в PDF.»*
> *«Преобразуй эти заметки Markdown в Word, а этот Word — в LaTeX.»*

Родственные проекты: [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server) и [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## Платформы

| ОС | Какой пакет WordCraft установить | Где сервер его находит (без настройки) | Статус |
| --- | --- | --- | --- |
| **Windows** 10/11 (x64, x86, arm64) | MSI или переносной zip | `C:\Program Files\WordCraft`, `%LOCALAPPDATA%\Programs\WordCraft`, `PATH` | ✅ Проверено (Windows 11) |
| **Linux** (x86_64, aarch64, riscv64) | `.deb`, `.rpm` или `.tar.gz` | `/usr/bin`, `/usr/local/bin`, `/opt/wordcraft/bin`, `~/.local/bin`, `PATH` | ✅ Проверено (Debian 12, без графики) |
| **macOS** 11+ (Apple silicon и Intel) | `.dmg` (приложение) **плюс** `wordcraft-cli-<версия>-macos-universal.zip` | `/Applications/WordCraft.app`, `/usr/local/bin`, `/opt/homebrew/bin`, `~/.local/bin`, `~/bin`, `PATH` | 🟡 Поддерживается, на Mac ещё не проверено |

Все загрузки: [релизы WordCraft](https://github.com/storytold/wordcraft/releases) (есть и tar.gz для FreeBSD — укажите его в `WORDCRAFT_DIR`). В любом другом месте задайте `WORDCRAFT_DIR` (папка, корень `.tar.gz` или `WordCraft.app`) или `WORDCRAFT_CLI`.

- **macOS:** в DMG только само приложение. Распакуйте отдельный zip с `wordcraft-cli` и переместите `wordcraft-cli` в `/usr/local/bin` (или укажите его в `WORDCRAFT_CLI`). При первом запуске нотаризация Apple проверяется через интернет.
- **Linux:** AppImage и Flatpak содержат только приложение, без `wordcraft-cli`; используйте deb, rpm или tar.gz. Для приложения в AppImage задайте `WORDCRAFT_APP`, чтобы `open_in_wordcraft` мог его запустить. На сервере без GPU в проверенной конфигурации использовались `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`.

## Как это работает

| Часть | Что это |
| --- | --- |
| **Движок WordCraft** (`wordcraft-cli mcp`) | Собственный движок WordCraft: вёрстка, стили, списки, таблицы, поля, ссылки, рецензирование, рассылки и модули записи DOCX / PDF / ODT / RTF / HTML / Markdown / LaTeX. Запускается заново и **без интерфейса** для каждой задачи, поэтому никогда не трогает приложение WordCraft или открытый документ. |
| **Сервер MCP** (Node.js) | 11 высокоуровневых инструментов. Собирает документы из простого списка блоков (заголовки, абзацы, списки, таблицы, изображения, оглавление, сноски), держит курсор в нужном месте между блоками и заранее проверяет каждый выходной файл: сам WordCraft молча заменил бы существующие файлы. |
| **Приложение вживую** (необязательно) | `open_in_wordcraft control=true` запускает приложение с каналом управления только для локальных подключений (порт 7985), а `run_wordcraft_commands live=true` управляет им. Закройте приложение, когда закончите. |

## Инструменты

| Инструмент | Что делает |
| --- | --- |
| `create_document` | Новый документ, пустой или из шаблонов «письмо» / «резюме» / «отчёт» / «образец», из блоков: заголовки 1–9, абзацы (стиль, выравнивание, полужирный, курсив, подчёркивание, шрифт, размер, цвет, выделение), маркированные и нумерованные списки, таблицы (строка заголовка, стиль, подпись), изображения (ширина, альтернативный текст, подпись), разрывы страниц, оглавление и сноски; размер страницы, ориентация, поля, верхний и нижний колонтитулы, номера страниц и свойства. Возвращает превью страницы 1 |
| `edit_document` | Документ, список или папка: поиск / замена (регистр, слово целиком, подстановочные знаки), комментарии к любому тексту, отслеживание изменений (каждую правку можно проверить), принять или отклонить все исправления, добавить блоки, удалить личные сведения; сохраняется как новая копия |
| `mail_merge` | Письма из CSV, TSV, XLSX или ODS: шаблон с полями слияния или текст с метками `{{Поле}}`; один объединённый документ (DOCX, PDF...) |
| `convert_document` | Документ, список или папка → DOCX, PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, JSON WordCraft или страницы PNG, при желании с исправлениями и примечаниями |
| `get_document_info` | Страницы, слова, символы, абзацы, свойства, стили, заголовки, таблицы, изображения, комментарии и исправления |
| `extract_text` | Простой текст документа, при желании сохранённый в `.txt` |
| `render_pages` | Страницы, показанные Claude и при желании сохранённые как PNG |
| `list_wordcraft_catalog` | 615 команд с параметрами, стили, шаблоны, форматы |
| `run_wordcraft_commands` | Любые команды движка плюс `type_text`, `select_text`, `get_text`, `inspect_document`... в одной сессии (ссылки `$steps[N].поле`), без интерфейса или вживую, затем сохранение |
| `open_in_wordcraft` | Открывает документы в приложении WordCraft (при желании с каналом управления) |
| `get_wordcraft_status` | Платформа, установка, версия, команды, приложение / порт управления |

| | |
| --- | --- |
| **Открывает** | DOCX, DOC, DOTX, DOCM, ODT, RTF, Markdown, LaTeX, HTML, TXT, JSON WordCraft; вставляет PNG, JPEG, GIF, BMP, WebP, TIFF и SVG; объединяет CSV / TSV / XLSX / ODS |
| **Сохраняет** | DOCX (при желании с паролем), PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, JSON WordCraft, страницы PNG |

## Пример

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

## Требования

- **WordCraft** с `wordcraft-cli` (проверено на **0.6.1**); см. [Платформы](#платформы)
- Node.js ≥ 20 (входит в Claude Desktop при установке `.mcpb`)

## Установка

### Claude Desktop (рекомендуется, все платформы)

1. Скачайте `wordcraft-mcp-server.mcpb` из [последнего релиза](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest).
2. Дважды щёлкните по файлу (или перетащите его в Claude Desktop → *Настройки → Расширения*) и нажмите **Установить**.
3. По желанию: если WordCraft установлен не в стандартное место, укажите его папку или путь к `wordcraft-cli` в настройках расширения.

### Sunsam Code

Установите **WordCraft Bridge** из маркетплейса [Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode) или перетащите `.mcpb` в *MCP → Установить расширение*.

### Codex (OpenAI)

**Рекомендуется — маркетплейс (получает обновления):** *Плагины → Добавить → Добавить маркетплейс*, источник `jhonsu01/craft-marketplace`, ссылка `main`, затем установите **WordCraft Bridge** из **Craft Bridges** ([craft-marketplace](https://github.com/jhonsu01/craft-marketplace)). Новые версии приходят при обновлении маркетплейса. Или загрузите zip (Codex сохранит его в вашей учётной записи и отклонит более новый zip с тем же именем):

1. Скачайте `wordcraft-mcp-server-<версия>-codex.zip` из [последнего релиза](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest).
2. В Codex: *Плагины → Добавить → Новый плагин*, выберите zip и нажмите **Добавить плагин**.
3. Codex запускает сервер через `node`, поэтому Node.js ≥ 20 должен быть в `PATH`. Если WordCraft установлен не в стандартное место, задайте `WORDCRAFT_DIR` или `WORDCRAFT_CLI` как системные переменные окружения (у Codex нет формы настроек для локальных плагинов).

### DeepSeek Harness

1. *Plugins → Add plugin*, введите `github:jhonsu01/craft-marketplace#path:/plugins/wordcraft-mcp-server` и нажмите **Install**, затем **Enable now**.
2. Harness запускает сервер через свой MCP-клиент и `node` (Node.js ≥ 20 в `PATH`); инструменты появляются как `mcp__wordcraft__<инструмент>`, а выходные файлы — как карточки, которые открываются в Harness.
3. Harness пока не обновляет плагины сам: чтобы обновить, удалите плагин и установите его снова по тому же адресу.

### Claude Code / другие MCP-клиенты

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

## Настройка

| Переменная | Значение |
| --- | --- |
| `WORDCRAFT_DIR` | Папка WordCraft, один из его исполняемых файлов, корень `.tar.gz` (с `bin/`) или `WordCraft.app`. По умолчанию: автоопределение |
| `WORDCRAFT_CLI` | Путь к `wordcraft-cli` / `wordcraft-cli.exe` (важнее, чем `WORDCRAFT_DIR`) |
| `WORDCRAFT_APP` | Путь к настольному приложению, если оно лежит в другом месте (например, AppImage в Linux) |
| `WORDCRAFT_CONTROL_PORT` | Порт управления настольным приложением (по умолчанию 7985) |
| `WORDCRAFT_MCP_TIMEOUT` | Максимум секунд на один вызов движка (по умолчанию 3600) |

## Безопасность

- Файлы **никогда не перезаписываются**, если не указано `overwrite: true`: в папках берётся свободное имя (`_2`), а существующий `output_path` вызывает ошибку. Документы, изображения и данные только читаются; изменённый документ сохраняется лишь как новая копия.
- Все пути должны быть абсолютными. Движок работает без окна с документами в памяти и никогда не трогает приложение WordCraft, если не указано `live: true`.
- Всё выполняется локально, без доступа к сети. Каждая задача использует отдельный движок во временной папке, которая удаляется в конце.

## Разработка

```bash
npm run build       # TypeScript + бандл в одном файле (dist/bundle.cjs)
npm test            # модульные тесты (логика путей Windows, macOS и Linux)
npm run test:e2e    # 26 сквозных проверок (28 с `E2E_LIVE=1`) через настоящий MCP stdio (синтетические изображение и CSV)
npm run pack:mcpb   # wordcraft-mcp-server.mcpb
npm run pack:codex  # zip плагина для Codex / DeepSeek Harness
```

Проверка Linux в Docker (сначала распакуйте `wordcraft-<версия>-linux-x86_64.tar.gz`):

```bash
docker run --rm -v "$PWD:/work:ro" -v "/путь/к/wordcraft-0.6.1-linux-x86_64:/opt/wordcraft:ro" -e WORDCRAFT_DIR=/opt/wordcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## Лицензия

Apache-2.0. WordCraft © его авторы (Storytold), MIT или Apache-2.0.
Этот проект не связан с WordCraft или Storytold и не одобрен ими. Word — товарный знак Microsoft.
