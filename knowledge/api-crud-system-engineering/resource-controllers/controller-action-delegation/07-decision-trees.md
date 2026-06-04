# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Controller Action Delegation
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Delegation Threshold Decision

---

## Decision Context

Determining when business logic in a controller method should be extracted to a separate action or service class.

---

## Decision Criteria

* architectural
* maintainability
* performance

---

## Decision Tree

Does the controller method contain business logic beyond a single Eloquent call?
├── YES → Extract to an action class or service
└── NO → Is the method used from multiple entry points (HTTP, CLI, queue)?
    ├── YES → Extract to an action class for reuse
    └── NO → Does the method exceed 10-15 lines?
        ├── YES → Extract to an action class
        └── NO → Is the same logic used elsewhere in the codebase?
            ├── YES → Extract to a shared action/service
            └── NO → Keep inline (simple one-liner is acceptable)

---

## Rationale

Controllers are HTTP adapters, not business logic containers. Delegation preserves single responsibility, enables reuse across entry points, and makes business logic testable without HTTP concerns. However, over-delegation for trivial CRUD adds unnecessary abstraction.

---

## Recommended Default

**Default:** Delegate any logic beyond `Model::create($validated)` or `Model::paginate()` to an action class
**Reason:** Keeps controllers thin; enables reuse; preserves testability.

---

## Risks Of Wrong Choice

Fat controllers are hard to test and cannot reuse business logic from CLI/queue. Over-delegation for simple CRUD creates unnecessary file count and abstraction.

---

## Related Rules

* Delegate Business Logic Out Of Controllers
* Inject Action Classes Via Constructor
* Actions Must Return Domain Objects, Never HTTP Responses
* Name Action Classes With Verb-First Naming

---

## Related Skills

* Implement Controller Action Delegation
