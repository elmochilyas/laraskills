import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const SERVER_PATH = join(REPO_ROOT, 'scripts', 'laravel-ecc-mcp.mjs');

function makeTransport(extraEnv = {}) {
  return new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_PATH],
    env: { ...process.env, ECC_ROOT: REPO_ROOT, ...extraEnv },
  });
}

async function makeClient(extraEnv = {}) {
  const transport = makeTransport(extraEnv);
  const client = new Client(
    { name: 'laravel-ecc-mcp-test', version: '0.0.1' },
    { capabilities: {} },
  );
  await client.connect(transport);
  return { client, transport };
}

describe('MCP Server — Startup', () => {
  let client;
  let transport;

  before(async () => {
    ({ client, transport } = await makeClient());
  });

  after(async () => {
    try { await client.close(); } catch { /* ignore */ }
  });

  it('responds to initialize and lists server info', async () => {
    const info = client.getServerVersion();
    assert.ok(info);
    assert.strictEqual(info.name, 'laravel-ecc');
    assert.ok(typeof info.version === 'string' && info.version.length > 0);
  });

  it('completes a tools/list roundtrip', async () => {
    const result = await client.listTools();
    assert.ok(Array.isArray(result.tools));
    assert.ok(result.tools.length > 0);
  });
});

describe('MCP Server — stdio cleanliness', () => {
  it('server child process keeps stdout protocol-clean (no non-JSON writes)', async () => {
    const { spawn } = await import('node:child_process');
    const child = spawn(process.execPath, [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ECC_ROOT: REPO_ROOT },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString('utf-8'); });
    child.stderr.on('data', (d) => { stderr += d.toString('utf-8'); });
    await new Promise((r) => setTimeout(r, 1500));
    child.kill('SIGTERM');
    await new Promise((r) => child.once('exit', r));
    assert.strictEqual(stdout, '', `Expected empty stdout, got: ${stdout.slice(0, 200)}`);
    assert.ok(stderr.includes('laravel-ecc-mcp'), 'Expected diagnostic banner on stderr');
  });
});

describe('MCP Server — Shutdown handling', () => {
  it('responds to SIGTERM by exiting cleanly (no stdout noise)', async () => {
    const { spawn } = await import('node:child_process');
    const child = spawn(process.execPath, [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ECC_ROOT: REPO_ROOT },
    });
    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d.toString('utf-8'); });
    await new Promise((r) => setTimeout(r, 800));
    child.kill('SIGTERM');
    const exitCode = await new Promise((resolve) => {
      child.once('exit', (code) => resolve(code));
    });
    assert.ok(exitCode === 0 || exitCode === null, `Expected clean exit, got ${exitCode}`);
    assert.strictEqual(stdout, '', `stdout should be empty after shutdown, got: ${stdout.slice(0, 200)}`);
  });

  it('responds to SIGINT by exiting cleanly', async () => {
    const { spawn } = await import('node:child_process');
    const child = spawn(process.execPath, [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ECC_ROOT: REPO_ROOT },
    });
    await new Promise((r) => setTimeout(r, 800));
    child.kill('SIGINT');
    const exitCode = await new Promise((resolve) => {
      child.once('exit', (code) => resolve(code));
    });
    assert.ok(exitCode === 0 || exitCode === null, `Expected clean exit, got ${exitCode}`);
  });
});

describe('MCP Server — Tool discovery', () => {
  let client;
  let transport;

  before(async () => {
    ({ client, transport } = await makeClient());
  });

  after(async () => {
    try { await client.close(); } catch { /* ignore */ }
  });

  const EXPECTED_TOOLS = [
    'retrieve_context_bundle',
    'search_ecc',
    'get_knowledge_unit',
    'get_graph_context',
    'validate_ecc',
  ];

  it('exposes exactly the 5 expected tools (no more, no less)', async () => {
    const result = await client.listTools();
    const names = result.tools.map((t) => t.name).sort();
    assert.deepStrictEqual(names, EXPECTED_TOOLS.slice().sort());
  });

  it('every tool has a non-empty description', async () => {
    const result = await client.listTools();
    for (const t of result.tools) {
      assert.ok(typeof t.description === 'string' && t.description.length > 20,
        `Tool ${t.name} has too-short description`);
    }
  });

  it('every tool is annotated read-only and idempotent', async () => {
    const result = await client.listTools();
    for (const t of result.tools) {
      assert.ok(t.annotations, `Tool ${t.name} missing annotations`);
      assert.strictEqual(t.annotations.readOnlyHint, true, `${t.name} not readOnlyHint`);
      assert.strictEqual(t.annotations.destructiveHint, false, `${t.name} not destructiveHint=false`);
      assert.strictEqual(t.annotations.idempotentHint, true, `${t.name} not idempotentHint`);
    }
  });

  it('every tool has a structured inputSchema and outputSchema', async () => {
    const result = await client.listTools();
    for (const t of result.tools) {
      assert.ok(t.inputSchema, `Tool ${t.name} missing inputSchema`);
      assert.ok(t.outputSchema, `Tool ${t.name} missing outputSchema`);
    }
  });
});

