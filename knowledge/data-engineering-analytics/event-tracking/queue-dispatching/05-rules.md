# Rules: Queue Dispatching for Analytics Event Processing

## Rule QD-01: Dedicated Queue Connection for Analytics
Analytics event dispatching MUST use a dedicated queue connection, separate from application queues (emails, notifications). The analytics pipeline has distinct throughput and failure characteristics.

## Rule QD-02: Payload Size Limit
Analytics job payloads MUST NOT exceed 64KB. Large payloads stress Redis memory and hit SQS message size limits. Extract only the context needed for processing.

## Rule QD-03: Per-Stage Retry Configuration
Each pipeline stage MUST have its own retry policy. Capture queue: 3 retries. Enrichment queue: 5-10 retries. Storage queue: 10-15 retries.

## Rule QD-04: ShouldBeUnique for Duplicate Protection
Events that could be dispatched multiple times MUST implement `ShouldBeUnique` with an event ID hash and a short uniqueness window (5-10 seconds).

## Rule QD-05: Queue Prefix by Environment
Queue names MUST be prefixed with the environment name (staging, production) to prevent cross-environment pollution.

## Rule QD-06: Never Pass the Request Object
The `Request` object MUST NOT be passed to queued jobs. Extract required context into a DTO or array before dispatch.

## Rule QD-07: Monitor Queue Depth
Queue depth on the analytics connection MUST be monitored and alerted. Growing depth indicates the processing pipeline cannot keep up with ingestion.

## Rule QD-08: Backpressure Implementation
When queue depth exceeds a configurable threshold, the dispatch rate MUST be reduced via event sampling, not by dropping events silently.

## Rule QD-09: Distinguish Transient from Permanent Failures
Jobs MUST distinguish between transient failures (network timeout, service unavailable) and permanent failures (validation error, missing data). Use manual `fail()` for permanent failures.

## Rule QD-10: Log Synchronous Fallback
If the queue connection is unavailable and the system falls back to synchronous processing, a warning MUST be logged. Silent fallback hides infrastructure problems.
