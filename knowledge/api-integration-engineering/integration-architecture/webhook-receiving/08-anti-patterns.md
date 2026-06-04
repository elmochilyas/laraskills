# Anti-Patterns: Webhook Receiving (Event Sourcing)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | event-sourcing-integrations |
| Knowledge Unit | Webhook Receiving |
| Difficulty | Expert |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Processing Webhooks in the HTTP Request Lifecycle | Reliability | Critical |
| 2 | Recording Receipt Event After Processing Instead of Before | Reliability | Critical |
| 3 | Modifying Raw Payload After Recording | Maintenance | Critical |
| 4 | Querying Event Store Directly Instead of Using Projectors | Architecture | Medium |
| 5 | Synchronous Reactors Blocking the Projection Pipeline | Performance | High |

---

## Anti-Pattern 1: Processing Webhooks in the HTTP Request Lifecycle

### Category
Reliability

### Description
Performing webhook business logic (validation, transformation, storage, side effects) directly in the HTTP controller that receives the webhook, before returning the HTTP response.

### Why It Happens
It is the simplest implementation pattern: receive webhook, process it, return response. For low-traffic integrations, this works for extended periods before issues arise.

### Warning Signs
- Webhook controller contains business logic beyond signature verification
- HTTP response time exceeds provider timeout (Stripe: 5s, Adyen: 10s)
- Database writes happen inside the controller before returning 200
- Provider retries during slow processing cause duplicate work
- Queued job for webhook processing does not exist

### Why Harmful
Webhook providers have strict response time expectations. If processing takes too long, the provider retries, potentially creating duplicate processing or escalating to manual intervention. The HTTP processing path is not designed for reliability: process crashes during processing lose the webhook entirely.

### Real-World Consequences
- Payment webhook processing takes 3 seconds (provider timeout: 5s)
- Under load, processing takes 6 seconds; provider retries 3 times
- Each retry reprocesses the payment; database contention increases
- Provider eventually disables the endpoint for exceeding timeout SLA
- Manual re-enabling of webhook endpoint required

### Preferred Alternative
Record the receipt event immediately (within the HTTP request), dispatch processing to a queue, and return HTTP 200. Business logic executes asynchronously via projectors and reactors.

```php
class WebhookController extends Controller {
    public function handle(Request $request): Response {
        $rawPayload = $request->getContent();
        
        // 1. Verify signature (must be synchronous)
        $this->verifySignature($request);
        
        // 2. Record receipt event (immutable, before processing)
        event(new WebhookReceived(
            provider: $request->header('X-Provider'),
            rawPayload: $rawPayload,
            headers: $request->headers->all(),
            receivedAt: now(),
        ));
        
        // 3. Return immediately
        return response()->json(['status' => 'received'], 200);
    }
}
```

### Refactoring Strategy
1. Extract all business logic from webhook controller into queued jobs or event subscribers
2. Controller does only: signature verification + receipt event recording + HTTP response
3. Move validation, transformation, and storage to projectors
4. Move notifications and side effects to reactors
5. Test that HTTP response time is under 100ms regardless of business logic complexity

### Detection Checklist
- [ ] Webhook controller returns before any business logic executes
- [ ] Receipt event is recorded in the HTTP request path
- [ ] Processing happens asynchronously (queue workers)
- [ ] HTTP response time is consistently under 100ms
- [ ] Provider timeout is never exceeded

### Related Rules/Skills/Trees
- Rule: Record receipt event BEFORE processing; guarantees capture even if processing fails
- Rule: Separate event processing pipeline from HTTP receiving path
- Related KU: Inbox Pattern (receiver-side reliability)

---

## Anti-Pattern 2: Recording Receipt Event After Processing Instead of Before

### Category
Reliability

### Description
Recording the webhook receipt event in the event store AFTER processing succeeds, so a processing failure means the webhook is never recorded and is effectively lost.

### Why It Happens
Developers naturally order operations as "process then record" because they want to record success status. The immutability principle (record first, process later) is counterintuitive.

### Warning Signs
- Receipt event is recorded after business logic completes
- Processing failure means no event exists for the webhook
- Replay cannot recover failed webhooks because their receipt events were never recorded
- Audit trail shows only successfully processed webhooks
- Failed webhooks are invisible in the event store

### Why Harmful
If processing fails (and the webhook is recorded after processing), the event store has no record of the failed webhook. The webhook cannot be replayed, audited, or recovered. The event store's purpose (complete audit trail) is defeated.

### Real-World Consequences
- Valid webhook received but processing fails due to a transient database error
- Receipt event was not recorded because "recording happens after processing"
- Webhook is lost permanently; no record in event store
- Provider retry sends the webhook again; same failure happens (same reason)
- After the transient error resolves, the webhook is already gone
- Customer's payment is never processed; no recovery path

### Preferred Alternative
Record the webhook receipt event IMMEDIATELY upon receipt, before any processing. The event is immutable proof that the webhook arrived, regardless of processing outcome.

