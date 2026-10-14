import { existsSync, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { WordCraftSession, runCli, withSession } from '../engine.js';
import { toEnginePath } from '../paths.js';
import {
  DATA, DOCUMENTS, IMAGES, OUTPUTS, OutputFormat, READ, WRITE, collectInputs, errorResult, exportAll, exportOptionsSchema, formatsSchema,
  json, outputFor, outputSchema, pageCount, parsePages, preview, stemOf, withPreview,
} from './common.js';

// ---------------------------------------------------------------- content blocks

const runFormat = {
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  font: z.string().optional().describe('Font family, e.g. "Calibri", "Georgia".'),
  size: z.number().positive().max(400).optional().describe('Font size in points.'),
  color: z.string().regex(/^#?[0-9a-fA-F]{6}$/).optional().describe('Text colour "#rrggbb".'),
  highlight: z.string().optional().describe('yellow, brightGreen, turquoise, pink, blue, red, gray25...'),
};
const align = z.enum(['left', 'center', 'right', 'justify']).optional();

export const blockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('heading'),
    text: z.string(),
    level: z.number().int().min(1).max(9).default(1).describe('Heading 1-9 (also what a table of contents lists).'),
    align,
  }),
  z.object({
    type: z.literal('paragraph'),
    text: z.string().describe('Text; "\\n" starts a new paragraph with the same settings.'),
    style: z.string().optional().describe('Paragraph style name, e.g. "Normal", "Title", "Subtitle", "Quote", "Intense Quote" (default Normal).'),
    align,
    ...runFormat,
  }),
  z.object({
    type: z.literal('bullets'),
    items: z.array(z.string()).min(1).max(500),
  }),
  z.object({
    type: z.literal('numbered'),
    items: z.array(z.string()).min(1).max(500),
    kind: z.enum(['numbered', 'numberedParen', 'upperLetter', 'lowerLetter', 'lowerRoman', 'outline']).optional(),
  }),
  z.object({
    type: z.literal('table'),
    rows: z.array(z.array(z.string())).min(1).max(500).describe('Cell texts, row by row; the first row is the header when header=true.'),
    header: z.boolean().default(true).describe('Make the first row bold.'),
    style: z.string().optional().describe('Table style, e.g. "Table Grid" (default), "Light List", "Grid Table 4".'),
    caption: z.string().optional().describe('"Table 1: …" caption above the table.'),
  }),
  z.object({
    type: z.literal('image'),
    path: z.string().describe('Absolute path of a PNG, JPG, GIF, BMP, WEBP, TIFF or SVG.'),
    width: z.number().positive().optional().describe('Width in points (72 per inch); keeps the aspect ratio.'),
    alt: z.string().optional().describe('Alternative text (accessibility).'),
    caption: z.string().optional().describe('"Figure 1: …" caption below the image.'),
    align,
  }),
  z.object({ type: z.literal('page_break') }),
  z.object({
    type: z.literal('toc'),
    levels: z.number().int().min(1).max(9).default(3),
    title: z.string().optional().describe('Title above the table of contents (default "Contents").'),
  }),
  z.object({
    type: z.literal('footnote'),
    text: z.string().describe('Footnote text, attached at the end of the previous block.'),
  }),
]);
export type Block = z.infer<typeof blockSchema>;

export const pageSchema = {
  page_size: z.string().optional().describe('Letter (default), Legal, A4, A5, Executive...'),
  orientation: z.enum(['portrait', 'landscape']).optional(),
  margins: z.enum(['normal', 'narrow', 'moderate', 'wide', 'mirrored', 'office2003']).optional(),
  header: z.string().optional().describe('Header text on every page.'),
  footer: z.string().optional().describe('Footer text on every page.'),
  page_numbers: z.enum(['none', 'bottom', 'top']).optional().describe('Page numbers in the footer (bottom) or header (top).'),
};
type PageOpts = { [K in keyof typeof pageSchema]?: z.infer<(typeof pageSchema)[K]> };

