# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Performance & Load Testing |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Load Testing Without Baseline Metrics | Methodology | Critical |
| 2 | Single-URL Load Tests Not Reflecting User Behavior | Methodology | High |
| 3 | Not Monitoring Server Resources During Load Test | Methodology | High |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Load Testing Without Baseline Metrics

### Category
Methodology

### Description
Running load tests without establishing baseline metrics.

### Why It Happens
Just see if it handles load. No pre-test metrics.

### Warning Signs
Results without context. No historical comparison.

### Why Harmful
Without baselines every test is isolated data point.

### Consequences
Regressions undetected. Capacity planning guesswork.

### Alternative
Establish baseline before testing. Compare against it.

### Refactoring Strategy
1. Define key metrics. 2. Run baseline. 3. Record for comparison.

### Detection Checklist
- [ ] Baseline metrics captured
- [ ] Historical data stored
- [ ] Regressions detectable

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Establish baselines before load testing
- 05-rules.md: Store historical results
- 06-skills.md: Establish Performance Baselines
- 07-decision-trees.md: Load Testing Methodology

---

## Anti-Pattern 2: Single-URL Load Tests Not Reflecting User Behavior

### Category
Methodology

### Description
Testing single URL not representing real browsing patterns.

### Why It Happens
Simple to set up. One command test.

### Warning Signs
Only homepage tested. No login or varied paths.

### Why Harmful
Misses caching effects, session state, varying resource intensity.

### Consequences
Results do not predict production behavior.

### Alternative
Record and replay real user flows. Include login, CRUD.

### Refactoring Strategy
1. Identify 3-5 flows. 2. Create scripts. 3. Weight by frequency.

### Detection Checklist
- [ ] Multiple flows in test
- [ ] Realistic distribution
- [ ] Auth included

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Load test must reflect real flows
- 05-rules.md: Include varied paths
- 06-skills.md: Design Realistic Load Test Scenarios
- 07-decision-trees.md: Load Test Scenario Design

---

## Anti-Pattern 3: Not Monitoring Server Resources During Load Test

### Category
Methodology

### Description
Running load tests without CPU, memory, I/O monitoring.

### Why It Happens
Focus on response time. Metrics infrastructure teams job.

### Warning Signs
Latency increase but no resource data to explain.

### Why Harmful
See symptoms but not causes (CPU 100%, swapping).

### Consequences
Incorrect optimization targets.

### Alternative
Monitor resources during test. Correlate with latency.

### Refactoring Strategy
1. Configure monitoring. 2. Record alongside latency. 3. Identify bottleneck.

### Detection Checklist
- [ ] Resource monitoring active
- [ ] CPU/memory/I/O tracked
- [ ] Bottleneck identified

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Monitor resources during load tests
- 05-rules.md: Correlate with latency
- 06-skills.md: Analyze Resources During Load Testing
- 07-decision-trees.md: Load Test Analysis Strategy

---
