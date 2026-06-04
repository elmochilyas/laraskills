# Anti-Patterns: Fintech-Grade Webhook SLAs and SLOs (Stripe, Adyen Patterns)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit | Fintech-Grade Webhook SLAs and SLOs (Stripe, Adyen Patterns) |
| Difficulty | Expert |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | At-Most-Once Delivery for Financial Events | Reliability | Critical |
| 2 | No Reconciliation Process | Reliability | Critical |
| 3 | Processing Webhooks Synchronously in HTTP Request | Architecture | High |
| 4 | Assuming Webhooks Arrive in Order | Reliability | High |
| 5 | Single Idempotency TTL for All Providers | Architecture | Medium |

---

## Anti-Pattern 1: At-Most-Once Delivery for Financial Events

### Category
Reliability

### Description
Designing webhook processing for at-most-once delivery semantics for financial transactions, accepting that webhooks may be lost without detection or recovery.

### Why It Happens
HTTP requests feel transactional by default. Developers assume if a webhook request arrives, all previous ones arrived too, and if processing succeeds, no further action is needed.

### Warning Signs
- Webhook handler does not implement idempotency
- No retry logic for failed webhook processing
- Provider webhook delivery failures (network, 5xx) result in permanent data loss
- No mechanism to detect missing webhooks (no reconciliation)
- SLA breaches are detected by customer complaints, not monitoring

### Why Harmful
Financial events cannot be lost. At-most-once delivery means any network hiccup, process crash, or provider-side delivery failure results in permanent data loss. Without idempotency, retries cause duplicate processing that corrupts financial records.

### Real-World Consequences
- A Stripe webhook fails due to a network blip; the $10,000 payment is never credited to the customer account
- Reconciliation finds the payment in Stripe but not in the local system; requires manual adjustment
- Audit compliance failure: webhook delivery rate is 99.5% but fintech requires 99.99%
- Customer disputes are lost: no webhook record means no evidence of delivery

### Preferred Alternative
Design for at-least-once delivery with idempotent webhook processing. Every webhook handler must be idempotent using the provider's event ID as the idempotency key.

```php
class WebhookHandler {
    public function handle(Request $request): Response {
        $eventId = $request->header('Stripe-Signature')
            ? $request->input('data.object.id')
            : $request->input('id');
        
        // Idempotency check
        if (ProcessedWebhook::where('provider_event_id', $eventId)->exists()) {
            return response()->json(['status' => 'already_processed'], 200);
        }
        
        DB::beginTransaction();
        try {
            ProcessedWebhook::create(['provider_event_id' => $eventId]);
            // Process the event...
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e; // Will trigger provider retry
        }
    }
}
```

### Refactoring Strategy
1. Add idempotency key to every webhook handler (use provider event ID)
2. Implement idempotency store (Redis or database) with provider-appropriate TTL
3. Change retry configuration to expect at-least-once delivery
4. Add monitoring for duplicate detection rates (should be near-zero but known)
5. Audit all financial webhook handlers for idempotency completeness

### Detection Checklist
- [ ] Every fintech webhook handler is idempotent
- [ ] Idempotency store TTL matches provider's retry window
- [ ] Duplicate webhooks are detected and silently accepted (not errors)
- [ ] At-least-once delivery is assumed in architecture documentation
- [ ] Monitoring tracks duplicate delivery rates per provider

### Related Rules/Skills/Trees
- Rule: Design for at-least-once delivery with idempotent processing
- Rule: Idempotent processing: webhook ID as idempotency key
- Related KU: Webhook Retry Logic (idempotency patterns)

---

## Anti-Pattern 2: No Reconciliation Process

### Category
Reliability

### Description
Relying entirely on webhook delivery for financial transaction processing without a reconciliation mechanism to detect missing or undelivered webhooks.

### Why It Happens
In early development, every webhook arrives correctly. The webhook processing path works perfectly, so the expense of building reconciliation seems unnecessary.

### Warning Signs
- No scheduled job that compares provider records (Stripe dashboard, Adyen reports) with local state
- Missing webhooks are only detected when customers complain
- No process to handle webhooks that arrive after the reconciliation window
- Manual reconciliation is performed reactively during incidents only

### Why Harmful
Even with reliable providers, webhooks can be lost. Provider outages, network partitions, and application failures can prevent delivery. Without reconciliation, these gaps silently accumulate. Over months, the gap between provider records and local state grows, requiring massive manual cleanup.

### Real-World Consequences
- 500 transactions processed by Stripe but never received as webhooks; customers not credited
- Accumulated unreconciled transactions over 6 months require 40 hours of manual cleanup
- Compliance audit fails: no reconciliation process means no guarantee of data completeness
- Customer churn from "lost payments" that were actually never processed locally

### Preferred Alternative
Implement a scheduled reconciliation job that compares provider records (via API or report) with local webhook processing records and flags mismatches.

