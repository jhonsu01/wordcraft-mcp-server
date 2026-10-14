import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { cleanEnv, connectorDir, resolveInstall, resolveInt } from '../../src/config.js';
import { resolveOutputPath, sameFile } from '../../src/paths.js';
import { substitute } from '../../src/tools/advanced.js';
import { OUTPUTS, collectInputs, nameStem, parsePages } from '../../src/tools/common.js';
import { blockSchema } from '../../src/tools/documents.js';

describe('config', () => {
  it('treats unfilled MCPB placeholders as unset', () => {
    expect(cleanEnv('${user_config.wordcraft_dir}')).toBeUndefined();
    expect(resolveInt('${user_config.control_port}', 7985, 65535)).toBe(7985);
  });
  it('Windows: install folder, an .exe inside it, or nothing', () => {
    const exists = (p: string) => /^D:\\DC\\wordcraft(-cli)?\.exe$/i.test(p);
    const r = resolveInstall({ WORDCRAFT_DIR: 'D:\\DC' }, exists, 'win32', 'C:\\Users\\u');
    expect([r.cli, r.app]).toEqual(['D:\\DC\\wordcraft-cli.exe', 'D:\\DC\\wordcraft.exe']);
    const pf = (p: string) => p === 'C:\\Program Files\\WordCraft\\wordcraft-cli.exe';
    expect(resolveInstall({ ProgramFiles: 'C:\\Program Files' }, pf, 'win32').cli).toBe('C:\\Program Files\\WordCraft\\wordcraft-cli.exe');
  });
  it('Linux: deb/rpm, tar.gz root, AppImage app', () => {
    const deb = new Set(['/usr/bin/wordcraft-cli', '/usr/bin/wordcraft']);
    const r = resolveInstall({}, (p) => deb.has(p), 'linux', '/home/u');
    expect([r.cli, r.app]).toEqual(['/usr/bin/wordcraft-cli', '/usr/bin/wordcraft']);
    const tar = new Set(['/opt/x/wordcraft-0.5.0-linux-x86_64/bin/wordcraft-cli']);
    expect(resolveInstall({ WORDCRAFT_DIR: '/opt/x/wordcraft-0.5.0-linux-x86_64' }, (p) => tar.has(p), 'linux', '/home/u').cli).toBe('/opt/x/wordcraft-0.5.0-linux-x86_64/bin/wordcraft-cli');
    const img = '/home/u/wordcraft-0.5.0-linux-x86_64.AppImage';
    expect(resolveInstall({ WORDCRAFT_APP: img }, (p) => p === img, 'linux', '/home/u').app).toBe(img);
  });
  it('macOS: WordCraft.app plus the separate CLI zip', () => {
    const files = new Set(['/Applications/WordCraft.app/Contents/MacOS/WordCraft', '/usr/local/bin/wordcraft-cli']);
    const r = resolveInstall({}, (p) => files.has(p), 'darwin', '/Users/u');
    expect([r.cli, r.app]).toEqual(['/usr/local/bin/wordcraft-cli', '/Applications/WordCraft.app/Contents/MacOS/WordCraft']);
    expect(connectorDir({}, 'darwin', '/Users/u')).toBe('/Users/u/Library/Application Support/wordcraft-mcp-server');
  });
});

describe('paths and formats', () => {
  it('never overwrites, POSIX case-sensitive', () => {
    const exists = (p: string) => p === 'D:\\d\\informe.pdf';
    expect(resolveOutputPath({ inputPath: 'D:\\d\\informe.docx', ext: 'pdf', exists, platform: 'win32' })).toEqual({ path: 'D:\\d\\informe_2.pdf' });
    expect(resolveOutputPath({ inputPath: '/d/a.docx', ext: 'pdf', outputPath: '/d/out.png', platform: 'linux' })).toHaveProperty('error');
    expect(sameFile('/a/A.docx', '/a/a.docx', 'linux')).toBe(false);
  });
  it('keeps dots in output names, dropping only a real extension', () => {
    expect(nameStem('acta-1.0.1')).toBe('acta-1.0.1');
    expect(nameStem('informe.2026')).toBe('informe.2026');
    expect(nameStem('carta.docx')).toBe('carta');
    expect(nameStem('Contrato v2.PDF')).toBe('Contrato v2');
  });
  it('parses page ranges within the document', () => {
    expect(parsePages('1-3, 5, 9', 6)).toEqual([1, 2, 3, 5]);
    expect(parsePages(undefined, 3)).toEqual([1, 2, 3]);
    expect(() => parsePages('x', 3)).toThrow(/page range/);
  });
  it('knows every save format', () => {
    expect(Object.keys(OUTPUTS)).toEqual(['docx', 'pdf', 'odt', 'rtf', 'html', 'md', 'tex', 'txt', 'json', 'png']);
  });
  it('collects documents from a folder, skipping Word lock files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wc-unit-'));
    for (const f of ['b.ODT', 'a.docx', '~$a.docx', 'c.png', 'd.md']) writeFileSync(join(dir, f), 'x');
    expect(collectInputs([], dir).map((p) => p.slice(dir.length + 1))).toEqual(['a.docx', 'b.ODT', 'd.md']);
    expect(() => collectInputs(['rel.docx'])).toThrow(/absolute/);
  });
});

describe('content blocks', () => {
  it('schemas have no JSON Schema tuples (Z.ai / GLM rejects them with error 1210)', () => {
    const schema = JSON.stringify(z.toJSONSchema(z.array(blockSchema)));
    expect(schema).not.toContain('prefixItems');
    expect(schema).not.toMatch(/"items":\[/);
  });
  it('defaults heading level and table header', () => {
    expect(blockSchema.parse({ type: 'heading', text: 'Intro' })).toMatchObject({ level: 1 });
    expect(blockSchema.parse({ type: 'table', rows: [['A', 'B']] })).toMatchObject({ header: true });
    expect(() => blockSchema.parse({ type: 'paragraph', text: 'x', color: 'red' })).toThrow();
  });
});

describe('run_wordcraft_commands references', () => {
  it('replaces $steps values', () => {
    expect(substitute({ story: '$steps[0].story', ids: ['$steps[1].ids[0]'], x: '$x' }, [{ story: 4 }, { ids: [7] }])).toEqual({ story: 4, ids: [7], x: '$x' });
    expect(() => substitute('$steps[3].id', [])).toThrow();
  });
});
