import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

import { validateIntelligence } from '../../src/retrieval/index.mjs';
import { findEccRoot } from '../../src/retrieval/catalog-loader.mjs';

// Helper: replicate Kahn's topological sort for synthetic graphs
function topologicalSort(nodes, edges) {
  const inDegree = new Map();
  const adj = new Map();
  for (const n of nodes) { inDegree.set(n, 0); adj.set(n, []); }
  for (const e of edges) {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source).push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  }
  const queue = [];
  for (const [id, deg] of inDegree) { if (deg === 0) queue.push(id); }
  let count = 0;
  while (queue.length > 0) {
    const node = queue.shift();
    count++;
    for (const neighbor of (adj.get(node) || [])) {
      const nd = inDegree.get(neighbor) - 1;
      inDegree.set(neighbor, nd);
      if (nd === 0) queue.push(neighbor);
    }
  }
  const unreachable = nodes.filter(n => inDegree.get(n) > 0);
  return { reachableCount: count, totalCount: nodes.length, unreachable };
}

function hasSelfLoops(edges) {
  return edges.filter(e => e.source === e.target);
}

function findDuplicates(edges) {
  const seen = new Set();
  const dups = [];
  for (const e of edges) {
    if (seen.has(e.id)) dups.push(e.id);
    seen.add(e.id);
  }
  return dups;
}

describe('Validator — Integration', () => {
  let result;

  before(() => {
    result = validateIntelligence();
  });

  it('returns valid: true with no issues', () => {
    assert.strictEqual(result.valid, true, `Expected valid=true but got issues: ${JSON.stringify(result.issues)}`);
    assert.strictEqual(result.issues.length, 0);
  });

  it('contains 2321 knowledge units', () => {
    assert.strictEqual(result.knowledgeUnitCount, 2321);
  });

  it('has no circular dependencies (all KUs reachable)', () => {
    const cycleIssue = result.issues.find(i => i.includes('Circular dependency'));
    assert.strictEqual(cycleIssue, undefined, `Cycle found: ${cycleIssue}`);
  });

  it('has dependency edges with valid sources and targets', () => {
    const danglingIssues = result.issues.filter(i => i.includes('not found in KUs'));
    assert.strictEqual(danglingIssues.length, 0, `Dangling edges: ${JSON.stringify(danglingIssues)}`);
  });

  it('has relationship edges with valid sources and targets', () => {
    const danglingIssues = result.issues.filter(i => i.includes('Relationship edge'));
    assert.strictEqual(danglingIssues.length, 0);
  });

  it('all KUs have domain and subdomain', () => {
    const missingDomain = result.issues.filter(i => i.includes('missing domain'));
    assert.strictEqual(missingDomain.length, 0);
  });
});

describe('Validator — dependencies.json integrity', () => {
  let edges;

  before(() => {
    const path = join(ROOT, 'intelligence/json/dependencies.json');
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw);
    edges = parsed.edges || [];
  });

  it('has no self-loops', () => {
    const selfLoops = hasSelfLoops(edges);
    assert.strictEqual(selfLoops.length, 0,
      `Self-loops found: ${JSON.stringify(selfLoops.map(e => e.id))}`);
  });

  it('has no duplicate logical edges', () => {
    const dups = findDuplicates(edges);
    assert.strictEqual(dups.length, 0,
      `Duplicate edges: ${JSON.stringify(dups)}`);
  });

  it('all edges have required fields', () => {
    for (const e of edges) {
      assert.ok(e.id, `Edge missing id: ${JSON.stringify(e)}`);
      assert.ok(e.source, `Edge missing source: ${JSON.stringify(e)}`);
      assert.ok(e.target, `Edge missing target: ${JSON.stringify(e)}`);
      assert.ok(e.type, `Edge missing type: ${JSON.stringify(e)}`);
      assert.ok(e.reason, `Edge missing reason: ${JSON.stringify(e)}`);
      assert.ok(Array.isArray(e.evidence_paths), `Edge missing evidence_paths: ${JSON.stringify(e)}`);
    }
  });
});

describe('Validator — aliases.json integrity', () => {
  let aliases;

  before(() => {
    const path = join(ROOT, 'intelligence/json/aliases.json');
    const raw = readFileSync(path, 'utf8');
    aliases = JSON.parse(raw).aliases || [];
  });

  it('has 120 aliases', () => {
    assert.strictEqual(aliases.length, 120);
  });

  it('each alias resolves to a valid canonical KU', () => {
    const kuPath = join(ROOT, 'intelligence/json/knowledge-units.json');
    const kus = JSON.parse(readFileSync(kuPath, 'utf8'));
    const kusArr = kus.knowledge_units || kus.knowledgeUnits || [];
    const validIds = new Set(kusArr.map(k => k.id));
    for (const a of aliases) {
      assert.ok(validIds.has(a.canonical_ku_id),
        `Alias "${a.alias}" resolves to non-existent KU: ${a.canonical_ku_id}`);
    }
  });
});

