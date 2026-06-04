# Anti-Patterns — Delivery Retry

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-outgoing |
| Knowledge Unit | Delivery Retry |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Retry Schedule Uniformity
2. Error Indiscrimination
3. Jitter Neglect
4. Max Attempts Extremes
5. Circuit Breaker Bypass

---

## 1. Retry Schedule Uniformity

### Category
Reliability

### Description
Applying the same retry schedule to all outgoing webhooks regardless of subscriber capacity or event criticality, treating a payment notification the same as a ping.

### Why It Happens
A single backoff strategy is configured globally and used for all webhook dispatch. The implementation effort for per-subscriber or per-event-type strategies seems unjustified. The assumption is that one retry schedule fits all scenarios, ignoring that different subscribers have different capacity and different events have different delivery urgency.

### Warning Signs
- Single backoff strategy class used for all webhook dispatches
- No per-subscriber or per-event-type retry customization
- All webhooks have identical retry delay patterns
- Subscribers with different capacities get identical retry schedules

### Why Harmful
A subscriber with limited capacity (10 req/min) receiving webhooks from a retry schedule designed for unlimited capacity (2s, 4s, 8s) will be overwhelmed on every retry. The retry schedule that works for a well-provisioned enterprise subscriber will overload a small SaaS subscriber. Conversely, a critical payment webhook that needs aggressive retry is delayed by the same pace as a low-priority notification.

### Consequences
- Low-capacity subscribers overwhelmed by aggressive retry
- High-capacity subscribers under-served by conservative retry
- Critical events delayed by inappropriately long backoff
- Non-critical events waste resources on excessive retry

### Alternative
Configure different backoff strategies per subscriber tier or event criticality, matching retry aggressiveness to subscriber capacity and delivery SLA.

### Refactoring Strategy
1. Define subscriber tiers based on capacity (enterprise, standard, limited)
2. Create backoff strategies per tier with appropriate base delays and caps
3. Map subscribers to tiers in the database
4. Assign backoff strategy per webhook dispatch based on subscriber tier
5. Monitor retry impact on subscriber health per tier

### Detection Checklist
- [ ] Backoff strategies differentiated by subscriber tier
- [ ] Per-dispatch strategy assignment based on subscriber capacity
- [ ] Subscribers not overwhelmed by retry schedules
- [ ] Retry impact monitored per subscriber tier

### Related Rules
Always Configure an Explicit Backoff Strategy

### Related Skills
Implement Delivery Retry Logic for Outgoing Webhooks

### Related Decision Trees
Backoff Strategy Selection (Exponential vs Custom Schedule)

---

## 2. Error Indiscrimination

### Category
Reliability

### Description
Treating all HTTP error responses the same way for retry purposes, retrying 4xx client errors (that will never succeed) with the same schedule as 5xx server errors (that may recover).

### Why It Happens
Webhook delivery failure handling checks for non-2xx responses and triggers retry regardless of the status code. The developer assumes all errors are transient — the subscriber will eventually accept the webhook. Distinguishing between error types adds complexity that seems unnecessary.

### Warning Signs
- All non-2xx responses trigger the same retry behavior
- 4xx responses (bad request, not found, forbidden) retried identically to 5xx
- Failed webhooks show 4xx errors with multiple retry attempts
- No error classification in retry decision logic

### Why Harmful
A 4xx error (400 Bad Request, 404 Not Found, 410 Gone) indicates a client-side issue that will not resolve on retry. The subscriber's endpoint changed, the payload format is wrong, or the resource doesn't exist. Retrying 10 times against a 404 endpoint wastes all 10 attempts, delays final failure detection, and consumes queue resources.

### Consequences
- Wasted retry attempts on permanently failing subscriber errors
- Delayed final failure detection for 4xx errors
- Queue resources consumed by futile retries
- No visibility into subscriber misconfiguration (all errors look the same)

### Alternative
Classify HTTP responses: 2xx = success, 4xx (except 429) = permanent failure (no retry), 429 = retry with Retry-After, 5xx = retry with exponential backoff.

### Refactoring Strategy
1. Add HTTP status code classification to the retry decision point
2. For 4xx errors (400, 404, 410, 422): mark permanently failed immediately
3. For 429: extract Retry-After header and use as delay
4. For 5xx: use standard exponential backoff
5. For timeouts/network errors: use exponential backoff

### Detection Checklist
- [ ] 4xx errors (except 429) classified as permanent failures
- [ ] 429 errors follow Retry-After header
- [ ] 5xx errors use exponential backoff
- [ ] No retries wasted on permanently failing endpoints

### Related Rules
Use Error-Aware Backoff Based on HTTP Status Code

### Related Skills
Implement Delivery Retry Logic for Outgoing Webhooks

### Related Decision Trees
Error-Aware Retry Strategy

---

## 3. Jitter Neglect

### Category
Reliability

### Description
Using pure exponential backoff without jitter, causing synchronized retry storms when multiple webhooks fail simultaneously and retry in lockstep.

### Why It Happens
Pure exponential backoff (`pow(2, $attempt)`) produces clean, predictable delays. Developers don't simulate the concurrent failure scenario where 100 webhooks fail at the same time (e.g., during a subscriber outage) and all retry at identical intervals, creating synchronized traffic spikes.

### Warning Signs
- Backoff delay calculated with `pow()` or similar without randomization
- Subscriber response time spikes at predictable intervals after recovery
- Error logs show bursts of errors at exact backoff timestamps
- Multiple webhooks show identical retry timestamps

### Why Harmful
After a subscriber outage, all pending webhooks have identical retry schedules: they all wait 2s, then all wait 4s, then all wait 8s. The first retry after recovery hits the subscriber with the full backlog volume simultaneously. The subscriber is immediately overwhelmed, triggering a secondary outage or rate limiting.

