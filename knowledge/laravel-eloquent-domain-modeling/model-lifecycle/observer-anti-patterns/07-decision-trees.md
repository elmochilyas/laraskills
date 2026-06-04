# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Observer Anti-Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Business logic in observer vs model method
* Single vs multiple observer classes
* Heavy sync vs queued operations

---

# Architecture-Level Decision Trees

---

## Business Logic in Observer vs Model Method

---

## Decision Context

Choosing whether a piece of logic belongs in an observer or in a model domain method.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is the logic a business rule (validation, computation, state change)?
↓
YES → Belongs in model method or domain service — NOT in observer
NO → Is the logic an infrastructure concern (cache, log, sync)?
    YES → Observer is appropriate — infrastructure reacts to persistence
    NO → Re-evaluate — the logic may not belong in either

---

## Recommended Default

**Default:** Business logic in model methods; infrastructure concerns in observers
**Reason:** Observers are for cross-cutting infrastructure; business logic should be explicit and testable in domain methods.

---

## Risks Of Wrong Choice

Business logic in observers fires on every save (including mass updates), is hard to test, and hides the logic from domain method callers.

---

## Related Rules

* Observers for infrastructure, not business logic

---

## Related Skills

* Identify Observer Anti-Patterns

---

## Single vs Multiple Observer Classes

---

## Decision Context

Choosing between one observer handling all concerns vs multiple focused observers.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the observer handle more than one distinct concern?
↓
YES → Split into separate observers — one per concern
NO → Single concern? Keep it focused

---

## Recommended Default

**Default:** One observer per concern (CacheObserver, AuditObserver, NotificationObserver)
**Reason:** Focused observers are easier to test, understand, and change without affecting other concerns.

---

## Risks Of Wrong Choice

God-class observers mix cache, audit, notification, and sync logic, making changes to one concern risk breaking another.

---

## Related Rules

* One observer per concern
* Observers organized by concern (one per file)

---

## Related Skills

* Identify Observer Anti-Patterns

---

## Heavy Sync vs Queued Operations

---

## Decision Context

Choosing between running heavy operations synchronously in an observer or dispatching a job.

---

## Decision Criteria

* performance
* reliability

---

## Decision Tree

Does the operation take more than 5ms (HTTP call, image processing, email)?
↓
YES → Dispatch a queued job — don't block the response
NO → Is the operation fast (cache set, log write)?
    YES → Sync is acceptable in the observer
    NO → Queue the operation

---

## Recommended Default

**Default:** Queue all expensive operations from observers
**Reason:** Observers that make HTTP calls or process images synchronously cause timeouts and slow responses.

---

## Risks Of Wrong Choice

Sync heavy operations in observers cause slow model saves, request timeouts, and poor user experience.

---

## Related Rules
* Dispatch jobs for heavy operations

---

## Related Skills

* Identify Observer Anti-Patterns
