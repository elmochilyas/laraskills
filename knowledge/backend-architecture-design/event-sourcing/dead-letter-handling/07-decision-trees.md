# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Event-Driven Architecture
**Knowledge Unit:** Dead letter handling for failed projections
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Retry strategy for failed events (retry-before-DLQ vs immediate DLQ)
* Decision 2: Storage and management approach for dead letters
* Decision 3: Replay strategy after root cause fix
* Decision 4: Monitoring and alerting thresholds for DLQ

---

# Architecture-Level Decision Trees

---

## Decision: Retry Strategy for Failed Events

---

## Decision Context

Choose how many retries and what backoff strategy to use before routing a failed event to the dead letter queue.

---

## Decision Criteria

* performance considerations: excessive retries delay processing of subsequent events; premature DLQ creates manual work for transient failures
* architectural considerations: transient vs permanent failure classification determines retry vs immediate DLQ
* security considerations: retrying security-violation events (invalid auth) should fail fast and alert
* maintainability considerations: consistent retry strategy reduces debugging complexity; per-event strategies add maintenance burden

---

## Decision Tree

Can the failure type be classified as transient vs permanent at the catch site?
↓
YES → Is the failure a transient error (network timeout, DB deadlock, rate limit)?
    YES → Retry with exponential backoff (max 3-5 retries)
        ↓
        Does the event handler call external services that may recover?
        YES → Longer backoff (base delay 1s, multiplier 4x, max 5 retries)
        NO → Shorter backoff (base delay 100ms, multiplier 2x, max 3 retries)
    NO → Is the failure a permanent error (invalid data, schema mismatch, violated invariant)?
        YES → Route to DLQ immediately (no retry — retrying permanent failures wastes compute)
        NO → Unclassifiable: retry 3 times, then DLQ (safety net)
NO → Cannot classify failure type (legacy code, generic exception handler)
    ↓
    Is retry without classification acceptable risk?
    YES → Retry all failures 3 times with exponential backoff, then DLQ
    NO → Refactor to classify failures first (separate transient/permanent catch blocks)
    ↓
    After retries exhausted, ensure DLQ entry includes: retry_count, last_error, stack_trace
    ↓
    Is the event critical (financial transaction, compliance-relevant)?
    YES → Alert immediately on DLQ entry (threshold: 1 event)
    NO → Alert on aggregate (threshold: N events in T minutes)

---

## Rationale

Transient failures (network, timeouts) should be retried with backoff. Permanent failures (invalid data, schema mismatch) should go directly to DLQ. Unclassifiable failures should have a safety net of 3 retries. The retry strategy directly impacts system reliability — too few retries causes unnecessary DLQ noise; too many retries delays processing and risks resource exhaustion.

---

## Recommended Default

**Default:** Retry transient failures 3 times with exponential backoff (100ms, 400ms, 1.6s). Route permanent failures directly to DLQ.

**Reason:** Exponential backoff gives transient issues time to resolve without overloading the system. Immediate DLQ for permanent failures avoids wasting resources and surfaces bugs quickly.

---

## Risks Of Wrong Choice

No retry: transient network blips cause false DLQ entries, unnecessary alerting. Infinite retry: resource exhaustion, blocked event processing pipeline, permanent failures loop forever.

---

## Related Rules

- Rule 5: Distinguish between transient failures (retry) and permanent failures (DLQ)
- Rule 1: Every event consumer must route unprocessable events to a dead letter queue

---

## Related Skills

- Implement Dead Letter Handling
- Implement Event Bus Patterns

---

## Decision: Storage and Management Approach for Dead Letters

---

## Decision Context

Choose the storage mechanism and management interface for dead letter events.

---

## Decision Criteria

* performance considerations: DLQ storage must handle peak failure rates without impacting event processing throughput
* architectural considerations: separate DLQ storage avoids coupling to the event bus; integrated DLQ simplifies infrastructure
* security considerations: DLQ payloads may contain sensitive data requiring encryption and access control
* maintainability considerations: searchable, filterable DLQ management reduces investigation time