export const propertiesSchema = {
  title: z.string().optional().describe('Document title (properties).'),
  author: z.string().optional().describe('Document author; also who tracked changes and comments are by.'),
  subject: z.string().optional(),
  keywords: z.string().optional(),
};
type PropOpts = { [K in keyof typeof propertiesSchema]?: z.infer<(typeof propertiesSchema)[K]> };

/** Writes blocks at the caret. The caret starts on an empty paragraph (`fresh`). */
export class BlockWriter {
  private fresh = true;
  private inList = false;
  private aligned = false;
  private afterNote = false;
  /** End of the last cell of a table just written (a footnote right after the table goes there). */
  private lastCell?: Record<string, unknown>;
  readonly warnings: string[] = [];
  hasToc = false;

  constructor(private readonly s: WordCraftSession) {}

  /** The caret is in a non-empty paragraph of the body: continue on a new one. */
  continueAfterContent(): void {
    this.fresh = false;
  }

  private async newBlock(style = 'Normal'): Promise<void> {
    if (!this.fresh) await this.s.cmd('text.newParagraph');
    this.fresh = false;
    this.lastCell = undefined;
    if (this.aligned) {
      // a new paragraph keeps the previous one's direct alignment
      await this.s.cmd('para.reset');
      this.aligned = false;
    }
    await this.s.cmd('styles.apply', { style });
    if (this.afterNote) {
      // a paragraph started after a footnote mark would keep the mark's character style
      await this.s.cmd('format.resetChar');
      this.afterNote = false;
    }
    if (this.inList) {
      // a new paragraph after a list inherits its numbering
      await this.s.cmd('para.numbering', { off: true }).catch(() => undefined);
      await this.s.cmd('para.bullets', { off: true }).catch(() => undefined);
      this.inList = false;
    }
  }

  private async align(value?: string): Promise<void> {
    if (!value) return;
    await this.s.cmd('para.align', { value });
    this.aligned = true;
  }

  private async typeFormatted(text: string, f: { bold?: boolean; italic?: boolean; underline?: boolean; font?: string; size?: number; color?: string; highlight?: string }): Promise<void> {
    const on: [string, Record<string, unknown>, Record<string, unknown>][] = [];
    if (f.bold) on.push(['format.bold', { value: true }, { value: false }]);
    if (f.italic) on.push(['format.italic', { value: true }, { value: false }]);
    if (f.underline) on.push(['format.underline', { value: true }, { value: false }]);
    if (f.font) on.push(['format.font', { name: f.font }, {}]);
    if (f.size) on.push(['format.size', { size: f.size }, {}]);
    if (f.color) on.push(['format.color', { color: f.color.replace('#', '').toUpperCase() }, { color: 'auto' }]);
    if (f.highlight) on.push(['format.highlight', { color: f.highlight }, { color: 'none' }]);
    for (const [id, params] of on) await this.s.cmd(id, params);
    await this.s.json('type_text', { text, paragraphs: text.includes('\n') });
    // turn character formatting off again so the next block starts plain (font / size: the next style resets them)
    for (const [id, , off] of on) if (Object.keys(off).length) await this.s.cmd(id, off).catch(() => undefined);
  }

