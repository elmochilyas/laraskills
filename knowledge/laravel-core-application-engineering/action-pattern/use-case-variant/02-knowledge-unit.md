# Use Case Variant

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Actions Pattern
- **Knowledge Unit:** Use Case Variant
- **Difficulty Level:** Expert
- **Last Updated:** 2026-06-02

---

## Executive Summary

The Use Case variant extends the Action pattern with a framework-agnostic contract boundary. Unlike a standard action (which may accept an array, an Eloquent model, or a Request object), a Use Case enforces typed DTO input and typed result output — no HTTP classes, no Eloquent models in the signature, no framework imports in the business logic. This makes the Use Case callable identically from HTTP controllers, queue workers, CLI commands, and scheduled tasks, with zero framework coupling in its signature.

The engineering significance is that the Use Case variant represents the strictest architectural boundary in the Laravel ecosystem. It is the Clean Architecture / Hexagonal Architecture "use case" or "interactor" adapted to Laravel's conventions. The cost is boilerplate — every Use Case requires a DTO class and often an interface for its dependency. The benefit is framework portability: the same Use Case class can run in Laravel, Symfony, or a vanilla PHP worker without changing a line of code.

---

## Core Concepts

### The Three-Layer Contract
A Use Case enforces three distinct contracts:

1. **Input contract**: A typed DTO that carries all input data. No array access, no optional fields, no HTTP awareness.
2. **Output contract**: A typed result object (DTO, Collection, or void). No raw arrays, no Eloquent models in return type.
3. **Dependency contract**: Constructor dependencies are interfaces, not concrete classes. The Use Case depends on abstractions.

```php
final class RegisterUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
        private PasswordHasherInterface $hasher,
    ) {}

    public function execute(RegisterUserDTO $dto): UserDTO
    {
        $user = $this->users->create(
            $dto->name,
            $dto->email,
            $this->hasher->hash($dto->password),
        );
        return new UserDTO(
            id: $user->id,
            name: $user->name,
            email: $user->email,
        );
    }
}
```

### Use Case vs Action vs Service
The distinguishing characteristic of a Use Case is the **framework-agnostic guarantee**:

| Aspect | Action | Use Case |
|--------|--------|----------|
| Input contract | Loose (array, DTO, Model) | Strict DTO only |
| Return contract | Loose (Model, array, void) | Typed result only |
| Framework imports | May import Eloquent, Facades | Zero framework imports in business logic |
| Dependency type | Concrete or interface | Interface (contract) |
| Testable without booting Laravel | Usually yes | Guaranteed yes |

### The DTO Boundary
The DTO is the defining feature of the Use Case pattern. It:
- Is a plain PHP object with typed public readonly properties
- Contains no business logic
- Is serializable (for queue dispatch)
- Is framework-agnostic (no `Illuminate` imports)
- Validates data shape at construction time

```php
final readonly class RegisterUserDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
}
```

---

## Mental Models

### Use Case as Hexagonal Core
In Hexagonal Architecture, the Use Case is the application core port. It sits inside the application boundary, receiving input from adapters (HTTP controller, CLI command, queue worker) and calling out to infrastructure through interfaces. The DTO is the data flowing through the port — it must not carry infrastructure concerns.

### Use Case as Contract Enforcement
An action says "give me data, I'll do the work." A Use Case says "give me data in this exact shape, I'll do the work, and I'll return data in this exact shape." The contract is explicit on both sides. Neither side knows about the other's infrastructure.

### The Boilerplate Tax
Every Use Case requires:
- 1 Use Case class
- 1 Input DTO class
- 1 Result DTO class (optional, can be shared)
- 1 Repository interface (if not already existing)
- Mapping code between DTO and models

For a simple CRUD operation (create user, update profile), this is 3-5 classes where a single service method would suffice. The tax is paid upfront and recouped when the same Use Case runs from multiple entry points or when the framework changes.

---

## Internal Mechanics

### Adapter-UseCase-Infrastructure Flow
```
HTTP Controller (adapter)
  │
  ├── Extracts data from Request
  ├── Maps to RegisterUserDTO
  ├── Calls UseCase->execute($dto)
  │
  ▼
RegisterUserUseCase (application core)
  │
  ├── Calls UserRepositoryInterface (contract)
  ├── Performs business logic
  ├── Returns UserDTO
  │
  ▼
UserRepository (infrastructure)
  └── Implements UserRepositoryInterface
      └── Uses Eloquent internally
```