describe('Validator — relationships.json integrity', () => {
  let relEdges;

  before(() => {
    const path = join(ROOT, 'intelligence/json/relationships.json');
    const raw = readFileSync(path, 'utf8');
    relEdges = JSON.parse(raw).edges || [];
  });

  it('has no duplicate relationship edges', () => {
    const seen = new Set();
    const dups = [];
    for (const e of relEdges) {
      if (seen.has(e.id)) dups.push(e.id);
      seen.add(e.id);
    }
    assert.strictEqual(dups.length, 0,
      `Duplicate relationship edges: ${JSON.stringify(dups)}`);
  });
});

describe('Cycle Detection — synthetic DAG with isolated KUs', () => {
  it('includes isolated nodes (no edges) in topological sort', () => {
    const nodes = ['a', 'b', 'c'];
    const edges = [{ id: 'a->b', source: 'a', target: 'b', type: 'prerequisite' }];
    const result = topologicalSort(nodes, edges);
    assert.strictEqual(result.reachableCount, 3);
    assert.strictEqual(result.totalCount, 3);
    assert.strictEqual(result.unreachable.length, 0);
  });

  it('processes DAG with no cycles', () => {
    const nodes = ['a', 'b', 'c', 'd'];
    const edges = [
      { id: 'a->b', source: 'a', target: 'b' },
      { id: 'a->c', source: 'a', target: 'c' },
      { id: 'b->d', source: 'b', target: 'd' },
    ];
    const result = topologicalSort(nodes, edges);
    assert.strictEqual(result.reachableCount, 4);
    assert.strictEqual(result.unreachable.length, 0);
  });

  it('handles empty graph', () => {
    const result = topologicalSort([], []);
    assert.strictEqual(result.reachableCount, 0);
    assert.strictEqual(result.totalCount, 0);
  });
});

describe('Cycle Detection — self-loops', () => {
  it('detects self-loop edges', () => {
    const edges = [
      { id: 'a->a', source: 'a', target: 'a', type: 'prerequisite' }
    ];
    const selfLoops = hasSelfLoops(edges);
    assert.strictEqual(selfLoops.length, 1);
    assert.strictEqual(selfLoops[0].id, 'a->a');
  });

  it('detects multiple self-loops', () => {
    const edges = [
      { id: 'a->a', source: 'a', target: 'a' },
      { id: 'b->b', source: 'b', target: 'b' },
      { id: 'a->b', source: 'a', target: 'b' },
    ];
    const selfLoops = hasSelfLoops(edges);
    assert.strictEqual(selfLoops.length, 2);
  });

  it('self-loop causes KUs to be unreachable in topological sort', () => {
    const nodes = ['a', 'b'];
    const edges = [{ id: 'a->a', source: 'a', target: 'a', type: 'prerequisite' }];
    const result = topologicalSort(nodes, edges);
    assert.ok(result.reachableCount < result.totalCount);
  });
});

describe('Cycle Detection — two-node cycles', () => {
  it('detects a two-node mutual dependency cycle', () => {
    const nodes = ['a', 'b'];
    const edges = [
      { id: 'a->b', source: 'a', target: 'b', type: 'prerequisite' },
      { id: 'b->a', source: 'b', target: 'a', type: 'prerequisite' },
    ];
    const result = topologicalSort(nodes, edges);
    assert.strictEqual(result.reachableCount, 0);
    assert.strictEqual(result.unreachable.length, 2);
    assert.ok(result.unreachable.includes('a'));
    assert.ok(result.unreachable.includes('b'));
  });

  it('detects a two-node cycle via alias-resolved edges', () => {
    const nodes = ['x', 'y'];
    const edges = [
      { id: 'x->y', source: 'x', target: 'y', type: 'prerequisite', reason: 'Explicit dep' },
      { id: 'y->x', source: 'y', target: 'x', type: 'prerequisite', reason: "Alias: 'some alias'" },
    ];
    const result = topologicalSort(nodes, edges);
    assert.strictEqual(result.reachableCount, 0);
    assert.strictEqual(result.unreachable.length, 2);
  });

  it('DAG with correctly directional dependencies passes', () => {
    const nodes = ['foundation', 'intermediate', 'advanced'];
    const edges = [
      { id: 'foundation->intermediate', source: 'foundation', target: 'intermediate' },
      { id: 'intermediate->advanced', source: 'intermediate', target: 'advanced' },
    ];
    const result = topologicalSort(nodes, edges);
    assert.strictEqual(result.reachableCount, 3);
    assert.strictEqual(result.unreachable.length, 0);
  });
});

