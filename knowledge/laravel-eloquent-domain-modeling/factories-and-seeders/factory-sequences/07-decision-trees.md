# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Factories & Seeders
**Knowledge Unit:** Factory Sequences
**Generated:** 2026-06-03

---

# Decision Inventory

* Sequence vs Faker for attribute values
* Inline vs extracted sequence
* CrossJoinSequence vs nested sequences

---

# Architecture-Level Decision Trees

---

## Sequence vs Faker for Attribute Values

---

## Decision Context

Choosing between `sequence()` (deterministic) and Faker (randomized) for attribute values in factory batches.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Does the test assertion depend on specific attribute values?
↓
YES → Use `sequence()` — deterministic, predictable, repeatable
NO → Is the data for development seeding (realistic, varied)?
    YES → Use Faker in `definition()` — realistic data variety
    NO → Is the data for non-assertion test setup?
        YES → Faker is acceptable — values don't affect assertions
        NO → Sequence for deterministic control

---

## Recommended Default

**Default:** Faker in `definition()` for general use; `sequence()` for test assertions
**Reason:** Faker provides realistic data; sequence provides deterministic control when needed.

---

## Risks Of Wrong Choice

Using Faker in tests with value-dependent assertions causes flaky tests (passes sometimes, fails on unlucky Faker output). Using sequences for all data produces unrealistic, repetitive data.

---

## Related Rules

* Use Sequences for Deterministic Test Data

---

## Related Skills

* Set Up Deterministic Test Data with sequence()

---

## Inline vs Extracted Sequence

---

## Decision Context

Choosing between defining a sequence inline at the call site vs extracting it to a reusable method.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the same sequence used across 3+ tests or seeder calls?
↓
YES → Extract to a static factory method — reusable, single source of truth
NO → Keep inline — sequence is specific to one test scenario

---

## Recommended Default

**Default:** Inline for one-off test distributions
**Reason:** Keeps the sequence close to its usage context.

---

## Risks Of Wrong Choice

Inlining a sequence across many tests duplicates it in multiple places, making updates error-prone.

---

## Related Rules

* Use the Sequence Index for Position-Dependent Logic

---

## Related Skills

* Set Up Deterministic Test Data with sequence()

---

## CrossJoinSequence vs Nested Sequences

---

## Decision Context

Choosing between `CrossJoinSequence` and manually nesting sequences for combinatorial test coverage.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Do you need exhaustive combination coverage across multiple attribute dimensions?
↓
YES → Use `CrossJoinSequence` — generates all combinations automatically
NO → Is the combination set small and manually enumerable?
    YES → Manual `sequence()` list is simpler
    NO → Use `CrossJoinSequence` for completeness

---

## Recommended Default

**Default:** Manual `sequence()` for small sets; `CrossJoinSequence` for exhaustive combinations
**Reason:** Manual sequence is more readable for small sets; CrossJoin prevents missed combinations in large sets.

---

## Risks Of Wrong Choice

Manual sequence for large combinatorial sets is error-prone (missed combinations). CrossJoinSequence for small sets adds complexity.

---

## Related Rules

* Use CrossJoinSequence for Exhaustive Combinatorial Coverage

---

## Related Skills

* Set Up Deterministic Test Data with sequence()