describe('MCP Tool — retrieve_context_bundle', () => {
  let client;
  let transport;

  before(async () => {
    ({ client, transport } = await makeClient());
  });

  after(async () => {
    try { await client.close(); } catch { /* ignore */ }
  });

  it('returns a useful bundle for a CRUD API task', async () => {
    const res = await client.callTool({
      name: 'retrieve_context_bundle',
      arguments: {
        task: 'Build a CRUD REST API for products with policies and pagination',
        mode: 'compact',
      },
    });
    assert.strictEqual(res.isError, undefined);
    assert.ok(res.structuredContent);
    assert.ok(Array.isArray(res.structuredContent.knowledgeUnits));
    assert.ok(res.structuredContent.knowledgeUnits.length > 0);
    assert.ok(typeof res.structuredContent.estimatedTokens === 'number');
    assert.ok(Array.isArray(res.structuredContent.selectedDomains));
  });

  it('respects max_kus and produces bounded output', async () => {
    const res = await client.callTool({
      name: 'retrieve_context_bundle',
      arguments: {
        task: 'Implement Sanctum token authentication',
        mode: 'compact',
        max_kus: 3,
        max_rules: 2,
        max_skills: 2,
      },
    });
    assert.ok(res.structuredContent.knowledgeUnits.length <= 3);
    assert.ok(res.structuredContent.rules.length <= 2);
    assert.ok(res.structuredContent.skills.length <= 2);
  });

  it('includes Policies and pagination KUs for a CRUD-with-policies task', async () => {
    const res = await client.callTool({
      name: 'retrieve_context_bundle',
      arguments: {
        task: 'CRUD REST API for products with policies and pagination',
        mode: 'standard',
      },
    });
    const kuIds = res.structuredContent.knowledgeUnits.map((k) => k.id).join(' ');
    const hasPolicies = /polic(y|ies)/i.test(kuIds) || res.structuredContent.knowledgeUnits.some((k) => /polic/i.test(k.name));
    const hasPagination = /paginat/i.test(kuIds) || res.structuredContent.knowledgeUnits.some((k) => /paginat/i.test(k.name));
    assert.ok(hasPolicies, 'Expected a Policies KU in the bundle');
    assert.ok(hasPagination, 'Expected a pagination KU in the bundle');
  });

  it('matches the CLI retrieval semantics (same bundle shape as retrieveAndFormat JSON)', async () => {
    const { retrieveAndFormat } = await import('../../src/retrieval/index.mjs');
    const cliOut = retrieveAndFormat('Build a REST API for products with policies and pagination', {
      mode: 'compact', format: 'json', eccRoot: REPO_ROOT,
    });
    const cliBundle = JSON.parse(cliOut);
    const res = await client.callTool({
      name: 'retrieve_context_bundle',
      arguments: {
        task: 'Build a REST API for products with policies and pagination',
        mode: 'compact',
      },
    });
    const mcpBundle = res.structuredContent;
    assert.strictEqual(mcpBundle.query, cliBundle.query);
    assert.strictEqual(mcpBundle.mode, cliBundle.mode);
    assert.strictEqual(mcpBundle.knowledgeUnits.length, cliBundle.knowledgeUnits.length);
  });
});

describe('MCP Tool — search_ecc', () => {
  let client;
  let transport;

  before(async () => {
    ({ client, transport } = await makeClient());
  });

  after(async () => {
    try { await client.close(); } catch { /* ignore */ }
  });

  it('returns stable ranked results for an exact-term query', async () => {
    const res = await client.callTool({
      name: 'search_ecc',
      arguments: { query: 'Sanctum', limit: 5 },
    });
    assert.ok(res.structuredContent.results.length > 0);
    const top = res.structuredContent.results[0];
    assert.ok(top.score > 0);
    assert.ok(typeof top.id === 'string');
    assert.ok(top.sourcePath.includes('04-standardized-knowledge.md'));
  });

  it('ranks results by score in descending order', async () => {
    const res = await client.callTool({
      name: 'search_ecc',
      arguments: { query: 'Eloquent relationship', limit: 10 },
    });
    const scores = res.structuredContent.results.map((r) => r.score);
    for (let i = 1; i < scores.length; i++) {
      assert.ok(scores[i - 1] >= scores[i], `Scores not descending at index ${i}: ${scores[i-1]} < ${scores[i]}`);
    }
  });

  it('resolves aliases (aliasTarget signal appears in breakdown)', async () => {
    const res = await client.callTool({
      name: 'search_ecc',
      arguments: { query: 'Sanctum', limit: 10 },
    });
    const hasAlias = res.structuredContent.results.some((r) =>
      Array.isArray(r.breakdown) && r.breakdown.some((b) => b.signal === 'aliasTarget' || b.signal === 'exactAlias'),
    );
    assert.ok(hasAlias, 'Expected at least one alias-resolved hit');
  });
});

