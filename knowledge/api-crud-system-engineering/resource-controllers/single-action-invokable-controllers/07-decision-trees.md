# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Single-Action Invokable Controllers
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Invokable vs Resource Controller Decision

---

## Decision Context

Choosing between an invokable controller for a single action and adding the action to an existing resource controller.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the action a standard CRUD operation (index, create, store, show, edit, update, destroy)?
├── YES → Use a resource controller (fit it into the seven-method contract)
└── NO → Is the action a single-purpose endpoint (search, restore, export, webhook)?
    ├── YES → Use an invokable controller with `__invoke`
    └── NO → Could the action logically belong to a resource controller?
        ├── YES → Still use invokable — keep resource controllers focused
        └── NO → Use an invokable controller

Would the action be the only method in the controller?
├── YES → Invokable controller is the right fit
└── NO → Use a resource controller with `only()` to whitelist needed actions

---

## Rationale

Invokable controllers enforce single responsibility by design. Adding custom actions to resource controllers violates the predictable seven-method contract and hides non-CRUD endpoints.

---

## Recommended Default

**Default:** Invokable controllers for all non-CRUD single-purpose endpoints
**Reason:** Self-documenting (verb-first naming), SRP-enforcing, route-caching compatible.

---

## Risks Of Wrong Choice

Adding search/restore/archive to resource controllers violates SRP and hides non-CRUD endpoints. Using invokable for CRUD spreads related actions across too many files.

---

## Related Rules

* Use Invokable Controllers For Single Actions
* Keep Invokable Controllers Under 30 Lines
* Never Add A Second Public Method
* Use Descriptive Verb-First Naming

---

## Related Skills

* Implement Single Action Invokable Controllers
