# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** Type Inference and Guard Elimination
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether to invest in type declarations for JIT | Performance | Optimize |
| 2 | How to fix guard failures in JIT-compiled code | Debug | Analyze |

---

# Architecture-Level Decision Trees

---

## Decision: Invest in Type Declarations for JIT Optimization

---

## Decision Context

Guard elimination accounts for 40-60% of JIT's speedup. Whether to invest in adding or improving type declarations depends on the code path's CPU intensity.

---

## Decision Criteria

* **performance** — typed properties enable guard elimination; docblock types don't
* **architectural** — PHP 8.0+ declared types are required for JIT optimization
* **maintainability** — focus type improvement on CPU-bound code paths

---

## Decision Tree

Is this code path CPU-bound (appears in JIT profiles)?
↓
**NO (I/O-bound)** → Type declarations still improve correctness but JIT benefit is minimal
**YES** → High priority for typing improvement

---

Are properties declared with PHP 8.0+ typed syntax or PHPDoc-only?
↓
**PHPDoc-only (@var int)** → Convert to PHP 8.0+ typed properties (public int $x) — JIT ignores docblocks
**PHP 8.0+ typed** → Good; proceed to check return types

---

Do methods have return types declared?
↓
**YES** → JIT can eliminate guards at call sites
**NO** → Add return types — JIT must handle mixed return values without them

---

Is declare(strict_types=1) enabled?
↓
**YES** → Type inference is strengthened; implicit coercion doesn't confuse JIT
**NO** → Add strict_types=1 to CPU-bound code files

---

Are there any `mixed` type hints that can be narrowed?
↓
**YES** → Replace with specific types or union types — mixed forces full guards
**NO** → No further type improvements needed

---

## Rationale

Guard elimination is the single largest source of JIT speedup (40-60%). PHP 8.0+ typed properties enable this; PHPDoc-only types do not. Focus type improvement effort on CPU-bound code paths where JIT provides the most benefit.

---

## Recommended Default

**Default:** Use PHP 8.0+ typed properties, return types, and strict_types=1 in all new code.
**Reason:** Enables maximum JIT guard elimination and improves code correctness.

---

## Risks Of Wrong Choice

* PHPDoc types instead of declared types: JIT ignores them, guards remain
* No return types: JIT inserts guards at every call site
* mixed type: forces full guards, no optimization possible

---

## Related Rules

* Use Typed Properties for JIT Guard Elimination
* Add Return Types to All Methods
* Use strict_types=1

---

## Related Skills

* Type Inference and Guard Elimination
