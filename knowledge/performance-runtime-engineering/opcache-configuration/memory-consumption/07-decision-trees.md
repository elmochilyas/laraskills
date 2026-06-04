# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** Memory Consumption
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | opcache.memory_consumption value | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: memory_consumption Value

---

## Decision Context

opcache.memory_consumption sets shared memory pool size for compiled opcodes. Too small causes eviction (misses). Too large wastes RAM.

---

## Decision Criteria

* **performance** — too small = low hit rate, recompilation
* **architectural** — each PHP file ~50-100KB opcode memory
* **operations** — monitor memory usage to tune

---

## Decision Tree

How many PHP files are in the application (vendor + app)?
↓
**<5000 files** → memory_consumption = 64MB
**5000-15000 files** → 128MB
**15000-30000 files** → 256MB
**>30000 files** → 512MB or more

---

What is current OpCache memory usage (opcache_get_status())?
↓
**<80% used** — Current value is sufficient.
**>80% used** — Increase by 50%.
**100% full** — Increase immediately. Cache thrashing.

---

What is wasted_memory in opcache status?
↓
**>10% of memory_consumption** — Fragmentation. Increase pool or investigate.

---

Is this a containerized deployment?
↓
**YES** — Set based on app size. Memory is dedicated.
**NO (shared server)** — Be conservative. Other services need RAM.

---

## Recommended Default

**Default:** 128MB for most Laravel apps. 256MB for larger apps.
**Reason:** 128MB accommodates most applications with headroom.

---

## Risks Of Wrong Choice

* Too small (32MB): frequent evictions, low hit rate
* Too large (2GB+): waste of RAM, no benefit>

---

## Related Skills

* OpCache Memory Consumption
