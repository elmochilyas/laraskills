# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Test Framework & Runner Infrastructure
**Knowledge Unit:** Pest Framework Fundamentals
**Generated:** 2026-06-03

---

# Decision Inventory

1. Pest vs PHPUnit framework choice
2. it() vs test() syntax selection
3. describe() block usage and nesting
4. Higher-order vs explicit closure test style

---

# Architecture-Level Decision Trees

---

## Decision Name: Pest vs PHPUnit Framework Choice

---

## Decision Context

Choose between using Pest or raw PHPUnit for the project's test suite.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

New project (Laravel 13+)?
↓
YES → Use Pest (default, built-in support)
NO → Existing project with PHPUnit tests?
↓
YES → Team has bandwidth to migrate?
↓
YES → Gradually migrate to Pest file-by-file
NO → Stay with PHPUnit (working tests > migrated tests)

↓
Project needs architecture/mutation/browser testing built-in?
↓
YES → Pest provides these natively
NO → PHPUnit with extensions is sufficient

---

## Rationale

Pest reduces boilerplate ~40% and includes built-in architecture, mutation, and browser testing. PHPUnit is stable but requires more code and separate packages for advanced features.

---

## Recommended Default

**Default:** Pest for new projects; PHPUnit for established suites with no migration bandwidth
**Reason:** Pest is the default in Laravel 13+ and offers significant productivity gains.

---

## Risks Of Wrong Choice

Migrating without bandwidth breaks the test suite. Staying on PHPUnit misses productivity gains but is safe.

---

## Related Rules

Rule 7: Never rewrite working PHPUnit tests without a clear benefit

---

## Related Skills

Write Pest Tests with Correct Syntax and Organization

---

## Decision Name: it() vs test() Syntax Selection

---

## Decision Context

Choose the correct Pest function signature for each test case.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Test calls `$this->...` (actingAs, HTTP helpers, assertions)?
↓
YES → Use `test('description', fn() => ...)`
NO → Continue

↓
Test needs PHPUnit annotations (@depends, @dataProvider)?
↓
YES → Use `test()` (annotations require method scope)
NO → Use `it()` for single-assertion tests; `test()` for multi-line logic

↓
Test body > 2-3 lines of logic?
↓
YES → Use `test()` with explicit closure
NO → `it()` chain is acceptable

---

## Rationale

`it()` is more concise but lacks `$this` access. `test()` provides full TestCase access and supports annotations. Multi-line logic in higher-order chains is unreadable.

---

## Recommended Default

**Default:** `it()` for pure value assertions; `test()` for TestCase access or multi-step logic
**Reason:** Eliminates fatal errors and maintains readability.

---

## Risks Of Wrong Choice

Using `it()` with `$this` causes fatal PHP error. Complex higher-order chains are unreadable.

---

## Related Rules

Rule 1: Always use `test()` for tests requiring `$this`, use `it()` for pure value assertions

---

## Related Skills

Write Pest Tests with Correct Syntax and Organization

---

## Decision Name: describe() Block Usage and Nesting

---

## Decision Context

Choose how to organize tests within a file using describe() blocks.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Tests share common setup (beforeEach)?
↓
YES → Use `describe()` block with shared `beforeEach()`
NO → No describe needed (flat file is simpler)

↓
Multiple features in same file?
↓
YES → Use separate describe blocks per feature
NO → Single describe or no describe

↓
Nesting > 2 levels needed?
↓
YES → Split into separate test files (flatten hierarchy)
NO → Nest up to 2 levels maximum

---

## Rationale

Deeply nested describes reduce readability and may hit PHPUnit class nesting limits. Each describe transpiles to a nested PHP class.

---

## Recommended Default

**Default:** Flat files for simple tests; 1-2 level describe for grouped setup
**Reason:** Balances organization with readability; prevents nesting limit errors.

---

## Risks Of Wrong Choice

4+ levels cause "Class too deeply nested" errors. No describe blocks in large files make setup logic repetitive.

---

## Related Rules

Rule 4: Limit `describe()` nesting to 2 levels maximum

---

## Related Skills

Write Pest Tests with Correct Syntax and Organization
