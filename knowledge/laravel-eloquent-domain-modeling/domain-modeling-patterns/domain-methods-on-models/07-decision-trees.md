# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Domain Methods on Models
**Generated:** 2026-06-03

---

# Decision Inventory

* Domain method vs controller inline logic
* Domain method vs action/service class
* Method granularity (one method per operation)

---

# Architecture-Level Decision Trees

---

## Domain Method vs Controller Inline Logic

---

## Decision Context

Choosing between putting business logic directly in controllers and extracting it into named domain methods on models.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the logic represent a domain concept with a business name?
↓
YES → Extract to a named domain method on the model (`$order->markAsPaid()`)
NO → Is the logic only relevant to this single controller action?
    YES → Keep in controller if trivial; extract if it duplicates elsewhere
    NO → Extract to a domain method — prevents duplication across controllers

---

## Rationale

Domain methods name behavior in the ubiquitous language, making code self-documenting. `$order->markAsPaid()` communicates intent far better than `$order->update(['status' => 'paid'])` and centralizes business rules.

---

## Recommended Default

**Default:** Domain method on the model
**Reason:** Named, testable, centralized, and expressive. Only keep in controller for trivial operations.

---

## Risks Of Wrong Choice

Putting business logic in controllers leads to fat controllers, untestable business rules, and duplicated code when the same operation is needed from multiple entry points.

---

## Related Rules

* Use ubiquitous language for method names
* Guard preconditions at method entry

---

## Related Skills

* Add a Behavior Method (Domain Method) to an Eloquent Model

---

## Domain Method vs Action/Service Class

---

## Decision Context

Choosing between a domain method on the model and a separate action or service class.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the operation span multiple aggregates or external services?
↓
YES → Use an action class or domain service — keeps model focused
NO → Does the operation need external dependencies (mailer, API client)?
    YES → Use an action class — model shouldn't depend on infrastructure
    NO → Model domain method is sufficient — simplest approach

---

## Rationale

Domain methods are for operations that only involve the model's own state and owned relationships. When external dependencies or cross-aggregate coordination is needed, an action class or domain service provides better separation.

---

## Recommended Default

**Default:** Model domain method for self-contained operations
**Reason:** Simplest, most discoverable, and testable with standard model factories.

---

## Risks Of Wrong Choice

Putting cross-aggregate or external-service logic in domain methods violates SRP and makes models hard to test (requiring Laravel `Mail::fake()` style faking). Using action classes for trivial single-model operations adds unnecessary indirection.

---

## Related Rules

* Method calls $this->save() internally
* No external side effects in domain methods

---

## Related Skills

* Add a Behavior Method (Domain Method) to an Eloquent Model

---

## Method Granularity

---

## Decision Context

Determining how granular domain methods should be — one method per operation vs one method per field change.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the operation represent a single business concept with a clear name?
↓
YES → One method per business operation — `markAsPaid()` does everything needed for payment
NO → Does the operation involve multiple independent steps?
    YES → Split into separate methods — each with single responsibility
    NO → Combine into a single method — avoid excessive fragmentation

---

## Rationale

Each domain method should encapsulate one meaningful business operation. `markAsPaid()` sets the status, timestamp, and dispatches events. Don't split this into `setStatus()`, `setPaidAt()`, `dispatchPaidEvent()` — that exposes internal steps.

---

## Recommended Default

**Default:** One domain method per business operation
**Reason:** Captures a complete business concept, not individual field changes.

---

## Risks Of Wrong Choice

Too-granular methods expose implementation details and force callers to sequence multiple steps. Too-coarse methods become complex and do too many things.

---

## Related Rules

* One method, one responsibility

---

## Related Skills

* Add a Behavior Method (Domain Method) to an Eloquent Model
