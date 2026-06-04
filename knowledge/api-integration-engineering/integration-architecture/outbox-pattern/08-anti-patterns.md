# Anti-Patterns: Outbox Pattern

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit | Outbox Pattern |
| Difficulty | Advanced |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Dispatching Webhooks Outside the Business Transaction | Reliability | Critical |
| 2 | Piggybacking Outbox Records on Business Tables | Architecture | High |
| 3 | No Idempotency in Outbox Relay Processing | Reliability | Critical |
| 4 | Polling Without Index Strategy | Performance | Medium |
| 5 | Not Monitoring Outbox Relay Lag | Observability | Medium |

---

## Anti-Pattern 1: Dispatching Webhooks Outside the Business Transaction

### Category
Reliability

### Description
Dispatching webhooks (via HTTP, queue, or event) directly from business logic without using the outbox pattern, so that a process crash after the business operation but before webhook dispatch causes the webhook to be lost permanently.

### Why Happens
In-memory dispatch after a business operation succeeds is the simplest pattern. Developers dispatch events via Laravel's event system or queue directly after committing the database transaction, assuming the dispatch will succeed.

### Warning Signs
- Webhooks are dispatched in the controller or service after `DB::commit()`
- No outbox table exists in the database schema
- Business operations that should trigger webhooks occasionally don't deliver them
- Customer reports "I received a confirmation but no webhook was sent"
- Process crash during peak hours results in unrecoverable webhook loss

### Why Harmful
If the process crashes between `DB::commit()` and the webhook dispatch, the business operation is committed but the webhook is lost. This breaks the guarantee that business state changes are always communicated to downstream systems. For payment confirmations, account changes, or compliance events, this loss is unrecoverable.

### Real-World Consequences
- Payment processed, invoice created, but webhook to accounting system never sent
- Account status changed to "active" but webhook to CRM never dispatched
- Compliance event recorded in local database but webhook to auditor never delivered
- Manual reconciliation required to fix each gap; hundreds of gaps accumulate

### Preferred Alternative
Use the transactional outbox pattern: create the outbox record within the same database transaction as the business operation. A separate relay process reads and dispatches outbox records asynchronously.

```php
DB::transaction(function () use ($order, $paymentData) {
    $order->update(['status' => 'paid', 'paid_at' => now()]);
    
    // Outbox record in the same transaction
    WebhookOutbox::create([
        'event_type' => 'order.paid',
        'payload' => ['order_id' => $order->id, 'amount' => $paymentData->amount],
        'status' => 'pending',
    ]);
});
// If this point is reached, both the order update AND the outbox record are committed.
// The relay process handles actual webhook dispatch asynchronously.
```

### Refactoring Strategy
1. Create `webhook_outbox` table with columns: `event_type`, `payload`, `status`, `attempts`, `scheduled_at`
2. Replace all direct webhook dispatch calls with outbox record creation in the same transaction
3. Implement outbox relay (scheduled Artisan command or queue worker) to dispatch pending records
4. Add monitoring: if outbox records accumulate without being dispatched, alert
5. Remove old direct dispatch code after verifying relay is working

### Detection Checklist
- [ ] Outbox record is created in the same transaction as the business operation
- [ ] No webhook dispatch happens before `DB::commit()`
- [ ] Process crash after commit does not lose any webhook
- [ ] Relay processes outbox records and dispatches webhooks
- [ ] Monitoring tracks outbox relay health and lag

### Related Rules/Skills/Trees
- Rule: Always create outbox record in the same database transaction as the triggering operation
- Rule: Process crash before relay does not lose outbox records
- Related KU: Inbox Pattern (receiver-side complement)

---

## Anti-Pattern 2: Piggybacking Outbox Records on Business Tables

### Category
Architecture

### Description
Storing outbox-related data in business tables (adding webhook status columns to orders, payments, etc.) instead of using a dedicated outbox table, mixing operational data with webhook delivery data.

