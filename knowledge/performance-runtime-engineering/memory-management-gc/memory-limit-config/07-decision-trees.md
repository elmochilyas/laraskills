# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Memory Limit Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | memory_limit value selection | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: memory_limit Value

---

## Decision Context

memory_limit caps per-request allocation. Must balance protecting against runaway scripts with accommodating peak memory needs.

---

## Decision Criteria

* **performance** — limit too low kills valid requests
* **architectural** — product of limit × workers must fit in RAM
* **security** — limit prevents malicious memory exhaustion

---

## Decision Tree

What is peak per-request memory (profiled)?
↓
**<64MB** → memory_limit=128M
**64-128MB** → 256M
**128-256MB** → 512M
**>256MB** → Defer to queue first; increase limit if unavoidable.

---

Does memory_limit × pm.max_children exceed available RAM × 0.7?
↓
**YES** — Reduce max_children or lower memory_limit. Protect against total RSS > RAM.
**NO** — Configuration is safe.

---

## Recommended Default

**Default:** 128M for most web apps. 256M for data-processing routes.
**Reason:** Balances protection with sufficient headroom.

---

## Risks Of Wrong Choice

* Too low: valid large requests fail with fatal error
* Too high: single request can exhaust server memory

---

## Related Skills

* Memory Limit Configuration
