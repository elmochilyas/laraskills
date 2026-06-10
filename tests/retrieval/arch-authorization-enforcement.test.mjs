import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

function readKnowledgeFile(...segments) {
  return readFileSync(join(REPO_ROOT, 'knowledge', ...segments), 'utf-8');
}

describe('Authorization Enforcement (PM-R06)', () => {

  it('policies-model 05-rules.md requires authorize() call at every protected endpoint', () => {
    const content = readKnowledgeFile(
      'security-identity-engineering', 'authorization', 'policies-model', '05-rules.md'
    );
    assert.match(content, /\$this\->authorize\(\)|authorizeResource\(\)|Gate::authorize/);
    assert.match(content, /Protected Endpoint/);
    assert.match(content, /public routes/i);
  });

  it('policies-model 04-standardized-knowledge.md warns that registration =/= enforcement', () => {
    const content = readKnowledgeFile(
      'security-identity-engineering', 'authorization', 'policies-model', '04-standardized-knowledge.md'
    );
    assert.match(content, /Registration ≠ Enforcement|registered but not enforced/i);
  });

  it('policies-model 09-checklists.md has endpoint enforcement item', () => {
    const content = readKnowledgeFile(
      'security-identity-engineering', 'authorization', 'policies-model', '09-checklists.md'
    );
    assert.match(content, /Every controller method calls/);
    assert.match(content, /Registered But Not Enforced/);
  });

  it('policies-model 08-anti-patterns.md has Registered But Not Enforced entry', () => {
    const content = readKnowledgeFile(
      'security-identity-engineering', 'authorization', 'policies-model', '08-anti-patterns.md'
    );
    assert.match(content, /Registered But Not Enforced/);
  });

  it('intelligence JSON includes PM-R06 in rules index', () => {
    const data = JSON.parse(
      readFileSync(join(REPO_ROOT, 'intelligence', 'json', 'rules.json'), 'utf-8')
    );
    const entries = data.entries ?? data;
    const pmRules = Array.isArray(entries)
      ? entries.filter(r => r.id?.startsWith('security-identity-engineering/authorization/policies-model'))
      : Object.values(entries).filter(r => r.id?.startsWith('security-identity-engineering/authorization/policies-model'));
    assert.ok(pmRules.length > 0, 'policies-model rules should exist in intelligence JSON');
  });

});

describe('Validation Guidance — sometimes/required update pattern', () => {

  it('validation-rule-patterns 04-standardized-knowledge.md contains sometimes+required guidance', () => {
    const content = readKnowledgeFile(
      'laravel-core-application-engineering', 'form-requests-validation', 'validation-rule-patterns', '04-standardized-knowledge.md'
    );
    assert.match(content, /sometimes.*required|Update-field pattern/);
    assert.ok(content.includes('sometimes = the field may be omitted from the request'));
    assert.ok(content.includes('required  = if the field is included, it must not be empty'));
  });

});

describe('A standard-mode authorization retrieval surfaces enforcement concepts', () => {

  it('bundle text contains authN vs authZ distinction and endpoint enforcement guidance', async () => {
    const { retrieveContext } = await import('../../src/retrieval/index.mjs');
    const { bundle } = retrieveContext(
      'Add authorization policies for a Product model with endpoint-level enforcement',
      { eccRoot: REPO_ROOT, mode: 'standard' }
    );
    const bundleText = JSON.stringify(bundle).toLowerCase();
    assert.ok(/authenti|authn/i.test(bundleText), 'Should mention authentication');
    assert.ok(bundleText.includes('authori'), 'Should mention authorization');
    assert.ok(bundleText.includes('polic'), 'Should mention policy');
    assert.ok(/enforce|authorize\(\)/i.test(bundleText), 'Should mention enforcement');
    assert.ok(bundle.knowledgeUnits.length > 0, 'Should have knowledge units');
    assert.ok(bundle.rules.length > 0, 'Should have rules in auth bundle');
  });

});
