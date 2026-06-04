# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** spatie-rate-limited-job-middleware
**Generated:** 2026-06-03

---

# Decision Inventory

* Built-in RateLimited vs Spatie RateLimitedMiddleware

---

# Architecture-Level Decision Trees

---

## Built-in RateLimited vs Spatie RateLimitedMiddleware

---

### Decision Context

Whether to use Laravel's built-in `RateLimited` middleware or the Spatie `RateLimitedMiddleware` package.

---

### Decision Criteria

* Laravel version
* Feature requirements (allow vs block behavior)
* Team familiarity
* Package dependency preference

---

### Decision Tree

Using Laravel 10+?
YES → Built-in RateLimited middleware available — prefer it
NO → Need to limit by attempt count, not just time?
    YES → Spatie package provides attempt-based limiting
NO → Need custom "allow" vs "release" behavior?
    YES → Spatie package supports both strategies
NO → Default case?
    YES → Use built-in middleware (no extra dependency)

---

### Rationale

Laravel's built-in `RateLimited` middleware (introduced in Laravel 10) covers most rate limiting needs. The Spatie package adds attempt-based limiting and the ability to choose between "allow and continue" vs "release to queue" on rate limit hit.

---

### Recommended Default

**Default:** Use Laravel's built-in `RateLimited` middleware; Spatie package only when attempt-based limiting or allow/release strategy selection is needed
**Reason:** Built-in middleware is maintained by Laravel and requires no additional package dependency.

---

### Risks Of Wrong Choice

- Extra dependency when built-in suffices: unnecessary maintenance burden
- Built-in without understanding behavior: rate limit hit may throw exception vs release silently
- Not rate limiting external API jobs: downstream throttling, blocked requests

---

### Related Rules

- use-rate-limited-for-external-api-calls

---

### Related Skills

- Implement Job Middleware
- Implement Rate Limiting for Jobs
