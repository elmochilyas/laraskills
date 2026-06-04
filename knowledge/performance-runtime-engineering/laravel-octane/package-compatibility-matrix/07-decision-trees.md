# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Package Compatibility Matrix
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Package compatibility verification before Octane | Operations | Verify |

---

# Architecture-Level Decision Trees

---

## Decision: Package Compatibility Check

---

## Decision Context

Not all Laravel packages work with Octane. Statics, globals, singletons with per-request state, and event registration in constructors are common issues.

---

## Decision Criteria

* **architectural** — package state management determines compatibility
* **operations** — compatibility check prevents production surprises
* **maintainability** — incompatible packages require alternatives or fixes

---

## Decision Tree

Does the package use static properties for state?
↓
**YES** — Likely incompatible. Verify the static is reset per-request.
**NO** — Check other patterns.

---

Does the package register event listeners in constructor or boot?
↓
**YES** — Listeners accumulate across requests. Ensure registration in service provider.
**NO** — Standard pattern.

---

Does the package use facades with cached state?
↓
**YES** — Facade state persists across requests. Verify facades are request-scoped.
**NO** — Lower risk.

---

Is there an Octane compatibility note in the package docs?
↓
**YES** — Follow guidance.
**NO** — Test in Octane staging environment.

---

Is the package in the Laravel Octane compat list?
↓
**YES** — Known compatible.
**NO** — Test thoroughly.

---

## Recommended Default

**Default:** Test all packages in Octane staging before production deployment.
**Reason:** Package compatibility is the most common Octane migration issue.

---

## Risks Of Wrong Choice

* Assuming compatibility without testing: state bugs in production
* Not checking static usage: silent data corruption

---

## Related Skills

* Package Compatibility Matrix