```php
class WebhookService {
    public function receive(string $provider, string $rawPayload, array $headers): void {
        // 1. Record immediately — this is the source of truth
        event(new WebhookReceived(
            provider: $provider,
            rawPayload: $rawPayload,
            headers: $headers,
            receivedAt: now(),
        ));
        
        // 2. Now processing can happen (in projectors/reactors)
        // Processing can fail; the receipt event is already safe in the event store
    }
}
```

### Refactoring Strategy
1. Move receipt event recording to the very beginning of the webhook processing pipeline
2. Ensure event recording happens before any business logic or database operations
3. Verify that processing failures still leave receipt events in the event store
4. Update projectors to handle the case where receipt exists but processing may not have completed
5. Test crash-at-every-point scenarios to verify receipt recording is always first

### Detection Checklist
- [ ] Receipt event is recorded before any processing begins
- [ ] Processing failure does not prevent receipt event recording
- [ ] Event store contains receipt events for failed webhooks
- [ ] Failed webhooks are recoverable via replay from receipt events
- [ ] Audit trail includes all received webhooks, regardless of processing outcome

### Related Rules/Skills/Trees
- Rule: Record receipt event BEFORE processing; guarantees the event is captured even if processing fails
- Rule: Record receipt event before storing payload (fail-fast on invalid signatures)
- Related KU: Event Sourcing fundamentals (immutable event logging)

---

## Anti-Pattern 3: Modifying Raw Payload After Recording

### Category
Maintenance

### Description
Editing or updating the raw webhook payload after it has been recorded as an event in the event store, breaking the immutability guarantee of event sourcing.

### Why Happens
A bug in the mapper, a schema change in the provider, or a need for enrichment can tempt developers to "fix" the raw payload in the event store rather than handling it in the projection or mapping layer.

### Warning Signs
- Update queries on the event store's payload column
- Event payloads in the store differ from what the provider originally sent
- Replay produces different results over time (payload changed between replays)
- No immutable backup of original payload exists
- "Data migration" scripts modify event store payloads

### Why Harmful
The raw webhook payload is the foundation of all event-sourced processing. If it can be modified, the event store is no longer append-only. Replay becomes non-deterministic: replaying events at different times may produce different results because payloads changed. The entire audit trail is compromised.

### Real-World Consequences
- A mapper bug found; developer "fixes" affected payloads in the event store
- Compliance audit months later: payloads in event store don't match provider logs
- Auditor cannot verify processing correctness because source data was modified
- Replay for disaster recovery produces different results than original processing
- Legal discovery: modified payloads cannot be presented as evidence

### Preferred Alternative
Never modify raw payloads in the event store. Handle corrections in the projection layer via versioned mappers or upcasters.

```php
// Wrong: modifying stored payload
// DB::table('stored_events')->where('id', 123)->update(['payload->amount' => 1000]);

// Correct: handle correction in mapper/projector
class V2PaymentMapper {
    public function map(array $rawPayload): array {
        $amount = $rawPayload['amount'];
        if (isset($rawPayload['currency']) && $rawPayload['currency'] === 'jpy') {
            // JPY doesn't use decimals; previous mapper incorrectly divided by 100
            $amount = $rawPayload['amount']; // No division for JPY
        }
        return ['amount' => $amount, 'currency' => $rawPayload['currency']];
    }
}
```

### Refactoring Strategy
1. Audit event store for any modified payloads
2. Restore all modified payloads to original values (from backup or provider logs)
3. Implement versioned mappers that handle payload variations without modifying the store
4. Add database-level protection (trigger/rule preventing UPDATE on event store)
5. Document that event store payloads are immutable and never to be modified

### Detection Checklist
- [ ] Event store payloads are never modified after initial recording
- [ ] No UPDATE queries target the event store's payload column
- [ ] Payload corrections are handled in versioned mappers, not in-place
- [ ] Database permissions prevent modification of raw event payloads
- [ ] Replay produces identical results regardless of when it runs

### Related Rules/Skills/Trees
- Rule: Store raw payload in the event; never modify after recording
- Rule: Event store is append-only; use database-level permissions to enforce
- Related KU: Event Sourcing for Webhooks (immutable event store)

---

## Anti-Pattern 4: Querying Event Store Directly Instead of Using Projectors

### Category
Architecture

### Description
Running queries directly against the event store tables to get current webhook delivery status, instead of using projectors that maintain read-optimized views.

### Why It Happens
The event store is in the same database as the application tables. Developers run queries like `SELECT * FROM stored_events WHERE aggregate_uuid = ? ORDER BY id` to determine current state, bypassing the projector layer.

### Warning Signs
- Dashboard or API queries read from `stored_events` table directly
- No projector exists for webhook delivery status
- Event store queries are slow (filtering/sorting JSON payloads)
- Direct event store queries are scattered across the codebase
- Adding a new query requires understanding the event store schema

### Why Harmful
Event store queries are inherently expensive: they must load all events for an aggregate, deserialize them, and apply state changes in application code. This is slow (O(n) over all events) and couples query code to event schema. Projectors maintain ready-to-use read models that can be queried efficiently.

