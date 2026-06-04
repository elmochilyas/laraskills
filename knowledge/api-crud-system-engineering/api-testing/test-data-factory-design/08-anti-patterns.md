# Test Data Factory Design: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Test Data Factory Design |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Inlined Overrides Everywhere** — Using `->create(['status' => 'published'])` instead of named states
2. **Factory-as-Seeder** — Using factories in production seeders
3. **No Edge Case States** — Only defining the "happy path" factory state
4. **Circular Relationship Definitions** — Factory A creates Model B which creates Model A
5. **Overuse of `create()`** — Using `create()` when `make()` suffices

## Repository-Wide Anti-Patterns

- Using `factory()->create()` inside loops instead of `factory()->count(N)->create()`
- Defining factories with hardcoded values instead of `fake()`
- Not refreshing database between tests
- Forgetting unique constraints (`fake()->unique()`)
- Not defining `afterCreating` for expected side effects

---

## 1. Inlined Overrides Everywhere

### Category
Poor Maintainability

### Description
Using inline `->create(['field' => 'value'])` instead of defining named factory states. The same override values are duplicated across many tests.

### Why It Happens
Quick and easy — the developer needs one specific value for a test and adds it inline. Over time, the same inline override appears in 20+ tests.

### Warning Signs
- Same `['status' => 'published']` appears in many tests
- No `published()` state defined in the factory
- Changing a state's value requires updating 20+ test files
- Tests are hard to read — inline overrides obscure the test's intent
- No factory states directory or organization

### Why Harmful
Duplication makes maintenance expensive. Changing a state's default requires finding and updating all inline overrides. Tests are harder to read — the reader must parse the override to understand the scenario.

### Real-World Consequences
The business renames "published" to "active" in the codebase. A developer must find and update 47 inline `['status' => 'published']` overrides across 30 test files. They miss 3, which now create posts with "published" status that the application treats as invalid.

### Preferred Alternative
Define named factory states for common scenarios. Use `PostFactory::new()->published()->create()` instead of inline overrides.

### Refactoring Strategy
1. Identify the most common inline override patterns
2. Add named states to the factory for each
3. Replace inline overrides with state calls
4. Add tests for each state
5. Add coding standard requiring named states for common scenarios

### Detection Checklist
- [ ] Same inline override in multiple tests
- [ ] No named states for common scenarios
- [ ] Changing a value requires editing many files
- [ ] Inline overrides obscure test intent

### Related Rules/Skills/Trees
- Rule: API-TEST-002 (Named Factory States)
- Skill: test-data-factory-design
- Tree: test-maintainability

---

## 2. Factory-as-Seeder

### Category
Misuse

### Description
Using model factories in production database seeders. Factories use randomized data (`fake()`), but seeders need deterministic, predictable data.

### Why It Happens
Convenience — "we already have factories, let's reuse them for seeding." The developer doesn't distinguish between test data and seed data.

### Warning Signs
- `DatabaseSeeder.php` calls factory classes
- Production seeding produces random data each run
- Seed data changes between environments
- Acceptance tests fail because seed data differs between runs
- `fake()` calls in seed files

### Why Harmful
Production seed data is non-deterministic. Different environments get different data. Demo systems show different content each deployment. Tests that depend on seed data are unreliable.

### Real-World Consequences
A staging environment is re-seeded weekly. Each time, `UserFactory::new()->count(10)->create()` generates 10 random users. An acceptance test that expects a specific user to exist fails on the third week because the random data is different.

### Preferred Alternative
Create explicit, deterministic seeders with fixed data. Use factories only in tests.

### Refactoring Strategy
1. Create seeders with explicit, fixed data arrays
2. Remove factory calls from seeders
3. Use artisan commands for repeatable seeding
4. Document the difference between seeders and factories
5. Add CI check preventing factory calls in seed files

### Detection Checklist
- [ ] Factory calls in seeders
- [ ] Seed data changes between runs
- [ ] `fake()` in seeder files
- [ ] Tests depend on non-deterministic seed data
- [ ] Demo environments have different data

### Related Rules/Skills/Trees
- Rule: API-TEST-003 (Factories for Tests Only)
- Skill: test-data-factory-design
- Tree: test-organization

---

## 3. No Edge Case States

### Category
Test Coverage Gap

### Description
Only defining factory states for the "happy path" — active, published, verified. Missing states for null values, empty strings, boundary values, and error scenarios.

### Why It Happens
Developers create factories for the common cases during test setup. Edge case states are created ad-hoc in individual tests.

### Warning Signs
- No `nullField()`, `emptyString()`, or `boundaryValue()` states
- Edge case data defined inline in tests via `->create(['field' => null])`
- Tests that need edge case data have complex inline setup
- Factory definition doesn't cover null defaults
- Edge cases are harder to test than happy paths

