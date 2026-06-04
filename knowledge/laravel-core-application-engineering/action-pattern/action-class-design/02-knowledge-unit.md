# Action Class Design

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Actions Pattern
- **Knowledge Unit:** Action Class Design
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Action classes are single-method PHP classes that encapsulate exactly one business operation. They implement the Command pattern (GoF) within the Laravel ecosystem but are not a framework primitive — there is no base `Action` class, no `Action` interface, and no `Action` service provider in the framework itself. Actions are an emergent architectural pattern built on Laravel's container resolution (`Container::make()`), constructor dependency injection, and the convention of a single public method per class.

The engineering significance of action class design is that it determines the boundary between framework-aware and framework-agnostic code, the testability profile of each operation, and the composition flexibility across entry points (HTTP, queue, CLI). Unlike jobs, actions benefit from full constructor injection through the container, which enables clean composition hierarchies and eliminates the serialization constraints that jobs impose.

---

## Core Concepts

### Action as Command + Handler Combined
An action class combines the Command pattern's command object and its handler into a single class. The action receives its dependencies via constructor injection (as a handler would) and accepts the operation's parameters in the public method call (as a command would). This merging eliminates the ceremony of separate command and handler classes that strict CQRS implementations require.

```php
final readonly class CreateOrderAction
{
    public function __construct(
        private OrderRepository $orders,
        private InventoryService $inventory,
    ) {}

    public function handle(CreateOrderData $data): Order
    {
        // dependencies from constructor, input from method
    }
}
```

The constructor parameter is for **infrastructure dependencies** (repositories, services, loggers). The method parameter is for **operational input** (the data for this specific operation).

### No Framework Base Class
The framework provides no `Action` base class, no `Action` contract, and no `Action` service provider. An action is a plain class that the container resolves. This means:

- Any class with a single public method and constructor DI is already an action — no special registration needed.
- No framework code needs to change for actions to work.
- Actions are not tied to any specific Laravel version.
- There is no blessed "action interface" to implement.

### Single Public Method Contract
The convention of a single public method per class is the defining characteristic. If an action class accumulates a second public method, it has ceased to be an action and become a service. The single-method constraint forces:

- One responsibility per class
- One test class per operation
- One file per operation
- No shared state across operations

### Parameter Strategies
Actions accept operational input through one of three strategies, each with distinct tradeoffs:

1. **Loose array**: `handle(array $data): Model` — simplest, no type safety, no autocomplete, implicit contracts. Suited for simple CRUD actions that immediately pass data to Eloquent `::create()`.

2. **Typed DTO**: `handle(CreateOrderData $data): Order` — typed, validated, framework-agnostic. Suited for actions where the input contract must be explicit and reusable across entry points.

3. **Individual parameters**: `handle(string $name, string $email, string $password): User` — most explicit signature, but creates cascading signature changes when requirements shift. Suited for actions with 2-3 stable parameters.

---

## Mental Models

### Action as a Service Method That Got Its Own File
The simplest mental model: an action is what you get when you extract one method from a service into its own class. The action constructor replaces the service constructor. The action method parameters match the original service method parameters. The action's `__construct` + `handle()` mirrors the service's constructor + one public method.

### Action as a Controller Delegation Point
When a controller receives a `Request`, it extracts the data and passes it to an action. The action performs the operation and returns a result. The controller handles HTTP concerns (status codes, redirects) based on the result. This separation keeps HTTP logic out of the action and domain logic out of the controller.

### Action as a One-Use Tool
Actions are like single-use kitchen tools — excellent for their specific job, wasteful when multiplied unnecessarily. A `CreateUserAction` is a garlic press: perfect for creating users, useless for anything else. The cost of having one is low; the cost of having 100 is cabinet clutter.

---

## Internal Mechanics

### Container Resolution Flow
When `app(CreateOrderAction::class)` or `CreateOrderAction::dispatch()` is called, the container:

1. Reads the constructor signature via reflection (`ReflectionMethod` on `__construct`)
2. Resolves each type-hinted parameter from the container (recursively resolving dependencies of each dependency)
3. Returns a fully initialized action instance
4. The caller invokes the public method with operational input

