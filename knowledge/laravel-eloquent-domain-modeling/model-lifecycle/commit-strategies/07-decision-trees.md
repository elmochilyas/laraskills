# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Commit Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

* afterCommit vs immediate dispatch
* afterCommit() on events vs jobs
* Broadcast commit strategy

---

# Architecture-Level Decision Trees

---

## afterCommit vs Immediate Dispatch

---

## Decision Context

Deciding whether to dispatch events/jobs after the transaction commits or immediately.

---

## Decision Criteria

* reliability

---

## Decision Tree

Does the event listener depend on the persisted data being available?
↓
YES → Use `afterCommit()` — only dispatches after successful commit
NO → Should the side effect happen regardless of transaction outcome?
    YES → Immediate dispatch — side effect is independent of persistence
    NO → Use `afterCommit()` — safer default

---

## Recommended Default

**Default:** `afterCommit()` for all domain events and jobs
**Reason:** Prevents side effects from firing on rolled-back transactions.

---

## Risks Of Wrong Choice

Immediate dispatch on uncommitted data causes listeners to query for data that may not exist (if the transaction rolls back).

---

## Related Rules

* Default to after-commit for domain events

---

## Related Skills

* Configure afterCommit for Transactional Jobs and Events

---

## afterCommit() on Events vs Jobs

---

## Decision Context

Applying `afterCommit()` directly on events vs using `->afterCommit()` on job dispatch.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Are you dispatching a job directly?
↓
YES → Use `dispatch((new Job(...))->afterCommit())` — chain method on the job instance
NO → Are you dispatching an event via Event facade?
    YES → Use `Event::dispatch(new OrderPlaced(...))` inside a `DB::transaction()` — the event is already within the transaction scope
    NO → Use `dispatch()->afterCommit()` pattern

---

## Recommended Default

**Default:** `dispatch(...)->afterCommit()` for queued jobs
**Reason:** Explicit, readable, and applies to the specific job dispatch.

---

## Risks Of Wrong Choice

Not using `->afterCommit()` causes jobs to be queued before the transaction commits, potentially failing when they try to read uncommitted data.

---

## Related Rules

* Use afterCommit() on job dispatch

---

## Related Skills

* Configure afterCommit for Transactional Jobs and Events

---

## Broadcast Commit Strategy

---

## Decision Context

Choosing the broadcast commit strategy for model events.

---

## Decision Criteria

* reliability

---

## Decision Tree

Should model broadcasts only fire after the transaction commits?
↓
YES → Use `BroadcastsEventsAfterCommit` trait
NO → Is the transaction short and unlikely to roll back?
    YES → `BroadcastsEvents` may be acceptable — but prefer after-commit
    NO → Always use `BroadcastsEventsAfterCommit`

---

## Recommended Default

**Default:** `BroadcastsEventsAfterCommit`
**Reason:** Ensures clients never see state from rolled-back transactions.

---

## Risks Of Wrong Choice

Clients receive updates for data that was never persisted, causing UI state inconsistency.

---

## Related Rules

* Use BroadcastsEventsAfterCommit for model broadcasts

---

## Related Skills

* Configure afterCommit for Transactional Jobs and Events
