# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** K006 — `ShouldQueue` Contract and Queueable Types
- **Knowledge ID:** K006
- **Difficulty Level:** Foundation
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Source — `Illuminate\Contracts\Queue\ShouldQueue`

---

# Overview

`ShouldQueue` is the marker interface that tells Laravel a job/listener/mail/notification should be processed asynchronously. It's an empty contract — no methods to implement. Its presence signals the framework to serialize and push to the queue instead of executing immediately. This contract is the entry point for all async processing and is implemented across five queueable types: jobs, mail, notifications, broadcast events, and event listeners.

---

# Core Concepts

- **`ShouldQueue`:** Empty marker interface. Presence changes behavior from sync to async.
- **Queueable types:**
  - **Jobs:** `ShouldQueue` on the job class — most common, via `dispatch()`
  - **Mail:** `Mail::queue()` wraps mailable in `SendMail` job
  - **Notifications:** `Notification::send()` — channel-dependent queuing
  - **Broadcast events:** `ShouldBroadcast` (extends `ShouldQueue`)
  - **Event listeners:** `ShouldQueue` on listener class → `CallQueuedListener`
- **`Dispatchable` trait:** Provides `dispatch()`, `dispatchSync()`, `dispatchAfterResponse()`.
- **`Queueable` trait:** On mail/notifications — provides `onConnection()`, `onQueue()`, `delay()`.

---

# When To Use

- **Jobs:** Always implement `ShouldQueue`. Use `dispatchSync()` for sync, don't conditionally remove the interface.
- **Listeners:** Use for I/O listeners (API calls, notifications). Keep lightweight updates (DB writes) synchronous.
- **Mail/notifications:** Use automatically via `queue()` method.

---

# When NOT To Use

- Jobs that must execute synchronously — use `dispatchSync()` instead.
- Non-queueable notification channels (database, SMS) — they process immediately regardless of `ShouldQueue`.

---

# Best Practices

- **Always implement `ShouldQueue` on job classes — use `dispatchSync()` for sync cases.** Don't conditionally remove the interface. *Why: The interface signals the framework's dispatch path. Using `dispatchSync()` overrides it cleanly without removing the interface — the job class remains consistent across all callers.*
- **Add `SerializesModels` to queued listeners.** Without it, the entire event payload is serialized naively. *Why: The `CallQueuedListener` job serializes the event and listener — without `SerializesModels`, Eloquent models in the event are serialized in full, causing payload bloat and potential serialization failures.*

---

# Performance Considerations

- The `instanceof ShouldQueue` check is a single bitwise operation — immeasurably fast.
- Overhead comes from serialization and queue transport, not from the contract check.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| No `SerializesModels` on queued listeners | Ignoring serialization | Entire event payload serialized — bloat and failures | Add `SerializesModels` trait |
| Confusing `ShouldQueue` with `Dispatchable` | Both involved in dispatch | Misunderstanding the dispatch pipeline | `ShouldQueue` = marker; `Dispatchable` = trait with `dispatch()` |
| Using `Mail::send()` instead of `Mail::queue()` | Convenience | Mail sent synchronously, blocking request | Use `Mail::queue()` for all production mail |

---

# Related Topics

- **K085 Queueable Mail, Notifications, Broadcast (K085)** — Type-specific behavior
- **K028 Queued Event Listeners (K028)** — Listener-specific queueing
