# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Factory pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Factory method vs Service Container auto-resolution
* Decision 2: Static Factory vs Instance Factory
* Decision 3: Factory location — infrastructure layer vs application layer

---

# Architecture-Level Decision Trees

---

## Decision: Factory Method vs Service Container Auto-Resolution

---

## Decision Context

Choose between an explicit Factory class/method and relying on Laravel's Service Container to resolve dependencies automatically.

---

## Decision Criteria

* performance considerations: container auto-resolution adds ~0.1-1ms first-call overhead (reflection); explicit Factory is direct instantiation
* architectural considerations: explicit Factory is framework-agnostic; container ties to Laravel
* security considerations: container resolves blindly; Factory can enforce preconditions
* maintainability considerations: Factory is explicit about creation logic; container auto-resolution is implicit

---

## Decision Tree

Does creation require runtime configuration or conditional logic?
↓
YES → Explicit Factory (container cannot determine concrete type from config alone)
    ↓
    Example: creating payment gateway based on `config('payment.provider')`
    ↓
    Is the conditional logic complex (multiple conditions, fallbacks)?
    YES → Dedicated Factory class with strategy-like selection
        ↓
        `class PaymentGatewayFactory { public function create(string $provider): PaymentGateway }`
        NO → Simple closure in Service Provider (bind factory as closure)
    ↓
    `$this->app->bind(PaymentGatewayFactory::class, function ($app) { return new PaymentGatewayFactory($app->make(Config::class)); })`
    NO → Can the concrete type be determined from the interface binding alone?
        YES → Service Container auto-resolution (no Factory needed)
            ↓
            Bind: `$this->app->bind(PaymentGateway::class, StripeGateway::class)`
            Container resolves `StripeGateway` with all its dependencies automatically
            ↓
            Does the class have constructor arguments that change per request?
            YES → Factory closure with contextual binding
                ↓
                `$this->app->when(OrderController::class)->needs(PaymentGateway::class)->give(function () { ... })`
                NO → Simple interface-to-class binding — no Factory needed
NO → Does the constructor have complex logic (not just assignment)?
    YES → Factory (move construction logic out of constructor)
    ↓
    Constructor should do simple assignment, not complex setup
    NO → Direct instantiation or container auto-resolution

---

## Rationale

The Service Container handles the 90% case: resolve a concrete class with its dependencies. Explicit Factory is needed when creation requires runtime input, conditional logic, or the container cannot determine the correct type. Start with container binding; extract Factory when creation logic grows complex.

---

## Recommended Default

**Default:** Service Container auto-resolution (bind interface to concrete class). Extract Factory only when creation requires runtime conditions, configuration, or fallback logic.
**Reason:** Container auto-resolution requires zero factory code. Premature factory extraction adds indirection without benefit.

---

## Risks Of Wrong Choice

Factory where container suffices: unnecessary class, boilerplate, tested code path that never changes. Container where Factory is needed: creation logic scattered, cannot substitute implementations without modifying callers. No binding at all: callers depend on concrete classes directly, difficult to test.

---

## Related Rules

- Rule 1: Prefer container auto-resolution for simple interface-to-class mapping
- Rule 2: Extract Factory when creation requires runtime conditions or configuration

---

## Related Skills

- Bind Interface to Class in Container
- Implement Factory Method
- Configure Container Contextual Binding

---

## Decision: Static Factory vs Instance Factory

---

## Decision Context

Choose between a static factory method (on the class itself or a static factory class) and an instance factory (injected via container).

---

## Decision Criteria

* performance considerations: static call is slightly faster; instance factory requires container resolution once
* architectural considerations: static factory is globally accessible; instance factory is injectable and replaceable
* security considerations: static factory cannot be mocked in tests without static method mocking; instance factory uses standard DI mocking
* maintainability considerations: static factories create hidden dependencies; instance factories are explicit in constructors

---

## Decision Tree

Does the factory need to be replaced in tests (swap implementation)?
↓
YES → Instance Factory (inject via constructor, mock in tests)
    ↓
    `class OrderService { public function __construct(private PaymentGatewayFactory $factory) {} }`
    Test: `$service = new OrderService(new MockPaymentGatewayFactory());`
    ↓
    Is the factory used across many classes?
    YES → Instance Factory bound as singleton in container (one instance shared)
        ↓
        `$this->app->singleton(PaymentGatewayFactory::class, StripeFactory::class)`
        NO → Instance Factory injected per consumer — no singletons needed
