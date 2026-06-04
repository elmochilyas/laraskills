# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** PHP Memory Model
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Memory allocation strategy for workload | Architecture | Design |
| 2 | Understanding per-request vs persistent memory | Architecture | Understand |

---

# Architecture-Level Decision Trees

---

## Decision: Per-Request vs Persistent Memory Strategy

---

## Decision Context

PHP-FPM allocates and frees memory per request. Memory-resident runtimes (Octane) keep memory across requests. Strategy differs based on runtime model.

---

## Decision Criteria

* **performance** — per-request allocation avoids leaks but has overhead
* **architectural** — persistent memory requires explicit lifecycle management
* **maintainability** — per-request is simpler; persistent requires leak prevention

---

## Decision Tree

What runtime is being used?
↓
**PHP-FPM (shared-nothing)** → Per-request allocation. Memory freed when request ends. No leak concerns per request.
**Octane/Swoole/FrankenPHP** → Persistent memory. Must manage state across requests.

---

Are there known memory leaks in the application?
↓
**YES (persistent runtime)** → Fix leaks or set lower max_requests for recycling.
**YES (FPM)** → Leaks are per-request; worker recycling via pm.max_requests handles them.
**NO** → Standard configuration applies.

---

What is the average request memory usage?
↓
**<10MB per request** → Low memory pressure; standard configuration
**10-50MB** → Moderate; monitor total RSS
**>50MB** → High; consider memory limits and worker count reduction

---

## Recommended Default

**Default:** PHP-FPM with pm.max_requests=500 for standard deployments.
**Reason:** Per-request cleanup prevents unbounded memory growth.

---

## Risks Of Wrong Choice

* Persistent runtime without leak detection: OOM after hours of operation
* Too many FPM workers: total RSS exceeds available RAM

---

## Related Skills

* PHP Memory Model
