# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Controller Method Injection
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Injection Strategy Decision

---

## Decision Context

Choosing the correct injection strategy (constructor vs method) for a given controller dependency.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the dependency used in 3+ methods across the controller?
├── YES → Constructor injection (single instance, lean signatures)
└── NO → Is the dependency a Request object or form request?
    ├── YES → Method injection (Request not ready at construction)
    └── NO → Is the dependency used in only 1-2 methods?
        ├── YES → Method injection (keeps constructor from bloating)
        └── NO → Method injection for action-specific deps

Is the dependency expensive to construct?
├── YES → Constructor injection preferred (resolved once)
└── NO → Method injection is fine for action-specific deps

---

## Rationale

Constructor injection for shared dependencies keeps method signatures lean. Method injection for action-specific dependencies prevents constructor bloat. Request objects must always use method injection as they are not fully initialized at constructor time.

---

## Recommended Default

**Default:** Constructor injection for dependencies used in 3+ methods; method injection for 1-2 method dependencies
**Reason:** Clean separation between shared and action-specific dependencies.

---

## Risks Of Wrong Choice

Injecting the same dependency in every method signature is redundant and harder to read. Request injected in constructor has empty properties. Untyped parameters receive route values instead of resolved services.

---

## Related Rules

* Use Constructor Injection For Shared Dependencies
* Never Inject Request In Constructor
* Maintain Consistent Parameter Order
* Type-Hint All Injectable Parameters

---

## Related Skills

* Inject Dependencies Directly Into Controller Methods
