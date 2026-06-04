# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Factories & Seeders
**Knowledge Unit:** Factory States
**Generated:** 2026-06-03

---

# Decision Inventory

* State method vs inline attribute overrides
* State naming (domain vs implementation)
* State composition and conflict resolution

---

# Architecture-Level Decision Trees

---

## State Method vs Inline Attribute Overrides

---

## Decision Context

Choosing between a named factory state method and inline attribute overrides in `create()`.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the same attribute override pattern used in 3+ tests?
↓
YES → Extract to a named state method — reusable, intention-revealing
NO → Is the override one-off for a specific test?
    YES → Inline attribute override is sufficient
    NO → Extract to state method — indicates upcoming reuse

---

## Recommended Default

**Default:** Inline for one-off patterns; state method for repeated patterns
**Reason:** Extract when duplication emerges; don't speculate on future reuse.

---

## Risks Of Wrong Choice

Too many state methods for one-off patterns pollute the factory API. Too few extracted states lead to duplicated override patterns across tests.

---

## Related Rules

* Extract Repeated Overrides into Named State Methods

---

## Related Skills

* Create Named Factory State Methods

---

## State Naming

---

## Decision Context

Choosing a name for a factory state method — domain condition vs implementation detail.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the state name describe the business condition or the implementation?
↓
Business condition → Correct — `admin()`, `verified()`, `premium()`
Implementation detail → Wrong — `isAdmin(true)`, `role('superuser')`
    ↓
    Rename to describe the domain condition, not the attribute value

---

## Recommended Default

**Default:** Name states after domain conditions
**Reason:** Expresses intent; callers know what the state represents, not which attributes it sets.

---

## Risks Of Wrong Choice

Implementation-named states couple the factory API to schema column names, making it harder to refactor the schema.

---

## Related Rules

* Name States After Domain Conditions, Not Implementation

---

## Related Skills

* Create Named Factory State Methods

---

## State Composition and Conflict Resolution

---

## Decision Context

Chaining multiple states and handling attribute conflicts between them.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Do chained states set overlapping attributes?
↓
YES → Is the conflict resolution order documented?
    YES → Later states in the chain override earlier ones — document the precedence
    NO → Document which states conflict and which wins in composition
NO → No conflict — states compose cleanly

---

## Recommended Default

**Default:** Document conflicting states and expected composition order
**Reason:** Prevents surprises when state methods are chained in different orders.

---

## Risks Of Wrong Choice

Undocumented state conflicts cause unpredictable attribute values depending on chaining order, leading to hard-to-debug test failures.

---

## Related Rules

* Compose States Explicitly; Document Conflicts

---

## Related Skills

* Create Named Factory State Methods
