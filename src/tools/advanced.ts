import { execFile, spawn } from 'child_process';
import { mkdirSync } from 'fs';
import * as net from 'net';
import * as path from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { COMMAND_TIMEOUT_SEC, CONTROL_PORT, connectorDir, resolveInstall } from '../config.js';
import { WordCraftSession, runCli, withSession } from '../engine.js';
import {
  DATA, DOCUMENTS, IMAGES, OUTPUTS, OutputFormat, READ, collectInputs, errorResult, exportAll, exportOptionsSchema, formatsSchema, json, preview,
  withPreview,
} from './common.js';

interface CommandDef {
  id: string;
  label: string;
  location?: string;
  params?: string | null;
  shortcut?: string;
}

let commandCache: CommandDef[] | undefined;
/** Every engine command (`wordcraft-cli commands --json`). */
async function engineCommands(): Promise<CommandDef[]> {
  if (!commandCache) commandCache = JSON.parse(await runCli(['commands', '--json'])) as CommandDef[];
  return commandCache;
}

export function controlPortOpen(port = CONTROL_PORT, timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.connect({ host: '127.0.0.1', port });
    const done = (ok: boolean) => {
      sock.destroy();
      resolve(ok);
    };
    sock.setTimeout(timeoutMs, () => done(false));
    sock.once('connect', () => done(true));
    sock.once('error', () => done(false));
  });
}

function appRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      execFile('tasklist', ['/FI', 'IMAGENAME eq wordcraft.exe', '/NH'], { windowsHide: true }, (err, out) => resolve(!err && /wordcraft\.exe/i.test(out)));
    } else {
      // exact process name: never matches our own wordcraft-cli engines
      execFile('pgrep', ['-xi', 'wordcraft'], (err, out) => resolve(!err && out.trim().length > 0));
    }
  });
}

/** Replace "$steps[N].path.to[0]" with a value returned by step N (0-based), e.g. "$steps[0].table[0]". */
export function substitute(value: unknown, steps: unknown[] = []): unknown {
  if (typeof value === 'string') {
    const st = /^\$steps\[(\d+)\]((?:\.[A-Za-z_]\w*|\[\d+\])*)$/.exec(value);
    if (st) {
      let cur: unknown = steps[Number(st[1])];
      for (const part of st[2].match(/\.[A-Za-z_]\w*|\[\d+\]/g) ?? []) {
        const key = part.startsWith('.') ? part.slice(1) : Number(part.slice(1, -1));
        cur = cur && typeof cur === 'object' ? (cur as Record<string | number, unknown>)[key] : undefined;
      }
      if (cur === undefined) throw new Error(`${value} is not available (step results so far: ${steps.length}).`);
      return cur;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => substitute(v, steps));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, substitute(v, steps)]));
  return value;
}

/** Engine tools a step can call by name (anything else is a command id run with `execute`). */
const ENGINE_TOOLS = new Set(['new_document', 'open_document', 'save_document', 'type_text', 'select_text', 'get_text', 'inspect_document', 'render_page']);

const connectAddress = () => `127.0.0.1:${CONTROL_PORT}`;

