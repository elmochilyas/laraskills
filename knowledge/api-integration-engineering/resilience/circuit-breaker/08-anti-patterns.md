# ECC Anti-Patterns — Circuit Breaker

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 04-resilience |
| **Knowledge Unit** | Circuit Breaker |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. Counting 4xx/429 as Circuit Breaker Failures
2. Minimum Requests Too Low (False Trip on First Failure)
3. No Half-Open Probing (Stuck in Open State Forever)
4. In-Memory State in Multi-Server Deployments
5. No State Transition Event Listeners
6. Retry Without Circuit Breaker (Hammering During Outage)

## Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

## Anti-Pattern 1: Counting 4xx/429 as Circuit Breaker Failures

### Category
Reliability

### Description
Treating 4xx client errors and 429 rate limits as circuit breaker failures. The breaker trips on client bugs and rate limits, not on actual outages.

### Why It Happens
Default circuit breaker configuration counts all non-2xx responses as failures. No error classification is configured.

### Warning Signs
- Breaker trips during normal traffic with 401, 403, 404 responses
- Rate limit spikes cause circuit to open
- No error classification logic in failure recording

### Why It Is Harmful
A client sends 5 malformed requests (400 Bad Request). The circuit breaker sees 5 failures. With min_requests = 5, that's 100% failure rate. The breaker opens. Legitimate requests are now blocked because of client-side issues. The service appears down when it's actually healthy.

### Preferred Alternative
Classify failures: 5xx and network errors trip; 4xx and 429 do not.

### Refactoring Strategy
1. Add failure classification before recording
2. Only count: 5xx, connection errors, timeouts
3. Exclude: 4xx (except maybe 409), 429

### Related Rules
Classify Failures Correctly (5xx Trips, 4xx Does Not) (05-rules.md)

### Related Skills
Implement Circuit Breaker Pattern for API Calls (06-skills.md)

### Related Decision Trees
Failure Classification Strategy (07-decision-trees.md)

---

## Anti-Pattern 2: Minimum Requests Too Low (False Trip on First Failure)

### Category
Reliability

### Description
Setting `minRequests` too low (or defaulting to 0). A single failure represents 100% of the sample, tripping the breaker immediately.

### Why It Happens
Developers don't configure `minRequests`. The default is often 1.

### Warning Signs
- Breaker opens on every first connection error
- Single transient blip causes extended outage
- No `minRequests` in configuration

### Why It Is Harmful
A single transient timeout (one request out of thousands) sets the failure rate to 100% because it's 1 out of 1 total requests. The circuit opens. All subsequent requests are blocked. A 100ms blip causes a 30-second outage (reset timeout) for all users.

### Preferred Alternative
Set `minRequests` to 5-10 before evaluating failure rate.

### Refactoring Strategy
1. Configure `minRequests: 10`
2. Configure `failureThreshold: 50` (50% failure rate)
3. Now: 5 failures out of 10 requests = 50% = trip. 1 failure out of 1 = not evaluated.

### Related Rules
Set Minimum Requests Before Evaluating Rate (05-rules.md)

---

## Anti-Pattern 3: No Half-Open Probing (Stuck in Open State Forever)

### Category
Reliability

### Description
Circuit opens and stays open permanently. No automatic probing to test recovery. Requires manual operator intervention to reset.

### Why It Happens
Half-open state requires explicit configuration. Developers don't implement the probe mechanism.

### Warning Signs
- Circuit stays open for hours/days
- Manual reset required after every upstream outage
- No `resetTimeout` or half-open configuration

### Why It Is Harmful
Upstream service recovers after 5 minutes. The circuit is still open from the initial failure. All requests are rejected. Users see errors for hours until an operator notices and manually resets the circuit. The upstream is healthy but the application doesn't use it.

### Preferred Alternative
Configure half-open probes with `resetTimeout` for automatic recovery.

### Refactoring Strategy
1. Configure `resetTimeout: 30` (30 seconds)
2. Enable half-open probe mechanism
3. Verify automatic recovery works in testing

### Related Rules
Implement Half-Open for Automatic Recovery (05-rules.md)

---

## Anti-Pattern 4: In-Memory State in Multi-Server Deployments

### Category
Scalability | Reliability

### Description
Storing circuit breaker state (`closed`/`open`/`half-open`) in a PHP property variable. Each server/worker has independent state.

### Why It Happens
In-memory state is the simplest implementation. Developers test on single-server and deploy to multi-server.

### Warning Signs
- `private string $state = 'closed'` in circuit breaker implementation
- One server's requests pass while another's are blocked
- Mixed success/failure responses for same external service

### Why It Is Harmful
Server A opens the circuit (Stripe is down). Server B has never seen a failure (circuit still `closed`). Server B continues sending requests to Stripe. All Server B requests time out (30s each). Users on Server B have slow error pages. Users on Server A have fast degraded responses. Inconsistent user experience.

### Preferred Alternative
Store circuit breaker state in Redis.

### Refactoring Strategy
1. Replace in-memory state with Redis-backed cache
2. Check `Cache::store('redis')->get('circuit:stripe')` on each request
3. Use atomic operations for state transitions

### Related Rules
Use Redis for Distributed State (05-rules.md)

### Related Decision Trees
State Storage Strategy (07-decision-trees.md)

---

## Anti-Pattern 5: No State Transition Event Listeners

### Category
Observability

### Description
Circuit breaker state changes without firing events. No logging, no alerts, no dashboards. Degradation goes undetected.

### Why It Happens
Developers implement the circuit breaker logic but don't add the observability layer.

### Warning Signs
- No `Event::listen(CircuitOpened::class, ...)` in codebase
- State transitions invisible in logs
- Degradation discovered only by user complaints

### Why It Is Harmful
Circuit opens for Stripe at 2:00 AM. No event fires. No alert. The overnight batch job fails silently. At 8:00 AM, support tickets roll in: "payments not working." The team spends an hour investigating before noticing the circuit breaker state.

### Preferred Alternative
Fire events on all state transitions with logging and alerting.

### Refactoring Strategy
1. Register event dispatcher in circuit breaker
2. Fire `CircuitOpened`, `CircuitHalfOpened`, `CircuitClosed` events
3. Register listeners for logging and alerting

### Related Rules
Register Event Listeners on State Transitions (05-rules.md)

---

## Anti-Pattern 6: Retry Without Circuit Breaker (Hammering During Outage)

### Category
Reliability | Performance

### Description
Implementing retry logic without a circuit breaker. The system continues retrying during a full upstream outage, wasting resources and delaying recovery.

### Why It Happens
Retry is the first resilience pattern developers learn. Circuit breaker is added later or never.

### Warning Signs
- Retry configured but no circuit breaker
- All retry attempts fail during upstream outage
- Downstream gets full traffic despite being down

### Why It Is Harmful
Payment API is down. Retry logic retries 3 times with 1s, 5s, 10s delays. Every payment attempt across all users generates 3 API calls. 1000 payment attempts = 3000 API calls to a failing service. No one tells the upstream "stop sending requests." The upstream can't recover because it's constantly hammered.

### Preferred Alternative
Combine retry (for transient blips) with circuit breaker (for sustained outages).

### Refactoring Strategy
1. Add circuit breaker before retry
2. Retry only when circuit is closed
3. Circuit open → fail fast, don't retry

### Related Rules
Combine Circuit Breaker with Retry (implicit in patterns)
