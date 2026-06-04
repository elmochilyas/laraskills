# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Browser & E2E Testing |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Slow E2E Tests Running with Every Commit | CI | High |
| 2 | E2E Tests Depending on Specific Data State | Practice | Critical |
| 3 | Not Using Data Attributes for Test Selection | Practice | High |
| 4 | Writing E2E Tests Like Unit Tests | Practice | Medium |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Slow E2E Tests Running with Every Commit

### Category
CI

### Description
Running full E2E suite on every commit becoming bottleneck.

### Why It Happens
All tests must pass mentality. No test tier separation.

### Warning Signs
CI build >30 min. E2E runs on every push.

### Why Harmful
Slow CI blocks development velocity.

### Consequences
CI bottleneck. Merges blocked.

### Alternative
Unit/feature on commit. E2E on merge/main. Smoke tests pre-merge.

### Refactoring Strategy
1. Tier tests. 2. E2E on merge only. 3. Nightly full suite.

### Detection Checklist
- [ ] Test tiers defined
- [ ] E2E on merge/main
- [ ] Pre-merge under 10 min

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Tier tests by speed
- 05-rules.md: Keep pre-merge CI under 10 min
- 06-skills.md: Design Multi-Tier CI Pipeline
- 07-decision-trees.md: CI Test Tiering Decision

---

## Anti-Pattern 2: E2E Tests Depending on Specific Data State

### Category
Practice

### Description
E2E tests assuming specific database content without proper setup.

### Why It Happens
Assuming seed data is static. Not resetting DB.

### Warning Signs
Tests fail mysteriously. Pass locally fail CI.

### Why Harmful
Data-dependent E2E is non-deterministic.

### Consequences
Flaky suite. Developers ignore failures.

### Alternative
Use factories in setUp(). Do not rely on pre-seeded data.

### Refactoring Strategy
1. Remove seed dependency. 2. Create data in setUp. 3. Refresh DB.

### Detection Checklist
- [ ] No seed dependency
- [ ] Test creates own data
- [ ] Deterministic suite

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: E2E tests must create own data
- 05-rules.md: Never depend on pre-seeded records
- 06-skills.md: Design Deterministic E2E Test Data
- 07-decision-trees.md: E2E Test Data Strategy

---

## Anti-Pattern 3: Not Using Data Attributes for Test Selection

### Category
Practice

### Description
Selecting DOM by CSS classes or text making tests brittle.

### Why It Happens
CSS classes visible in DOM. Not knowing data-testid pattern.

### Warning Signs
E2E breaks on CSS refactoring. Complex selectors.

### Why Harmful
CSS changes for styling. Text changes for localization.

### Consequences
Brittle suite. Frontend changes break tests.

### Alternative
Add data-testid attributes. Never rely on CSS or text.

### Refactoring Strategy
1. Add data-testid. 2. Replace CSS selectors. 3. Document convention.

### Detection Checklist
- [ ] data-testid used
- [ ] No CSS selectors in tests
- [ ] Survive refactoring

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Use data-testid for selection
- 05-rules.md: Never select by CSS or text
- 06-skills.md: Implement Robust DOM Selection for E2E
- 07-decision-trees.md: E2E Element Selection Strategy

---

## Anti-Pattern 4: Writing E2E Tests Like Unit Tests

### Category
Practice

### Description
Testing one component in isolation instead of full user flows.

### Why It Happens
Unit testing habits. Testing what you see not what user does.

### Warning Signs
Page-by-page without navigation flows. No multi-step journeys.

### Why Harmful
E2E value is catching cross-component integration. Isolated misses this.

### Consequences
Does not catch real integration bugs.

### Alternative
Test complete user journeys. Each test covers full flow.

### Refactoring Strategy
1. Map key journeys. 2. Write test per journey. 3. Test start to end.

### Detection Checklist
- [ ] E2E covers user journeys
- [ ] Each test completes full flow
- [ ] Cross-page tested

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: E2E tests must test full user flows
- 05-rules.md: Each covers complete journey
- 06-skills.md: Design User-Journey-Focused E2E Tests
- 07-decision-trees.md: E2E Test Scope Decision

---
