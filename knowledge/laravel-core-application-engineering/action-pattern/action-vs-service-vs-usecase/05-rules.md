# Phase 5: Action vs Service vs Use Case Rules

---

## Rule: Apply the Three-Tier Decision Framework to Each Operation Individually

---

## Category

Architecture

---

## Rule

For every business operation, apply the three-tier decision framework in order: (1) Cohesion — does this operation belong to a group of related operations on the same entity? → Service. (2) Granularity — is this a single, distinct operation that may be reused or composed? → Action. (3) Portability — does this operation need to run identically across entry points with framework-agnostic contracts? → Use Case. Select the most specific pattern that fits.

---

## Reason

Without a decision framework, pattern choice becomes subjective — based on developer preference, team habit, or "what we've always done." The three-tier framework provides objective criteria that produce consistent, justifiable decisions. Each question filters out patterns that would be over- or under-engineered for the operation's characteristics.

---

## Bad Example

```php
// No framework — pattern chosen by convention, not by analysis:
class UserService
{
    // 30 methods, mixed concerns — because "we use services"
    public function create(array $data): User { /* ... */ }
    public function update(int $id, array $data): User { /* ... */ }
    public function sendWelcomeEmail(User $user): void { /* ... */ }
    public function calculateLifetimeValue(User $user): float { /* ... */ }
    public function exportCsv(array $filters): string { /* ... */ }
    // ...
}
```

---

## Good Example

```php
// Three-tier framework applied:
// createUser → distinct operation, reusable → Action
class CreateUserAction { /* ... */ }

// UserService → group of related operations on User entity → Service
class UserService
{
    public function __construct(
        private CreateUserAction $createUser,
        private UpdateUserAction $updateUser,
    ) {}
    public function register(RegisterUserData $data): User { /* orchestrates */ }
}

// RegisterUser → must run from HTTP, CLI, and queue identically → Use Case
class RegisterUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
        private PasswordHasherInterface $hasher,
    ) {}
    public function execute(RegisterUserDTO $dto): UserDTO { /* framework-agnostic */ }
}
```

---

## Exceptions

Small projects (1-3 developers, < 20 operations) may simplify the framework to a two-pattern choice (Service or Action) and skip Use Cases entirely until multi-entry-point reuse materializes.

---

## Consequences Of Violation

Architecture risks: patterns are misapplied, leading to over-engineering (Use Case for simple CRUD) or under-engineering (Service for everything). Maintenance risks: inconsistent pattern choices make the codebase unpredictable — developers never know what pattern to expect for a given operation.

---

---

## Rule: Use Service-Action Complement as the Default Production Pattern

---

## Category

Architecture

---

## Rule

The default architecture for organizing business logic must be the Service-Action complement: Services for entity grouping, navigation, and orchestration; Actions for individual operation execution. Use Cases are an opt-in specialization, not the default.

---

## Reason

The Service-Action complement is the dominant production pattern in the Laravel ecosystem as of 2024-2026. It balances file economy (services group related actions) with isolation (each action is independently testable). Services provide high-level navigation (a developer looking for "user operations" opens `UserService`), while actions provide fine-grained testability and reuse.

---

## Bad Example

```php
// All logic crammed into a single service — no decomposition:
class OrderService
{
    public function __construct(
        private OrderRepository $orders,
        private InventoryRepository $inventory,
        private PaymentGateway $payment,
        private EmailService $email,
        private ShippingService $shipping,
        private TaxService $tax,
        private LoggerInterface $logger,
        private Cache $cache,
        private AnalyticsService $analytics,
    ) {}
    // 20 methods, 9 dependencies — unmaintainable
}
```

---

## Good Example

```php
// Service orchestrates, actions execute:
class OrderService
{
    public function __construct(
        private CreateOrderAction $createOrder,
        private CancelOrderAction $cancelOrder,
        private ProcessRefundAction $processRefund,
        private SendOrderConfirmationAction $sendConfirmation,
    ) {}

    public function placeOrder(OrderData $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrder->execute($data);
            DB::afterCommit(fn () => $this->sendConfirmation->execute($order));
            return $order;
        });
    }

    public function cancelOrder(int $id): void
    {
        $this->cancelOrder->execute($id);
    }

    public function refundOrder(int $id): void
    {
        $this->processRefund->execute($id);
    }
}
```

---

## Exceptions

Read-only query-heavy domains (reports, dashboards, analytics) may use a Service-only pattern because query operations are often naturally grouped and do not need per-operation isolation. If query operations later need individual testability or reuse, extract them to actions.

---

## Consequences Of Violation

Maintenance risks: services grow to 30+ methods with 10+ dependencies, making them impossible to test or modify safely. Testing risks: each test must instantiate the entire service to test one method. Scalability risks: merge conflicts increase as multiple developers modify the same service file.

---

---

## Rule: Start with Services, Evolve to Actions, Introduce Use Cases as Needed

---

## Category

Architecture

---

## Rule

Business logic must follow an additive evolution path: start with Service methods, extract to Actions when isolation or reuse is needed, introduce Use Cases only when multi-entry-point portability is required. Migration is forward-only — Service → Action → Use Case.

