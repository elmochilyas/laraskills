# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** rate-limiter-facade-job-rate-limiting
**Generated:** 2026-06-03

---

# Decision Inventory

* RateLimiter Facade vs Middleware for Job Rate Limiting

---

# Architecture-Level Decision Trees

---

## RateLimiter Facade vs Middleware for Job Rate Limiting

---

### Decision Context

Whether to use the `RateLimiter` facade directly in a job's `handle()` or use built-in middleware for rate limiting.

---

### Decision Criteria

* Need for fine-grained control over rate limit behavior
* Reusability across multiple job classes
* Declarative vs imperative preference

---

### Decision Tree

Need to check rate limit mid-handle() (after partial work)?
YES → Use RateLimiter facade in handle() — imperative control
NO → Rate limiting is at job level (check before processing)?
    YES → Use RateLimited middleware — declarative, cleaner
NO → Need to rate limit based on runtime data?
    YES → Both work — middleware with Closure for simple cases, facade for complex

---

### Rationale

`RateLimited` middleware provides a clean, declarative approach — the job is released before `handle()` runs. The `RateLimiter` facade gives imperative control at any point in `handle()`. Choose based on where the rate limit check needs to happen.

---

### Recommended Default

**Default:** Use `RateLimited` middleware for job-level rate limiting (check before handle); `RateLimiter` facade for mid-job rate limiting
**Reason:** Middleware keeps job logic clean. Facade provides flexibility for mid-processing checks.

---

### Risks Of Wrong Choice

- Middleware when mid-job check needed: rate limit hit after expensive partial work
- Facade for simple job-level check: unnecessary complexity, harder to test
- No rate limiting at all: downstream API throttling

---

### Related Rules

- use-rate-limited-for-external-api-calls

---

### Related Skills

- Implement Job Middleware
- Implement Rate Limiting for Jobs
