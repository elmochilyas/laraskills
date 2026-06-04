# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Trait Boot Ordering
**Generated:** 2026-06-03

---

# Decision Inventory

* Trait ordering in use statement
* Inter-trait dependency management
* Conflict resolution strategy

---

# Architecture-Level Decision Trees

---

## Trait Ordering in use Statement

---

## Decision Context

Determining the order of traits in a model's `use` statement based on dependencies.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Do any traits depend on other traits' boot methods running first?
↓
YES → List dependent traits AFTER their dependencies
NO → Are there any implicit boot-order dependencies?
    YES → Document and order accordingly
    NO → Order is arbitrary — use alphabetical for consistency

---

## Recommended Default

**Default:** Alphabetical order for independent traits; dependency order for dependent traits
**Reason:** Alphabetical is predictable and easy to maintain; dependency order ensures correct boot sequence.

---

## Risks Of Wrong Choice

Wrong trait order causes dependent traits to boot before their dependencies are ready, leading to missing scopes, events, or state.

---

## Related Rules

* List dependent traits first
* Order traits by dependency

---

## Related Skills

* Order Trait Boot Methods Correctly

---

## Inter-Trait Dependency Management

---

## Decision Context

Handling traits that depend on other traits' setup.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does trait A depend on trait B's boot method?
↓
YES → Is the dependency documented in trait A's docblock?
    YES → List trait B before trait A in the use statement
    NO → Add dependency documentation to trait A
NO → No inter-trait dependency — traits are self-contained

---

## Recommended Default

**Default:** Document all inter-trait dependencies in the dependent trait's docblock
**Reason:** Future maintainers can see which traits must be present and in which order.

---

## Risks Of Wrong Choice

Undocumented dependencies cause subtle bugs when traits are used without their dependencies, or in the wrong order.

---

## Related Rules

* Document inter-trait dependencies
* Avoid inter-trait dependencies where possible

---

## Related Skills

* Order Trait Boot Methods Correctly

---

## Conflict Resolution Strategy

---

## Decision Context

Resolving method name conflicts when two traits define the same method.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Do two traits define the same method name?
↓
YES → Is one method meant to replace the other?
    YES → Use `insteadof` to choose one implementation
    NO → Can both methods be preserved under different names?
        YES → Use `as` to alias the conflicting method
        NO → Refactor to remove the conflict

---

## Recommended Default

**Default:** `insteadof` to pick one implementation; `as` to create aliases
**Reason:** These operators are the standard PHP mechanism for trait conflict resolution.

---

## Risks Of Wrong Choice

Ignoring trait conflicts causes fatal errors. Using `insteadof` when both methods are needed loses functionality. Using `as` for simple exclusive choices adds unnecessary aliases.

---

## Related Rules

* Use insteadof for explicit conflict resolution

---

## Related Skills

* Order Trait Boot Methods Correctly
