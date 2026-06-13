import { performance } from 'node:perf_hooks';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  retrieveContext,
  searchKnowledge,
  validateIntelligence,
  getKnowledgeUnit,
} from '../../src/retrieval/index.mjs';
import { clearCache } from '../../src/retrieval/cache-manager.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LARASKILLS_ROOT = join(__dirname, '..', '..');

const TASKS = [
  'Build a CRUD REST API for products with policies and pagination',
  'Build tenant-isolated Project endpoints with scoped queries and leakage tests',
  'Add Sanctum authentication to a Laravel API',
  'Fix an Eloquent N+1 query',
];

const WARMUP_ITERATIONS = 2;
const MEASURE_ITERATIONS = 5;

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function fmt(n) {
  return n.toFixed(1).padStart(8);
}

async function run() {
  const results = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    eccRoot: LARASKILLS_ROOT,
    measures: {},
  };

  clearCache();

  async function measure(label, fn, options = {}) {
    const { coldOnly = false, warmupCount = WARMUP_ITERATIONS, measureCount = MEASURE_ITERATIONS } = options;

    for (let i = 0; i < warmupCount; i++) {
      clearCache();
      fn();
    }

    const coldTimes = [];
    for (let i = 0; i < measureCount; i++) {
      clearCache();
      const start = performance.now();
      fn();
      coldTimes.push(performance.now() - start);
    }

    const warmTimes = [];
    for (let i = 0; i < measureCount; i++) {
      const start = performance.now();
      fn();
      warmTimes.push(performance.now() - start);
    }

    results.measures[label] = {
      cold: {
        min: Math.min(...coldTimes),
        max: Math.max(...coldTimes),
        avg: coldTimes.reduce((a, b) => a + b, 0) / coldTimes.length,
        median: median(coldTimes),
        samples: coldTimes,
      },
      warm: {
        min: Math.min(...warmTimes),
        max: Math.max(...warmTimes),
        avg: warmTimes.reduce((a, b) => a + b, 0) / warmTimes.length,
        median: median(warmTimes),
        samples: warmTimes,
      },
    };
  }

  for (const task of TASKS) {
    await measure(`retrieve (compact): ${task.slice(0, 40)}`, () => {
      retrieveContext(task, { eccRoot: LARASKILLS_ROOT, mode: 'compact' });
    });
  }

  for (const task of TASKS) {
    await measure(`search: ${task.slice(0, 40)}`, () => {
      searchKnowledge(task, { eccRoot: LARASKILLS_ROOT, limit: 5 });
    });
  }

  await measure('validate', () => {
    validateIntelligence({ eccRoot: LARASKILLS_ROOT });
  });

  await measure('get_knowledge_unit', () => {
    getKnowledgeUnit('api-crud-system-engineering/resource-controllers/resource-controller-methods', {
      eccRoot: LARASKILLS_ROOT,
    });
  });

  const totalColdRetrieve = results.measures[`retrieve (compact): ${TASKS[0].slice(0, 40)}`].cold.avg;
  const totalWarmRetrieve = results.measures[`retrieve (compact): ${TASKS[0].slice(0, 40)}`].warm.avg;

  console.log('');
  console.log('=== Performance Benchmark Results ===');
  console.log(`Timestamp:    ${results.timestamp}`);
  console.log(`Node.js:      ${results.nodeVersion}`);
  console.log(`Platform:     ${results.platform}`);
  console.log(`ECC Root:     ${results.eccRoot}`);
  console.log('');

  console.log('Metric'.padEnd(55), 'Cold(avg)'.padEnd(10), 'Warm(avg)'.padEnd(10),
    'Cold(med)'.padEnd(10), 'Warm(med)'.padEnd(10), 'Improv');
  console.log('-'.repeat(100));

  for (const [label, m] of Object.entries(results.measures)) {
    const improvement = m.cold.avg > 0 && m.warm.avg < m.cold.avg
      ? ((1 - m.warm.avg / m.cold.avg) * 100).toFixed(1) + '%'
      : m.cold.avg > 0
        ? '0.0%'
        : 'N/A';
    console.log(label.padEnd(55),
      fmt(m.cold.avg).padEnd(10),
      fmt(m.warm.avg).padEnd(10),
      fmt(m.cold.median).padEnd(10),
      fmt(m.warm.median).padEnd(10),
      improvement);
  }

  console.log('');
  console.log(`Cold samples per metric: ${MEASURE_ITERATIONS} (with clearCache before each)`);
  console.log(`Warm samples per metric: ${MEASURE_ITERATIONS} (reusing cached catalog)`);
  console.log(`Warmup iterations: ${WARMUP_ITERATIONS}`);
  console.log('');

  const hasImprovement = Object.entries(results.measures).some(
    ([, m]) => m.warm.avg < m.cold.avg * 0.9
  );

  if (hasImprovement) {
    console.log('✓ Caching is providing measurable improvement.');
  } else {
    console.log('○ No significant caching benefit detected (threshold: 10% reduction).');
  }

  console.log('');
}

run().catch((err) => {
  console.error('Performance benchmark failed:', err);
  process.exit(1);
});