### Real-World Consequences
- Dashboard page loading webhook delivery status queries 10,000 events, takes 30 seconds
- Each event is deserialized from JSON; time adds up
- Developer adds a new dashboard query; copies the same O(n) pattern
- Event store schema change (event versioning) breaks all direct queries
- Database server load increases with every dashboard refresh

### Preferred Alternative
Create projectors that maintain read-optimized delivery status views. Query the projector's read model, not the event store.

```php
// Wrong: querying event store directly
function getDeliveryStatus(string $webhookId): ?string {
    $events = StoredEvent::where('aggregate_uuid', $webhookId)
        ->orderBy('id')
        ->get();
    // Manually apply events to compute state — O(n), slow
    return computeStateFromEvents($events);
}

// Correct: use projector's read model
class WebhookDeliveryProjector extends Projector {
    public function onWebhookDeliveryAttempted(WebhookDeliveryAttempted $event): void {
        WebhookDeliveryStatus::updateOrCreate(
            ['aggregate_uuid' => $event->aggregateUuid()],
            ['status' => 'pending', 'last_attempt' => $event->attempt]
        );
    }
}

// Query the read model
function getDeliveryStatus(string $webhookId): ?string {
    return WebhookDeliveryStatus::where('aggregate_uuid', $webhookId)
        ->value('status'); // O(1), indexed
}
```

### Refactoring Strategy
1. Create projectors for all common delivery status queries
2. Identify all direct event store queries in the codebase and replace them with projector queries
3. Add indexes on projector read model tables for efficient querying
4. Remove direct event store query access from application code (admin/replay operations excluded)
5. Monitor event store query patterns to catch new direct queries

### Detection Checklist
- [ ] Projectors maintain read models for all query patterns
- [ ] No direct event store queries exist in application code
- [ ] Dashboard and API queries use projector read models
- [ ] Query response time is O(1), not O(n) over events
- [ ] Event schema changes do not affect query code

### Related Rules/Skills/Trees
- Rule: Use projectors for read models, not querying the event store directly
- Rule: Use projectors for delivery status views, not direct event store queries
- Related KU: CQRS (Command Query Responsibility Segregation)

---

## Anti-Pattern 5: Synchronous Reactors Blocking the Projection Pipeline

### Category
Performance

### Description
Running reactors (side-effect handlers) synchronously in the event processing pipeline, so that slow reactor execution (email sending, API calls) blocks projector updates and event processing.

### Why It Happens
The simplest event sourcing setup processes events sequentially: event → projector → reactor → next event. Developers add reactor logic without considering that it should be asynchronous.

### Warning Signs
- Reactors make external API calls or send emails synchronously
- Event processing throughput drops when reactors are slow
- Projector updates are delayed by reactor execution time
- Queuing system is not used for reactor tasks
- Reactor failures block further event processing

### Why Harmful
Synchronous reactors couple event processing speed to reactor execution speed. If a reactor sends an email (500ms) and another makes an API call (1s), processing a 100-event batch takes 150 seconds instead of milliseconds. This creates a bottleneck that cascades: projector updates lag, event processing slows, and the entire system falls behind.

### Real-World Consequences
- Payment webhook event triggers a reactor that sends Slack notification (2 seconds)
- Event processing pipeline blocks for 2 seconds per payment webhook
- 1,000 payment webhooks received during peak; processing takes 33 minutes
- Projector updates are 33 minutes behind; dashboard shows stale data
- Provider retries because HTTP response took too long (anti-pattern 1)

### Preferred Alternative
Keep reactors asynchronous by dispatching their work to a queue. Reactors should record the intent and return immediately.

```php
// Wrong: synchronous reactor
class NotificationReactor extends Reactor {
    public function onPaymentReceived(PaymentReceived $event): void {
        Mail::send(new PaymentNotification($event)); // 500ms blocking call
    }
}

// Correct: async reactor
class NotificationReactor extends Reactor {
    public function onPaymentReceived(PaymentReceived $event): void {
        // Dispatch to queue — returns immediately
        SendPaymentNotification::dispatch($event->aggregateUuid());
    }
}

// Queue worker handles the actual side effect
class SendPaymentNotification implements ShouldQueue {
    public function handle(): void {
        Mail::send(new PaymentNotification(/* ... */));
    }
}
```

### Refactoring Strategy
1. Identify all reactors performing synchronous I/O (email, API calls, file writes)
2. Replace synchronous calls with queued job dispatches
3. Configure dedicated queue for reactor jobs (separate from event processing queue)
4. Implement retry with backoff for reactor queue jobs
5. Monitor reactor queue backlog and processing time

### Detection Checklist
- [ ] Reactors dispatch to queue, not execute I/O directly
- [ ] Reactor failure does not block event processing pipeline
- [ ] Reactor queue has dedicated workers separate from event processing
- [ ] Projector updates are not delayed by reactor execution
- [ ] Event processing throughput is independent of reactor speed

### Related Rules/Skills/Trees
- Rule: Keep reactors async (queued) to avoid slowing the projection pipeline
- Rule: Reactors for cross-cutting concerns (alerts, metrics, reconciliation)
- Related KU: Queue management for async processing