The Use Case never touches `Request`, `Eloquent\Model`, `Facade`, or any `Illuminate` namespace. All framework interaction happens in the adapter (controller) and infrastructure (repository implementation).

### Zero Framework Import Rule
A Use Case class must not `use` any class from the `Illuminate` namespace, any facade, or any Laravel-specific helper function. The only exceptions are:
- PHP built-in classes (`stdClass`, `DateTime`, `Stringable`)
- Project-specific interfaces and DTOs
- Third-party domain libraries (not framework-specific)

If a Use Case imports `Request`, `Model`, or `DB`, it has ceased to be a Use Case and become a standard action.

### Repository Interface Location
Repository interfaces that Use Cases depend on live in the domain layer, not in the infrastructure layer:

```
app/Domain/Contracts/
├── UserRepositoryInterface.php
├── PaymentGatewayInterface.php
└── NotificationServiceInterface.php

app/Infrastructure/Repositories/
├── EloquentUserRepository.php
├── StripePaymentGateway.php
└── MailNotificationService.php
```

The Use Case depends on the contract (in Domain). The Laravel-specific implementation (in Infrastructure) is bound via the service provider.

---

## Patterns

### Full Hexagonal Use Case
The strictest form — Use Case depends on repository interface, uses DTO input/output, contains zero framework references:

```php
final class ProcessSubscriptionUseCase
{
    public function __construct(
        private SubscriptionRepositoryInterface $subscriptions,
        private PaymentGatewayInterface $payments,
        private InvoiceGeneratorInterface $invoices,
    ) {}

    public function execute(ProcessSubscriptionDTO $dto): InvoiceDTO
    {
        $subscription = $this->subscriptions->findByCustomer($dto->customerId);
        $charge = $this->payments->charge($subscription->amount, $dto->paymentToken);
        $invoice = $this->invoices->generate($subscription, $charge);
        return new InvoiceDTO(
            id: $invoice->getId(),
            amount: $invoice->getAmount(),
            dueDate: $invoice->getDueDate(),
        );
    }
}
```

- **Purpose**: Maximum framework decoupling — the Use Case can be tested without booting Laravel.
- **Benefits**: Full portability; can run in any PHP framework; strict architectural boundaries enforced by contracts.
- **Tradeoffs**: High boilerplate; mapping between DTOs and Eloquent models must happen in the infrastructure layer.

### Pragmatic Laravel Use Case
A relaxed variant that uses Eloquent models in the return value but keeps input as DTO:

```php
final class RegisterUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
        private PasswordHasherInterface $hasher,
    ) {}

    public function execute(RegisterUserDTO $dto): User
    {
        return $this->users->create(
            $dto->name,
            $dto->email,
            $this->hasher->hash($dto->password),
        );
    }
}
```

- **Purpose**: Keep the DTO input boundary (the most valuable part) while avoiding the result DTO boilerplate for simple operations.
- **Benefits**: Reduces class count by omitting result DTO; the framework coupling is contained in the return type.
- **Tradeoffs**: The caller receives an Eloquent model — if the caller is a CLI command that needs JSON output, the model's `toArray()` method may include unwanted fields.

### Use Case With Event Emission
Use Cases that need to emit domain events use an event dispatcher interface:

```php
final class RegisterUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
        private EventDispatcherInterface $events,
    ) {}

    public function execute(RegisterUserDTO $dto): UserDTO
    {
        $user = $this->users->create(...);
        $this->events->dispatch(new UserRegistered($user->getId()));
        return new UserDTO(...);
    }
}
```

- **Purpose**: Decouple event dispatch from the event system (Laravel events vs Symfony events vs custom dispatcher).
- **Benefits**: The Use Case does not import `Illuminate\Contracts\Events\Dispatcher`.
- **Tradeoffs**: The event system must implement `EventDispatcherInterface` — an additional abstraction layer.

---

## Architectural Decisions

### When to Use Use Cases vs Actions
Use Cases are justified when:
- The same business logic must run from HTTP, queue, and CLI identically
- Framework portability is a concern (migrating from Laravel to Symfony)
- The domain is complex enough to justify the contract overhead
- Team size is 10+ developers where strict boundaries improve coordination
- The project uses Hexagonal or Clean Architecture explicitly