```php
// Scheduled daily reconciliation
class PaymentReconciliationJob implements ShouldQueue {
    public function handle(): void {
        $providerTransactions = Stripe::allTransactions(now()->subDay());
        foreach ($providerTransactions as $txn) {
            $processed = ProcessedWebhook::where('provider_event_id', $txn->id)->exists();
            if (!$processed) {
                Log::warning('Unreconciled transaction', [
                    'provider' => 'stripe',
                    'transaction_id' => $txn->id,
                    'amount' => $txn->amount,
                ]);
                // Queue for manual review or automated reprocessing
                MissingWebhook::create(['provider' => 'stripe', 'event_id' => $txn->id]);
            }
        }
    }
}
```

### Refactoring Strategy
1. Identify provider data sources for reconciliation (Stripe API, Adyen reports)
2. Build reconciliation job that matches provider records with local webhook processing
3. Set reconciliation window to match provider's max retry horizon (Stripe: 3 days)
4. Add alerting on reconciliation mismatches exceeding threshold
5. Create manual reconciliation UI for flagged transactions
6. Test reconciliation recovery: simulate provider outage and verify catch-up

### Detection Checklist
- [ ] Reconciliation job runs daily (or per provider schedule)
- [ ] Reconciliation window matches provider's max retry duration
- [ ] Mismatches are alerted and queued for manual review
- [ ] Reconciliation coverage includes all financial webhook types
- [ ] Reconciliation recovery from provider outage is tested quarterly

### Related Rules/Skills/Trees
- Rule: Set reconciliation window to match max retry horizon
- Rule: Reconciliation job matching webhook events with local records
- Related KU: Fintech-grade webhook SLAs (reconciliation patterns)

---

## Anti-Pattern 3: Processing Webhooks Synchronously in HTTP Request

### Category
Architecture

### Description
Processing fintech webhook payloads immediately in the HTTP request handler, blocking the HTTP response until all business logic completes.

### Why Happens
It's the simplest implementation: receive the webhook, process it, return 200. For low-traffic integrations, this works without issues for months.

### Warning Signs
- Webhook controller contains business logic inline or called directly
- HTTP response time for webhook endpoint exceeds provider timeout (typically 5-10s)
- Queue workers are not used for webhook processing
- A slow external API call in webhook processing causes provider retries
- Retries from timeouts cause duplicate processing (without idempotency)

### Why Harmful
Fintech providers have strict webhook response timeouts (Stripe: 5 seconds). If processing exceeds this, the provider retries, causing duplicate work. Synchronous processing couples webhook receipt reliability to processing performance. A slow database query or external API call causes retry storms.

### Real-World Consequences
- Payment processing takes 3 seconds; provider times out at 5 seconds under load
- Provider retries flood the application during peak hours
- Idempotency store is hit thousands of times from retries of a single slow webhook
- Provider's webhook delivery rate drops because too many responses time out

### Preferred Alternative
Use queue-first architecture: acknowledge the webhook immediately (return 200), then dispatch the processing to a queue worker.

```php
class WebhookController extends Controller {
    public function handle(Request $request): Response {
        // Verify signature first
        $payload = $this->verifySignature($request);
        
        // Store raw payload
        $stored = StoredWebhook::create(['payload' => $payload]);
        
        // Dispatch to queue and return immediately
        ProcessWebhookJob::dispatch($stored->id);
        
        return response()->json(['status' => 'queued'], 200);
    }
}
```

### Refactoring Strategy
1. Extract webhook processing logic into a queued job
2. Controller only verifies signatures and dispatches the job
3. Configure separate queue for fintech webhooks with appropriate worker count
4. Add queue monitoring: job processing time, queue depth, failure rate
5. Implement retry with backoff for failed processing jobs

### Detection Checklist
- [ ] Webhook controller returns immediately after queuing
- [ ] Processing logic is in a queued job class
- [ ] Fintech webhooks have dedicated queue with sufficient workers
- [ ] Provider timeout is never exceeded
- [ ] Retry storms are prevented by fast HTTP acknowledgment

### Related Rules/Skills/Trees
- Rule: Queue-first architecture for all fintech webhooks
- Rule: Never assume ordering guarantees; process by event timestamp
- Related KU: Webhook Receiving (dedicated queue pattern)

---

## Anti-Pattern 4: Assuming Webhooks Arrive in Order

### Category
Reliability

### Description
Processing webhooks based on arrival order rather than event timestamp, assuming providers always deliver events in the sequence they occurred.

### Why It Happens
During normal operation, most webhooks do arrive in order. Developers build processing logic that increments counters, updates statuses, or applies state changes sequentially based on arrival.

### Warning Signs
- Event timestamp is not recorded or not used for ordering
- Processing logic assumes sequential state transitions ("succeeded must come after attempted")
- Out-of-order webhooks cause state corruption (refund processed before charge)
- No ordering compensation mechanism exists
- Testing only uses in-order webhook fixtures

### Why Harmful
Webhook retries, provider-side failures, and network delays routinely cause out-of-order delivery. A refund webhook can arrive before the corresponding charge webhook during provider recovery. Processing by arrival order applies state changes in the wrong sequence, corrupting financial records.