---

## Decision Tree

Is the message broker being used for the primary event bus?
↓
YES → Does the broker support native DLQ (RabbitMQ DLX, SQS DLQ, Kafka DLQ topic)?
    YES → Is the team experienced with the broker's DLQ features?
        YES → Use broker-native DLQ (tight integration, no additional infrastructure)
            ↓
            Does the broker DLQ preserve full event metadata (payload, headers, error reason)?
            YES → Broker-native DLQ sufficient (supplement with dashboard)
            NO → Broker-native DLQ + DB for detailed metadata (store additional context in DB)
        NO → Use database-backed DLQ (simpler, consistent across brokers, searchable)
    NO → Use database-backed DLQ (separate outbox-style table for dead letters)
NO → What storage is most accessible to the operations team?
    DB → DLQ table with JSON payload storage, indexed by event_id and status
    File → Log-based DLQ with structured log aggregation (ELK, Datadog)
    ↓
    Is a management UI needed (inspect, replay, discard)?
    YES → Build or integrate: Laravel Nova panel, custom CLI, dedicated dashboard
    NO → CLI-only management (artisan commands for listing and replaying)
    ↓
    Retention policy for processed dead letters?
    Processed → Keep for 30 days (investigation window), then archive
    Rejected → Keep indefinitely (audit trail), with manual purge

---

## Rationale

Broker-native DLQs (RabbitMQ DLX, SQS DLQ) integrate tightly but may lack search and metadata depth. Database-backed DLQs provide full query capability, consistent access patterns, and survive broker migrations. For most teams, a database-backed DLQ with a simple management UI provides the best balance.

---

## Recommended Default

**Default:** Database-backed DLQ with a management UI (Nova panel or artisan commands). Keep processed entries for 30 days.

**Reason:** Database DLQs are broker-agnostic, searchable, and simple to implement. A management UI enables non-developer operators to investigate and replay failed events.

---

## Risks Of Wrong Choice

Broker-native only: limited search, difficult to correlate across event types, vendor lock-in. Database-backed without cleanup: unbounded table growth, query performance degradation.

---

## Related Rules

- Rule 3: Include all metadata needed for diagnosis in the dead letter event
- Rule 2: Implement automated alerts and a recovery dashboard for DLQ events

---

## Related Skills

- Implement Dead Letter Handling
- Implement Event Bus Patterns

---

## Decision: Replay Strategy After Root Cause Fix

---

## Decision Context

Choose the approach for reprocessing dead letter events after the underlying issue is resolved.

---

## Decision Criteria

* performance considerations: replaying large batches can overwhelm consumers; rate-limited replay adds latency
* architectural considerations: chronological replay preserves event ordering within aggregates
* security considerations: replay may reprocess security-sensitive events — ensure authorization is rechecked
* maintainability considerations: automatic replay is convenient but risky; manual replay gives control

---

## Decision Tree

Has the root cause been identified and fixed?
↓
YES → Is the fix deployed and verified (passing tests, staging confirmation)?
    YES → Proceed with replay
    NO → Do not replay yet (replaying without fix will re-fail events)
NO → Investigate root cause first; replay before fix is futile
    ↓
    How many dead letter events need replaying?
    < 10 → Manual replay via management UI (select events, click "Replay")
    10-100 → Are the events for the same aggregate stream?
        YES → Replay batch in chronological order (preserve aggregate ordering)
        NO → Replay in chronological order across aggregates (safe default)
    > 100 → Batch replay with rate limiting (avoid consumer overload)
        ↓
        Are events independent (different aggregates, different event types)?
        YES → Parallel replay with throttling (higher throughput)
        NO → Sequential replay per aggregate (prevent ordering violations)
    ↓
    After replay, verify: did all events succeed or re-enter DLQ?
    ALL SUCCEEDED → Clear alert, update incident report
    SOME FAILED → Investigate remaining failures (may be new issue)
    ↓
    Are consumers idempotent (safe to replay events already processed elsewhere)?
    YES → Replay is safe; duplicates will be ignored
    NO → Implement idempotency before replaying (replay without idempotency causes duplicates)