Use Cases are NOT justified when:
- The operation runs from a single entry point only (HTTP-only)
- The team is small and values speed over strict boundaries
- The operation is simple CRUD with no business logic
- The project has no plans for framework migration

### DTO vs Array Decision
The decision to use a DTO vs a plain array is a tradeoff between explicitness and ceremony:

- Choose DTO when: input shape is complex, validation is required, the DTO is reused across multiple entry points, or type safety is critical.
- Choose array when: input shape is simple (2-3 fields), the operation is called from one entry point, or team velocity is prioritized over type safety.

### Interface Dependency Decision
Strict Hexagonal requires interfaces for all Use Case dependencies. Pragmatic Laravel allows concrete class dependencies (Eloquent model, facades) inside the Use Case. The choice determines whether the Use Case is framework-portable.

The practical threshold: if the project has a `Domain/Contracts` directory already, interfaces for Use Case dependencies are consistent with the architecture. If the project does not use interfaces for services, adding them only for Use Cases creates an inconsistency.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Framework-agnostic execution — same Use Case from any entry point | Boilerplate — DTO classes, repository interfaces, mapping code | Justified only when multi-entry-point execution is actually needed |
| Strict type safety — input and output contracts are explicit | File proliferation — each Use Case creates 2-3 additional files | Manage with consistent directory structure and naming conventions |
| Testable without booting Laravel — pure unit tests | Interface indirection — debugger must step through interface to implementation | Acceptable tradeoff for teams prioritizing test speed |
| Architectural boundaries enforced by contracts | False sense of framework independence — most projects never switch frameworks | Evaluate whether the portability benefit is real or theoretical |

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Domain logic isolation — Eloquent cannot leak into business rules | Result DTO mapping — model-to-DTO conversion is additional code | Use auto-mapping libraries (Spatie Data) or accept the boilerplate |
| Hexagonal Architecture alignment — industry-standard terminology | Laravel community unfamiliarity — Use Case is not a standard Laravel term | Document the pattern explicitly in the project's architecture docs |

---

## Performance Considerations

### DTO Instantiation Cost
Each DTO instantiation is a plain PHP object allocation — typically 0.001-0.005ms. For a single Use Case call per request, this is negligible. For batch processing (1000+ Use Case calls), DTO allocations add up.

### Interface Dispatch Overhead
Calling a method on an interface has the same performance as calling it on a concrete class in PHP (after OpCache). There is zero overhead for interface indirection at runtime. The cost is entirely at development time (navigation, IDE support).

### Result DTO vs Eloquent Model Return
A Use Case that returns a DTO constructs a new object from the model's data. An action that returns the model directly skips this step. The difference is approximately 0.01ms per return. The performance impact is negligible — the architectural benefit of the typed contract is the deciding factor.

---

## Production Considerations

### Service Provider Binding
Use Case dependencies on interfaces require service provider binding:

```php
// AppServiceProvider or DomainServiceProvider
public function register(): void
{
    $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
}
```

Without this binding, the container cannot resolve the Use Case. This is a common setup failure — the Use Case crashes at runtime with a `BindingResolutionException`.

### Mapping Layer Maintenance
The mapping between DTOs and Eloquent models (in the infrastructure layer) must be maintained as the schema evolves. When a new column is added to the `users` table, the DTO, the repository implementation, and the mapping code may all need updates. This is more maintenance surface than a direct Eloquent usage.

### Team Onboarding Cost
Developers joining a Laravel project that uses Use Cases must learn:
- The DTO pattern
- The repository interface pattern
- The service provider binding pattern
- The adapter-core-infrastructure separation

This is a steeper learning curve than a standard Laravel actions setup. Invest in documentation and examples.

---

## Common Mistakes

### Use Case Imports Framework Classes
A Use Case that imports `Illuminate\Http\Request`, `Facades\DB`, or `Eloquent\Model` has broken the framework-agnostic contract. The import must be removed and the dependency moved to the infrastructure layer.

### DTO With Business Logic
Adding validation, authorization, or computation to a DTO violates its purpose. A DTO is a data carrier. Business logic belongs in the Use Case or in dedicated domain objects.

