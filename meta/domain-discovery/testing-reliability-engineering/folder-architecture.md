# Folder Architecture: Testing & Reliability Engineering

## Domain Root
```
research/phase-1-domain-discovery/testing-reliability-engineering/
├── domain-analysis.md                     # This file — full domain analysis
└── folder-architecture.md                 # This file — folder architecture plan
```

## Proposed Knowledge Repository Structure
```
testing-reliability-engineering/
│
├── README.md                              # Domain overview, conventions, quick-start
│
├── 1-core-concepts/
│   ├── testing-pyramid.md                 # Unit vs Feature vs E2E distribution
│   ├── pest-vs-phpunit.md                # Framework comparison, migration guide
│   ├── test-environment.md               # .env.testing, phpunit.xml, Pest.php config
│   ├── parallel-execution.md             # Paratest, --parallel, process management
│   └── coverage-strategy.md              # --coverage, --min, pcov/Xdebug, MSI
│
├── 2-feature-http-testing/
│   ├── http-request-helpers.md           # get, post, put, patch, delete, options
│   ├── json-api-testing.md              # getJson, postJson, assertJson, AssertableJson
│   ├── authentication-testing.md        # actingAs, assertAuthenticated, guards
│   ├── authorization-testing.md         # Policy/Gate tests, 403, tenant boundaries
│   ├── validation-testing.md            # assertSessionHasErrors, datasets, form requests
│   ├── file-upload-testing.md           # UploadedFile::fake, Storage::fake
│   ├── view-blade-testing.md            # view(), blade(), assertSee, TestView
│   ├── exception-handling-testing.md    # Exceptions facade, assertReported
│   └── response-assertions.md           # Complete assertion reference (~50 methods)
│
├── 3-database-testing/
│   ├── database-lifecycle.md             # RefreshDatabase, DatabaseMigrations, DatabaseTruncation
│   ├── model-factories.md               # Definition, states, sequences, relationships
│   ├── factory-best-practices.md        # Declarative methods, naming, minimal data
│   ├── database-assertions.md           # assertDatabaseHas, assertSoftDeleted, assertModelExists
│   ├── query-count-testing.md           # expectsDatabaseQueryCount, N+1 detection
│   ├── seeding-strategies.md            # Seeders, Seed attribute, parallel seeding
│   └── parallel-database-management.md  # Process-specific databases, --recreate-databases
│
├── 4-unit-testing/
│   ├── service-action-testing.md         # Container resolution, swap(), resolve()
│   ├── policy-rule-testing.md           # Gate/Policy edge cases
│   ├── value-object-dto-testing.md      # DTO factories, readonly objects
│   ├── pure-logic-testing.md            # Calculators, parsers, transformers
│   └── unit-test-attributes.md          # #[UnitTest], boot skipping
│
├── 5-mocking-fakes/
│   ├── laravel-fakes-overview.md         # When to use fakes vs mocks
│   ├── http-faking.md                   # Http::fake, response sequences, assertSent
│   ├── mail-faking.md                   # Mail::fake, assertSent, assertQueued
│   ├── notification-faking.md           # Notification::fake, assertSentTo
│   ├── queue-faking.md                  # Queue::fake, assertPushed, chains, batches
│   ├── event-faking.md                  # Event::fake, assertDispatched, scoped fakes
│   ├── storage-faking.md               # Storage::fake, disk manipulation
│   ├── bus-faking.md                    # Bus::fake, assertDispatched, assertChained
│   ├── mockery-integration.md           # mock(), partialMock(), spy(), container binding
│   ├── time-manipulation.md            # travel, freezeTime, freezeSecond, Carbon::setTestNow
│   └── console-mocking.md              # withoutMockingConsoleOutput, assertArtisanCommand
│
├── 6-browser-e2e-testing/
│   ├── dusk-setup.md                    # Installation, ChromeDriver, .env.dusk.local
│   ├── dusk-selectors.md                # @dusk attribute, selector chaining
│   ├── dusk-page-objects.md             # Page classes, url(), assert(), elements()
│   ├── dusk-components.md               # Component reuse patterns
│   ├── dusk-waiting-strategies.md       # waitFor, waitForText, waitForLocation vs pause()
│   ├── dusk-authentication.md           # loginAs, cookies, session
│   ├── dusk-multi-browser.md            # Chat/websocket testing
│   ├── dusk-javascript.md               # script(), assertScript, JS dialogs
│   ├── dusk-debugging.md                # Screenshots, console logs, failure capture
│   ├── dusk-ci-integration.md           # Headless Chrome, Selenium Docker, GitHub Actions
│   ├── pest-playwright.md               # Pest 4 Playwright browser testing (new standard)
│   └── dusk-vs-playwright.md            # Migration guide and comparison
│
├── 7-architecture-testing/
│   ├── pest-arch-fundamentals.md         # arch()->expect()->toExtend() etc.
│   ├── architecture-presets.md          # security, laravel, php, strict, relaxed
│   ├── dependency-rule-testing.md       # toOnlyBeUsedIn, module boundaries
│   ├── debug-statement-detection.md     # dd, dump, var_dump, ray rules
│   ├── strict-types-enforcement.md      # toUseStrictTypes()
│   └── custom-architecture-rules.md     # Project-specific structural rules
│
├── 8-mutation-testing/
│   ├── pest-mutation.md                 # covers(), mutates(), --mutate, --min
│   ├── infection-php.md                 # infection.json5, MSI, mutator profiles
│   ├── pest-vs-infection.md             # When to use which tool
│   ├── mutation-ci-strategy.md          # Critical paths, --covered-only, --bail
│   └── mutation-interpretation.md       # Tested vs untested, surviving mutants, fixes
│
├── 9-snapshot-testing/
│   ├── snapshot-assertions.md           # assertMatchesSnapshot, drivers
│   ├── json-snapshots.md                # assertMatchesJsonSnapshot, normalization
│   ├── file-image-snapshots.md          # assertMatchesFileSnapshot, assertImageSnapshot
│   ├── snapshot-ci-behavior.md          # CREATE_SNAPSHOTS=false, --without-creating-snapshots
│   ├── custom-snapshot-drivers.md       # Driver interface, serialize, match
│   └── snapshot-maintenance.md          # --update-snapshots, review workflow
│
├── 10-performance-load-testing/
│   ├── volttest-laravel.md              # Installation, Artisan commands, scenario DSL
│   ├── loadforge-locust.md              # Cloud-based testing, Locust scripts
│   ├── apache-bench-jmeter.md           # ab, JMeter thread groups, listeners
│   ├── performance-metrics.md           # RPS, P95/P99, throughput, error rate
│   ├── bottleneck-identification.md     # N+1, indexing, PHP-FPM, cache, queues
│   ├── performance-ci-integration.md    # VoltTest PHPUnit assertions in CI
│   └── octane-performance-testing.md    # Laravel Octane-specific load patterns
│
├── 11-resilience-chaos-engineering/
│   ├── laravel-resilience.md            # Installation, fault injection (timeout/exception/latency)
│   ├── resilience-assertions.md         # assertFallbackUsed, assertLogWritten, assertDegradedButSuccessful
│   ├── resilience-discovery.md          # resilience:discover, resilience:suggest, resilience:scaffold
│   ├── circuit-breaker-patterns.md      # laravel-fuse, laravel-circuit-breaker
│   ├── laravel-bazooka.md              # Chaos point injection, probability-based disruption
│   └── safety-guardrails.md            # Production blocking, --dry-run, environment checks
│
├── 12-accessibility-testing/
│   ├── axe-core-dusk-integration.md     # Inject axe, run violations, filter critical/serious
│   ├── pa11y-ci-integration.md          # CLI cheats, URL lists, scheduled checks
│   ├── focus-management.md              # assertFocused, error summary focus testing
│   ├── aria-attribute-testing.md        # aria-invalid, aria-describedby, role="alert"
│   ├── live-region-testing.md           # role="status", aria-live assertions
│   └── keyboard-operability.md          # Tab navigation, focus rings, skip links
│
├── 13-contract-testing/
│   ├── consumer-driven-contracts.md     # Frontend/backend agreement patterns
│   ├── openapi-contract-testing.md      # Schema validation, diff detection
│   ├── external-api-contracts.md        # Third-party API contract verification
│   └── contract-versioning.md           # API version management in tests
│
├── 14-ci-cd-pipeline/
│   ├── github-actions-setup.md          # Workflow structure, triggers, matrix strategy
│   ├── pipeline-stages.md              # Lint → static analysis → tests → build → deploy
│   ├── matrix-testing.md               # PHP versions × database engines
│   ├── parallel-sharding.md            # Matrix-based test splitting, find-and-split
│   ├── path-based-triggering.md        # Monorepo optimization, backend/frontend separation
│   ├── caching-strategies.md           # Composer, npm, build artifacts
│   ├── quality-gates.md                # Pint, PHPStan/Larastan, coverage thresholds
│   ├── deployment-strategies.md        # Forge hooks, SSH, Deployer zero-downtime
│   ├── post-deployment-health.md       # /health endpoint, queue checks, Horizon
│   └── pipeline-security.md            # Secrets management, environment injection
│
├── 15-flaky-test-prevention/
│   ├── common-flaky-causes.md           # Time, randomness, state leakage, network, timing
│   ├── data-determinism.md             # Fixed factories, no faker in assertions
│   ├── dusk-flaky-prevention.md        # Explicit waits, data-testid, no pause()
│   ├── ci-retry-strategies.md           # --retry, flaky test tracking, Testmo integration
│   ├── test-isolation-patterns.md       # RefreshDatabase, per-test setup, no shared state
│   └── flaky-test-detection.md          # Historical analysis, CI artifact comparison
│
├── 16-test-organization/
│   ├── directory-structure.md           # By feature vs by type, naming conventions
│   ├── test-naming-conventions.md       # Behavior-first naming, it() vs test()
│   ├── arrange-act-assert.md            # AAA pattern, readability, comments
│   ├── shared-setup-patterns.md         # beforeEach, setUp, Pest.php global config
│   ├── datasets-global.md              # tests/Datasets/ directory, reusable datasets
│   ├── test-helpers.md                 # Custom assertion helpers, Pest macros
│   └── test-documentation.md           # Tests as specs, authorization/API/validation docs
│
├── 17-test-data-management/
│   ├── factory-states.md                # draft/published, admin/regular, state methods
│   ├── factory-sequences.md             # Alternating states, ordered sequences
│   ├── relationship-factories.md        # HasMany, BelongsToMany, morphs
│   ├── dto-factories.md                # Value object factory patterns
│   ├── factory-readability.md           # Declarative methods, intent-revealing names
│   └── seeders-for-testing.md           # Fixed IDs, reproducible scenarios, performance
│
├── 18-advanced-techniques/
│   ├── rate-limit-testing.md            # Throttle middleware, 429 assertions
│   ├── console-command-testing.md       # Artisan::call(), assertExitCode()
│   ├── notification-channel-testing.md  # Custom channels, Slack, SMS
│   ├── websocket-broadcast-testing.md   # Echo, Pusher, WebSocket fakes
│   ├── localization-testing.md          # locale switching, translation assertions
│   ├── middleware-testing.md            # Custom middleware, pipeline testing
│   └── signed-url-testing.md            # Temporary signed routes, expiration
│
├── 19-query-performance-diagnostics/
│   ├── query-sentinel.md                # EXPLAIN ANALYZE, scoring, anti-patterns
│   ├── n-plus-one-detection.md          # expectsDatabaseQueryCount, strict mode
│   ├── index-recommendations.md         # Composite indexes, scan efficiency
│   └── ci-query-regression.md           # Baseline comparison, score thresholds
│
└── 20-migration-guides/
    ├── phpunit-to-pest.md               # Gradual migration strategies
    ├── dusk-to-playwright.md            # Moving from Dusk to Pest Playwright
    ├── pest-3-to-4.md                   # Breaking changes, new features
    ├── laravel-version-upgrades.md      # Testing changes across Laravel versions
    └── ci-migration.md                  # Moving from Travis/CircleCI to GitHub Actions
```