### Why Harmful
Edge case scenarios are harder to write, so they're written less often. Code paths that handle nulls, empties, and boundaries are undertested.

### Real-World Consequences
A `published_at` field is nullable in the database but the factory always sets it. A controller path that checks `if ($post->published_at)` works in all tests. In production, a null `published_at` causes a `TypeError`. The bug was not caught because the factory never produced null `published_at`.

### Preferred Alternative
Define factory states for edge cases: null values, empty strings, boundary values, and error conditions.

### Refactoring Strategy
1. Audit model fields for nullable, boundary, and edge cases
2. Add factory states for each edge case
3. Add tests that use edge case states
4. Ensure factory `definition()` covers null defaults
5. Document edge case states in the factory

### Detection Checklist
- [ ] No null/empty/boundary factory states
- [ ] Edge cases set up inline in tests
- [ ] Nullable fields always have values in tests
- [ ] Edge case paths undertested

### Related Rules/Skills/Trees
- Rule: API-TEST-004 (Edge Case Coverage)
- Skill: test-data-factory-design
- Tree: test-coverage

---

## 4. Circular Relationship Definitions

### Category
Infinite Recursion

### Description
Factory A creates Model B, which creates Model A, which creates Model B — infinite recursion during factory execution.

### Why It Happens
Both models are defined with `belongsTo` relationships that auto-create the parent. `PostFactory` creates a `UserFactory` which creates a `PostFactory` (through `afterCreating` or relationship auto-creation).

### Warning Signs
- `factory()->create()` times out or hits memory limit
- Infinite recursion in factory execution
- `afterCreating` callback in one factory triggers another factory
- Both sides of a relationship have auto-creation
- Stack trace shows repeated factory calls

### Why Harmful
Tests fail with cryptic errors (timeout, memory exhaustion). Developers waste time debugging factory recursion.

### Real-World Consequences
A developer adds `User::factory()` to `PostFactory`'s `afterCreating`. `UserFactory`'s `afterCreating` already creates posts. Running `Post::factory()->create()` causes infinite recursion. The test suite hangs.

### Preferred Alternative
Control relationship creation explicitly in tests. Use lazy loading or `for()` to avoid circular creation.

### Refactoring Strategy
1. Identify circular factory relationships
2. Remove auto-creation from one side of the relationship
3. Use explicit relationship setup in tests (`for($user)` instead of auto-create)
4. Add tests verifying factory creation works
5. Monitor factory execution for recursion

### Detection Checklist
- [ ] Factory creation causes recursion
- [ ] Both sides of relationship auto-create
- [ ] `afterCreating` triggers circular factory calls
- [ ] Tests timeout or hit memory limits

### Related Rules/Skills/Trees
- Rule: API-TEST-005 (Non-Circular Factories)
- Skill: model-factory-relationships
- Tree: test-data

---

## 5. Overuse of `create()`

### Category
Performance Waste

### Description
Using `factory()->create()` (persists to database) when `factory()->make()` (creates in-memory only) would suffice. Unnecessary database writes slow down the test suite.

### Why It Happens
Developers default to `create()` because it's the most well-known method. They don't consider whether database persistence is actually needed.

### Warning Signs
- `create()` used for data that's only read, never written back
- Test creates records but only uses them for attribute values
- No database assertions on created records
- Test suite slow due to excessive database writes
- `make()` suffices but `create()` is used

### Why Harmful
Each `create()` call adds 5-50ms of database write time. With hundreds of tests, this adds up to minutes of unnecessary test execution time.

### Real-World Consequences
A test suite with 500 tests uses `create()` for every factory call. Each test creates 5 records on average. That's 2500 unnecessary database writes. The test suite takes 4 minutes instead of 1 minute if `make()` were used where appropriate.

### Preferred Alternative
Use `make()` when you only need model attributes. Use `create()` only when database persistence is required (relationships, queries, database assertions).

### Refactoring Strategy
1. Audit factory calls: identify where `make()` suffices
2. Replace `create()` with `make()` for data-only usage
3. Keep `create()` for tests that query or assert on the database
4. Add a coding standard guideline for factory method selection
5. Measure test suite speed improvement

### Detection Checklist
- [ ] `create()` used for attribute-only data
- [ ] No database assertions on created records
- [ ] `make()` would work but `create()` is used
- [ ] Test suite slower than expected
- [ ] No guideline for factory method selection

### Related Rules/Skills/Trees
- Rule: API-TEST-006 (Minimal Database Writes)
- Skill: test-data-factory-design
- Tree: test-performance
