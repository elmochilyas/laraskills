# Anti-Patterns — Exponential Backoff Customization in Spatie webhook-server

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-outgoing |
| Knowledge Unit | Exponential Backoff Customization in Spatie webhook-server |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Pure Exponential Thundering Herd
2. Uniform Backoff for All Event Types
3. Max Attempts Miscalibration
4. Retry Monitoring Vacuum
5. Dead Endpoint Retry Persistence

---

## 1. Pure Exponential Thundering Herd

### Category
Reliability

### Description
Using pure exponential backoff without jitter, causing synchronized retry storms when a subscriber recovers after an outage, overwhelming the recovering endpoint.

### Why It Happens
The default exponential backoff (`pow(2, $attempt)`) produces clean, predictable delays that seem mathematically elegant. Developers don't consider the synchronized retry scenario — when a subscriber goes down and comes back up, all queued webhooks retry at identical time intervals, creating a thundering herd.

### Warning Signs
- Backoff strategy uses pure `pow()` without randomization
- Subscriber response time spikes immediately after recovery
- Subscriber reports being overwhelmed after downtime
- Error logs show bursts of 5xx errors at predictable intervals

### Why Harmful
When a subscriber recovers after an outage, all pending webhooks have identical retry schedules. They all retry at second 1, then all at second 2, then all at second 4, etc. The first retry after recovery hits the subscriber with the full backlog volume simultaneously, potentially causing a secondary outage. The subscriber never gets a gradual re-introduction of traffic.

### Consequences
- Subscriber overwhelmed on recovery (secondary outage)
- Retry storms synchronized across all pending webhooks
- Recovery period prolonged by repeated overload
- Wasted retry capacity on futile attempts during overload

### Alternative
Add ±25% jitter to all exponential backoff delays to randomize retry timing across webhooks.

### Refactoring Strategy
1. Modify the backoff strategy to add jitter: `$seconds * (0.75 + mt_rand(0, 5000) / 10000)`
2. Cap the maximum backoff delay at a reasonable limit (e.g., 3600 seconds)
3. Verify in testing that concurrent webhooks have varied retry timings
4. Monitor subscriber load after recovery to confirm no retry storms

### Detection Checklist
- [ ] Jitter (±25%) applied to exponential backoff
- [ ] No pure exponential `pow()` without randomization
- [ ] Concurrent webhooks have varied retry timings
- [ ] No retry storms observed on subscriber recovery

### Related Rules
Use Jitter-Based Exponential Backoff as Default

### Related Skills
Apply Exponential Backoff with Jitter to Webhook Delivery

### Related Decision Trees
Jitter Application (Pure Exponential vs Jitter-Based)

---

## 2. Uniform Backoff for All Event Types

### Category
Architecture

### Description
Using the same backoff strategy for all outgoing webhook event types regardless of their business criticality, treating payment failures with the same retry schedule as notification pings.

### Why It Happens
A single backoff strategy is configured globally in `config/webhook-server.php` and applied to all webhook dispatches. Developers don't differentiate event types because the dispatch API is the same for all events. The different criticality of events is not mapped to different retry requirements.

### Warning Signs
- Single backoff strategy class for all webhook types
- No per-event-type backoff customization
- Payment webhooks and notification webhooks have identical retry schedules
- Critical events use the same retry count as non-critical events

### Why Harmful
Payment events need aggressive retry within minutes to complete time-sensitive transactions. Notification events can tolerate hours-long delivery windows. A single backoff strategy either over-retries non-critical events (wasting resources) or under-retries critical events (causing payment failures). The one-size-fits-all approach doesn't match the diverse delivery requirements.

### Consequences
- Critical webhooks fail prematurely with conservative backoff
- Non-critical webhooks waste resources with aggressive retry
- Delivery SLAs for different event types unachievable
- Resource allocation doesn't match business priorities

### Alternative
Implement different backoff strategies per event type with appropriate max attempts and delay schedules.

### Refactoring Strategy
1. Define backoff strategy classes per criticality tier (critical, standard, low)
2. Use `$webhookCall->useBackoffStrategy()` to assign per-dispatch
3. Map event types to strategies in a centralized dispatch service
4. Set max_attempts aligned to each tier's delivery SLA
5. Monitor delivery success rates per tier

### Detection Checklist
- [ ] Backoff strategies differentiated by event criticality
- [ ] Per-dispatch strategy assignment via `useBackoffStrategy()`
- [ ] Critical events have more aggressive retry schedules
- [ ] Delivery SLAs achievable per event type

### Related Rules
Customize Backoff Per Event Type, Set Max Attempts Based on Business Criticality

### Related Skills
Apply Exponential Backoff with Jitter to Webhook Delivery

### Related Decision Trees
Backoff Strategy Selection (Default vs Custom)

---

## 3. Max Attempts Miscalibration

### Category
Reliability

### Description
Setting `max_attempts` too low (premature failure on transient blips) or too high (delayed failure detection, wasted resources) without considering the event type's delivery SLA.

### Why It Happens
Developers set `max_attempts` based on intuition rather than calculation. A common mistake is setting it too low (3-5 attempts) because "if it fails 3 times, it's probably broken." This ignores that transient network blips, DNS propagation delays, or subscriber deployment windows can last 5-30 minutes, requiring more attempts with exponential backoff.

### Warning Signs
- Webhook permanently fails after 3-5 quick attempts
- Same subscriber has intermittent failures that exhaust retries
- Max attempts set without considering backoff schedule total duration
- No calculation matching max_attempts × backoff delays to delivery SLA

