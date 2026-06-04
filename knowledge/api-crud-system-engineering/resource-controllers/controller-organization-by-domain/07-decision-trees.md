# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Controller Organization by Domain
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Domain Organization Threshold

---

## Decision Context

Choosing between flat controller directory and domain-organized directory structure.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the application have more than 20 controllers?
├── YES → Are there multiple distinct business domains (Billing, Inventory, Users)?
│   ├── YES → Organize by domain: `Controllers/Billing/`, `Controllers/Inventory/`
│   └── NO → Are teams organized by domain?
│       ├── YES → Organize by domain for team ownership
│       └── NO → Flat directory with descriptive prefixes may suffice
└── NO → Flat controller directory is simpler and sufficient

Is future extraction to microservices anticipated?
├── YES → Domain organization now reduces migration pain later
└── NO → Flat organization is acceptable for single-domain apps

---

## Rationale

Domain-organized controllers align with DDD principles and team ownership boundaries. Flat directories become unmanageable beyond ~20 controllers, with naming conflicts and navigation difficulty.

---

## Recommended Default

**Default:** Flat for <20 controllers; domain-organized for 20+ controllers or multi-team projects
**Reason:** Balances simplicity at small scale with organization at large scale.

---

## Risks Of Wrong Choice

Premature domain organization for small apps adds unnecessary directory depth. Flat organization for large apps causes naming collisions and navigation difficulty.

---

## Related Rules

* Group Controllers By Bounded Context
* Co-Locate Form Requests With Domain Controllers
* Enforce Cross-Domain Dependency Rules

---

## Related Skills

* Organize Controllers by Domain or Resource
