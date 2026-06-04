# Metadata

**Domain:** real-time-systems
**Subdomain:** broadcasting-architecture
**Knowledge Unit:** shouldbroadcast-interface-event-lifecycle
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `broadcastAs()` provides a stable client-side event name
- [ ] `broadcastOn()` returns valid channel instances
- [ ] `broadcastWhen()` conditionally gates broadcast dispatch
- [ ] Always Define broadcastWhen() to Gate Unnecessary Broadcasts
- [ ] Always Override broadcastWith() to Control Event Payload
- [ ] Always Route Broadcast Events to a Dedicated Queue
- [ ] Always Use broadcastAs() for Stable Client-Side Event Names
- [ ] Always Use ShouldDispatchAfterCommit for Transactional Consistency
- [ ] `broadcastAs()` provides a stable event name (not the FQCN default)
- [ ] `broadcastOn()` returns valid channel instances
- [ ] `broadcastWhen()` gates dispatch for business-appropriate conditions
- [ ] Add `ShouldDispatchAfterCommit` for events dispatched within database transactions
- [ ] Create event class: `php artisan make:event OrderShipped`
- [ ] Define `broadcastOn()` to return channel instances (`Channel`, `PrivateChannel`, `PresenceChannel`)
- [ ] Events deliver correct payload to authorized clients
- [ ] Events only dispatch when business conditions are met
- [ ] Queue backlog for broadcasts is isolated from other job types

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add `ShouldDispatchAfterCommit` for events dispatched within database transactions
- [ ] Create event class: `php artisan make:event OrderShipped`
- [ ] Define `broadcastOn()` to return channel instances (`Channel`, `PrivateChannel`, `PresenceChannel`)
- [ ] Define `broadcastQueue()` to route to a dedicated broadcasts queue
- [ ] Dispatch via `event()`, `broadcast()`, or `::dispatch()`
- [ ] Implement `broadcastWhen()` to gate dispatch on business conditions
- [ ] Implement `ShouldBroadcast` interface
- [ ] Mark sensitive properties as `protected` or `private` to exclude from serialization
- [ ] Override `broadcastAs()` to provide a stable dot-notation event name
- [ ] Override `broadcastWith()` to control the serialized payload (never send entire models)
- [ ] Always Define broadcastWhen() to Gate Unnecessary Broadcasts
- [ ] Always Override broadcastWith() to Control Event Payload

---

# Performance Checklist

- [ ] `broadcastWhen()` acts as an early filter, preventing unnecessary queue jobs
- [ ] Event payload size: Keep leanâ€”only send what the client needs
- [ ] Queue throughput: High-frequency events should use `ShouldBroadcastNow` or client events
- [ ] Serialization cost: Every public property is serialized; use `broadcastWith()` to select specific attributes
- [ ] `broadcastWith()` is the primary control for payload sizeâ€”keep lean
- [ ] `ShouldBroadcastNow` bypasses the queueâ€”use sparingly
- [ ] Route to a dedicated queue connection to prevent broadcast backlog from starving other jobs

---

# Security Checklist

- [ ] `broadcastWith()` should explicitly select fields to prevent accidental data leakage
- [ ] Channel authorization (`broadcastOn()`) prevents clients from subscribing to unauthorized channels
- [ ] Models in event properties are serialized via `SerializesModels`; loaded relationships may expose extra data
- [ ] Public properties are auto-serializedâ€”mark sensitive data as `protected` or `private`

---

# Reliability Checklist

- [ ] Client never receives event
- [ ] Entire model sent to clients
- [ ] Events dispatched before DB commit
- [ ] Queue backlog of broadcast events
- [ ] Always Define broadcastWhen() to Gate Unnecessary Broadcasts
- [ ] Always Override broadcastWith() to Control Event Payload
- [ ] Always Route Broadcast Events to a Dedicated Queue
- [ ] Always Use broadcastAs() for Stable Client-Side Event Names
- [ ] Always Use ShouldDispatchAfterCommit for Transactional Consistency
- [ ] Never Expose Sensitive Data in Public Event Properties

---

# Testing Checklist

- [ ] `broadcastAs()` provides a stable client-side event name
- [ ] `broadcastAs()` provides a stable event name (not the FQCN default)
- [ ] `broadcastOn()` returns valid channel instances
- [ ] `broadcastWhen()` conditionally gates broadcast dispatch
- [ ] `broadcastWhen()` gates dispatch for business-appropriate conditions
- [ ] `broadcastWith()` controls payload explicitly
- [ ] `broadcastWith()` controls payload explicitly (no auto-serialized public properties with sensitive data)
- [ ] `ShouldDispatchAfterCommit` implemented for transaction-dependent events
- [ ] `ShouldDispatchAfterCommit` is used for transaction-dependent broadcasts
- [ ] Event class implements `ShouldBroadcast` interface

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No broadcastWith() â€” Relying on Public Property Serialization]
- [ ] [ShouldBroadcastNow for All Events]
- [ ] [No broadcastAs() â€” Client Bound to FQCN]
- [ ] [Broadcasting Before Database Transaction Commits]
- [ ] [No broadcastWhen() â€” Broadcasting Unchanged State]
- [ ] `broadcastOn()` returning hardcoded channel names
- [ ] `ShouldBroadcastNow` for all events
- [ ] Monolithic event classes
- [ ] No `broadcastWith()`

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Route to a dedicated queue connection to prevent broadcast backlog from starving other jobs

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


