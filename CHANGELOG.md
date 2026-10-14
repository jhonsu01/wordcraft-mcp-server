# Changelog

## [1.0.1] - 2026-10-14
### Fixed
- `create_document` / `edit_document`: a block's `align` no longer carries over to the blocks after it (a centred
  paragraph used to centre every heading, list and paragraph that followed).
- A table `caption` no longer leaves an empty paragraph between the table and the next block.
- Footnotes: the mark now stays at the end of the block it follows (it used to move to the start of the next
  paragraph), a footnote right after a table goes in its last cell, and the text after a footnote no longer takes
  the mark's small character style.
### Added
- `get_document_info` (`include_structure`) reports each paragraph's alignment and footnote marks.
### Verified
- Windows 11 and Debian 12 (Docker): 29/29 end-to-end checks each (new: alignment, caption placement, footnote
  placement; all three fail on 1.0.0); a two-page report with a table of contents checked page by page.

## [1.0.0] - 2026-10-13
### Added
- First release: 11 tools over WordCraft's headless engine (`wordcraft-cli mcp`) for Windows, macOS and Linux:
  `create_document`, `edit_document`, `mail_merge`, `convert_document`, `get_document_info`, `extract_text`,
  `render_pages`, `list_wordcraft_catalog`, `run_wordcraft_commands`, `open_in_wordcraft` and `get_wordcraft_status`.
- Documents built from blocks: headings, styled and formatted paragraphs, bullet and numbered lists, tables with
  captions, images with captions, page breaks, a table of contents and footnotes; page size, margins, headers, footers,
  page numbers and properties.
- Editing: find / replace (match case, whole word, wildcards), comments, tracked changes, accept / reject all
  revisions, appended content and removal of personal information, always saved as a new copy.
- Mail merge from CSV, TSV, XLSX or ODS with a template or a body using `{{Field}}` placeholders (unknown columns are
  reported).
- Output to DOCX (optionally with a password), PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, WordCraft JSON and PNG pages,
  with optional Print Markup; `files_markdown` links to every output.
- Packages: `wordcraft-mcp-server.mcpb` (Claude Desktop, Sunsam Code) and `wordcraft-mcp-server-<version>-codex.zip`
  (Codex and DeepSeek Harness, also published in the Craft Bridges marketplace).
### Verified
- WordCraft 0.6.1 on Windows 11 (26 end-to-end checks plus 2 driving the live app) and on Debian 12 in Docker,
  headless (26/26); the `.mcpb` tested unpacked. macOS is supported by the path logic but not yet tested on a Mac.