The resolution happens at call time, not at class load time. This means actions are zero-cost if not called — the container never inspects unused action classes.

### Constructor Injection vs Method Injection
Constructor injection on actions works because the container resolves all dependencies before the action is invoked. Unlike jobs (where constructor parameters are serialized data), action constructor parameters are **service identifiers** — type-hinted interfaces or concrete classes that the container knows how to resolve.

```php
// Action: constructor = dependencies (container resolved)
class CreateUserAction {
    public function __construct(
        private UserRepository $users,  // resolved by container
        private PasswordHasher $hasher,  // resolved by container
    ) {}

    public function handle(string $name, string $email): User {
        // parameters = operational input
    }
}

// Job: constructor = operational data (serialized)
class SendWelcomeEmail implements ShouldQueue {
    public function __construct(
        private User $user,          // serialized to queue
        private array $data,         // serialized to queue
    ) {}
}
```

This distinction is the most important design difference between actions and framework jobs.

### Service Container as Action Registry
Since actions are plain classes resolved by the container, the service container serves as an implicit action registry. Any class in the application can be an action. There is no action scan, no action discovery, and no action configuration. The container acts as a resolver on demand — `app(MyAction::class)->handle($data)` is both the registration and the invocation.

---

## Patterns

### Final Readonly Action Pattern
PHP 8.2+ supports `readonly` classes, making all properties implicitly readonly. This pattern enforces immutability — once an action's dependencies are injected, they cannot be replaced.

```php
final readonly class ProcessRefundAction
{
    public function __construct(
        private PaymentGateway $gateway,
        private RefundRepository $refunds,
    ) {}
}
```

- **Purpose**: Enforce that dependencies are never reassigned, preventing state mutation in action classes.
- **Benefits**: Compiler-enforced immutability, reduced cognitive load (no mutation tracking).
- **Tradeoffs**: Prevents property hooks that modify internal state; incompatible with PHP < 8.2.

### Invokable Action Pattern
Using `__invoke()` as the single public method allows the action to be called as a function and doubles as a single-action controller:

```php
class GenerateInvoiceAction
{
    public function __construct(private InvoiceService $invoices) {}

    public function __invoke(Order $order): Invoice
    {
        return $this->invoices->generate($order);
    }
}
```

- **Purpose**: Register the action directly as a route without a controller wrapper.
- **Benefits**: Zero-ceremony HTTP entry point; callable syntax (`$action($data)`).
- **Tradeoffs**: Couples the action to Laravel's `__invoke` convention; cannot easily distinguish between "action invoked as route" and "action invoked as operation."

### Action as Command Bus Handler Pattern
Some implementations separate the command (data) from the handler (logic), using a command bus:

```php
// Command
class CreateOrderCommand
{
    public function __construct(
        public readonly array $items,
        public readonly int $userId,
    ) {}
}

// Action (handler)
class CreateOrderHandler
{
    public function __construct(private OrderRepository $orders) {}
    public function handle(CreateOrderCommand $command): Order { ... }
}
```

- **Purpose**: Enforce strict separation between "what to do" and "how to do it" — the command is serializable and can be queued independently.
- **Benefits**: Clear audit trail of every command issued; commands can be logged, queued, or replayed.
- **Tradeoffs**: Ceremony — two classes per operation; unnecessary for most Laravel applications where actions serve as both command and handler.

---

## Architectural Decisions

### Why No Base Action Class
The framework intentionally provides no `Action` base class. This decision means actions are not coupled to any framework contract, can be used in any PHP project that uses the container, and do not require upgrades when the framework changes. The community packages that provide base action classes (Lorisleiva's `laravel-actions`, Spatie's `QueueableAction`) are optional layers on top of this foundation.

### `handle()` vs `execute()` vs `__invoke()`
The method name choice is purely a convention — the framework does not enforce any name. The community has three competing conventions:

