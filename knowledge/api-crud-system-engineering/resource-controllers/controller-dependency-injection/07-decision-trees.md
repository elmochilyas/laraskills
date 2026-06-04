# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Controller Dependency Injection
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Constructor vs Method Injection Decision

---

## Decision Context

Choosing between constructor injection and method injection for controller dependencies.

---

## Decision Criteria

* architectural
* maintainability
* performance

---

## Decision Tree

Is the dependency used in 3+ controller methods?
├── YES → Use constructor injection (single resolved instance)
└── NO → Is the dependency a Request object or form request?
    ├── YES → Always use method injection (Request not fully initialized at construction)
    └── NO → Is the dependency used in only 1-2 methods?
        ├── YES → Use method injection (keeps constructor lean)
        └── NO → Use method injection for action-specific deps

Does the controller have more than 4 constructor dependencies?
├── YES → Violation: Split the controller or group related deps into service/action classes
└── NO → Acceptable dependency count

---

## Rationale

Constructor injection provides a single resolved instance and keeps method signatures lean. Repeating the same dependency across multiple method signatures is redundant. Request objects cannot be constructor-injected.

---

## Recommended Default

**Default:** Constructor injection for shared deps (3+ methods); method injection for action-specific deps
**Reason:** Balances lean constructors with clean method signatures.

---

## Risks Of Wrong Choice

Injecting Request in constructor causes empty properties. 8+ constructor parameters signals SRP violation. `app()->make()` in methods hides dependencies from class signature.

---

## Related Rules

* Limit Constructor Dependencies To Four
* Never Inject Request In Constructor
* Use Constructor Promotion For Injections
* Never Use app()->make() In Controller Methods
* Type-Hint All Injectable Parameters

---

## Related Skills

* Implement Controller Dependency Injection
* Inject Dependencies Directly Into Controller Methods