  async write(block: Block): Promise<void> {
    switch (block.type) {
      case 'heading':
        await this.newBlock(`Heading ${block.level}`);
        await this.align(block.align);
        await this.s.json('type_text', { text: block.text });
        break;
      case 'paragraph':
        await this.newBlock(block.style ?? 'Normal');
        await this.align(block.align);
        await this.typeFormatted(block.text, block);
        break;
      case 'bullets':
      case 'numbered':
        await this.newBlock('Normal');
        if (block.type === 'bullets') await this.s.cmd('para.bullets', {});
        else await this.s.cmd('para.numbering', block.kind ? { kind: block.kind } : {});
        await this.s.json('type_text', { text: block.items.join('\n'), paragraphs: true });
        this.inList = true;
        break;
      case 'table': {
        if (block.caption) {
          await this.newBlock('Normal');
          await this.s.cmd('references.caption', { label: 'Table', text: block.caption, position: 'above' }).catch((e) => this.warnings.push(String(e)));
          // an "above" caption goes before the (empty) current paragraph and leaves the caret in the caption:
          // step into that paragraph and put the table there, not in yet another one
          await this.s.cmd('caret.right');
          this.fresh = true;
        }
        await this.newBlock('Normal');
        const cols = Math.max(...block.rows.map((r) => r.length));
        await this.s.cmd('insert.table', { rows: block.rows.length, cols, style: block.style ?? 'Table Grid' });
        for (const [r, row] of block.rows.entries()) {
          for (let c = 0; c < cols; c++) {
            const text = row[c] ?? '';
            if (text) {
              if (r === 0 && block.header) await this.s.cmd('format.bold', { value: true });
              await this.s.json('type_text', { text });
              if (r === 0 && block.header) await this.s.cmd('format.bold', { value: false });
            }
            // Tab moves to the next cell; in the last cell it would add a row
            if (!(r === block.rows.length - 1 && c === cols - 1)) await this.s.cmd('text.tab');
          }
        }
        const cell = await this.s.cmd('document.selection').catch(() => undefined);
        // leave the table: the caret lands on the (empty) paragraph after it
        await this.s.cmd('caret.docEnd');
        this.fresh = true;
        this.lastCell = cell?.focus ?? cell?.anchor;
        break;
      }
      case 'image': {
        if (!path.isAbsolute(block.path) || !existsSync(block.path)) throw new Error(`Image not found (absolute path needed): ${block.path}`);
        await this.newBlock('Normal');
        await this.align(block.align ?? 'center');
        await this.s.cmd('insert.picture', { path: toEnginePath(block.path), ...(block.width ? { width: block.width } : {}), ...(block.alt ? { alt: block.alt } : {}) });
        if (block.caption) await this.s.cmd('references.caption', { label: 'Figure', text: block.caption, position: 'below' }).catch((e) => this.warnings.push(String(e)));
        break;
      }
      case 'page_break':
        if (this.fresh) await this.s.cmd('text.pageBreak');
        else {
          await this.s.cmd('text.newParagraph');
          await this.s.cmd('text.pageBreak');
        }
        this.fresh = true;
        break;
      case 'toc':
        await this.newBlock('Normal');
        await this.s.cmd('references.toc', { levels: block.levels, ...(block.title ? { title: block.title } : {}) });
        this.hasToc = true;
        await this.s.cmd('caret.docEnd');
        this.fresh = false;
        break;
      case 'footnote': {
        // after a table the caret is on the empty paragraph below it: put the mark at the end of the last cell
        if (this.fresh && this.lastCell && Array.isArray(this.lastCell.path)) {
          const below = await this.s.cmd('document.selection');
          await this.s.cmd('caret.set', { pos: this.lastCell });
          await this.s.cmd('references.footnote', { text: block.text });
          await this.s.cmd('caret.set', { pos: below?.focus ?? below?.anchor });
          break;
        }
        // inserting a footnote moves the caret into the footnote: come back to the body, right after the reference mark
        const sel = await this.s.cmd('document.selection').catch(() => undefined);
        const at = sel?.focus ?? sel?.anchor;
        await this.s.cmd('references.footnote', { text: block.text });
        if (at && Array.isArray(at.path)) {
          // the mark is the last thing in the paragraph: go back to it and to the paragraph's end
          await this.s.cmd('caret.set', { pos: at });
          await this.s.cmd('caret.end');
          this.afterNote = true;
          this.fresh = false;
        } else throw new Error('footnote: could not find the caret position to return to.');
        break;
      }
    }
  }

  /** Update fields that depend on the final layout (table of contents page numbers). */
  async finish(): Promise<void> {
    if (this.hasToc) await this.s.cmd('references.updateToc').catch((e) => this.warnings.push(String(e)));
  }
}

/** Page size, orientation, margins, then headers / footers (last: inserting them moves the caret into them). */
export async function applyPageSetup(s: WordCraftSession, o: PageOpts): Promise<void> {
  if (o.page_size) await s.cmd('layout.size', { name: o.page_size });
  if (o.orientation) await s.cmd('layout.orientation', { value: o.orientation });
  if (o.margins) await s.cmd('layout.margins', { preset: o.margins });
}

