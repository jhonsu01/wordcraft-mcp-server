// End-to-end test over real MCP stdio against dist/bundle.cjs (what the .mcpb runs).
// Needs WordCraft installed. Usage: npm run build && npm run test:e2e
// E2E_BUNDLE=<path to bundle.cjs> tests another build (e.g. the contents of an unpacked .mcpb).
// E2E_LIVE=1 also opens the WordCraft app with its control channel and drives it (then leaves it open).
// Writes its own synthetic image and CSV into a temp folder whose name has spaces and accents (no personal files).
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { existsSync, mkdirSync, mkdtempSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const out = mkdtempSync(join(tmpdir(), 'wc-e2e-'));
const src = join(out, 'Documentos ñandú (prueba)');
mkdirSync(src, { recursive: true });

// --- tiny PNG writer (a coloured bar chart, so the picture is visibly real)
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(path, w, h, pixel) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, g, b] = pixel(x, y);
    const o = y * (w * 3 + 1) + 1 + x * 3;
    raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
const chart = join(src, 'gráfico.png');
png(chart, 400, 240, (x, y) => {
  const bar = Math.floor(x / 80), heights = [120, 180, 90, 210, 150];
  return 240 - y < heights[bar] && x % 80 > 10 ? [[43, 87, 154], [237, 125, 49], [112, 173, 71], [91, 155, 213], [255, 192, 0]][bar] : [255, 255, 255];
});
const csv = join(src, 'clientes.csv');
writeFileSync(csv, 'Nombre,Ciudad,Pedido\nAna Pérez,Bogotá,A-101\nLuis Gómez,Medellín,B-202\nMaría Ñúñez,Cali,C-303\n', 'utf-8');

const bundle = process.env.E2E_BUNDLE || fileURLToPath(new URL('../dist/bundle.cjs', import.meta.url));
const client = new Client({ name: 'wordcraft-e2e', version: '1.0.0' });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [bundle], stderr: 'inherit' }));

let failures = 0;
const check = (ok, label) => {
  console.log(`${ok ? '  OK ' : '  FAIL'} ${label}`);
  if (!ok) failures++;
};
async function call(name, args = {}) {
  const r = await client.callTool({ name, arguments: args }, undefined, { timeout: 600_000 });
  const text = r.content.find((c) => c.type === 'text')?.text ?? '{}';
  const images = r.content.filter((c) => c.type === 'image').length;
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text, error: text };
  }
  if (r.isError) console.log(`     ! ${name}: ${String(body.error ?? text).slice(0, 300)}`);
  return { body, images, isError: !!r.isError };
}
const exists = (p) => !!p && existsSync(p) && statSync(p).size > 0;

const listed = (await client.listTools()).tools;
const tools = listed.map((t) => t.name).sort();
console.log(`bundle: ${bundle}\nout: ${out}\ntools (${tools.length}): ${tools.join(', ')}`);
check(tools.length === 11, '11 tools');
check(!JSON.stringify(listed).includes('"items":['), 'no JSON Schema tuples (Z.ai/GLM error 1210)');

// status + catalog
const st = await call('get_wordcraft_status');
check(st.body.ready && /wordcraft-cli/.test(st.body.version ?? ''), `status: ${st.body.version} · ${st.body.commands} commands · ${st.body.word_parity ?? ''}`);
const cat = await call('list_wordcraft_catalog', { kind: 'commands', filter: 'table' });
check(cat.body.count > 10, `catalog commands "table": ${cat.body.count}`);
const sty = await call('list_wordcraft_catalog', { kind: 'styles', filter: 'heading' });
check(sty.body.count >= 2, `catalog styles "heading": ${sty.body.count}`);

