# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** K085 — Queueable Mail, Notifications, and Broadcast Events
**Generated:** 2026-06-03

---

# Decision Inventory

* Single Notification Job vs Separate Jobs per Channel
* ShouldBroadcast vs ShouldBroadcastNow Selection

---

# Architecture-Level Decision Trees

---

## Single Notification Job vs Separate Jobs per Channel

---

### Decision Context

Whether to let a multi-channel notification process all channels in one job or split into individual channel-specific jobs.

---

### Decision Criteria

* Channel independence (should one slow channel block others?)
* Parallel execution requirements
* Failure isolation per channel
* Volume per channel

---

### Decision Tree

Notification has multiple channels (mail + SMS + database)?
YES → Channels have different latency profiles?
    YES → Split into separate jobs per channel
NO → One channel is slow (external API)?
    YES → Split — slow channel shouldn't block fast ones
NO → All channels are fast internal operations?
    YES → Single job is fine
NO → Single channel only?
    YES → Single job — no decision needed

---

### Rationale

`SendQueuedNotifications` iterates channels sequentially in one job. If the SMS channel takes 10 seconds, the email and database channels wait. Separate jobs run in parallel across different workers, providing isolation and independent retry.

---

### Recommended Default

**Default:** Split multi-channel notifications into separate jobs per channel when any channel involves external API calls
**Reason:** Prevents one slow channel from blocking others. Each channel gets independent retry, timeout, and failure handling.

---

### Risks Of Wrong Choice

- Multi-channel single job: one channel timeout blocks all channels
- No $timeout on queued mailable: SMTP slow relay causes job timeout
- Sequential processing: total execution time = sum of all channels

---

### Related Rules

- separate-notification-channels-into-individual-jobs
- set-timeout-on-queueable-mailables

---

### Related Skills

- Configure Queueable Mail, Notifications, and Broadcast

---

## ShouldBroadcast vs ShouldBroadcastNow Selection

---

### Decision Context

Whether to use `ShouldBroadcast` (queued) or `ShouldBroadcastNow` (immediate in current process) for broadcast events.

---

### Decision Criteria

* Time sensitivity of the event
* Queue backlog tolerance
* Current request execution time budget
* Broadcast volume

---

### Decision Tree

Event is user-facing real-time (chat message, cursor position)?
YES → Use ShouldBroadcastNow — sub-second delivery required
NO → Event tolerates 1-5 second delay?
    YES → Use ShouldBroadcast — queued is fine
NO → High broadcast volume (>100/sec)?
    YES → Use ShouldBroadcast — avoid blocking request with direct broadcast
NO → Default case?
    YES → Use ShouldBroadcast

---

### Rationale

`ShouldBroadcast` queues the broadcast — it arrives when a worker processes it (typically 1-5 second delay). `ShouldBroadcastNow` bypasses the queue and broadcasts immediately in the current process. Use `ShouldBroadcastNow` only for truly time-sensitive events to avoid blocking the HTTP response with direct broadcast overhead.

---

### Recommended Default

**Default:** Use `ShouldBroadcast` (queued) for most broadcast events; `ShouldBroadcastNow` only for sub-second delivery requirements
**Reason:** Queued broadcast avoids adding broadcast latency to the HTTP response. Only truly time-sensitive events (chat, cursors) need bypassing the queue.

---

### Risks Of Wrong Choice

- ShouldBroadcast for chat: 1-5 second delay is noticeable to users
- ShouldBroadcastNow for everything: HTTP response blocked by broadcast overhead
- No worker capacity: queued broadcast never arrives if workers saturated

---

### Related Rules

- use-should-broadcast-now-selectively
- keep-broadcast-event-payloads-minimal

---

### Related Skills

- Configure Queueable Mail, Notifications, and Broadcast
- Configure Broadcasting and Real-Time Events
