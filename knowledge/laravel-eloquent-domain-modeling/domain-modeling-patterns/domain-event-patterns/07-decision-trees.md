# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Domain Event Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Event dispatch location (model vs controller)
* Event granularity
* Event naming convention

---

# Architecture-Level Decision Trees

---

## Event Dispatch Location

---

## Decision Context

Choosing whether to dispatch a domain event from the model's domain method or from the controller/action.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the event represent a business occurrence tied to a state change?
↓
YES → Dispatch from the model's domain method — colocated with the state change
NO → Is the event about an external action (batch processed, file imported)?
    YES → Dispatch from the action/handler that initiates the process
    NO → Re-evaluate whether an event is needed

---

## Rationale

Dispatching from the domain method ensures the event always fires when the state change occurs, regardless of the caller. Controller-dispatch is easily forgotten when new entry points are added.

---

## Recommended Default

**Default:** Dispatch from the model's domain method
**Reason:** Guarantees the event fires for every state change, not just from the current controller.

---

## Risks Of Wrong Choice

Controller-dispatch means every new controller/CLI command that triggers the state change must remember to dispatch the event. Missing dispatch leads to silent consistency failures.

---

## Related Rules

* Dispatch events from domain methods, not controllers

---

## Related Skills

* Dispatch a Domain Event from a Model

---

## Event Granularity

---

## Decision Context

Deciding how fine-grained domain events should be — one event per operation vs one event per change.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Do listeners need to distinguish between different types of changes (created vs updated vs deleted)?
↓
YES → Separate events per operation type (e.g., `OrderPlaced`, `OrderShipped`)
NO → Do listeners need to react to every state change (for audit, projection)?
    YES → Separate events per meaningful state change
    NO → One generic event with a payload type discriminator may suffice

---

## Rationale

Fine-grained events make listener registration explicit and clear. Generic events with type discriminators require listeners to inspect payloads, reducing clarity.

---

## Recommended Default

**Default:** One event class per distinct business occurrence
**Reason:** Explicit, self-documenting, and makes listener registration clear in EventServiceProvider.

---

## Risks Of Wrong Choice

Too many event classes creates file clutter. Too few (generic events) forces listeners to parse discriminators, making the event system harder to understand and maintain.

---

## Related Rules

* Name events in past tense

---

## Related Skills

* Dispatch a Domain Event from a Model

---

## Event Naming Convention

---

## Decision Context

Choosing a naming convention for domain event classes.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the event name describe something that already happened (past tense)?
↓
YES → Is the name in the ubiquitous language?
    YES → Correct — `OrderPlaced`, `PaymentReceived`, `InvoicePaid`
    NO → Rename to match domain terminology
NO → Is the name in present tense or imperative?
    YES → Wrong tense — rename to past tense
    NO → Use `{Entity}{PastTenseVerb}` format

---

## Rationale

Past tense signals that the event has already occurred and cannot be undone. This is standard in event-driven systems and DDD. It distinguishes events from commands (which are imperative) and future occurrences.

---

## Recommended Default

**Default:** `{Entity}{PastTenseVerb}` — e.g., `OrderPlaced`, `PaymentFailed`
**Reason:** Standard convention that clearly communicates the event has already happened.

---

## Risks Of Wrong Choice

Present tense or imperative names confuse events with commands. Inconsistent naming makes the event system harder to understand for new team members.

---

## Related Rules

* Name domain events in past tense

---

## Related Skills

* Dispatch a Domain Event from a Model
