# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 03-apm-performance-monitoring
**Knowledge Unit:** n-plus-one-detection
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] N+1 pattern understood: parent query + N child relationship queries
- [ ] Lazy loading guard configured (`\Illuminate\Database\Eloquent\Model::preventLazyLoading()`)
- [ ] Eager loading (`with()`, `load()`) used for all relationships in lists
- [ ] Telescope QueryWatcher enabled in development for N+1 detection
- [ ] Scout APM N+1 analyzer evaluated for CI pipeline integration
- [ ] Pulse slow query recorder monitored for production N+1 detection

---

# Architecture Checklist

- [ ] Eager loading strategy defined per aggregate root in domain layer
- [ ] Lazy loading prevention enabled in all non-production environments
- [ ] Query count threshold established (e.g., max 10 queries per request)
- [ ] Hydration strategy: selective columns in `with()` to reduce memory
- [ ] Resource/API response transformation evaluated for N+1 in serialization
- [ ] N+1 detection layered across dev (guard), CI (analyzer), and prod (recorder)

---

# Implementation Checklist

- [ ] `Model::preventLazyLoading()` registered in `AppServiceProvider::boot()`
- [ ] Common relationships eager-loaded with `with()` in controllers and repositories
- [ ] Dynamic `load()` used instead of lazy `->relation` access in views
- [ ] Telescope installed and QueryWatcher enabled for local development
- [ ] Pulse configured with slow query recorder card
- [ ] Scout APM N+1 detector activated in CI pipeline

---

# Performance Checklist

- [ ] Query count per endpoint measured and documented as baseline
- [ ] Eager loading verified to not cause unnecessary joins on large datasets
- [ ] Selective column eager loading used (`with('relation:id,name')`)
- [ ] Chunking evaluated for large dataset iteration (`chunk()`, `lazy()`, `cursor()`)
- [ ] Subquery joins considered for complex aggregation queries
- [ ] Query count threshold monitored via alert in production

---

# Security Checklist

- [ ] Eager loaded relationships do not expose unauthorized data
- [ ] `load()` on API resource does not leak cross-tenant data
- [ ] Query count thresholds do not cause false-positive alerts from legitimate queries
- [ ] Telescope access restricted in environments with real user data
- [ ] Scout APM access limited to engineering team
- [ ] Pulse dashboard authenticated and authorized

---

# Reliability Checklist

- [ ] N+1 guard disabled only in specific known scenarios (not globally)
- [ ] Eager loading missing relationship handled gracefully (null check)
- [ ] Lazy loading fallback strategy defined for edge cases
- [ ] Query watcher does not crash request on high query count
- [ ] Pulse recorder buffer configured for burst query activity
- [ ] CI N+1 analyzer failure does not block deployment

---

# Testing Checklist

- [ ] Unit test: query count assertion per expensive endpoint
- [ ] Unit test: lazy loading guard disabled correctly in permitted cases
- [ ] Integration test: eager loading produces expected SQL (fewer queries)
- [ ] Feature test: N+1 scenario detected by guard or watcher
- [ ] Performance test: eager vs lazy loading comparison for known N+1
- [ ] Regression test: previously fixed N+1 does not reappear

---

# Maintainability Checklist

- [ ] Relationship loading strategy documented per model
- [ ] `with()` eager loading centralized in query scopes or repositories
- [ ] Query count test assertions updated when endpoint changes
- [ ] N+1 detection tool config documented (Telescope, Pulse, Scout APM)
- [ ] Performance test suite includes query count checks
- [ ] Regular N+1 review sprint scheduled (monthly)

---

# Anti-Pattern Prevention Checklist

- [ ] No lazy loading in blade views without explicit `load()` first
- [ ] No `$model->relation` inside foreach loops without eager loading
- [ ] No serialization of model relationships without checking loaded state
- [ ] No excessive eager loading of unused relationships
- [ ] No N+1 guard disabled globally without specific justification
- [ ] No reliance solely on production detection for N+1 prevention

---

# Production Readiness Checklist

- [ ] Query count alerting threshold configured in monitoring tool
- [ ] Pulse slow query recorder card visible on team dashboard
- [ ] Scout APM N+1 detection alerts routed to engineering channel
- [ ] Query count baseline established per endpoint
- [ ] N+1 regression check automated in CI for critical endpoints
- [ ] On-call runbook includes N+1 diagnosis steps

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: eager loading strategy defined, hydrating optimized, layered detection across dev/CI/prod
- [ ] Security requirements satisfied: no data leakage through eager loading, Telescope and Pulse access controlled
- [ ] Performance requirements satisfied: query count baselined, selective columns used, chunking evaluated
- [ ] Testing requirements satisfied: query count assertions, lazy loading guard tested, eager loading SQL verified
- [ ] Anti-pattern checks passed: no foreach lazy loading, no unused eager loading, guard not globally disabled
- [ ] Production readiness verified: alerting active, dashboard visible, CI regression check established

---

# Related References

- APM Tool Integration & Comparison (Scout APM's N+1 detector)
- Laravel Telescope (query count watcher)
- Laravel Pulse (slow query recorder)
