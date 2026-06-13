import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { loadCatalog } from '../../src/retrieval/catalog-loader.mjs';
import {
  getCachedCatalog,
  setCachedCatalog,
  clearCache,
  invalidateEccRoot,
} from '../../src/retrieval/cache-manager.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const TMP_ROOT = join(__dirname, '..', 'tmp-cache-smoke-test');
const JSON_DIR = join(TMP_ROOT, 'intelligence', 'json');

const genAt = '2026-06-01T00:00:00.000Z';

function writeAllJson(kus, rules, aliases) {
  const empty = { edges: [], knowledge_units: [] };
  writeFileSync(join(JSON_DIR, 'knowledge-units.json'), JSON.stringify(kus), 'utf-8');
  writeFileSync(join(JSON_DIR, 'dependencies.json'), JSON.stringify(empty), 'utf-8');
  writeFileSync(join(JSON_DIR, 'relationships.json'), JSON.stringify({ edges: [] }), 'utf-8');
  writeFileSync(join(JSON_DIR, 'rules.json'), JSON.stringify({ generated_at: genAt, artifact_type: 'rules', entries: rules || [], total_entries: (rules || []).length }), 'utf-8');
  writeFileSync(join(JSON_DIR, 'skills.json'), JSON.stringify({ generated_at: genAt, artifact_type: 'skills', entries: [], total_entries: 0 }), 'utf-8');
  writeFileSync(join(JSON_DIR, 'checklists.json'), JSON.stringify({ generated_at: genAt, artifact_type: 'checklists', entries: [], total_entries: 0 }), 'utf-8');
  writeFileSync(join(JSON_DIR, 'anti-patterns.json'), JSON.stringify({ generated_at: genAt, artifact_type: 'anti-patterns', entries: [], total_entries: 0 }), 'utf-8');
  writeFileSync(join(JSON_DIR, 'decision-trees.json'), JSON.stringify({ generated_at: genAt, artifact_type: 'decision-trees', entries: [], total_entries: 0 }), 'utf-8');
  writeFileSync(join(JSON_DIR, 'aliases.json'), JSON.stringify(aliases || { aliases: [] }), 'utf-8');
  writeFileSync(join(JSON_DIR, 'external-concepts.json'), JSON.stringify({ concepts: [] }), 'utf-8');
}

function makeKu(id, difficulty) {
  const parts = id.split('/');
  return {
    id,
    domain: parts[0] || 'test-domain',
    subdomain: parts[1] || 'test-subdomain',
    knowledge_unit: parts[2] || id,
    directory: 'knowledge/' + id,
    difficulty: difficulty || 'intermediate',
    prerequisites: [],
    related_topics: [],
  };
}

function removeTestRoot() {
  if (existsSync(TMP_ROOT)) rmSync(TMP_ROOT, { recursive: true, force: true });
}

// Re-use the real ECC root for the "unchanged content" test
describe('Cache Smoke — Real ECC Root (unchanged content)', () => {
  before(() => { clearCache(); });
  after(() => { clearCache(); });

  it('should reuse cached catalog on repeated in-process loads', () => {
    const first = loadCatalog(ROOT);
    const second = loadCatalog(ROOT);
    assert.strictEqual(first, second, 'Repeated load should return same object reference');
  });

  it('should return null for uncached path', () => {
    clearCache();
    const cached = getCachedCatalog('/nonexistent/path');
    assert.strictEqual(cached, null);
  });
});

