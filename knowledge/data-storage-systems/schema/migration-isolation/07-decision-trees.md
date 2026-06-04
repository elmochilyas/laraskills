# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-9 Migration Isolation
**Generated:** 2026-06-03

---

# Decision Inventory

* Isolated vs non-isolated migration execution
* Lock timeout configuration
* Multi-server deployment safety

---

# Architecture-Level Decision Trees

---

## Migration Isolation Strategy

---

## Decision Context

Determining whether migration isolation is needed based on deployment architecture and server count.

---

## Decision Criteria

* performance: cache lock overhead is negligible (< 5ms)
* architectural: prevents concurrent migration execution in multi-server setups
* maintainability: adds a cache dependency for lock acquisition
* security: no impact

---

## Decision Tree

Running migrations during deployment?
↓
Is the application deployed across multiple servers?
YES → Use --isolated flag
    ↓
    Does the cache driver support atomic locks?
    YES → --isolated works (Redis, Memcached, database)
    NO → Must implement a custom locking mechanism or run migrations from one server
NO → Is there a single server but manual execution risk?
    YES → Still use --isolated (prevents accidental parallel execution)
    NO → --isolated is optional but recommended
↓
What is the expected longest migration duration?
→ Set lock timeout > expected max (default 30s)
→ For large data backfills, increase MIGRATION_LOCK_TIMEOUT

---

## Rationale

In load-balanced environments, multiple servers may attempt to run migrations simultaneously. Without --isolated, both servers try to apply the same migration — the second server fails with "table already exists" errors. The cache lock ensures exactly one server runs migrations; others exit cleanly.

---

## Recommended Default

**Default:** Always use --isolated in deployment scripts
**Reason:** Zero overhead, prevents a class of production failures. The only case to omit is a single-server deployment with a manual deploy process that guarantees no concurrent execution.

---

## Risks Of Wrong Choice

* Missing --isolated in multi-server deployment: concurrent migration failures
* Lock timeout too short: lock expires mid-migration, second server starts
* Cache unavailable: --isolated cannot acquire lock; migration may fail

---

## Related Rules

* Always use --isolated in multi-server deployment scripts
* Set lock timeout exceeding the expected longest migration duration

---

## Related Skills

* Execute isolated migrations in multi-server deployments
