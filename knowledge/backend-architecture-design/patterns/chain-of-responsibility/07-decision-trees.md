# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Chain of Responsibility pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Chain of Responsibility vs conditional logic
* Decision 2: Handler composition — pipeline vs linked list
* Decision 3: Handler interaction — pass-through vs short-circuit vs modify

---

# Architecture-Level Decision Trees

---

## Decision: Chain of Responsibility vs Conditional Logic

---

## Decision Context

Choose whether to pass a request through a chain of handlers or use explicit conditional logic.

---

## Decision Criteria

* performance considerations: chain adds O(n) handler calls; conditionals are direct (faster for n<5)
* architectural considerations: chain enables runtime composition; conditionals are static
* security considerations: chain can enforce security at each handler boundary; conditionals are monolithic
* maintainability considerations: chain permits handler addition without modification; conditionals grow the block

---

## Decision Tree

Does the same request need to be processed by different handlers based on conditions?
↓
YES → Chain of Responsibility (handlers decide to process or pass)
    ↓
    Are handlers statically known and never change at runtime?
    YES → Conditional may be simpler (no need for dynamic composition)
    ↓
    Would adding a new handler require modifying code?
    YES → Chain (new handler class, registered in pipeline — no modification)
    NO → Conditional acceptable (handler list rarely changes)
    NO → Chain of Responsibility (dynamic handler composition is valuable)
NO → Does the request need to pass through a fixed sequence of processing steps?
    YES → Pipeline pattern (each step transforms the request, always passes through)
    ↓
    Pipeline = always passes through; Chain = may stop at first matching handler
    ↓
    Always passes through → Pipeline (Laravel Pipeline component)
    May stop early → Chain of Responsibility (first matching handler processes)
NO → Simple if/else (no chain or pipeline needed)

---

## Rationale

Chain of Responsibility excels when (1) handler composition varies at runtime, (2) different handlers may process based on conditions, or (3) new handlers are added without modifying existing code. Pipeline (a related pattern) is better when every handler always processes. Simple conditionals are clearer when the handler list is small (<3) and static.

---

## Recommended Default

**Default:** Laravel Pipeline for fixed processing sequences. Chain of Responsibility for condition-based handler selection. Conditional logic for simple, static handler selection (<3 variants).

**Reason:** Pipeline provides a clean API for sequential processing. Chain provides runtime flexibility. Conditionals are simplest for small, stable sets.

---

## Risks Of Wrong Choice

Chain for fixed sequences: over-engineering for what should be a pipeline. Pipeline for conditional selection: handlers must check conditions themselves, duplicating logic. Conditional for growing handler set: endless else-if blocks, violates OCP.

---

## Related Rules

- Rule 1: Chain of Responsibility passes a request through a chain of handlers
- Rule 3: Use Pipeline (not Chain) when every handler must always process the request

---

## Related Skills

- Implement Chain of Responsibility
- Use Laravel Pipeline

---

## Decision: Handler Composition — Pipeline vs Linked List

---

## Decision Context

Choose how handlers are composed — as a pipeline (ordered array) or as a linked list (each handler knows the next).

---

## Decision Criteria

* performance considerations: pipeline uses array iteration (O(n)); linked list uses nested calls (also O(n))
* architectural considerations: pipeline is explicit and easy to reorder; linked list requires changing handler references
* security considerations: pipeline's explicit order is auditable; linked list order is distributed
* maintainability considerations: pipeline composition is centralized; linked list requires changes in individual handlers

---

## Decision Tree

Does the handler order change frequently or vary by request type?
↓
YES → Pipeline (ordered array, easy to reorder, compose differently per scenario)
    ↓
    Use Laravel's Pipeline class or a custom array-based pipeline
    Composition is centralized in one place (controller, service provider, route)
    ↓
    Is order critical and must be explicitly visible?
    YES → Pipeline (array order is immediately visible)
    ↓
    Example: `$pipeline->through([ValidateInput::class, Authorize::class, Process::class, Log::class])`
    NO → Linked list (each handler has a reference to the next in the chain)
NO → Does each handler process the same passable object (no transformation)?
    YES → Pipeline (each handler modifies/validates the passable, passes to next)
    ↓
    All handlers share the same interface: `handle($passable, $next)`
    Each handler calls `$next($passable)` if it wants processing to continue
    NO → Linked list (handlers may have different interfaces)