### Why Harmful
Too few attempts cause permanent failure on transient issues that would have resolved within the delivery window. Too many attempts cause non-critical webhooks to consume workers for hours, delaying delivery to healthy subscribers and wasting database storage.

### Consequences
- Critical webhooks permanently fail from transient network blips
- Non-critical webhooks occupy queue capacity for extended periods
- Final failure detection delayed for dead endpoints
- Delivery SLA breached due to premature exhaustion

### Alternative
Calculate `max_attempts` based on the desired delivery window and backoff schedule. Set per-event-type based on criticality.

### Refactoring Strategy
1. Calculate total retry duration = sum of backoff delays for all attempts
2. Set max_attempts so total duration matches delivery SLA (e.g., 24 hours)
3. Example: 10 attempts with backoff [1,2,4,8,16,32,64,128,256,512] = ~17 hours
4. Set 10-15 for critical, 3-5 for non-critical
5. Document the SLA rationale per event type

### Detection Checklist
- [ ] max_attempts calculated based on delivery SLA
- [ ] Critical events have sufficient retry capacity
- [ ] Non-critical events don't waste resources on excessive retries
- [ ] Total retry duration matches business requirements

### Related Rules
Set Max Attempts Based on Business Criticality

### Related Skills
Apply Exponential Backoff with Jitter to Webhook Delivery

### Related Decision Trees
Max Attempts Configuration by Event Criticality

---

## 4. Retry Monitoring Vacuum

### Category
Observability

### Description
Not monitoring retry attempt rates or final failure events, leaving delivery degradation invisible until subscribers report missing webhooks.

### Why It Happens
The Spatie webhook-server stores all delivery attempts in the database. Developers assume database inspection is sufficient for monitoring. Real-time alerting on retry patterns requires explicit event listeners and metrics infrastructure, which is added post-MVP and often deprioritized.

### Warning Signs
- No event listeners for `WebhookCallFailedEvent` or `FinalWebhookCallFailedEvent`
- Retry rates unknown — no tracking of per-attempt delivery success
- Subscriber health based on "no news is good news"
- Incident response reactive (subscriber reports) not proactive

### Why Harmful
Rising retry rates are a leading indicator of subscriber degradation. Without monitoring, a subscriber whose endpoint is gradually slowing down (increased response time, intermittent 5xx) goes unnoticed. By the time final failures occur, the subscriber may have been experiencing degraded delivery for hours or days, with many events permanently lost.

### Consequences
- Subscriber degradation detected only after final failures
- Leading indicator (rising retry rate) completely missed
- Prolonged periods of degraded delivery
- Permanent event loss from delayed detection

### Alternative
Track retry attempt rates per subscriber, monitor final failure rates, and alert on abnormal patterns.

### Refactoring Strategy
1. Register `WebhookCallFailedEvent` listener to track retry rates per subscriber
2. Register `FinalWebhookCallFailedEvent` listener for alerting
3. Create metrics: webhook delivery success rate, retry rate, final failure rate
4. Set up alerts: >10% retry rate over 5 minutes, any final failure
5. Create dashboard with delivery health per subscriber

### Detection Checklist
- [ ] Retry attempt rates tracked per subscriber
- [ ] Final failures trigger alerts
- [ ] Dashboard shows delivery health metrics
- [ ] Subscriber degradation detected before final failure

### Related Rules
Monitor Retry Rates and Final Failures

### Related Skills
Apply Exponential Backoff with Jitter to Webhook Delivery

### Related Decision Trees
Max Attempts Configuration by Event Criticality

---

## 5. Dead Endpoint Retry Persistence

### Category
Reliability

### Description
Continuing to retry webhooks against a subscriber endpoint that has been persistently failing for an extended period, wasting retry capacity and queue resources.

### Why It Happens
Retry logic is automatic — once configured, it runs independently of subscriber health. Developers don't implement subscriber health tracking because it adds complexity. The retry mechanism is designed to handle transient failures, but it doesn't distinguish between a 5-minute blip and a 5-day outage.

### Warning Signs
- Webhooks retried 10+ times over days against a dead endpoint
- Subscriber health score not tracked or not consulted before dispatch
- Retry queue for dead endpoints grows unbounded
- Final failures accumulate for the same subscriber

### Why Harmful
Every retry against a dead endpoint consumes queue worker time and database storage that could serve healthy subscribers. Over days, a single dead endpoint can generate thousands of futile retry attempts. The retry capacity is finite — workers occupied with dead endpoints reduce throughput for all other subscribers.

### Consequences
- Queue resources wasted on futile retries against dead endpoints
- Healthy subscribers delayed by zombie retry chains
- Database storage consumed by dead endpoint retry records
- Subscriber health issues go unnoticed without monitoring

### Alternative
Track subscriber endpoint health and skip retry dispatch for persistently dead endpoints.

### Refactoring Strategy
1. Implement subscriber health tracking (recent success rate, last successful delivery)
2. Before dispatch, check subscriber health score
3. For unhealthy subscribers, log the skip and alert instead of dispatching
4. Implement a health recovery mechanism (periodic probe, manual re-enable)
5. Monitor health score as a proactive delivery metric

### Detection Checklist
- [ ] Subscriber health tracked per endpoint
- [ ] Health score consulted before webhook dispatch
- [ ] Unhealthy subscribers skipped with logging
- [ ] Health recovery mechanism implemented

### Related Rules
Implement Subscriber Health Checks

### Related Skills
Apply Exponential Backoff with Jitter to Webhook Delivery

### Related Decision Trees
Backoff Strategy Selection (Default vs Custom)
