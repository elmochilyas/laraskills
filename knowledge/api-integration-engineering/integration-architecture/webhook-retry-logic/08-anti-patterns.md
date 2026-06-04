# Anti-Patterns: Webhook Retry Logic (Event Sourcing)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | event-sourcing-integrations |
| Knowledge Unit | Webhook Retry Logic |
| Difficulty | Expert |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Recording Retry Attempt After the HTTP Call Instead of Before | Reliability | Critical |
| 2 | No Final Failure Event with Complete Attempt History | Observability | High |
| 3 | Single Backoff Strategy for All Providers | Architecture | Medium |
| 4 | No Retry Budget or Maximum Attempt Limit | Reliability | Critical |
| 5 | Retry Events Without Subscriber Context | Observability | Medium |

---

## Anti-Pattern 1: Recording Retry Attempt After the HTTP Call Instead of Before

### Category
Reliability

### Description
Recording the retry attempt event AFTER executing the HTTP delivery call, so a crash during delivery means the retry attempt is never recorded and the retry schedule loses its place.

### Why It Happens
Developers naturally record outcomes after the action completes. The retry attempt event should capture the intent to deliver, not just the outcome.

### Warning Signs
- Retry attempt event is recorded after the HTTP response is received
- Retry attempt event includes "response status" as required (not optional) field
- Crash during HTTP call results in no retry attempt event
- Restarted retry process re-dispatches from the same point (misses the lost attempt)
- Retry schedule shows gaps (missing attempt records) compared to subscriber logs

### Why Harmful
If the process crashes during the HTTP dispatch call (after recording the attempt as "in progress" but before completing), the retry schedule has no record of the attempt. On restart, the retry counter is not incremented, and the retry runs again — potentially exceeding the intended retry schedule.

### Real-World Consequences
- Webhook retry crashes during HTTP POST to subscriber; no retry attempt recorded
- Retry process restarts and dispatches the same retry from scratch
- Intended schedule: attempt 2 → 5-minute delay → attempt 3 → 30-minute delay
- Actual: attempt 2 crashes, restarts as attempt 2 again (not 3), 5-minute delay instead of 30-minute
- Subscriber receives an extra retry outside the intended schedule

### Preferred Alternative
Record the retry attempt event BEFORE executing the HTTP call. The event captures the intent to deliver; the HTTP response updates the event.

```php
class RetryService {
    public function executeRetry(WebhookOutbox $webhook): void {
        // 1. Record retry attempt event BEFORE HTTP call
        $attemptEvent = new WebhookDeliveryAttempted(
            aggregateUuid: $webhook->uuid,
            attempt: $webhook->attempts + 1,
            scheduledAt: now(),
            subscriberUrl: $webhook->subscriber_url,
        );
        event($attemptEvent);
        
        // 2. Execute HTTP call
        try {
            $response = Http::timeout(30)->post($webhook->subscriber_url, $webhook->payload);
            // Update the attempt event with outcome
            $attemptEvent->markSucceeded($response->status());
        } catch (\Exception $e) {
            $attemptEvent->markFailed($e->getMessage());
        }
    }
}
```

### Refactoring Strategy
1. Change retry attempt recording to happen BEFORE the HTTP call
2. Make the attempt event mutable for outcome updates (or emit separate success/failure events)
3. Verify crash recovery: a crash during HTTP call still leaves a retry attempt event
4. Add idempotency to prevent duplicate retry attempts on restart
5. Test crash-at-every-point scenarios

### Detection Checklist
- [ ] Retry attempt event is recorded before HTTP call execution
- [ ] Crash during HTTP call does not lose the retry attempt record
- [ ] Restart after crash does not replay the same retry attempt
- [ ] Retry schedule is consistent regardless of process restarts
- [ ] Subscriber logs match application retry attempt records

### Related Rules/Skills/Trees
- Rule: Record retry attempt event BEFORE executing the retry HTTP call
- Rule: Each retry adds one event store write (~5ms) plus HTTP call latency
- Related KU: Webhook Retry Logic (event-sourced retry attempts)

