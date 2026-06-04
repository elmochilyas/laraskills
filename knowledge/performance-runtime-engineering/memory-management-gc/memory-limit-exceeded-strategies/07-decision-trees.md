# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Memory Limit Exceeded Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Responding to memory_limit exceeded errors | Architecture | Respond |
| 2 | Preventive vs reactive strategies | Architecture | Design |
| 3 | OOM kill and container memory limits | Operations | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: Responding to memory_limit Exceeded

---

## Decision Context

Fatal error when memory allocation exceeds memory_limit. Determine whether to increase limit, optimize memory use, defer work, or reconfigure container limits.

---

## Decision Criteria

* **performance** — increasing limit may hide memory issues
* **architectural** — heavy operations belong in queues
* **operations** — container OOM kills restart the pod, causing disruption
* **maintainability** — memory optimization is more sustainable than limit bumps

---

## Decision Tree

Is the spike legitimate (large dataset, file processing, export)?
↓
**YES** → Defer to queue. Queue workers can run with higher limits.
**NO** → Likely a memory leak. Profile to find root cause.

---

Can the operation be chunked or streamed?
↓
**YES** → Lazy collections, chunked queries, generators.
**NO** → Accept the endpoint needs higher memory.

---

Does the application run in a container with hard OOM limits?
↓
**YES** → Set php memory_limit < container memory limit. Container OOM kills are disruptive; php OOM kills only that request.
**NO** → Standard memory_limit configuration applies.

---

Is this a persistent runtime (Octane)?
↓
**YES** — One memory-exceeded request can corrupt shared state. Lower memory_limit and monitor closely.
**NO (FPM)** — Each request is isolated; memory_limit protects that single request.

---

## Recommended Default

**Default:** Defer heavy operations to queues. Set memory_limit at 128-256M for web requests, higher for queue workers.
**Reason:** Protects web workers while allowing data-heavy processing in dedicated contexts.

---

## Risks Of Wrong Choice

* Blindly raising memory_limit: hides leaks, increases OOM risk
* Setting memory_limit too close to container limit: php OOM and container OOM can cascade
* No queue deferral: web workers hog memory for slow operations

---

## Related Skills

* Memory Limit Exceeded Strategies
