# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Configuration for Production
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Production JIT configuration profile | Configuration | Configure |
| 2 | Whether to use JIT blacklist (PHP 8.5+) | Configuration | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: Production JIT Configuration Profile

---

## Decision Context

Selecting the correct JIT configuration based on application size, workload, and memory budget.

---

## Decision Criteria

* **performance** — buffer size determines how much hot code stays compiled
* **architectural** — OpCache must be configured first
* **maintainability** — buffer changes require PHP-FPM restart

---

## Decision Tree

Has OpCache been enabled and sized correctly?
↓
**NO** → Configure OpCache first (memory, max files, preloading)
**YES** → Proceed to JIT configuration

---

What is the application codebase size (PHP LOC)?
↓
**<500K LOC** → jit_buffer_size=128M, jit=1254
**>500K LOC or aggressive inlining** → jit_buffer_size=256M, jit=1254

---

Is the workload confirmed CPU-bound?
↓
**YES** → jit=1255 or 1235, jit_buffer_size=256M
**NO (I/O-bound)** → jit=1254, jit_buffer_size=128M (enable anyway, minimal overhead)

---

Are long-running workers (Octane/Swoole) used?
↓
**YES** → Add pre-warming requests. Lower hot path thresholds. Use Tracing JIT.
**NO (FPM only)** → Standard configuration; JIT benefit amortized over fewer requests

---

## Rationale

Production JIT configuration starts with a safe baseline (1254, 128MB) and is tuned based on monitoring. Changes require PHP-FPM restart, so plan maintenance windows.

---

## Recommended Default

**Default:** opcache.jit=1254, opcache.jit_buffer_size=128M.
**Reason:** Covers most applications; safe starting point with minimal overhead.

---

## Risks Of Wrong Choice

* Too small buffer: compilation thrashing, no JIT benefit
* Too large buffer: wasted virtual memory address space
* JIT without OpCache: nothing to compile

---

## Related Rules

* Enable OpCache Before Evaluating JIT
* Monitor Buffer Utilization
* Pre-warm JIT in Long-Running Processes

---

## Related Skills

* JIT Configuration for Production
