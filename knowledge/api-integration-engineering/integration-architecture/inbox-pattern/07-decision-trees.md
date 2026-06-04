# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 06-integration-architecture
**Knowledge Unit:** inbox-pattern
**Generated:** 2026-06-03

---

# Decision Inventory

1. Deduplication Strategy (Unique Constraint vs Application Logic)
2. Inbox Processing Strategy (Immediate vs Batched)
3. Dead Letter Handling Strategy

---

# Architecture-Level Decision Trees

---

## Deduplication Strategy

---

## Decision Context

Choosing the mechanism for deduplicating incoming webhook events.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Does the provider send a unique webhook ID with each delivery?
↓
YES → Use database unique constraint on (provider, webhook_id)
  ↓
  Do multiple providers share the same ID space?
  ↓
  YES → Composite unique constraint (provider, webhook_id) prevents collision
  NO → Single webhook_id unique constraint is sufficient
NO → Does the provider include a timestamp or sequence number?
  ↓
  YES → Use hash of (provider + event_type + timestamp) as dedup key
  NO → Implement idempotency key in application logic; risk of duplicates
  ↓
  Need to protect against concurrent duplicate inserts?
  ↓
  YES → Unique constraint + INSERT IGNORE or ON DUPLICATE KEY
  NO → Application-level check-then-insert has race condition

---

## Rationale

Database unique constraints provide guaranteed deduplication at the storage level. Composite keys prevent cross-provider collision. Concurrent protection prevents race conditions.

---

## Recommended Default

**Default:** Composite unique constraint on (provider, webhook_id) with ON DUPLICATE KEY
**Reason:** Database-level guaranteed deduplication; no race conditions; provider isolation

---

## Risks Of Wrong Choice

No unique constraint allows duplicate storage on concurrent inserts. Single-column constraint causes false duplicates across providers. Application-level check without constraint has race window.

---

## Related Rules
Create Inbox Record Before Dispatching Processing Job

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Inbox Processing Strategy

---

## Decision Context

Choosing between immediate and batched inbox processing.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Does the webhook need near-real-time processing?
↓
YES → Process inbox records immediately via queue job per record
  ↓
  Is message ordering critical?
  ↓
  YES → Process inbox FIFO per provider; sequential processing
  NO → Parallel processing per record; fastest throughput
NO → Can processing be deferred (batch job)?
  ↓
  YES → Batch process inbox records on a schedule (every 5 minutes)
  NO → Immediate processing is required
  ↓
  High volume (>1000 webhooks/minute)?
  ↓
  YES → Batch processing reduces per-record overhead
  NO → Per-record queue processing is simpler

---

## Rationale

Immediate processing via queue provides near-real-time handling with retry. Batch processing improves throughput at high volume. FIFO ordering preserves message order where needed.

---

## Recommended Default

**Default:** Per-record queue processing with FIFO ordering per provider
**Reason:** Near-real-time; ordered processing; built-in retry

---

## Risks Of Wrong Choice

Batch processing adds latency for time-sensitive webhooks. Unordered processing can cause out-of-order side effects. Per-record overhead for high volume may overwhelm queue workers.

---

## Related Rules
Implement Inbox Monitoring, Alert on Stuck Unprocessed Records

---

## Related Skills

Queue Incoming Webhook Processing for Async Handling

---

## Dead Letter Handling Strategy

---

## Decision Context

Handling inbox records that repeatedly fail processing.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Has the inbox record exceeded max processing attempts?
↓
YES → Move to dead letter queue for manual review
  ↓
  Is the failure permanent (invalid data, schema mismatch)?
  ↓
  YES → Flag for manual triage; no automatic retry
  NO → Retry with backoff; move to dead letter only after exhaustion
NO → Is the record stuck in "processing" state (>5 minutes)?
  ↓
  YES → Consider it stalled; retry or move to dead letter
  NO → Normal processing; no action needed
  ↓
  Need alerting on dead letter events?
  ↓
  YES → Alert operations team on dead letter record creation
  NO → Log only; review during periodic maintenance

---

## Rationale

Dead letter queue isolates permanently failed records for manual triage. Stuck record detection prevents silent processing halts. Alerting ensures dead letters don't accumulate unnoticed.

---

## Recommended Default

**Default:** Dead letter after 10 failed attempts; alert operations team; quarterly dead letter review
**Reason:** Sufficient retry for transient issues; prevents silent accumulation; periodic cleanup

---

## Risks Of Wrong Choice

No dead letter causes failed records to retry indefinitely. No alert allows dead letters to accumulate unnoticed. Premature dead lettering skips retry for transient failures.

---

## Related Rules
TTL-Based Cleanup of Processed Records

---

## Related Skills

Queue Incoming Webhook Processing for Async Handling