### Real-World Consequences
- Refund processed in local system before the charge exists; refund fails with "no matching charge"
- Subscription cancellation processed before subscription creation; state machine breaks
- Duplicate webhooks from retry arrive after the initial, causing incorrect state if not idempotent
- Financial reconciliation shows impossible sequences (credit before debit)

### Preferred Alternative
Process webhooks based on event timestamp, not arrival order. Record the timestamp and handle out-of-order delivery by deferring or reordering events.

```php
class WebhookProcessor {
    public function process(WebhookEvent $event): void {
        $eventTimestamp = $event->created; // Provider's timestamp
        $lastProcessed = Cache::get("last_event_time.{$event->aggregateId}");
        
        if ($lastProcessed && $eventTimestamp < $lastProcessed) {
            // Out-of-order event: queue for deferred processing
            DeferredEvent::create([
                'aggregate_id' => $event->aggregateId,
                'event' => $event,
                'timestamp' => $eventTimestamp,
            ]);
            return;
        }
        
        Cache::put("last_event_time.{$event->aggregateId}", $eventTimestamp);
        $this->applyEvent($event);
    }
}
```

### Refactoring Strategy
1. Record event timestamp from provider payload for all webhooks
2. Add ordering compensation: if event timestamp is older than last processed, defer or skip
3. Implement deferred event processing that re-orders events by timestamp
4. Add monitoring for out-of-order delivery rate per provider
5. Update tests to include out-of-order scenarios

### Detection Checklist
- [ ] Webhooks are processed by event timestamp, not arrival order
- [ ] Out-of-order detection and compensation is implemented
- [ ] Deferred events are re-processed in correct order
- [ ] Monitoring tracks out-of-order delivery rates
- [ ] State transitions are safe under any ordering (idempotent + compensation)

### Related Rules/Skills/Trees
- Rule: Never assume ordering guarantees; process by event timestamp
- Rule: Implement compensating transactions for late or duplicate webhook delivery
- Related KU: Event-Driven Architecture with Webhook Event Sourcing

---

## Anti-Pattern 5: Single Idempotency TTL for All Providers

### Category
Architecture

### Description
Using the same idempotency key TTL (time-to-live) for all providers, ignoring each provider's specific retry window and delivery guarantees.

### Why Happens
Idempotency is implemented once (often with a fixed 24-hour TTL that matches Stripe's `Idempotency-Key` window). All providers are handled by the same idempotency store without considering their different retry behaviors.

### Warning Signs
- Single idempotency TTL configuration for all integrations
- Idempotency store uses a single Redis key prefix regardless of provider
- Provider documentation shows different retry windows but code uses one TTL
- Webhooks from providers with longer retry windows cause duplicate processing
- Idempotency store grows with stale keys from providers with shorter windows

### Why Harmful
A single TTL is always wrong for all providers. Too short: duplicates from providers with longer retry windows are processed. Too long: storage grows unnecessarily, and idempotency keys from providers with shorter windows occupy space for no benefit.

### Real-World Consequences
- Adyen's configurable retry window exceeds the 24-hour TTL; duplicate webhooks are processed after TTL expiry
- Stripe's 3-day retry window means some legitimate retries are treated as new events after TTL expiry
- Idempotency store fills with stale Adyen keys when TTL is set to Stripe's 24 hours
- Duplicate payments processed during Adyen retry after idempotency key expires

### Preferred Alternative
Maintain per-provider idempotency TTLs matching each provider's retry window. Use separate Redis key namespaces for each provider.

```php
class IdempotencyService {
    private array $ttls = [
        'stripe' => 259200,  // 3 days (Stripe's retry window)
        'adyen' => 604800,   // 7 days (Adyen configurable window)
        'braintree' => 86400, // 24 hours
    ];
    
    public function isProcessed(string $provider, string $eventId): bool {
        $key = "idempotency:{$provider}:{$eventId}";
        return (bool) Cache::get($key);
    }
    
    public function markProcessed(string $provider, string $eventId): void {
        $key = "idempotency:{$provider}:{$eventId}";
        Cache::put($key, true, $this->ttls[$provider]);
    }
}
```

### Refactoring Strategy
1. Research each provider's documented retry window and idempotency behavior
2. Create per-provider idempotency TTL configuration
3. Add provider identifier to idempotency key namespace
4. Migrate existing idempotency store to per-provider keys
5. Add monitoring for idempotency key reuse (should never happen within TTL)

### Detection Checklist
- [ ] Each provider has its own idempotency TTL matching its retry window
- [ ] Idempotency keys are namespaced per provider
- [ ] TTL is explicitly configured, not using a system default
- [ ] Provider documentation is referenced for TTL values
- [ ] Idempotency key reuse events are monitored and alerted

### Related Rules/Skills/Trees
- Rule: Same idempotency store for all providers (different TTL requirements)
- Rule: Idempotent processing: webhook ID as idempotency key
- Related KU: Idempotency Key Pattern (TTL considerations)
