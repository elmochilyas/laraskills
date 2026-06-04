# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Event Propagation
**Generated:** 2026-06-03

---

# Decision Inventory

* Halting event vs exception for aborting operations
* Halting in *ing vs *ed events
* Explicit vs implicit return for continuation

---

# Architecture-Level Decision Trees

---

## Halting Event vs Exception for Aborting Operations

---

## Decision Context

Choosing between `return false` from a `*ing` event and throwing an exception to abort a model operation.

---

## Decision Criteria

* architectural
* reliability

---

## Decision Tree

Does the aborted operation need to be recoverable (caller can catch and handle)?
↓
YES → Use exception — provides catchable error with message
NO → Is the only requirement to prevent the database operation?
    YES → `return false` from `*ing` event is simpler
    NO → Exception provides better debugging context

---

## Recommended Default

**Default:** Throw an exception for business rule violations
**Reason:** Exceptions are catchable, provide meaningful messages, and are standard PHP error handling.

---

## Risks Of Wrong Choice

`return false` from an event silently prevents the operation without feedback to the caller. Exceptions for simple validation may require try/catch at every call site.

---

## Related Rules

* Throw meaningful exceptions before returning false

---

## Related Skills

* Halt Model Operations with Event Propagation

---

## Halting in *ing vs *ed Events

---

## Decision Context

Determining whether an event can halt a model operation based on its position in the dispatch order.

---

## Decision Criteria

* reliability

---

## Decision Tree

Is the event a `*ing` (before) event?
↓
YES → Halting is possible — `return false` prevents the DB operation
NO → Is the event a `*ed` (after) event?
    YES → Halting is NOT possible — `return false` is ignored
    NO → Check the dispatch sequence

---

## Recommended Default

**Default:** Only attempt to halt in `*ing` events
**Reason:** `*ed` events cannot halt; returning false in them silently continues.

---

## Risks Of Wrong Choice

Returning false in a `*ed` event gives the illusion of halting but the operation already completed.

---

## Related Rules

* Only *ing events can halt
* Don't halt in saved events

---

## Related Skills

* Halt Model Operations with Event Propagation

---

## Explicit vs Implicit Return for Continuation

---

## Decision Context

Choosing between explicit `return null` and no return statement to allow an operation to continue.

---

## Decision Criteria

* reliability

---

## Decision Tree

Is the return type declared as `?bool` on the observer method?
↓
YES → Explicit `return null` clarifies intent — operation continues
NO → Does the observer method return anything other than false?
    YES → Any non-false return continues the operation (null, true, void)
    NO → No return is equivalent to continuing

---

## Recommended Default

**Default:** No return statement for observers that never halt
**Reason:** Simpler; only add `return false` when explicitly halting.

---

## Risks Of Wrong Choice

Missing `return false` when halting is intended allows the operation to proceed silently. Adding unnecessary `return true` or `return null` adds noise without benefit.

---

## Related Rules

* Be explicit with return false

---

## Related Skills

* Halt Model Operations with Event Propagation
