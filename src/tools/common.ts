import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { WordCraftSession } from '../engine.js';
import { resolveOutputPath, stemOf, toEnginePath } from '../paths.js';
import { withFileLinks } from '../links.js';

export type Content = { type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string };
export type ToolResult = { content: Content[]; isError?: boolean };

export function json(obj: unknown, isError = false): ToolResult {
  const out: ToolResult = { content: [{ type: 'text', text: JSON.stringify(withFileLinks(obj), null, 2) }] };
  if (isError) out.isError = true;
  return out;
}

export function errorResult(e: unknown): ToolResult {
  return json({ success: false, error: e instanceof Error ? e.message : String(e) }, true);
}

export const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } as const;
export const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

// ---------------------------------------------------------------- formats

/** Files WordCraft opens as documents (any other text file opens as plain text). */
export const DOCUMENTS = ['docx', 'doc', 'dotx', 'docm', 'odt', 'rtf', 'md', 'markdown', 'tex', 'html', 'htm', 'txt', 'json'];
export const IMAGES = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tif', 'tiff', 'svg', 'emf', 'wmf'];
export const DATA = ['csv', 'tsv', 'txt', 'xlsx', 'xlsm', 'ods'];

/** Output formats: id → extension. png writes one image per page. */
export const OUTPUTS = {
  docx: 'docx',
  pdf: 'pdf',
  odt: 'odt',
  rtf: 'rtf',
  html: 'html',
  md: 'md',
  tex: 'tex',
  txt: 'txt',
  json: 'json',
  png: 'png',
} as const;
export type OutputFormat = keyof typeof OUTPUTS;
export const OUTPUT_IDS = Object.keys(OUTPUTS) as [OutputFormat, ...OutputFormat[]];

export const formatsSchema = z
  .array(z.enum(OUTPUT_IDS))
  .min(1)
  .max(10)
  .describe(
    'Outputs: docx (Word, editable), pdf, odt (OpenDocument), rtf, html, md (Markdown), tex (LaTeX), txt, json (WordCraft document ' +
      'model) and png (one image per page: <name>_p1.png...).',
  );

export const exportOptionsSchema = {
  markup: z
    .boolean()
    .optional()
    .describe('Print Markup: tracked changes marked up and comments beside each page (pdf / png), a comment list (html / md / txt).'),
  export_pages: z.string().optional().describe('png only: pages to render, 1-based: "1-3,5" (default all).'),
  scale: z.number().positive().max(6).optional().describe('png only: pixels per point (default 2 ≈ 144 dpi).'),
  password: z.string().optional().describe('docx only: encrypt the saved document with this password.'),
};
export type ExportOpts = { [K in keyof typeof exportOptionsSchema]?: z.infer<(typeof exportOptionsSchema)[K]> };

export const outputSchema = {
  output_dir: z.string().optional().describe('Absolute output folder (default: next to the input; required for new documents).'),
  output_path: z.string().optional().describe('Absolute output file for the first format (its extension must match).'),
  overwrite: z.boolean().default(false).describe('Replace existing outputs.'),
};

// ---------------------------------------------------------------- inputs

export function collectInputs(paths: string[], dir?: string, exts = DOCUMENTS): string[] {
  const out: string[] = [];
  for (const p of paths) {
    if (!path.isAbsolute(p)) throw new Error(`Paths must be absolute: ${p}`);
    if (!existsSync(p) || !statSync(p).isFile()) throw new Error(`File not found: ${p}`);
    out.push(p);
  }
  if (dir) {
    if (!path.isAbsolute(dir)) throw new Error(`input_dir must be an absolute path: ${dir}`);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new Error(`Folder not found: ${dir}`);
    for (const name of readdirSync(dir).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
      const full = path.join(dir, name);
      // Word lock files (~$name.docx) are never documents
      if (!name.startsWith('~$') && exts.includes(path.extname(name).slice(1).toLowerCase()) && statSync(full).isFile()) out.push(full);
    }
  }
  if (out.length === 0) throw new Error('No input files.');
  return out;
}

export function outputFor(input: string, ext: string, suffix: string, o: { output_path?: string; output_dir?: string; overwrite?: boolean }): string {
  if (o.output_dir) mkdirSync(o.output_dir, { recursive: true });
  const r = resolveOutputPath({ inputPath: input, ext, suffix, outputPath: o.output_path, outputDir: o.output_dir, overwrite: o.overwrite });
  if ('error' in r) throw new Error(r.error);
  mkdirSync(path.dirname(r.path), { recursive: true });
  return r.path;
}

