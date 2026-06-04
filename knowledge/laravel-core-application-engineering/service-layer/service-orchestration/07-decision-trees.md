# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Service Orchestration
**Generated:** 2026-06-03

---

# Decision Inventory

* Service Orchestration vs Controller Orchestration
* Action Composition in Services vs Direct Implementation in Services
* Transaction Boundaries at Service Level vs Action Level
* Aggregated Result Objects vs Multiple Return Values

---

# Architecture-Level Decision Trees

---

## Decision 1: Service Orchestration vs Controller Orchestration

---

## Decision Context

Whether to put multi-step workflow coordination in the service layer or the controller layer.

---

## Decision Criteria

* Whether the workflow is business logic or HTTP flow control
* Whether the workflow needs to be reused from non-HTTP contexts
* Whether the workflow involves transactional database operations

---

## Decision Tree

Does the workflow contain business logic (validation, authorization, domain rules)?
↓
YES → Service orchestration — business logic belongs in the service layer
NO → Is the workflow purely HTTP flow control (redirect based on user role, set flash messages)?
    ↓
    YES → Controller orchestration — HTTP flow control belongs in the controller
    NO → Does the workflow need to be reused from CLI, queue, or tests?
        ↓
        YES → Service orchestration — extracting orchestration enables reuse without HTTP dependency
        NO → Service orchestration — even single-use workflows benefit from testability
NO → Does the workflow involve database transactions?
    ↓
    YES → Service orchestration — transaction boundaries belong in services, not controllers
    NO → Does the workflow call multiple domain services or actions?
        ↓
        YES → Service orchestration — coordination of domain objects belongs in services
        NO → Controller orchestration — single-step operations can stay in controller

---

## Rationale

Controllers handle HTTP concerns (request parsing, response formatting). Service orchestration handles business workflow (call order, transaction management, error handling). Putting orchestration in the controller couples business logic to HTTP. Controllers become untestable without HTTP boot, and the workflow cannot be reused from CLI, queues, or other entry points.

---

## Recommended Default

**Default:** Service orchestration for ALL multi-step business workflows.
**Reason:** Orchestration in controllers couples business logic to HTTP. Service orchestration enables reuse, testability, and proper transaction management.

---

## Risks Of Wrong Choice

* Controller orchestration: Business workflow embedded in HTTP layer; untestable without HTTP boot; cannot be reused from CLI/queue
* Service orchestration for HTTP flow: Service knows about redirects, flash messages — coupled to HTTP
* Controller orchestration with transaction: `DB::transaction()` in controller — transaction management is a service concern
* Service orchestration for single-step: Acceptable — the overhead of one service method is negligible compared to the consistency benefit

---

## Related Rules

* Enforce Service-Level Orchestration
* Enforce Action Composition via Services

---

## Related Skills

* Orchestrate Multi-Step Workflows in Services
* Compose Actions in Service Orchestration Methods

---

---

## Decision 2: Action Composition in Services vs Direct Implementation in Services

---

## Decision Context

Whether the orchestration service should call individual action classes or implement the sub-operations directly.

---

## Decision Criteria

* Whether the sub-operation is complex enough to warrant its own class
* Whether the sub-operation is reused across multiple services
* Whether the sub-operation needs isolated testing

---

## Decision Tree

Is the sub-operation complex (20+ lines with conditional logic)?
↓
YES → Action class — extract to a dedicated action for testability and maintainability
NO → Is the sub-operation reused across multiple services?
    ↓
    YES → Action class — DRY; reused operation in one place
    NO → Does the sub-operation need isolated testing?
        ↓
        YES → Action class — isolated unit test without bootstrapping the orchestration service
        NO → Direct implementation — keep in the service; extraction adds unnecessary indirection
NO → Is the sub-operation a simple database query or Eloquent call?
    ↓
    YES → Direct implementation — simple calls don't need extraction; service stays readable
    NO → Is the sub-operation a third-party API call?
        ↓
        YES → Action class — API calls benefit from isolated testing and mocking
        NO → Direct implementation — keep simple sub-operations in the service

---

## Rationale

Action composition (services calling actions) separates orchestration from execution. The service coordinates the workflow; each action executes a single step. Direct implementation keeps simple operations inline, avoiding file proliferation. The threshold for extraction is complexity, reuse, or testing need — not whether the operation "could" be extracted.

---

## Recommended Default

**Default:** Direct implementation for simple sub-operations. Action extraction for complex, reused, or test-requiring sub-operations.
**Reason:** Extracting every sub-operation creates excessive files. Extract only when the operation justifies its own class.

---

## Risks Of Wrong Choice

* Direct implementation for complex sub-op: 50-line service method; hard to read, test, or reuse
* Action extraction for every sub-op: 10+ files for a single orchestration flow; excessive indirection
* Action + service calling same method: Service defines a method AND calls an action for the same logic — duplicated
* Action calling action without service: Two actions composed without a service coordinator — orchestration in the wrong layer

---

## Related Rules

