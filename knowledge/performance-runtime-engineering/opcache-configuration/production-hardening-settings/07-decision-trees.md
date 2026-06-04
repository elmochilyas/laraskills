# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** Production Hardening Settings — validate_timestamps
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | validate_timestamps=0 vs 1 for production | Configuration | Harden |
| 2 | Deployment cache invalidation strategy | Operations | Deploy |

---

# Architecture-Level Decision Trees

---

## Decision: validate_timestamps=0 vs 1 in Production

---

## Decision Context

Choosing between maximum performance (no stat() checks) and automatic cache invalidation.

---

## Decision Criteria

* **performance** — validate_timestamps=0 saves 1-3% CPU by eliminating stat() syscalls
* **architectural** — requires deployment automation for cache reset
* **security** — stale code risk if cache reset fails after security patch

---

## Decision Tree

Is there automated deployment pipeline with opcache_reset() capability?
↓
**YES** → Set validate_timestamps=0 for maximum performance
**NO** → Set validate_timestamps=1, revalidate_freq=2 (or build automation first)

---

Is this running in a container (immutable image)?
↓
**YES** → Always validate_timestamps=0; files never change in immmutable images
**NO** → Depends on deployment automation (above)

---

Is this a development environment?
↓
**YES** → Set validate_timestamps=1, revalidate_freq=0 for immediate code updates
**NO** → Use production setting (0 if automated, 1 if not)

---

How often are deployments made?
↓
**Multiple times per day** → validate_timestamps=0 with automated reset; saves significant CPU
**Weekly or less** → validate_timestamps=0 still beneficial; automation easier with less frequency

---

## Rationale

validate_timestamps=0 eliminates 200-2000 stat() syscalls per request, saving 1-3% CPU. At 500 req/s with 500 files each, that's 250,000 stat() calls per second eliminated. The tradeoff is requiring explicit cache management.

---

## Recommended Default

**Default:** validate_timestamps=0 in production with automated opcache_reset() in deployment pipeline.
**Reason:** Maximum performance with manageable operational complexity.

---

## Risks Of Wrong Choice

* validate_timestamps=1 in production: 1-3% wasted CPU
* validate_timestamps=0 without automation: stale code after deploy, security patches don't apply
* revalidate_freq=0 in production: 5-15% CPU overhead

---

## Related Rules

* Set validate_timestamps=0 in Production
* Automate opcache_reset() in Deployment Pipeline
* Test Deployment Procedure After Changing

---

## Related Skills

* Production Hardening Settings
