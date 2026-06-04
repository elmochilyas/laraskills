# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Flaky Test Prevention |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Ignoring Flaky Tests Instead of Investigating | Practice | Critical |
| 2 | Time-Dependent Tests Without Time Manipulation | Practice | High |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Ignoring Flaky Tests Instead of Investigating

### Category
Practice

### Description
Re-running flaky tests until they pass instead of fixing root cause.

### Why It Happens
Deadline pressure. It passes eventually.

### Warning Signs
CI re-run used regularly. Known flaky tests not quarantined.

### Why Harmful
Flaky tests erode trust. They stop providing value.

### Consequences
Suite becomes noise. Real failures hidden.

### Alternative
Quarantine immediately. Investigate. Fix or remove.

### Refactoring Strategy
1. Track flaky tests. 2. Quarantine. 3. Investigate. 4. Fix. 5. Re-integrate.

### Detection Checklist
- [ ] Flaky tests tracked
- [ ] Quarantine process
- [ ] Root cause investigated

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Quarantine flaky immediately
- 05-rules.md: Fix or remove before re-integrating
- 06-skills.md: Detect and Resolve Flaky Tests
- 07-decision-trees.md: Flaky Test Management Decision

---

## Anti-Pattern 2: Time-Dependent Tests Without Time Manipulation

### Category
Practice

### Description
Writing tests that depend on current time without using time faking.

### Why It Happens
Time manipulation adds complexity. Carbon::now() in assertions.

### Warning Signs
Tests fail near midnight. DateTime comparisons in assertions.

### Why Harmful
Time-dependent tests are non-deterministic.

### Consequences
Flaky tests depending on time of day.

### Alternative
Use Carbon::setTestNow() or Clock mocking. Fake time in tests.

### Refactoring Strategy
1. Identify time-dependent assertions. 2. Replace with time faking.

### Detection Checklist
- [ ] Time faking used
- [ ] No Carbon::now() in assertions
- [ ] Tests pass any time

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Fake time in time-dependent tests
- 05-rules.md: Never assert on current time
- 06-skills.md: Use Time Manipulation in Tests
- 07-decision-trees.md: Time-Dependent Test Strategy

---
