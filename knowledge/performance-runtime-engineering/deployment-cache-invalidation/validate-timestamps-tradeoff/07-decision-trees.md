# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Deployment and Cache Invalidation
**Knowledge Unit:** Validate Timestamps Tradeoff
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | opcache.validate_timestamps = on/off | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: Validate Timestamps

---

## Decision Context

validate_timestamps on: OpCache checks file mtime on each access. Off: no check, best performance, but requires manual opcache_reset() after deployment.

---

## Decision Criteria

* **performance** — off avoids stat() syscall per file on each request
* **operations** — off requires explicit opcache_reset() after deployment
* **maintainability** — on is simpler for dev; off for production

---

## Decision Tree

Is this production or development?
↓
**Development** — validate_timestamps = on. Files change frequently; manual reset is impractical.
**Production** — validate_timestamps = off. Best performance, explicit reset per deployment.

---

Is the deployment process automated with opcache_reset()?
↓
**YES** — validate_timestamps = off. Deployment handles reset.
**NO** — validate_timestamps = on. Files auto-detect changes; slower but safer.

---

Is file stat overhead significant (1000+ file includes per request)?
↓
**YES** — validate_timestamps = off. Eliminates stat() syscalls.
**NO** — on is acceptable.

---

What is the revalidation_frequency?
↓
If validate_timestamps on, set revalidate_frequency = 2 (seconds). Avoids checking on every request.

---

## Recommended Default

**Default:** validate_timestamps = off in production with automated deployment. On in development.
**Reason:** Off provides best production performance with automated deployment handling reset.

---

## Risks Of Wrong Choice

* Off without automated reset: old code served until reset
* On in production: stat() overhead for every file, every request

---

## Related Skills

* Validate Timestamps Tradeoff
