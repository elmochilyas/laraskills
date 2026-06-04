# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | CI/CD Pipeline |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Slow CI Pipeline Blocking Merges | Operations | High |
| 2 | No Test Result History | Operations | Medium |
| 3 | Not Testing CI Pipeline Itself | Practice | Medium |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Slow CI Pipeline Blocking Merges

### Category
Operations

### Description
CI pipeline >15 min blocking developer velocity.

### Why It Happens
All tests one job. No parallelization. E2E in pre-merge.

### Warning Signs
Build >15 min. Team queues PRs.

### Why Harmful
Slow CI reduces deployment frequency.

### Consequences
Decreased velocity. Larger PRs with more risk.

### Alternative
Parallelize. Split tiers. Optimize slowest jobs.

### Refactoring Strategy
1. Profile pipeline. 2. Parallelize. 3. E2E post-merge. 4. Cache deps.

### Detection Checklist
- [ ] Pipeline <10 min
- [ ] Jobs parallelized
- [ ] E2E in separate tier

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Keep pipeline under 10 min
- 05-rules.md: Parallelize independent jobs
- 06-skills.md: Optimize CI Pipeline Speed
- 07-decision-trees.md: CI Optimization Strategy

---

## Anti-Pattern 2: No Test Result History

### Category
Operations

### Description
Not tracking test results over time missing trends.

### Why It Happens
CI passes/fails binary. No historical storage.

### Warning Signs
Cannot tell if tests slowing. Flakiness trend unknown.

### Why Harmful
Without history test health is invisible.

### Consequences
Degradation gradual and undetected.

### Alternative
Store results with history. Track execution time and flakiness.

### Refactoring Strategy
1. Configure report storage. 2. Track metrics. 3. Alert on flakiness increase.

### Detection Checklist
- [ ] Results stored historically
- [ ] Execution trend tracked
- [ ] Flakiness monitored

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Track suite metrics over time
- 05-rules.md: Alert on regressions
- 06-skills.md: Monitor Test Suite Health Trends
- 07-decision-trees.md: Test Suite Monitoring Strategy

---

## Anti-Pattern 3: Not Testing CI Pipeline Itself

### Category
Practice

### Description
Making CI changes without testing causing broken CI.

### Why It Happens
Infrastructure assumption. It will work.

### Warning Signs
CI config changes frequently break build.

### Why Harmful
Broken CI blocks all development.

### Consequences
CI downtime. Emergency fixes.

### Alternative
Test CI changes on branch before merge. Validate syntax.

### Refactoring Strategy
1. Test in PR. 2. Use local simulation. 3. Validate syntax.

### Detection Checklist
- [ ] CI changes tested on branch
- [ ] Syntax validated
- [ ] No CI breakage

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Test CI changes before merge
- 05-rules.md: Validate syntax
- 06-skills.md: Design Testable CI Pipelines
- 07-decision-trees.md: CI Change Management

---
