import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ECC_ROOT = join(__dirname, '..', '..');

import { retrieveContext } from '../../src/retrieval/index.mjs';

const tasks = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'benchmark-tasks.json'), 'utf-8'));

let passed = 0;
let failed = 0;
const failures = [];

console.log(`Running ${tasks.length} benchmark tasks...\n`);

for (const task of tasks) {
  try {
    const result = retrieveContext(task.query, { eccRoot: ECC_ROOT, mode: 'compact' });
    const bundle = result.bundle;

    let taskFailed = false;
    const taskErrors = [];

    const selectedDomainIds = (bundle.selectedDomains || []).map(d => d.id);
    const selectedKuIds = (bundle.knowledgeUnits || []).map(ku => ku.id);
    const selectedKuDomains = new Set((bundle.knowledgeUnits || []).map(ku => ku.domain));
    const allDomainIds = new Set([...selectedDomainIds, ...selectedKuDomains]);

    if (task.expectedPrimaryDomain) {
      if (!allDomainIds.has(task.expectedPrimaryDomain)) {
        taskErrors.push(`Expected primary domain "${task.expectedPrimaryDomain}" not found in selected domains or KU domains`);
        taskFailed = true;
      }
    }

    if (task.expectedSupportingDomains && task.expectedSupportingDomains.length > 0) {
      for (const expected of task.expectedSupportingDomains) {
        const foundInKus = (bundle.knowledgeUnits || []).some(ku => ku.domain === expected);
        const foundInDomains = selectedDomainIds.includes(expected);
        if (!foundInKus && !foundInDomains) {
          taskErrors.push(`Expected supporting domain "${expected}" not found (warning)`);
        }
      }
    }

    if (task.forbiddenDomains && task.forbiddenDomains.length > 0) {
      for (const forbidden of task.forbiddenDomains) {
        if (allDomainIds.has(forbidden) && task.expectedPrimaryDomain !== forbidden) {
          taskErrors.push(`Forbidden domain "${forbidden}" was selected as primary when it should not be`);
        }
      }
    }

    if (task.expectedSkillCategories && task.expectedSkillCategories.length > 0) {
      const skillDomains = new Set((bundle.skills || []).map(s => s.domain));
    }

    if (task.expectedTopKus && task.expectedTopKus.length > 0) {
      for (const expectedKu of task.expectedTopKus) {
        if (!selectedKuIds.some(id => id.includes(expectedKu))) {
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
