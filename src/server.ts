import { readFileSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAdvancedTools } from './tools/advanced.js';
import { registerDocumentTools } from './tools/documents.js';
import { LINK_INSTRUCTIONS } from './links.js';

/** serverInfo.version comes from package.json (reachable as ../package.json from dist/ and src/). */
export function readPackageVersion(): string {
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(path.resolve(dir, '../package.json'), 'utf-8')) as { version?: unknown };
    if (typeof pkg.version === 'string' && pkg.version) return pkg.version;
  } catch {
    // package.json not shipped next to the bundle: still start
  }
  return '0.0.0-unknown';
}

export function createServer(): McpServer {
  const server = new McpServer(
    { name: 'wordcraft-mcp-server', version: readPackageVersion() },
    {
      instructions:
        'Writes and edits documents with the engine of the locally installed WordCraft (Windows, macOS, Linux), an open-source ' +
        'Word-class word processor: new documents from headings, paragraphs, lists, tables, images, a table of contents and footnotes ' +
        '(blank or from letter / resume / report templates) with page size, margins, headers, footers and page numbers; find and replace, ' +
        'comments and tracked changes in existing documents; mail merge from CSV or spreadsheets; conversion between docx, doc, pdf, odt, ' +
        'rtf, html, md, tex and txt; text extraction, document info and page previews. All paths must be absolute; inputs are only read; ' +
        'files are never overwritten unless overwrite is true. The engine runs headless and never touches the WordCraft app unless ' +
        'live=true. list_wordcraft_catalog lists the 615 engine commands and the styles; run_wordcraft_commands runs any of them.' +
        ' ' +
        LINK_INSTRUCTIONS,
    },
  );
  registerDocumentTools(server);
  registerAdvancedTools(server);
  return server;
}