NO → Is the factory part of a legacy codebase where DI is not established?
    YES → Static factory as transitional step (refactor to instance factory later)
    ↓
    Static factory can be acceptable in legacy contexts
    ↓
    Does the factory need its own dependencies (HTTP client, config, logger)?
    YES → Instance Factory (static factories with dependencies require service locator anti-pattern)
        ↓
        `PaymentGatewayFactory::create()` needs an HTTP client — where does it come from?
        Static factories with dependencies lead to service locator or global state
        NO → Static factory is acceptable if it has zero dependencies and no test substitution needed
            ↓
            Pure utility factory: `class NotifierFactory { public static function create(string $type): Notifier {} }`
NO → Does the factory vary by context (different factory for different callers)?
    YES → Instance Factory (contextual binding in container per consumer)
    ↓
    `$this->app->when(OrderController::class)->needs(Factory::class)->give(StripeFactory::class)`
    NO → Either works; prefer instance factory for consistency

---

## Rationale

Instance Factory aligns with Laravel's DI conventions: testable, replaceable, explicit. Static Factory is a legacy pattern that creates hidden dependencies. The only valid case for Static Factory is a zero-dependency utility factory in legacy code where DI has not been introduced.

---

## Recommended Default

**Default:** Instance Factory (injected via constructor). Static Factory only for zero-dependency utility factories in legacy codebases without DI.
**Reason:** Instance Factory supports test mocking, dependency injection, and contextual binding. Static Factory obscures dependencies and resists testing.

---

## Risks Of Wrong Choice

Static Factory in modern Laravel: cannot mock without `Mockery::mock('alias:...')`, hidden coupling. Instance Factory for single-use utility: extra injection boilerplate for a simple class. Static Factory with dependencies: service locator pattern, implicit coupling that's invisible from the constructor.

---

## Related Rules

- Rule 3: Prefer instance factories over static factories
- Rule 4: Never use static factories with dependencies in new code

---

## Related Skills

- Implement Instance Factory
- Mock Instance Factory in Tests
- Refactor Static Factory to Instance Factory

---

## Decision: Factory Location — Infrastructure Layer vs Application Layer

---

## Decision Context

Choose whether the Factory class belongs in the Infrastructure layer (concrete implementations) or the Application layer (use case coordination).

---

## Decision Criteria

* performance considerations: location has no performance impact
* architectural considerations: Infrastructure factories create concrete implementations; Application factories coordinate use case creation
* security considerations: Application layer can enforce security on what gets created; Infrastructure just creates
* maintainability considerations: Infrastructure factories change with external systems; Application factories change with business logic

---

## Decision Tree

Does the factory create infrastructure objects (HTTP clients, mail drivers, queue adapters)?
↓
YES → Infrastructure layer (factory depends on external SDKs, framework classes)
    ↓
    Example: `StripePaymentGatewayFactory`, `RedisCacheFactory`, `SesMailFactory`
    ↓
    Does the factory create domain objects (Entities, Value Objects, Domain Services)?
    YES → Application layer (domain objects should not depend on infrastructure)
        ↓
        Domain factory interface is defined in domain layer
        Implementation can be in Application or Infrastructure
        ↓
        Is the domain object creation purely based on domain data (no I/O)?
        YES → Implement in Application layer (pure domain creation, no external dependencies)
            ↓
            Example: `OrderFactory::createFromCart(Cart $cart): Order`
            NO → Implement in Infrastructure layer (needs DB, API, or external service)
                ↓
                Example: `UserFactory::createWithDefaultAvatar(UserData $data): User`
                Interface in domain, implementation in infrastructure
    NO → Is the creation part of a use case (creates multiple objects to fulfill a request)?
        YES → Application layer (use case coordinates creation of multiple objects)
            ↓
            Example: `CreateOrderUseCase` uses factory to create Order, Invoice, Shipment
            NO → Infrastructure if it creates external service objects

---

## Rationale

Factory location follows the Dependency Inversion Principle: domain defines the factory interface, infrastructure provides implementations. Infrastructure factories create adapters and wrappers. Application factories coordinate use-case-level creation. The key rule: domain layer never depends on concrete factories.

---

## Recommended Default

**Default:** Infrastructure layer for factories that create external service objects. Application layer for factories that create domain objects as part of use cases. Domain layer for factory interfaces only.
**Reason:** Following the dependency rule keeps the domain framework-agnostic and testable without infrastructure.

---

## Risks Of Wrong Choice

Factory in domain layer: domain depends on infrastructure (framework, SDK), violates dependency rule. Factory in UI layer: controllers contain creation logic, impossible to test without HTTP. No factory at all: `new` scattered everywhere, cannot intercept creation for cross-cutting concerns.

---

## Related Rules

- Rule 5: Domain defines factory interfaces; Infrastructure implements them
- Rule 6: Application-layer factories coordinate use case object creation

---

## Related Skills

- Organize Factory Classes by Layer
- Implement Domain Factory Interface
- Coordinate Creation in Application Layer