- `handle()`: Most common; consistent with Laravel's job handler convention (`Illuminate\Contracts\Queue\Job::handle()`). Implicitly signals "this is the operation entry point."
- `execute()`: Second most common; used by Spatie's QueueableAction package as the default for `queueMethod()`. More explicit about command-like behavior.
- `__invoke()`: Least common; enables callable syntax and single-action controller registration.

The choice has one practical consequence: Spatie's `queueMethod()` auto-detects `__invoke()` first, then falls back to `execute()`. If a team uses `handle()`, they must override `queueMethod()` in the trait.

### `final` Decision for Actions
Marking action classes `final` prevents extension, which prevents mocking via inheritance and forces trait-based reuse. Some teams enforce `final` on all actions as a design principle (composition over inheritance). Other teams leave actions open for DI mocking in tests. There is no community consensus.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single responsibility — one operation per class | File proliferation — one file per operation | Use domain subdirectories to organize |
| Full constructor injection — clean DI | No serialization for queuing without wrapper | Use Spatie QueueableAction or manual job wrapping |
| No framework base class — zero coupling | No standardized interface — actions are not interchangeable | Not a problem in practice (actions are called by name, not polymorphically) |
| Container-resolved — implicit registration | No explicit action registry — cannot enumerate actions | Runtime scanning needed for documentation or admin panels |
| Immutable dependencies with `readonly class` | PHP 8.2+ requirement | Acceptable for new projects on PHP 8.2+ |

---

## Performance Considerations

### Resolution Cost
Each action resolution requires the container to reflect on the constructor and recursively resolve dependencies. For typical actions with 2-4 constructor parameters, this adds approximately 0.01-0.05ms per resolution. Cached container (`php artisan optimize`) eliminates reflection overhead for pre-resolved services, but actions are typically not pre-resolved.

### Memory Per Action
An action instance consumes approximately 1-2KB of memory for the object plus its resolved dependencies. In a request that calls 5 actions, this adds ~5-10KB. Negligible for most applications.

### Autoloading
Action class files are autoloaded via Composer's PSR-4 loader. After OpCache warmup, autoloading has zero per-request cost. The number of action classes in the codebase (potentially hundreds) has no measurable performance impact on warmed-up production systems.

---

## Production Considerations

### Action Consistency
The team must agree on one convention for method naming, parameter style, and return types. Mixed conventions across the codebase create cognitive overhead — a developer should not need to check each action to know whether it uses `handle()`, `execute()`, or `__invoke()`.

### Constructor Dependency Count
Actions with more than 5-8 constructor dependencies are a smell. The action likely violates single responsibility — it is either orchestrating instead of executing or is coupled to too many subsystems. Extract orchestration to a service.

### Actions in Long-Lived Processes
In Octane or RoadRunner, action instances are cached in the container's singleton or scoped bindings. An action that captures request-scoped state (putting data on `$this`) will leak that state to the next request. Actions must be stateless — dependencies only, no mutable properties set during `handle()`.

