# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Event Broadcasting Architecture
**Knowledge Unit:** ShouldBroadcast Interface & Event Lifecycle
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Payload control: broadcastWith() vs public properties | security |
| 2 | Event naming: broadcastAs() dot-notation vs FQCN | maintainability |
| 3 | Transaction-aware broadcasting | architectural |

---

# Architecture-Level Decision Trees

---

## broadcastWith() vs Public Property Serialization

---

## Decision Context

How to define the data payload that clients receive when a broadcast event fires.

---

## Decision Criteria

* security
* performance
* maintainability

---

## Decision Tree

Event has public properties containing Eloquent models or sensitive data?
↓
YES → Sensitive fields (email, internal notes, roles) exist on those models?
    ↓
    YES → **Use broadcastWith()** — explicitly select safe fields
    NO → Are all public properties safe strings/ints/nulls?
        ↓
        YES → **broadcastWith() still preferred** for explicit contract
        NO → **Use broadcastWith()**
NO → Event payload changes frequently as feature evolves?
    ↓
    YES → **Use broadcastWith()** — schema evolution without model changes
    NO → Public property serialization is acceptable but risky

---

## Rationale

Public property auto-serialization is convenient but leaks the entire serialized state of every public property, including loaded Eloquent relationships. `broadcastWith()` provides explicit payload control, preventing data leakage and reducing payload size.

---

## Recommended Default

**Default:** Always implement `broadcastWith()`
**Reason:** Explicit payload contracts prevent accidental data leakage and reduce network transfer size.

---

## Risks Of Wrong Choice

Relying on public properties exposes sensitive data (CVE-like information disclosure). Over-large payloads waste bandwidth and serialization CPU.

---

## Related Rules

Always Override `broadcastWith()` to Control Payload

---

## Related Skills

Create and Customize ShouldBroadcast Events

---

---

## broadcastAs() Dot-Notation vs FQCN Naming

---

## Decision Context

How to name broadcast events for client-side consumption.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Event class may be renamed in the future?
↓
YES → **Use broadcastAs() with dot-notation** (e.g., `order.shipped`)
NO → Multiple teams own different event classes?
    ↓
    YES → **Use broadcastAs() with namespaced dot-notation**
    NO → Only one client listens to this event?
        ↓
        YES → FQCN default may be acceptable
        NO → **Use broadcastAs()**

---

## Rationale

The default FQCN (e.g., `App\Events\OrderShipped`) couples client code to PHP class names. Renaming the class breaks all client listeners silently. Dot-notation names provide a stable API contract that survives refactoring.

---

## Recommended Default

**Default:** Always define `broadcastAs()` returning dot-notation name
**Reason:** Decouples client event listeners from PHP class names; enables refactoring without breaking frontend code.

---

## Risks Of Wrong Choice

Class renames silently break client listeners; inconsistent naming across events.

---

## Related Rules

Always Name Events Explicitly with `broadcastAs()` and Dot-Notation

---

## Related Skills

Create and Customize ShouldBroadcast Events

---

---

## Transaction-Aware Broadcasting

---

## Decision Context

Whether to use `ShouldDispatchAfterCommit` to delay broadcasting until database transactions complete.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Event dispatched inside a database transaction?
↓
YES → Clients query data that the broadcast event references?
    ↓
    YES → **ShouldDispatchAfterCommit** — prevent stale data delivery
    NO → Broadcast fires before transaction commits?
        ↓
        YES → **ShouldDispatchAfterCommit**
        NO → Standard `ShouldBroadcast` acceptable
NO → Standard `ShouldBroadcast` acceptable

---

## Rationale

Without `ShouldDispatchAfterCommit`, a broadcast event can reach clients before the underlying database transaction commits. Clients fetching referenced data see stale or missing records.

---

## Recommended Default

**Default:** Implement `ShouldDispatchAfterCommit` on events dispatched within transactions
**Reason:** Ensures clients never see data before the database confirms it exists.

---

## Risks Of Wrong Choice

Clients see stale data or 404 errors for records that don't appear committed yet.

---

## Related Rules

Use `ShouldDispatchAfterCommit` for Transaction-Dependent Broadcasts

---

## Related Skills

Create and Customize ShouldBroadcast Events
