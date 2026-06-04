# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Eloquent ORM / Query Builder
**Knowledge Unit:** 2-29 Query Logging
**Generated:** 2026-06-03

---

# Decision Inventory

* DB::listen vs enableQueryLog vs Telescope
* Development logging vs production monitoring
* In-memory storage vs streaming

---

# Architecture-Level Decision Trees

---

## Query Logging Strategy

---

## Decision Context

Choosing between in-memory query logging, event-based listeners, and external monitoring tools for debugging and performance analysis.

---

## Decision Criteria

* performance: getQueryLog() stores all queries in memory per request
* architectural: DB::listen is event-driven; getQueryLog is buffer-based
* maintainability: custom listeners add code complexity
* security: query logs may contain PII in bindings

---

## Decision Tree

Need to log or inspect database queries?
↓
Is this for a single debugging session?
YES → Use enableQueryLog() + getQueryLog()
    ↓
    Working in a long-running process (queue job)?
    YES → Call disableQueryLog() after collecting data
        → Prevent memory growth
    NO → Single request — memory is freed after response
NO → Is this for ongoing production monitoring?
    YES → Use DB::listen with selective logging
        ↓
        Log only slow queries (>100ms)?
        YES → DB::listen(fn($q) => $q->time > 100 && Log::warning(...))
        NO → Log all queries to external storage?
            → Use Telescope (stored in DB) or dedicated logging service
NO → Is this for test assertions?
    → Use enableQueryLog() + assertCount() in tests

---

## Rationale

getQueryLog() is convenient but dangerous in production — it stores all queries in PHP memory. DB::listen is more flexible and can filter/aggregate without storing everything. Use DB::listen for production and getQueryLog for development debugging.

---

## Recommended Default

**Default:** DB::listen(fn($q) => Log::debug($q->sql, $q->bindings)) for development
**Reason:** Event-driven, can filter by timing, no memory accumulation. Switch to getQueryLog only for quick debugging sessions.

---

## Risks Of Wrong Choice

* Leaving getQueryLog enabled in production: memory exhaustion per request
* Not calling disableQueryLog in long-running processes: unbounded memory growth
* Logging query bindings in production: PII may leak into logs

---

## Related Rules

* Never leave getQueryLog enabled in production
* Always disable query logging in long-running processes after collection

---

## Related Skills

* Capture and analyze database queries with DB::listen