### Why Happens
It feels natural to add a `webhook_sent_at` column to the order table or a `notified` flag to the payment record. Developers think of webhook dispatch as a property of the business entity rather than a separate concern.

### Warning Signs
- Business tables have columns like `webhook_sent_at`, `outbox_status`, `webhook_attempts`
- Querying pending webhooks requires joining across multiple business tables
- Adding new webhook events requires adding columns to business tables
- Outbox monitoring is scattered across different table queries
- Relay logic is duplicated per business entity (OrderWebhookRelay, PaymentWebhookRelay)

### Why Harmful
Piggybacking couples webhook delivery state to business domain models. Business schema changes (renaming a table, splitting an aggregate) break the webhook delivery mechanism. Monitoring and debugging require checking multiple business tables. Adding new webhook types requires schema changes to multiple tables.

### Real-World Consequences
- Adding a new "subscription.cancelled" webhook requires adding columns to the subscriptions table
- Schema migration to rename `orders` table requires updating outbox logic too
- Monitoring dashboard shows 6 different queries to get total pending webhook count
- Developer new to the team doesn't know which tables have outbox columns
- Relay code for each entity is duplicated with subtle differences

### Preferred Alternative
Use a dedicated outbox table with a generic schema that handles all webhook types.

```php
// Clean: dedicated outbox table
Schema::create('webhook_outbox', function (Blueprint $table) {
    $table->id();
    $table->string('event_type');          // 'order.paid', 'subscription.cancelled'
    $table->json('payload');               // Generic JSON payload
    $table->json('headers')->nullable();   // Custom headers per event type
    $table->string('status')->default('pending'); // pending, processing, sent, failed
    $table->unsignedTinyInteger('attempts')->default(0);
    $table->timestamp('scheduled_at')->nullable();
    $table->timestamp('processed_at')->nullable();
    $table->timestamps();
    
    $table->index(['status', 'scheduled_at']);
});
```

### Refactoring Strategy
1. Create dedicated `webhook_outbox` table
2. Migrate existing outbox data from business tables into the dedicated table
3. Remove outbox columns from all business tables
4. Make relay logic generic (event_type → subscriber resolution)
5. Update monitoring to query single outbox table

### Detection Checklist
- [ ] A single dedicated webhook_outbox table exists
- [ ] Business tables have no webhook-related columns
- [ ] Adding a new webhook type requires no schema changes
- [ ] Relay reads from a single table, not multiple business tables
- [ ] Monitoring queries one table for outbox health

### Related Rules/Skills/Trees
- Rule: Use a dedicated outbox table, not piggybacking on business tables
- Rule: Index status and scheduled_at for efficient relay queries
- Related KU: Database transactions and table normalization

---

## Anti-Pattern 3: No Idempotency in Outbox Relay Processing

### Category
Reliability

### Description
The outbox relay process does not implement idempotency, so relay reprocessing (after crash or during batch failure) can dispatch duplicate webhooks for the same outbox record.

### Why Happens
The relay processes outbox records one by one, marking them as "sent" after dispatch. Developers assume marking as sent is sufficient and don't prepare for the case where the relay crashes after webhook dispatch but before the status update.

### Warning Signs
- Outbox relay has no idempotency key in webhook dispatch requests
- Relay crash between HTTP response and database update causes duplicate dispatch
- Subscribers receive duplicate webhooks during normal operation
- No `webhook-id` or idempotency header in dispatched webhooks
- Relay recovery after crash re-dispatches already-sent records

### Why Harmful
The outbox relay crash window (between successful HTTP dispatch and status update) means any relay failure causes duplicate webhook delivery. For idempotent subscribers this is wasteful; for non-idempotent subscribers it causes duplicate processing (double charges, duplicate notifications).

### Real-World Consequences
- Relay crashes after POST to subscriber succeeds but before marking as sent
- Relay restarts and dispatches the same outbox record again
- Subscriber receives duplicate webhook; if not idempotent, customer is double-charged
- During batch relay of 100 records, a crash at record 75 causes records 1-74 to be re-dispatched on restart
- Subscribers complain about duplicate webhook volume during deployment/restart cycles