// create_document with every block type
const created = await call('create_document', {
  name: 'Informe trimestral',
  title: 'Informe trimestral',
  author: 'Prueba E2E',
  page_size: 'A4',
  margins: 'moderate',
  header: 'Empresa Ñandú S.A.',
  page_numbers: 'bottom',
  blocks: [
    { type: 'paragraph', text: 'Informe trimestral 2026', style: 'Title' },
    { type: 'toc', levels: 2, title: 'Contenido' },
    { type: 'heading', text: 'Resumen', level: 1 },
    { type: 'paragraph', text: 'Las ventas crecieron un 12 %. Este párrafo tiene acentos: ñ, á, ü.\nSegundo párrafo del resumen.' },
    { type: 'paragraph', text: 'Dato destacado en negrita roja.', bold: true, color: '#C00000', align: 'center' },
    { type: 'heading', text: 'Objetivos', level: 2 },
    { type: 'bullets', items: ['Crecer en Colombia', 'Abrir Perú', 'Reducir costos'] },
    { type: 'numbered', items: ['Planificar', 'Ejecutar', 'Medir'] },
    { type: 'paragraph', text: 'Después de las listas, texto normal.' },
    { type: 'footnote', text: 'Fuente: datos internos.' },
    { type: 'heading', text: 'Resultados', level: 1 },
    { type: 'table', rows: [['Región', 'Ventas', 'Cambio'], ['Norte', '1.200', '+8 %'], ['Sur', '950', '+15 %']], caption: 'Ventas por región' },
    { type: 'footnote', text: 'Cifras sin auditar.' },
    { type: 'image', path: chart, width: 300, alt: 'Gráfico de barras', caption: 'Ventas por mes' },
    { type: 'page_break' },
    { type: 'heading', text: 'Anexo', level: 1 },
    { type: 'paragraph', text: 'Texto del anexo.' },
  ],
  formats: ['docx', 'pdf', 'md', 'png'],
  output_dir: src,
});
const outs = Object.fromEntries((created.body.outputs ?? []).map((o) => [o.format, o]));
check(!created.isError && exists(outs.docx?.path) && exists(outs.pdf?.path) && exists(outs.md?.path), `create_document: docx+pdf+md, ${created.body.pages} pages`);
check(outs.png?.files?.length === created.body.pages && created.images === 1, `png pages (${outs.png?.files?.length}) and a preview image`);
check(typeof created.body.files_markdown === 'string' && created.body.files_markdown.includes('file:///'), 'files_markdown links');
if (created.body.warnings) console.log('     warnings:', created.body.warnings);
const docx = outs.docx?.path;

// info + structure: headings, list, table really written where expected
const info = await call('get_document_info', { input_path: docx, include_structure: true });
const blocks = info.body.blocks ?? [];
const styles = blocks.map((b) => b.style);
check(info.body.pages >= 2 && info.body.words > 40, `info: ${info.body.pages} pages, ${info.body.words} words, title "${info.body.properties?.title}"`);
check(styles.filter((s) => s === 'Heading1').length === 3 && styles.includes('Heading2') && styles.includes('Title'), `headings and title styles (${[...new Set(styles)].join(',')})`);
const table = blocks.find((b) => b.type === 'table');
check(table?.rows === 3 && table?.cols === 3 && table.cells?.[2]?.[2] === '+15 %', 'table 3x3 with its cells (no extra row)');
const ti = blocks.indexOf(table);
check(blocks[ti - 1]?.style === 'Caption' && !(blocks[ti + 1]?.type === 'paragraph' && blocks[ti + 1]?.style === 'Normal' && !blocks[ti + 1]?.text && !blocks[ti + 2]?.style?.startsWith('Caption')), `caption right above the table, no empty paragraph below (${blocks[ti + 1]?.style} "${blocks[ti + 1]?.text ?? ''}")`);
const listedItems = blocks.filter((b) => b.list).map((b) => b.text);
check(['Crecer en Colombia', 'Abrir Perú', 'Reducir costos', 'Planificar', 'Ejecutar', 'Medir'].every((t) => listedItems.includes(t)), 'bullet and numbered items');
check(!blocks.find((b) => b.text === 'Después de las listas, texto normal.')?.list, 'paragraph after a list is not a list item');
const noteHolders = blocks.filter((b) => b.notes).map((b) => b.text);
check(noteHolders.length === 1 && noteHolders[0] === 'Después de las listas, texto normal.', `footnote mark stays on its paragraph; the one after a table goes in the table (${JSON.stringify(noteHolders)})`);
const centered = blocks.find((b) => b.text === 'Dato destacado en negrita roja.');
const afterCentered = blocks.find((b) => b.text === 'Objetivos');
check(centered?.align === 'center' && !afterCentered?.align, `alignment stays on its own block (${centered?.align} → ${afterCentered?.align ?? 'style default'})`);

// text
const text = await call('extract_text', { input_path: docx, save_txt: true, output_dir: join(src, 'txt') });
check(/Resumen/.test(text.body.text) && /Región/.test(text.body.text) && exists(text.body.txt_path), `extract_text: ${text.body.characters} chars + .txt`);