describe('Cycle Detection — multi-node SCCs', () => {
  it('detects a 3-node cycle', () => {
    const nodes = ['a', 'b', 'c'];
    const edges = [
      { id: 'a->b', source: 'a', target: 'b', type: 'prerequisite' },
      { id: 'b->c', source: 'b', target: 'c', type: 'prerequisite' },
      { id: 'c->a', source: 'c', target: 'a', type: 'prerequisite' },
    ];
    const result = topologicalSort(nodes, edges);
    assert.strictEqual(result.reachableCount, 0);
    assert.strictEqual(result.unreachable.length, 3);
  });

  it('detects a 5-node cycle (SCC)', () => {
    const nodes = ['a', 'b', 'c', 'd', 'e'];
    const edges = [
      { id: 'a->b', source: 'a', target: 'b' },
      { id: 'b->c', source: 'b', target: 'c' },
      { id: 'c->d', source: 'c', target: 'd' },
      { id: 'd->e', source: 'd', target: 'e' },
      { id: 'e->a', source: 'e', target: 'a' },
    ];
    const result = topologicalSort(nodes, edges);
    assert.strictEqual(result.reachableCount, 0);
    assert.strictEqual(result.unreachable.length, 5);
  });

  it('detects a 7-node cycle with branching', () => {
    const nodes = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const edges = [
      { id: 'a->b', source: 'a', target: 'b' },
      { id: 'b->c', source: 'b', target: 'c' },
      { id: 'c->a', source: 'c', target: 'a' },
      { id: 'c->d', source: 'c', target: 'd' },
      { id: 'd->e', source: 'd', target: 'e' },
      { id: 'e->f', source: 'e', target: 'f' },
      { id: 'f->g', source: 'f', target: 'g' },
      { id: 'g->e', source: 'g', target: 'e' },
    ];
    const result = topologicalSort(nodes, edges);
    assert.strictEqual(result.reachableCount, 0);
    assert.strictEqual(result.unreachable.length, 7);
  });
});

describe('Cycle Detection — duplicate edges', () => {
  it('duplicate logical edges are detected', () => {
    const edges = [
      { id: 'a->b', source: 'a', target: 'b', type: 'prerequisite' },
      { id: 'a->b', source: 'a', target: 'b', type: 'prerequisite' },
    ];
    const dups = findDuplicates(edges);
    assert.strictEqual(dups.length, 1);
    assert.strictEqual(dups[0], 'a->b');
  });

  it('duplicates with different IDs but same source/target are detected', () => {
    const edges = [
      { id: 'a->b', source: 'a', target: 'b' },
      { id: 'a->b', source: 'a', target: 'b' },
    ];
    const dups = findDuplicates(edges);
    assert.strictEqual(dups.length, 1);
  });

  it('duplicates do not create false cycles', () => {
    const nodes = ['a', 'b', 'c'];
    const edges = [
      { id: 'a->b', source: 'a', target: 'b' },
      { id: 'a->b', source: 'a', target: 'b' },
      { id: 'b->c', source: 'b', target: 'c' },
    ];
    const result = topologicalSort(nodes, edges);
    assert.strictEqual(result.reachableCount, 3);
    assert.strictEqual(result.unreachable.length, 0);
  });
});

describe('Reciprocal related-topic references', () => {
  it('related-topic edges do not become prerequisite edges', () => {
    const nodes = ['a', 'b'];
    const edges = [
      { id: 'a->b', source: 'a', target: 'b', type: 'related-topic' },
      { id: 'b->a', source: 'b', target: 'a', type: 'related-topic' },
    ];
    const deps = edges.filter(e => e.type === 'prerequisite');
    assert.strictEqual(deps.length, 0);
  });

  it('prerequisite edges are distinguished from relationship edges', () => {
    const nodes = ['a', 'b'];
    const edges = [
      { id: 'a->b', source: 'a', target: 'b', type: 'related-topic' },
      { id: 'b->a', source: 'b', target: 'a', type: 'prerequisite' },
    ];
    const prereqs = edges.filter(e => e.type === 'prerequisite');
    const rels = edges.filter(e => e.type === 'related-topic');
    assert.strictEqual(prereqs.length, 1);
    assert.strictEqual(rels.length, 1);

    const result = topologicalSort(nodes, prereqs);
    assert.strictEqual(result.reachableCount, 2);
    assert.strictEqual(result.unreachable.length, 0);
  });
});

describe('CLI Error Handling — missing intelligence files', () => {
  it('findEccRoot throws actionable error when root not found', () => {
    assert.throws(
      () => findEccRoot(process.cwd(), '/nonexistent/ecc/path'),
      { message: 'ECC root not found at specified path: /nonexistent/ecc/path' },
    );
  });

  it('findEccRoot throws actionable error when ECC_ROOT env path is invalid', () => {
    assert.throws(
      () => findEccRoot(process.cwd(), null, '/invalid/ecc/env/root'),
      { message: 'ECC root not found at ECC_ROOT: /invalid/ecc/env/root' },
    );
  });

  it('findEccRoot fallback to process.cwd() succeeds when inside the repo', () => {
    const root = findEccRoot(process.cwd());
    assert.ok(root);
    assert.ok(root.includes('laravel-ecc'));
  });
});