export function registerAdvancedTools(server: McpServer): void {
  server.registerTool(
    'list_wordcraft_catalog',
    {
      title: 'List commands, styles, templates, formats',
      description:
        'What WordCraft can do: commands (615 engine commands with parameters and ribbon location, for run_wordcraft_commands), styles ' +
        '(paragraph, character and table styles of a new document or of input_path), templates (new document templates), formats (open ' +
        'and save).',
      inputSchema: {
        kind: z.enum(['commands', 'styles', 'templates', 'formats']),
        filter: z.string().optional().describe('Case-insensitive text to match (id, label or ribbon location).'),
        input_path: z.string().optional().describe('kind=styles: list the styles of this document.'),
      },
      annotations: READ,
    },
    async (args) => {
      try {
        const f = (args.filter ?? '').toLowerCase();
        const match = (...parts: unknown[]) => !f || parts.some((p) => String(p ?? '').toLowerCase().includes(f));
        if (args.kind === 'formats') return json({ success: true, open: DOCUMENTS, pictures: IMAGES, mail_merge_data: DATA, save: Object.keys(OUTPUTS) });
        if (args.kind === 'templates') return json({ success: true, templates: ['blank', 'letter', 'resume', 'report', 'sample'] });
        if (args.kind === 'commands') {
          const l = (await engineCommands()).filter((c) => match(c.id, c.label, c.location));
          return json({ success: true, count: l.length, commands: l.slice(0, 300).map((c) => ({ id: c.id, label: c.label, location: c.location, params: c.params || null })), truncated: l.length > 300 });
        }
        return json(
          await withSession(async (s) => {
            if (args.input_path) {
              const [file] = collectInputs([args.input_path]);
              await s.json('open_document', { path: file });
            } else await s.json('new_document', { template: 'blank' });
            const styles = ((await s.cmd('styles.manage', {})) ?? []) as { name: string; type: string; builtIn?: boolean; inGallery?: boolean }[];
            const list = styles.filter((st) => match(st.name, st.type));
            return { success: true, count: list.length, styles: list.map((st) => ({ name: st.name, type: st.type, builtIn: st.builtIn, gallery: st.inGallery })) };
          }),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'run_wordcraft_commands',
    {
      title: 'Run WordCraft engine commands',
      description:
        'Advanced: run any of WordCraft\'s 615 engine commands in order (text.*, format.*, para.*, styles.*, table.*, insert.*, layout.*, ' +
        'references.*, review.*, mailings.*, design.*, equation.*, chart.*, smartArt.*, fields.*...) plus the engine tools new_document / ' +
        'open_document / type_text / select_text / get_text / inspect_document / render_page / save_document (step id = the tool name), ' +
        'on a new document, a template or an opened file, then save. Parameters can use "$steps[N].field" for a value returned by step N ' +
        '(0-based). With live=true the steps drive the open WordCraft app instead.',
      inputSchema: {
        steps: z.array(z.object({ id: z.string(), params: z.record(z.string(), z.any()).optional() })).max(2000).default([]),
        stop_on_error: z.boolean().default(true),
        open_path: z.string().optional().describe('Absolute document to open first (never saved over; save a copy with formats).'),
        template: z.enum(['blank', 'letter', 'resume', 'report', 'sample']).default('blank').describe('New document template when there is no open_path.'),
        author: z.string().optional().describe('Who tracked changes and comments are by (headless only).'),
        formats: formatsSchema.optional().describe('Save the result (needs output_dir or output_path).'),
        name: z.string().default('wordcraft'),
        output_dir: z.string().optional(),
        output_path: z.string().optional(),
        overwrite: z.boolean().default(false),
        ...exportOptionsSchema,
        preview_page: z.number().int().min(1).optional().describe('Return an image of this page.'),
        live: z.boolean().default(false).describe(`Drive the open WordCraft app (control port ${CONTROL_PORT}) instead of a headless engine.`),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async (args) => {
      try {
        if (args.live && !(await controlPortOpen())) throw new Error(`WordCraft is not listening on port ${CONTROL_PORT}: call open_in_wordcraft with control=true first.`);
        const dir = args.output_path ? path.dirname(args.output_path) : args.output_dir;
        if (args.formats?.length && (!dir || !path.isAbsolute(dir))) throw new Error('Saving needs an absolute output_dir or output_path.');
        return await withSession(
          async (s: WordCraftSession) => {
            if (args.open_path) {
              const [file] = collectInputs([args.open_path]);
              await s.json('open_document', { path: file });
            } else if (!args.live) await s.json('new_document', { template: args.template });
            const values: unknown[] = [];
            const results: Record<string, unknown>[] = [];
            let failed = 0;
            for (const step of args.steps) {
              try {
                const params = substitute(step.params ?? {}, values) as Record<string, unknown>;
                const out = ENGINE_TOOLS.has(step.id) ? await s.json(step.id, params) : await s.cmd(step.id, params);
                values.push(out);
                results.push({ id: step.id, ok: true, result: out });
              } catch (e) {
                failed++;
                values.push(undefined);
                results.push({ id: step.id, ok: false, error: e instanceof Error ? e.message : String(e) });
                if (args.stop_on_error) break;
              }
            }
            let outputs: unknown[] | undefined;
            if (args.formats?.length && !failed) {
              outputs = await exportAll(
                s,
                { stemSource: path.join(dir!, args.name), name: args.name, suffix: '', output_dir: dir, output_path: args.output_path, overwrite: args.overwrite },
                args.formats as OutputFormat[],
                args,
              );
            }
            const img = args.preview_page ? await preview(s, args.preview_page, 1).catch(() => undefined) : undefined;
            return withPreview({ success: !failed, completed: results.length - failed, failed_steps: failed, results, ...(outputs ? { outputs } : {}) }, [img], !!failed);
          },
          args.live ? connectAddress() : undefined,
          args.live ? undefined : args.author,
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'open_in_wordcraft',
    {
      title: 'Open in WordCraft',
      description:
        'Open documents in the WordCraft desktop app for manual editing. With control=true the app also starts its loopback-only control ' +
        'channel (protected by a key in WordCraft\'s settings folder) so run_wordcraft_commands live=true can drive it.',
      inputSchema: {
        paths: z.array(z.string()).max(50).default([]).describe('Absolute documents to open.'),
        control: z.boolean().default(false),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (args) => {
      try {
        const files = args.paths.length ? collectInputs(args.paths) : [];
        const install = resolveInstall();
        if (!install.app) throw new Error('WordCraft desktop app not found. Set WORDCRAFT_DIR (or WORDCRAFT_APP).');
        const extra = args.control && !(await controlPortOpen()) ? ['--control', String(CONTROL_PORT)] : [];
        // run it from this connector's folder: GPU drivers drop log folders into the working directory
        const cwd = connectorDir();
        mkdirSync(cwd, { recursive: true });
        const child = spawn(install.app, [...extra, ...files], { cwd, detached: true, stdio: 'ignore', windowsHide: false });
        child.on('error', () => undefined);
        child.unref();
        let listening: boolean | undefined;
        if (extra.length) {
          const deadline = Date.now() + 20_000;
          while (!(listening = await controlPortOpen()) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 500));
          if (!listening) throw new Error(`WordCraft started but is not listening on port ${CONTROL_PORT} after 20 s (it may have closed). Start it by hand with: wordcraft --control ${CONTROL_PORT}`);
        }
        return json({ success: true, app: install.app, opened: files, ...(extra.length || args.control ? { control_port: CONTROL_PORT, listening: listening ?? true } : {}) });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'get_wordcraft_status',
    {
      title: 'WordCraft status',
      description: 'Check the WordCraft installation: platform, executables, version, engine commands, Word feature coverage, save formats, whether the app is running / listening for control.',
      inputSchema: {},
      annotations: READ,
    },
    async () => {
      const install = resolveInstall();
      const status: Record<string, unknown> = { ready: !!install.cli, platform: `${install.platform} ${process.arch}`, install_dir: install.dir, cli: install.cli ?? null, app: install.app ?? null };
      try {
        if (!install.cli) throw new Error(`wordcraft-cli not found (searched ${install.searched.length} folders). Install WordCraft or set WORDCRAFT_DIR / WORDCRAFT_CLI.`);
        status['version'] = (await runCli(['--version'])).split('\n')[0].trim();
        status['commands'] = (await engineCommands()).length;
        try {
          const parity = (await runCli(['parity'])).split('\n').find((l) => /\d+\s*%|\d+\s*\/\s*\d+/.test(l));
          if (parity) status['word_parity'] = parity.trim();
        } catch {
          // older engines without `parity`
        }
        status['app_running'] = await appRunning();
        status['control_port'] = CONTROL_PORT;
        status['control_listening'] = await controlPortOpen();
        status['save_formats'] = Object.keys(OUTPUTS);
        status['timeout_sec'] = COMMAND_TIMEOUT_SEC;
        return json(status);
      } catch (e) {
        return json({ ...status, ready: false, error: e instanceof Error ? e.message : String(e) }, true);
      }
    },
  );
}
