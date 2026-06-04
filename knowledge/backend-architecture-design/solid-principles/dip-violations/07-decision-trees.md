# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** SOLID principles in PHP: DIP violations
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Abstraction timing — extract interface before vs after concrete implementation
* Decision 2: Interface ownership — domain/application layer vs infrastructure layer
* Decision 3: Dependency injection — constructor injection vs method injection vs service locator

---

# Architecture-Level Decision Trees

---

## Decision: Abstraction Timing — Extract Interface Before vs After Concrete Implementation

---

## Decision Context

Choose whether to define interfaces upfront (before implementation) or extract them from existing concrete classes.

---

## Decision Criteria

* performance considerations: interface dispatch adds negligible overhead regardless of timing
* architectural considerations: upfront interfaces may be premature; extracted interfaces reflect real usage
* security considerations: interfaces defined upfront can include security contracts (authentication interfaces)
* maintainability considerations: upfront interfaces risk YAGNI; extracted interfaces require refactoring

---

## Decision Tree

Is the interface for an external dependency (API client, mail driver, file system)?
↓
YES → Define interface upfront (you need an abstraction boundary for testability)
    ↓
    Is there only one implementation planned?
    YES → Interface still justified (testability + ability to swap later)
    ↓
    Does the single implementation depend on the interface?
    YES → DIP is followed correctly (implementation depends on interface)
    NO → Single implementation without interface is acceptable for simple cases
    NO → Interface is necessary (multiple implementations expected)
NO → Is the interface for a domain concept with multiple variations (payment gateway, notification channel)?
    YES → Define interface upfront (variations are confirmed)
NO → Is the class concrete and stable with no planned variants?
    YES → Don't extract interface (YAGNI — extract when second variant emerges)
    NO → Is there an existing concrete class with a test that needs mocking?
        YES → Extract interface from the concrete class (IDE can do this automatically)
        NO → Wait until the second variant emerges before extracting

---

## Rationale

Upfront interfaces are justified for (1) external dependencies (testability), (2) confirmed variants (payment gateways, notification channels), and (3) when the interface represents a stable contract. Extracting interfaces from existing concrete classes is safe and YAGNI-compliant — modern IDEs make this a refactoring operation, not a rewrite.

---

## Recommended Default

**Default:** Extract interfaces from concrete classes when the second implementation emerges or when testability demands it. Define interfaces upfront only for external dependencies or confirmed variants.

**Reason:** Premature interfaces add indirection without value. Extraction is cheap with modern tooling. Upfront interfaces for external dependencies are justified by the testability benefit.

---

## Risks Of Wrong Choice

Interface for everything: over-abstraction, YAGNI violation, navigation overhead. No interfaces for external dependencies: untestable code, hard to mock, infrastructure coupling in domain logic. Interface owned by wrong layer: high-level module depends on low-level abstraction (still violates DIP).

---

## Related Rules

- Rule 1: High-level modules should not depend on low-level modules; both should depend on abstractions
- Rule 7: Extract interfaces from concrete implementations, not before they exist

---

## Related Skills

- Identify DIP Violations
- Extract Interface Refactoring
- Apply Hexagonal Architecture

---

## Decision: Interface Ownership — Domain/Application Layer vs Infrastructure Layer

---

## Decision Context

Choose where interface definitions are placed — in the layer that consumes them or the layer that implements them.

---

## Decision Criteria

* performance considerations: interface location has no performance impact
* architectural considerations: consumer-owned interfaces follow DIP; implementor-owned violate it
* security considerations: consumer-owned interfaces limit what infrastructure can expose to the domain
* maintainability considerations: consumer-owned interfaces are stable; implementor-owned change with infrastructure

---

## Decision Tree

Does the domain/application layer depend directly on an infrastructure class (Eloquent model, HTTP client, mail driver)?
↓
YES → DIP violation — introduce an interface
    ↓
    Where should this interface be defined?
    → In the domain/application layer (the consumer)
    → Not in the infrastructure layer (the implementor)
    ↓
    Does the interface name reference infrastructure concepts (Eloquent, Redis, Stripe)?
    YES → Rename to abstract the infrastructure concept (e.g., `PaymentGateway` not `StripeGateway`)
    ↓
    Does the interface reference Laravel contracts (Illuminate\Contracts)?
    YES → Domain depending on framework contracts is still a violation — define your own
    NO → Interface is properly abstracted
    NO → Check where existing interfaces are defined
        → Are interfaces in the same directory as implementations?
            YES → Move interfaces to the consumer's layer (follow the dependency inversion)
            NO → Are interfaces in a shared contracts module?
                YES → Acceptable if both consumer and implementor depend on shared module
                NO → Move to consumer's layer

