# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Developer Tooling
**Knowledge Unit:** Telescope Watchers
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Which watchers to enable per environment? | Environment, debugging need | All in dev; Exception+FailedJob in production |

---

# Architecture-Level Decision Trees

---

## Decision 1: Which Watchers to Enable Per Environment?

---

## Decision Context

Telescope's 18 watchers each add overhead and storage. Selection must match environment needs — maximum in development, minimal in production.

---

## Decision Criteria

* performance
* security

---

## Decision Tree

What environment?
↓
**Production** → Enable only: ExceptionWatcher, QueryWatcher (slow > 100ms), JobWatcher (failed only) — <5ms overhead
**Staging** → Enable: Exception, SlowQuery, Mail, FailedJob — pre-production validation
**Development** → Enable ALL 18 watchers — comprehensive debugging data
Additional for all environments:
- Filter out health check requests via `Telescope::filter()`
- Set `size_limit` on RequestWatcher to exclude file uploads
- Disable DumpWatcher everywhere except local development
- Schedule `telescope:prune` to prevent unbounded storage

---

## Recommended Default

**Default:** All 18 watchers in development; Exception+SlowQuery+FailedJob in production
**Reason:** Maximum debugging data in development; minimal overhead and security risk in production

---

## Risks Of Wrong Choice

- **All watchers in production:** 50ms+ overhead per request; GBs of storage; PII in request data
- **No watchers in production:** Exceptions and failed jobs invisible until customer reports

---

## Related Rules

- TEMPLATE-RULE-009: Test all templates in CI

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

