# Anti-Patterns: Inbox Pattern

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit | Inbox Pattern |
| Difficulty | Advanced |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Processing Webhooks Synchronously Without Inbox | Reliability | Critical |
| 2 | Single-Column Unique Constraint Without Provider Namespace | Architecture | High |
| 3 | Dispatching Queue Job Before Inbox Write | Reliability | Critical |
| 4 | No Dead Letter Handling for Stuck Inbox Records | Observability | Medium |
| 5 | Never Pruning Processed Inbox Records | Maintenance | Medium |

---

## Anti-Pattern 1: Processing Webhooks Synchronously Without Inbox

### Category
Reliability

### Description
Processing incoming webhook payloads immediately in the HTTP request handler without storing them in an inbox table first, coupling the provider's response timeout to business logic execution time.

### Why It Happens
Synchronous processing is the simplest implementation. For low-volume webhooks where business logic is fast (under 1 second), it works without issues for extended periods.

### Warning Signs
- Webhook controller calls business services directly before returning HTTP 200
- HTTP response time for webhook endpoint exceeds provider timeout
- Business logic failures return HTTP 5xx to provider, causing unnecessary retries
- No inbox table exists in the database schema
- Provider retries attempt to reprocess slow/crashed requests from scratch

### Why Harmful
Synchronous processing risks the provider's HTTP timeout. If business logic takes longer than the provider's timeout (Stripe: 5s), the provider retries, potentially creating duplicate processing. A single slow database query or external API call causes retry storms. Process crashes during processing lose the webhook entirely.

### Real-World Consequences
- Payment webhook takes 6 seconds due to external API call; Stripe times out at 5s
- Stripe retries 5 times; same slow API called 5 times, increasing latency further
- PHP-FPM process crashes mid-processing; webhook is lost permanently
- Retry storm during peak hours exhausts database connection pool

### Preferred Alternative
Use the inbox pattern: store the webhook payload in an inbox table with a unique constraint on `(provider, webhook_id)`, return HTTP 200 immediately, then process asynchronously via a queue job.

```php
class WebhookController extends Controller {
    public function handle(Request $request, string $provider): Response {
        $payload = $request->getContent();
        $webhookId = $request->header('webhook-id') ?? $request->input('id');
        
        try {
            $inbox = WebhookInbox::create([
                'provider' => $provider,
                'webhook_id' => $webhookId,
                'payload' => $payload,
                'headers' => $request->headers->all(),
                'status' => 'pending',
            ]);
        } catch (UniqueConstraintViolationException $e) {
            return response()->json(['status' => 'duplicate'], 200);
        }
        
        ProcessWebhookJob::dispatch($inbox->id);
        return response()->json(['status' => 'queued'], 200);
    }
}
```

### Refactoring Strategy
1. Create `webhook_inbox` table with unique index on `(provider, webhook_id)`
2. Extract business logic from controller into a queued job
3. Controller only verifies signature, creates inbox record, dispatches job
4. Job reads inbox record, processes, and marks as processed
5. Test provider retry scenarios to confirm duplicate detection works

### Detection Checklist
- [ ] Inbox table with unique constraint on (provider, webhook_id) exists
- [ ] Webhook controller returns HTTP 200 immediately after inbox write
- [ ] Business logic is in a queue job processing inbox records
- [ ] Duplicate webhook IDs return 200 without reprocessing
- [ ] Provider timeout is never exceeded

### Related Rules/Skills/Trees
- Rule: Create inbox record before dispatching the processing job
- Rule: Async processing removes processing time from HTTP response path
- Related KU: Outbox Pattern (sender-side complement)

---

## Anti-Pattern 2: Single-Column Unique Constraint Without Provider Namespace

### Category
Architecture

### Description
Using only the webhook ID as the unique constraint in the inbox table without including the provider as part of the constraint, allowing ID collisions between different providers.

### Why Happens
Each provider's webhook IDs appear unique within their own system. Developers don't anticipate collisions because IDs like `evt_123abc` from Stripe don't look like they'd collide with Adyen's IDs.

### Warning Signs
- Inbox table has unique index on `webhook_id` only
- Two providers both send a webhook with the same ID value
- Second provider's webhook is silently rejected as "duplicate"
- No provider column in the inbox table
- Unique violation errors in logs without provider context

### Why Harmful
Different providers can issue the same webhook ID value (e.g., both could generate `evt_001` or UUID-based IDs that could theoretically collide). A single-column constraint causes the second provider's legitimate webhook to be rejected as a duplicate of the first provider's webhook, silently dropping events.

### Real-World Consequences
- Stripe sends `evt_abc123`; Adyen sends `evt_abc123` hours later
- Adyen's webhook is rejected as duplicate with no alert
- Adyen payment never processed; customer not credited
- Reconciliation job ultimately finds the mismatch, but manual intervention required

### Preferred Alternative
Use a composite unique constraint on `(provider, webhook_id)` to namespace each provider's IDs independently.

