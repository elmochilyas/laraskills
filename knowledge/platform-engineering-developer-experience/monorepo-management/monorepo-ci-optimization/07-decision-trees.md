# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Monorepo Management
**Knowledge Unit:** Monorepo CI Optimization
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Change-aware CI vs full suite on every commit? | CI time, package coupling | Change-aware on PR; full suite nightly |
| 2 | Test only changed packages or include dependents? | Safety, cross-package coupling | Test changed + transitive dependents |

---

# Architecture-Level Decision Trees

---

## Decision 1: Change-Aware CI vs Full Suite on Every Commit?

---

## Decision Context

Monorepo CI can run all package tests (fast feedback for simple repos) or use change detection to test only affected packages. The choice depends on CI time and package coupling.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

How many packages are in the monorepo?
↓
1-2 → Full suite on every commit is fine
3+ ↓
What is the full suite CI time?
↓
< 15 minutes → Full suite may be acceptable; change detection is optional
15+ minutes → ↓
Do most commits change only a subset of packages?
↓
NO (tightly coupled) → Change detection provides minimal benefit
YES → **Implement change-aware CI** — test only changed packages and dependents; full suite nightly
Regardless:
- Run baseline checks (lint, static analysis) on all packages
- Include shared infrastructure in change detection scope
- Use setup job to generate test matrix

---

## Rationale

Change-aware CI provides fast feedback while ensuring safety through transitive dependency testing. The 15-minute threshold identifies when optimization becomes important. Nightly full suites catch cross-package interaction bugs.

---

## Recommended Default

**Default:** Change-aware CI for 3+ packages with > 15 min full suite; full suite for smaller setups
**Reason:** Balances fast PR feedback with comprehensive safety net

---

## Risks Of Wrong Choice

- **Full suite on every commit (slow CI):** Developers merge without waiting; broken code lands on main
- **Change-aware without nightly:** Cross-package regression missed; surfaces later with customer impact

---

## Related Rules

- GP-RULE-011: Test paths in CI
- GP-RULE-013: Full automation

---

## Related Skills

- Manage Golden Path Lifecycle and Adoption

---

## Decision 2: Test Only Changed Packages or Include Dependents?

---

## Decision Context

When a package changes, testing only that package is fast but may miss breakage in packages that depend on it. Including transitive dependents is safer but slower.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Do any packages depend on other packages in the monorepo?
↓
NO → Test only changed packages directly; no dependents to worry about
YES → ↓
Are the dependencies well-defined and acyclic?
↓
NO → Fix dependency design first; CI cannot safely test undefined relationships
YES → ↓
How deep is the dependency chain?
↓
1 level (A → B) → Test changed + direct dependents
2+ levels (A → B → C) → **Resolve full transitive closure** and test all affected packages
Regardless:
- Build dependency graph from `composer.json` files
- CI validates acyclic dependency graph on every run
- Add full suite nightly to catch edge cases

---

## Rationale

Testing only changed packages misses breakage in consumers of those packages. The dependency graph must be acyclic and well-defined for safe transitive testing. The cost of a missed regression far exceeds the cost of running dependent tests.

---

## Recommended Default

**Default:** Test changed packages AND their transitive dependents
**Reason:** Missed cross-package regressions are costly and erode trust in CI

---

## Risks Of Wrong Choice

- **Only changed packages:** Dependent packages break silently; merged to main before detection
- **Always full suite:** 30+ minute CI times; developers bypass waiting; broken code merged

---

## Related Rules

- GP-RULE-014: Compliance encoding
- GP-RULE-015: Secure defaults

---

## Related Skills

- Manage Golden Path Lifecycle and Adoption

