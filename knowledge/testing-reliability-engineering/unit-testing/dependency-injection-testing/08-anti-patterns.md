# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Unit Testing |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Unit Tests Hitting the Database | Practice | High |
| 2 | Testing Private/Protected Methods Directly | Practice | Medium |
| 3 | Mocking Everything (Over-Mocking) | Practice | Medium |
| 4 | No Edge Case Tests | Coverage | High |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Unit Tests Hitting the Database

### Category
Practice

### Description
Writing unit tests that actually hit the database making them slow.

### Why It Happens
Misunderstanding unit scope. Using real DB for convenience.

### Warning Signs
Unit tests need DB connection. Take >100ms each.

### Why Harmful
True unit tests must be fast and isolated.

### Consequences
Slow suite (5-10min). DB-dependent CI.

### Alternative
Isolate business logic behind interfaces. Mock data access.

### Refactoring Strategy
1. Extract data access behind interface. 2. Mock in unit. 3. Move DB to feature.

### Detection Checklist
- [ ] No DB in unit tests
- [ ] Data access behind interface
- [ ] Mocks used for deps

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Unit tests must not hit DB
- 05-rules.md: Isolate logic from data access
- 06-skills.md: Isolate Unit Tests from Infrastructure
- 07-decision-trees.md: Unit vs Integration Test Decision

---

## Anti-Pattern 2: Testing Private/Protected Methods Directly

### Category
Practice

### Description
Using reflection to test private methods instead of through public API.

### Why It Happens
Desire for complete coverage. Not trusting public coverage.

### Warning Signs
Tests use ReflectionClass, setIsAccessible.

### Why Harmful
Private methods are implementation details. Tests couple to internals.

### Consequences
Tests break on refactoring. Prevent internal improvements.

### Alternative
Test through public methods. Extract complex private logic to separate class.

### Refactoring Strategy
1. Remove reflection tests. 2. Test through public API. 3. Extract complex logic.

### Detection Checklist
- [ ] No reflection in tests
- [ ] Private logic via public API
- [ ] Complex logic extracted

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Test through public API only
- 05-rules.md: Extract complex logic to testable class
- 06-skills.md: Test Private Logic Through Public API
- 07-decision-trees.md: Test Encapsulation Decision

---

## Anti-Pattern 3: Mocking Everything (Over-Mocking)

### Category
Practice

### Description
Mocking every dependency including value objects creating brittle tests.

### Why It Happens
Real objects = integration test oversimplification.

### Warning Signs
Mocks for DTOs, config objects. Tests break on adding methods.

### Why Harmful
Over-mocking increases maintenance without benefit.

### Consequences
Tests break on interface changes. High maintenance.

### Alternative
Real objects for values. Mocks for I/O boundaries.

### Refactoring Strategy
1. Identify over-mocked objects. 2. Replace with real instances for values.

### Detection Checklist
- [ ] Mocks limited to I/O
- [ ] Value objects real
- [ ] Minimal mock setup

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Mock only external I/O boundaries
- 05-rules.md: Use real for value types
- 06-skills.md: Apply Selective Mocking Strategy
- 07-decision-trees.md: Mock vs Real Object Decision

---

## Anti-Pattern 4: No Edge Case Tests

### Category
Coverage

### Description
Testing only happy path without null, empty, boundary cases.

### Why It Happens
Happy-path simpler. Edge cases considered rare.

### Warning Signs
Null pointers in production. Empty arrays cause unexpected behavior.

### Why Harmful
Edge cases are where most bugs live.

### Consequences
Bugs reach production. Emergency fixes.

### Alternative
Identify edge cases per method. Write test for each.

### Refactoring Strategy
1. List edge cases per method. 2. Write test per case. 3. Use data providers.

### Detection Checklist
- [ ] Null tested
- [ ] Empty tested
- [ ] Boundary values tested
- [ ] Data providers used

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Test edge cases for every method
- 05-rules.md: Use data providers for boundaries
- 06-skills.md: Identify and Cover Edge Cases
- 07-decision-trees.md: Test Coverage Prioritization

---
