#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const KNOWLEDGE_DIR = join(ROOT, 'knowledge');
const OUTPUT_DIR = join(ROOT, 'intelligence', 'content');
const OUTPUT_FILE = join(OUTPUT_DIR, 'content-index.json');

function walkKnowledgeUnits(dir) {
  const results = [];
  const domainEntries = readdirSync(dir, { withFileTypes: true });

  for (const domain of domainEntries) {
    if (!domain.isDirectory()) continue;
    const domainPath = join(dir, domain.name);
    const subdomainEntries = readdirSync(domainPath, { withFileTypes: true });

    for (const subdomain of subdomainEntries) {
      if (!subdomain.isDirectory()) continue;
      const subdomainPath = join(domainPath, subdomain.name);
      const kuEntries = readdirSync(subdomainPath, { withFileTypes: true });

      for (const ku of kuEntries) {
        if (!ku.isDirectory()) continue;
        const kuPath = join(subdomainPath, ku.name);
        const contentFile = join(kuPath, '04-standardized-knowledge.md');

        if (existsSync(contentFile)) {
          const kuId = `${domain.name}/${subdomain.name}/${ku.name}`;
          results.push({ kuId, kuPath, contentFile });
        }
      }
    }
  }

  return results;
}

function buildIndex() {
  console.log('Building packaged content index...');
  console.log(`Knowledge directory: ${KNOWLEDGE_DIR}`);
  console.log(`Output: ${OUTPUT_FILE}`);

  if (!existsSync(KNOWLEDGE_DIR)) {
    console.error('ERROR: knowledge/ directory not found. Run this script from the repo root.');
    process.exit(1);
  }

  const units = walkKnowledgeUnits(KNOWLEDGE_DIR);
  console.log(`Found ${units.length} knowledge units with standardized knowledge files`);

  const index = {};
  let totalCharacters = 0;
  let skipped = 0;

  for (const { kuId, contentFile } of units) {
    try {
      const content = readFileSync(contentFile, 'utf-8')
        .replace(/^\uFEFF/, '')
        .trimEnd();
      index[kuId] = content;
      totalCharacters += content.length;
    } catch (err) {
      console.warn(`  SKIP: ${kuId} — ${err.message}`);
      skipped++;
    }
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 0), 'utf-8');

  const stats = JSON.stringify(index).length;
  console.log('');
  console.log(`Index written to: ${OUTPUT_FILE}`);
  console.log(`Total entries:    ${Object.keys(index).length}`);
  console.log(`Skipped:          ${skipped}`);
  console.log(`Raw content:      ${(totalCharacters / 1024 / 1024).toFixed(1)} MB`);
  console.log(`JSON size:        ${(stats / 1024 / 1024).toFixed(1)} MB`);
  console.log('');
  console.log('Done.');
}

buildIndex();
