# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Buffer Sizing Guidelines
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | JIT buffer size selection | Configuration | Configure |
| 2 | When to increase buffer size | Performance | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: JIT Buffer Size Selection

---

## Decision Context

Setting opcache.jit_buffer_size to balance memory usage with compiled code capacity.

---

## Decision Criteria

* **performance** — undersized buffer causes thrashing; oversized wastes address space
* **architectural** — buffer is pre-allocated at startup; changes require restart
* **maintainability** — monitor utilization before resizing

---

## Decision Tree

What is the application codebase size?
↓
**<500K PHP LOC** → 128MB (default) — sufficient for most applications
**>500K PHP LOC** → 256MB — prevents compilation thrashing
**Unknown** → Start with 128MB, measure, increase if needed

---

Is aggressive inlining enabled (O=4 or O=5 in CRTO)?
↓
**YES** → 256MB — inlining increases compiled code size 2-5x
**NO** → 128MB sufficient

---

What is the JIT mode?
↓
**Function JIT (1205)** → 256MB — function JIT fragments more, needs more buffer
**Tracing JIT (1254)** → 128MB — tracing JIT produces more compact code

---

What is the environment memory budget?
↓
**<512MB total RAM** → 64MB minimum, use Tracing JIT to reduce fragmentation
**>2GB total RAM** → 128-256MB is fine

---

## Rationale

128MB covers most applications. Monitor jit_buffer_free — if it drops below 20%, increase. Buffer is pre-allocated and cannot be resized at runtime.

---

## Recommended Default

**Default:** jit_buffer_size=128M for most applications; 256M for large codebases or function JIT.
**Reason:** Balances memory usage with compiled code capacity for typical workloads.

---

## Risks Of Wrong Choice

* Undersized (<64MB): compilation thrashing, JIT benefit diminished
* Oversized (>512MB): wasted virtual address space
* Function JIT with 64MB: constant eviction, no JIT benefit

---

## Related Rules

* Start with 128MB
* Monitor Utilization in First Week
* Increase If Free < 20%

---

## Related Skills

* JIT Buffer Sizing Guidelines
