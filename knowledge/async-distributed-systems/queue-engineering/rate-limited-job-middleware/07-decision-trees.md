# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** rate-limited-job-middleware
**Generated:** 2026-06-03

---

# Decision Inventory

* Rate-Limited vs WithoutOverlapping for Job Throttling
* Per-Job vs Global Rate Limiter Selection

---

# Architecture-Level Decision Trees

---

## Rate-Limited vs WithoutOverlapping for Job Throttling

---

### Decision Context

Whether to use `RateLimited` middleware (limits jobs per time window) or `WithoutOverlapping` (prevents concurrent execution).

---

### Decision Criteria

* Throttling goal (rate per time vs concurrent execution)
* Downstream API rate limits
* Job execution time distribution
* Worker pool size

---

### Decision Tree

Need to limit jobs per time window (e.g., 10 per minute)?
YES → Use RateLimited middleware with named rate limiter
NO → Need to prevent concurrent execution only?
    YES → Use WithoutOverlapping middleware
NO → Both rate limiting AND concurrency prevention?
    YES → Use both — RateLimited for throughput, WithoutOverlapping for concurrency

---

### Rationale

`RateLimited` uses Laravel's rate limiter to control how many jobs execute per time window. `WithoutOverlapping` uses a lock to prevent the same job from running concurrently. They solve different problems and can be combined.

---

### Recommended Default

**Default:** Use `RateLimited` when respecting downstream API rate limits; `WithoutOverlapping` when preventing concurrent resource contention
**Reason:** Rate limits are about throughput per time window; overlapping prevention is about single-execution-at-a-time within the same resource.

---

### Risks Of Wrong Choice

- WithoutOverlapping for rate limits: only prevents concurrency, not rate per window
- RateLimited for concurrency: two jobs could run simultaneously within the same window
- No rate limiter for external APIs: downstream service throttles or blocks

---

### Related Rules

- use-rate-limited-for-external-api-calls

---

### Related Skills

- Implement Job Middleware
- Implement Rate Limiting for Jobs

---

## Per-Job vs Global Rate Limiter Selection

---

### Decision Context

Whether to define rate limiters globally (in `App\Http\Kernel`) or per-job.

---

### Decision Criteria

* Rate limiter reusability across jobs
* Configuration centralization preference
* Rate limit scope (per job class vs per resource)

---

### Decision Tree

Rate limit applies to a specific external API or resource?
YES → Define once globally in Kernel, reference by name in multiple jobs
NO → Rate limit is specific to one job class?
    YES → Define inline in the job class
NO → Needs dynamic limits based on runtime data?
    YES → Use ->limiter() with a Closure

---

### Rationale

Global rate limiter definitions are reusable across multiple job classes. For example, a "github-api" rate limiter can be used by all jobs that call GitHub's API. Per-job inline definitions are for job-specific limits.

---

### Recommended Default

**Default:** Define rate limiters globally for shared external resources; inline for job-specific limits
**Reason:** Centralized configuration for shared resources ensures consistency. Job-specific limits avoid polluting the global namespace.

---

### Risks Of Wrong Choice

- Duplicate rate limiter definitions: hard to update limits consistently
- Global limiter for job-specific needs: unnecessary abstraction
- Not using rate limiter at all: API abuse, throttling, blocked accounts

---

### Related Rules

- use-rate-limited-for-external-api-calls

---

### Related Skills

- Implement Job Middleware
- Implement Rate Limiting for Jobs
