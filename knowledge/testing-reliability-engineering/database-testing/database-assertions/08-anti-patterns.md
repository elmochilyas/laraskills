# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Database Testing |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Full Database Seeding in Every Test | Performance | High |
| 2 | Not Testing Database Constraints | Practice | High |
| 3 | Query Counts Not Asserted | Performance | Medium |
| 4 | Not Testing Migration Rollbacks | Practice | Medium |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Full Database Seeding in Every Test

### Category
Performance

### Description
Running full seeders before every test when only subset needed.

### Why It Happens
DatabaseSeeder is default. Convenience over precision.

### Warning Signs
Suite >1 min in seeding. Hundreds of rows but only few used.

### Why Harmful
Full seeding is O(n). Adds seconds per test.

### Consequences
Slow feedback loop. CI bottleneck.

### Alternative
Use factories with specific states per test.

### Refactoring Strategy
1. Replace full seeders with targeted factories. 2. Extract shared setups.

### Detection Checklist
- [ ] No full seeder in unit/feature
- [ ] Factories create only needed data
- [ ] Suite under 30s

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Use targeted factories not full seeders
- 06-skills.md: Use Factories for Efficient Test Data
- 07-decision-trees.md: Test Data Strategy

---

## Anti-Pattern 2: Not Testing Database Constraints

### Category
Practice

### Description
Relying solely on DB to enforce constraints without testing app error handling.

### Why It Happens
DB enforces it assumption. Error handling paths untested.

### Warning Signs
Unique violations cause 500s instead of user-friendly messages.

### Why Harmful
Constraints are safety net. App should handle violations gracefully.

### Consequences
500 errors on violations. Poor UX.

### Alternative
Write tests triggering each constraint and asserting graceful handling.

### Refactoring Strategy
1. List constraints. 2. Write test per violation. 3. Assert status/message.

### Detection Checklist
- [ ] Unique violations tested
- [ ] Foreign key tested
- [ ] Graceful handling verified

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Test each constraint violation
- 05-rules.md: Verify graceful error handling
- 06-skills.md: Test Database Constraint Handling
- 07-decision-trees.md: DB Constraint Coverage

---

## Anti-Pattern 3: Query Counts Not Asserted

### Category
Performance

### Description
Not asserting query count allowing N+1 regressions.

### Why It Happens
No tracking. Developers unaware of assertQueryCount().

### Warning Signs
N+1 in production not tests. No count assertions in PRs.

### Why Harmful
N+1 is a common perf bug invisible to testing.

### Consequences
Regressions reach production. Each N+1 adds seconds.

### Alternative
Assert query count per endpoint.

### Refactoring Strategy
1. Enable query log. 2. Assert count after endpoint. 3. CI fails on regression.

### Detection Checklist
- [ ] Query count assertions
- [ ] N+1 detectable
- [ ] CI fails on regression

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Assert query count on data endpoints
- 05-rules.md: CI fails on N+1
- 06-skills.md: Assert and Prevent N+1 Queries
- 07-decision-trees.md: Query Performance Test Decision

---

## Anti-Pattern 4: Not Testing Migration Rollbacks

### Category
Practice

### Description
Testing only forward migration without verifying rollback restores schema.

### Why It Happens
Rollbacks are emergency only. It will work assumption.

### Warning Signs
Rollback fails during deployment emergency.

### Why Harmful
If migrations cannot roll back you cannot undo bad deployment.

### Consequences
Failed rollback. Extended downtime. Manual schema recovery.

### Alternative
Write tests running up then down asserting schema restored.

### Refactoring Strategy
1. Run up and assert schema. 2. Run down and assert removed.

### Detection Checklist
- [ ] Migration up tested
- [ ] Migration down tested
- [ ] Schema verified after each

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Test both migration directions
- 05-rules.md: Verify schema after each
- 06-skills.md: Test Migration Rollback Safety
- 07-decision-trees.md: Migration Test Strategy

---