```php
// Migration
Schema::create('webhook_inbox', function (Blueprint $table) {
    $table->id();
    $table->string('provider');          // 'stripe', 'adyen', 'braintree'
    $table->string('webhook_id');        // Provider's event ID
    $table->text('payload');
    $table->json('headers');
    $table->string('status')->default('pending');
    $table->timestamp('processed_at')->nullable();
    $table->timestamps();
    
    // Unique constraint scoped by provider
    $table->unique(['provider', 'webhook_id']);
});
```

### Refactoring Strategy
1. Add `provider` column to the inbox table if missing
2. Change unique constraint from single-column to composite `(provider, webhook_id)`
3. Update all inbox writes to include the provider identifier
4. Check for existing data: are there any false duplicates between providers?
5. Add monitoring for duplicate attempts per provider (legitimate duplicates)

### Detection Checklist
- [ ] Unique constraint includes provider + webhook_id
- [ ] Provider is explicitly set on every inbox insert
- [ ] Two providers with identical webhook IDs are both accepted
- [ ] Duplicate detection works independently per provider
- [ ] Provider namespace is logged in duplicate detection events

### Related Rules/Skills/Trees
- Rule: Use webhook ID + provider name as the unique constraint
- Rule: Inbox table has unique constraint on (provider, webhook_id)
- Related KU: Webhook Receiving (multi-provider architecture)

---

## Anti-Pattern 3: Dispatching Queue Job Before Inbox Write

### Category
Reliability

### Description
Dispatching the webhook processing queue job before (or without) creating the inbox record, breaking the exactly-once guarantee.

### Why Happens
The code path dispatches the job during the HTTP request, and the inbox write may happen inside the job. This is a natural ordering for developers thinking "receive → process" rather than "store → process."

### Warning Signs
- Queue job is dispatched from controller before any database write
- Inbox record is created inside the processing job, not in the HTTP handler
- Processing starts before storage is guaranteed
- If the HTTP response fails after job dispatch but before inbox write, the job runs without an inbox record
- Job retries fail because the inbox record was never created

### Why Harmful
If the server crashes after the job is dispatched but before the inbox record is committed to the database, the job will execute without an inbox record. It may process the webhook, but the inbox table has no trace of it, breaking audit and exactly-once semantics. If the same webhook arrives again (provider retry), it will be processed again as a new event.

### Real-World Consequences
- Server crashes between job dispatch and inbox INSERT; job processes the webhook
- Provider retries the webhook 30 seconds later; a new inbox record is created
- Second job runs and processes the duplicate; the business operation is executed twice
- Exactly-once guarantee is violated: customer receives two payments
- Audit trail shows only one inbox record, but the operation happened twice

### Preferred Alternative
Always create the inbox record within the database transaction BEFORE dispatching the queue job. The job should read from the inbox record, not accept the payload directly.

```php
// Correct order
DB::beginTransaction();
$inbox = WebhookInbox::create([/* ... */]);
DB::commit();

// Only now dispatch the job
ProcessWebhookJob::dispatch($inbox->id);
```

### Refactoring Strategy
1. Audit all webhook handlers to verify inbox write happens before job dispatch
2. Move inbox creation into the controller (HTTP request path) if inside jobs
3. Ensure inbox record creation is committed before job is dispatched
4. Add job input validation: verify inbox record exists before processing
5. Add monitoring for jobs with missing inbox records (should be zero)

### Detection Checklist
- [ ] Inbox record is created and committed before job dispatch
- [ ] Job reads inbox record by ID; does not accept raw payload directly
- [ ] Inbox write and job dispatch are not in the same DB transaction
- [ ] Crash between inbox write and job dispatch produces orphaned inbox record (manual recovery)
- [ ] Crash between inbox write and job dispatch does NOT cause duplicate processing

### Related Rules/Skills/Trees
- Rule: Create inbox record before dispatching the processing job
- Rule: Inbox record created in HTTP request; processing done by queue job
- Related KU: Exactly-once semantics (idempotency key pattern)

---

## Anti-Pattern 4: No Dead Letter Handling for Stuck Inbox Records

### Category
Observability

### Description
Allowing inbox records that repeatedly fail processing to remain in the inbox table without escalation, alerting, or manual intervention paths.

### Why Happens
Standard queue retry handles transient failures. Developers assume all failures are transient and don't plan for the case where a webhook cannot be processed (bad data, incompatible schema change, provider bug).

### Warning Signs
- Inbox records in "failed" status accumulate without monitoring
- No alerting on inbox records stuck in "pending" for >1 hour
- Queue job retries indefinitely with no max attempts or dead letter queue
- No manual review interface for failed inbox records
- Failed webhooks are invisible to operations teams

### Why Harmful
Stuck inbox records silently accumulate. A provider schema change causes all new webhooks to fail processing. Without dead letter handling, the failure goes unnoticed until customer impact. The queue worker wastes cycles on repeated retries of unprocessable events.