### Consequences
- Subscriber overwhelmed on recovery (secondary outage)
- Retry storms synchronized across all pending webhooks
- Recovery window extended by repeated overload
- Queue workers waste effort on simultaneous retries

### Alternative
Add jitter to all retry delays to randomize timing across webhooks and prevent synchronized retry.

### Refactoring Strategy
1. Modify backoff calculation to include jitter: `$delay * (0.75 + mt_rand(0, 5000) / 10000)`
2. Use full jitter pattern: `rand(0, $expDelay)` for maximum distribution
3. Cap maximum delay to prevent unbounded jitter
4. Verify in testing that concurrent webhooks have varied retry timings
5. Monitor subscriber load patterns after recovery

### Detection Checklist
- [ ] Jitter applied to all retry delay calculations
- [ ] Concurrent webhooks have varied retry timings
- [ ] No synchronized retry patterns after subscriber recovery
- [ ] Subscriber not overwhelmed on recovery

### Related Rules
Always Add Jitter to Retry Delays

### Related Skills
Implement Delivery Retry Logic for Outgoing Webhooks

### Related Decision Trees
Backoff Strategy Selection (Exponential vs Custom Schedule)

---

## 4. Max Attempts Extremes

### Category
Reliability

### Description
Setting `max_attempts` too low (causing premature failure on transient blips) or too high (causing excessive resource consumption on dead endpoints) without matching the delivery SLA.

### Why It Happens
Developers set `max_attempts` based on intuition rather than calculation. Common values are 3 ("if it fails 3 times, something is wrong") or 50 ("we never want to give up"). Neither considers the actual retry window needed for the subscriber's recovery profile or the cost of futile retries.

### Warning Signs
- `max_attempts` set to 2-3 for critical webhooks
- `max_attempts` set to 50+ for non-critical notifications
- Total retry duration (sum of backoff delays) doesn't cover expected outage windows
- Final failure reached during typical transient network blips

### Why Harmful
With 3 attempts and a standard backoff schedule, the total retry window is ~30 seconds. A 5-minute DNS failover or 2-minute deployment window exhausts all retries. The webhook is permanently failed even though the subscriber recovered minutes later. Conversely, 50 attempts on a dead endpoint consume days of retry capacity and thousands of database records.

### Consequences
- Critical webhooks fail permanently during typical transient outages
- Non-critical webhooks consume resources for extended dead-endpoint retries
- Final failure detection delayed beyond useful intervention windows
- Storage and queue capacity consumed by excessive retry records

### Alternative
Calculate `max_attempts` to match the desired delivery window based on the backoff schedule, with per-criticality tiers.

### Refactoring Strategy
1. Define delivery SLAs per event type (e.g., payment: 1 hour, notification: 24 hours)
2. Calculate max_attempts so total retry duration covers the SLA
3. Set 8-12 attempts for critical, 3-5 for non-critical
4. Document SLA rationale per event type
5. Monitor final-failure-to-subscriber-recovery time to validate

### Detection Checklist
- [ ] max_attempts calculated based on delivery SLA
- [ ] Critical events have sufficient retry capacity for expected outages
- [ ] Non-critical events don't waste resources
- [ ] Total retry duration matches business requirements

### Related Rules
Set Max Attempts Between 5 and 10

### Related Skills
Implement Delivery Retry Logic for Outgoing Webhooks

### Related Decision Trees
Final Failure and Dead Letter Strategy

---

## 5. Circuit Breaker Bypass

### Category
Reliability

### Description
Continuing to retry webhooks against a subscriber endpoint without checking circuit breaker or subscriber health state, wasting retry resources on persistently dead endpoints.

### Why It Happens
The retry mechanism is built into the webhook dispatch pipeline and operates independently of subscriber health tracking. Developers implement retry as a standalone feature without integrating it with the circuit breaker or health check system. The retry logic assumes all failures are transient.

### Warning Signs
- Retry continues for days against a known-dead endpoint
- No subscriber health tracking integrated with retry decisions
- Circuit breaker state not consulted before retry
- Same subscriber endpoint fails hundreds of times

### Why Harmful
A subscriber endpoint that has been returning 500 for 24 hours will consume retry attempts on every webhook dispatched to it. Each attempt generates database records, queue activity, and HTTP traffic — all futile. The retry pipeline treats the dead endpoint the same as a healthy one, wasting resources that could serve other subscribers.

### Consequences
- Queue workers occupied by dead endpoint retries
- Healthy subscribers delayed by zombie retry chains
- Unbounded webhook_calls table growth from futile attempts
- Subscriber health issues go unnoticed without explicit monitoring

### Alternative
Integrate circuit breaker or subscriber health tracking with the retry pipeline. Skip or delay retry for endpoints in open circuit state.

### Refactoring Strategy
1. Implement subscriber health tracking (recent success rate, consecutive failures)
2. Add circuit breaker middleware to the webhook dispatch pipeline
3. Before retry, check if the subscriber is in open circuit state
4. For open circuit subscribers, log the skip and alert instead of retrying
5. Implement automatic subscriber disable after consecutive failure threshold

### Detection Checklist
- [ ] Circuit breaker state checked before retry
- [ ] Subscriber health tracking integrated with retry
- [ ] Dead endpoints skipped, not retried
- [ ] Subscriber auto-disabled after consecutive failure threshold

### Related Rules
Implement Circuit Breaker Before Retry

### Related Skills
Implement Delivery Retry Logic for Outgoing Webhooks

### Related Decision Trees
Final Failure and Dead Letter Strategy