describe('Cache Smoke — Isolated ECC Roots', () => {
  before(() => {
    removeTestRoot();
    mkdirSync(JSON_DIR, { recursive: true });
    writeAllJson(
      { knowledge_units: [makeKu('domain-a/sub/walrus', 'intermediate')] },
      [],
      { aliases: [] },
    );
  });

  after(() => {
    removeTestRoot();
    clearCache();
  });

  it('should keep different ECC roots isolated', () => {
    clearCache();
    const catalogA = loadCatalog(TMP_ROOT);
    const catalogReal = loadCatalog(ROOT);

    assert.notStrictEqual(catalogA, catalogReal, 'Different roots should not share cache');

    const altTmp = TMP_ROOT + '-alt';
    const altJsonDir = join(altTmp, 'intelligence', 'json');
    mkdirSync(altJsonDir, { recursive: true });
    writeAllJson.call({ JSON_DIR: altJsonDir },
      { knowledge_units: [makeKu('domain-b/sub/penguin', 'expert')] },
      [],
      { aliases: [] },
    );

    // Need to correctly scope the writeAllJson for alt path
    writeFileSync(join(altJsonDir, 'knowledge-units.json'), JSON.stringify({ knowledge_units: [makeKu('domain-b/sub/penguin', 'expert')] }), 'utf-8');
    writeFileSync(join(altJsonDir, 'dependencies.json'), JSON.stringify({ edges: [], knowledge_units: [] }), 'utf-8');
    writeFileSync(join(altJsonDir, 'relationships.json'), JSON.stringify({ edges: [] }), 'utf-8');
    for (const f of ['rules.json', 'skills.json', 'checklists.json', 'anti-patterns.json', 'decision-trees.json']) {
      writeFileSync(join(altJsonDir, f), JSON.stringify({ generated_at: genAt, artifact_type: f.replace('.json', ''), entries: [], total_entries: 0 }), 'utf-8');
    }
    writeFileSync(join(altJsonDir, 'aliases.json'), JSON.stringify({ aliases: [] }), 'utf-8');
    writeFileSync(join(altJsonDir, 'external-concepts.json'), JSON.stringify({ concepts: [] }), 'utf-8');

    const catalogB = loadCatalog(altTmp);
    assert.notStrictEqual(catalogB, catalogA, 'Alt root should not share cache with first');
    assert.ok(catalogB.knowledgeUnits.has('domain-b/sub/penguin'), 'Alt root should have penguin KU');
    assert.ok(catalogA.knowledgeUnits.has('domain-a/sub/walrus'), 'First root should have walrus KU');

    rmSync(altTmp, { recursive: true, force: true });
  });

  it('should invalidate cache after file changes', () => {
    clearCache();
    const first = loadCatalog(TMP_ROOT);
    assert.ok(getCachedCatalog(TMP_ROOT));

    // Modify a file (distinct content)
    writeAllJson(
      { knowledge_units: [makeKu('domain-a/sub/elephant', 'advanced')] },
      [],
      { aliases: [] },
    );

    const second = loadCatalog(TMP_ROOT);
    assert.notStrictEqual(second, first, 'Cache should invalidate after file change');
    assert.ok(second.knowledgeUnits.has('domain-a/sub/elephant'), 'New KU should be in catalog');
    assert.ok(!second.knowledgeUnits.has('domain-a/sub/walrus'), 'Old KU should not remain');
  });
});

describe('Cache Smoke — Same-size rewrites trigger invalidation', () => {
  before(() => {
    removeTestRoot();
    mkdirSync(JSON_DIR, { recursive: true });
    writeAllJson(
      { knowledge_units: [makeKu('test/same-size/alpha', 'intermediate')] },
      [],
      { aliases: [] },
    );
  });

  after(() => {
    removeTestRoot();
    clearCache();
  });

  it('should invalidate when file content changes but byte size stays identical', () => {
    clearCache();
    const first = loadCatalog(TMP_ROOT);
    assert.ok(getCachedCatalog(TMP_ROOT));

    const origBytes = readFileSync(join(JSON_DIR, 'knowledge-units.json'));
    const origSize = origBytes.length;

    const replacementKu = makeKu('test/same-size/beta', 'advanced');
    let replBytes = Buffer.from(JSON.stringify({ knowledge_units: [replacementKu] }), 'utf-8');
    const padNeeded = origSize - replBytes.length;
    if (padNeeded > 0) {
      replacementKu.difficulty = 'advanced' + '.'.repeat(padNeeded);
      replBytes = Buffer.from(JSON.stringify({ knowledge_units: [replacementKu] }), 'utf-8');
    }

    assert.strictEqual(replBytes.length, origSize,
      `Test precondition: replacement (${replBytes.length}B) must match original (${origSize}B)`);

    writeFileSync(join(JSON_DIR, 'knowledge-units.json'), replBytes);

    const second = loadCatalog(TMP_ROOT);
    assert.notStrictEqual(second, first, 'Cache should invalidate after same-size rewrite');
    assert.ok(second.knowledgeUnits.has('test/same-size/beta'), 'New KU should be found');
  });

  it('should handle rapid consecutive rewrites independently', () => {
    clearCache();
    const first = loadCatalog(TMP_ROOT);
    assert.ok(getCachedCatalog(TMP_ROOT));

    // Rewrite #1
    writeAllJson(
      { knowledge_units: [makeKu('test/rapid/v2', 'beginner')] },
      [],
      { aliases: [] },
    );
    const afterV2 = loadCatalog(TMP_ROOT);
    assert.notStrictEqual(afterV2, first, 'Cache invalidates after first rapid rewrite');
    assert.ok(afterV2.knowledgeUnits.has('test/rapid/v2'));

    // Rewrite #2 — immediate
    writeAllJson(
      { knowledge_units: [makeKu('test/rapid/v3', 'expert')] },
      [],
      { aliases: [] },
    );
    const afterV3 = loadCatalog(TMP_ROOT);
    assert.notStrictEqual(afterV3, afterV2, 'Cache invalidates after second rapid rewrite');
    assert.ok(afterV3.knowledgeUnits.has('test/rapid/v3'));
    assert.ok(!afterV3.knowledgeUnits.has('test/rapid/v2'), 'v2 should not remain');
  });
});

describe('Cache Smoke — Deterministic Content (no drift)', () => {
  it('should return identical catalog for the real ECC root on repeated cold loads', () => {
    clearCache();
    const first = loadCatalog(ROOT);
    clearCache();
    const second = loadCatalog(ROOT);
    assert.strictEqual(first.knowledgeUnitsCount, second.knowledgeUnitsCount);
    assert.strictEqual(first.dependencies.edges.length, second.dependencies.edges.length);
  });
});