### Preferred Alternative
Include a unique idempotency key (webhook-id per Standard Webhooks spec) in every dispatched webhook. Subscribers can use this for deduplication. Additionally, use atomic status updates in the relay.

```php
class OutboxRelay {
    public function dispatchPending(): void {
        WebhookOutbox::where('status', 'pending')
            ->where('scheduled_at', '<=', now())
            ->chunk(100, function ($records) {
                foreach ($records as $record) {
                    // Atomic status update prevents re-dispatch
                    $dispatched = WebhookOutbox::where('id', $record->id)
                        ->where('status', 'pending')
                        ->update(['status' => 'dispatching']);
                    
                    if (!$dispatched) continue; // Already claimed by another worker
                    
                    try {
                        Http::withHeaders([
                            'webhook-id' => $record->id,
                            'Content-Type' => 'application/json',
                        ])->post($record->subscriber_url, $record->payload);
                        
                        $record->update(['status' => 'sent', 'processed_at' => now()]);
                    } catch (\Exception $e) {
                        $record->increment('attempts');
                        $record->update(['status' => 'pending']);
                    }
                }
            });
    }
}
```

### Refactoring Strategy
1. Add idempotency key (webhook-id) to every outbound webhook header
2. Implement atomic status update (pending → dispatching) to prevent duplicate relay
3. Add relay recovery test: crash mid-batch and verify no duplicates on restart
4. Monitor duplicate dispatch rate (should be zero after fix)
5. Document subscriber idempotency requirements

### Detection Checklist
- [ ] Outbound webhooks include webhook-id idempotency header
- [ ] Outbox relay uses atomic status updates to prevent re-dispatch
- [ ] Relay crash recovery does not produce duplicate webhooks
- [ ] Duplicate dispatch rate is monitored and is zero
- [ ] Subscriber idempotency is documented

### Related Rules/Skills/Trees
- Rule: Implement idempotency key on outbox records for safe relay processing
- Rule: Idempotency prevents duplicate delivery from relay reprocessing
- Related KU: Standard Webhooks Specification (idempotency headers)

---

## Anti-Pattern 4: Polling Without Index Strategy

### Category
Performance

### Description
The outbox relay polls for pending records using queries that are not properly indexed, causing table scans that degrade as the outbox table grows.

### Why Happens
In early stages, the outbox table is small and queries are fast regardless of indexing. As the table grows, the unpredicated or poorly-indexed query becomes slower, but the degradation is gradual.

### Warning Signs
- Relay query `WHERE status = 'pending'` takes progressively longer
- No index on `status` column exists
- Database slow query log shows the relay query as a frequent slow query
- Relay polling interval is manually increased to "reduce database load"
- Index recommendation from database monitoring is not implemented

### Why Harmful
As the outbox table grows to millions of records, unindexed queries require full table scans. Relay cycles take longer, increasing the lag between business operation and webhook dispatch. The relay may miss its SLO target for delivery latency.

### Real-World Consequences
- Outbox table has 2M records (mostly processed); relay query takes 8 seconds
- Relay cycle time exceeds 5 minutes, violating 1-minute delivery SLO
- Database CPU spikes every time the relay runs
- Increasing relay polling interval makes the problem worse (more records pile up)
- Emergency index addition during production hours requires planned downtime

### Preferred Alternative
Ensure the outbox table has a composite index on `(status, scheduled_at)` for efficient relay queries.

```php
Schema::table('webhook_outbox', function (Blueprint $table) {
    $table->index(['status', 'scheduled_at']); // Efficient relay query
});
```

### Refactoring Strategy
1. Review the relay query and add necessary indexes
2. Prefer composite index on `(status, scheduled_at)` for scheduled dispatch queries
3. Add index on `(status, created_at)` for FIFO processing
4. Verify index usage via `EXPLAIN` on the relay query
5. Monitor query performance after index addition

