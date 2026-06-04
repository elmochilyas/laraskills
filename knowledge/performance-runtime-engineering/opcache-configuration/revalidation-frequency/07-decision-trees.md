# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Revalidation Frequency
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | validate_timestamps setting by environment | Configuration | Configure |
| 2 | revalidate_freq value selection | Configuration | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: validate_timestamps by Environment

---

## Decision Context

Setting validate_timestamps appropriately for development, staging, and production environments.

---

## Decision Criteria

* **performance** — stat() syscalls consume CPU; eliminated with validate_timestamps=0
* **architectural** — containers benefit most (immutable images)
* **maintainability** — tradeoff between performance and automatic update detection

---

## Decision Tree

What environment is being configured?
↓
**Production with automated deploys** → validate_timestamps=0 (max performance, requires deploy-time reset)
**Production without automation** → validate_timestamps=1, revalidate_freq=2 (build automation first)
**Staging** → validate_timestamps=1, revalidate_freq=2 (balance)
**Development** → validate_timestamps=1, revalidate_freq=0 (immediate updates)

---

Is this running in a container?
↓
**YES** → Always validate_timestamps=0. Container images are immutable; files never change.
**NO** → Use environment-specific configuration.

---

Does the deployment pipeline include cache reset?
↓
**YES** → validate_timestamps=0 is safe
**NO** → Must use validate_timestamps=1 or build automation first

---

## Rationale

validate_timestamps=0 eliminates stat() syscalls (1-3% CPU). Container environments always benefit because files never change in immutable images. Development needs validate_timestamps=1 for immediate feedback.

---

## Recommended Default

**Default:** Production=0, Staging=1 with revalidate_freq=2, Development=1 with revalidate_freq=0.
**Reason:** Each environment has different tradeoff requirements for performance vs update immediacy.

---

## Risks Of Wrong Choice

* validate_timestamps=0 in dev: code changes invisible until manual reset
* validate_timestamps=1 in production: 1-3% CPU wasted
* revalidate_freq=0 in production: 5-15% CPU overhead from stat() on every request

---

## Related Rules

* Set validate_timestamps=0 in Production
* Never Use revalidate_freq=0 in Production
* Use validate_timestamps=1 in Dev

---

## Related Skills

* OpCache Revalidation Frequency
