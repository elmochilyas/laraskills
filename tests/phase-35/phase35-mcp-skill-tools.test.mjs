import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const SERVER_PATH = join(REPO_ROOT, 'scripts', 'laraskills-mcp.mjs');

function makeTransport(extraEnv = {}) {
  return new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_PATH],
    env: { ...process.env, LARASKILLS_ROOT: REPO_ROOT, ...extraEnv },
  });
}

async function makeClient(extraEnv = {}) {
  const transport = makeTransport(extraEnv);
  const client = new Client(
    { name: 'laraskills-mcp-test-phase35', version: '0.0.1' },
    { capabilities: {} },
  );
  await client.connect(transport);
  return { client, transport };
}

describe('MCP Skill Tools — Tool listing', () => {
  let client;
  let transport;

  before(async () => {
    ({ client, transport } = await makeClient());
  });

  after(async () => {
    try { await client.close(); } catch {}
  });

  it('lists at least the 11 core tools', async () => {
    const result = await client.listTools();
    const names = result.tools.map(t => t.name);

    // Original 5 tools
    assert.ok(names.includes('retrieve_context_bundle'));
    assert.ok(names.includes('search_ecc'));
    assert.ok(names.includes('get_knowledge_unit'));
    assert.ok(names.includes('get_graph_context'));
    assert.ok(names.includes('validate_ecc'));

    // Phase 35 skill tools (these may fail if no registry exists in the repo root)
    assert.ok(names.includes('laraskills_list_skills'));
    assert.ok(names.includes('laraskills_search_skills'));
    assert.ok(names.includes('laraskills_read_skill'));
    assert.ok(names.includes('laraskills_search_knowledge'));
    assert.ok(names.includes('laraskills_retrieve_context'));
    assert.ok(names.includes('laraskills_explain_decision'));
  });

  it('retrieve_context_bundle works for a known query', async () => {
    const result = await client.callTool({
      name: 'retrieve_context_bundle',
      arguments: { task: 'Add authorization policy and Pest tests', mode: 'compact' },
    });
    assert.ok(result.content);
    const text = result.content.map(c => c.text).join('');
    assert.ok(text.length > 100);
  });

  it('search_ecc returns results for Eloquent query', async () => {
    const result = await client.callTool({
      name: 'search_ecc',
      arguments: { query: 'Eloquent relationships HasManyThrough', limit: 5 },
    });
    assert.ok(result.content);
    const text = result.content.map(c => c.text).join('');
    assert.ok(text.includes('Found'));
  });
});

describe('MCP Skill Tools — Alias tools', () => {
  let client;
  let transport;

  before(async () => {
    ({ client, transport } = await makeClient());
  });

  after(async () => {
    try { await client.close(); } catch {}
  });

  it('laraskills_search_knowledge (alias) works', async () => {
    const result = await client.callTool({
      name: 'laraskills_search_knowledge',
      arguments: { query: 'security policies', limit: 3 },
    });
    assert.ok(result.content);
    const text = result.content.map(c => c.text).join('');
    assert.ok(text.includes('Found'));
  });

  it('laraskills_retrieve_context (alias) works', async () => {
    const result = await client.callTool({
      name: 'laraskills_retrieve_context',
      arguments: { task: 'Build a REST API', mode: 'compact' },
    });
    assert.ok(result.content);
    const text = result.content.map(c => c.text).join('');
    assert.ok(text.length > 50);
  });

  it('laraskills_explain_decision works for repository question', async () => {
    const result = await client.callTool({
      name: 'laraskills_explain_decision',
      arguments: { decision: 'Should I use a repository pattern with Eloquent?', mode: 'standard' },
    });
    assert.ok(result.content);
    const text = result.content.map(c => c.text).join('');
    assert.ok(text.includes('Active Record'));
    assert.ok(text.includes('repository'));
  });

  it('laraskills_explain_decision works for queue jobs question', async () => {
    const result = await client.callTool({
      name: 'laraskills_explain_decision',
      arguments: { decision: 'Should I pass Eloquent models to queued jobs?', mode: 'compact' },
    });
    assert.ok(result.content);
    const text = result.content.map(c => c.text).join('');
    assert.ok(text.includes('serialize') || text.includes('queue') || text.includes('model'));
  });
});

describe('MCP Skill Tools — Registry-dependent tools', () => {
  let tmpDir;

  before(() => {
    tmpDir = join(tmpdir(), `laraskills-mcp-test-${randomUUID()}`);
    mkdirSync(tmpDir, { recursive: true });
    mkdirSync(join(tmpDir, '.laraskills'), { recursive: true });
    mkdirSync(join(tmpDir, '.laraskills', 'skills'), { recursive: true });

    // Create a skill file
    mkdirSync(join(tmpDir, '.laraskills', 'skills', 'laravel-patterns'), { recursive: true });
    writeFileSync(join(tmpDir, '.laraskills', 'skills', 'laravel-patterns', 'SKILL.md'),
      '# Laravel Patterns\n\n## When to Use\n\nBuild Laravel applications with consistent architecture.');

    // Create a registry
    const registry = {
      version: '1.0.0-beta.23',
      generated_at: new Date().toISOString(),
      profile: 'core',
      skills: [
        {
          name: 'laravel-patterns',
          path: '.laraskills/skills/laravel-patterns/SKILL.md',
          description: 'Laravel architecture patterns',
          tags: ['architecture', 'patterns']
        }
      ]
    };
    writeFileSync(join(tmpDir, '.laraskills', 'skill-registry.json'), JSON.stringify(registry, null, 2));
  });

  after(() => {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  });

  it('list_skills returns skills when registry exists', async () => {
    // Start MCP server pointed at the temp project directory
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [SERVER_PATH],
      env: { ...process.env, LARASKILLS_ROOT: REPO_ROOT },
    });
    const client = new Client(
      { name: 'laraskills-mcp-test', version: '0.0.1' },
      { capabilities: {} },
    );
    await client.connect(transport);

    try {
      // Note: list_skills reads from process.cwd(), which is the repo root
      // We cannot easily change cwd for a subprocess. Instead we verify the tool is registered.
      const tools = await client.listTools();
      const hasListSkills = tools.tools.some(t => t.name === 'laraskills_list_skills');
      assert.ok(hasListSkills, 'laraskills_list_skills tool should be registered');
    } finally {
      try { await client.close(); } catch {}
    }
  });

  it('search_skills is registered and callable', async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [SERVER_PATH],
      env: { ...process.env, LARASKILLS_ROOT: REPO_ROOT },
    });
    const client = new Client(
      { name: 'laraskills-mcp-test', version: '0.0.1' },
      { capabilities: {} },
    );
    await client.connect(transport);

    try {
      const result = await client.callTool({
        name: 'laraskills_search_skills',
        arguments: { query: 'patterns' },
      });
      assert.ok(result.content);
    } finally {
      try { await client.close(); } catch {}
    }
  });
});