export async function applyHeadersFooters(s: WordCraftSession, o: PageOpts): Promise<void> {
  if (o.header) {
    await s.cmd('insert.header', { text: o.header });
    await s.cmd('insert.closeHeader');
  }
  if (o.page_numbers && o.page_numbers !== 'none') {
    if (o.page_numbers === 'bottom' && !o.footer) await s.cmd('insert.footer', { preset: 'pageNumber' });
    else await s.cmd('insert.pageNumber', { position: o.page_numbers, align: 'center' });
    await s.cmd('insert.closeHeader');
  }
  if (o.footer) {
    await s.cmd('insert.footer', { text: o.footer });
    await s.cmd('insert.closeHeader');
  }
}

export async function applyProperties(s: WordCraftSession, o: PropOpts): Promise<void> {
  const props = Object.fromEntries(Object.entries({ title: o.title, author: o.author, subject: o.subject, keywords: o.keywords }).filter(([, v]) => v));
  if (Object.keys(props).length) await s.cmd('file.properties', props);
}

function needDir(o: { output_dir?: string; output_path?: string }): string {
  const dir = o.output_path ? path.dirname(o.output_path) : o.output_dir;
  if (!dir || !path.isAbsolute(dir)) throw new Error('New documents need an absolute output_dir or output_path.');
  return dir;
}

const TEMPLATES = ['blank', 'letter', 'resume', 'report', 'sample'] as const;

// ---------------------------------------------------------------- tools

