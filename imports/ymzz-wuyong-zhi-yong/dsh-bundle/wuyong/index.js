/**
 * 晏銘湛箴_無用之用 — DSH 插件入口
 *
 * 將 wuyong 的 CLI 能力註冊為 DSH 工具，讓主代理在對話中直接呼叫：
 *  - wuyong.doctor: 檢查環境與核心技能
 *  - wuyong.hint: 對單一事件輸出 Decision JSON
 *  - wuyong.pool.list / wuyong.pool.sync: 動態技能池
 *  - wuyong.local.list / wuyong.local.harvest: 本地技能索引
 */

import { execSync } from 'node:child_process';

export const inject = ['tools'];

export const Config = {
  type: 'object',
  properties: {
    mode: { type: 'string', enum: ['observe', 'advise', 'act'], default: 'advise' },
    dryRun: { type: 'boolean', default: true },
    python: { type: 'string', default: 'python' },
    projectRoot: { type: 'string' },
  },
  additionalProperties: false,
};

function runWuyong(args, opts = {}) {
  const python = opts.python || 'python';
  const cwd = opts.projectRoot || process.cwd();
  const cmd = [`"${python}"`, '-m', 'wuyong', ...args].join(' ');
  try {
    const out = execSync(cmd, { cwd, encoding: 'utf-8', maxBuffer: 2 * 1024 * 1024 });
    return { ok: true, stdout: out.trim() };
  } catch (err) {
    return {
      ok: false,
      stderr: err.stderr ? err.stderr.toString().trim() : String(err),
      exitCode: err.status,
    };
  }
}

export function apply(ctx, config) {
  const mode = config && config.mode ? config.mode : 'advise';
  const dryRun = config && config.dryRun !== undefined ? config.dryRun : true;
  const python = config && config.python ? config.python : 'python';
  const projectRoot = config && config.projectRoot ? config.projectRoot : process.cwd();

  const baseOpts = { python, projectRoot, mode, dryRun };

  ctx.effect({
    type: 'tool',
    name: 'wuyong.doctor',
    title: 'Wuyong Doctor',
    description: 'Check Python / Node / npx / network / directory permissions / core skill status.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    handler: async () => {
      const r = runWuyong(['doctor'], baseOpts);
      if (!r.ok) {
        return { error: r.stderr, exitCode: r.exitCode };
      }
      try {
        return { ok: true, report: JSON.parse(r.stdout) };
      } catch (_) {
        return { ok: true, raw: r.stdout };
      }
    },
  });

  ctx.effect({
    type: 'tool',
    name: 'wuyong.hint',
    title: 'Wuyong Hint',
    description: 'Decide a single user/thinking event and output a Decision JSON (local → pool → online → none).',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'User input text' },
        thinking: { type: 'string', description: 'Model reasoning trace (optional)' },
        conversationId: { type: 'string', default: 'dsh' },
        mode: { type: 'string', enum: ['observe', 'advise', 'act'] },
        dryRun: { type: 'boolean' },
      },
      required: ['text'],
      additionalProperties: false,
    },
    handler: async ({ text, thinking, conversationId = 'dsh', mode, dryRun }) => {
      const args = ['hint', '--text', text, '--conversation', conversationId];
      if (thinking) args.push('--thinking', thinking);
      if (mode) args.push('--mode', mode);
      if (dryRun !== undefined) {
        args.push(dryRun ? '--dry-run' : '--no-dry-run');
      } else if (baseOpts.dryRun) {
        args.push('--dry-run');
      }
      const r = runWuyong(args, baseOpts);
      if (!r.ok) {
        return { error: r.stderr, exitCode: r.exitCode };
      }
      try {
        return { ok: true, decision: JSON.parse(r.stdout) };
      } catch (_) {
        return { ok: true, raw: r.stdout };
      }
    },
  });

  ctx.effect({
    type: 'tool',
    name: 'wuyong.pool.list',
    title: 'Wuyong Pool List',
    description: 'List skills in the dynamic pool.',
    inputSchema: {
      type: 'object',
      properties: { includeBelow: { type: 'boolean', default: true } },
      additionalProperties: false,
    },
    handler: async ({ includeBelow = true }) => {
      const args = ['pool', 'list'];
      if (!includeBelow) args.push('--include-below', 'false');
      const r = runWuyong(args, baseOpts);
      if (!r.ok) return { error: r.stderr, exitCode: r.exitCode };
      try { return { ok: true, pool: JSON.parse(r.stdout) }; } catch (_) { return { ok: true, raw: r.stdout }; }
    },
  });

  ctx.effect({
    type: 'tool',
    name: 'wuyong.pool.sync',
    title: 'Wuyong Pool Sync',
    description: 'Sync the dynamic pool from skills.sh (API → HTML → snapshot).',
    inputSchema: {
      type: 'object',
      properties: { checkHash: { type: 'boolean', default: false } },
      additionalProperties: false,
    },
    handler: async ({ checkHash = false }) => {
      const args = ['pool', 'sync'];
      if (checkHash) args.push('--check-hash');
      const r = runWuyong(args, baseOpts);
      if (!r.ok) return { error: r.stderr, exitCode: r.exitCode };
      try { return { ok: true, summary: JSON.parse(r.stdout) }; } catch (_) { return { ok: true, raw: r.stdout }; }
    },
  });

  ctx.effect({
    type: 'tool',
    name: 'wuyong.local.list',
    title: 'Wuyong Local List',
    description: 'List locally registered skills (cross-conversation index).',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    handler: async () => {
      const r = runWuyong(['local', 'list'], baseOpts);
      if (!r.ok) return { error: r.stderr, exitCode: r.exitCode };
      try { return { ok: true, index: JSON.parse(r.stdout) }; } catch (_) { return { ok: true, raw: r.stdout }; }
    },
  });

  ctx.effect({
    type: 'tool',
    name: 'wuyong.local.harvest',
    title: 'Wuyong Local Harvest',
    description: 'Scan configured local skill roots and register discovered skills.',
    inputSchema: {
      type: 'object',
      properties: { conversationId: { type: 'string', default: 'dsh-harvest' } },
      additionalProperties: false,
    },
    handler: async ({ conversationId = 'dsh-harvest' }) => {
      const r = runWuyong(['local', 'harvest'], { ...baseOpts });
      if (!r.ok) return { error: r.stderr, exitCode: r.exitCode };
      try { return { ok: true, registered: JSON.parse(r.stdout) }; } catch (_) { return { ok: true, raw: r.stdout }; }
    },
  });

  return () => {
    // cleanup: nothing persistent to close
  };
}
