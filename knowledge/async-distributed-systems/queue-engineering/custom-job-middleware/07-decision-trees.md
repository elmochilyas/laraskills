# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** custom-job-middleware
**Generated:** 2026-06-03

---

# Decision Inventory

* Custom Middleware vs Built-in Middleware Selection
* Middleware Logic Placement

---

# Architecture-Level Decision Trees

---

## Custom Middleware vs Built-in Middleware Selection

---

### Decision Context

Whether to implement custom job middleware or use existing built-in middleware (RateLimited, WithoutOverlapping, throttlesExceptions).

---

### Decision Criteria

* Cross-cutting concern matches built-in middleware
* Custom middleware complexity
* Maintenance burden
* Reusability across multiple job classes

---

### Decision Tree

Concern matches built-in middleware (rate limiting, overlapping, throttling)?
YES → Use built-in middleware
NO → Concern applies to multiple job classes?
    YES → Implement custom middleware (reusable)
NO → Concern is specific to one job class?
    YES → Implement inline in the job's middleware() method
NO → Need to modify job behavior globally?
    YES → Implement custom middleware and register it

---

### Rationale

Built-in middleware covers the most common cross-cutting concerns. Custom middleware is for concerns not covered by built-in options (custom metrics, custom logging, conditional execution). Registering globally adds behavior to all jobs.

---

### Recommended Default

**Default:** Use built-in middleware first; implement custom middleware only when built-in options don't cover the concern
**Reason:** Built-in middleware is tested, documented, and maintained. Custom middleware adds maintenance burden.

---

### Risks Of Wrong Choice

- Custom middleware replicating built-in: needless code, missing edge-case handling
- Global middleware affecting unintended jobs: unexpected side effects
- Complex middleware in single job class: better as inline logic

---

### Related Rules

- use-built-in-middleware-first

---

### Related Skills

- Implement Job Middleware