---

## Anti-Pattern 2: No Final Failure Event with Complete Attempt History

### Category
Observability

### Description
When all retry attempts are exhausted, stopping without a final failure event that captures the complete attempt history, leaving operators to reconstruct what happened from individual attempt events.

### Why Happens
The retry system runs out of attempts and simply stops. Developers assume the last failed attempt event is sufficient to understand the outcome.

### Warning Signs
- No event type for "retries exhausted" or "final failure"
- Determining if a webhook has permanently failed requires checking all attempt timestamps
- No single record summarizing the retry lifecycle
- Alerting on permanent failures requires complex queries across attempt events
- Operations team cannot quickly determine if a webhook has permanently failed

### Why Harmful
Without a final failure event, determining if a webhook is permanently failed requires querying the retry schedule, checking max attempts, and comparing timestamps. This is complex and error-prone. Monitoring and alerting must reconstruct retry state from multiple events instead of reacting to a dedicated terminal event.

### Real-World Consequences
- Operations dashboard shows "pending" for webhooks that have exhausted all retries
- Alerting misses permanent failures because they look like "in progress" without the final event
- Post-incident analysis requires joining 8 retry attempt events to understand the full picture
- Compliance audit requires proof of final delivery outcome; missing terminal event
- Manual cleanup required to identify and resolve permanently failed webhooks

### Preferred Alternative
Emit a `WebhookRetriesExhausted` (or `WebhookDeliveryFinalFailed`) event when all retry attempts are exhausted. Include the complete attempt summary in the event payload.

```php
class WebhookRetriesExhausted {
    public function __construct(
        public readonly string $aggregateUuid,
        public readonly array $attempts,  // Complete attempt history
        public readonly int $totalAttempts,
        public readonly string $lastError,
        public readonly string $subscriberUrl,
    ) {}
}

// Emit when max attempts reached
if ($webhook->attempts >= $maxAttempts) {
    event(new WebhookRetriesExhausted(
        aggregateUuid: $webhook->uuid,
        attempts: $webhook->attemptHistory(),
        totalAttempts: $webhook->attempts,
        lastError: $webhook->lastError,
        subscriberUrl: $webhook->subscriber_url,
    ));
    // Reactors can alert, notify, or trigger alternative delivery
}
```

### Refactoring Strategy
1. Add `WebhookRetriesExhausted` event type to the event schema
2. Emit the event when max retry attempts are reached
3. Include full attempt history in the event payload (summary, not raw data)
4. Create reactor that alerts on final failure events
5. Update monitoring to use final failure events for dashboards and alerts

### Detection Checklist
- [ ] Final failure event is emitted when retries exhausted
- [ ] Event includes summary of all retry attempts
- [ ] Alerting triggers on final failure events
- [ ] Dashboard shows permanently failed webhooks distinctly
- [ ] Compliance audit can identify final delivery outcome from single event

### Related Rules/Skills/Trees
- Rule: Final failure event with complete attempt history when retries exhausted
- Rule: Final failure event with full attempt history
- Related KU: Dead letter queue for permanently failed webhooks

---

## Anti-Pattern 3: Single Backoff Strategy for All Providers

### Category
Architecture

### Description
Using the same retry backoff strategy (same intervals, same max attempts) for all webhook subscribers, ignoring their individual reliability characteristics and requirements.

### Why It Happens
A single retry configuration is simpler to implement and manage. Developers assume all subscribers have the same reliability requirements.

### Warning Signs
- One global retry configuration for all webhook subscribers
- Reliable subscribers get retried with same aggression as unreliable ones
- Unreliable subscribers consume excessive retry resources
- No per-subscriber retry schedule customization
- Subscriber-specific retry requirements exist (documented in integration agreements) but are not configured

### Why Harmful
Different subscribers have different capabilities: some handle retries well (idempotent, fast), others degrade under retry pressure (rate-limited, slow recovery). A single strategy either overloads weak subscribers with too many retries or under-delivers to robust subscribers that could handle more attempts.

