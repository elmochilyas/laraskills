# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Factories & Seeders
**Knowledge Unit:** HasMany Factories
**Generated:** 2026-06-03

---

# Decision Inventory

* has() vs afterCreating for child creation
* Magic has{Relation} vs explicit has()
* Uniform vs varying child attributes

---

# Architecture-Level Decision Trees

---

## has() vs afterCreating for Child Creation

---

## Decision Context

Choosing between `has()` (declarative) and `afterCreating()` (callback) for setting up HasMany children.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the child creation a standard HasMany relationship?
↓
YES → Use `has()` — declarative, automatic FK resolution, simpler
NO → Does the child creation require complex conditional logic?
    YES → Use `afterCreating()` — full control over child setup
    NO → `has()` is simpler — prefer the declarative approach

---

## Recommended Default

**Default:** `has()` for all standard HasMany factory relationships
**Reason:** Declarative, single-line, and automatically resolves foreign keys.

---

## Risks Of Wrong Choice

Using `afterCreating()` for simple `has()` relationships duplicates framework functionality. Using `has()` with complex conditional logic requires workarounds.

---

## Related Rules

* Use has() for All HasMany Factory Relationships
* Use has() Instead of afterCreating for Child Relationships

---

## Related Skills

* Set Up HasMany Factory Relationship with has()

---

## Magic has{Relation} vs Explicit has()

---

## Decision Context

Choosing between the shorthand magic `has{Relation}()` method and the explicit `has()` method.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the child need only a count (no custom states, sequences, or overrides)?
↓
YES → Use magic `has{Relation}()` — cleaner, more readable
NO → Does the child need states, sequences, or complex configuration?
    YES → Use explicit `has()` with a configured child factory
    NO → Magic method is sufficient

---

## Recommended Default

**Default:** Magic `has{Relation}()` for simple counts
**Reason:** Cleaner call site for the most common case.

---

## Risks Of Wrong Choice

Using explicit `has()` with a plain factory for simple counts is unnecessarily verbose. Magic methods don't support child configuration (states, sequences).

---

## Related Rules

* Use Magic has{Relation} Methods for Readability

---

## Related Skills

* Set Up HasMany Factory Relationship with has()

---

## Uniform vs Varying Child Attributes

---

## Decision Context

Choosing how to pass attribute overrides when creating multiple children via `has()`.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Are child attribute values identical for all children?
↓
YES → Pass as second argument to `has()` — uniform across all children
NO → Do values vary per child?
    YES → Use `sequence()` on the child factory — varying values per position
    NO → No overrides needed — omit them

---

## Recommended Default

**Default:** Second argument for uniform values; `sequence()` for varying values
**Reason:** Each approach fits its use case — uniform for shared overrides, sequence for per-child variation.

---

## Risks Of Wrong Choice

Passing varying values as the second argument assigns the same value to every child. Using `sequence()` for uniform values is over-engineering.

---

## Related Rules

* Pass Attribute Overrides as the Second Argument to has()

---

## Related Skills

* Set Up HasMany Factory Relationship with has()