/** "1-3,5" → [1,2,3,5] (bounded by the page count). */
export function parsePages(spec: string | undefined, count: number): number[] {
  if (!spec) return Array.from({ length: count }, (_, i) => i + 1);
  const out = new Set<number>();
  for (const part of spec.split(',').map((x) => x.trim()).filter(Boolean)) {
    const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!m) throw new Error(`Bad page range "${part}" (use e.g. "1-3,5").`);
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let p = Math.min(a, b); p <= Math.max(a, b); p++) if (p >= 1 && p <= count) out.add(p);
  }
  if (!out.size) throw new Error(`No pages in "${spec}" (the document has ${count}).`);
  return [...out].sort((x, y) => x - y);
}

/** A file name given by the user: kept as is (dots included), except a trailing output / document extension. */
export function nameStem(name: string): string {
  const exts = new Set<string>([...Object.values(OUTPUTS), ...DOCUMENTS]);
  const m = /\.([^.\\/]+)$/.exec(name);
  return m && exts.has(m[1].toLowerCase()) ? name.slice(0, -m[0].length) : name;
}

// ---------------------------------------------------------------- engine helpers

export interface Exported {
  path: string;
  format: string;
  bytes?: number;
  pages?: number;
  files?: string[];
}

function size(p: string): number | undefined {
  try {
    return statSync(p).size;
  } catch {
    return undefined;
  }
}

/** Page count of the active document. */
export async function pageCount(s: WordCraftSession): Promise<number> {
  const doc = await s.json('inspect_document', {});
  return Math.max(1, Number(doc?.pages ?? 1));
}

/**
 * Save the active document once per format: output_path for the first, the others as
 * <output_dir or the base's folder>/<stem><suffix>.<ext>; never replacing anything unless overwrite.
 * Saving never touches the source file.
 */
export async function exportAll(
  s: WordCraftSession,
  base: { stemSource: string; name?: string; suffix: string; output_dir?: string; output_path?: string; overwrite?: boolean },
  formats: OutputFormat[],
  o: ExportOpts,
): Promise<Exported[]> {
  const out: Exported[] = [];
  for (const [i, f] of formats.entries()) {
    const ext = OUTPUTS[f];
    const usePath = i === 0 && base.output_path;
    if (usePath && f === 'png') throw new Error('output_path cannot name png output (one file per page); use output_dir.');
    if (usePath && path.extname(base.output_path!).slice(1).toLowerCase() !== ext) throw new Error(`output_path must end in .${ext} for ${f}.`);
    const dir = base.output_dir ?? path.dirname(base.output_path ?? base.stemSource);
    const stem = base.output_path ? stemOf(base.output_path) : (base.name !== undefined ? nameStem(base.name) : stemOf(base.stemSource)) + base.suffix;
    const target = (e: string, suffix = '') =>
      usePath
        ? outputFor(base.output_path + '.__src', e, '', { output_path: base.output_path, overwrite: base.overwrite })
        : outputFor(path.join(dir, stem + suffix + '.__src'), e, '', { output_dir: dir, overwrite: base.overwrite });
    if (f === 'png') {
      const count = await pageCount(s);
      const pages = parsePages(o.export_pages, count);
      const files: string[] = [];
      for (const pg of pages) {
        const p = target('png', count > 1 || o.export_pages ? `_p${pg}` : '');
        await s.cmd('file.exportPng', { path: toEnginePath(p), page: pg, scale: o.scale ?? 2, ...(o.markup ? { markup: true } : {}) });
        files.push(p);
      }
      out.push({ path: files[0], format: f, files, pages: files.length });
      continue;
    }
    const p = target(ext);
    if (f === 'pdf') await s.cmd('file.exportPdf', { path: toEnginePath(p), ...(o.markup ? { markup: true } : {}) });
    else await s.cmd('file.saveAs', { path: toEnginePath(p), ...(o.markup ? { markup: true } : {}), ...(o.password && f === 'docx' ? { password: o.password } : {}) });
    out.push({ path: p, format: f, bytes: size(p) });
  }
  return out;
}

/** A rendered page (1-based) of the active document, returned as an MCP image. */
export async function preview(s: WordCraftSession, page = 1, scale = 1): Promise<{ data: string; mimeType: string } | undefined> {
  const r = await s.call('render_page', { page, scale });
  const img = r.content.find((c) => c.type === 'image');
  return img?.data ? { data: img.data, mimeType: img.mimeType ?? 'image/png' } : undefined;
}

export function withPreview(body: unknown, imgs: ({ data: string; mimeType: string } | undefined)[], isError = false): ToolResult {
  const res = json(body, isError);
  for (const img of imgs) if (img) res.content.push({ type: 'image', ...img });
  return res;
}

export { stemOf };
