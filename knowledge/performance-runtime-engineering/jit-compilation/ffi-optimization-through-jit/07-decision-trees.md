# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** FFI Optimization Through JIT
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether to use FFI with JIT for native code integration | Architecture | Evaluate |
| 2 | FFI vs C extension vs pure PHP for performance-critical paths | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: Using FFI with JIT

---

## Decision Context

FFI allows calling C functions from PHP. With JIT enabled, per-call overhead drops 4-10x, making FFI viable for performance-critical paths.

---

## Decision Criteria

* **performance** — JIT reduces FFI overhead from 200-500ns to 30-50ns per call
* **architectural** — FFI bypasses PHP memory safety; risk of crashes
* **security** — unsanitized user input should never reach FFI calls
* **maintainability** — simpler than writing C extensions

---

## Decision Tree

Is JIT already enabled?
↓
**NO** → Enable JIT first. FFI without JIT has 200-500ns per-call overhead.
**YES** → Proceed with FFI evaluation.

---

Does a PHP C extension already exist for this library?
↓
**YES** → Use the C extension. It's faster than FFI+JIT and better integrated.
**NO** → FFI is the right choice for native library integration.

---

Are the FFI calls in a hot loop (executed 1000+ times per request)?
↓
**YES** → JIT inlining makes FFI viable. Ensure complete type declarations.
**NO** → FFI overhead is acceptable even without JIT optimization.

---

Are FFI type declarations complete (all parameter and return types)?
↓
**YES** → JIT can eliminate guard checks and inline FFI calls.
**NO** → Add complete type declarations. Partial types prevent JIT optimization.

---

Are FFI headers preloaded via opcache.preload?
↓
**YES** → Avoids runtime parsing overhead on each request.
**NO** → Add FFI::load() to preload script for maximum performance.

---

## Rationale

FFI+JIT is ~3-5x slower than a native C extension but 10-50x faster than pure PHP for compute-heavy operations. It's ideal when no C extension exists and a native library needs integration.

---

## Recommended Default

**Default:** Use C extensions when available. Use FFI+JIT when no extension exists and performance is critical.
**Reason:** C extensions are faster and safer. FFI+JIT is the next best option.

---

## Risks Of Wrong Choice

* FFI without JIT in hot loops: 4-10x slower than expected
* FFI with unsanitized user input: arbitrary code execution risk
* Incomplete type declarations: JIT can't optimize

---

## Related Rules

* Enable JIT for FFI-Heavy Code
* Preload FFI Headers
* Use Complete Type Declarations

---

## Related Skills

* FFI Optimization Through JIT
