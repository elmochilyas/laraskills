# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Event-Driven Architecture
**Knowledge Unit:** K028 — Queued Event Listeners
**Generated:** 2026-06-03

---

# Decision Inventory

* ShouldQueue on Listener vs Inline Execution
* Queued Listener Configuration Strategy

---

# Architecture-Level Decision Trees

---

## ShouldQueue on Listener vs Inline Execution

---

### Decision Context

Whether to implement `ShouldQueue` on an event listener to process asynchronously or keep it inline.

---

### Decision Criteria

* Listener execution time
* I/O operations (API calls, SMTP, file ops)
* Consistency requirements with the dispatching transaction
* Event ordering requirements

---

### Decision Tree

Listener performs I/O (HTTP, SMTP, filesystem)?
YES → Implement ShouldQueue — async, non-blocking
NO → Listener execution >5ms?
    YES → Implement ShouldQueue — avoid blocking the event dispatcher
NO → Listener updates local DB state that must be consistent?
    YES → Keep inline — queued listener introduces eventual consistency
NO → Multiple listeners must process in order?
    YES → Keep inline — queued listener ordering is non-deterministic
NO → Default?
    YES → Keep inline — avoid unnecessary queue overhead

---

### Rationale

Queued listeners serialize the event and dispatch it to the queue, adding overhead. Fast inline listeners (<5ms) should stay inline. I/O-bound listeners benefit from async processing. Local state updates need immediate consistency.

---

### Recommended Default

**Default:** Keep listeners inline unless they perform I/O, exceed 5ms, or don't need immediate consistency
**Reason:** Queue overhead (~1ms) exceeds the cost of fast inline listeners. I/O operations benefit from offloading to workers.

---

### Risks Of Wrong Choice

- Queuing fast local updates: eventual consistency introduces UI staleness
- Sync I/O listeners: HTTP response blocked by API call/SMTP
- No SerializesModels on queued listener: entire event payload serialized naively

---

### Related Rules

- always-set-tries-on-queued-listeners
- add-serializes-models-to-queued-listeners

---

### Related Skills

- Configure Queued Event Listeners

---

## Queued Listener Configuration Strategy

---

### Decision Context

Configuring `$tries`, `$backoff`, `$connection`, `$queue` on queued event listeners.

---

### Decision Criteria

* Listener failure tolerance
* Driver requirements
* Queue isolation needs

---

### Decision Tree

Listener calls external API?
YES → Set $tries = 3, $backoff = [10, 30, 60] — respect API rate limits
NO → Listener is notification dispatch (email, SMS)?
    YES → Set $tries = 3, use dedicated 'notifications' queue
NO → Listener is internal data processing?
    YES → Set $tries = 1-2, use 'default' queue
NO → Default?
    YES → Set $tries = 3 (default is infinite)

---

### Rationale

Queued listeners default to infinite retries — always set `$tries`. Use dedicated queues for different listener types to prevent head-of-line blocking.

---

### Recommended Default

**Default:** Always set `$tries = 3` on queued listeners; set `$queue` based on listener workload characteristic
**Reason:** Prevents infinite retry loops. Dedicated queues isolate I/O-bound listeners from fast ones.

---

### Risks Of Wrong Choice

- No $tries: infinite retries — worker stuck on failing listener forever
- No SerializesModels: event payload bloat from full model serialization
- Wrong queue: I/O listeners block fast listeners on shared queue

---

### Related Rules

- always-set-tries-on-queued-listeners
- add-serializes-models-to-queued-listeners

---

### Related Skills

- Configure Queued Event Listeners
- Handle Event Auto-Discovery and Registration