### Every Operation Is a Use Case
When every CRUD operation gets a Use Case, the boilerplate-to-logic ratio becomes absurd. `UpdateUserNameUseCase` with a `UpdateUserNameDTO`, `UserRepositoryInterface`, and `UserDTO` is overengineering for a single field update. Use actions or services for simple operations; reserve Use Cases for complex domain operations.

### Repository Interface Over-Parameterization
Repository interfaces designed for Use Cases often have too many methods because every Use Case adds its own query:

```php
interface UserRepositoryInterface {
    public function findById(int $id): User;
    public function findByEmail(string $email): User;
    public function findActiveByRole(string $role): Collection;
    // 15 more methods...
}
```

The interface grows to support every Use Case query. Consider using query objects or specification pattern for complex queries instead of bloating the repository interface.

---

## Failure Modes

### DTO-Model Mapping Errors
A mapping from DTO to Eloquent model that omits a required field creates a database-level error at runtime. Unlike a direct `User::create($request->all())` call (which includes everything from the request), the DTO mapping is explicit — it reveals every field mapping. Missing fields cause `QueryException` or silent NULL inserts.

### Circular Dependency in Service Providers
If Use Case A depends on Use Case B (through repository interfaces), and both bindings are in the same service provider, and the bindings have circular dependencies, the container throws a `CircularDependencyException`. Use Case dependency graphs must be acyclic.

### Interface-Implementation Mismatch
When the repository interface is updated but the implementation is not, the Use Case calls a method that exists in the contract but throws `BadMethodCallException` at runtime. CI should catch this — but if CI does not run interface conformance checks, the error surfaces in production.

---

## Ecosystem Usage

### Laravel Jetstream
Jetstream does NOT use the Use Case variant. Jetstream actions receive Eloquent models and arrays directly. This is consistent with the framework authors' preference for pragmatic Laravel over strict Hexagonal architecture.

### Laravel Cashier
Cashier's `Billable` trait methods operate on Eloquent models directly, not through Use Cases. Cashier is a package, not an application — the Use Case pattern is an application-level architectural choice.

### Spatie Packages
Spatie packages use actions (not Use Cases) internally. Their public interfaces accept arrays, models, or typed parameters — not DTOs. Spatie's Laravel-Data package enables DTOs but does not enforce the Use Case pattern.

### QadrLabs Community Examples
The QadrLabs blog (2026) provides production-oriented examples of the Use Case pattern with Laravel, using domain subdirectories, repository interfaces, and DTOs. These examples represent the current state of the art for the Use Case variant at the expert level.

---

## Related Knowledge Units

### Prerequisites
- Action Class Design — the Use Case is a specialized variant of the Action; understanding the base pattern is prerequisite
- Dependency Injection — constructor injection for interface dependencies
- Service Container Basics — binding interfaces to implementations

### Related Topics
- Action vs Service vs Use Case — the three-way decision framework
- Domain vs Application Services — how domain services align with the Use Case's framework-agnostic requirement
- Action Naming Conventions — Use Case naming follows similar conventions (`RegisterUserUseCase`)

### Advanced Follow-up Topics
- Hexagonal Architecture with Laravel — the full architectural pattern that Use Cases belong to
- CQRS — how Use Cases map to commands and queries in a CQRS system
- Domain-Driven Design — how Use Cases interact with domain entities and value objects

---

## Research Notes

- The Use Case variant is the least-used pattern in the Laravel ecosystem. Most production Laravel applications use either services or actions, not explicit Use Cases with DTOs. The pattern is more common in Symfony and enterprise PHP codebases.
- The Laravel community's resistance to the Use Case pattern stems from the boilerplate overhead. The framework's design philosophy (convention over configuration) is at odds with the strict contract enforcement that Use Cases require.
- The "Pragmatic Use Case" variant (DTO input, Eloquent model output) is a compromise that captures the most valuable part of the pattern (input contract) while avoiding the least valuable part (result DTO mapping). This is the most practical entry point for teams adopting the pattern.
- Spatie's `laravel-data` package significantly reduces DTO boilerplate by providing data transfer objects with validation, transformation, and serialization built in. Teams adopting the Use Case pattern should evaluate this package.
- The Zero Framework Import Rule is aspirational — in practice, many "Use Cases" in production Laravel applications import `Log`, `Cache`, or `Event` facades for convenience. Strict enforcement increases class count (each facade becomes an interface) and is only justified when framework portability is a real requirement.