export function registerDocumentTools(server: McpServer): void {
  server.registerTool(
    'create_document',
    {
      title: 'Create a Word document',
      description:
        'Write a new document with WordCraft (a Word-class word processor): headings, paragraphs with styles and formatting, bullet / ' +
        'numbered lists, tables, images with captions, page breaks, a table of contents and footnotes, plus page size, margins, ' +
        'headers, footers and page numbers. Starts blank or from a built-in template (letter, resume, report). Saves docx, pdf, odt, ' +
        'rtf, html, md, tex, txt or png pages in one go, and returns a preview of page 1.',
      inputSchema: {
        name: z.string().default('document').describe('File name without extension.'),
        template: z.enum(TEMPLATES).default('blank').describe('blank, letter, resume, report or sample (blocks are added after the template text).'),
        blocks: z.array(blockSchema).max(2000).default([]).describe('Content in order.'),
        ...pageSchema,
        ...propertiesSchema,
        formats: formatsSchema.default(['docx']),
        ...outputSchema,
        ...exportOptionsSchema,
        preview: z.boolean().default(true).describe('Return an image of page 1.'),
      },
      annotations: WRITE,
    },
    async (args) => {
      try {
        const dir = needDir(args);
        return await withSession(
          async (s) => {
            await s.json('new_document', { template: args.template });
            await applyProperties(s, args);
            await applyPageSetup(s, args);
            const writer = new BlockWriter(s);
            if (args.template !== 'blank') {
              await s.cmd('caret.docEnd');
              writer.continueAfterContent();
            }
            for (const block of args.blocks) await writer.write(block);
            await writer.finish();
            await applyHeadersFooters(s, args);
            const outputs = await exportAll(s, { stemSource: path.join(dir, args.name), name: args.name, suffix: '', output_dir: dir, output_path: args.output_path, overwrite: args.overwrite }, args.formats as OutputFormat[], args);
            const info = await s.json('inspect_document', {});
            const img = args.preview ? await preview(s, 1, 1).catch(() => undefined) : undefined;
            return withPreview({ success: true, pages: info?.pages, blocks: args.blocks.length, outputs, ...(writer.warnings.length ? { warnings: writer.warnings } : {}) }, [img]);
          },
          undefined,
          args.author,
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'edit_document',
    {
      title: 'Edit a Word document',
      description:
        'Edit existing documents (docx, doc, odt, rtf, md, html, txt...) without touching the originals: find and replace (with match case / ' +
        'whole word / wildcards), comments on found text, tracked changes (so every edit is reviewable in Word), accept or reject existing ' +
        'revisions, append content blocks (same blocks as create_document), change properties, page setup and headers / footers, and remove ' +
        'personal information. Saves "<name>_edited.<ext>" (or the formats asked for) next to each input or in output_dir.',
      inputSchema: {
        input_path: z.string().optional(),
        input_paths: z.array(z.string()).max(200).optional(),
        input_dir: z.string().optional().describe('Every document directly in this folder.'),
        replace: z
          .array(
            z.object({
              find: z.string().min(1),
              with: z.string().describe('Replacement (^p paragraph mark, ^t tab; \\1 with wildcards).'),
              match_case: z.boolean().optional(),
              whole_word: z.boolean().optional(),
              wildcards: z.boolean().optional().describe('Word wildcards (e.g. "<[0-9]{4}>").'),
            }),
          )
          .max(200)
          .default([]),
        comments: z
          .array(z.object({ text: z.string().min(1).describe('Text to attach the comment to.'), comment: z.string().min(1), occurrence: z.number().int().min(1).default(1) }))
          .max(200)
          .default([]),
        track_changes: z.boolean().default(false).describe('Record the replacements and additions as tracked changes.'),
        revisions: z.enum(['keep', 'accept_all', 'reject_all']).default('keep').describe('What to do with revisions already in the document (done first).'),
        append: z.array(blockSchema).max(2000).default([]).describe('Blocks added at the end of the document.'),
        remove_personal_info: z.boolean().default(false).describe('Remove comments, revisions and document properties (Document Inspector).'),
        ...pageSchema,
        ...propertiesSchema,
        formats: formatsSchema.optional().describe('Default: the input format (docx for doc).'),
        suffix: z.string().default('_edited'),
        ...outputSchema,
        ...exportOptionsSchema,
        preview: z.boolean().default(false),
      },
      annotations: WRITE,
    },
    async (args) => {
      try {
        const files = collectInputs([...(args.input_path ? [args.input_path] : []), ...(args.input_paths ?? [])], args.input_dir);
        if (args.output_path && files.length > 1) throw new Error('output_path works with one input; use output_dir for several.');
        const results: unknown[] = [];
        const imgs: ({ data: string; mimeType: string } | undefined)[] = [];
        for (const file of files) {
          try {
            results.push(
              await withSession(
                async (s) => {
                  await s.json('open_document', { path: file });
                  if (args.revisions === 'accept_all') await s.cmd('review.acceptAll');
                  if (args.revisions === 'reject_all') await s.cmd('review.rejectAll');
                  if (args.track_changes) await s.cmd('review.trackChanges', { value: true });
                  const replaced: { find: string; count: number }[] = [];
                  for (const r of args.replace) {
                    const out = await s.cmd('edit.replaceAll', {
                      text: r.find,
                      with: r.with,
                      ...(r.match_case ? { matchCase: true } : {}),
                      ...(r.whole_word ? { wholeWord: true } : {}),
                      ...(r.wildcards ? { wildcards: true } : {}),
                    });
                    replaced.push({ find: r.find, count: Number(out?.replaced ?? 0) });
                  }
                  const commented: { text: string; ok: boolean; error?: string }[] = [];
                  for (const c of args.comments) {
                    try {
                      await s.json('select_text', { text: c.text, occurrence: c.occurrence });
                      await s.cmd('review.newComment', { text: c.comment });
                      commented.push({ text: c.text, ok: true });
                    } catch (e) {
                      commented.push({ text: c.text, ok: false, error: e instanceof Error ? e.message : String(e) });
                    }
                  }
                  await applyProperties(s, args);
                  await applyPageSetup(s, args);
                  const writer = new BlockWriter(s);
                  if (args.append.length) {
                    await s.cmd('caret.docEnd');
                    writer.continueAfterContent();
                    for (const block of args.append) await writer.write(block);
                    await writer.finish();
                  }
                  await applyHeadersFooters(s, args);
                  if (args.remove_personal_info) await s.cmd('file.inspect', { remove: ['comments', 'revisions', 'properties'] });
                  const ext = path.extname(file).slice(1).toLowerCase();
                  const formats = (args.formats ?? [ext in OUTPUTS ? ext : 'docx']) as OutputFormat[];
                  const outputs = await exportAll(s, { stemSource: file, suffix: args.suffix, output_dir: args.output_dir, output_path: args.output_path, overwrite: args.overwrite }, formats, args);
                  if (args.preview && imgs.length < 3) imgs.push(await preview(s, 1, 1).catch(() => undefined));
                  return {
                    input: file,
                    success: true,
                    replaced,
                    ...(commented.length ? { comments: commented } : {}),
                    ...(args.append.length ? { appended_blocks: args.append.length } : {}),
                    outputs,
                    ...(writer.warnings.length ? { warnings: writer.warnings } : {}),
                  };
                },
                undefined,
                args.author,
              ),
            );
          } catch (e) {
            results.push({ input: file, success: false, error: e instanceof Error ? e.message : String(e) });
          }
        }
        const failed = results.filter((r) => !(r as { success: boolean }).success).length;
        return withPreview({ success: failed === 0, processed: results.length - failed, failed, results }, imgs, failed === results.length);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'mail_merge',
    {
      title: 'Mail merge letters from a spreadsheet',
      description:
        'Personalized letters, certificates or notices from a data file (CSV, TSV, TXT, XLSX, ODS): either a template document that already ' +
        'has merge fields, or a body written here with {{Field}} placeholders (the column names). Writes one merged document with a section ' +
        'per record (docx, and pdf / other formats if asked).',
      inputSchema: {
        data_path: z.string().describe('Absolute path of the recipient list (first row = column names).'),
        template_path: z.string().optional().describe('Absolute .docx with merge fields (e.g. made in Word or by a previous run).'),
        body: z
          .array(z.string())
          .max(500)
          .optional()
          .describe('Paragraphs of the letter when there is no template, e.g. ["Dear {{Name}},", "Your order {{Order}} ships on {{Date}}."].'),
        heading: z.string().optional().describe('Optional heading above the body (may use {{Field}} too).'),
        from_record: z.number().int().min(1).optional(),
        to_record: z.number().int().min(1).optional(),
        name: z.string().default('merged'),
        formats: formatsSchema.default(['docx']),
        ...outputSchema,
        ...exportOptionsSchema,
      },
      annotations: WRITE,
    },
    async (args) => {
      try {
        const [data] = collectInputs([args.data_path], undefined, DATA);
        if (!args.template_path && !args.body?.length) throw new Error('Give template_path or body.');
        const dir = args.output_path ? path.dirname(args.output_path) : (args.output_dir ?? path.dirname(args.template_path ?? data));
        return await withSession(async (s) => {
          if (args.template_path) {
            const [tpl] = collectInputs([args.template_path]);
            await s.json('open_document', { path: tpl });
          } else await s.json('new_document', { template: 'blank' });
          await s.cmd('mailings.start', { kind: 'letters' });
          const recipients = await s.cmd('mailings.recipients', { path: toEnginePath(data) });
          const fields: string[] = recipients?.fields ?? [];
          if (!args.template_path) {
            const writeWithFields = async (text: string) => {
              for (const part of text.split(/(\{\{[^}]+\}\})/)) {
                const m = /^\{\{\s*([^}]+?)\s*\}\}$/.exec(part);
                if (m) {
                  if (!fields.includes(m[1])) throw new Error(`{{${m[1]}}} is not a column of ${path.basename(data)} (columns: ${fields.join(', ')}).`);
                  await s.cmd('mailings.insertField', { field: m[1] });
                } else if (part) await s.json('type_text', { text: part });
              }
            };
            let first = true;
            if (args.heading) {
              await s.cmd('styles.apply', { style: 'Heading 1' });
              await writeWithFields(args.heading);
              first = false;
            }
            for (const paragraph of args.body ?? []) {
              if (!first) await s.cmd('text.newParagraph');
              await s.cmd('styles.apply', { style: 'Normal' });
              await writeWithFields(paragraph);
              first = false;
            }
          }
          // merged result as docx first, then the other formats from the merged document
          const docx = outputFor(path.join(dir, args.name + '.__src'), 'docx', '', { output_dir: dir, output_path: args.output_path?.toLowerCase().endsWith('.docx') ? args.output_path : undefined, overwrite: args.overwrite });
          const finished = await s.cmd('mailings.finish', { path: toEnginePath(docx), ...(args.from_record ? { from: args.from_record } : {}), ...(args.to_record ? { to: args.to_record } : {}) });
          const outputs: unknown[] = [{ path: docx, format: 'docx' }];
          const others = (args.formats as OutputFormat[]).filter((f) => f !== 'docx');
          if (others.length) {
            await s.json('open_document', { path: docx });
            outputs.push(...(await exportAll(s, { stemSource: docx, suffix: '', output_dir: dir, overwrite: args.overwrite }, others, args)));
          }
          return json({ success: true, records: finished?.records, fields, outputs });
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'convert_document',
    {
      title: 'Convert documents',
      description:
        'Convert one or many documents between docx, doc (read), pdf, odt, rtf, html, md, tex, txt, json and png (first page) with WordCraft. ' +
        'markup=true prints comments and tracked changes (Print Markup). Outputs go next to each input or into output_dir; nothing is replaced ' +
        'unless overwrite is true.',
      inputSchema: {
        input_path: z.string().optional(),
        input_paths: z.array(z.string()).max(500).optional(),
        input_dir: z.string().optional(),
        formats: formatsSchema.default(['pdf']),
        markup: exportOptionsSchema.markup,
        ...outputSchema,
      },
      annotations: WRITE,
    },
    async (args) => {
      try {
        const files = collectInputs([...(args.input_path ? [args.input_path] : []), ...(args.input_paths ?? [])], args.input_dir);
        if (args.output_path && (files.length > 1 || args.formats.length > 1)) throw new Error('output_path works with one input and one format; use output_dir.');
        const results: unknown[] = [];
        for (const file of files) {
          const outputs: { format: string; path?: string; error?: string }[] = [];
          for (const f of args.formats as OutputFormat[]) {
            try {
              const out = outputFor(file, OUTPUTS[f], '', { output_dir: args.output_dir, output_path: args.output_path, overwrite: args.overwrite });
              await runCli(['convert', file, out, ...(args.markup ? ['--markup'] : [])], 600);
              outputs.push({ format: f, path: out });
            } catch (e) {
              outputs.push({ format: f, error: e instanceof Error ? e.message : String(e) });
            }
          }
          results.push({ input: file, outputs });
        }
        const errors = results.flatMap((r) => (r as { outputs: { error?: string }[] }).outputs).filter((o) => o.error).length;
        return json({ success: errors === 0, converted: files.length, errors, results }, errors > 0 && errors === results.length * args.formats.length);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'get_document_info',
    {
      title: 'Document info',
      description:
        'Pages, words, paragraphs, sections, comments, tracked changes and properties of documents; optionally the structure (headings, ' +
        'paragraph styles, lists, tables with cell texts) to understand a document before editing it.',
      inputSchema: {
        input_path: z.string().optional(),
        input_paths: z.array(z.string()).max(200).optional(),
        input_dir: z.string().optional(),
        include_structure: z.boolean().default(false).describe('Also return the blocks (style, text, tables).'),
      },
      annotations: READ,
    },
    async (args) => {
      try {
        const files = collectInputs([...(args.input_path ? [args.input_path] : []), ...(args.input_paths ?? [])], args.input_dir);
        const results: unknown[] = [];
        for (const file of files) {
          try {
            const info = JSON.parse(await runCli(['info', file]));
            delete info.layoutMs;
            delete info.dirty;
            info.path = file;
            if (args.include_structure) {
              const doc = JSON.parse(await runCli(['inspect', file]));
              info.blocks = (doc.blocks ?? []).map((b: Record<string, unknown>) =>
                b.type === 'table'
                  ? { type: 'table', rows: b.rows, cols: b.cols, style: b.style, cells: b.cells }
                  : {
                      type: b.type,
                      style: b.style,
                      text: String(b.text ?? '').slice(0, 2000),
                      // numbering num 0 means "no list" (a list switched off)
                      ...(Number((b.props as { numbering?: { num?: number } })?.numbering?.num ?? 0) > 0 ? { list: true } : {}),
                      ...((b.props as { align?: string })?.align ? { align: (b.props as { align: string }).align } : {}),
                      ...(() => {
                        const notes = ((b.objects as { type?: string }[] | undefined) ?? []).filter((o) => o.type === 'noteRef').length;
                        return notes ? { notes } : {};
                      })(),
                    },
              );
            }
            results.push(info);
          } catch (e) {
            results.push({ path: file, error: e instanceof Error ? e.message : String(e) });
          }
        }
        return json(files.length === 1 ? results[0] : { success: true, documents: results });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'extract_text',
    {
      title: 'Extract text',
      description:
        'Plain text of documents (docx, doc, odt, rtf, html, md, pdf made by WordCraft...). Returns the text (up to max_chars per document) ' +
        'and, with save_txt, also writes <name>.txt files.',
      inputSchema: {
        input_path: z.string().optional(),
        input_paths: z.array(z.string()).max(500).optional(),
        input_dir: z.string().optional(),
        max_chars: z.number().int().min(100).max(1_000_000).default(50_000),
        save_txt: z.boolean().default(false),
        ...outputSchema,
      },
      annotations: { ...READ, readOnlyHint: false },
    },
    async (args) => {
      try {
        const files = collectInputs([...(args.input_path ? [args.input_path] : []), ...(args.input_paths ?? [])], args.input_dir);
        const results: unknown[] = [];
        for (const file of files) {
          try {
            const text = await runCli(['text', file]);
            let saved: string | undefined;
            if (args.save_txt) {
              saved = outputFor(file, 'txt', '', { output_dir: args.output_dir, output_path: files.length === 1 ? args.output_path : undefined, overwrite: args.overwrite });
              writeFileSync(saved, text, 'utf-8');
            }
            results.push({ input: file, characters: text.length, text: text.slice(0, args.max_chars), truncated: text.length > args.max_chars, ...(saved ? { txt_path: saved } : {}) });
          } catch (e) {
            results.push({ input: file, error: e instanceof Error ? e.message : String(e) });
          }
        }
        return json(files.length === 1 ? results[0] : { success: true, documents: results });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'render_pages',
    {
      title: 'Render pages',
      description: 'Render document pages to PNG to look at them: returns up to 4 page images and, with save=true, writes <name>_p<N>.png files.',
      inputSchema: {
        input_path: z.string(),
        pages: z.string().optional().describe('1-based, e.g. "1-3,5" (default 1).'),
        scale: z.number().positive().max(4).default(1).describe('Pixels per point for the returned images (1 ≈ 72 dpi).'),
        markup: z.boolean().optional().describe('Show comments and tracked changes beside each page.'),
        save: z.boolean().default(false),
        save_scale: z.number().positive().max(6).default(2),
        ...outputSchema,
      },
      annotations: { ...READ, readOnlyHint: false },
    },
    async (args) => {
      try {
        const [file] = collectInputs([args.input_path]);
        return await withSession(async (s) => {
          await s.json('open_document', { path: file });
          const count = await pageCount(s);
          const pages = parsePages(args.pages ?? '1', count);
          const imgs: ({ data: string; mimeType: string } | undefined)[] = [];
          for (const pg of pages.slice(0, 4)) imgs.push(await preview(s, pg, args.scale));
          let files: string[] | undefined;
          if (args.save) {
            const dir = args.output_dir ?? path.dirname(file);
            mkdirSync(dir, { recursive: true });
            files = [];
            for (const pg of pages) {
              const out = outputFor(file, 'png', `_p${pg}`, { output_dir: dir, overwrite: args.overwrite });
              await s.cmd('file.exportPng', { path: toEnginePath(out), page: pg, scale: args.save_scale, ...(args.markup ? { markup: true } : {}) });
              files.push(out);
            }
          }
          return withPreview({ success: true, input: file, page_count: count, pages, ...(files ? { files } : {}) }, imgs);
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}

export { DOCUMENTS, IMAGES, stemOf };
