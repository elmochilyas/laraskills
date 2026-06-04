# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Retry & Failure Handling
**Knowledge Unit:** failed-job-events
**Generated:** 2026-06-03

---

# Decision Inventory

* Event-Based vs Direct Notification on Job Failure
* Global vs Per-Job Failure Handling

---

# Architecture-Level Decision Trees

---

## Event-Based vs Direct Notification on Job Failure

---

### Decision Context

Whether to use Laravel's failed job events (registered in `AppServiceProvider`) or implement direct notification in each job's `failed()` method.

---

### Decision Criteria

* Need for centralized failure handling
* Per-job customization requirements
* Notification channel requirements

---

### Decision Tree

All jobs should use the same failure notification mechanism (e.g., Slack alert)?
YES → Use event-based (register listener in ServiceProvider) — single registration
NO → Each job class needs different failure handling?
    YES → Per-job failed() method — class-specific behavior
NO → Need both global and per-job handling?
    YES → Both — events for global metrics, failed() for job-specific logic

---

### Rationale

Event-based handling via the `queue.fail` or `Illuminate\Queue\Events\JobFailed` event allows centralized monitoring, metrics, and alerting. Per-job `failed()` methods handle job-specific cleanup and recovery.

---

### Recommended Default

**Default:** Use events for centralized monitoring/alerting; use `failed()` for job-specific cleanup
**Reason:** Separation of concerns — global observability in events, per-job logic in `failed()`.

---

### Risks Of Wrong Choice

- No centralized failure monitoring: failures go unnoticed until users complain
- Only per-job failed(): duplicate notification code across every job class
- Only event-based: can't do job-specific cleanup

---

### Related Rules

- investigate-before-retrying

---

### Related Skills

- Set Up Queue Failure Handling and Retries
- Monitor Queue Health and Performance

---

## Global vs Per-Job Failure Handling

---

### Decision Context

How to distribute failure handling logic between global event listeners and per-job `failed()` methods.

---

### Decision Criteria

* Failure action type (monitoring vs cleanup)
* Cross-cutting concern vs job-specific action
* Code duplication avoidance

---

### Decision Tree

Action is cross-cutting (log, metrics, alert)?
YES → Use global event listener — one implementation for all jobs
NO → Action is job-specific (refund order, release lock, invalidate cache)?
    YES → Use per-job failed() method
NO → Both needed?
    YES → Global event for monitoring + failed() for job-specific cleanup

---

### Rationale

Global event listeners handle cross-cutting concerns without duplicating code across jobs. Per-job `failed()` methods handle cleanup specific to each job's business logic.

---

### Recommended Default

**Default:** Global event listener for logging/alerting; per-job `failed()` for job-specific cleanup
**Reason:** Minimizes duplication while keeping job-specific logic co-located with the job class.

---

### Risks Of Wrong Choice

- All in failed(): duplicate monitoring code, harder to add new jobs
- All in events: can't do job-specific cleanup, events become complex
- No failure handling: silent failures

---

### Related Rules

- investigate-before-retrying

---

### Related Skills

- Set Up Queue Failure Handling and Retries
