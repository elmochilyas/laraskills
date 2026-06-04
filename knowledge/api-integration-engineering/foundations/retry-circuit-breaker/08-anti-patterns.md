# ECC Anti-Patterns — Retry & Circuit Breaker

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 01-foundations |
| **Knowledge Unit** | Retry & Circuit Breaker |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Retrying When Circuit Breaker Is Open
2. Counting 4xx Errors (Including 429) as Circuit Breaker Failures
3. No Half-Open Probes for Automatic Recovery
4. File/In-Memory Circuit State in Multi-Worker Deployments
5. No Circuit Breaker at All — Retry-Only Pattern

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Overengineering

---

## Anti-Pattern 1: Retrying When Circuit Breaker Is Open

### Category
Reliability | Scalability

### Description
Configuring retry logic that executes regardless of circuit breaker state. When the circuit is open (service considered down), retry attempts still fire, wasting resources.

### Why It Happens
Retry and circuit breaker are implemented independently. Retry middleware doesn't check circuit state, and circuit breaker doesn't intercept retry logic.

### Warning Signs
- Retry attempts logged even when circuit breaker shows Open
- Downstream service receives requests during outage (from your retries)
- Circuit breaker opens but retry traffic continues

### Why It Is Harmful
An open circuit means the upstream is considered unavailable. Retrying guaranteed failures wastes connections, CPU, and time. It also prevents the upstream from recovering by adding load during its outage.

### Real-World Consequences
Stripe API is down. Circuit breaker opens after 5 failures. Retry middleware (3 attempts) fires 3 × 20 workers = 60 requests to a dead service. Stripe sees load during their outage, delaying recovery.

### Preferred Alternative
Check circuit breaker state before attempting retry. If open, fail fast or use fallback.

### Refactoring Strategy
1. Add circuit state check before retry middleware
2. Implement retry-skip when circuit is Open
3. Allow single probe request only during Half-Open state
4. Use fallback response (cache, default value) for Open state

### Detection Checklist
- [ ] Retry attempts continue during circuit Open state
- [ ] Retry and circuit breaker are independent
- [ ] No circuit state check before retry

### Related Rules
Stop Retry When Circuit Breaker Is Open (05-rules.md)

### Related Skills
Implement Retry and Circuit Breaker Patterns for Resilient API Calls (06-skills.md)

### Related Decision Trees
Retry vs Circuit Breaker Coordination (07-decision-trees.md)

---

## Anti-Pattern 2: Counting 4xx Errors (Including 429) as Circuit Breaker Failures

### Category
Reliability | Architecture

### Description
Counting all HTTP error responses (including 4xx client errors and 429 rate limits) as failures in the circuit breaker threshold. The circuit opens unnecessarily.

### Why It Happens
Simplest implementation: `$response->failed() → recordFailure()`. No classification of failure types.

### Warning Signs
- Circuit breaker opens during normal operation
- Circuit state correlates with 4xx rates (not 5xx)
- Rate-limited periods cause circuit to open

### Why It Is Harmful
A 401 (unauthorized) or 404 (not found) is not a server outage — retrying won't help. A 429 (rate limited) should be handled by the rate limiter, not by stopping all requests. Counting these as circuit failures opens the circuit on non-outage events, causing unnecessary failover.

### Real-World Consequences
A configuration change causes 401 responses for 2 minutes. Circuit breaker counts all 401s as failures and opens. Even after the config is fixed, the circuit stays open for the reset timeout (60s). Integration is down for 62 seconds instead of 2 seconds.

### Preferred Alternative
Classify failures: 5xx and network errors trip the circuit breaker; 4xx (except 409) do not.

### Refactoring Strategy
1. Implement failure classification: `$response->serverError() || $response->failed() && !$response->clientError()`
2. Exclude 429 from circuit breaker (handle via rate limiter)
3. Exclude 401/403/404 from failure counting
4. Optionally count 409 as failure for idempotency conflicts

### Detection Checklist
- [ ] All 4xx counted as circuit failures
- [ ] 429 triggers circuit breaker
- [ ] Circuit opens during normal operation (not outages)

### Related Rules
Classify Failures: 5xx Trips Breaker, 4xx Does Not (05-rules.md)

### Related Skills
Implement Retry and Circuit Breaker Patterns for Resilient API Calls (06-skills.md)

### Related Decision Trees
Failure Classification Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: No Half-Open Probes for Automatic Recovery

### Category
Reliability | Maintainability

### Description
Configuring a circuit breaker without automatic half-open probing. When the upstream recovers, the circuit stays open until manual intervention.

### Why It Happens
Developers implement circuit breaker Open state but forget to configure the reset timeout and half-open probe mechanism. Some libraries require explicit configuration for automatic recovery.

### Warning Signs
- Circuit opens and stays open until manual reset
- Integration remains degraded after upstream recovery
- Operator must run Artisan command to reset circuit state

### Why It Is Harmful
Service recovery time = upstream recovery time + operator response time. If the operator is on-call and responds in 15 minutes, that's 15 minutes of unnecessary downtime after the upstream has already recovered.