---

## Reason

Starting with Services provides file economy and rapid development. Extracting to Actions is additive — the service method becomes an orchestrator that calls the new action, so no callers break. Introducing Use Cases is additive — the Use Case wraps the action with DTO contracts. Since all migrations are additive, the team never needs to revert a pattern decision, and the cost of deferring a decision is zero.

---

## Bad Example

```php
// Jumping directly to Use Case for every operation, paying DTO overhead upfront:
class CreateUserDTO { /* ... */ }
class UserRepositoryInterface { /* ... */ }
class CreateUserUseCase { /* ... */ }  // Only called from one HTTP endpoint
class UpdateUserDTO { /* ... */ }
class UpdateUserUseCase { /* ... */ }   // Only called from one HTTP endpoint
// 6 extra files for two single-entry-point operations
```

---

## Good Example

```php
// Start simple, evolve:
// Phase 1: Service method
class UserService {
    public function create(array $data): User { /* ... */ }
}

// Phase 2: Extract to Action when second caller emerges
class CreateUserAction { /* extracted */ }
class UserService {
    public function create(array $data): User {
        return $this->createUser->execute($data);
    }
}

// Phase 3: Upgrade to Use Case if multi-entry-point portability is required
class CreateUserUseCase { /* DTO + interface + framework-agnostic */ }
// Only when value justifies the overhead
```

---

## Exceptions

Greenfield projects that already know they have multi-entry-point requirements (e.g., an API consumed by HTTP, queue workers, and CLI tools from day one) may start with Use Cases for the specific operations that need it. Other operations should still follow the Service-first evolution path.

---

## Consequences Of Violation

Performance risks: over-engineering (premature Use Cases) adds boilerplate without benefit. Maintenance risks: reductive migrations (Use Case → Action → Service) require changing all callers. Scalability risks: developers resist extracting actions because "the pattern was already decided" and every extraction feels like admitting a mistake.

---

---

## Rule: Use the DTO Boundary as the Distinguishing Signal Between Action and Use Case

---

## Category

Architecture

---

## Rule

The presence or absence of a required typed DTO input boundary is the single architectural signal that distinguishes an Action from a Use Case. No DTO = Service or Action. Optional DTO = Action. Required typed DTO with interface dependencies = Use Case.

---

## Reason

The DTO boundary is the most objective differentiator between the three patterns. Services accept arrays or models (loose contract). Actions may accept DTOs optionally (or arrays for simple operations). Use Cases always require DTOs (strict contract). This creates a clear, reviewable rule: if the class accepts `array $data`, it is not a Use Case regardless of its name suffix.

---

## Bad Example

```php
// Named "UseCase" but accepts an array — it is actually an Action:
class RegisterUserUseCase
{
    public function execute(array $data): User
    {
        // Array input = Action contract, not Use Case contract
        return User::create($data);
    }
}
```

---

## Good Example

```php
// Action — optional DTO, may accept array:
class RegisterUserAction
{
    public function execute(RegisterUserData|array $data): User { /* ... */ }
}

// Use Case — required DTO with interface dependencies:
class RegisterUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
        private PasswordHasherInterface $hasher,
    ) {}
    public function execute(RegisterUserDTO $dto): UserDTO
    {
        // Typed DTO required — this is a Use Case
    }
}
```

---

## Exceptions

A pragmatic Use Case (DTO input, Eloquent model output) is an acceptable middle ground that retains the input contract benefit without the full result DTO overhead. This is the recommended entry point for teams adopting the Use Case pattern.

---

## Consequences Of Violation

Architecture risks: classes named Use Case behave as actions, eroding the pattern's semantic value. Code Review risks: the naming prefix becomes meaningless — developers cannot trust that a `*UseCase` class enforces the Use Case contract. Maintenance risks: interface dependencies and DTO contracts are missing where they should exist.

---

---

## Rule: Keep Pattern Choices Consistent Within a Domain

---

## Category

Code Organization

---

## Rule

All operations within the same domain (bounded context) must use the same architectural pattern. Cross-domain pattern variation is permitted — a billing domain may use actions while a reporting domain uses services — but within a domain, all operations must be organized consistently.

---

## Reason

Inconsistent patterns within a single domain confuse developers working in that domain. If `BillingService` has 5 methods and 3 of those are also called as actions (`ChargeAction`, `RefundAction`) while 2 are inline service methods, the developer cannot predict where to find a given operation. Domain-level consistency provides clear navigation boundaries.

---

## Bad Example

```php
// Inconsistent within the Billing domain:
class BillingService
{
    // Method contains inline logic (no action extraction):
    public function voidTransaction(int $id): void { /* inline logic */ }
    // Method delegates to an action:
    public function processRefund(int $id): void
    {
        app(ProcessRefundAction::class)->execute($id);
    }
    // Another inline method:
    public function generateInvoice(Order $order): Invoice { /* inline logic */ }
}
// Actions directory has ProcessRefundAction but no VoidTransactionAction
```

