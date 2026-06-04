# Metadata

**Domain:** Search & Retrieval Systems
**Subdomain:** Real-Time Indexing
**Knowledge Unit:** Index Failure Handling
**Generated:** 2026-06-03

---

# Decision Inventory

1. Real-Time Indexing Strategy
2. Model Observer vs Queue Job Indexing
3. Index Failure Recovery Strategy

---

# Architecture-Level Decision Trees

## Real-Time Indexing Strategy

---

### Decision Context

When implementing Index Failure Handling, you must decide how to keep search indexes synchronized with database changes in near real-time.

### Decision Criteria

* performance
* reliability

### Decision Tree

Is index freshness critical for your application?
|
YES -> Implement real-time indexing via model observers or queue jobs
    |
    What is the write volume?
    Low (<100 writes/min) -> Use synchronous model observer indexing
    High (>100 writes/min) -> Use queue-based indexing for performance
    |
    Can you tolerate eventual consistency in search?
    YES -> Queue-based indexing is the right choice
    NO -> Synchronous indexing for immediate consistency
NO -> Scheduled batch indexing (cron) may be sufficient
|
What happens when indexing fails?
Implement retry logic and failure handling (failed_jobs table)
Monitor queue health for undetected failures

### Rationale

Real-time indexing ensures search results reflect the latest data. Queue-based indexing decouples write operations from search index updates, providing better user-facing performance.

### Recommended Default

**Default:** Queue-based model observer indexing for production applications.
**Reason:** Balances index freshness with application performance.

### Risks Of Wrong Choice

- Synchronous indexing at high volume: slow API responses and timeouts
- No failure handling: silent indexing failures and stale search results

### Related Rules

- Monitor Failed Indexing Jobs Daily
- Implement Database Fallback on Engine Failure
- Run Periodic Consistency Checks

### Related Skills

- Configure and Implement Index Failure Handling

---

## Model Observer vs Queue Job Indexing

---

### Decision Context

When implementing Index Failure Handling, you must decide between Eloquent model observers and dedicated queue jobs for triggering index updates.

### Decision Criteria

* maintainability
* reliability

### Decision Tree

Do you need to index data beyond simple model save/delete events?
|
YES -> Use dedicated queue jobs for complex indexing logic
    |
    Is the indexing logic the same for create, update, and delete?
    YES -> Single job class with model event dispatch
    NO -> Separate job classes per operation type
NO -> Scout built-in model event handling is sufficient
|
Do you need to batch related index operations?
YES -> Implement a queued job that batches multiple index updates
NO -> Individual model events triggering index updates work fine

### Rationale

Scout automatically handles model event indexing via the Searchable trait. Custom queue jobs provide more control over complex indexing logic, batching, and error handling.

### Recommended Default

**Default:** Scout built-in model event handling; custom queue jobs for complex logic.
**Reason:** Simplest approach while maintaining flexibility for advanced scenarios.

### Risks Of Wrong Choice

- Custom jobs for simple cases: unnecessary complexity
- Scout-only for complex cases: insufficient control over indexing logic

### Related Rules

- Monitor Failed Indexing Jobs Daily
- Implement Database Fallback on Engine Failure
- Run Periodic Consistency Checks

### Related Skills

- Configure and Implement Index Failure Handling

---

## Index Failure Recovery Strategy

---

### Decision Context

When implementing Index Failure Handling, you must decide how to handle and recover from indexing failures.

### Decision Criteria

* reliability
* maintainability

### Decision Tree

Are indexing failures expected (network issues, engine downtime)?
|
YES -> Implement failure handling and recovery strategy
    |
    Which failure recovery approach?
    Queue retries -> Automatic retry with exponential backoff (default)
    Failed job monitoring -> Manual review and retry via Horizon/Failed
    Dead letter queue -> Route persistently failing jobs to DLQ
    |
    Is data consistency critical after failure?
    YES -> Implement compensating actions or reconciliation jobs
    NO -> Retry with backoff is sufficient
NO -> Basic error logging is sufficient
|
Do you need to detect silent failures (success response but no index update)?
YES -> Implement periodic reconciliation (compare DB vs index counts)
NO -> Assume success if no error was reported

### Rationale

Indexing failures can lead to stale search results and degraded UX. Queue retries handle transient failures automatically; reconciliation jobs detect silent failures that retries cannot address.

### Recommended Default

**Default:** Queue retries + Horizon failed job monitoring.
**Reason:** Handles most failure scenarios with minimal operational overhead.

### Risks Of Wrong Choice

- No failure handling: silent data loss in search index
- Infinite retries without backoff: resource exhaustion

### Related Rules

- Monitor Failed Indexing Jobs Daily
- Implement Database Fallback on Engine Failure
- Run Periodic Consistency Checks

### Related Skills

- Configure and Implement Index Failure Handling

