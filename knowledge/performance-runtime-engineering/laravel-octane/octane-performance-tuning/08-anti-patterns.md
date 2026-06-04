# Anti-Patterns: Octane Performance Tuning — Sub-50ms Response, Bootstrap Elimination, Optimization Sequence

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane |
| Knowledge Unit | Octane Performance Tuning — Sub-50ms Response, Bootstrap Elimination, Optimization Sequence |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Application State Leaking Across Requests | Architecture | Critical |
| 2 | Not Configuring max_requests for Worker Recycling | Configuration | High |
| 3 | Database Connection Pool Exhaustion | Operations | High |
| 4 | Running Queue Workers Inside Octane | Architecture | Medium |
| 5 | Not Using Octane Table for Cross-Worker State | Design | Medium |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Application State Leaking Across Requests

### Category
Architecture

### Description
Static properties, singletons, facades persisting from one request to the next in Octane.

### Why It Happens
Octane boots app once. Code assumes fresh app per request.

### Warning Signs
Previous request data in next response. User A sees User B data.

### Why Harmful
State leakage causes data privacy violations and non-deterministic behavior.

### Consequences
Data leakage between users. PII exposure. Compliance violations.

### Alternative
Use Octane request lifecycle hooks. Reset state in middleware.

### Refactoring Strategy
1. Audit static state. 2. Register reset in provider. 3. Use singleton false for request-scoped.

### Detection Checklist
- [ ] No static state
- [ ] Container resets per request
- [ ] Concurrent request tests pass

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Octane Performance Tuning — Sub-50ms Response, Bootstrap Elimination, Optimization Sequence
- 05-rules.md: Reset state after each request
- 05-rules.md: Avoid static state in Octane
- 06-skills.md: Prevent Application State Leaks in Octane
- 07-decision-trees.md: State Management Decision Tree

---

## Anti-Pattern 2: Not Configuring max_requests for Worker Recycling

### Category
Configuration

### Description
Leaving workers running indefinitely allowing memory drift to cause OOM.

### Why It Happens
Assumption that Octane workers are leak-proof.

### Warning Signs
Worker memory grows steadily. 502 errors after extended uptime.

### Why Harmful
Even well-written apps have ~0.1-0.5% growth per request. Over 10k this accumulates.

### Consequences
Worker OOM after hours/days. Degradation during restarts.

### Alternative
Set max_requests to 500-2000 based on drift rate.

### Refactoring Strategy
1. Monitor RSS over 10k requests. 2. Calculate safe count. 3. Set via --max-requests.

### Detection Checklist
- [ ] max_requests configured
- [ ] RSS stable before restart
- [ ] No OOM

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Octane Performance Tuning — Sub-50ms Response, Bootstrap Elimination, Optimization Sequence
- 05-rules.md: Configure max_requests for Octane
- 05-rules.md: Monitor memory drift
- 06-skills.md: Tune Octane Worker Recycling
- 07-decision-trees.md: Worker Recycling Decision

---

## Anti-Pattern 3: Database Connection Pool Exhaustion

### Category
Operations

### Description
Octane workers holding connections per-request without returning to pool.

### Why It Happens
Octane reuses container. Default Eloquent does not account for persistent workers.

### Warning Signs
MySQL Too many connections errors. Connection count growing.

### Why Harmful
Each worker can hold multiple connections. N x M exceed DB pool limits.

### Consequences
Connection errors. Application downtime. Restart needed.

### Alternative
Use tick feature to recycle connections. Implement pool middleware.

### Refactoring Strategy
1. Configure DB pool per worker. 2. Release connections after request. 3. Monitor count.

### Detection Checklist
- [ ] Connection count stable
- [ ] No connection errors
- [ ] Released per request

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Octane Performance Tuning — Sub-50ms Response, Bootstrap Elimination, Optimization Sequence
- 05-rules.md: Manage connections per request
- 05-rules.md: Monitor pool usage
- 06-skills.md: Manage Database Connections in Octane
- 07-decision-trees.md: Connection Pool Strategy

---

## Anti-Pattern 4: Running Queue Workers Inside Octane

### Category
Architecture

### Description
Using Octane workers to process queued jobs alongside HTTP requests.

### Why It Happens
Consolidation mindset. Dont want separate queue worker processes.

### Warning Signs
HTTP latency spikes when jobs run. Shared state interference.

### Why Harmful
Jobs compete for CPU/memory. Neither gets optimal resources.

### Consequences
HTTP latency degradation. Job throughput limited by HTTP traffic.

### Alternative
Use dedicated queue workers (Horizon) separate from Octane.

### Refactoring Strategy
1. Remove queue from Octane. 2. Deploy separate workers. 3. Monitor separately.

### Detection Checklist
- [ ] Queue/HTTP separated
- [ ] No jobs in Octane
- [ ] Latency isolation verified

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Octane Performance Tuning — Sub-50ms Response, Bootstrap Elimination, Optimization Sequence
- 05-rules.md: Separate queue from HTTP in Octane
- 05-rules.md: Use dedicated workers
- 06-skills.md: Architect Octane for HTTP-Only Workloads
- 07-decision-trees.md: Workload Isolation Decision

---

## Anti-Pattern 5: Not Using Octane Table for Cross-Worker State

### Category
Design

### Description
Using database or Redis for high-frequency shared state when Swoole Table is faster.

### Why It Happens
Familiarity with DB/Redis. Not knowing Swoole Table exists.

### Warning Signs
High Redis call rate for counters. Lock contention on shared resources.

### Why Harmful
Each external store adds network latency. For high-frequency state this accumulates.

### Consequences
2-5ms added per access. Rate limiting adds up.

### Alternative
Use Swoole Table for per-server state. Reserve Redis for cross-server.

### Refactoring Strategy
1. Identify high-frequency state. 2. Create Swoole Table. 3. Replace external calls.

### Detection Checklist
- [ ] Swoole Table for per-server state
- [ ] External store calls reduced

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Octane Performance Tuning — Sub-50ms Response, Bootstrap Elimination, Optimization Sequence
- 05-rules.md: Use Swoole Table for per-server state
- 05-rules.md: Reserve Redis for cross-server
- 06-skills.md: Implement Cross-Worker State with Swoole Table
- 07-decision-trees.md: Shared State Strategy

---
