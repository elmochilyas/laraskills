# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Test Framework & Runner Infrastructure
**Knowledge Unit:** Pest Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

1. it() vs test() syntax selection
2. Scoped vs global uses() trait application
3. Dataset naming strategy
4. Inline vs extracted dataset files

---

# Architecture-Level Decision Trees

---

## Decision Name: it() vs test() Syntax Selection

---

## Decision Context

Choose between Pest's `it()` and `test()` function signatures for each test case.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Test body calls `$this->...`?
↓
YES → Use `test('description', fn() => ...)`
NO → Continue

↓
Test needs `@depends` or `@group` annotations?
↓
YES → Use `test()` (annotations require method scope)
NO → Use `it()` for single-assertion tests; `test()` for multi-line logic

↓
Test body > 2-3 lines of logic?
↓
YES → Use `test()` with explicit closure (easier to debug)
NO → Higher-order `it()` chain is acceptable

---

## Rationale

`it()` closures have no `$this` access to the TestCase. `test()` provides full access. Multi-line logic in higher-order syntax becomes unreadable.

---

## Recommended Default

**Default:** `it()` for single-assertion tests, `test()` for anything using TestCase methods
**Reason:** Balances readability with Pest's expressive DSL; prevents fatal errors from missing `$this`.

---

## Risks Of Wrong Choice

Fatal "Using $this when not in object context" errors with `it()`. Unreadable complex chains with higher-order syntax.

---

## Related Rules

Rule 2: Use `test()` when `$this` is needed, `it()` for pure assertions
Rule 6: Prefer `test()` over higher-order syntax for tests with more than 2-3 lines

---

## Related Skills

Configure Pest Test Suite

---

## Decision Name: Scoped vs Global uses() Trait Application

---

## Decision Context

Choose how broadly to apply traits like RefreshDatabase via Pest's `uses()`.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Trait impacts database setup (e.g., RefreshDatabase)?
↓
YES → Scope narrowly with `uses(Trait::class)->in('tests/Feature')`
NO → Continue

↓
Trait affects test behavior globally (e.g., WithoutMiddleware)?
↓
YES → Can apply broadly, but prefer scoped
NO → Always scope to specific directory

↓
Multiple directories need same trait?
↓
YES → List specific directories: `->in('tests/Feature', 'tests/Integration')`
NO → Single directory with `->in('tests/Feature')`

---

## Rationale

Global `uses(RefreshDatabase::class)` forces every unit test to run database migrations, adding 30-50ms per test. Scoped application keeps unit tests fast.

---

## Recommended Default

**Default:** Always use `uses(Trait::class)->in('specific/directory')`
**Reason:** Prevents performance degradation of unit tests from unnecessary database setup.

---

## Risks Of Wrong Choice

Global uses slows unit tests significantly. Developers avoid writing unit tests due to slow feedback.

---

## Related Rules

Rule 1: Scope `uses()` to specific directories, never apply globally

---

## Related Skills

Configure Pest Test Suite

---

## Decision Name: Dataset Naming Strategy

---

## Decision Context

Choose between named and unnamed dataset keys in Pest's `->with()`.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Dataset used for test input/output verification?
↓
YES → Continue
NO → Not applicable

↓
Each row represents a distinct logical case?
↓
YES → Use named keys: `['case name' => [input, expected]]`
NO → Use unnamed arrays (auto-generated names suffice)

↓
Dataset has > 5 rows?
↓
YES → Named keys essential for debugging failures
NO → Named keys still recommended for clarity

---

## Rationale

Named keys appear in test failure output instead of numeric indices. A developer seeing "email validation (valid email)" immediately knows which case failed without inspecting the dataset.

---

## Recommended Default

**Default:** Always use named dataset keys
**Reason:** Failure output shows meaningful test case names instead of `(#0)`, `(#1)`.

---

## Risks Of Wrong Choice

Debugging test failures requires manually mapping numeric indices back to dataset values. Wastes developer time.

---

## Related Rules

Rule 3: Always name dataset keys semantically for readable failure output

---

## Related Skills

Configure Pest Test Suite