## Directory Conventions

**File Naming:**
- Use lowercase with hyphens (kebab-case)
- Use descriptive, searchable names
- Prefix numbered directories for logical ordering (1-core-concepts, 2-feature-http-testing...)
- Each .md file covers exactly one focused topic

**Content Structure (per file):**
```markdown
# Title
## Overview
Brief description of what this covers and why it matters.

## Key Concepts
Core principles and mental models.

## Implementation
Step-by-step guidance, code examples, configuration.

## Patterns & Best Practices
Recommended approaches with rationale.

## Common Pitfalls
Known mistakes and how to avoid them.

## Related Files
Cross-references to related knowledge items.

## Source References
Tier 1-4 sources consulted for this content.
```

**Indexing:**
- A top-level README.md serves as the entry point
- Each subdirectory can contain its own README.md for navigation
- Cross-reference using relative paths: `See [Database Lifecycle](../3-database-testing/database-lifecycle.md)`

---

## File Size Estimate

| Category | Estimated Files | Est. Total Size |
|----------|----------------|-----------------|
| Core Concepts | 5 | 25-35 KB |
| Feature/HTTP Testing | 9 | 55-75 KB |
| Database Testing | 7 | 40-55 KB |
| Unit Testing | 5 | 25-35 KB |
| Mocking & Fakes | 10 | 60-80 KB |
| Browser/E2E | 12 | 75-100 KB |
| Architecture Testing | 6 | 30-40 KB |
| Mutation Testing | 5 | 25-35 KB |
| Snapshot Testing | 6 | 30-40 KB |
| Performance/Load | 7 | 40-55 KB |
| Resilience/Chaos | 6 | 35-45 KB |
| Accessibility | 6 | 30-40 KB |
| Contract Testing | 4 | 20-25 KB |
| CI/CD Pipeline | 10 | 65-85 KB |
| Flaky Test Prevention | 6 | 30-40 KB |
| Test Organization | 7 | 35-45 KB |
| Test Data Management | 6 | 30-40 KB |
| Advanced Techniques | 7 | 35-45 KB |
| Query Diagnostics | 4 | 20-25 KB |
| Migration Guides | 5 | 25-35 KB |
| **Total** | **~127 files** | **~730-975 KB** |