### Real-World Consequences
- Reliable payment gateway subscriber: stable endpoint, always available
- Gets same retry schedule as unreliable analytics endpoint that frequently returns 503
- Both get 10 retries over 24 hours
- Payment gateway could be retried more aggressively (shorter window) but isn't
- Unreliable analytics endpoint gets retried 10 times, each causing a 503, wasting resources
- Subscriber-specific SLA requirements cannot be met with global retry config

### Preferred Alternative
Configure per-subscriber retry strategies based on their reliability, SLAs, and idempotency capabilities.

```php
class RetryStrategyManager {
    private array $strategies = [
        'payment-gateway' => [
            'max_attempts' => 15,
            'schedule' => [10, 30, 60, 120, 300, 600, 1800, 3600], // seconds
            'backoff' => 'exponential',
            'jitter' => true,
        ],
        'analytics-endpoint' => [
            'max_attempts' => 3,
            'schedule' => [60, 300, 1800],
            'backoff' => 'linear',
            'jitter' => false,
        ],
    ];
    
    public function getStrategy(string $subscriber): array {
        return $this->strategies[$subscriber] ?? $this->defaultStrategy();
    }
}
```

### Refactoring Strategy
1. Classify subscribers by reliability tier (critical, standard, best-effort)
2. Define per-tier retry strategies (max attempts, schedule, backoff type)
3. Store subscriber-specific retry configuration in the database
4. Expose retry configuration in subscriber management UI
5. Monitor retry effectiveness per subscriber to tune strategies

### Detection Checklist
- [ ] Retry strategies are configurable per subscriber
- [ ] Subscribers are classified by reliability tier
- [ ] Retry configuration is stored with subscriber metadata
- [ ] Retry effectiveness is monitored per subscriber for tuning
- [ ] No single global retry configuration

### Related Rules/Skills/Trees
- Rule: Track backoff strategy decisions per provider for optimization analytics
- Rule: Include full context: attempt number, scheduled delay, actual delay
- Related KU: Exponential Backoff Customization (per-subscriber strategies)

---

## Anti-Pattern 4: No Retry Budget or Maximum Attempt Limit

### Category
Reliability

### Description
Allowing webhook retries to continue indefinitely without a maximum attempt limit, retry budget, or termination condition.

### Why Happens
Indefinite retry seems like the safest approach: "we'll keep trying until it succeeds." Developers don't establish a stopping condition because they want to maximize delivery chances.

### Warning Signs
- No max attempts configured for webhook retry
- Webhooks remain in "retrying" status for days or weeks
- Retry queue grows without bound for a failing subscriber endpoint
- Storage for retry events grows linearly with each attempt
- Queue workers spend all their time retrying a permanently-dead endpoint

### Why Harmful
Indefinite retry means a permanently dead subscriber endpoint will be retried forever. This wastes processing resources, generates infinite retry events, and delays processing of other webhooks that could succeed. The retry queue becomes a tar pit for dead endpoints.

### Real-World Consequences
- Subscriber endpoint returns 500 (server error) and is never fixed
- Retry system attempts delivery every hour for 6 months
- 4,380 retry events generated for a single webhook
- Queue worker pool is mostly occupied retrying this dead endpoint
- Other webhooks' retries are delayed because workers are busy
- 1 GB of storage consumed by retry events for this one webhook

### Preferred Alternative
Configure a maximum retry budget per subscriber and implement a final failure state when the budget is exhausted.

```php
class RetryBudget {
    public function __construct(
        public readonly int $maxAttempts = 10,
        public readonly ?int $maxDurationHours = 48,
        public readonly int $consecutiveFailLimit = 5,
    ) {}
    
    public function isExhausted(WebhookOutbox $webhook): bool {
        if ($webhook->attempts >= $this->maxAttempts) return true;
        if ($webhook->firstAttemptAt && $webhook->firstAttemptAt->diffInHours(now()) >= $this->maxDurationHours) return true;
        if ($webhook->consecutiveFailures >= $this->consecutiveFailLimit) return true;
        return false;
    }
}
```

