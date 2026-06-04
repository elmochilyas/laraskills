# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Eventual consistency across context boundaries
Knowledge Unit ID: DBC-12
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Eventual consistency means that across bounded contexts, data will become consistent over time — but may be temporarily inconsistent. This is the price of context independence. Pattern: Context A commits a change and publishes an event. Context B receives the event and updates asynchronously. Between commit and event processing, Context B's data is stale. Engineering decisions center on: acceptable staleness window, conflict resolution, and detection of inconsistent states.

---

# Core Concepts

- **Consistency window**: Time between Context A's commit and Context B's event processing. During this, Context B has stale data.
- **Idempotent event handling**: Events must be processable multiple times without side effects.
- **Conflict resolution**: Strategy when two contexts' data conflict: last-write-wins, version-based, or manual.

---

# When To Use

- Cross-context data doesn't need immediate consistency for correct behavior.
- Context independence is valued over strong consistency.

---

# When NOT To Use

- Operation depends on another context's data being current (use synchronous call in modular monolith).

---

# Best Practices

- **Make event handlers idempotent.** WHY: The same event may be delivered twice. `updateOrCreate` or checking `if (already_processed)` prevents duplicate updates.
- **Design UIs to tolerate stale data.** WHY: The user interface must function correctly even when cross-context data is slightly stale. Don't require perfect consistency.
- **Monitor the consistency window.** WHY: Without monitoring, staleness can grow silently. Track the average time between event dispatch and processing.
- **Implement read-your-writes consistency.** WHY: When the user who initiated the change reads the data, ensure they see their own write immediately — bypass eventual consistency for the writer.

---

# Architecture Guidelines

- Idempotent projectors: use `updateOrCreate`, version checks, or deduplication.
- Stale data detection: compare timestamps or version numbers to detect stale data.
- In a modular monolith, prefer synchronous contract calls for strong consistency when needed.

---

# Performance Considerations

- Eventual consistency is faster for writes (no distributed lock), but reads may be stale.
- Consistency window is typically milliseconds in a modular monolith (in-process event dispatch).

---

# Security Considerations

- Stale authorization data can cause security issues. If a user's permissions change, ensure the change propagates quickly enough.

---

# Common Mistakes

1. **Assuming strongly consistent data:** Reading cross-context data without accounting for staleness. Cause: habit. Consequence: user sees old data. Better: accept and handle staleness.

2. **No staleness tolerance:** Building UIs requiring perfectly consistent cross-context data. Cause: strong consistency expectation. Consequence: complexity, defeats event-driven decoupling. Better: design for staleness.

3. **No monitoring of inconsistency:** Not tracking consistency window. Cause: oversight. Consequence: staleness grows silently. Better: monitor average staleness window.

---

# Anti-Patterns

- **Forcing strong consistency across contexts**: Using synchronous calls for every cross-context read defeats the purpose of context independence.
- **No staleness handling**: Assuming cross-context data is always current.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DBC-07 Cross-context queries | DBC-11 Multi-context transactions | CPC-09 Event sourcing |
| CPC-03 Sync vs queued events | CPC-10 Outbox pattern | CPC-11 Distributed tracing |

---

# AI Agent Notes

- Default to eventual consistency for cross-context data.
- Make all event handlers idempotent.
- Design UIs to tolerate stale data.
- Monitor consistency window.

---

# Verification

- [ ] Event handlers are idempotent
- [ ] Staleness window is defined and acceptable
- [ ] UIs handle stale cross-context data gracefully
- [ ] Consistency window is monitored
- [ ] Read-your-writes consistency is implemented for writers
