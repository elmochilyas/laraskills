# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Broadcasting & Real-Time
**Knowledge Unit:** K030 — Broadcasting System Overview
**Generated:** 2026-06-03

---

# Decision Inventory

* Broadcasting Driver Selection: Pusher vs Reverb vs Ably
* ShouldBroadcast vs ShouldBroadcastNow

---

# Architecture-Level Decision Trees

---

## Broadcasting Driver Selection: Pusher vs Reverb vs Ably

---

### Decision Context

Choosing between Pusher (SaaS), Reverb (self-hosted), or Ably (SaaS) for WebSocket broadcasting.

---

### Decision Criteria

* Self-hosting capability and willingness
* Connection count and pricing
* Data sovereignty requirements
* Operational team expertise

---

### Decision Tree

Need to self-host (data sovereignty, cost control)?
YES → Use Reverb — first-party Laravel WebSocket server
NO → Small app with low connection count?
    YES → Pusher or Ably — zero-ops, free tier available
NO → Need global edge delivery (multi-region users)?
    YES → Pusher (global network) or Ably (edge network)
NO → Existing Laravel 11+ app wanting first-party integration?
    YES → Reverb — seamless integration with Laravel ecosystem
NO → Default?
    YES → Reverb for self-hosted; Pusher for SaaS

---

### Rationale

Reverb is self-hosted with no per-connection costs. Pusher and Ably are SaaS with connection-based pricing. Reverb requires operational management (Supervisor, monitoring, scaling). Pusher/Ably are zero-ops at higher per-connection cost.

---

### Recommended Default

**Default:** Reverb for self-hosted (cost control, data sovereignty); Pusher for zero-ops SaaS
**Reason:** Reverb has no per-connection cost and integrates natively with Laravel. Pusher is simpler for teams that don't want to manage WebSocket infrastructure.

---

### Risks Of Wrong Choice

- Pusher for high connections: expensive at scale
- Reverb without ops capability: WebSocket crashes, no auto-recovery
- Ably without evaluating pricing: may be more expensive than Pusher

---

### Related Rules

- keep-broadcast-event-payloads-minimal
- never-broadcast-sensitive-data-on-public-channels

---

### Related Skills

- Configure Broadcasting and Real-Time Events
- Configure Laravel Reverb WebSocket Server

---

## ShouldBroadcast vs ShouldBroadcastNow

---

### Decision Context

Whether to use `ShouldBroadcast` (queued) or `ShouldBroadcastNow` (immediate) for broadcasting events.

---

### Decision Criteria

* Time sensitivity (sub-second vs tolerable delay)
* Queue worker capacity
* Current request execution time budget

---

### Decision Tree

Event is user-facing real-time (chat, cursor, live scores)?
YES → Use ShouldBroadcastNow — sub-second delivery critical
NO → Event tolerates 1-5 second queue delay?
    YES → Use ShouldBroadcast — queued, non-blocking
NO → High broadcast volume (>100/sec)?
    YES → Use ShouldBroadcast — avoid blocking request with broadcast overhead
NO → Default?
    YES → Use ShouldBroadcast

---

### Rationale

`ShouldBroadcastNow` bypasses the queue and broadcasts immediately in the current process. `ShouldBroadcast` queues the broadcast — it arrives when a worker processes it. Use `ShouldBroadcastNow` only when sub-second delivery is truly critical.

---

### Recommended Default

**Default:** Use `ShouldBroadcast` (queued) for most events; `ShouldBroadcastNow` only for time-sensitive events
**Reason:** Queued broadcast avoids adding broadcast latency to the HTTP response. Immediate broadcast should be reserved for truly real-time interactions.

---

### Risks Of Wrong Choice

- ShouldBroadcast for chat: 1-5s delay noticeable, poor UX
- ShouldBroadcastNow for high volume: blocks HTTP responses, reduces throughput
- No worker capacity for queued: broadcasts never delivered

---

### Related Rules

- keep-broadcast-event-payloads-minimal
- never-broadcast-sensitive-data-on-public-channels

---

### Related Skills

- Configure Broadcasting and Real-Time Events