### Real-World Consequences
- Provider changes webhook payload format; all new webhooks fail validation
- Queue worker retries each failed webhook 10 times (default Laravel), consuming 10x processing capacity
- 10,000 stuck inbox records after 24 hours; recovery requires manual cleanup
- Customer complaints reveal the issue; operations team had no alert
- Manual reprocessing requires figuring out which records are dead vs. transient

### Preferred Alternative
Implement dead letter handling: after max retries, move the inbox record to a dead letter queue or flag it for manual review. Alert on stuck records exceeding thresholds.

```php
class ProcessWebhookJob implements ShouldQueue {
    public int $maxAttempts = 5;
    
    public function handle(): void {
        try {
            // Process webhook
            $this->inbox->update(['status' => 'processed', 'processed_at' => now()]);
        } catch (\Exception $e) {
            $this->inbox->increment('attempts');
            if ($this->inbox->attempts >= $this->maxAttempts) {
                $this->inbox->update(['status' => 'dead_letter']);
                Log::critical('Webhook permanently failed', [
                    'inbox_id' => $this->inbox->id,
                    'provider' => $this->inbox->provider,
                    'error' => $e->getMessage(),
                ]);
                Notification::alert('webhook.dead_letter', $this->inbox);
            }
            throw $e; // Continue retry until max attempts
        }
    }
}
```

### Refactoring Strategy
1. Add `attempts` column and `status` options (`dead_letter`) to inbox table
2. Add dead letter transition after max retries (not infinite retry)
3. Create alert for inbox records in dead_letter status
4. Build admin UI or Artisan command for manual dead letter review/reprocess
5. Add monitoring dashboard showing inbox age and status distribution

### Detection Checklist
- [ ] Max retry attempts are configured for inbox processing jobs
- [ ] Dead letter status exists for permanently failed records
- [ ] Alert triggers when dead letter count exceeds threshold
- [ ] Manual review UI or command exists for dead letter records
- [ ] Monitoring tracks inbox age per status

### Related Rules/Skills/Trees
- Rule: Stuck unprocessed records trigger alerting
- Rule: Dead letter queue after max retries exceeded
- Related KU: Webhook Retry Logic (dead letter patterns)

---

## Anti-Pattern 5: Never Pruning Processed Inbox Records

### Category
Maintenance

### Description
Keeping all processed inbox records in the table indefinitely without a cleanup strategy, causing unbounded table growth and degrading query performance over time.

### Why Happens
Processed records are out of sight, out of mind. The inbox table grows slowly, and performance degradation is gradual. Developers don't notice until queries take seconds.

### Warning Signs
- Inbox table size grows every month with no cleanup mechanism
- Queries on the inbox table become progressively slower
- Index rebuilds take longer with each deployment
- Storage costs for the inbox table are non-zero and growing
- No archive or retention policy exists for processed records

### Why Harmful
Unbounded table growth degrades query performance for all operations: unique constraint checks on new inserts, status queries for monitoring, and any administrative operations. Large tables increase backup size and restoration time. Storage costs accumulate for data that has no value after the compliance retention period.

### Real-World Consequences
- Inbox table has 50M records after 2 years; inserts take 50ms (index overhead)
- Monitoring query "count pending inbox records" takes 30 seconds
- Database backup takes 2 hours instead of 30 minutes
- Compliance retention only requires 90 days but all records are kept
- Pruning 45M records during maintenance window requires 4-hour downtime

### Preferred Alternative
Implement a retention-based cleanup strategy: processed records are archived or deleted after a defined retention period (e.g., 90 days for compliance, or 30 days for standard webhooks).

```php
// Scheduled cleanup command
class PruneInboxRecords extends Command {
    public function handle(): void {
        $retentionDays = config('webhooks.inbox_retention_days', 90);
        
        $deleted = WebhookInbox::where('status', 'processed')
            ->where('processed_at', '<', now()->subDays($retentionDays))
            ->delete();
        
        Log::info("Pruned {$deleted} processed inbox records");
    }
}
```

### Refactoring Strategy
1. Define retention policy per webhook type (critical: longer, standard: shorter)
2. Add scheduled Artisan command for pruning processed records
3. Implement archiving to cold storage for compliance-critical data
4. Add monitoring for inbox table size and prune effectiveness
5. Communicate retention policy to compliance/audit teams

### Detection Checklist
- [ ] Retention policy is defined and documented
- [ ] Scheduled pruning job exists and runs regularly
- [ ] Processed records are deleted/archived after retention period
- [ ] Monitoring tracks inbox table size trend
- [ ] Compliance retention requirements are met by archive strategy

### Related Rules/Skills/Trees
- Rule: Inbox table pruning for processed records prevents growth
- Rule: TTL-based cleanup of processed records
- Related KU: Webhook Payload Storage (retention and archiving)
