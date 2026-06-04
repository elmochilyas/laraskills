# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Event Broadcasting Architecture
**Knowledge Unit:** Model Broadcasting (BroadcastsEvents Trait)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Model broadcasting vs manual event classes | architectural |
| 2 | Which model events to broadcast | performance |
| 3 | Auto-generated vs explicit channel naming | security |

---

# Architecture-Level Decision Trees

---

## Model Broadcasting vs Manual Event Classes

---

## Decision Context

Whether to use the `BroadcastsEvents` trait for automatic CRUD broadcasting or create dedicated event classes.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Broadcasting simple model state changes (created, updated, deleted) without complex logic?
↓
YES → Need per-event payload customization by event type?
    ↓
    YES → **Model broadcasting** — `broadcastWith($event)` receives event type
    NO → Need conditional broadcasting per event type?
        ↓
        YES → **Model broadcasting** — `broadcastOn($event)` filters by type
        NO → **Model broadcasting** — simplest path
NO → Need external context (who performed the update, reason)?
    ↓
    YES → **Manual event classes** — pass additional context via constructor
    NO → Complex payload transformation or multiple channels per event?
        ↓
        YES → **Manual event classes**
        NO → **Model broadcasting**

---

## Rationale

Model broadcasting eliminates boilerplate for simple CRUD broadcasting scenarios. Manual event classes become necessary when events require external context beyond the model state, or when complex payload transformations are needed.

---

## Recommended Default

**Default:** Model broadcasting for simple CRUD, manual events for complex logic
**Reason:** Reduces event class proliferation; switch to manual events when requirements outgrow the trait's capabilities.

---

## Risks Of Wrong Choice

Using manual events for simple CRUD creates unnecessary files. Using model broadcasting for complex scenarios leads to workarounds that are harder to maintain than dedicated events.

---

## Related Rules

Always Define `broadcastOn()` on the Model, Always Override `broadcastWith()` for Payload Control

---

## Related Skills

Select and Implement Channel Types, Configure and Operate Laravel Broadcasting Architecture

---

---

## Which Model Events to Broadcast

---

## Decision Context

Which Eloquent events (created, updated, deleted, trashed, restored) should trigger broadcasts.

---

## Decision Criteria

* performance
* security

---

## Decision Tree

Event type fires on bulk operations (Model::update())?
↓
YES → **Filter out** — bulk ops generate unexpected broadcasts
NO → Event type creates data clients should see immediately?
    ↓
    YES → Keep event type in broadcastOn() filter
    NO → **Filter out** — unnecessary broadcasts
    ↓
    Event causes frequent updates (>1/sec per model)?
    ↓
    YES → **Debounce or filter out** — throttle broadcast frequency
    NO → Keep event type

---

## Rationale

Not all Eloquent events need broadcasting. `created` may not need real-time notification while `updated` does. Bulk operations like `Model::update()` trigger broadcasts for every affected row without explicit intent.

---

## Recommended Default

**Default:** Filter in `broadcastOn()` to broadcast only `updated` and `deleted`
**Reason:** `created` often doesn't need real-time push; bulk operations on update/delete are expected.

---

## Risks Of Wrong Choice

Broadcasting all event types causes excessive traffic and potential infinite loops if broadcast listeners trigger model changes.

---

## Related Rules

Always Filter Which Model Events Trigger Broadcasts

---

## Related Skills

Create and Customize ShouldBroadcast Events

---

---

## Auto-Generated vs Explicit Channel Naming

---

## Decision Context

Whether to return model instances from `broadcastOn()` (auto private channel) or specify explicit channel instances.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Channel name predictable and model ID is safe to expose?
↓
YES → Need to control which event types go to which channels?
    ↓
    YES → **Explicit channel instances** per event type
    NO → **Return model instance** — auto `App.Models.{Class}.{id}` private channel
NO → Need public channel for this model?
    ↓
    YES → **Explicit `new Channel(...)`** — model instances auto-convert to private
    NO → **Explicit channel instances** — for custom naming

---

## Rationale

Returning model instances from `broadcastOn()` auto-creates private channels with the pattern `App.Models.{ClassName}.{id}`. This is convenient but may not align with all authorization schemas. Explicit channel instances provide full control.

---

## Recommended Default

**Default:** Return model instances for standard private-channel model broadcasting
**Reason:** Automatic private channel creation with conventional naming; auth callbacks follow `App.Models.{ModelName}.{id}` pattern.

---

## Risks Of Wrong Choice

Returning a model instance expecting a public channel creates a private channel instead (security over-correction). Custom naming diverges from convention, making auth callback management harder.

---

## Related Rules

Always Register Auth Callbacks for Auto-Generated Private Channel Names

---

## Related Skills

Authorize Private and Presence Channels in routes/channels.php