* Enforce Service-Level Orchestration
* Enforce Action Composition via Services

---

## Related Skills

* Orchestrate Multi-Step Workflows in Services
* Compose Actions in Service Orchestration Methods

---

---

## Decision 3: Transaction Boundaries at Service Level vs Action Level

---

## Decision Context

Whether the database transaction should wrap the entire service orchestration or be managed inside individual actions.

---

## Decision Criteria

* Whether the orchestration must be atomic (all or nothing)
* Whether individual actions are used independently outside the orchestration
* Whether the action may be composed in different orchestration contexts

---

## Decision Tree

Does the orchestration require atomicity (all steps succeed or none)?
↓
YES → Service-level transaction — `DB::transaction()` wraps the entire orchestration method
NO → Is there any database write in the orchestration?
    ↓
    YES → Service-level transaction — any write can fail; wrap all writes in a single transaction
    NO → No transaction needed — read-only operations don't need transactional wrapping
YES → Are individual actions used independently (outside this service)?
    ↓
    YES → Action-level transaction too — each action manages its own transaction when used standalone
    NO → Service-level transaction only — actions should NOT start transactions when called from a service
NO → Can actions be composed in different orchestration contexts?
    ↓
    YES → Service-level transaction only — the parent transaction determines the boundary; actions should not nest transactions
    NO → Service-level transaction — consistent approach: all orchestration in services manages the boundary

---

## Rationale

The service controls the workflow boundary. The transaction should be at the service level to ensure all steps are atomic. Individual actions should NOT start their own transactions when called as part of an orchestration — nested transactions in Laravel use a counter, and rollback only affects the outermost, but having actions start transactions creates confusion about boundaries.

---

## Recommended Default

**Default:** ALWAYS set transaction boundaries at the service orchestration level. Actions should NOT manage their own transactions when composed.
**Reason:** The service knows the workflow boundary. Actions cannot know whether they're called standalone or as part of a larger transaction.

---

## Risks Of Wrong Choice

* Action-level transaction in orchestration: Nested transaction counter means action's rollback doesn't affect other steps; partial writes possible
* No transaction in orchestration: First step writes succeed; second step fails — data inconsistency
* Service-level transaction only (action called standalone): Action runs without a transaction when called directly — add transaction at the action level too, but make it a passthrough if already in a transaction
* External API call inside transaction: Transaction holds database locks during API latency — move API calls outside the transaction

---

## Related Rules

* Enforce Service-Level Orchestration
* Enforce Action Composition via Services

---

## Related Skills

* Orchestrate Multi-Step Workflows in Services
* Compose Actions in Service Orchestration Methods

---

---

## Decision 4: Aggregated Result Objects vs Multiple Return Values

---

## Decision Context

Whether the orchestration method should return a single result object containing all outputs or return multiple values (tuple/array).

---

## Decision Criteria

* Whether the orchestration produces multiple distinct outputs
* Whether the outputs are conceptually related
* Whether the caller needs all outputs or just a subset

---

## Decision Tree

Does the orchestration produce multiple distinct outputs (order, payment, inventory receipt)?
↓
YES → Aggregated result object — `OrderResult` contains all outputs as typed properties
NO → Does the orchestration produce a single primary output?
    ↓
    YES → Return the primary output directly — `Order` object; no wrapper needed
    NO → Does the caller typically need all outputs?
        ↓
        YES → Aggregated result object — all outputs wrapped in a typed container
        NO → Consider splitting the orchestration — if callers only need subsets, the method may be doing too much
NO → Are the outputs conceptually related (part of the same business transaction)?
    ↓
    YES → Aggregated result object — related outputs belong together
    NO → Array return — `return [$order, $payment, $inventory]` but this is weakly typed; prefer result object
NO → Is the application using strict types and type safety?
    ↓
    YES → Aggregated result object — typed properties provide IDE autocompletion and compile-time safety
    NO → Array is acceptable but not recommended — result object is always better

---

## Rationale

Aggregated result objects provide a typed contract for the orchestration's output. Callers know exactly what properties to expect. Arrays are weakly typed — callers must know the array keys or positional order. Result objects also allow adding new fields without breaking callers (add a property; existing callers that don't use it still work).

---

## Recommended Default

**Default:** Aggregated result objects for any orchestration method producing multiple outputs.
**Reason:** Typed contracts, IDE support, backward-compatible evolution. Arrays are fragile and weakly typed.

---

## Risks Of Wrong Choice

* Array return: `[$order, $payment]` — positional; adding a third output shifts indexes; callers break
* Direct return for single output: Correct — `Order` returned directly; no wrapper needed
* Result object for single output: Over-engineering — `OrderResult` wrapping just `Order` is unnecessary
* Unnecessary result object: Every orchestration gets a result class — 50 result classes; create only when multiple outputs exist

---

## Related Rules

* Enforce Service-Level Orchestration
* Enforce Action Composition via Services

---

## Related Skills

* Orchestrate Multi-Step Workflows in Services
* Compose Actions in Service Orchestration Methods
