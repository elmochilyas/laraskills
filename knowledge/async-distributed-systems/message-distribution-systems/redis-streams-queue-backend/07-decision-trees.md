# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Message Distribution Systems
**Knowledge Unit:** K040 — Redis Streams Queue Backend
**Generated:** 2026-06-03

---

# Decision Inventory

* Redis Lists vs Redis Streams for Queue Backend

---

# Architecture-Level Decision Trees

---

## Redis Lists vs Redis Streams for Queue Backend

---

### Decision Context

Whether to use Redis Lists (standard Laravel Redis driver) or Redis Streams for the queue backend.

---

### Decision Criteria

* Consumer group support (multi-worker coordination)
* Message acknowledgment and reprocessing
* Message history/replay requirements
* Operational complexity tolerance

---

### Decision Tree

Need consumer group coordination (fair distribution across workers)?
YES → Use Redis Streams — native consumer group support
NO → Need message acknowledgment (prevent message loss on worker crash)?
    YES → Use Redis Streams — ack-based consumption model
NO → Need message replay/reprocessing from history?
    YES → Use Redis Streams — stream persists messages with IDs
NO → Standard Laravel Redis queue sufficient?
    YES → Use Redis Lists (BRPOP) — simpler, proven

---

### Rationale

Redis Lists with BRPOP is the standard Laravel Redis driver — simple, proven, and sufficient for most applications. Redis Streams provides consumer groups, message acknowledgment, and history replay — features needed for more demanding queue patterns.

---

### Recommended Default

**Default:** Use Redis Lists (standard `redis` driver) for most applications; Redis Streams only when consumer groups, ack, or replay is needed
**Reason:** Lists are simpler, tested, and supported by Horizon. Streams add features but require custom driver implementation or package.

---

### Risks Of Wrong Choice

- Lists without consumer groups: workers compete for jobs via BRPOP — no fair distribution
- Streams without understanding: more complex, not supported by Horizon
- Lists for ack-needed messages: worker crash loses in-flight job (no ack mechanism)

---

### Related Rules

- set-block_for-for-low-volume-queues

---

### Related Skills

- Configure Redis Streams Queue Backend
- Select and Configure the Right Queue Driver
