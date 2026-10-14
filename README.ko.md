<p align="center"><img src="icon.png" width="120" alt="WordCraft Bridge 아이콘"></p>

<h1 align="center">WordCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <b>한국어</b>
</p>

<p align="center">
  컴퓨터에 설치된 <b>WordCraft</b>로 Claude가 문서를 작성하고 편집하게 하세요 — <b>Windows, macOS, Linux</b>:<br>
  보고서, 편지, 이력서, 찾기 및 바꾸기, 메모와 변경 내용 추적, 편지 병합, 그리고 DOCX, PDF, ODT, RTF, HTML, Markdown, LaTeX.
</p>

---

## 왜 필요한가

[WordCraft](https://github.com/storytold/wordcraft)는 Rust로 작성된 오픈 소스 Word급 워드 프로세서로, 화면 없는 CLI(`wordcraft-cli`), 615개 명령, DOCX / ODT / RTF / PDF 지원, MCP 모드를 갖추고 있습니다. 이 [Model Context Protocol](https://modelcontextprotocol.io) 서버는 그 엔진을 Claude용 **파일 입력 / 파일 출력 도구**로 바꿔 주므로, 이렇게 요청할 수 있습니다:

> *"목차, 판매 표, 이 차트, 페이지 번호가 있는 3페이지 분기 보고서를 DOCX와 PDF로 작성해 줘."*
> *"`계약서.docx`에서 'ACME 유한회사'를 변경 내용 추적으로 'ACME 주식회사'로 바꾸고 지급 조항에 메모를 달아 줘."*
> *"`고객.xlsx`의 고객마다 이름과 도시가 들어간 편지를 만들어 줘."*
> *"`D:\계약` 안의 모든 문서에서 변경 내용을 모두 수락하고 PDF로 내보내 줘."*
> *"이 Markdown 메모를 Word로, 이 Word 문서를 LaTeX로 변환해 줘."*

형제 프로젝트: [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server), [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## 플랫폼

| OS | 설치할 WordCraft 패키지 | 서버가 찾는 위치(설정 불필요) | 상태 |
| --- | --- | --- | --- |
| **Windows** 10/11 (x64, x86, arm64) | MSI 또는 포터블 zip | `C:\Program Files\WordCraft`, `%LOCALAPPDATA%\Programs\WordCraft`, `PATH` | ✅ 검증됨 (Windows 11) |
| **Linux** (x86_64, aarch64, riscv64) | `.deb`, `.rpm` 또는 `.tar.gz` | `/usr/bin`, `/usr/local/bin`, `/opt/wordcraft/bin`, `~/.local/bin`, `PATH` | ✅ 검증됨 (Debian 12, 화면 없음) |
| **macOS** 11+ (Apple 실리콘 및 Intel) | `.dmg`(앱) **와 함께** `wordcraft-cli-<버전>-macos-universal.zip` | `/Applications/WordCraft.app`, `/usr/local/bin`, `/opt/homebrew/bin`, `~/.local/bin`, `~/bin`, `PATH` | 🟡 지원됨, Mac에서는 아직 미검증 |

모든 다운로드: [WordCraft 릴리스](https://github.com/storytold/wordcraft/releases) (FreeBSD용 tar.gz도 있습니다. `WORDCRAFT_DIR`로 지정하세요). 다른 위치라면 `WORDCRAFT_DIR`(폴더, `.tar.gz` 루트 또는 `WordCraft.app`)이나 `WORDCRAFT_CLI`를 설정하세요.

- **macOS:** DMG에는 앱만 들어 있습니다. 별도의 `wordcraft-cli` zip을 풀고 `wordcraft-cli`를 `/usr/local/bin`으로 옮기세요(또는 `WORDCRAFT_CLI`로 지정). 처음 실행할 때 Apple 공증을 온라인으로 확인합니다.
- **Linux:** AppImage와 Flatpak에는 앱만 있고 `wordcraft-cli`는 없습니다. deb, rpm 또는 tar.gz를 사용하세요. 앱이 AppImage라면 `open_in_wordcraft`가 실행할 수 있도록 `WORDCRAFT_APP`을 설정하세요. GPU가 없는 서버에서 검증한 환경은 `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`를 사용했습니다.

## 작동 방식

| 구성 요소 | 설명 |
| --- | --- |
| **WordCraft 엔진** (`wordcraft-cli mcp`) | WordCraft 자체 엔진: 레이아웃, 스타일, 목록, 표, 필드, 참조, 검토, 편지 병합과 DOCX / PDF / ODT / RTF / HTML / Markdown / LaTeX 출력기. 작업마다 새로 **화면 없이** 시작되므로 WordCraft 앱이나 열려 있는 문서를 절대 건드리지 않습니다. |
| **MCP 서버** (Node.js) | 11개의 고수준 도구. 간단한 블록 목록(제목, 단락, 목록, 표, 이미지, 목차, 각주)으로 문서를 만들고, 블록 사이에서 커서를 올바른 위치에 두며, 모든 출력을 미리 확인합니다: WordCraft 자체는 기존 파일을 조용히 덮어씁니다. |
| **라이브 앱** (선택) | `open_in_wordcraft control=true`는 로컬 전용 제어 채널(포트 7985)로 앱을 시작하고, `run_wordcraft_commands live=true`가 앱을 조작합니다. 작업이 끝나면 앱을 닫으세요. |

## 도구

| 도구 | 기능 |
| --- | --- |
| `create_document` | 빈 문서 또는 편지 / 이력서 / 보고서 / 샘플 서식으로 블록을 이용해 새 문서 작성: 제목 1–9, 단락(스타일, 정렬, 굵게, 기울임, 밑줄, 글꼴, 크기, 색, 형광펜), 글머리 기호 및 번호 목록, 표(머리글 행, 스타일, 캡션), 이미지(너비, 대체 텍스트, 캡션), 페이지 나누기, 목차, 각주; 용지 크기, 방향, 여백, 머리글, 바닥글, 페이지 번호, 문서 속성. 1페이지 미리 보기 반환 |
| `edit_document` | 문서 하나, 목록 또는 폴더: 찾기 / 바꾸기(대소문자, 단어 단위, 와일드카드), 모든 텍스트에 메모, 변경 내용 추적(모든 편집 검토 가능), 모든 수정 사항 수락 또는 거부, 블록 추가, 개인 정보 제거; 새 사본으로 저장 |
| `mail_merge` | CSV, TSV, XLSX, ODS로 편지 생성: 병합 필드가 있는 서식 또는 `{{필드}}` 자리 표시자로 쓴 본문; 병합된 문서 하나(DOCX, PDF...) |
| `convert_document` | 문서 하나, 목록 또는 폴더 → DOCX, PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, WordCraft JSON, PNG 페이지. 메모와 변경 내용 인쇄 선택 가능 |
| `get_document_info` | 페이지, 단어, 문자, 단락, 속성, 스타일, 제목, 표, 이미지, 메모, 수정 사항 |
| `extract_text` | 문서의 일반 텍스트, `.txt`로 저장 선택 가능 |
| `render_pages` | 페이지를 Claude에게 보여 주고 PNG로 저장 선택 가능 |
| `list_wordcraft_catalog` | 매개변수가 있는 615개 명령, 스타일, 서식, 형식 |
| `run_wordcraft_commands` | 모든 엔진 명령과 `type_text`, `select_text`, `get_text`, `inspect_document`...를 한 세션에서 실행(`$steps[N].필드` 참조), 화면 없이 또는 라이브로 실행 후 저장 |
| `open_in_wordcraft` | WordCraft 앱에서 문서 열기(제어 채널 선택 가능) |
| `get_wordcraft_status` | 플랫폼, 설치, 버전, 명령, 앱 / 제어 포트 |

| | |
| --- | --- |
| **열기** | DOCX, DOC, DOTX, DOCM, ODT, RTF, Markdown, LaTeX, HTML, TXT, WordCraft JSON; PNG, JPEG, GIF, BMP, WebP, TIFF, SVG 삽입; CSV / TSV / XLSX / ODS 병합 |
| **저장** | DOCX(암호 설정 가능), PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, WordCraft JSON, PNG 페이지 |

## 예시

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

## 요구 사항

- `wordcraft-cli`가 포함된 **WordCraft**(**0.6.1**으로 검증), [플랫폼](#플랫폼) 참고
- Node.js ≥ 20 (`.mcpb`로 설치할 때는 Claude Desktop에 포함)

## 설치

### Claude Desktop (권장, 모든 플랫폼)

1. [최신 릴리스](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest)에서 `wordcraft-mcp-server.mcpb`를 내려받습니다.
2. 두 번 클릭하거나 Claude Desktop → *설정 → 확장 프로그램*으로 끌어다 놓고 **설치**를 누릅니다.
3. 선택: WordCraft가 표준 위치에 없다면 확장 프로그램 설정에서 해당 폴더나 `wordcraft-cli` 경로를 입력합니다.

### Sunsam Code

[Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode) 마켓플레이스에서 **WordCraft Bridge**를 설치하거나 `.mcpb`를 *MCP → 확장 프로그램 설치*에 끌어다 놓으세요.

### Codex (OpenAI)

**권장 — 마켓플레이스(업데이트 받음):** *플러그인 → 추가 → 마켓플레이스 추가*에서 소스 `jhonsu01/craft-marketplace`, 참조 `main`을 지정한 뒤 **Craft Bridges**에서 **WordCraft Bridge**를 설치합니다([craft-marketplace](https://github.com/jhonsu01/craft-marketplace)). 마켓플레이스를 새로 고치면 새 버전이 설치됩니다. 또는 zip을 업로드합니다(Codex는 계정에 저장하고 같은 이름의 새 zip은 거부합니다):

1. [최신 릴리스](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest)에서 `wordcraft-mcp-server-<버전>-codex.zip`을 내려받습니다.
2. Codex에서 *플러그인 → 추가 → 새 플러그인*을 열고 zip을 선택한 뒤 **플러그인 추가**를 누릅니다.
3. Codex는 `node`로 서버를 시작하므로 `PATH`에 Node.js ≥ 20이 있어야 합니다. WordCraft가 표준 위치에 없다면 `WORDCRAFT_DIR` 또는 `WORDCRAFT_CLI`를 시스템 환경 변수로 설정하세요(Codex에는 로컬 플러그인용 설정 화면이 없습니다).

### DeepSeek Harness

1. *Plugins → Add plugin*에서 `github:jhonsu01/craft-marketplace#path:/plugins/wordcraft-mcp-server`를 입력하고 **Install**, 이어서 **Enable now**를 누릅니다.
2. Harness는 자체 MCP 클라이언트와 `node`(`PATH`에 Node.js ≥ 20 필요)로 서버를 시작합니다. 도구는 `mcp__wordcraft__<도구>`로 표시되고, 출력 파일은 Harness에서 열리는 카드로 표시됩니다.
3. Harness는 아직 플러그인을 자동으로 업데이트하지 않습니다. 업데이트하려면 플러그인을 제거한 뒤 같은 주소로 다시 설치하세요.

### Claude Code / 기타 MCP 클라이언트

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

## 설정

| 변수 | 의미 |
| --- | --- |
| `WORDCRAFT_DIR` | WordCraft 폴더, 그 안의 실행 파일, `.tar.gz` 루트(`bin/` 포함) 또는 `WordCraft.app`. 기본값: 자동 감지 |
| `WORDCRAFT_CLI` | `wordcraft-cli` / `wordcraft-cli.exe` 경로(`WORDCRAFT_DIR`보다 우선) |
| `WORDCRAFT_APP` | 데스크톱 앱이 다른 곳에 있을 때의 경로(예: Linux AppImage) |
| `WORDCRAFT_CONTROL_PORT` | 데스크톱 앱의 제어 포트(기본값 7985) |
| `WORDCRAFT_MCP_TIMEOUT` | 엔진 호출당 최대 초(기본값 3600) |

## 안전

- `overwrite: true`가 아니면 파일을 **절대 덮어쓰지 않습니다**. 폴더에서는 빈 이름(`_2`)을 사용하고, 이미 있는 `output_path`는 오류가 됩니다. 문서, 이미지, 데이터는 읽기만 하며, 편집한 문서는 새 사본으로만 저장됩니다.
- 모든 경로는 절대 경로여야 합니다. 엔진은 메모리 안의 문서로 화면 없이 실행되며, `live: true`가 아니면 WordCraft 앱을 건드리지 않습니다.
- 모든 작업은 네트워크 접근 없이 로컬에서 실행됩니다. 작업마다 임시 폴더에서 전용 엔진을 사용하고, 끝나면 폴더를 삭제합니다.

## 개발

```bash
npm run build       # TypeScript + 단일 파일 번들(dist/bundle.cjs)
npm test            # 단위 테스트(Windows, macOS, Linux 경로 처리)
npm run test:e2e    # 실제 MCP stdio로 26개 엔드투엔드 검사(`E2E_LIVE=1`이면 28개, 합성 이미지와 CSV)
npm run pack:mcpb   # wordcraft-mcp-server.mcpb
npm run pack:codex  # Codex / DeepSeek Harness 플러그인 zip
```

Docker에서 Linux 테스트(먼저 `wordcraft-<버전>-linux-x86_64.tar.gz`를 풀어 두세요):

```bash
docker run --rm -v "$PWD:/work:ro" -v "/path/to/wordcraft-0.6.1-linux-x86_64:/opt/wordcraft:ro" -e WORDCRAFT_DIR=/opt/wordcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## 라이선스

Apache-2.0. WordCraft의 저작권은 저작자(Storytold)에게 있으며 MIT 또는 Apache-2.0으로 제공됩니다.
이 프로젝트는 WordCraft 또는 Storytold와 관련이 없으며 이들의 보증을 받지 않았습니다. Word은 Microsoft의 상표입니다.
