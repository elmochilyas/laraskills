# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** CRTO Bitmask Reference
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Standard preset vs custom CRTO value | Configuration | Configure |
| 2 | Register allocation mode (R digit) selection | Configuration | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: Standard Preset vs Custom CRTO Value

---

## Decision Context

The CRTO bitmask has four digits (C, R, T, O). Standard presets cover 95% of use cases. Custom values are rarely needed.

---

## Decision Criteria

* **performance** — each digit independently affects compilation strategy
* **architectural** — some combinations (e.g., trigger=0) disable JIT entirely
* **maintainability** — standard presets are well-documented and supported

---

## Decision Tree

Is this a standard production deployment?
↓
**YES** → Use standard presets: 1254 (tracing), 1255 (tracing+default), 1205 (function), or 1235 (max)
**NO (specialized workload)** → Consider custom CRTO with benchmarking

---

Which standard preset matches the workload?
↓
**General web (mixed I/O + CPU)** → 1254 (tracing, reduced optimizations)
**CPU-bound batch processing** → 1235 (tracing, all optimizations including inlining)
**Function-call-heavy (ORM, services)** → 1205 (function JIT)
**Memory-constrained** → 1254 (tracing, less fragmentation)

---

Is there a specific reason for custom values?
↓
**YES (specific optimization goal)** → Customize only the digit that matters; keep others at defaults
**NO** → Use standard preset; arbitrary combinations may disable JIT

---

Has the custom value been benchmarked against the standard preset?
↓
**YES (demonstrated improvement)** → Use custom value
**NO** → Benchmark first; undocumented combinations often underperform

---

## Rationale

The four digits are independent and not all combinations make sense. Standard presets (1254, 1255, 1205, 1235) are thoroughly tested. Custom CRTO values are rarely needed and often suboptimal without extensive benchmarking.

---

## Recommended Default

**Default:** opcache.jit=1254 (tracing JIT, default settings).
**Reason:** Best general-purpose preset for most production workloads.

---

## Risks Of Wrong Choice

* Arbitrary CRTO combination: may disable JIT (trigger=0) or produce worse code
* CPU optimization enabled on unknown hardware: illegal instruction errors
* Recursive inlining (O=5): exponential code growth, buffer overflow

---

## Related Rules

* Use Standard Presets First
* Benchmark Before Custom CRTO
* Understand Each Digit Independently

---

## Related Skills

* CRTO Bitmask Reference
