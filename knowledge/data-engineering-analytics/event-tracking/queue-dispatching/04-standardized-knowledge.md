# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 01-event-tracking
**Knowledge Unit:** queue-dispatching
**Difficulty:** Foundation
**Category:** Queue Architecture
**Last Updated:** 2026-06-03

---

# Overview

Queue dispatching is the mechanism that moves analytics events from the HTTP request lifecycle into background processing. It is the critical decoupling layer that prevents analytics ingestion from degrading application performance. The key engineering challenge is not how to dispatch but how to architect the queue topology — connection selection, queue naming, prioritization, batching, failure handling, and backpressure management — to handle analytics throughput without starving application jobs.

In the analytics pipeline, queue dispatching sits between the tracking middleware (capture) and the processing layer (enrichment, storage). It absorbs traffic spikes, enables retry handling, and isolates analytics processing failures from the request lifecycle.

Engineers must care because the queue architecture directly determines analytics data freshness, ingestion reliability, and the operational cost of the analytics pipeline. A poorly designed queue topology causes data loss, delayed dashboards, and cascading failures under load.

---

# Core Concepts

## Connection Selection

Laravel supports multiple queue drivers. For analytics, the choice is critical:
- **Redis:** Best for high-throughput analytics. Sub-millisecond dispatch latency. Atomic operations for rate limiting and deduplication. Required for `ShouldBeUnique`.
- **Database:** Simple to set up but not suitable for production analytics throughput. Use only for development or low-volume tracking.
- **SQS:** Good for AWS-native deployments. Higher latency per dispatch but infinite scalability. Good for burst-prone analytics traffic.

## Queue Topology

The topology describes how queues are named, organized, and consumed. For analytics, the standard pattern is:
- `analytics-events` — raw ingested events from middleware
- `analytics-enrichment` — events needing enrichment (geo-IP, user-agent)
- `analytics-storage` — processed events ready for database write
- `analytics-exports` — export job queue

This separation allows independent scaling and failure isolation per pipeline stage.

## Dispatch Latency

The time between `dispatch()` call in middleware and the job's `handle()` execution. For real-time dashboards, this must be under 1 second. For batch analytics, minutes are acceptable. Latency is determined by queue worker availability, job processing time, and queue depth.

## Job Payload Size

Analytics event payloads can be large, especially with full request context. Laravel serializes job payloads to JSON. Large payloads (> 64KB) stress Redis memory, increase serialization time, and hit SQS message size limits. Keep payloads lean.

## ShouldBeUnique

The `ShouldBeUnique` trait prevents duplicate jobs in the queue. For analytics, this is useful for preventing duplicate event processing when middleware fires multiple times. The uniqueness window must be configured carefully — too short and duplicates slip through, too long and legitimate unique events are dropped.

---

# When To Use

- Decoupling analytics event capture from storage/processing
- Handling traffic spikes in event ingestion
- Running enrichment (geo-IP, user-agent parsing) without blocking the request
- Batch processing of analytics events for storage efficiency
- Exporting analytics data to external systems
- Retry handling for failed analytics processing

---

# When NOT To Use

- Real-time analytics with sub-100ms latency requirements (use WebSocket direct publish)
- Simple page view counts (use direct database increment with atomic counters)
- Serverless analytics where queue infrastructure is not available
- Event sourcing for domain events (use dedicated event bus)

---

# Best Practices

## Separate Analytics from Application Queues

Always use a dedicated queue connection for analytics events. The analytics pipeline has different throughput, latency, and failure characteristics than application queues (emails, notifications). A Redis instance or SQS queue dedicated to analytics prevents analytics traffic from starving application jobs.

## Use Queue Prefixes for Multi-Environment

Prefix queue names with the environment: `staging-analytics-events`, `production-analytics-events`. This prevents cross-environment queue pollution during deployments and testing.

## Implement Payload Size Limits

Enforce a maximum payload size at the dispatch point. Events with excessive context should be truncated or split. Monitor payload sizes to detect regressions.

## Configure Retry Strategy Per Pipeline Stage

- Capture queue: low retries (3-5), as re-delivery may be stale
- Enrichment queue: moderate retries (5-10), as external services may recover
- Storage queue: high retries (10-15), as database outages are typically transient

---

# Architecture Guidelines

## Layer Placement

Queue dispatch is the boundary between the middleware layer and the processing layer. The middleware captures and dispatches; it does not process. The queue workers process; they do not capture.

