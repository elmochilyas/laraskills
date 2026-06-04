# Anti-Patterns: Standardized Knowledge: FPM Process Manager Modes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP-FPM Process & Worker Management |
| Knowledge Unit | Standardized Knowledge: FPM Process Manager Modes |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | pm.max_children Set Arbitrarily Without Calculation | Configuration | Critical |
| 2 | Using Dynamic Process Manager for Consistent Workloads | Configuration | Medium |
| 3 | pm.max_requests Too High - Memory Drift Unchecked | Configuration | High |
| 4 | pm.min_spare_servers Too Low Causing Cold Requests | Configuration | Medium |
| 5 | Ignoring pm.status_page in Production | Operations | Medium |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: pm.max_children Set Arbitrarily Without Calculation

### Category
Configuration

### Description
Setting pm.max_children to an arbitrary number without calculating based on per-worker RSS and available memory.

### Why It Happens
Developers guess or copy values from tutorials without measuring RSS.

### Warning Signs
502/504 errors under load. Swap usage increasing. pm.max_children set without calculation.

### Why Harmful
Oversubscription causes swapping, latency spikes, cascading failure.

### Consequences
Server OOM under load. 30-50% throughput loss from misconfiguration.

### Alternative
Calculate: floor((Total RAM - overhead) / Peak per-worker RSS). Monitor and adjust.

### Refactoring Strategy
1. Measure per-worker RSS at peak. 2. Calculate with 20% headroom. 3. Monitor weekly.

### Detection Checklist
- [ ] Calculated from RSS data
- [ ] No swap under load
- [ ] pm.status_page shows no max_children reached

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: FPM Process Manager Modes
- 05-rules.md: Calculate max_children from measured RSS
- 05-rules.md: Monitor status page
- 06-skills.md: Size PHP-FPM Worker Pool for Server Capacity
- 07-decision-trees.md: Pool Sizing Decision Tree

---

## Anti-Pattern 2: Using Dynamic Process Manager for Consistent Workloads

### Category
Configuration

### Description
Using pm=dynamic on servers with stable traffic, adding unnecessary spawn/kill overhead.

### Why It Happens
Default mode. Teams do not analyze traffic patterns before selecting pm mode.

### Warning Signs
Status page shows frequent spawning. Stable traffic but pm count fluctuating.

### Why Harmful
Process spawning adds 10-20ms latency per new worker. Unnecessary CPU overhead.

### Consequences
5-15% throughput loss from spawn/kill overhead.

### Alternative
Use ondemand for low/spiky traffic. Use static for consistent traffic.

### Refactoring Strategy
1. Analyze traffic over 7 days. 2. If consistent use static. 3. If spiky use ondemand.

### Detection Checklist
- [ ] pm mode matches traffic pattern
- [ ] No excessive spawn events
- [ ] Process count stable

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: FPM Process Manager Modes
- 05-rules.md: Match pm mode to traffic pattern
- 05-rules.md: Prefer static for consistent traffic
- 06-skills.md: Select PHP-FPM Process Manager Mode
- 07-decision-trees.md: pm Mode Selection Decision Tree

---

## Anti-Pattern 3: pm.max_requests Too High - Memory Drift Unchecked

### Category
Configuration

### Description
Setting pm.max_requests very high or 0 allowing worker memory to drift until OOM.

### Why It Happens
More uptime is better thinking. Unawareness of memory accumulation per request.

### Warning Signs
Per-worker RSS increasing over time. Workers consuming 2x+ initial RSS.

### Why Harmful
Memory drift is inevitable. Without recycling, memory grows until OOM.

### Consequences
Gradual degradation. Eventually OOM kills workers causing 502s.

### Alternative
Set pm.max_requests to 500-2000 depending on drift severity.

### Refactoring Strategy
1. Set max_requests=1000 initially. 2. Monitor RSS at restart. 3. Adjust based on drift.

### Detection Checklist
- [ ] max_requests set (not 0)
- [ ] Worker RSS stable
- [ ] No OOM from drift

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: FPM Process Manager Modes
- 05-rules.md: Always set pm.max_requests
- 05-rules.md: Monitor worker RSS drift
- 06-skills.md: Configure pm.max_requests for Memory Drift Control
- 07-decision-trees.md: pm.max_requests Tuning Decision

---

## Anti-Pattern 4: pm.min_spare_servers Too Low Causing Cold Requests

### Category
Configuration

### Description
Setting spare count so low that each new request waits for process spawn.

### Why It Happens
Memory conservation. Assuming spawn is instant.

### Warning Signs
First request after idle is slow. 0 idle processes in status page.

### Why Harmful
Process spawning is 10-50ms. Each new process adds latency and loses cache benefits.

### Consequences
1-2s latency on cold requests. Connection pooling not utilized.

### Alternative
Set spare count to handle baseline traffic without spawning.

### Refactoring Strategy
1. Monitor baseline idle count over 7 days. 2. Set min_spare = baseline + 20%.

### Detection Checklist
- [ ] Idle processes always available
- [ ] No spawn in response path

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: FPM Process Manager Modes
- 05-rules.md: Maintain spare workers for baseline
- 05-rules.md: Avoid spawn on request path
- 06-skills.md: Tune Spare Server Counts for Traffic Baseline
- 07-decision-trees.md: Idle Worker Pool Sizing Decision

---

## Anti-Pattern 5: Ignoring pm.status_page in Production

### Category
Operations

### Description
Not enabling pm.status_page, operating blind on pool health.

### Why It Happens
Defaults to disabled. Not in standard monitoring stack.

### Warning Signs
Issues diagnosed reactively. No historical process data.

### Why Harmful
Without data every decision is guesswork. Root cause analysis impossible.

### Consequences
Configuration drift. Repeated incidents with no data.

### Alternative
Enable pm.status_path and integrate with monitoring.

### Refactoring Strategy
1. Set pm.status_path. 2. Secure behind auth. 3. Configure metrics. 4. Set alerts.

### Detection Checklist
- [ ] pm.status_page enabled
- [ ] Data in monitoring
- [ ] Alerts on max children events

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: FPM Process Manager Modes
- 05-rules.md: Enable pm.status_page in all environments
- 05-rules.md: Monitor pool health
- 06-skills.md: Monitor PHP-FPM with pm.status_page
- 07-decision-trees.md: PHP-FPM Monitoring Strategy

---
