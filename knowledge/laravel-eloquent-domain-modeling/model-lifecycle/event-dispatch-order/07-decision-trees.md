# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Event Dispatch Order
**Generated:** 2026-06-03

---

# Decision Inventory

* Event listener hook selection
* Halting event strategy
* Pivot event independence

---

# Architecture-Level Decision Trees

---

## Event Listener Hook Selection

---

## Decision Context

Choosing the correct event hook (saving vs creating vs saved vs created) for a listener.

---

## Decision Criteria

* reliability

---

## Decision Tree

Does the logic need to run on both create AND update?
↓
YES → Use `saving` or `saved` — wraps both operations
NO → Does it run only on insert?
    YES → Use `creating` or `created`
    NO → Does it run only on update?
        YES → Use `updating` or `updated`
        NO → Determine the correct hook from the dispatch sequence

---

## Recommended Default

**Default:** `saved` for post-persistence logic that applies to both create and update
**Reason:** Most common case — react after any persistence event.

---

## Risks Of Wrong Choice

Using `creating` when `saving` is needed misses the hook on updates. Using `saved` when `created`-only logic is needed (e.g., sending welcome email) fires on every update too.

---

## Related Rules

* Use saving/saved for both create and update listeners

---

## Related Skills

* Understand Event Dispatch Order

---

## Halting Event Strategy

---

## Decision Context

Choosing the correct event to halt a model operation via `return false`.

---

## Decision Criteria

* reliability

---

## Decision Tree

Does the halting condition apply to both create and update?
↓
YES → Use `saving` hook — wraps both
NO → Does it apply only to new records?
    YES → Use `creating` hook
    NO → Does it apply only to existing records?
        YES → Use `updating` hook
        NO → Use appropriate `*ing` event

---

## Recommended Default

**Default:** `saving` for validation that applies to both create and update; `creating`/`updating` for specific operations
**Reason:** `saving` catches all persistence attempts; specific hooks for targeted halting.

---

## Risks Of Wrong Choice

Halting in `saved` (post-event) has no effect — only `*ing` events can halt operations.

---

## Related Rules

* Only *ing events can halt
* Return false explicitly to halt

---

## Related Skills

* Understand Event Dispatch Order

---

## Pivot Event Independence

---

## Decision Context

Handling BelongsToMany pivot events separately from model events.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Are you reacting to pivot table changes (attach/detach/update)?
↓
YES → Use pivot-specific events (`pivotAttaching`, `pivotAttached`, etc.)
NO → Model events are sufficient — pivot events fire outside the model chain

---

## Recommended Default

**Default:** Handle pivot events separately from model events
**Reason:** Pivot events are independent of the model event chain and have their own lifecycle.

---

## Risks Of Wrong Choice

Watching for pivot changes in `saved` or `updated` events misses pivot-only operations.

---

## Related Rules

* Handle pivot events separately from model events

---

## Related Skills

* Understand Event Dispatch Order