## Pipeline Stages

1. **Capture Middleware** → dispatches to `analytics-events`
2. **Enrichment Worker** → consumes `analytics-events`, enriches, dispatches to `analytics-storage`
3. **Storage Worker** → consumes `analytics-storage`, writes to database

Each stage has its own queue, retry policy, and worker configuration.

## Backpressure Management

When the storage layer cannot keep up with ingestion, the queue depth grows. Monitor queue depth and implement backpressure: if the enricher queue exceeds a threshold, reduce the dispatch rate from middleware by sampling events rather than queueing everything.

---

# Performance Considerations

- Redis dispatch is extremely fast (< 1ms), but Redis memory is finite. Monitor `used_memory` for queue payloads.
- Large payloads increase Redis memory and serialization time. Compress or truncate context data.
- Queue worker concurrency should match your database write capacity. More workers = more parallel writes, but too many overwhelm the database.
- Batch dispatching (`Batch::add()`) reduces Redis round trips but delays individual event availability.
- Consider using `dispatchAfterResponse()` for lower-priority events that don't need immediate processing.

---

# Security Considerations

- Queue payloads may contain request data. Never queue raw passwords, tokens, or full request bodies.
- Queue workers run in a different process context. Ensure tenant isolation is re-verified in the worker, not inherited from the dispatch context.
- Failed jobs may be retried with exponential backoff. Ensure retries are idempotent and do not create duplicate analytics records.
- Monitor for job injection attacks — validate all data in the queue before processing.

---

# Common Mistakes

## Mistake: Sharing Queue with Application Jobs

Analytics events are dispatched to the default `default` queue alongside email jobs. An analytics import of 1M events delays all password reset emails by hours.

**Better approach:** Use a dedicated queue connection and queue name for analytics events.

## Mistake: Overly Large Payloads

The middleware captures the entire request object as a serialized payload. Each event is 100KB+. Redis runs out of memory, queue latency spikes.

**Better approach:** Extract and serialize only the fields needed for analytics processing.

## Mistake: No Unique Job Protection

The same event is dispatched multiple times due to middleware re-execution or Laravel's terminate edge cases. Duplicate events inflate analytics counts.

**Better approach:** Use `ShouldBeUnique` with an appropriate uniqueness key (event ID hash) and window (5-10 seconds).

---

# Anti-Patterns

## Synchronous Fallback Without Warning

The queue connection fails, and the code silently falls back to synchronous processing. The request is now blocked by analytics processing, and the developer has no idea the queue is down.

**Solution:** Log a warning when fallback to synchronous processing occurs. Monitor queue connection health separately.

## Infinite Retry on Processing Errors

Jobs that fail due to data validation errors are retried indefinitely. The job fails, retries, fails again — consuming worker time and generating error logs without ever succeeding.

**Solution:** Distinguish between transient failures (retry) and permanent failures (fail immediately). Use `$this->fail()` for validation errors.

---

# Examples

## Analytics Queue Configuration

```php
// config/queue.php
'connections' => [
    'analytics-redis' => [
        'driver' => 'redis',
        'connection' => 'analytics',
        'queue' => 'analytics-events',
        'retry_after' => 90,
        'block_for' => null,
    ],
],
```

## Dispatching with Context Extraction

```php
class TrackEventMiddleware
{
    public function terminate(Request $request, mixed $response): void
    {
        $event = AnalyticsEvent::fromRequest($request);
        dispatch(new ProcessAnalyticsEvent($event))
            ->onConnection('analytics-redis')
            ->onQueue('analytics-events');
    }
}
```

## Unique Event Protection

```php
class ProcessAnalyticsEvent implements ShouldQueue, ShouldBeUnique
{
    public function __construct(
        public AnalyticsEvent $event
    ) {}

    public function uniqueId(): string
    {
        return $this->event->eventId;
    }

    public function uniqueFor(): int
    {
        return 10; // seconds
    }
}
```

---

# Related Topics

**Prerequisites:**
- Middleware Event Tracking — Source of queue dispatches

**Closely Related:**
- Multi-Tenancy Analytics — Queue per tenant isolation strategies
- Circuit Breaker — Protecting queue workers from failing external services

**Advanced Follow-Up:**
- CQRS Read Models — Queue projections update read models
- Reverb WebSocket — Queue-dispatch-then-broadcast pattern

**Cross-Domain Connections:**
- Async & Distributed Systems — Queue architecture, job pipeline patterns
