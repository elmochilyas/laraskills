# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Controller Form Request Integration
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Form Request vs Inline Validation Decision

---

## Decision Context

Choosing between a dedicated form request class and inline `$request->validate()` for controller validation.

---

## Decision Criteria

* architectural
* security
* maintainability

---

## Decision Tree

Does the action accept user input that needs validation?
├── YES → Is this a store or update action (mutating)?
│   ├── YES → Always use a dedicated form request class
│   └── NO → Is validation more than a single simple rule?
│       ├── YES → Use a form request class
│       └── NO → Inline `$request->validate()` is acceptable (rare)
└── NO → No validation needed (read-only index/show)
    └── Form request not required

Should store and update share a single form request?
├── YES → Only if rules are truly identical (rare)
└── NO → Create separate Store and Update form requests
    ├── Store: all fields required
    └── Update: all fields sometimes (partial updates)

---

## Rationale

Form requests encapsulate validation rules and authorization checks in dedicated testable classes. Inline validation mixes concerns and cannot be reused. Separate store/update requests are cleaner because they have different rule requirements.

---

## Recommended Default

**Default:** Dedicated Store/Update form requests for every mutating action
**Reason:** Testable, reusable, authorization-gated, and security-hardened.

---

## Risks Of Wrong Choice

Inline validation in controllers increases line count and cannot be unit tested. Shared store/update request forces conditional rules that are harder to maintain. Using `$request->all()` bypasses validation entirely.

---

## Related Rules

* Always Use Form Requests For Store And Update
* Always Use ->validated() Never ->all()
* Create Separate Store And Update Form Requests
* Keep authorize() Simple In Form Requests

---

## Related Skills

* Implement Controller Form Request Integration