### Namespace Convention
The community standard is `App\Actions\{Domain}\{ActionName}`. Keeping actions in a dedicated namespace avoids confusion with jobs (`App\Jobs\`), listeners (`App\Listeners\`), and services (`App\Services\`).

---

## Common Mistakes

### Actions with Mutable State
Setting properties on `$this` during `handle()` creates a stateful action. If the action is resolved once and reused (Octane), the state leaks. If the action is resolved fresh per call, the state is lost. Either way, it is the wrong pattern — use the return value or pass-through parameters.

```php
// WRONG: stateful action
class ImportUsersAction {
    private int $imported = 0;
    public function handle(array $rows): void {
        foreach ($rows as $row) {
            User::create($row);
            $this->imported++;
        }
    }
    public function getImportedCount(): int { return $this->imported; }
}

// RIGHT: return result
class ImportUsersAction {
    public function handle(array $rows): ImportResult {
        $count = 0;
        foreach ($rows as $row) {
            User::create($row);
            $count++;
        }
        return new ImportResult($count);
    }
}
```

### Actions with Multiple Public Methods
Adding a second public method to an action class converts it into a service. The file name says "action" but the implementation is a "mini-service." This violates team expectations and defeats the single-responsibility purpose of the action pattern. Extract the second operation to a new action class.

### Actions That Accept HTTP Request Objects
Passing `Illuminate\Http\Request` to an action's method couples the business logic to the HTTP layer. The action cannot be called from a queue worker, CLI command, or another action without constructing a fake Request. Use a DTO or array instead.

### Actions With Too Many Constructor Parameters
More than 5-8 constructor dependencies indicates the action is doing too much. The dependencies themselves reveal the scope — if an action injects a logger, mailer, payment gateway, repository, event dispatcher, cache, and HTTP client, it is orchestrating a workflow, not executing a single operation.

### Actions That Return Mixed Types
Returning `mixed`, `array`, or `void` from an action's method defeats the caller's ability to reason about the result. Every action should return a typed result (Model, DTO, bool, void) that communicates success and carries the output.

---

## Failure Modes

### Action Instance Leakage in Octane
If an action is bound as a singleton (intentionally or accidentally) in the container and the action captures per-request data as instance properties, the data from request N will be visible to request N+1. This is a silent data corruption bug — no error is raised, but the wrong user's data is processed.

### Missing Method Reflection at Queue Worker
If Spatie's `queueMethod()` cannot detect the action's method name (because the team uses a non-standard name like `process()` without overriding the trait), the action job will fail at runtime with a reflection exception. The error occurs on the worker, not the dispatcher.

### Serialization Errors in Nested Actions
When an action that uses `SerializesModels` in its properties is passed to another action that also serializes models, the database state may differ between when the outer action runs (request time) and when the inner action runs (queue time). The serialized model IDs are correct, but the model data is stale.

---

## Ecosystem Usage

### Lorisleiva Laravel Actions
This package provides a base action class that can act as an object, controller, job, listener, or command. The action class extends the package's base and declares which capabilities it supports via static properties. The package uses trait-based capability composition internally but exposes them through a unified API.

### Spatie Queueable Action
This package provides a `QueueableAction` trait that adds `onQueue()`, `tags()`, `middleware()`, and `backoff()` methods to any action class. The trait does not require the action to extend any base class — it is purely additive.

### Laravel Jetstream
Jetstream uses action classes without any package — plain PHP classes in `App\Actions\Jetstream`. Each action has a descriptive method name (`create()`, `update()`, `delete()`) and receives typed parameters. Jetstream represents the "vanilla Laravel" approach to actions: no traits, no base classes, no package dependencies.

---

## Related Knowledge Units

### Prerequisites
- Service Container Basics — how `Container::make()` resolves constructor dependencies
- Controller Dependency Injection — how controllers delegate to actions, establishing the pattern

### Related Topics
- Action Naming Conventions — how to name action classes and their methods consistently
- Action Composition — how actions call other actions and how services orchestrate them
- Transactional Actions — when and how actions interact with database transactions

### Advanced Follow-up Topics
- Queued Actions — making actions queueable via Spatie's package or manual job wrapping
- Use Case Variant — framework-agnostic actions with DTO boundaries
- Action vs Service vs Use Case — the three-way decision framework for organizing business logic

---

## Research Notes

- The framework has no Action base class — this is an intentional design choice to avoid coupling. Community packages that provide base classes (Lorisleiva) are optional and predated by the convention.
- `final readonly class` is gaining adoption for PHP 8.2+ projects. The `readonly` keyword on a class makes all properties implicitly `readonly`. This is equivalent to writing `private readonly Type $prop` on every property.
- The method name controversy (`handle` vs `execute` vs `__invoke`) shows no signs of convergence. Jetstream uses domain-specific names (`create()`, `update()`), which is a distinct fourth convention.
- Spatie's `QueueableAction` auto-detects methods by checking `__invoke` first, then `execute`. Teams using `handle()` must override the protected `queueMethod()` method. This is a common gotcha.
- Parameter strategies (array vs DTO vs individual params) correlate with team size and domain complexity. DTOs appear consistently in 10+ developer teams and complex domains. Arrays dominate in small teams and simple CRUD.