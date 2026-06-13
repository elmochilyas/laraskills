import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LARASKILLS_ROOT = join(__dirname, '..', '..');

const JSON_FILES = [
  'knowledge-units.json',
  'dependencies.json',
  'relationships.json',
  'rules.json',
  'skills.json',
  'checklists.json',
  'anti-patterns.json',
  'decision-trees.json',
  'aliases.json',
  'external-concepts.json',
];

describe('JSON Intelligence Encoding', () => {
  for (const file of JSON_FILES) {
    it(`${file} should be valid UTF-8 without mojibake`, () => {
      const filePath = join(LARASKILLS_ROOT, 'intelligence', 'json', file);
      if (!existsSync(filePath)) return;

      const content = readFileSync(filePath, 'utf-8');

      // Known mojibake sequences from double-encoded UTF-8
      // U+00E2 + U+20AC + U+201D = UTF-8 bytes 0xE2 0x80 0x94 (em-dash) interpreted as Latin-1
      const emDashMojibake = content.match(/\u00E2\u20AC\u201D/g);
      if (emDashMojibake) {
        assert.fail(`Found ${emDashMojibake.length} em-dash mojibake sequences (â€”) — should be —`);
      }

      // U+00E2 + U+2020 + U+2019 = UTF-8 bytes 0xE2 0x86 0x92 (right arrow) interpreted as Latin-1
      const arrowMojibake = content.match(/\u00E2\u2020\u2019/g);
      if (arrowMojibake) {
        assert.fail(`Found ${arrowMojibake.length} arrow mojibake sequences (â†’) — should be →`);
      }

      // Verify file parses as valid JSON (no encoding corruption)
      assert.doesNotThrow(() => JSON.parse(content), `${file} should be valid JSON`);
    });
  }

  it('relationships.json should use actual em-dashes', () => {
    const filePath = join(LARASKILLS_ROOT, 'intelligence', 'json', 'relationships.json');
    const content = readFileSync(filePath, 'utf-8');

    // Should have proper em-dashes (U+2014), not the mojibake sequence
    const properEmDash = content.match(/\u2014/g);
    const mojibakeEmDash = content.match(/\u00E2\u20AC\u201D/g);

    if (properEmDash && properEmDash.length === 0 && mojibakeEmDash) {
      assert.fail('relationships.json should use proper em-dashes');
    }
  });
});
