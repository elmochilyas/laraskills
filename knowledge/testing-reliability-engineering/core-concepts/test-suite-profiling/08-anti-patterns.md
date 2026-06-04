# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Core Concepts & Fundamentals |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | No Test Suite Setup Before Writing Tests | Methodology | High |
| 2 | Writing Tests That Depend on Execution Order | Structure | High |
| 3 | Not Using In-Memory SQLite for Unit Tests | Performance | Medium |
| 4 | Asserting Too Much (Over-Assertion) | Practice | Medium |
| 5 | No Test Naming Convention | Structure | Low |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: No Test Suite Setup Before Writing Tests

### Category
Methodology

### Description
Writing tests without first setting up test suite, database config, env file, or CI integration.

### Why It Happens
Developers jump into writing tests without infrastructure.

### Warning Signs
Tests pass locally but fail in CI. No phpunit.xml configured.

### Why Harmful
Without proper setup test results are non-deterministic.

### Consequences
CI unreliable. Developers ignore failing tests.

### Alternative
Set up infrastructure first: config files, env, migrations, CI.

### Refactoring Strategy
1. Create phpunit.xml.dist. 2. Configure .env.testing. 3. Set DB migrations. 4. Verify trivial test passes.

### Detection Checklist
- [ ] phpunit.xml.dist configured
- [ ] .env.testing exists
- [ ] CI test step passes

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Set up infrastructure before tests
- 05-rules.md: Ensure deterministic environment
- 06-skills.md: Configure Test Suite Infrastructure
- 07-decision-trees.md: Test Infrastructure Setup Decision

---

## Anti-Pattern 2: Writing Tests That Depend on Execution Order

### Category
Structure

### Description
Tests implicitly depending on state from previous tests causing cascading failures.

### Why It Happens
Convenience of reusing state. Not refreshing database between tests.

### Warning Signs
Tests pass in file order but fail individually. Random order reveals failures.

### Why Harmful
Order-dependent tests are non-deterministic. Random order breaks them.

### Consequences
Flaky suite. CI failures from ordering changes.

### Alternative
Each test sets up own state. Use setUp() and tearDown(). Refresh DB between.

### Refactoring Strategy
1. Identify order-dependent tests. 2. Move setup to setUp(). 3. Enable random order in CI.

### Detection Checklist
- [ ] Tests pass random order
- [ ] Each test has independent setup
- [ ] DB refreshed between tests

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Tests must be order-independent
- 05-rules.md: Refresh state between tests
- 06-skills.md: Design Independent Tests
- 07-decision-trees.md: Test Structure Decision

---

## Anti-Pattern 3: Not Using In-Memory SQLite for Unit Tests

### Category
Performance

### Description
Using production DB driver for all tests including unit tests.

### Why It Happens
Production DB as default. Same as production philosophy.

### Warning Signs
Test suite takes minutes. Unit tests not hitting DB still wait for connection.

### Why Harmful
DB I/O is orders of magnitude slower than in-memory.

### Consequences
Slow suite (10min+). Tests run infrequently.

### Alternative
Use SQLite :memory: for unit tests. Reserve real DB for integration.

### Refactoring Strategy
1. Configure .env.testing with sqlite :memory:. 2. Migrations in setUp. 3. Verify speed.

### Detection Checklist
- [ ] SQLite in-memory for unit
- [ ] Migrations run per test
- [ ] Unit tests seconds

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Use in-memory DB for unit tests
- 05-rules.md: Reserve real DB for integration
- 06-skills.md: Optimize Test Suite Speed with SQLite
- 07-decision-trees.md: Test Database Strategy

---

## Anti-Pattern 4: Asserting Too Much (Over-Assertion)

### Category
Practice

### Description
Adding assertions for every possible aspect making tests brittle.

### Why It Happens
More assertions = better test fallacy. Full response snapshots.

### Warning Signs
Tests break on every change. Hundreds of assertions per test.

### Why Harmful
Over-assertion makes tests fragile. False negatives.

### Consequences
Brittle suite. Developers waste time fixing tests for unrelated changes.

### Alternative
Assert minimum to verify behavior. Test contracts not implementation.

### Refactoring Strategy
1. Review for unnecessary assertions. 2. Replace exact matches. 3. Document assertion purpose.

### Detection Checklist
- [ ] Minimum assertions
- [ ] Tests survive UI changes
- [ ] Behavior tested not implementation

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Assert minimum to verify behavior
- 05-rules.md: Test contracts not details
- 06-skills.md: Write Focused Non-Brittle Assertions
- 07-decision-trees.md: Test Granularity Decision

---

## Anti-Pattern 5: No Test Naming Convention

### Category
Structure

### Description
Inconsistent test method names making failure causes unclear.

### Why It Happens
No team convention. Naming considered personal preference.

### Warning Signs
Names like test1, testFunction, it_works. Need to read code to understand.

### Why Harmful
When a test fails the name should describe the failure.

### Consequences
Each failure requires reading code. CI output not actionable.

### Alternative
Adopt naming convention: test_method_scenario_expected or Given-When-Then.

### Refactoring Strategy
1. Define convention. 2. Rename existing tests. 3. Enforce in review.

### Detection Checklist
- [ ] Naming convention defined
- [ ] All tests follow it
- [ ] Failures self-documenting

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Adopt consistent naming
- 05-rules.md: Names must describe scenario and expectation
- 06-skills.md: Establish Test Naming Conventions
- 07-decision-trees.md: Test Organization Decision

---
