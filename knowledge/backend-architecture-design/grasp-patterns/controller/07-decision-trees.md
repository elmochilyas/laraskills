# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** GRASP: Controller
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Thin vs fat controller for request handling
* Decision 2: One controller per aggregate vs per use case
* Decision 3: Depth of delegation — controller to service vs controller to command bus

---

# Architecture-Level Decision Trees

---

## Decision: Thin vs Fat Controller for Request Handling

---

## Decision Context

Choose how much logic the controller should contain versus delegating to services.

---

## Decision Criteria

* performance considerations: thin controllers add one more indirection layer; fat controllers are faster but less maintainable
* architectural considerations: thin controllers enforce separation of concerns; fat controllers couple business logic to HTTP
* security considerations: thin controllers centralize security in services; fat controllers may miss auth checks
* maintainability considerations: thin controllers are easier to test and reuse across transports

---

## Decision Tree

Does the logic extend beyond validation, DTO construction, and response formatting?
↓
YES → Would moving this logic to a service improve testability (can the service be tested without HTTP)?
    YES → Thin controller (delegate to service; controller is 5-15 lines)
    NO → Does the logic involve domain rules (calculations, state changes, invariants)?
        YES → Thin controller (domain logic belongs in domain layer)
        NO → Does the logic involve coordination of multiple services?
            YES → Thin controller (orchestration belongs in application service)
            NO → Refactor into thin controller anyway (the logic likely doesn't belong here)
NO → Thin controller acceptable (simple CRUD delegation)
    ↓
    Is the controller method under 15 lines (excluding DI and validation)?
    YES → Appropriate thinness
    NO → What's making it fat?
        Business logic → Extract to domain service or entity
        Orchestration → Extract to application/use-case service
        Response formatting → Extract to presenter/transformer
        Validation → Extract to form request or DTO
    ↓
    Can the controller method be tested without bootstrapping the full framework?
    YES → Thin controller achieved (testable in isolation)
    NO → Further decouple: extract application layer code from controller

---

## Rationale

Thin controllers (5-15 lines per method) that only validate input, build DTOs/commands, delegate to a service, and return a response are the most maintainable. Fat controllers accumulate business logic that becomes untestable without HTTP and unreusable across transports (CLI, queue, API).

---

## Recommended Default

**Default:** Thin controller pattern — validate, delegate, respond. All business logic in services or domain models.

**Reason:** Thin controllers are easy to test, reuse across transports, and keep business logic framework-agnostic.

---

## Risks Of Wrong Choice

Fat controller: business logic scattered in HTTP layer, untestable, unreusable, framework coupling. Ultra-thin controller (anemic): every method just calls one service method with no transformation, excessive indirection.

---

## Related Rules

- Rule 1: A Controller handles system events and delegates to the appropriate use case
- Rule 3: Keep Controllers thin—less than 15 lines of logic excluding DI and validation

---

## Related Skills

- Apply the Controller GRASP Pattern
- Implement a Command Bus

---

## Decision: One Controller Per Aggregate vs Per Use Case

---

## Decision Context

Choose the granularity of controller classes — grouped by aggregate or one per use case.

---

## Decision Criteria

* performance considerations: both options have negligible performance impact
* architectural considerations: per-aggregate grouping aligns with domain boundaries
* security considerations: per-use-case controllers allow granular auth annotations
* maintainability considerations: per-aggregate reduces file navigation; per-use-case is more discoverable

---

## Decision Tree

Does the aggregate have more than 5 use cases (public methods)?
↓
YES → Does the aggregate have clearly separable use cases (different dependencies)?
    YES → Split into multiple controllers per use-case group (e.g., OrderQueryController, OrderCommandController)
    NO → Single controller per aggregate (max 5-7 methods per controller)
NO → Are the use cases for the same aggregate closely related (CRUD for one entity)?
    YES → Single controller per aggregate (group related operations)
    ↓
    Does the single controller have more than 7 public methods?
    YES → Split by command vs query (OrderCommandController, OrderQueryController)
    NO → Keep as one controller
NO → Are the use cases for different entities or contexts?
    YES → Separate controllers (one per entity/aggregate)
    ↓
    Does a controller have only 1-2 methods after separation?
    YES → Consider merging with related controller (too many tiny files is also bad)
    NO → Keep separate (clear boundaries)

---

## Rationale

One controller per aggregate is the standard pattern — methods for creating, updating, canceling, and querying the same aggregate belong together. Split when a controller exceeds 7 methods or has clearly different dependency requirements (commands vs queries, read vs write).

---

## Recommended Default

**Default:** One controller per aggregate root (OrderController, CustomerController). Split into command/query controllers when exceeding 7 methods.

**Reason:** Per-aggregate controllers align with domain boundaries, reduce file navigation, and are easy to discover.

---

## Risks Of Wrong Choice

One controller per use case: file proliferation, navigation overhead, fragmented related operations. God controller (one for everything): SRP violation, conflicting dependencies, hard to navigate.

---

## Related Rules

- Rule 4: One Controller per aggregate or use-case group—not per entity

---

## Related Skills

- Apply the Controller GRASP Pattern

---

## Decision: Depth of Delegation — Controller to Service vs Controller to Command Bus

---

## Decision Context

Choose whether the controller delegates directly to a service or dispatches through a command bus.

---

## Decision Criteria

* performance considerations: command bus adds dispatch overhead; direct service call is faster
* architectural considerations: command bus adds middleware pipeline (logging, transactions, auth)
* security considerations: command bus centralizes auth in middleware; service calls need per-method auth
* maintainability considerations: command bus requires more files (command + handler); service is more direct

---

## Decision Tree

Does the application require cross-cutting concerns (logging, transactions, validation) on every operation?
↓
YES → Can these concerns be applied consistently without middleware (AOP, traits)?
    YES → Direct service call with trait/decorator (simpler than command bus)
    NO → Command bus (middleware pipeline ensures consistent application)
NO → Is the application expected to grow to > 50 use cases?
    YES → Command bus (scales better with use case count; each handler is focused)
    NO → Are there multiple transports (HTTP, CLI, queue) for the same operations?
        YES → Command bus (reuse commands and handlers across transports)
        NO → Direct service call (simpler; appropriate for smaller applications)
    ↓
    Does the team prefer explicit service classes or command/handler pairs?
    Service → Direct delegation (one file per use-case group)
    Command → Command bus (one command + one handler per use case)
    ↓
    Is audit logging required for every write operation?
    YES → Command bus middleware for audit (consistent enforcement)
    NO → Either approach works

---

## Rationale

Direct service delegation is simpler and appropriate for small to medium applications. A command bus adds structure, middleware support, and transport-agnostic commands at the cost of more files and indirection. Choose based on application scale and cross-cutting concern requirements.

---

## Recommended Default

**Default:** Direct service delegation for most applications. Introduce command bus when cross-cutting concerns (middleware) are needed or the application exceeds 50 use cases.

**Reason:** Direct delegation is simpler, has fewer files, and is easier to follow. The command bus's benefits (middleware, transport reuse) only pay off at scale.

---

## Risks Of Wrong Choice

Command bus for small app: unnecessary complexity, more files, harder to follow flow. Direct delegation at scale: scattered cross-cutting concerns, duplicated middleware logic, hard to enforce consistent transaction handling.

---

## Related Rules

- Rule 2: A Controller does not create the objects it delegates to — receive them via DI
- Rule 1: A Controller handles system events and delegates to the appropriate use case

---

## Related Skills

- Apply the Controller GRASP Pattern
- Implement a Command Bus
