# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Request Lifecycle
**Knowledge Unit:** Entry Point Mechanics
**Generated:** 2026-06-03

---

# Decision Inventory

1. Bootstrap Caching: Which caches to enable for entry-point optimization
2. Entry Point Logic: Framework initialization code placement
3. Deployment Context: FPM vs Octane entry point considerations

---

# Architecture-Level Decision Trees

---

## Decision Name: Entry Point Caching Strategy

---

## Decision Context

Choosing which caching commands to run based on the application's bootstrap profile.

---

## Decision Criteria

* performance — caching reduces bootstrap from 30-80ms to <5ms
* architectural — caching freezes config/route/event state at build time
* security — `env()` resolved at build time in cached config
* maintainability — integrate caching into deployment pipeline

---

## Decision Tree

Is the application in production?
↓
YES → Run ALL caches: `php artisan optimize` (includes config, events, routes)
NO → Is the application experiencing slow response times?
↓
YES → Profile bootstrap: which bootstrapper is slowest?
  - `LoadConfiguration` slow? → `php artisan config:cache`
  - Route registration slow? → `php artisan route:cache`
  - Event discovery slow? → `php artisan event:cache`
NO → Is application in active development?
↓
YES → No caching; run `php artisan optimize:clear` to ensure fresh state
NO → Run `php artisan optimize` in production; `optimize:clear` during development

---

## Rationale

Bootstrap time is dominated by config loading (10-40ms uncached), provider registration (5-20ms), and provider boot (10-30ms). Config caching reduces config loading to <1ms. Route caching reduces route registration to near-zero. Event caching eliminates listener discovery overhead. Together, they reduce total entry-point time by 60-80%.

---

## Recommended Default

**Default:** `php artisan optimize` in production deployment; `php artisan optimize:clear` during development.
**Reason:** Maximum performance in production; maximum flexibility in development.

---

## Risks Of Wrong Choice

- No caching in production: 30-80ms per-request overhead — directly impacts server capacity and response times.
- Caching during development: stale config/route/event state — changes not reflected until cache cleared.
- `php artisan optimize` without `composer dump-autoload -o`: suboptimal autoloader performance.

---

## Related Skills

- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)
