import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LARASKILLS_ROOT = join(__dirname, '..', '..');

import { retrieveContext } from '../../src/retrieval/index.mjs';

const tasks = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'benchmark-tasks.json'), 'utf-8'));

let passed = 0;
let failed = 0;
const failures = [];

// Q-Metrics accumulators
let qPrimaryOk = 0;
let qPrimaryTotal = 0;
let qSupportingHits = 0;
let qSupportingTotal = 0;
let qForbiddenViolations = 0;
let qForbiddenTotal = 0;
let qTopKuOk = 0;
let qTopKuTotal = 0;
let qTotalTokens = 0;
let qExecStart;

console.log(`Running ${tasks.length} benchmark tasks...\n`);

for (const task of tasks) {
  qExecStart = Date.now();
  try {
    const result = retrieveContext(task.query, { eccRoot: LARASKILLS_ROOT, mode: 'compact' });
    const bundle = result.bundle;

    let taskFailed = false;
    const taskErrors = [];

    const selectedDomainIds = (bundle.selectedDomains || []).map(d => d.id);
    const selectedKuIds = (bundle.knowledgeUnits || []).map(ku => ku.id);
    const selectedKuDomains = new Set((bundle.knowledgeUnits || []).map(ku => ku.domain));
    const allDomainIds = new Set([...selectedDomainIds, ...selectedKuDomains]);
    const allKuIds = new Set(selectedKuIds);

    qTotalTokens += bundle.estimatedTokens || 0;

    if (task.expectedPrimaryDomain) {
      qPrimaryTotal++;
      if (allDomainIds.has(task.expectedPrimaryDomain)) {
        qPrimaryOk++;
      } else {
        taskErrors.push(`Expected primary domain "${task.expectedPrimaryDomain}" not found in selected domains or KU domains`);
        taskFailed = true;
      }
    }

    if (task.expectedSupportingDomains && task.expectedSupportingDomains.length > 0) {
      for (const expected of task.expectedSupportingDomains) {
        qSupportingTotal++;
        const foundInKus = (bundle.knowledgeUnits || []).some(ku => ku.domain === expected);
        const foundInDomains = selectedDomainIds.includes(expected);
        if (foundInKus || foundInDomains) {
          qSupportingHits++;
        } else {
          taskErrors.push(`Expected supporting domain "${expected}" not found (warning)`);
        }
      }
    }

    if (task.forbiddenDomains && task.forbiddenDomains.length > 0) {
      for (const forbidden of task.forbiddenDomains) {
        qForbiddenTotal++;
        if (allDomainIds.has(forbidden)) {
          qForbiddenViolations++;
          taskErrors.push(`Forbidden domain "${forbidden}" was selected when it should not be`);
        }
      }
    }

    if (task.forbiddenKus && task.forbiddenKus.length > 0) {
      for (const forbiddenKu of task.forbiddenKus) {
        if (selectedKuIds.some(id => id.includes(forbiddenKu))) {
          taskErrors.push(`Forbidden KU "${forbiddenKu}" found in top results`);
          taskFailed = true;
        }
      }
    }

    if (task.expectedTopKus && task.expectedTopKus.length > 0) {
      for (const expectedKu of task.expectedTopKus) {
        qTopKuTotal++;
        if (selectedKuIds.some(id => id.includes(expectedKu))) {
          qTopKuOk++;
        } else {
          taskErrors.push(`Expected top KU "${expectedKu}" not found in top results`);
          taskFailed = true;
        }
      }
    }

    if (taskFailed) {
      failed++;
      failures.push({ id: task.id, query: task.query, errors: taskErrors });
      console.log(`✗ ${task.id}: ${task.query}`);
      for (const err of taskErrors) {
        console.log(`    ${err}`);
      }
    } else {
      passed++;
      console.log(`✓ ${task.id}: ${task.query}`);
    }
  } catch (e) {
    failed++;
    failures.push({ id: task.id, query: task.query, errors: [e.message] });
    console.log(`✗ ${task.id}: ${task.query} — ERROR: ${e.message}`);
  }
}

const passRate = ((passed / tasks.length) * 100).toFixed(1);
console.log(`\n=== Results ===`);
console.log(`Total: ${tasks.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Pass Rate: ${passRate}%`);

console.log(`\n=== Q-Metrics ===`);
console.log(`Primary Accuracy:       ${qPrimaryTotal > 0 ? ((qPrimaryOk / qPrimaryTotal) * 100).toFixed(1) : 'N/A'}% (${qPrimaryOk}/${qPrimaryTotal})`);
console.log(`Supporting Recall:     ${qSupportingTotal > 0 ? ((qSupportingHits / qSupportingTotal) * 100).toFixed(1) : 'N/A'}% (${qSupportingHits}/${qSupportingTotal})`);
console.log(`Forbidden Precision:   ${qForbiddenTotal > 0 ? (((qForbiddenTotal - qForbiddenViolations) / qForbiddenTotal) * 100).toFixed(1) : 'N/A'}% (${qForbiddenTotal - qForbiddenViolations}/${qForbiddenTotal} clean)`);
console.log(`Top-KU Recall:         ${qTopKuTotal > 0 ? ((qTopKuOk / qTopKuTotal) * 100).toFixed(1) : 'N/A'}% (${qTopKuOk}/${qTopKuTotal})`);
console.log(`Avg Tokens per Query:  ${(qTotalTokens / tasks.length).toFixed(0)}`);

if (failures.length > 0) {
  console.log(`\n=== Failures ===`);
  for (const f of failures) {
    console.log(`\n${f.id}: ${f.query}`);
    for (const e of f.errors) {
      console.log(`  - ${e}`);
    }
  }
}

console.log(`\nBenchmark complete.`);

if (failed > 0) process.exitCode = 1;