### Detection Checklist
- [ ] Composite index on (status, scheduled_at) exists
- [ ] Relay query uses index (verified by EXPLAIN)
- [ ] Relay cycle time is stable as table grows
- [ ] No full table scans in relay query
- [ ] Index maintenance is included in regular DBA tasks

### Related Rules/Skills/Trees
- Rule: Index outbox table on status and created_at for efficient relay queries
- Rule: Index status and scheduled_at for efficient relay queries
- Related KU: Database indexing best practices

---

## Anti-Pattern 5: Not Monitoring Outbox Relay Lag

### Category
Observability

### Description
Running the outbox relay without monitoring its health, lag, failure rate, or throughput, so relay degradation goes undetected until webhook delivery SLOs are breached.

### Why Happens
The relay is a background process that is assumed to work reliably. Developers monitor business metrics (orders, payments) but not the infrastructure that communicates those events to external systems.

### Warning Signs
- No monitoring for outbox relay lag (oldest unprocessed record age)
- No alert for outbox records accumulating past threshold
- Webhook delivery SLOs have no real-time visibility
- Relay failures are discovered by subscriber complaints
- No dashboard showing outbox relay health

### Why Harmful
If the relay stops processing (due to a crash, queue backlog, or configuration error), webhooks stop being delivered. Without monitoring, this goes unnoticed until subscribers report missing webhooks. The outage duration is measured in hours, not minutes.

### Real-World Consequences
- Relay queue worker crashes at 2 AM; no webhooks delivered for 8 hours
- Morning report shows 50,000 undelivered outbox records
- Subscribers report missing payment notifications; operations team unaware
- SLA breach: webhook delivery latency exceeds 4-hour SLO
- Recovery requires manual review of which webhooks were delivered after restart vs. permanently lost

### Preferred Alternative
Implement outbox relay monitoring: track lag (age of oldest pending record), throughput (records dispatched per minute), failure rate, and alert on thresholds.

```php
// Monitoring middleware in relay
class MonitoredOutboxRelay extends OutboxRelay {
    public function dispatchPending(): void {
        $oldestPending = WebhookOutbox::where('status', 'pending')
            ->where('scheduled_at', '<=', now())
            ->oldest()
            ->first();
        
        if ($oldestPending) {
            $lag = now()->diffInMinutes($oldestPending->scheduled_at);
            Monitor::gauge('outbox.relay.lag_minutes', $lag);
            
            if ($lag > 60) {
                Notification::alert('outbox.relay.lag_high', [
                    'lag_minutes' => $lag,
                    'oldest_record_id' => $oldestPending->id,
                ]);
            }
        }
        
        $pendingCount = WebhookOutbox::where('status', 'pending')->count();
        Monitor::gauge('outbox.relay.pending_count', $pendingCount);
        
        if ($pendingCount > 10000) {
            Notification::alert('outbox.relay.backlog', [
                'pending_count' => $pendingCount,
            ]);
        }
        
        parent::dispatchPending();
    }
}
```

### Refactoring Strategy
1. Add monitoring metrics: outbox lag (minutes), pending count, dispatch rate, failure rate
2. Set alerts: lag > 15 min (warning), lag > 60 min (critical)
3. Add relay health dashboard showing real-time outbox processing status
4. Monitor relay worker process health (process up, memory, queue depth)
5. Add automated recovery: restart relay worker if no progress for N minutes

### Detection Checklist
- [ ] Outbox relay lag is monitored (oldest pending record age)
- [ ] Pending record count is tracked and alerted
- [ ] Dispatch throughput and failure rate are measured
- [ ] Alert exists for relay lag exceeding SLO threshold
- [ ] Dashboard shows outbox relay health in real-time

### Related Rules/Skills/Trees
- Rule: Monitor outbox relay health (pending count, oldest pending age)
- Rule: Archive processed records on schedule
- Related KU: Webhook Delivery SLOs and monitoring
