# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Test Data Management |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Test Data Not Isolated Between Runs | Practice | Critical |
| 2 | Using Production-Like Data for Unit Tests | Practice | High |
| 3 | Hardcoded Test Data IDs in Assertions | Practice | Medium |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Test Data Not Isolated Between Runs

### Category
Practice

### Description
Test data persisting across runs causing interference.

### Why It Happens
Not using transactions or database refresh.

### Warning Signs
Second run fails. Data accumulating. Order matters.

### Why Harmful
Non-deterministic results. CI failures on re-run.

### Consequences
False positives/negatives. Developer distrust.

### Alternative
Use DatabaseTransactions or RefreshDatabase trait.

### Refactoring Strategy
1. Add transaction trait. 2. Ensure rollback between tests. 3. Verify isolation.

### Detection Checklist
- [ ] Data isolated per test
- [ ] Rollback/refresh active
- [ ] Order-independent

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Isolate test data per run
- 05-rules.md: Use transactions for cleanup
- 06-skills.md: Design Isolated Test Data Strategies
- 07-decision-trees.md: Test Data Isolation Decision

---

## Anti-Pattern 2: Using Production-Like Data for Unit Tests

### Category
Practice

### Description
Using large production-like datasets in unit tests slowing them.

### Why It Happens
Realistic is better. Same data as integration.

### Warning Signs
Tests slow. Factory creates large nested relations.

### Why Harmful
Unit tests should be fast. Large data expands suite time.

### Consequences
Slow suite. Less frequent runs.

### Alternative
Minimal dataset per test. Create only needed records.

### Refactoring Strategy
1. Reduce factory states. 2. Create only required relations.

### Detection Checklist
- [ ] Minimal data per test
- [ ] Factories create only needed
- [ ] Fast unit tests

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Minimal data for unit tests
- 05-rules.md: Reserve large data for integration
- 06-skills.md: Create Minimal Test Data Sets
- 07-decision-trees.md: Test Data Sizing Decision

---

## Anti-Pattern 3: Hardcoded Test Data IDs in Assertions

### Category
Practice

### Description
Hardcoding database IDs in test assertions making tests brittle.

### Why It Happens
Convenience. Copying from seed data.

### Warning Signs
Assertions reference id=1. Fails when run order changes.

### Why Harmful
IDs change when seed data changes.

### Consequences
Brittle tests requiring constant ID updates.

### Alternative
Capture IDs from created records. Use fixtures by reference.

### Refactoring Strategy
1. Replace hardcoded IDs with dynamic references.

### Detection Checklist
- [ ] No hardcoded IDs
- [ ] Dynamic references used
- [ ] Seed changes do not break tests

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Never hardcode database IDs
- 05-rules.md: Capture IDs from created records
- 06-skills.md: Design Dynamic Test Data References
- 07-decision-trees.md: Test Data ID Strategy

---
