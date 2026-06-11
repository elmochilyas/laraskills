import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_DIR = join(__dirname, '..', 'tmp-cache-edge-test', 'intelligence', 'json');

const c = readFileSync(join(JSON_DIR, 'knowledge-units.json'), 'utf-8');
console.log('=== original ===');
console.log(c);

// Replace without quotes in the JS string
const r = c.replace('ku-one', 'ku-two').replace('intermediate', 'advancedxxxx');
console.log('=== replaced ===');
console.log(r);

// Verify valid JSON
try {
  const p = JSON.parse(r);
  console.log('=== parsed ===');
  console.log(JSON.stringify(p, null, 2));
  console.log('=== ids ===');
  console.log(p.knowledge_units.map(u => u.id));
} catch (e) {
  console.log('PARSE ERROR:', e.message);
}