// edit: replace, comment, tracked changes, append
const edited = await call('edit_document', {
  input_path: docx,
  replace: [{ find: 'Perú', with: 'Ecuador' }, { find: 'no existe', with: 'x' }],
  comments: [{ text: 'Reducir costos', comment: 'Confirmar meta con finanzas' }],
  track_changes: true,
  author: 'Revisor E2E',
  append: [{ type: 'heading', text: 'Conclusión', level: 1 }, { type: 'paragraph', text: 'Fin del informe.' }],
  formats: ['docx', 'pdf'],
  markup: true,
});
const er = edited.body.results?.[0] ?? {};
const eout = Object.fromEntries((er.outputs ?? []).map((o) => [o.format, o.path]));
check(er.success && er.replaced?.[0]?.count === 1 && er.replaced?.[1]?.count === 0 && er.comments?.[0]?.ok, 'edit_document: replace counts and comment');
const einfo = await call('get_document_info', { input_path: eout.docx });
check(einfo.body.comments === 1 && einfo.body.trackChanges === true && exists(eout.pdf), `edited: ${einfo.body.comments} comment, tracked changes ${einfo.body.trackChanges}, markup PDF`);
const etext = await call('extract_text', { input_path: eout.docx });
check(/Conclusión/.test(etext.body.text) && /Fin del informe/.test(etext.body.text), 'appended blocks present');
check(exists(docx) && /Perú/.test((await call('extract_text', { input_path: docx })).body.text), 'original left untouched');

// convert
const conv = await call('convert_document', { input_path: docx, formats: ['odt', 'rtf', 'html', 'txt'], output_dir: join(src, 'convertidos') });
const cps = (conv.body.results?.[0]?.outputs ?? []).filter((o) => exists(o.path)).length;
check(conv.body.success && cps === 4, `convert_document: ${cps}/4 formats`);

// mail merge with {{Field}} body, plus a PDF
const merged = await call('mail_merge', {
  data_path: csv,
  heading: 'Pedido {{Pedido}}',
  body: ['Hola {{Nombre}},', 'Tu pedido sale hoy hacia {{Ciudad}}.'],
  name: 'cartas',
  formats: ['docx', 'pdf'],
  output_dir: join(src, 'combinacion'),
});
const mtext = merged.body.outputs?.[0]?.path ? (await call('extract_text', { input_path: merged.body.outputs[0].path })).body.text : '';
check(merged.body.records === 3 && /Hola Ana Pérez/.test(mtext) && /María Ñúñez/.test(mtext) && /Cali/.test(mtext), `mail_merge: ${merged.body.records} letters with fields filled`);
check(merged.body.outputs?.some((o) => o.format === 'pdf' && exists(o.path)), 'merged PDF');
const badField = await call('mail_merge', { data_path: csv, body: ['Hola {{Apellido}}'], output_dir: join(src, 'combinacion') });
check(badField.isError && /Apellido/.test(badField.body.error), 'unknown {{Field}} is reported');

// render
const rend = await call('render_pages', { input_path: docx, pages: '1-2', save: true, output_dir: join(src, 'paginas') });
check(rend.images === 2 && rend.body.files?.length === 2 && rend.body.files.every(exists), 'render_pages: 2 images + 2 PNG files');

// run commands headless
const run = await call('run_wordcraft_commands', {
  steps: [
    { id: 'type_text', params: { text: 'Hola desde comandos' } },
    { id: 'select_text', params: { text: 'comandos' } },
    { id: 'format.bold', params: { value: true } },
    { id: 'insert.table', params: { rows: 2, cols: 2 } },
  ],
  formats: ['docx'],
  name: 'comandos',
  output_dir: src,
});
check(run.body.success && run.body.completed === 4 && exists(run.body.outputs?.[0]?.path), 'run_wordcraft_commands: 4 steps + docx');

// safety: no overwrite, absolute paths only
const again = await call('create_document', { name: 'Informe trimestral', blocks: [{ type: 'paragraph', text: 'x' }], output_dir: src });
check(again.body.outputs?.[0]?.path?.endsWith('Informe trimestral_2.docx'), 'existing output kept (writes _2)');
const rel = await call('edit_document', { input_path: 'relativo.docx' });
check(rel.isError, 'relative paths rejected');

if (process.env.E2E_LIVE) {
  const opened = await call('open_in_wordcraft', { paths: [docx], control: true });
  check(opened.body.success && opened.body.listening, `open_in_wordcraft with control on port ${opened.body.control_port}`);
  const live = await call('run_wordcraft_commands', { live: true, steps: [{ id: 'get_text' }] });
  check(live.body.success && /Resumen/.test(JSON.stringify(live.body.results)), 'live: read the document open in the app');
}

await client.close();
console.log(failures === 0 ? `\nALL OK (${out})` : `\n${failures} FAILED (${out})`);
process.exit(failures === 0 ? 0 : 1);
