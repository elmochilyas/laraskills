# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP Engine Performance
**Knowledge Unit:** Typed Properties Performance
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Typed vs untyped property declaration | Implementation | Implement |
| 2 | readonly vs mutable property design | Architecture | Architect |
| 3 | Specific vs union/mixed type selection | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: Typed vs Untyped Property Declaration

---

## Decision Context

Every class property can be declared with or without an explicit type. The choice affects both performance and code correctness.

---

## Decision Criteria

* **performance** — typed enables specialized opcodes, 5-15% gain in property-heavy code
* **architectural** — typed properties enable JIT guard elimination
* **security** — type enforcement prevents unexpected type injection
* **maintainability** — types document intent; union types may still be needed

---

## Decision Tree

Is this new code or legacy code?
↓
**New code** → Always declare explicit types on all properties
**Legacy code** → Consider migration cost vs performance gain

---

Is the property on a hot code path (frequent access in profiling)?
↓
**YES** → High priority for typing (5-15% execution time reduction)
**NO** → Type for correctness; performance gain is secondary

---

Does the property hold a single type or multiple types?
↓
**Single type** → Use explicit primitive type (int, string, bool, float)
**Multiple types** → Use union type (PHP 8.0+) or keep untyped with validation

---

Is the property immutable after construction?
↓
**YES** → Use readonly (8.1+) for additional 3-8% gain
**NO** → Use typed only; mutable properties cannot be readonly

---

## Rationale

Typed properties enable the Zend Engine to generate specialized opcodes and skip runtime type checks. Readonly eliminates write barriers. The combination provides compounding gains.

---

## Recommended Default

**Default:** Declare all new properties with explicit primitive types; use readonly for immutable properties.
**Reason:** Always beneficial for performance and correctness with no downside.

---

## Risks Of Wrong Choice

* Untyped properties in hot code: missed 5-15% execution time reduction
* Not using readonly: missed additional 3-8% gain
* Using mixed/default: no type specialization possible

---

## Related Rules

* Declare All Properties with Explicit Types
* Use readonly for Immutable Properties
* Prefer Primitive Types Over Mixed or Union Types

---

## Related Skills

* Optimize Hot-Path Code Using Typed Properties