---

## Rationale

Interfaces must be defined in the layer that consumes them, not the layer that implements them. A repository interface belongs in the domain layer (the domain defines what it needs from persistence). The infrastructure layer implements it. If the interface lives in the infrastructure layer, the domain depends on infrastructure — violating DIP regardless of the abstraction.

---

## Recommended Default

**Default:** Place all interfaces that the domain layer needs in the domain layer. Place application-specific interfaces (DTOs, command handlers) in the application layer.

**Reason:** Consumer-owned interfaces ensure high-level modules don't depend on low-level abstractions. The domain defines the contract; infrastructure implements it.

---

## Risks Of Wrong Choice

Interface in infrastructure layer: domain depends on low-level abstraction, DIP violation, interface changes with infrastructure details. Interface in shared module (premature): extra module with thin content, shared but not reused. Domain depending on Laravel Contracts: still a framework dependency in the domain.

---

## Related Rules

- Rule 3: Interfaces must be defined by the high-level module (consumer), not the low-level module (implementor)
- Rule 6: Domain layer must not depend on framework contracts; define your own interfaces
- Rule 2: Depend on interfaces owned by the high-level module; implement them in the low-level module

---

## Related Skills

- Structure Laravel for DIP Compliance
- Organize Interfaces by Consumer
- Design Hexagonal Architecture

---

## Decision: Dependency Injection — Constructor Injection vs Method Injection vs Service Locator

---

## Decision Context

Choose how dependencies are provided to a class — through constructor, method parameter, or service locator pattern.

---

## Decision Criteria

* performance considerations: constructor injection has minimal overhead; service locator adds container resolution cost
* architectural considerations: constructor injection makes dependencies explicit; service locator hides them
* security considerations: constructor injection prevents runtime dependency swapping; service locator could return wrong implementation
* maintainability considerations: constructor injection documents dependencies clearly; method injection is for optional dependencies; service locator obscures them

---

## Decision Tree

Is this dependency required for the class to function correctly?
↓
YES → Constructor injection (dependency is mandatory — fail fast if missing)
    ↓
    Is this dependency used by most (80%+) methods in the class?
    YES → Constructor injection is clearly the right choice
    NO → Consider if the class should be split (not all methods need the dependency)
    ↓
    Can the class function without this dependency (optional, used by one method)?
    YES → Method injection (inject only when the method is called)
    NO → Constructor injection (mandatory dependency)
NO → Is this dependency used by a single method only?
    YES → Method injection (inject at call time, avoid in constructor)
    ↓
    Is this dependency runtime-determined (differs per call)?
    YES → Method injection (different instance per call)
    NO → Constructor injection still acceptable (if always the same instance)
NO → Is there a container or service locator already in use by the codebase?
    YES → Consider refactoring away from service locator — constructor injection is preferred
    ↓
    Is the team large enough that hidden dependencies cause confusion?
    YES → Definitely refactor to constructor injection (explicit is better than implicit)
    NO → Service locator may be acceptable for legacy code (don't introduce in new code)
    NO → Never introduce service locator in new code; refactor existing uses

---

## Rationale

Constructor injection is the default and preferred approach for all mandatory dependencies. It makes dependencies explicit, enables compile-time checking, and works naturally with Laravel's container. Method injection is appropriate for optional dependencies or dependencies that vary per call. Service locator is an anti-pattern that hides dependencies and should be avoided in new code.

---

## Recommended Default

**Default:** Constructor injection for all mandatory dependencies. Method injection for optional or per-call dependencies. No service locator in new code.

**Reason:** Constructor injection makes dependencies explicit, testable, and container-friendly. Method injection keeps optional dependencies from bloating constructors. Service locator hides dependencies and violates DIP by depending on the container.

---

## Risks Of Wrong Choice

Service locator: hidden dependencies, untestable without container, DIP violation (depends on container). Method injection for everything: dependency passed through method chain, unclear what the class needs. Constructor injection for optional dependencies: unused parameters, confusing instantiation.

---

## Related Rules

- Rule 4: Use constructor injection for mandatory dependencies
- Rule 5: Use method injection for optional or per-call dependencies
- Rule 9: Avoid facades and service locator in business logic

---

## Related Skills

- Apply Constructor Injection
- Configure Laravel Container Bindings
- Refactor Facades to Constructor Injection
