# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 06-integration-architecture
**Knowledge Unit:** outbox-pattern
**Generated:** 2026-06-03

---

# Decision Inventory

1. Outbox vs Direct Dispatch Strategy
2. Outbox Relay Strategy (Queue vs CDC vs Polling)
3. Cleanup Strategy

---

# Architecture-Level Decision Trees

---

## Outbox vs Direct Dispatch Strategy

---

## Decision Context

Choosing between transactional outbox and direct queue dispatch.

---

## Decision Criteria

* reliability
* architectural

---

## Decision Tree

Is the webhook delivery reliability critical (>99.9%)?
↓
YES → Use transactional outbox (same DB transaction as business operation)
  ↓
  Can the application tolerate losing webhooks on process crash?
  ↓
  YES → Direct queue dispatch is simpler; outbox overhead not needed
  NO → Outbox guarantees delivery; queue dispatch risks loss on crash
NO → Is the webhook for non-critical notifications?
  ↓
  YES → Direct queue dispatch is sufficient; occasional loss acceptable
  NO → Outbox recommended for any delivery that must not be lost
  ↓
  Need to batch multiple webhooks from one transaction?
  ↓
  YES → Outbox naturally supports batch writes within transaction
  NO → Single webhook per transaction; direct dispatch is simpler

---

## Rationale

Transactional outbox guarantees that webhook delivery records survive process crashes by storing them in the same database transaction as the business operation. Direct dispatch risks losing webhooks if the process crashes after the business operation but before queue dispatch.

---

## Recommended Default

**Default:** Transactional outbox for critical delivery; direct dispatch for non-critical
**Reason:** Zero data loss for critical; simpler for non-critical where occasional loss is acceptable

---

## Risks Of Wrong Choice

Direct dispatch for critical delivery risks losing webhooks on process crash. Outbox for non-critical adds unnecessary DB writes and relay complexity.

---

## Related Rules
Always Create Outbox Record in Same Database Transaction

---

## Related Skills

Implement Reliable Outgoing Webhook Dispatch with Spatie

---

## Outbox Relay Strategy

---

## Decision Context

Choosing how outbox records are read and dispatched.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is the infrastructure capable of Change Data Capture (CDC)?
↓
YES → Use CDC-based relay (Debezium) for zero-poll overhead
  ↓
  Is CDC infrastructure already deployed?
  ↓
  YES → CDC is the most efficient relay method
  NO → CDC setup overhead may not justify the benefit
NO → Does the application already use scheduled tasks?
  ↓
  YES → Polling-based relay via scheduled Artisan command (every minute)
  NO → Queue-based relay after outbox insert (immediate, no polling)
  ↓
  Need near-real-time dispatch?
  ↓
  YES → Queue relay (dispatch job immediately after outbox insert)
  NO → Scheduled relay (batch every 5-10 minutes) is simpler

---

## Rationale

CDC provides zero-overhead relay by reading database replication logs. Queue relay provides near-real-time dispatch. Scheduled relay is simplest but adds latency.

---

## Recommended Default

**Default:** Queue-based relay for near-real-time; scheduled relay for simpler setups
**Reason:** Queue relay provides sub-second dispatch; scheduled relay adds minimal operational overhead

---

## Risks Of Wrong Choice

CDC relay adds infrastructure complexity for throughput that queue relay can match. Scheduled relay adds minutes of latency for time-sensitive webhooks. No relay causes outbox records to accumulate undelivered.

---

## Related Rules
Index Outbox Table on status and created_at

---

## Related Skills

Implement Reliable Outgoing Webhook Dispatch with Spatie

---

## Cleanup Strategy

---

## Decision Context

Managing processed outbox records to prevent table growth.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Are outbox records processed and acknowledged?
↓
YES → Archive or delete processed records on schedule
  ↓
  Need audit trail of delivered webhooks?
  ↓
  YES → Archive to separate table or cold storage before delete
  NO → Direct delete of processed records
NO → Are records stuck in "pending" state?
  ↓
  YES → Alert on stuck records; retry or dead letter
  NO → Normal processing; no cleanup action
  ↓
  High volume (>100K outbox records/day)?
  ↓
  YES → Partition by date; drop old partitions instead of DELETE
  NO → DELETE with LIMIT in scheduled job is sufficient

---

## Rationale

Cleanup prevents the outbox table from growing unbounded. Archiving preserves audit trail. Partitioning provides efficient bulk cleanup for high-volume systems.

---

## Recommended Default

**Default:** Daily cleanup of processed records older than 7 days; DELETE with LIMIT 10000 per batch
**Reason:** Small enough to avoid table bloat; long enough for debugging; bounded query impact

---

## Risks Of Wrong Choice

No cleanup causes unbounded table growth and slow inserts. Too-short retention prevents debugging delivery issues. DELETE without LIMIT causes long-running transactions.

---

## Related Rules
Archive Processed Records or Use Soft Deletes with TTL

---

## Related Skills

Implement Reliable Outgoing Webhook Dispatch with Spatie
