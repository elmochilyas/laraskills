# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Eloquent ORM / Query Builder
**Knowledge Unit:** 2-28 N+1 Detection
**Generated:** 2026-06-03

---

# Decision Inventory

* Telescope vs Debugbar vs custom monitoring
* Development detection vs production monitoring
* Threshold-based alerting strategies

---

# Architecture-Level Decision Trees

---

## N+1 Detection Tool Selection

---

## Decision Context

Choosing the right tool to detect repeated identical queries with different parameter values in different environments.

---

## Decision Criteria

* performance: Telescope and query logging add overhead in production
* architectural: detection strategy differs per environment
* maintainability: custom middleware adds code to maintain
* security: query logs may contain sensitive data

---

## Decision Tree

Need to detect N+1 queries?
↓
Is this for local development?
YES → Use Laravel Debugbar (instant visual feedback)
    ↓
    Need persistent per-request query history?
    YES → Use Telescope (query tab, duplicate detection)
    NO → Debugbar is sufficient
NO → Is this for staging/CI?
    YES → Telescope or DB::listen with assertion
    ↓
    CI pipeline should fail on high query count?
    YES → DB::listen + test assertion: assertCount(<30, $queries)
    NO → Telescope for manual review
NO → Is this for production?
    YES → Use custom middleware with DB::listen
        ↓
        Log queries exceeding threshold (e.g. 30/request)
        Do NOT enable getQueryLog() (memory exhaustion)
        Use DB::listen to count, not store
    NO → Use DB::listen with slow query alerts

---

## Rationale

Debugbar is the fastest feedback loop during development. Telescope provides richer analysis. Production monitoring requires a lightweight approach — count queries without storing them in memory — to avoid memory exhaustion.

---

## Recommended Default

**Default:** Debugbar for development, Telescope for staging, custom middleware for production
**Reason:** Different environments have different tradeoffs between visibility and overhead. Debugbar is zero-config. Telescope adds moderate overhead. Production needs the lightest touch.

---

## Risks Of Wrong Choice

* Relying only on one tool: Debugbar misses what Telescope catches and vice versa
* Ignoring production N+1: patterns that only appear at production data volumes won't show in development
* Enabling getQueryLog() in production: memory exhaustion on high-traffic endpoints

---

## Related Rules

* Always monitor query counts in production, not just development
* Use multiple detection tools across different environments

---

## Related Skills

* Detect and diagnose N+1 queries with Telescope
