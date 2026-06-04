# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Domain Event vs Model Event
**Generated:** 2026-06-03

---

# Decision Inventory

* Model event vs domain event selection
* Infrastructure vs business concern boundary
* Event dispatch trigger point

---

# Architecture-Level Decision Trees

---

## Model Event vs Domain Event Selection

---

## Decision Context

Choosing between Laravel's Eloquent model events (`saved`, `created`, `updated`) and custom domain event classes for handling side effects.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the side effect a persistence concern (cache invalidation, logging, search index)?
↓
YES → Use model events — infrastructure concerns tied to persistence lifecycle
NO → Is the side effect a business reaction (notification, workflow, projection)?
    YES → Use domain events — business concerns triggered by explicit domain operations
    NO → Does the event need to fire on EVERY save regardless of business significance?
        YES → Use model events
        NO → Use domain events — fire only on meaningful business occurrences

---

## Rationale

Model events fire on every persistence operation, even irrelevant attribute changes. Domain events fire only when a meaningful business operation occurs, providing cleaner separation between infrastructure and business concerns.

---

## Recommended Default

**Default:** Domain events for business logic; model events for infrastructure
**Reason:** Domain events are explicit, business-significant, and don't fire on every touch or incidental save.

---

## Risks Of Wrong Choice

Using model events for business logic causes side effects to fire on every save, including `touch()` calls and mass updates. Using domain events for cache invalidation misses cache clears when models are saved outside domain methods.

---

## Related Rules

* Model events for infrastructure, domain events for business
* Don't dispatch domain events from model event listeners

---

## Related Skills

* Implement a Domain Event vs Use a Model Observer

---

## Infrastructure vs Business Concern Boundary

---

## Decision Context

Determining whether a side effect is an infrastructure concern (model event) or a business concern (domain event).

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the side effect technical (cache, log, sync) rather than business-related?
↓
YES → Infrastructure concern → Model event
NO → Does the side effect involve other domain models or external business processes?
    YES → Business concern → Domain event
    NO → Is it a simple, universal operation like updating a timestamp?
        YES → Model event or built-in Eloquent feature
        NO → Domain event — it's business-relevant

---

## Rationale

Infrastructure concerns are about how data flows through the system. Business concerns are about what the data means for the domain. Model events handle the "how"; domain events express the "what happened."

---

## Recommended Default

**Default:** Model events for technical side effects; domain events for business side effects
**Reason:** Clear separation of concerns makes the system easier to understand and maintain.

---

## Risks Of Wrong Choice

Business logic in model event listeners couples business rules to persistence, making them fire on every save. Infrastructure logic in domain events couples technical concerns to business events.

---

## Related Rules

* No business logic in model event listeners

---

## Related Skills

* Implement a Domain Event vs Use a Model Observer

---

## Event Dispatch Trigger Point

---

## Decision Context

Choosing where the trigger point for an event should be — in a model event listener or in an explicit domain method.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Should the event fire for ALL state changes, including those from `touch()` or mass assignment?
↓
YES → Hook into model events (observer) — fires on every database write
NO → Should the event fire only when a specific business operation occurs?
    YES → Dispatch from the explicit domain method — intentional and controlled
    NO → Determine the correct trigger point based on business requirements

---

## Rationale

Model events fire indiscriminately. Domain events fired from explicit methods give precise control over when side effects occur, preventing unwanted reactions from administrative mass updates or incidental saves.

---

## Recommended Default

**Default:** Domain events dispatched from explicit domain methods
**Reason:** Intentional, controllable, and business-significant. Model events are the exception for technical infrastructure concerns.

---

## Risks Of Wrong Choice

Model events for business reactions cause side effects from `touch()`, mass updates, and seeders — producing phantom notifications and incorrect audit trails.

---

## Related Rules

* Don't dispatch domain events from model event listeners
* Use saveQuietly for bulk operations

---

## Related Skills

* Implement a Domain Event vs Use a Model Observer