### Refactoring Strategy
1. Add `max_attempts` configuration per subscriber (or global default)
2. Enforce max attempts before dispatching each retry
3. Add time-based retry budget (max retry duration per webhook)
4. Emit final failure event when budget exhausted
5. Monitor retry budget utilization for capacity planning

### Detection Checklist
- [ ] Maximum retry attempts are configured and enforced
- [ ] Time-based retry budget exists (max retry duration)
- [ ] Final failure state is reached within budget
- [ ] Indefinite retry is impossible
- [ ] Retry budget utilization is monitored

### Related Rules/Skills/Trees
- Rule: Final failure event with complete attempt history when retries exhausted
- Rule: Max retry attempts limit enforced
- Related KU: Dead letter queue after max retries exceeded

---

## Anti-Pattern 5: Retry Events Without Subscriber Context

### Category
Observability

### Description
Recording retry attempt events without the subscriber endpoint identity (URL, subscriber ID, endpoint name), making it impossible to analyze retry patterns per subscriber.

### Why Happens
The retry event focuses on the webhook (event type, payload) and the attempt (number, timestamp, response status). The subscriber endpoint is implicitly known from the aggregate but not explicitly stored in the event.

### Warning Signs
- Retry attempt events store webhook ID and attempt number but not subscriber URL
- Analyzing retry patterns per subscriber requires joining with subscriber configuration tables
- Subscriber endpoint health trends cannot be queried from the event store
- "Which subscribers have the highest retry rate?" requires complex multi-table queries
- Subscriber URL changes make historical retry events unanalyzable

### Why Harmful
Without subscriber context in retry events, it's impossible to answer fundamental questions: which subscribers are most unreliable? Which endpoints have degrading performance over time? How many retries does each subscriber cause? This information is critical for subscriber management, endpoint health monitoring, and capacity planning.

### Real-World Consequences
- Operations team cannot identify which subscriber is causing the most retries
- Degrading subscriber endpoint goes unnoticed because retry events don't name the subscriber
- Quarterly review cannot answer "are our subscribers getting more reliable or less?"
- Subscriber URL changes mean all historical retry data loses subscriber association
- Retry budget planning has no per-subscriber data to inform decisions

### Preferred Alternative
Include subscriber identifier (URL, subscriber ID, endpoint name) in every retry attempt event for per-subscriber analysis.

```php
class WebhookDeliveryAttempted {
    public function __construct(
        public readonly string $aggregateUuid,
        public readonly int $attempt,
        public readonly string $subscriberUrl,      // Explicit subscriber identity
        public readonly string $subscriberId,        // Subscriber database ID
        public readonly string $endpointName,        // Human-readable name
        public readonly int $delaySeconds,           // Delay applied before this attempt
        public readonly string $backoffStrategy,     // Which strategy was used
        // ... other fields
    ) {}
}
```

### Refactoring Strategy
1. Add subscriber URL, ID, and endpoint name to all retry attempt events
2. Create projector that tracks retry metrics per subscriber (attempt count, success rate, avg delay)
3. Build subscriber health dashboard from projector read model
4. Set up alerting on subscriber retry rate exceeding thresholds
5. Archive historical retry data with subscriber identifiers for trend analysis

### Detection Checklist
- [ ] Retry attempt events include subscriber URL and identifier
- [ ] Per-subscriber retry analysis is possible from event store queries
- [ ] Subscriber health projector tracks retry metrics per endpoint
- [ ] Alerting exists for subscriber retry rate degradation
- [ ] Subscriber URL changes are trackable in historical events

### Related Rules/Skills/Trees
- Rule: Include full context: attempt number, scheduled delay, actual delay, subscriber URL
- Rule: Retry effectiveness metrics available from projector
- Related KU: Integration Health Checks (endpoint monitoring)