NO → Are handlers defined in different files that each specify their successor?
    YES → Linked list (decentralized composition)
    ↓
    Each handler class has a `$nextHandler` property or method
    Composition is distributed — order changes require modifying handler classes

---

## Rationale

Pipeline (array-based composition) is almost always the better choice in modern PHP. Composition is centralized, explicit, and easy to modify. Linked list composition (each handler knows the next) spreads the order across multiple classes and makes reordering a multi-file change.

---

## Recommended Default

**Default:** Pipeline (array-based composition) using Laravel's Pipeline class. Linked list only when handlers are defined in separate packages that don't share a composition point.

**Reason:** Pipeline composition is explicit, centralized, and easy to reorder. Linked list composition is fragile and makes order changes costly.

---

## Risks Of Wrong Choice

Linked list: changing order requires modifying every affected handler, hard to audit the chain. Pipeline with wrong interface: handlers expect different passable types, causing type errors. Pipeline without short-circuit support: handlers that should stop the chain need to throw exceptions or return early.

---

## Related Rules

- Rule 4: Use Laravel's Pipeline for handler composition — not a linked list
- Rule 5: Handlers should be stateless and testable in isolation

---

## Related Skills

- Compose Pipeline
- Implement Linked List Chain

---

## Decision: Handler Interaction — Pass-Through vs Short-Circuit vs Modify

---

## Decision Context

Choose how handlers in the chain interact — always pass through, optionally short-circuit, or modify the passable object.

---

## Decision Criteria

* performance considerations: short-circuit saves downstream handler execution; always-pass-through runs all handlers
* architectural considerations: short-circuit changes flow; modification changes state; pass-through is safest
* security considerations: short-circuit can abort unauthorized requests early; modification may alter security context
* maintainability considerations: each interaction type has different invariants that must be documented

---

## Decision Tree

Should every handler always execute?
↓
YES → Pass-through (all handlers run, each can modify the passable)
    ↓
    Pipeline pattern — each handler transforms the passable, passes to next
    ↓
    Example: middleware that adds headers, sanitizes input, logs request
    ↓
    Handler signature: `handle($passable, \Closure $next): mixed`
    Always call `return $next($passable)` unless intentionally stopping
    NO → Can a handler decide to stop processing (short-circuit)?
        YES → Short-circuit (handler returns without calling `$next`)
        ↓
        Short-circuit use cases:
        → Auth: return 401 response before reaching controller
        → Cache: return cached response without hitting DB
        → Rate limiting: return 429 before processing
        ↓
        Handler returns a response value (not `$next(...)`)
        Does the short-circuit need to carry data for subsequent handlers?
        YES → Short-circuit with data (set data on passable, then stop)
        ↓
        Set passable properties before short-circuiting
        Subsequent handlers won't run — the passable carries the data
        NO → Simple short-circuit (just return without calling `$next`)
NO → Does the handler extract or modify data from the passable for downstream handlers?
    YES → Modify (handler reads/writes to the passable object)
    ↓
    Is the passable object mutable (standard Pipeline behavior)?
    YES → Modify in place (handler sets properties, next handler reads them)
    ↓
    Each handler's modifications are visible to subsequent handlers
    Document what each handler adds/removes
    NO → Pass-through (immutable style — create new passable or don't modify)
        ↓
        Immutable pass-through: return `$next(clone $passable->withModification())`
        This is more functional but less common in Laravel

---

## Rationale

Pass-through (always call `$next`) is the default for Pipeline handlers. Short-circuit is for auth, caching, and rate limiting. Modify-in-place is standard for middleware that enriches the request (add headers, merge input). The choice should be explicit in each handler's contract.

---

## Recommended Default

**Default:** Pass-through handlers (always call `$next($passable)`). Short-circuit only for auth, caching, and rate limiting. Modification only when downstream handlers need the enriched data.

**Reason:** Pass-through is the simplest and most predictable behavior. Short-circuit and modification add complexity and implicit contracts between handlers.

---

## Risks Of Wrong Choice

Short-circuit without intention: handler stops chain accidentally, missing downstream processing. Modification without documentation: downstream handlers don't know what data is available. Pass-through for auth handler: unauthenticated request reaches controller, security vulnerability.

---

## Related Rules

- Rule 6: Handlers must always call `$next($passable)` unless intentionally short-circuiting
- Rule 7: Document handler side effects — what it adds, removes, or short-circuits

---

## Related Skills

- Design Short-Circuit Handlers
- Design Pass-Through Handlers
- Compose Middleware Pipeline
