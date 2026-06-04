# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Resilience & Chaos Engineering |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | No Chaos Experiments Defined | Practice | Critical |
| 2 | No Degraded Mode Testing | Practice | High |
| 3 | Resilience Tests Not in CI | CI | High |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: No Chaos Experiments Defined

### Category
Practice

### Description
Never running chaos experiments to verify resilience.

### Why It Happens
System should handle failures without verification. Fear of breaking things.

### Warning Signs
Resilience features exist but untested. Circuit breakers never triggered.

### Why Harmful
Resilience code is untested and may not work when needed.

### Consequences
Features fail during real failure. Downtime longer.

### Alternative
Define experiments: kill service, add latency, exhaust resources.

### Refactoring Strategy
1. List features. 2. Design experiment per feature. 3. Run in staging.

### Detection Checklist
- [ ] Experiments defined
- [ ] Staging running
- [ ] Circuit breakers tested

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Test resilience with chaos experiments
- 05-rules.md: Run staging first
- 06-skills.md: Design Chaos Engineering Experiments
- 07-decision-trees.md: Chaos Experiment Prioritization

---

## Anti-Pattern 2: No Degraded Mode Testing

### Category
Practice

### Description
Not testing behavior when dependency is unavailable.

### Why It Happens
Dependencies always available assumption.

### Warning Signs
App crashes 500 when Redis down. No graceful fallback.

### Why Harmful
Non-critical dependency failure causes total outage.

### Consequences
Full outage from cache failure. Cascading failures.

### Alternative
Test each dependency offline. Verify graceful degradation.

### Refactoring Strategy
1. Identify dependencies. 2. Define degraded behavior. 3. Test offline.

### Detection Checklist
- [ ] Degraded modes defined
- [ ] Tested offline
- [ ] Fallback works

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Test under dependency failure
- 05-rules.md: Implement graceful degradation
- 06-skills.md: Design and Test Degraded Mode
- 07-decision-trees.md: Resilience Strategy

---

## Anti-Pattern 3: Resilience Tests Not in CI

### Category
CI

### Description
Running resilience tests only manually or not at all.

### Why It Happens
Hard to automate. Chaos is destructive.

### Warning Signs
Not in CI. Verified only after incidents.

### Why Harmful
Changes break resilience without detection.

### Consequences
Resilience debt accumulates.

### Alternative
Unit-level resilience tests in CI. Nightly chaos suite.

### Refactoring Strategy
1. Extract logic to units. 2. Write tests. 3. Nightly integration.

### Detection Checklist
- [ ] Unit resilience in CI
- [ ] Breaker logic tested
- [ ] Nightly chaos suite

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Add resilience tests to CI
- 05-rules.md: Test failure logic at unit level
- 06-skills.md: Automate Resilience Tests in CI
- 07-decision-trees.md: Resilience Test Automation

---
