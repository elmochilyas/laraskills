# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Distributed tracing across contexts
Knowledge Unit ID: CPC-11
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Distributed tracing tracks a request as it crosses bounded contexts, services, and processes. Each request is assigned a correlation ID at entry. Every subsequent event, job, or HTTP call propagates this ID downstream. The aggregated trace provides an end-to-end view of the request's path, timing, and failures. In a modular monolith, tracing is simpler — contexts share a process and a request lifecycle — but still requires explicit ID propagation through events and queues.

---

# Core Concepts

- **Trace:** The entire journey of a request from entry point to completion. A trace is composed of spans.
- **Span:** A single unit of work within a trace. Each span has a start time, end time, and optional tags (service name, operation, status).
- **Correlation ID:** A unique identifier assigned at the request's entry point. Propagated to all downstream operations. Used to correlate logs, events, and metrics for a single request.
- **Causation ID:** Identifies the immediate parent event that caused the current operation. Enables building a causal chain.

---

# When To Use

- Debugging cross-context issues.
- Performance bottleneck detection across boundaries.
- Understanding request flows in complex systems.

---

# When NOT To Use

- Single-context applications with no cross-boundary communication.

---

# Best Practices

- **Assign correlation ID at entry.** WHY: Every external entry point (HTTP request, queue message, CLI command) gets a correlation ID. The trace starts here. Use middleware for HTTP, job middleware for queues.
- **Propagate on every boundary.** WHY: Every context boundary, message bus call, or queue push must propagate the correlation ID. Breaking the propagation chain loses the trace. Use automatic propagation (job middleware, event subscribers) rather than manual.
- **Use structured logging with correlation ID.** WHY: Every log entry includes the correlation ID. Use Laravel's `Log::withContext()` to set it once. Enables filtering and searching across contexts.
- **Automate propagation.** WHY: Manual propagation relies on developer discipline and leads to gaps. Use automatic mechanisms like job middleware, event subscribers, or bus middleware.

---

# Architecture Guidelines

- Correlation ID at entry (HTTP, queue, CLI).
- Propagate through events, jobs, and all context boundaries.
- Structured logging with correlation ID via `Log::withContext()`.
- Automatic propagation via middleware/subscribers.
- Causation ID for building causal chains.

---

# Performance Considerations

- Correlation ID propagation adds negligible overhead (passing a string).
- Trace storage costs for high-traffic systems.
- Sampling strategies for production (trace 1 in 100 requests).

---

# Security Considerations

- Correlation IDs should not contain sensitive data. They are typically UUIDs.

---

# Common Mistakes

1. **No propagation:** Correlation ID is assigned at the HTTP boundary but not passed to queued events. Cause: oversight. Consequence: event handler logs are disconnected from the request. Better: automate propagation via job middleware.

2. **Manual propagation everywhere:** Developers must remember to pass the correlation ID in every event. Cause: no automated mechanism. Consequence: gaps in tracing when developers forget. Better: use automatic propagation.

3. **No structured logging:** Correlation IDs are logged but not in a structured field. Cause: using string interpolation. Consequence: filtering and searching become manual and error-prone. Better: `Log::withContext()`.

---

# Anti-Patterns

- **Broken chain**: Correlation ID set at entry but not propagated to events/queues. Disconnected traces.
- **No trace at all**: No correlation ID anywhere. Impossible to trace requests across contexts.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| CPC-04 Event design (correlation/causation IDs) | CPC-05 Message bus | AEG-06 Observability |
| CPC-03 Sync vs queued events | DBC-07 Cross-context queries | AEG-08 Monitoring dashboards |

---

# AI Agent Notes

- Assign correlation ID at every entry point.
- Automate propagation through all boundaries.
- Use structured logging with `Log::withContext()`.
- Include causation ID for causal chain tracing.

---

# Verification

- [ ] Correlation ID assigned at all entry points
- [ ] Correlation ID propagated through events/jobs/boundaries
- [ ] Propagation is automated (middleware/subscribers, not manual)
- [ ] Structured logging includes correlation ID
- [ ] Causation ID included for causal chain building
