<p align="center"><img src="icon.png" width="120" alt="WordCraft Bridge 图标"></p>

<h1 align="center">WordCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <b>简体中文</b> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  让 Claude 使用你电脑上安装的 <b>WordCraft</b> 撰写和编辑文档 —— <b>Windows、macOS 和 Linux</b>：<br>
  报告、信函和简历，查找替换，批注和修订，邮件合并，以及 DOCX、PDF、ODT、RTF、HTML、Markdown 和 LaTeX。
</p>

---

## 为什么

[WordCraft](https://github.com/storytold/wordcraft) 是一款用 Rust 编写的开源 Word 级文字处理软件，带有无界面 CLI（`wordcraft-cli`）、615 条命令、DOCX / ODT / RTF / PDF 支持以及 MCP 模式。本 [Model Context Protocol](https://modelcontextprotocol.io) 服务器把这个引擎变成 Claude 可用的 **“文件进 / 文件出”工具**，你可以这样提问：

> *“写一份 3 页的季度报告，包含目录、销售表、这张图表和页码，输出 DOCX 和 PDF。”*
> *“在 `合同.docx` 中，用修订模式把 'ACME 有限公司' 改为 'ACME 股份公司'，并在付款条款上添加批注。”*
> *“为 `客户.xlsx` 中的每位客户生成一封信，写上姓名和城市。”*
> *“接受 `D:\合同` 中每个文档的所有修订，并导出为 PDF。”*
> *“把这些 Markdown 笔记转换成 Word，再把这个 Word 转成 LaTeX。”*

同系列项目： [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server) 和 [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## 平台

| 系统 | 需要安装的 WordCraft 包 | 服务器自动查找的位置（无需配置） | 状态 |
| --- | --- | --- | --- |
| **Windows** 10/11（x64、x86、arm64） | MSI 或便携 zip | `C:\Program Files\WordCraft`、`%LOCALAPPDATA%\Programs\WordCraft`、`PATH` | ✅ 已验证（Windows 11） |
| **Linux**（x86_64、aarch64） | `.deb`、`.rpm` 或 `.tar.gz` | `/usr/bin`、`/usr/local/bin`、`/opt/wordcraft/bin`、`~/.local/bin`、`PATH` | ✅ 已验证（Debian 12，无界面） |
| **macOS** 11+（Apple 芯片和 Intel） | `.dmg`（应用）**加上** `wordcraft-cli-<版本>-macos-universal.zip` | `/Applications/WordCraft.app`、`/usr/local/bin`、`/opt/homebrew/bin`、`~/.local/bin`、`~/bin`、`PATH` | 🟡 已支持，尚未在 Mac 上测试 |

全部下载：[WordCraft 发布页](https://github.com/storytold/wordcraft/releases)（另有 FreeBSD 的 tar.gz，将 `WORDCRAFT_DIR` 指向它即可）。其他位置：设置 `WORDCRAFT_DIR`（文件夹、`.tar.gz` 根目录或 `WordCraft.app`）或 `WORDCRAFT_CLI`。

- **macOS：** DMG 只包含应用。解压单独的 `wordcraft-cli` zip，把 `wordcraft-cli` 移到 `/usr/local/bin`（或用 `WORDCRAFT_CLI` 指向它）。首次运行会联网检查 Apple 公证。
- **Linux：** AppImage 和 Flatpak 只包含应用，不含 `wordcraft-cli`；请使用 deb、rpm 或 tar.gz。若应用是 AppImage，请设置 `WORDCRAFT_APP`，以便 `open_in_wordcraft` 能启动它。在没有 GPU 的服务器上，已验证的环境安装了 `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`。

## 工作原理

| 组成部分 | 说明 |
| --- | --- |
| **WordCraft 引擎**（`wordcraft-cli mcp`） | WordCraft 自己的引擎：排版、样式、列表、表格、域、引用、审阅、邮件以及 DOCX / PDF / ODT / RTF / HTML / Markdown / LaTeX 写出器。每个任务都以全新的**无界面**方式启动，绝不会碰到 WordCraft 应用或已打开的文档。 |
| **MCP 服务器**（Node.js） | 11 个高层工具。根据简单的块列表（标题、段落、列表、表格、图片、目录、脚注）构建文档，在块之间把光标放在正确位置，并提前检查每个输出：WordCraft 本身会静默覆盖已有文件。 |
| **实时应用**（可选） | `open_in_wordcraft control=true` 以仅限本机的控制通道（端口 7985）启动应用，`run_wordcraft_commands live=true` 对其进行操作。用完请关闭应用。 |

## 工具

| 工具 | 功能 |
| --- | --- |
| `create_document` | 新建文档，空白或基于信函 / 简历 / 报告 / 示例模板，由块组成：1–9 级标题，段落（样式、对齐、粗体、斜体、下划线、字体、字号、颜色、突出显示），项目符号和编号列表，表格（标题行、样式、题注），图片（宽度、替代文字、题注），分页符，目录和脚注；纸张大小、方向、页边距、页眉、页脚、页码和文档属性。返回第 1 页预览 |
| `edit_document` | 单个文档、列表或文件夹：查找 / 替换（区分大小写、全字匹配、通配符），对任意文本添加批注，修订模式（每处修改都可审阅），接受或拒绝全部修订，追加块，删除个人信息；另存为新副本 |
| `mail_merge` | 从 CSV、TSV、XLSX 或 ODS 生成信函：使用带合并域的模板，或用 `{{字段}}` 占位符编写正文；输出一个合并文档（DOCX、PDF...） |
| `convert_document` | 单个文档、列表或文件夹 → DOCX、PDF、ODT、RTF、HTML、Markdown、LaTeX、TXT、WordCraft JSON 或 PNG 页面，可选打印标记（批注和修订） |
| `get_document_info` | 页数、字数、字符数、段落数、属性、样式、标题、表格、图片、批注和修订 |
| `extract_text` | 文档的纯文本，可选保存为 `.txt` |
| `render_pages` | 把页面展示给 Claude，并可选保存为 PNG |
| `list_wordcraft_catalog` | 615 条命令及参数、样式、模板、格式 |
| `run_wordcraft_commands` | 在一个会话中运行任意引擎命令以及 `type_text`、`select_text`、`get_text`、`inspect_document`...（支持 `$steps[N].字段` 引用），无界面或实时模式，然后保存 |
| `open_in_wordcraft` | 在 WordCraft 应用中打开文档（可选启用控制通道） |
| `get_wordcraft_status` | 平台、安装、版本、命令、应用 / 控制端口 |

| | |
| --- | --- |
| **打开** | DOCX、DOC、DOTX、DOCM、ODT、RTF、Markdown、LaTeX、HTML、TXT、WordCraft JSON；插入 PNG、JPEG、GIF、BMP、WebP、TIFF 和 SVG；合并 CSV / TSV / XLSX / ODS |
| **保存** | DOCX（可设密码）、PDF、ODT、RTF、HTML、Markdown、LaTeX、TXT、WordCraft JSON、PNG 页面 |

## 示例

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

## 要求

- 带 `wordcraft-cli` 的 **WordCraft**（已用 **0.6.1** 测试）；见[平台](#平台)
- Node.js ≥ 20（通过 `.mcpb` 安装时由 Claude Desktop 自带）

## 安装

### Claude Desktop（推荐，所有平台）

1. 从[最新发布](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest)下载 `wordcraft-mcp-server.mcpb`。
2. 双击它（或拖入 Claude Desktop → *设置 → 扩展*），然后点击 **安装**。
3. 可选：如果 WordCraft 不在标准位置，在扩展设置中填写其文件夹或 `wordcraft-cli` 的路径。

### Sunsam Code

从 [Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode) 插件市场安装 **WordCraft Bridge**，或把 `.mcpb` 拖到 *MCP → 安装扩展*。

### Codex（OpenAI）

**推荐 —— 插件市场（可获得更新）：** *插件 → 添加 → 添加插件市场*，来源 `jhonsu01/craft-marketplace`，引用 `main`，然后从 **Craft Bridges** 安装 **WordCraft Bridge**（[craft-marketplace](https://github.com/jhonsu01/craft-marketplace)）。刷新插件市场即可获得新版本。或者上传 zip（Codex 会把它保存在你的账户中，并拒绝同名的新版 zip）：

1. 从[最新发布](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest)下载 `wordcraft-mcp-server-<版本>-codex.zip`。
2. 在 Codex 中：*插件 → 添加 → 新插件*，选择该 zip，然后点击 **添加插件**。
3. Codex 用 `node` 启动服务器，因此 `PATH` 中必须有 Node.js ≥ 20。如果 WordCraft 不在标准位置，请把 `WORDCRAFT_DIR` 或 `WORDCRAFT_CLI` 设为系统环境变量（Codex 没有本地插件的设置表单）。

### DeepSeek Harness

1. *Plugins → Add plugin*，输入 `github:jhonsu01/craft-marketplace#path:/plugins/wordcraft-mcp-server`，点击 **Install**，再点击 **Enable now**。
2. Harness 用自带的 MCP 客户端和 `node`（`PATH` 中需有 Node.js ≥ 20）启动服务器；工具显示为 `mcp__wordcraft__<工具>`，输出文件显示为可在 Harness 中打开的卡片。
3. Harness 目前不会自动更新插件：要更新，请卸载插件后用同一地址重新安装。

### Claude Code / 其他 MCP 客户端

```bash
git clone https://github.com/jhonsu01/wordcraft-mcp-server.git
cd wordcraft-mcp-server
npm install
npm run build
```

Windows：

```bash
claude mcp add wordcraft -- node "%CD%\dist\bundle.cjs"
```

macOS / Linux：

```bash
claude mcp add wordcraft -- node "$PWD/dist/bundle.cjs"
```

## 配置

| 变量 | 含义 |
| --- | --- |
| `WORDCRAFT_DIR` | WordCraft 文件夹、其中某个可执行文件、`.tar.gz` 根目录（含 `bin/`）或 `WordCraft.app`。默认：自动检测 |
| `WORDCRAFT_CLI` | `wordcraft-cli` / `wordcraft-cli.exe` 的路径（优先于 `WORDCRAFT_DIR`） |
| `WORDCRAFT_APP` | 桌面应用在其他位置时的路径（例如 Linux 的 AppImage） |
| `WORDCRAFT_CONTROL_PORT` | 桌面应用的控制端口（默认 7985） |
| `WORDCRAFT_MCP_TIMEOUT` | 每次调用引擎的最长秒数（默认 3600） |

## 安全

- 除非 `overwrite: true`，文件**绝不会被覆盖**：在文件夹中会使用空闲的名称（`_2`），已存在的 `output_path` 会报错。文档、图片和数据只读取；编辑后的文档只会另存为新副本。
- 所有路径必须是绝对路径。引擎以无界面方式运行，文档只在内存中，除非 `live: true`，绝不会影响 WordCraft 应用。
- 一切都在本地运行，不访问网络。每个任务使用独立引擎，运行在结束后会被删除的临时文件夹中。

## 开发

```bash
npm run build       # TypeScript + 单文件 bundle（dist/bundle.cjs）
npm test            # 单元测试（Windows、macOS 和 Linux 路径逻辑）
npm run test:e2e    # 29 项端到端检查（`E2E_LIVE=1` 时 31 项），通过真实 MCP stdio 运行（合成图片和 CSV）
npm run pack:mcpb   # wordcraft-mcp-server.mcpb
npm run pack:codex  # Codex / DeepSeek Harness 插件 zip
```

在 Docker 中测试 Linux（先解压 `wordcraft-<版本>-linux-x86_64.tar.gz`）：

```bash
docker run --rm -v "$PWD:/work:ro" -v "/path/to/wordcraft-0.6.1-linux-x86_64:/opt/wordcraft:ro" -e WORDCRAFT_DIR=/opt/wordcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## 许可证

Apache-2.0。WordCraft 版权归其作者（Storytold）所有，采用 MIT 或 Apache-2.0。
本项目与 WordCraft 或 Storytold 无关，也未获其认可。Word 是 Microsoft 的商标。