describe('MCP Tool — get_knowledge_unit', () => {
  let client;
  let transport;

  before(async () => {
    ({ client, transport } = await makeClient());
  });

  after(async () => {
    try { await client.close(); } catch { /* ignore */ }
  });

  it('returns metadata for a known KU', async () => {
    const res = await client.callTool({
      name: 'get_knowledge_unit',
      arguments: { id: 'security-identity-engineering/authentication/passport-vs-sanctum' },
    });
    assert.ok(res.structuredContent);
    assert.ok(res.structuredContent.metadata);
    assert.strictEqual(res.structuredContent.id, 'security-identity-engineering/authentication/passport-vs-sanctum');
    assert.ok(Array.isArray(res.structuredContent.artifact_summaries));
  });

  it('supports artifact_types filtering', async () => {
    const res = await client.callTool({
      name: 'get_knowledge_unit',
      arguments: {
        id: 'security-identity-engineering/authentication/passport-vs-sanctum',
        artifact_types: ['rules', 'skills'],
      },
    });
    const types = res.structuredContent.artifact_summaries.map((a) => a.artifact_type);
    assert.deepStrictEqual(types.slice().sort(), ['rules', 'skills']);
  });

  it('returns actionable error for unknown ID (isError: true)', async () => {
    const res = await client.callTool({
      name: 'get_knowledge_unit',
      arguments: { id: 'this/ku/does/not/exist' },
    });
    assert.strictEqual(res.isError, true);
    assert.ok(res.content[0].text.includes('not found'));
  });
});

describe('MCP Tool — get_graph_context', () => {
  let client;
  let transport;

  before(async () => {
    ({ client, transport } = await makeClient());
  });

  after(async () => {
    try { await client.close(); } catch { /* ignore */ }
  });

  it('returns prerequisites and related topics for a known KU', async () => {
    const res = await client.callTool({
      name: 'get_graph_context',
      arguments: {
        id: 'data-storage-systems/indexes/b-tree-index-structure',
        prerequisite_depth: 1,
        related_depth: 1,
        max_prerequisites: 10,
        max_related: 10,
      },
    });
    assert.ok(res.structuredContent);
    assert.ok(Array.isArray(res.structuredContent.prerequisites));
    assert.ok(Array.isArray(res.structuredContent.relatedTopics));
  });

  it('respects max limits', async () => {
    const res = await client.callTool({
      name: 'get_graph_context',
      arguments: {
        id: 'data-storage-systems/indexes/b-tree-index-structure',
        prerequisite_depth: 1,
        related_depth: 1,
        max_prerequisites: 1,
        max_related: 1,
      },
    });
    assert.ok(res.structuredContent.prerequisites.length <= 1);
    assert.ok(res.structuredContent.relatedTopics.length <= 1);
  });

  it('is cycle-safe (returns within 2 seconds even on dense graph)', async () => {
    const t0 = Date.now();
    const res = await client.callTool({
      name: 'get_graph_context',
      arguments: {
        id: 'data-storage-systems/indexes/b-tree-index-structure',
        prerequisite_depth: 5,
        related_depth: 5,
        max_prerequisites: 50,
        max_related: 50,
      },
    });
    const elapsed = Date.now() - t0;
    assert.ok(elapsed < 2000, `Expected < 2s, got ${elapsed}ms`);
    assert.ok(res.structuredContent);
  });
});

