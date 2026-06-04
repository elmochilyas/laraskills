# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** GRASP: Low Coupling
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Concrete class vs interface dependency
* Decision 2: Event-based decoupling vs direct call
* Decision 3: Acceptable dependency count per class

---

# Architecture-Level Decision Trees

---

## Decision: Concrete Class vs Interface Dependency

---

## Decision Context

Choose whether a class should depend on a concrete implementation or an interface.

---

## Decision Criteria

* performance considerations: interface dispatch adds minimal overhead; concrete calls are direct
* architectural considerations: interface dependency allows swapping; concrete coupling prevents it
* security considerations: interface dependency allows security-enhanced implementations
* maintainability considerations: interface adds a file but reduces coupling

---

## Decision Tree

Is the depended-on class stable (part of the language, framework core, no planned changes)?
↓
YES → Direct concrete dependency acceptable (very low risk of change)
NO → Does the depended-on class have multiple implementations or planned alternates?
    YES → Interface dependency (swap implementations without changing clients)
    NO → Is the depended-on class in a different architectural layer (domain depends on infrastructure)?
        YES → Interface dependency (preserve dependency rule: domain depends on interface)
        NO → Is the depended-on class volatile (changes frequently, external dependency)?
            YES → Interface dependency (shield from volatility)
            NO → Are tests the only reason for the interface (no real second implementation)?
                YES → Interface dependency still recommended (testability is a valid reason)
                NO → Is the dependency count for the client already high (> 3)?
                    YES → Consider if the concrete class is a stable value object or domain primitive
                        YES → Direct dependency acceptable (value objects don't change)
                        NO → Interface dependency (reduce coupling via abstraction)

---

## Rationale

Depend on interfaces for any class that has a chance of changing, has multiple implementations, or crosses architectural boundaries. Depend directly on stable classes (value objects, language primitives, stable libraries). The cost of an interface is one file; the cost of removing concrete coupling later is substantial.

---

## Recommended Default

**Default:** Interface dependency for all cross-layer dependencies (domain depends on interface, infrastructure implements). Concrete dependency for same-layer value objects and utilities.

**Reason:** Cross-layer boundaries exist to allow independent change — interfaces enable that. Within the same layer, concrete coupling is acceptable because changes typically affect all dependents together.

---

## Risks Of Wrong Choice

Concrete across boundaries: violates dependency rule, can't swap implementations, hard to test. Interface everywhere: YAGNI violation, navigation overhead, speculative abstraction.

---

## Related Rules

- Rule 1: Depend on abstractions (interfaces), not concrete classes
- Rule 3: Couple to stable, well-tested interfaces—not volatile ones

---

## Related Skills

- Apply the Low Coupling GRASP Pattern
- Apply Indirection GRASP Pattern

---

## Decision: Event-Based Decoupling vs Direct Call

---

## Decision Context

Choose whether to decouple components via events or call them directly.

---

## Decision Criteria

* performance considerations: events add dispatch and serialization overhead; direct calls are fastest
* architectural considerations: events decouple publisher from subscriber; direct calls create compile-time coupling
* security considerations: event dispatch can be monitored and audited centrally
* maintainability considerations: event-based systems are harder to trace; direct calls are explicit

---

## Decision Tree

Does the caller need a synchronous response from the callee?
↓
YES → Direct call (events are fire-and-forget; cannot return values)
NO → Does the caller need confirmation that the callee processed the action?
    YES → Is the confirmation critical for business consistency?
        YES → Direct call with response or synchronous event with result
        NO → Event dispatch (fire-and-forget; eventual confirmation is acceptable)
NO → Are there (or will there be) multiple subscribers for the same event?
    YES → Event-based decoupling (each subscriber reacts independently)
    ↓
    Do subscribers need to be added without modifying the publisher?
    YES → Event-based decoupling (open-closed: publisher doesn't know subscribers)
NO → Would a direct call create a circular dependency?
    YES → Event-based decoupling (events break circularity naturally)
    ↓
    Is the called operation a side effect (email, log, notification)?
    YES → Event-based decoupling (side effects should not block the main flow)
    ↓
    Would a direct call couple components that change at different rates?
    YES → Event-based decoupling (different change rates → decouple via events)

---

## Rationale

Events decouple the producer from the consumer — the producer doesn't know or care who handles the event. Use events when: the caller doesn't need a response, there are multiple subscribers, the operation is a side effect, or the components change at different rates. Use direct calls when a synchronous response is required.

---

## Recommended Default

**Default:** Direct call for operations that need a response. Event-based decoupling for side effects, notifications, and multi-subscriber scenarios.

**Reason:** Direct calls are simpler to trace and debug. Events provide valuable decoupling but add indirection. Use events where the decoupling benefit outweighs the tracing cost.

---

## Risks Of Wrong Choice

Direct call for side effects: blocked response time, tight coupling between primary operation and side effects. Event for critical responses: lost events, eventual consistency surprises, harder to reason about flow.

---

## Related Rules

- Rule 4: Use events to decouple components that don't need synchronous responses
- Rule 5: Avoid circular dependencies at all costs

---

## Related Skills

- Apply the Low Coupling GRASP Pattern
- Implement Event Bus Patterns

---

## Decision: Acceptable Dependency Count Per Class

---

## Decision Context

Determine whether a class has too many dependencies and should be split.

---

## Decision Criteria

* performance considerations: more dependencies increase DI resolution time; negligible for most apps
* architectural considerations: high dependency count indicates low cohesion (class does too much)
* security considerations: each dependency adds an attack surface; minimize for security-critical classes
* maintainability considerations: more dependencies means more reasons to change; fragile classes

---

## Decision Tree

Does the class have more than 5 constructor dependencies?
↓
YES → Are these dependencies all from the same layer/context?
    YES → Consider splitting the class into smaller, focused classes
        ↓
        Can the dependencies be grouped logically (e.g., all "notification" related)?
        YES → Extract a Facade for the group (NotificationService wraps Mailer+SMS+Pusher)
        NO → Does each dependency support a different responsibility?
            YES → Split the class by responsibility (SRP violation confirmed)
            NO → Some dependencies may be utilities (Logger, Config) — acceptable extras
    NO → Cross-layer dependencies are a red flag (e.g., domain class depending on infrastructure)
        YES → Fix the dependency direction first (domain must not depend on infrastructure)
NO → Is the class an infrastructure coordinator (middleware, service provider)?
    YES → Higher dependency count is acceptable (nature of coordinator classes)
    ↓
    For domain objects: more than 2-3 dependencies is suspicious
    For application services: 3-5 is normal
    For infrastructure: 5+ can be acceptable
    ↓
    Does the class have dependencies that are unused methods (dead weight)?
    YES → Remove unused dependencies
    NO → Are there duplicated method calls across different dependencies?
        YES → Extract a Facade or use composition to reduce surface area

---

## Rationale

Constructor dependency count is a proxy for how many reasons a class has to change. High fan-out (coupling to many classes) makes a class fragile — changes in any collaborator can cascade. The rule of thumb: ≤ 5 for services, ≤ 3 for domain objects, higher for infrastructure coordinators.

---

## Recommended Default

**Default:** ≤ 5 constructor dependencies for application services. ≤ 3 for domain objects. Split when exceeded.

**Reason:** Five dependencies means five potential reasons to change. Fewer dependencies = more stable classes. Infrastructure coordinators are exceptions because they naturally wire many collaborators.

---

## Risks Of Wrong Choice

Too many dependencies: fragile class, frequent changes from unrelated collaborator changes, high testing complexity. Splitting to reduce count: artificial separation, increased coupling between new classes, excessive indirection.

---

## Related Rules

- Rule 2: Keep the number of dependencies per class low (≤ 5 for services)

---

## Related Skills

- Apply the Low Coupling GRASP Pattern
- Apply High Cohesion GRASP Pattern
