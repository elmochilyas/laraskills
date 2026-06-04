# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Observer pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Sync vs async event listeners
* Decision 2: Event payload design — data-only vs full object reference
* Decision 3: Event ordering — ordered vs unordered listeners

---

# Architecture-Level Decision Trees

---

## Decision: Sync vs Async Event Listeners

---

## Decision Context

Choose whether event listeners execute synchronously (in the same request/process) or asynchronously (via queue).

---

## Decision Criteria

* performance considerations: sync listeners add to response time; async listeners dispatch to queue (1-5ms overhead)
* architectural considerations: sync listeners are simpler; async listeners decouple lifecycle and enable retries
* security considerations: async listeners can handle sensitive data without holding the request open
* maintainability considerations: sync listeners are easier to debug; async listeners require queue infrastructure

---

## Decision Tree

Does the listener need to complete before the response is sent?
↓
YES → Sync listener (response depends on listener outcome)
    ↓
    Does the listener modify data that the response includes?
    YES → Sync listener (data must be available for response)
    ↓
    Example: send welcome email after registration — user sees confirmation on success
    NO → Could the response be sent without waiting for the listener?
        YES → Move to async (better user experience)
        NO → Keep sync
NO → Is the listener a side effect (logging, notification, cache invalidation)?
    YES → Async listener (side effects should not block the response)
    ↓
    Does the listener need guaranteed execution?
    YES → Async on queue with retries (queue provides reliability)
    NO → Sync is simpler (but blocks response — prefer async if latency is a concern)
NO → Is the listener doing heavy I/O (API calls, file processing, email sending)?
    YES → Async listener (prevents blocking the request)
    ↓
    Estimate: does the I/O take more than 100ms?
    YES → Definitely async (100ms+ I/O should not block the response)
    NO → Sync is acceptable (fast I/O)
    NO → Sync listener (lightweight operations)

---

## Rationale

Synchronous listeners block the response. Asynchronous listeners dispatch to the queue and return immediately. The rule of thumb: if the response doesn't depend on the listener's outcome, make it async. Heavy I/O, side effects, and non-critical operations belong on the queue.

---

## Recommended Default

**Default:** Async listeners for I/O, side effects, and non-critical operations. Sync listeners only when the response directly depends on the listener's outcome.

**Reason:** Async listeners improve response time, decouple lifecycles, and provide retry capability. Sync listeners should be reserved for operations where the response must include the listener's effect.

---

## Risks Of Wrong Choice

Sync for heavy I/O: slow response times, user frustration, resource exhaustion. Async for critical path: response sent before critical operation completes, eventual consistency surprises. No error handling in async: silent failures, lost operations.

---

## Related Rules

- Rule 1: Async listeners (ShouldQueue) for I/O and side effects
- Rule 2: Sync listeners only when response depends on listener outcome
- Rule 3: Handle listener exceptions — don't let unhandled exceptions crash the request

---

## Related Skills

- Configure Queue Listeners
- Design Async Event Flow

---

## Decision: Event Payload Design — Data-Only vs Full Object Reference

---

## Decision Context

Choose what data the event carries — primitive values/DTOs or full Eloquent model references.

---

## Decision Criteria

* performance considerations: full models may serialize large amounts of data; DTOs include only needed fields
* architectural considerations: DTOs decouple listener from model structure; full models couple to the model class
* security considerations: DTOs control data exposure; full models may leak sensitive fields
* maintainability considerations: DTOs are stable contracts; full models change with schema

---

## Decision Tree

Is the event dispatched to a queue (async listener)?
↓
YES → Use data-only payload (primitives, IDs, DTOs — no Eloquent models)
    ↓
    Does the listener need the full model to operate?
    YES → Pass the model ID, listener re-queries from DB
    ↓
    Re-querying is cheap (primary key lookup) and avoids serialization issues
    ↓
    Exception: if the model was just created, pass the ID (fresh from DB)
    NO → Pass only the data the listener needs (DTO or array of primitives)
    ↓
    Name the DTO clearly: `UserRegisteredPayload`