### Real-World Consequences
Stripe has a 3-minute outage. Circuit breaker opens. Stripe recovers in 3 minutes. Without half-open probes, the circuit stays open. The operator is in a meeting and doesn't notice alerts for 20 minutes. Total downtime: 23 minutes instead of 3.

### Preferred Alternative
Configure half-open probes with a reset timeout. After the timeout, allow a single probe request. If it succeeds, close the circuit.

### Refactoring Strategy
1. Configure reset timeout (e.g., 30 seconds)
2. Implement half-open state that allows single probe request
3. On probe success: close circuit, reset failure count
4. On probe failure: return to Open state, reset timer
5. Use lock protection to prevent thundering herd on probe

### Detection Checklist
- [ ] No half-open probe mechanism
- [ ] Circuit requires manual reset to recover
- [ ] No reset timeout configured

### Related Rules
Implement Half-Open Probes for Automatic Recovery (05-rules.md)

### Related Skills
Implement Retry and Circuit Breaker Patterns for Resilient API Calls (06-skills.md)

### Related Decision Trees
Circuit Breaker State Management (07-decision-trees.md)

---

## Anti-Pattern 4: File/In-Memory Circuit State in Multi-Worker Deployments

### Category
Scalability | Reliability

### Description
Storing circuit breaker state in-memory or in file cache when multiple workers process requests. Each worker has independent circuit state.

### Why It Happens
Default circuit breaker implementations often use in-memory state. The application scales horizontally but the circuit breaker doesn't.

### Warning Signs
- Each worker shows different circuit state for the same service
- Circuit opens but only some requests fail-fast
- 429 rates from upstream don't decrease when circuit should be open

### Why It Is Harmful
Worker A detects failures and opens the circuit. Worker B has no failures in its window and keeps sending requests. The upstream receives traffic from Worker B even though Worker A correctly identified the outage. The circuit breaker's protection is N-1/N effective.

### Real-World Consequences
10 workers are processing API calls. Stripe goes down. 3 workers detect the outage and open the circuit. 7 workers haven't seen enough failures yet and keep sending requests. Stripe receives 70% of normal traffic during the outage.

### Preferred Alternative
Store circuit breaker state in Redis (or other distributed cache) for coordinated state across all workers.

### Refactoring Strategy
1. Replace in-memory circuit state with Redis-backed store
2. Use atomic operations for state transitions (to prevent race conditions)
3. Configure key prefix per service
4. Verify state consistency across workers

### Detection Checklist
- [ ] Circuit state stored in-memory
- [ ] Workers show different circuit states
- [ ] Some traffic still reaches failing upstream during Open state

### Related Rules
Use Redis for Distributed Circuit State (05-rules.md)

### Related Skills
Implement Retry and Circuit Breaker Patterns for Resilient API Calls (06-skills.md)

### Related Decision Trees
Circuit Breaker State Management (07-decision-trees.md)

---

## Anti-Pattern 5: No Circuit Breaker at All — Retry-Only Pattern

### Category
Reliability | Architecture

### Description
Implementing retry logic without any circuit breaker. When the upstream has a persistent outage, the retry mechanism continues hammering the dead service across all workers.

### Why It Happens
Retry is easy to configure (`Http::retry(3, 100)`). Circuit breaker requires additional packages and configuration. The team ships the retry-only pattern and never adds the circuit breaker.

### Warning Signs
- `Http::retry()` or retry middleware configured but no circuit breaker
- Retry storms during upstream outages
- Cascading failures during extended outages

### Why It Is Harmful
During a persistent outage (not transient blip), retry logic amplifies load on the failing service. N workers × M retries = N×M requests to a dead service. This delays recovery, wastes resources, and may trigger origin-level rate limiting.

### Real-World Consequences
Stripe is down for 5 minutes. 20 workers each retry 3 times with 1s delay. Stripe receives 80 requests during the outage instead of the 20 it would have received without retry. Stripe's recovery is delayed. All workers' retry budgets are exhausted, so no requests succeed on recovery either.

### Preferred Alternative
Implement circuit breaker alongside retry. Retry handles transient blips; circuit breaker stops retry during persistent outages.

### Refactoring Strategy
1. Install a circuit breaker package (Fuse, algoyounes/circuit-breaker)
2. Configure threshold: 5 failures in 60s window opens circuit
3. Configure reset timeout: 30s before half-open probe
4. Integrate circuit check into HTTP middleware
5. Wire circuit state to Redis for multi-worker coordination

### Detection Checklist
- [ ] Retry configured but no circuit breaker
- [ ] Retry storms during outages
- [ ] No fail-fast mechanism for dead services

### Related Rules
Stop Retry When Circuit Breaker Is Open (05-rules.md)

### Related Skills
Implement Retry and Circuit Breaker Patterns for Resilient API Calls (06-skills.md)

### Related Decision Trees
Retry vs Circuit Breaker Coordination (07-decision-trees.md)
