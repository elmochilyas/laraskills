import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { loadCatalog } from '../../src/retrieval/catalog-loader.mjs';
import {
  getCachedCatalog,
  clearCache,
} from '../../src/retrieval/cache-manager.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP_ROOT = join(__dirname, '..', 'tmp-cache-edge-test');
const JSON_DIR = join(TMP_ROOT, 'intelligence', 'json');

const genAt = '2026-01-01T00:00:00.000Z';

function writeAllJson(kus, rules, aliases) {
  writeFileSync(join(JSON_DIR, 'knowledge-units.json'), JSON.stringify(kus), 'utf-8');
  writeFileSync(join(JSON_DIR, 'dependencies.json'), JSON.stringify({ edges: [], knowledge_units: [] }), 'utf-8');
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

describe('Cache fingerprint — same-size rewrite', () => {
  before(() => {
    removeTestRoot();
    mkdirSync(JSON_DIR, { recursive: true });
    writeAllJson(
      { knowledge_units: [makeKu('test-domain/test-subdomain/ku-one', 'intermediate')] },
      [],
      { aliases: [] },
    );
  });

  after(() => {
    removeTestRoot();
    clearCache();
  });

  it('should invalidate cache when file content changes but byte size stays identical', () => {
    clearCache();

    // 1. Load & cache
    const first = loadCatalog(TMP_ROOT);
    assert.ok(first);
    assert.ok(getCachedCatalog(TMP_ROOT));

    // 2. Read original bytes, build replacement with same byte size
    const origBytes = readFileSync(join(JSON_DIR, 'knowledge-units.json'));
    const origSize = origBytes.length;

    const replacementKu = makeKu('test-domain/test-subdomain/ku-two', 'advanced');
    // Serialise and compare sizes
    let replBytes = Buffer.from(JSON.stringify({ knowledge_units: [replacementKu] }), 'utf-8');
    let replSize = replBytes.length;

    // Pad to match original size by extending the difficulty string
    const padNeeded = origSize - replSize;
    if (padNeeded > 0) {
      replacementKu.difficulty = 'advanced' + '.'.repeat(padNeeded);
      replBytes = Buffer.from(JSON.stringify({ knowledge_units: [replacementKu] }), 'utf-8');
      replSize = replBytes.length;
    }

    assert.strictEqual(
      replSize, origSize,
      `Test precondition: replacement (${replSize}B) must match original (${origSize}B) byte size exactly`,
    );

    // 3. Write replacement with same size, different content
    writeFileSync(join(JSON_DIR, 'knowledge-units.json'), replBytes);

    // 4. Verify cache invalidates
    const second = loadCatalog(TMP_ROOT);
    assert.ok(second);

    assert.notStrictEqual(second, first, 'cache should invalidate after same-size content rewrite');

    const kuTwo = second.knowledgeUnits.get('test-domain/test-subdomain/ku-two');
    assert.ok(kuTwo, 'replacement KU (ku-two) should be found in catalog after rewrite');
    assert.ok(kuTwo.difficulty.startsWith('advanced'), `difficulty should start with "advanced", got "${kuTwo.difficulty}"`);
  });

  it('should invalidate cache after rapid consecutive rewrites', () => {
    clearCache();

    // 1. Load & cache
    const first = loadCatalog(TMP_ROOT);
    assert.ok(first);
    assert.ok(getCachedCatalog(TMP_ROOT));

    // 2. Rapid rewrite #1 — write immediately
    writeAllJson(
      { knowledge_units: [makeKu('test-domain/test-subdomain/ku-v2', 'beginner')] },
      [],
      { aliases: [] },
    );

    const afterV2 = loadCatalog(TMP_ROOT);
    assert.notStrictEqual(afterV2, first, 'cache should invalidate after first rapid rewrite');

    const kuV2 = afterV2.knowledgeUnits.get('test-domain/test-subdomain/ku-v2');
    assert.ok(kuV2, 'v2 KU should be found');
    assert.strictEqual(kuV2.difficulty, 'beginner');

    // 3. Rapid rewrite #2 — immediately after
    writeAllJson(
      { knowledge_units: [makeKu('test-domain/test-subdomain/ku-v3', 'expert')] },
      [],
      { aliases: [] },
    );

    const afterV3 = loadCatalog(TMP_ROOT);
    assert.notStrictEqual(afterV3, afterV2, 'cache should invalidate after second rapid rewrite');

    const kuV3 = afterV3.knowledgeUnits.get('test-domain/test-subdomain/ku-v3');
    assert.ok(kuV3, 'v3 KU should be found');
    assert.strictEqual(kuV3.difficulty, 'expert');
    assert.strictEqual(afterV3.knowledgeUnits.has('test-domain/test-subdomain/ku-v2'), false, 'v2 should not remain in catalog');
  });
});