NO → Is the event consumed by a single listener in the same process?
    YES → Full model is acceptable (no serialization, same process)
    ↓
    Is the consumer in a different module or bounded context?
    YES → Use DTO (prevents inter-module coupling on model structure)
    NO → Same module: full model is fine (they share the model definition)
NO → Is the event part of a public API (consumed by other teams/systems)?
    YES → DTO with explicit contract (the model is an implementation detail)
    ↓
    Version the DTO for backward compatibility
    NO → DTO recommended anyway (decouples listeners from model changes)

---

## Rationale

For async events (queue), use data-only payloads — Eloquent models may not serialize correctly after the request context is gone. For sync events in the same module, full models are acceptable. For cross-module or cross-system events, DTOs provide a stable contract that decouples consumers from schema changes.

---

## Recommended Default

**Default:** DTOs or primitive data for all async events. Full models for sync events within the same module. Cross-module events use DTOs.

**Reason:** DTOs decouple consumers from model changes, control data exposure, and serialize cleanly. Full models are convenient for intra-module sync events but cause coupling across boundaries.

---

## Risks Of Wrong Choice

Full models in async events: serialization failures (lazy loaded relations), coupling listeners to model structure, large payloads. DTOs for every event: overhead of creating and maintaining DTO classes for simple notifications.

---

## Related Rules

- Rule 4: Use data-only payloads for queued events (IDs, DTOs — not Eloquent models)
- Rule 5: Event payloads should not contain full model instances for async dispatch

---

## Related Skills

- Design Event DTOs
- Serialize Events for Queue

---

## Decision: Event Ordering — Ordered vs Unordered Listeners

---

## Decision Context

Choose whether event listeners must execute in a specific order or can run independently.

---

## Decision Criteria

* performance considerations: ordered execution is sequential (1+2+3 time); unordered runs in parallel (max time)
* architectural considerations: ordered execution creates listener dependencies; unordered respects independence
* security considerations: ordered listeners may rely on previous listener's security enforcement
* maintainability considerations: ordered listeners are fragile (changing order breaks system)

---

## Decision Tree

Does listener B depend on listener A having already executed?
↓
YES → Ordered execution (listeners must run in sequence)
    ↓
    Is the dependency on data modification (B reads data that A writes)?
    YES → Can the dependency be removed?
        YES → Make listeners independent (pass all data in event payload)
        NO → Ordered execution is required
        ↓
        Document the order explicitly (comment on event class or EventServiceProvider)
    NO → Is the dependency on side effects (B sends email after A saves data)?
        YES → Can A's side effect be moved into A's responsibility?
            YES → Remove dependency, make listeners independent
            NO → Ordered execution required
NO → Are listeners independent (no dependency on each other)?
    YES → Unordered execution (Laravel's default — listener order is irrelevant)
    ↓
    This is the ideal scenario — listeners can be added/removed without coordination
    Changing one listener doesn't affect others
NO → Is order determined by business rules (audit log before email notification)?
    YES → Order explicitly in EventServiceProvider
    ↓
    Audit listener `$listen` entry before notification listener
    Document: "audit must run before notification to capture the event in logs"

---

## Rationale

Ordered listeners create implicit dependencies that make the system fragile — changing listener order can break behavior. The ideal is unordered listeners where each listener is independent and can be added/removed without affecting others. When order is required, document it explicitly and minimize the number of ordered listeners.

---

## Recommended Default

**Default:** Unordered listeners (independent, no dependencies). Explicit ordering only when business rules require a specific sequence.

**Reason:** Unordered listeners are independently deployable, testable, and maintainable. Ordered listeners create fragile chains where adding a new listener may break the sequence.

---

## Risks Of Wrong Choice

Unordered when order is needed: listeners execute in registration order, which changes when EventServiceProvider is modified. Implicit order assumptions: new developer adds a listener in the "wrong" position, behavior breaks silently. Over-documenting order: extensive documentation that is maintained separately from code.

---

## Related Rules

- Rule 6: Design listeners to be independent — no execution order dependencies
- Rule 7: When order is required, document and enforce in EventServiceProvider

---

## Related Skills

- Design Independent Listeners
- Order Event Execution
