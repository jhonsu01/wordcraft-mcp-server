<p align="center"><img src="icon.png" width="120" alt="WordCraft Bridge のアイコン"></p>

<h1 align="center">WordCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh-CN.md">简体中文</a> · <b>日本語</b> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  お使いのコンピューターにインストールされた <b>WordCraft</b> で、Claude に文書の作成と編集を任せましょう — <b>Windows、macOS、Linux</b>：<br>
  レポート、手紙、履歴書、検索と置換、コメントと変更履歴、差し込み印刷、そして DOCX、PDF、ODT、RTF、HTML、Markdown、LaTeX。
</p>

---

## なぜ

[WordCraft](https://github.com/storytold/wordcraft) は Rust で書かれたオープンソースの Word クラスのワープロで、画面なしの CLI（`wordcraft-cli`）、615 のコマンド、DOCX / ODT / RTF / PDF 対応、MCP モードを備えています。この [Model Context Protocol](https://modelcontextprotocol.io) サーバーはそのエンジンを Claude 用の **「ファイルを入れてファイルを出す」ツール**に変えるので、次のように頼めます：

> *「目次、売上表、このグラフ、ページ番号付きの 3 ページの四半期レポートを DOCX と PDF で書いて。」*
> *「`契約書.docx` で『ACME 合同会社』を変更履歴付きで『ACME 株式会社』に変え、支払条項にコメントを付けて。」*
> *「`顧客.xlsx` の顧客ごとに、名前と都市を入れた手紙を作って。」*
> *「`D:\契約` のすべての文書の変更をすべて承諾して PDF で書き出して。」*
> *「この Markdown のメモを Word に、この Word を LaTeX に変換して。」*

姉妹プロジェクト： [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server)、[audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## 対応プラットフォーム

| OS | インストールする WordCraft パッケージ | サーバーが探す場所（設定不要） | 状態 |
| --- | --- | --- | --- |
| **Windows** 10/11（x64、x86、arm64） | MSI またはポータブル zip | `C:\Program Files\WordCraft`、`%LOCALAPPDATA%\Programs\WordCraft`、`PATH` | ✅ 検証済み（Windows 11） |
| **Linux**（x86_64、aarch64） | `.deb`、`.rpm` または `.tar.gz` | `/usr/bin`、`/usr/local/bin`、`/opt/wordcraft/bin`、`~/.local/bin`、`PATH` | ✅ 検証済み（Debian 12、画面なし） |
| **macOS** 11+（Apple シリコンと Intel） | `.dmg`（アプリ）**に加えて** `wordcraft-cli-<バージョン>-macos-universal.zip` | `/Applications/WordCraft.app`、`/usr/local/bin`、`/opt/homebrew/bin`、`~/.local/bin`、`~/bin`、`PATH` | 🟡 対応済み、Mac では未検証 |

ダウンロード：[WordCraft のリリース](https://github.com/storytold/wordcraft/releases)（FreeBSD 用の tar.gz もあります。`WORDCRAFT_DIR` で指定してください）。それ以外の場所なら `WORDCRAFT_DIR`（フォルダー、`.tar.gz` のルート、`WordCraft.app`）または `WORDCRAFT_CLI` を設定します。

- **macOS：** DMG にはアプリしか入っていません。別配布の `wordcraft-cli` の zip を展開し、`wordcraft-cli` を `/usr/local/bin` に移動してください（または `WORDCRAFT_CLI` で指定）。初回起動時に Apple の公証がオンラインで確認されます。
- **Linux：** AppImage と Flatpak にはアプリしか入っておらず、`wordcraft-cli` は含まれません。deb、rpm、tar.gz を使ってください。アプリが AppImage の場合は、`open_in_wordcraft` が起動できるよう `WORDCRAFT_APP` を設定します。GPU のないサーバーでの検証環境では `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig` を使いました。

## 仕組み

| 構成要素 | 内容 |
| --- | --- |
| **WordCraft エンジン**（`wordcraft-cli mcp`） | WordCraft 自身のエンジン：レイアウト、スタイル、リスト、表、フィールド、参照、校閲、差し込み文書、DOCX / PDF / ODT / RTF / HTML / Markdown / LaTeX の書き出し。ジョブごとに新しく**画面なし**で起動するため、WordCraft アプリや開いている文書には一切触れません。 |
| **MCP サーバー**（Node.js） | 11 の高レベルツール。シンプルなブロックのリスト（見出し、段落、リスト、表、画像、目次、脚注）から文書を組み立て、ブロック間でカーソルを正しい位置に保ち、出力を事前に確認します：WordCraft 単体では既存ファイルを黙って置き換えてしまいます。 |
| **ライブアプリ**（任意） | `open_in_wordcraft control=true` はローカル専用の制御チャネル（ポート 7985）付きでアプリを起動し、`run_wordcraft_commands live=true` で操作します。終わったらアプリを閉じてください。 |

## ツール

| ツール | 機能 |
| --- | --- |
| `create_document` | 白紙、または手紙 / 履歴書 / レポート / サンプルのテンプレートから、ブロックで新しい文書を作成：見出し 1–9、段落（スタイル、配置、太字、斜体、下線、フォント、サイズ、色、蛍光ペン）、箇条書きと番号付きリスト、表（見出し行、スタイル、図表番号）、画像（幅、代替テキスト、図表番号）、改ページ、目次、脚注；用紙サイズ、向き、余白、ヘッダー、フッター、ページ番号、プロパティ。1 ページ目のプレビューを返します |
| `edit_document` | 1 つの文書、リスト、またはフォルダー：検索 / 置換（大文字小文字、単語単位、ワイルドカード）、任意のテキストへのコメント、変更履歴（すべての編集を確認可能）、すべての変更の承諾または却下、ブロックの追加、個人情報の削除；新しいコピーとして保存 |
| `mail_merge` | CSV、TSV、XLSX、ODS からの手紙：差し込みフィールド付きのテンプレート、または `{{フィールド}}` で書いた本文；1 つの差し込み済み文書（DOCX、PDF...） |
| `convert_document` | 1 つの文書、リスト、またはフォルダー → DOCX、PDF、ODT、RTF、HTML、Markdown、LaTeX、TXT、WordCraft JSON、PNG ページ。コメントと変更の印刷も可能 |
| `get_document_info` | ページ数、単語数、文字数、段落数、プロパティ、スタイル、見出し、表、画像、コメント、変更履歴 |
| `extract_text` | 文書のプレーンテキスト。`.txt` として保存も可能 |
| `render_pages` | ページを Claude に表示し、PNG として保存も可能 |
| `list_wordcraft_catalog` | パラメーター付きの 615 コマンド、スタイル、テンプレート、形式 |
| `run_wordcraft_commands` | 任意のエンジンコマンドと `type_text`、`select_text`、`get_text`、`inspect_document`... を 1 つのセッションで実行（`$steps[N].フィールド` 参照）、画面なしまたはライブで実行して保存 |
| `open_in_wordcraft` | WordCraft アプリで文書を開く（制御チャネル付きも可） |
| `get_wordcraft_status` | プラットフォーム、インストール、バージョン、コマンド、アプリ / 制御ポート |

| | |
| --- | --- |
| **開く** | DOCX、DOC、DOTX、DOCM、ODT、RTF、Markdown、LaTeX、HTML、TXT、WordCraft JSON；PNG、JPEG、GIF、BMP、WebP、TIFF、SVG を挿入；CSV / TSV / XLSX / ODS を差し込み |
| **保存** | DOCX（パスワード設定可）、PDF、ODT、RTF、HTML、Markdown、LaTeX、TXT、WordCraft JSON、PNG ページ |

## 例

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

## 必要なもの

- `wordcraft-cli` 付きの **WordCraft**（**0.6.1** で検証）。[対応プラットフォーム](#対応プラットフォーム)を参照
- Node.js ≥ 20（`.mcpb` でインストールする場合は Claude Desktop に同梱）

## インストール

### Claude Desktop（推奨、全プラットフォーム）

1. [最新リリース](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest)から `wordcraft-mcp-server.mcpb` をダウンロードします。
2. ダブルクリック（または Claude Desktop → *設定 → 拡張機能* にドラッグ）して **インストール** をクリックします。
3. 任意：WordCraft が標準の場所にない場合は、拡張機能の設定でそのフォルダーか `wordcraft-cli` のパスを入力します。

### Sunsam Code

[Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode) のマーケットプレイスから **WordCraft Bridge** をインストールするか、`.mcpb` を *MCP → 拡張機能をインストール* にドロップします。

### Codex（OpenAI）

**推奨 — マーケットプレイス（更新を受け取れます）：** *プラグイン → 追加 → マーケットプレイスを追加* で、ソースに `jhonsu01/craft-marketplace`、参照に `main` を指定し、**Craft Bridges** から **WordCraft Bridge** をインストールします（[craft-marketplace](https://github.com/jhonsu01/craft-marketplace)）。新しいバージョンはマーケットプレイスの更新で届きます。または zip をアップロードします（Codex はアカウントに保存し、同じ名前の新しい zip を拒否します）：

1. [最新リリース](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest)から `wordcraft-mcp-server-<バージョン>-codex.zip` をダウンロードします。
2. Codex で *プラグイン → 追加 → 新しいプラグイン* を開き、zip を選んで **プラグインを追加** をクリックします。
3. Codex はサーバーを `node` で起動するため、`PATH` に Node.js ≥ 20 が必要です。WordCraft が標準の場所にない場合は、`WORDCRAFT_DIR` または `WORDCRAFT_CLI` をシステムの環境変数として設定してください（Codex にはローカルプラグイン用の設定画面がありません）。

### DeepSeek Harness

1. *Plugins → Add plugin* で `github:jhonsu01/craft-marketplace#path:/plugins/wordcraft-mcp-server` を入力し、**Install**、続けて **Enable now** をクリックします。
2. Harness は独自の MCP クライアントと `node`（`PATH` に Node.js ≥ 20 が必要）でサーバーを起動します。ツールは `mcp__wordcraft__<ツール>` として表示され、出力ファイルは Harness で開けるカードになります。
3. Harness はまだプラグインを自動更新しません。更新するには、プラグインをアンインストールして同じアドレスで再インストールしてください。

### Claude Code / その他の MCP クライアント

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

## 設定

| 変数 | 意味 |
| --- | --- |
| `WORDCRAFT_DIR` | WordCraft のフォルダー、その実行ファイルのいずれか、`.tar.gz` のルート（`bin/` を含む）または `WordCraft.app`。既定：自動検出 |
| `WORDCRAFT_CLI` | `wordcraft-cli` / `wordcraft-cli.exe` のパス（`WORDCRAFT_DIR` より優先） |
| `WORDCRAFT_APP` | デスクトップアプリが別の場所にある場合のパス（例：Linux の AppImage） |
| `WORDCRAFT_CONTROL_PORT` | デスクトップアプリの制御ポート（既定 7985） |
| `WORDCRAFT_MCP_TIMEOUT` | エンジン呼び出し 1 回あたりの最大秒数（既定 3600） |

## 安全性

- `overwrite: true` でない限り、ファイルは **決して上書きされません**。フォルダーでは空いている名前（`_2`）を使い、既存の `output_path` はエラーになります。ドキュメント、画像、データは読み取るだけで、編集したドキュメントは新しいコピーとしてのみ保存されます。
- パスはすべて絶対パスで指定します。エンジンはメモリ上のドキュメントで画面なしで動き、`live: true` でない限り WordCraft アプリには触れません。
- すべてローカルで実行され、ネットワークにはアクセスしません。ジョブごとに専用のエンジンを一時フォルダーで動かし、最後に削除します。

## 開発

```bash
npm run build       # TypeScript + 単一ファイルのバンドル（dist/bundle.cjs）
npm test            # ユニットテスト（Windows、macOS、Linux のパス処理）
npm run test:e2e    # 実際の MCP stdio による 26 のエンドツーエンドチェック（`E2E_LIVE=1` で 28、合成画像と CSV）
npm run pack:mcpb   # wordcraft-mcp-server.mcpb
npm run pack:codex  # Codex / DeepSeek Harness 用プラグイン zip
```

Docker での Linux テスト（先に `wordcraft-<バージョン>-linux-x86_64.tar.gz` を展開）：

```bash
docker run --rm -v "$PWD:/work:ro" -v "/path/to/wordcraft-0.6.1-linux-x86_64:/opt/wordcraft:ro" -e WORDCRAFT_DIR=/opt/wordcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## ライセンス

Apache-2.0。WordCraft の著作権はその作者（Storytold）に帰属し、MIT または Apache-2.0 で提供されています。
本プロジェクトは WordCraft および Storytold とは無関係であり、承認も受けていません。Word は Microsoft の商標です。