---

## Good Example

```php
// Consistent within the Billing domain — one pattern per domain:
// Option A: Service-only (for simple billing logic)
class BillingService
{
    public function voidTransaction(int $id): void { /* inline */ }
    public function processRefund(int $id): void { /* inline */ }
    public function generateInvoice(Order $order): Invoice { /* inline */ }
}

// Option B: Action-only (for complex billing logic)
// All operations are actions, services only orchestrate
```

---

## Exceptions

Transition phases during refactoring (e.g., migrating a domain from services to actions) may temporarily have mixed patterns. The target state must be documented, and the migration must have a deadline.

---

## Consequences Of Violation

Code Organization risks: developers cannot navigate a domain without checking multiple pattern-specific directories. Maintenance risks: pattern inconsistencies reduce developer confidence — a new operation may be placed in the wrong pattern. Cognitive load: team norms about "how billing works" are unreliable.

---

---

## Rule: Do Not Enforce a Single Pattern Across the Entire Codebase

---

## Category

Architecture

---

## Rule

The codebase must not enforce a single architectural pattern (all services, all actions, or all use cases) for every business operation. Different operations have different characteristics — the pattern must match the operation, not the team's default preference.

---

## Reason

A one-pattern-fits-all approach ignores the tradeoffs each pattern makes. Actions sacrifice file economy for isolation. Services sacrifice isolation for navigation. Use Cases sacrifice simplicity for portability. Forcing one pattern on all operations either over-engineers simple operations (Use Case for CRUD) or under-engineers complex ones (Service for everything). Mature codebases use all three, each where it fits.

---

## Bad Example

```php
// "We only use services" — every operation is a method on a service:
class UserService
{
    public function create(array $data): User { /* ... */ }
    public function update(int $id, array $data): User { /* ... */ }
    public function sendWelcomeEmail(User $user): void { /* ... */ }
    // 15 more methods — growing without decomposition criteria
}

// "We only use actions" — even simple reads become action files:
class GetUserAction { /* 1 file for a simple DB call */ }
class ListUsersAction { /* 1 file for a paginated query */ }
class CountUsersAction { /* 1 file for a count query */ }
// File proliferation without architectural benefit
```

---

## Good Example

```php
// Three patterns, each used where it fits:

// Service — for entity grouping and orchestration:
class UserService
{
    public function __construct(
        private CreateUserAction $createUser,
        private ResetPasswordAction $resetPassword,
    ) {}
    public function register(array $data): User { /* orchestrates */ }
}

// Action — for isolated, reusable single operations:
class ResetPasswordAction { /* ... */ }

// Use Case — for multi-entry-point portability:
class ProcessRefundUseCase { /* DTO + interface + framework-agnostic */ }
```

---

## Exceptions

Very small projects (< 10 operations, 1 developer) may use a single pattern for simplicity without significant harm. The rule applies as soon as the team grows past 1 developer or the codebase passes 10 business operations.

---

## Consequences Of Violation

Architecture risks: over-engineering or under-engineering of operations based on dogma rather than analysis. Maintenance risks: simple operations have unnecessary boilerplate or complex operations lack isolation. Scalability risks: the codebase does not adapt as operation characteristics change.

---

---

## Rule: Use Interface Dependencies Exclusively in Use Cases

---

## Category

Architecture

---

## Rule

Use Case classes must depend on interfaces, not concrete classes, for all constructor dependencies. Services and Actions may use concrete classes. The presence of interface dependencies is a distinguishing characteristic of the Use Case pattern.

---

## Reason

Interface dependencies enable framework-agnostic testing — the Use Case can be instantiated with any implementation of its interfaces without booting Laravel. They also enable the framework-portability promise: the same Use Case class works with Laravel, Symfony, or a vanilla PHP worker as long as interface contracts are satisfied. Services and actions do not require this level of decoupling because they are framework-native.

---

## Bad Example

```php
// Named "UseCase" but depends on concrete classes:
class RegisterUserUseCase
{
    public function __construct(
        private EloquentUserRepository $users,  // Concrete Eloquent class
        private BcryptHasher $hasher,            // Concrete hasher
    ) {}
    // Cannot be tested without Laravel boot — resembles an Action
}
```

---

## Good Example

```php
// Proper Use Case with interface dependencies:
class RegisterUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
        private PasswordHasherInterface $hasher,
    ) {}
    // Can be tested with any implementation — framework-agnostic
}

// Service provider binding:
$this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
$this->app->bind(PasswordHasherInterface::class, BcryptHasher::class);
```

---

## Exceptions

Pragmatic Use Cases (DTO input, Eloquent model output) may use concrete repository classes as a stepping stone toward full interface decoupling. The team should migrate to interfaces when the second entry point materializes or when framework-agnostic testing becomes necessary.

---

## Consequences Of Violation

Architecture risks: Use Cases without interface dependencies cannot deliver the framework-portability promise. Testing risks: Use Cases require Laravel boot even for simple unit tests. Maintenance risks: switching storage implementations requires changing Use Case code instead of just rebinding interfaces.

---
