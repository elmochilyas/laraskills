# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Thin Controller Enforcement
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Enforcement Rule Selection

---

## Decision Context

Choosing which automated enforcement rules to implement first when setting up thin controller enforcement.

---

## Decision Criteria

* architectural
* maintainability
* performance

---

## Decision Tree

Is this a new project (greenfield) or existing codebase (brownfield)?
├── Greenfield → Which rules have the highest impact with lowest false-positive rate?
│   ├── Start with: No Eloquent static calls in controllers
│   ├── Then add: Max 200 lines per controller file
│   └── Then add: Form request type-hint required on store/update
└── Brownfield → Is there a plan for graduated enforcement?
    ├── YES → Use PHPStan baseline; add 1 rule per sprint
    │   ├── Sprint 1: No Eloquent in controllers (warnings only)
    │   ├── Sprint 2: Max 200 lines (warnings)
    │   ├── Sprint 3: Form request type-hint (errors)
    │   └── Sprint 4+: Deptrac layer enforcement
    └── NO → Start with baseline capture; add 2-3 rules as warnings first

---

## Rationale

Deploying 15 rules on day one causes team revolt; gradual adoption builds buy-in. Starting with high-impact, low-false-positive rules builds credibility for architectural enforcement.

---

## Recommended Default

**Default:** PHPStan: no Eloquent in controllers, max 200 lines, form request type-hint; Deptrac: Controllers → Services → Repositories
**Reason:** These three rules catch the most common and harmful violations with minimal false positives.

---

## Risks Of Wrong Choice

Too many rules at once causes team revolt and rule disabling. No baseline on legacy codebase blocks CI on 500 pre-existing violations. No exemption mechanism leads to workarounds.

---

## Related Rules

* Enforce No Eloquent In Controllers
* Enforce Controller File Size With PHPStan
* Enforce Form Request Type Hint On Store And Update
* Enforce Layer Direction With Deptrac

---

## Related Skills

* Implement Thin Controller Principle
