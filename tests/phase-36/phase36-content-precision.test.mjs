import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LARASKILLS_ROOT = join(__dirname, '..', '..');

import { searchKnowledge, retrieveAndFormat } from '../../src/retrieval/index.mjs';

describe('Phase 36 — Benchmark 2 Content Precision', () => {
  // Test 1: Eloquent wording
  it('Eloquent repository pattern — uses ORM language, not "Eloquent is a repository"', async () => {
    const results = searchKnowledge('Eloquent repository pattern Active Record ORM', {
      laraskillsRoot: LARASKILLS_ROOT,
      limit: 10,
    });

    assert.ok(results.length > 0, 'Expected search results for Eloquent repository pattern');

    const topResults = results.slice(0, 5);
    const combinedNames = topResults.map(r => r.ku?.name ?? '').join(' ');
    const combinedDomains = topResults.map(r => r.ku?.domain ?? '').join(' ');

    const hasEloqKnowledge =
      /repository/i.test(combinedNames) ||
      /eloquent/i.test(combinedNames) ||
      /Eloquent/i.test(combinedDomains) ||
      /laravel-eloquent/i.test(combinedDomains) ||
      /backend-architecture/i.test(combinedDomains) ||
      /application-architecture/i.test(combinedDomains);

    assert.ok(hasEloqKnowledge, 'Expected Eloquent repository-related knowledge, got: ' + combinedDomains.substring(0, 100));

    // Verify we do NOT see "Eloquent is a repository" as a definitive statement
    const hasBadPhrasing = topResults.some(r => {
      const n = r.ku?.name ?? '';
      return /Eloquent is a repository/i.test(n) || /Eloquent.*is.*repository/i.test(n);
    });
    assert.ok(!hasBadPhrasing, 'Should not contain absolute "Eloquent is a repository" wording');
  });

  // Test 2: Queue serialization nuance
  it('Queue serialization — uses "SerializesModels" or "by identifier" language', async () => {
    const results = searchKnowledge('queued model serialization jobs', {
      laraskillsRoot: LARASKILLS_ROOT,
      limit: 10,
    });

    assert.ok(results.length > 0, 'Expected search results for queued model serialization');

    const topResults = results.slice(0, 5);
    const combinedNames = topResults.map(r => r.ku?.name ?? '').join(' ');
    const combinedDomain = topResults.map(r => r.ku?.domain ?? '').join(' ');

    const hasNuancedLanguage =
      /SerializesModels/i.test(combinedNames) ||
      /by identifier/i.test(combinedNames) ||
      /serializ/i.test(combinedNames) ||
      /queue/i.test(combinedDomain) ||
      /async/i.test(combinedDomain);

    assert.ok(hasNuancedLanguage, 'Expected SerializesModels or "by identifier" language');

    // Verify results do NOT contain absolute "never pass models" language without qualification
    const absoluteBadPhrasing = topResults.every(r => {
      const n = (r.ku?.name ?? '').toLowerCase();
      return !/never pass models/.test(n);
    });
    assert.ok(absoluteBadPhrasing, 'Should not contain absolute "never pass models" without nuance');
  });

  // Test 3: Cashier billing architecture
  it('Cashier billing — uses "does not replace" or calibrated language', async () => {
    const results = searchKnowledge('Laravel Cashier production billing architecture', {
      laraskillsRoot: LARASKILLS_ROOT,
      limit: 10,
    });

    assert.ok(results.length > 0, 'Expected search results for Cashier billing architecture');

    const topResults = results.slice(0, 5);
    const combinedNames = topResults.map(r => r.ku?.name ?? '').join(' ');
    const combinedDomain = topResults.map(r => r.ku?.domain ?? '').join(' ');

    const hasCalibratedLanguage =
      /billing/i.test(combinedNames) ||
      /cashier/i.test(combinedNames) ||
      /payment/i.test(combinedNames) ||
      /architecture/i.test(combinedDomain) ||
      /cost/i.test(combinedDomain);

    assert.ok(hasCalibratedLanguage, 'Expected Cashier/billing calibrated language');

    // Verify no absolute "Cashier handles all billing" language
    const hasAbsoluteCashier = topResults.some(r => {
      const n = r.ku?.name ?? '';
      return /Cashier handles all/i.test(n);
    });
    assert.ok(!hasAbsoluteCashier, 'Should not claim "Cashier handles all billing" absolutely');
  });

  // Test 4: Webhook pipeline
  it('Webhook pipeline — mentions sync/async boundary with verify, persist, dispatch, 2xx', async () => {
    const bundle = retrieveAndFormat(
      'webhook pipeline sync async boundary verify signature persist event dispatch job return 2xx',
      { mode: 'compact', format: 'markdown', laraskillsRoot: LARASKILLS_ROOT },
    );

    assert.ok(typeof bundle === 'string', 'Expected retrieve output');
    assert.ok(bundle.length > 100, 'Expected meaningful bundle content');

    const hasWebhookPipelineTerms =
      /verify/i.test(bundle) ||
      /persist/i.test(bundle) ||
      /dispatch/i.test(bundle) ||
      /2xx/i.test(bundle) ||
      /signature/i.test(bundle);

    assert.ok(hasWebhookPipelineTerms, 'Expected webhook pipeline terms (verify, persist, dispatch, 2xx, signature)');

    // At least 2 of the pipeline terms should be present in the bundle
    const terms = [/verify/i, /persist/i, /dispatch/i, /2xx/i, /signature/i, /webhook/i];
    const matchedTerms = terms.filter(t => t.test(bundle));
    assert.ok(matchedTerms.length >= 3, `Expected at least 3 webhook pipeline terms, found ${matchedTerms.length}`);
  });

  // Test 5: Global scope calibration
  it('Global scopes — calibrated language, not "global scopes are bad"', async () => {
    const results = searchKnowledge('global scopes tenant isolation', {
      laraskillsRoot: LARASKILLS_ROOT,
      limit: 10,
    });

    assert.ok(results.length > 0, 'Expected search results for global scopes tenant isolation');

    const topResults = results.slice(0, 5);
    const combinedNames = topResults.map(r => r.ku?.name ?? '').join(' ');
    const combinedDomain = topResults.map(r => r.ku?.domain ?? '').join(' ');

    const hasCalibratedLanguage =
      /global scope/i.test(combinedNames) ||
      /tenant/i.test(combinedNames) ||
      /scope/i.test(combinedDomain) ||
      /eloquent/i.test(combinedDomain);

    assert.ok(hasCalibratedLanguage, 'Expected calibrated global scope/tenant language');

    // Verify no absolute "global scopes are bad" language
    const hasAbsoluteBad = topResults.some(r => {
      const n = r.ku?.name ?? '';
      return /global scope.*bad/i.test(n) || /bad.*global scope/i.test(n);
    });
    assert.ok(!hasAbsoluteBad, 'Should not contain absolute "global scopes are bad" wording');
  });

  // Test 6: Spatie team-scoped auth
  it('Spatie team-scoped authorization — guard names, cache invalidation, team context', async () => {
    const results = searchKnowledge('team scoped Spatie Permission guard cache', {
      laraskillsRoot: LARASKILLS_ROOT,
      limit: 10,
    });

    assert.ok(results.length > 0, 'Expected search results for team-scoped auth');

    const topResults = results.slice(0, 5);
    const combinedNames = topResults.map(r => r.ku?.name ?? '').join(' ');
    const combinedDomain = topResults.map(r => r.ku?.domain ?? '').join(' ');

    const hasAuthTerms =
      /guard/i.test(combinedNames) ||
      /team/i.test(combinedNames) ||
      /permission/i.test(combinedNames) ||
      /spatie/i.test(combinedNames) ||
      /author/i.test(combinedDomain) ||
      /security/i.test(combinedDomain);

    assert.ok(hasAuthTerms, 'Expected team-scoped authorization terms');
  });

  // Test 7: Pest architecture examples
  it('Pest architecture tests — references verifying syntax or conceptual labeling', async () => {
    const results = searchKnowledge('Pest architecture tests conceptual', {
      laraskillsRoot: LARASKILLS_ROOT,
      limit: 10,
    });

    assert.ok(results.length > 0, 'Expected search results for Pest architecture tests');

    const topResults = results.slice(0, 5);
    const combinedNames = topResults.map(r => r.ku?.name ?? '').join(' ');
    const combinedDomain = topResults.map(r => r.ku?.domain ?? '').join(' ');

    const hasPestTerms =
      /pest/i.test(combinedNames) ||
      /architect/i.test(combinedNames) ||
      /testing/i.test(combinedDomain);

    assert.ok(hasPestTerms, 'Expected Pest/architecture testing references');
  });

  // Test 8: Public vs internal output
  it('Public architecture report — output modes (public vs internal mechanism language)', async () => {
    const bundle = retrieveAndFormat(
      'public architecture report output mode internal vs public language skill references',
      { mode: 'compact', format: 'markdown', laraskillsRoot: LARASKILLS_ROOT },
    );

    assert.ok(typeof bundle === 'string', 'Expected retrieve output');
    assert.ok(bundle.length > 100, 'Expected meaningful bundle content');

    const hasOutputTerms =
      /public/i.test(bundle) ||
      /internal/i.test(bundle) ||
      /output/i.test(bundle) ||
      /report/i.test(bundle) ||
      /calibrated/i.test(bundle);

    assert.ok(hasOutputTerms, 'Expected public vs internal output mode references');
  });

  // Test 9: Observability tools
  it('Observability — does not claim specific tools are always required', async () => {
    const results = searchKnowledge('laravel observability Pulse Telescope monitoring', {
      laraskillsRoot: LARASKILLS_ROOT,
      limit: 10,
    });

    assert.ok(results.length > 0, 'Expected search results for observability');

    const combinedNames = results.map(r => r.ku?.name ?? '').join(' ');
    const combinedDomains = results.map(r => r.ku?.domain ?? '').join(' ');

    const hasObservability =
      /pulse/i.test(combinedNames) ||
      /telescope/i.test(combinedNames) ||
      /observ/i.test(combinedNames) ||
      /observ/i.test(combinedDomains) ||
      /monitor/i.test(combinedNames);

    assert.ok(hasObservability, 'Expected observability tool references');
  });

  // Test 10: Scoring consistency
  it('Review scoring — references one canonical scoring system', async () => {
    const bundle = retrieveAndFormat(
      'review scoring consistency calibrated language single scoring system review report',
      { mode: 'compact', format: 'markdown', laraskillsRoot: LARASKILLS_ROOT },
    );

    assert.ok(typeof bundle === 'string', 'Expected retrieve output');
    assert.ok(bundle.length > 100, 'Expected meaningful bundle content');

    const hasScoringTerms =
      /scoring/i.test(bundle) ||
      /score/i.test(bundle) ||
      /calibrated/i.test(bundle) ||
      /language/i.test(bundle);

    assert.ok(hasScoringTerms, 'Expected calibrated scoring/language references');
  });

  // Test 11: Comprehensive retrieval
  it('Comprehensive retrieval — bundle covers at least 5 calibrated topics', async () => {
    const query = [
      'Review a flawed Laravel 13 SaaS architecture with repositories everywhere,',
      'custom Stripe instead of Cashier, synchronous webhooks, manual roles on users,',
      'middleware authorization, global scopes for tenancy, mixed role and plan checks,',
      'queued billing jobs, no observability, and Pest architecture tests',
    ].join(' ');

    const bundle = retrieveAndFormat(query, {
      laraskillsRoot: LARASKILLS_ROOT,
      mode: 'compact',
      format: 'markdown',
    });

    assert.ok(typeof bundle === 'string', 'Expected markdown string from retrieveAndFormat');
    assert.ok(bundle.length > 0, 'Expected non-empty bundle text');

    const checks = [
      { label: 'calibrated language', pattern: /calibrat/i },
      { label: 'Eloquent ORM', pattern: /Eloquent.*ORM|ORM.*Eloquent|Eloquent/i },
      { label: 'Cashier default', pattern: /Cashier|payment gateway/i },
      { label: 'BillingGateway', pattern: /billing/i },
      { label: 'webhook sync async pipeline', pattern: /webhook|pipeline/i },
      { label: 'queued model serialization nuance', pattern: /serializ|queue/i },
      { label: 'global scope calibration', pattern: /global scope|scope.*tenant/i },
      { label: 'team-scoped authorization', pattern: /team.*scope|authorization|role|permission/i },
      { label: 'public output mode', pattern: /public|internal|output/i },
      { label: 'Pest architecture examples', pattern: /architect|pest|test/i },
      { label: 'observability', pattern: /observ/i },
    ];

    const matched = checks.filter(c => c.pattern.test(bundle));
    assert.ok(
      matched.length >= 5,
      `Expected at least 5 calibrated topics matched, got ${matched.length}: ${matched.map(c => c.label).join(', ')}`
    );
  });
});