describe('MCP Tool — validate_ecc', () => {
  let client;
  let transport;

  before(async () => {
    ({ client, transport } = await makeClient());
  });

  after(async () => {
    try { await client.close(); } catch { /* ignore */ }
  });

  it('returns valid: true', async () => {
    const res = await client.callTool({ name: 'validate_ecc', arguments: {} });
    assert.strictEqual(res.structuredContent.valid, true);
    assert.deepStrictEqual(res.structuredContent.issues, []);
  });

  it('reports 2321 knowledge units', async () => {
    const res = await client.callTool({ name: 'validate_ecc', arguments: {} });
    assert.strictEqual(res.structuredContent.knowledgeUnitCount, 2321);
  });

  it('reports 428 dependency edges', async () => {
    const res = await client.callTool({ name: 'validate_ecc', arguments: {} });
    assert.strictEqual(res.structuredContent.dependencyEdgeCount, 428);
  });

  it('reports 3633 relationship edges', async () => {
    const res = await client.callTool({ name: 'validate_ecc', arguments: {} });
    assert.strictEqual(res.structuredContent.relationshipEdgeCount, 3633);
  });

  it('reports 0 cycles', async () => {
    const res = await client.callTool({ name: 'validate_ecc', arguments: {} });
    assert.strictEqual(res.structuredContent.cycleCount, 0);
  });

  it('reports 0 self-loops and 0 dangling edges', async () => {
    const res = await client.callTool({ name: 'validate_ecc', arguments: {} });
    assert.strictEqual(res.structuredContent.selfLoopCount, 0);
    assert.strictEqual(res.structuredContent.danglingEdgeCount, 0);
  });
});

describe('MCP Server — ECC_ROOT resolution', () => {
  it('honours ECC_ROOT environment variable', async () => {
    const { client, transport } = await makeClient({ ECC_ROOT: REPO_ROOT });
    try {
      const res = await client.callTool({ name: 'validate_ecc', arguments: {} });
      assert.strictEqual(res.structuredContent.valid, true);
    } finally {
      await client.close();
    }
  });

  it('honours --ecc-root CLI flag', async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [SERVER_PATH, '--ecc-root', REPO_ROOT],
      env: { ...process.env },
    });
    const client = new Client({ name: 't', version: '0' }, { capabilities: {} });
    await client.connect(transport);
    try {
      const res = await client.callTool({ name: 'validate_ecc', arguments: {} });
      assert.strictEqual(res.structuredContent.valid, true);
    } finally {
      await client.close();
    }
  });

  it('returns actionable isError when intelligence files cannot be resolved', async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [SERVER_PATH, '--ecc-root', 'C:\\nonexistent\\ecc\\path\\that\\does\\not\\exist\\at\\all'],
      env: { ...process.env, ECC_ROOT: '' },
    });
    const client = new Client({ name: 't', version: '0' }, { capabilities: {} });
    await client.connect(transport);
    try {
      const res = await client.callTool({ name: 'validate_ecc', arguments: {} });
      assert.strictEqual(res.isError, true);
      assert.ok(res.content[0].text.includes('ECC intelligence files were not found'));
      assert.ok(res.content[0].text.includes('ECC_ROOT'));
      assert.ok(res.content[0].text.includes('--ecc-root'));
    } finally {
      await client.close();
    }
  });
});

describe('MCP Server — Determinism', () => {
  it('identical calls return identical structured content', async () => {
    const a = await makeClient();
    const b = await makeClient();
    try {
      const args = { task: 'Build a CRUD REST API for products with policies and pagination', mode: 'compact' };
      const r1 = await a.client.callTool({ name: 'retrieve_context_bundle', arguments: args });
      const r2 = await b.client.callTool({ name: 'retrieve_context_bundle', arguments: args });
      assert.deepStrictEqual(r1.structuredContent, r2.structuredContent);
    } finally {
      await a.client.close();
      await b.client.close();
    }
  });

  it('search results are deterministic across calls', async () => {
    const a = await makeClient();
    try {
      const r1 = await a.client.callTool({ name: 'search_ecc', arguments: { query: 'Sanctum', limit: 5 } });
      const r2 = await a.client.callTool({ name: 'search_ecc', arguments: { query: 'Sanctum', limit: 5 } });
      assert.deepStrictEqual(r1.structuredContent, r2.structuredContent);
    } finally {
      await a.client.close();
    }
  });
});

describe('MCP Server — Encoding (UTF-8 / Unicode / Mojibake)', () => {
  it('MCP payload contains valid UTF-8 and no mojibake sequences', async () => {
    const { client } = await makeClient();
    try {
      const res = await client.callTool({
        name: 'retrieve_context_bundle',
        arguments: {
          task: 'Cross-domain Eloquent — relationships, validation, and authorization',
          mode: 'deep',
        },
      });
      const json = JSON.stringify(res.structuredContent);
      const emDashMojibake = json.match(/\u00E2\u20AC\u201D/g);
      const arrowMojibake = json.match(/\u00E2\u2020\u2019/g);
      assert.strictEqual(emDashMojibake, null, 'Found em-dash mojibake in MCP response');
      assert.strictEqual(arrowMojibake, null, 'Found arrow mojibake in MCP response');
      assert.doesNotThrow(() => JSON.parse(json), 'MCP payload is not valid JSON');
    } finally {
      await client.close();
    }
  });
});
