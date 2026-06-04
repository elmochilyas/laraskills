# ECC Anti-Patterns — Fuse/Circuit Breaker Pattern

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 04-resilience |
| **Knowledge Unit** | Fuse/Circuit Breaker Pattern |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. Lifetime Failure Count Instead of Sliding Window
2. No Half-Open Probing
3. In-Memory State in Multi-Server Deployments
4. Aggressive Thresholds (False Trips on Normal Variability)
5. No State Transition Event Listeners

## Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

## Anti-Pattern 1: Lifetime Failure Count Instead of Sliding Window

### Category
Reliability

### Description
Using an ever-accumulating failure counter that never resets. The circuit eventually trips on aged failures unrelated to current health.

### Why It Happens
`private int $failureCount = 0; $failureCount++` is the simplest counter implementation.

### Warning Signs
- `$failureCount` never resets
- Circuit breaker trips after weeks of normal operation
- Trip cause traced to failures from months ago

### Why It Is Harmful
A service had 4 failures 6 months ago due to a deployment issue. The failure count accumulated. Today, one timeout brings the count to 5. The circuit opens. The service is healthy — it hasn't had an issue in 6 months. But the lifetime count tripped the breaker on a single transient blip.

### Preferred Alternative
Use a sliding time window (e.g., failures in the last 60 seconds).

### Refactoring Strategy
1. Store failure timestamps in a list
2. Filter timestamps within the window
3. Count only recent failures
4. Use Redis sorted set for efficient sliding window

### Related Rules
Use Sliding Window Failure Counting (05-rules.md)

### Related Skills
Use Laravel Fuse for Circuit Breaking Persisted Across Processes (06-skills.md)

### Related Decision Trees
Circuit Breaker Threshold Configuration (07-decision-trees.md)

---

## Anti-Pattern 2: No Half-Open Probing

### Category
Reliability

### Description
Circuit opens and stays open until manual operator intervention. No automatic recovery testing.

### Why It Happens
Developers don't implement the half-open state. They assume manual reset is sufficient.

### Warning Signs
- Circuit stays open after upstream recovers
- Manual `php artisan circuit:reset stripe` is the only recovery method
- Extended downtime after upstream recovery

### Why It Is Harmful
Upstream API recovers at 2:00 AM. Circuit is still open. All requests are rejected. No operator is awake to reset. The service is down for 6 hours until the morning shift notices and resets the circuit. Users see errors for 6 hours after the upstream was actually healthy.

### Preferred Alternative
Implement half-open state with automatic probe requests after cooldown.

### Refactoring Strategy
1. Configure cooldown period (e.g., 30 seconds)
2. After cooldown, allow one probe request
3. On probe success, close circuit
4. On probe failure, restart cooldown

### Related Rules
Implement Half-Open with Probe Requests (05-rules.md)

### Related Decision Trees
Half-Open Probe Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: In-Memory State in Multi-Server Deployments

### Category
Scalability

### Description
Storing circuit breaker state in PHP process memory. Each server has independent state.

### Why It Happens
In-memory is the simplest implementation. Works fine in single-server development.

### Warning Signs
- `private string $state = 'closed'` in circuit breaker class
- Inconsistent behavior across servers
- Some servers fail fast, some wait for timeout

### Why It Is Harmful
Server A detects Stripe timeout, opens circuit. Server B hasn't seen any failures (circuit closed). Server B continues sending requests to Stripe. All Server B requests time out (30s). Users on Server A see fast degraded responses. Users on Server B see slow errors. Half of traffic is affected, half is not.

### Preferred Alternative
Store circuit breaker state in Redis.

### Refactoring Strategy
1. Move state to `Cache::store('redis')->get('circuit:stripe:state')`
2. Use atomic operations for state transitions
3. Ensure all workers read from shared state

### Related Rules
Store State in Shared Cache for Multi-Server (05-rules.md)

---

## Anti-Pattern 4: Aggressive Thresholds (False Trips on Normal Variability)

### Category
Reliability

### Description
Setting circuit breaker thresholds too low. The circuit trips on normal traffic variability.

### Why It Happens
Developers set thresholds based on "perfect" conditions. They don't account for normal latency spikes.

### Warning Signs
- Circuit opens multiple times per day
- Threshold less than 3 consecutive failures
- Cooldown less than 10 seconds

### Why It Is Harmful
Threshold = 2 failures, cooldown = 5 seconds. A normal blip causes 2 timeouts in a row. Circuit opens. 5 seconds later, probe succeeds. Circuit closes. 30 seconds later, another blip causes 2 timeouts. Circuit opens again. The circuit is open 20% of the time for a service that's 99.9% healthy.

### Preferred Alternative
Start with conservative thresholds (5 failures, 30s cooldown) and tune down.

### Refactoring Strategy
1. Set threshold to 5 failures in 60s window
2. Set cooldown to 30 seconds
3. Monitor false trip rate
4. Tune down if false trips are rare

### Related Rules
Set Conservative Thresholds Initially (05-rules.md)

---

## Anti-Pattern 5: No State Transition Event Listeners

### Category
Observability

### Description
Circuit breaker changes state without firing events or logging. State transitions are invisible.

### Why It Happens
The circuit breaker is treated as an internal implementation detail. Observability is an afterthought.

### Warning Signs
- No event listeners for circuit state changes
- State transitions not visible in logs
- Degradation discovered only by user complaints

### Why It Is Harmful
Circuit opens for payment API at 3:00 AM. No event fires. No alert. The morning batch payment processing fails silently. At 9:00 AM, the finance team reports "no payments processed overnight." The post-mortem shows the circuit was open for 6 hours, but no one knew.

### Preferred Alternative
Fire events on all state transitions with logging and alerting.

### Refactoring Strategy
1. Add event dispatching on state transitions
2. Register listeners for logging
3. Register listeners for alerting (especially Closed→Open)
4. Add state metrics to monitoring dashboard

### Related Rules
Log Every State Transition (05-rules.md)

### Related Decision Trees
State Transition Monitoring Strategy (07-decision-trees.md)
