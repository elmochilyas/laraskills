# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Model Broadcasting
**Generated:** 2026-06-03

---

# Decision Inventory

* BroadcastsEvents vs BroadcastsEventsAfterCommit
* Broadcast data customization
* Channel privacy level

---

# Architecture-Level Decision Trees

---

## BroadcastsEvents vs BroadcastsEventsAfterCommit

---

## Decision Context

Choosing between broadcasting events immediately or only after the database transaction commits.

---

## Decision Criteria

* reliability

---

## Decision Tree

Does the broadcast depend on the data being committed to the database?
↓
YES → Use `BroadcastsEventsAfterCommit` — only broadcasts on successful commit
NO → Is there a reason to broadcast before the transaction completes?
    YES → Rare — document the reasoning
    NO → Always use `BroadcastsEventsAfterCommit`

---

## Recommended Default

**Default:** `BroadcastsEventsAfterCommit`
**Reason:** Prevents broadcasting stale or rolled-back data to clients.

---

## Risks Of Wrong Choice

Using `BroadcastsEvents` broadcasts data that may be rolled back, causing clients to see state that was never actually persisted.

---

## Related Rules

* Use BroadcastsEventsAfterCommit to prevent stale data broadcasts

---

## Related Skills

* Broadcast Model Events to WebSocket Channels

---

## Broadcast Data Customization

---

## Decision Context

Deciding what data to send in the broadcast payload.

---

## Decision Criteria

* security
* performance

---

## Decision Tree

Does the model contain sensitive data that shouldn't reach the client?
↓
YES → Override `broadcastWith()` — send only non-sensitive fields
NO → Is the full model serialization needed on the client?
    YES → Default serialization is acceptable — but still consider payload size
    NO → Override `broadcastWith()` — send only the required fields

---

## Recommended Default

**Default:** Override `broadcastWith()` to send minimal required data
**Reason:** Reduces payload size, prevents data leaks, and follows least-privilege principles.

---

## Risks Of Wrong Choice

Default serialization sends all model attributes to the client, potentially exposing sensitive internal data.

---

## Related Rules

* Override broadcastWith() to control client-visible data

---

## Related Skills

* Broadcast Model Events to WebSocket Channels

---

## Channel Privacy Level

---

## Decision Context

Choosing between public, private, and presence channels for model broadcasts.

---

## Decision Criteria

* security

---

## Decision Tree

Does the model contain user-specific or sensitive data?
↓
YES → Use `PrivateChannel` — requires authentication
NO → Is multi-user presence tracking needed?
    YES → Use `PresenceChannel` — tracks who's connected
    NO → `PublicChannel` is acceptable for non-sensitive broadcasts

---

## Recommended Default

**Default:** `PrivateChannel` for user-specific models
**Reason:** Most models contain user-specific data that shouldn't be public.

---

## Risks Of Wrong Choice

Public channels for sensitive models expose data to unauthorized users. Private channels for public data add unnecessary authentication overhead.

---

## Related Rules

* Use private channels for sensitive models

---

## Related Skills

* Broadcast Model Events to WebSocket Channels
