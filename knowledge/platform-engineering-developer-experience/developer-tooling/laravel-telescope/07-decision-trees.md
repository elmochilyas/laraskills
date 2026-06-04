# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Developer Tooling
**Knowledge Unit:** Laravel Telescope
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Telescope in production? | Performance budget, debugging need | Yes — with selective watchers only |
| 2 | Database vs Redis storage? | Traffic volume, storage cost | Database for most; Redis for high-traffic |

---

# Architecture-Level Decision Trees

---

## Decision 1: Telescope in Production?

---

## Decision Context

Telescope can run in production but full capture adds overhead and stores sensitive data. Selective watchers provide debugging value at minimal cost.

---

## Decision Criteria

* performance
* security

---

## Decision Tree

Do you need visibility into production exceptions and failed jobs?
↓
NO → Disable Telescope in production
YES → ↓
Enable only:
- ExceptionWatcher (all exceptions)
- QueryWatcher (`slow` threshold: > 100ms)
- JobWatcher (`failed` only)
Disable all other watchers
Additional:
- Filter out health check requests
- Schedule `telescope:prune` daily
- Secure `/telescope` route with authorization

---

## Recommended Default

**Default:** Telescope in production with Exception, SlowQuery, FailedJob watchers only
**Reason:** Low overhead (<5ms per request); catches production issues without data exposure

---

## Risks Of Wrong Choice

- **Full capture in production:** 50ms+ overhead; gigabytes of storage; PII exposure in request data
- **No Telescope:** Exceptions and failed jobs are invisible until customer reports them

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

---

## Decision 2: Database vs Redis Storage?

---

## Decision Context

Telescope can store entries in the application database or Redis. Database is simpler; Redis handles higher throughput.

---

## Decision Criteria

* performance

---

## Decision Tree

Is the application high-traffic (> 100 req/s)?
↓
NO → **Database storage** — simpler, no additional infrastructure
YES → ↓
Is Redis already available in the infrastructure?
↓
NO → Database is fine; add indexing for performance
YES → **Redis storage** — higher write throughput, less DB load
Regardless:
- Schedule `telescope:prune` regardless of storage driver
- For database: add indexes on `telescope_entries` (`created_at`, `type`, `batch_id`)
- For Redis: configure max memory policy to prevent unbounded growth

---

## Recommended Default

**Default:** Database storage; Redis for high-traffic applications (> 100 req/s)
**Reason:** Database is simpler; Redis justified when write throughput stresses the DB

---

## Risks Of Wrong Choice

- **Database at high traffic:** Write contention; Telescope entry writes slow down application
- **Redis without pruning:** Memory exhaustion; Telescope blocks writes when Redis is full

---

## Related Rules

- TEMPLATE-RULE-016: Template rendering under 2 seconds

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