---

## Rationale

Replay must happen in chronological order, especially within the same aggregate stream. Batch size depends on consumer capacity — large batches can overwhelm consumers that perform external calls. Manual replay for small batches gives control; automated replay for large batches is acceptable with rate limiting.

---

## Recommended Default

**Default:** Manual replay for < 10 events; chronological batch replay for larger sets with rate limiting. Always verify idempotency first.

**Reason:** Manual replay forces human verification that the fix is correct. For large batches, manual replay is impractical, but rate limiting prevents consumer overload.

---

## Risks Of Wrong Choice

Replay before fix: events fail again, no progress. Replay out of order: state corruption, especially for same-aggregate events. Replay without idempotency: duplicate data, double side effects.

---

## Related Rules

- Rule 4: Replay DLQ events in order after the root cause is fixed

---

## Related Skills

- Implement Dead Letter Handling
- Design Event Sourcing Components

---

## Decision: Monitoring and Alerting Thresholds for DLQ

---

## Decision Context

Define when to alert on dead letter queue events and what thresholds indicate a systemic problem.

---

## Decision Criteria

* performance considerations: high-frequency alerts cause alert fatigue; minimal alerts risk missing critical failures
* architectural considerations: alert thresholds depend on event criticality and recovery time objectives
* security considerations: security-related DLQ entries (auth failures, invalid data) need immediate attention
* maintainability considerations: alert on symptoms, not events — DLQ growth indicates systemic issues

---

## Decision Tree

Is the event type business-critical (payments, orders, compliance)?
↓
YES → Alert immediately on ANY DLQ entry for this event type
    ↓
    Is there an on-call rotation?
    YES → Page on-call immediately (P1 incident)
    NO → Notify team channel with high priority (respond within 15 minutes)
NO → Is the event important but not critical (notifications, analytics, cache invalidation)?
    YES → Alert on aggregate threshold
        ↓
        What threshold indicates a problem?
        > 10 events → Alert (small batch suggests transient spike)
        > 1 hour since first failure → Alert (failure has persisted)
        > 5% of total events for this type → Alert (systemic issue)
        → Alert if ANY of these conditions is met
    NO → Is the event informational (logs, metrics, non-critical updates)?
        YES → No alert; include in daily digest
    ↓
    Are DLQ alerts actionable (team can investigate and fix)?
    YES → Route to appropriate team's channel with event type context
    NO → Add more metadata to alerts (consumer name, error message, sample payload)
    ↓
    Monitor DLQ growth rate over time (even without alerts)
    STEADY GROWTH → Review event processing capacity (may need more workers)
    SPIKING → Investigate immediately (deployment issue, schema change, downstream outage)

---

## Rationale

Critical event types (financial, compliance) should page on-call on every failure. Non-critical events should use aggregate thresholds to avoid alert fatigue. DLQ monitoring should track both absolute count and growth rate to distinguish transient issues from systemic degradation.

---

## Recommended Default

**Default:** Page on-call for critical event DLQ entries. Alert at 10+ events or 1-hour persistence for non-critical. Include event type, consumer name, and error summary in alert.

**Reason:** Critical events cannot tolerate delay. Aggregate thresholds for non-critical events prevent alert fatigue while still surfacing systemic issues.

---

## Risks Of Wrong Choice

Alert on every DLQ entry: alert fatigue, important alerts buried in noise. No alerts at all: silent data loss, undetected read model divergence, trust erosion in event system.

---

## Related Rules

- Rule 2: Implement automated alerts and a recovery dashboard for DLQ events
- Rule 1: Every event consumer must route unprocessable events to a dead letter queue

---

## Related Skills

- Implement Dead Letter Handling
- Implement Event Bus Patterns
