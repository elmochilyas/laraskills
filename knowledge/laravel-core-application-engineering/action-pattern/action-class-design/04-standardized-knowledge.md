# ECC Standardized Knowledge — Action Class Design

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Action Class Design |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — Business Logic Organization |
| **Last Updated** | 2026-06-02 |

---

## Overview

Action classes are single-method PHP classes that encapsulate exactly one business operation. They implement the Command pattern (GoF) within the Laravel ecosystem but are not a framework primitive — there is no base `Action` class, no `Action` interface, and no `Action` service provider in the framework itself. Actions are an emergent architectural pattern built on Laravel's container resolution (`Container::make()` → `build()` → reflection on `__construct`), constructor dependency injection, and the convention of a single public method per class.

The pattern exists because Laravel controllers, jobs, listeners, and CLI commands all share a common need: they must delegate business logic to a reusable unit that is not coupled to any single entry point. Without actions, developers either duplicate logic across entry points or bloat service classes with unrelated operations. Actions solve this by providing a dependency-injectable, testable, single-responsibility unit that any entry point can invoke.

Engineers should care because the action pattern determines:
- The **testability profile** of each business operation (one test class per action)
- The **reusability** of logic across HTTP, queue, CLI, and other actions
- The **composition flexibility** of business logic (actions calling actions)
- The **framework coupling boundary** (actions are plain PHP classes, not framework-coupled)

Unlike jobs, actions benefit from full constructor injection through the container, which enables clean composition hierarchies and eliminates the serialization constraints that jobs impose.

---

## Core Concepts

### Action as Command + Handler Combined

An action class combines the Command pattern's command object and its handler into a single class. The action receives its dependencies via constructor injection (as a handler would) and accepts the operation's parameters in the public method call (as a command would). This merging eliminates the ceremony of separate command and handler classes that strict CQRS implementations require.

The constructor parameter is for **infrastructure dependencies** (repositories, services, loggers). The method parameter is for **operational input** (the data for this specific operation). This distinction is the most important design rule in action classes.

### No Framework Base Class

The framework provides no `Action` base class, no `Action` contract, and no `Action` service provider. An action is a plain class that the container resolves. This means:
- Any class with a single public method and constructor DI is already an action — no special registration needed
- No framework code needs to change for actions to work
- Actions are not tied to any specific Laravel version
- There is no blessed "action interface" to implement

### Single Public Method Contract

The convention of a single public method per class is the defining characteristic. If an action class accumulates a second public method, it has ceased to be an action and become a service. The single-method constraint forces:
- One responsibility per class
- One test class per operation
- One file per operation
- No shared state across operations

### Container Resolution Mechanics

When `app(CreateOrderAction::class)` is called, the container:
1. Reads the constructor signature via `ReflectionClass::getConstructor()` → `getParameters()`
2. For each type-hinted parameter, calls `resolveClass()` which recursively calls `make()` on each dependency
3. Non-class parameters (string, int, array) hit `resolvePrimitive()` which checks contextual bindings, default values, nullability, then throws
4. Returns a fully initialized action instance via `new $concrete(...$instances)`

Resolution happens at call time, not at class load time. Actions are zero-cost if not called — the container never inspects unused action classes.

### Parameter Strategies

Actions accept operational input through one of three strategies, each with distinct tradeoffs:

| Strategy | Signature | Type Safety | Ceremony | Best For |
|---|---|---|---|---|
| Loose array | `handle(array $data)` | None | Minimal | Simple CRUD pass-through to Eloquent |
| Typed DTO | `handle(CreateOrderData $data)` | Full | Moderate | Complex operations, multi-entry-point reuse |
| Individual params | `handle(string $name, string $email)` | Partial | Varies | 2-3 stable parameters, unlikely to change |

### Method Naming Conventions

The framework does not enforce any method name. Three competing conventions exist:
- `handle()` — Most common; consistent with Laravel's job handler convention. Spatie's `QueueableAction` does NOT auto-detect this method.
- `execute()` — Second most common; used by Spatie's QueueableAction as the default. Auto-detectable.
- `__invoke()` — Least common; enables callable syntax and single-action controller registration.

Jetstream uses a fourth convention: domain-specific names like `create()`, `update()`, `delete()`.

---

## When To Use

### Appropriate Use Cases

- **Single operations reusable across entry points.** A `RegisterUserAction` that is called from a controller, a CLI command, an API endpoint, and a queued job. The action provides a single source of truth for the registration logic.

- **Operations with explicit input contracts.** When the input to an operation must be type-safe, validated, and documented. The action's method signature (especially with DTO parameters) serves as the contract.

- **Operations that compose other operations.** When one business operation needs to call another (e.g., `PlaceOrderAction` calling `ReserveInventoryAction` and `ChargePaymentAction`). Actions calling actions is clean composition.

- **Operations that need isolated testing.** Each action has exactly one test class, one responsibility, and one set of dependencies. This isolation makes tests faster and more focused.

- **Operations where framework coupling must be minimized.** Actions are plain classes. They do not extend framework base classes, implement framework interfaces, or depend on framework contracts. This makes them portable across framework versions and testable without framework bootstrapping.

### Architectural Scenarios

- **Controller → Action flow.** Thin controllers that extract data from the request and delegate to an action. The action performs the operation and returns a result. The controller handles HTTP concerns based on the result.

- **Action → Action composition.** An orchestrating action that delegates sub-operations to child actions. The parent action manages the transaction boundary and error handling.

- **Queued Operations via Actions.** Using Spatie's `QueueableAction` trait, an action can be dispatched to the queue without creating a separate job class. The action's dependencies are resolved fresh on the worker.

- **CLI commands calling actions.** Artisan commands that call actions directly, reusing the same business logic as the HTTP layer.

### Scaling Scenarios

- **10+ developer teams.** Actions enforce clear boundaries. A developer can modify `UpdateUserProfileAction` without affecting `DeleteUserAction`. Merge conflicts are minimized.
- **Multiple entry points growing.** As an application adds API versions, admin panels, CLI tools, and queue workers, actions prevent logic duplication.
- **Domain complexity increasing.** When a single operation involves multiple sub-operations, action composition provides structured decomposition.

---

## When NOT To Use

### Misuse Cases to Avoid

- **Simple CRUD pass-through.** A `CreateUserAction` that takes an array, calls `User::create()`, and returns the model adds indirection without value. If the controller already has the data and the model already handles creation, the action is ceremony.

- **Single-entry-point operations.** If an operation is only ever called from one controller method and will never be reused, the action adds a file and a class with no benefit. Keep the logic in the service or controller until a second caller emerges.

- **Operations that need polymorphic behavior.** Actions are called by name, not by interface. If you need interchangeable implementations of the same operation (e.g., `PaymentGatewayAction` that varies by region), a strategy pattern or interface-bound service is more appropriate.

### Overengineering Situations

- **Actions wrapping Eloquent CRUD.** `User::create()`, `User::update()`, `User::delete()` are already single-responsibility operations on the model. Wrapping each in a CRUD action class adds a file per operation with no architectural benefit.

- **Actions for every controller method.** Not every controller method represents a distinct business operation. A controller's `index()` method that returns a paginated list of users does not need a `ListUsersAction` — a service method or direct query suffices.

- **Actions with zero dependencies.** An action that takes no constructor parameters and performs a simple query is a function dressed as a class. Static methods or plain functions are more appropriate.

### Simpler Alternatives

- **Eloquent models directly** for simple CRUD
- **Service methods** for related operations on the same entity
- **Repository methods** for query-heavy data access
- **Job classes** for operations that must be queued by default
- **Functions** for stateless computations with no dependencies

---

## Best Practices

### Use `final readonly` for Dependency Immutability

PHP 8.2+ supports `readonly` classes, making all properties implicitly readonly. This pattern enforces that dependencies are never reassigned, preventing state mutation in action classes. The `readonly` keyword on a class is equivalent to writing `private readonly Type $prop` on every property.

**Why it works:** Compiler-enforced immutability eliminates an entire class of bugs where action methods accidentally overwrite constructor dependencies. It reduces cognitive load — developers know that `$this->gateway` is the same object throughout the action's lifetime.

### Accept DTOs, Not Request Objects

Passing `Illuminate\Http\Request` to an action's method couples the business logic to the HTTP layer. The action cannot be called from a queue worker, CLI command, or another action without constructing a fake Request.

**Why it works:** DTOs (or individual parameters) keep actions entry-point-agnostic. A DTO can be constructed from an HTTP request, a CLI argument array, or another action's output.

### Keep Actions Stateless

Actions must not capture per-operation state on `$this`. In Octane or RoadRunner, action instances are cached — state set during one request leaks to the next. In standard PHP-FPM, state is lost between calls. Always return results rather than storing them.

**Why it works:** Stateless actions are safe in any runtime. They compose without side effects. They are trivially testable.

### Enforce the Single Public Method Rule

If an action class accumulates a second public method, extract it to a new action class. A second public method violates the "one operation" contract and converts the class into a service.

**Why it works:** The single-method constraint is the only thing that distinguishes actions from services. Violating it erodes the pattern's value without gaining any of the benefits of a proper service class.

### Return Typed Results

Every action should return a typed result — `Model`, `DTO`, `bool`, `void` — that communicates success or carries output. Returning `mixed`, `array`, or nothing forces callers to guess what happened.

**Why it works:** A typed return is a contract. The caller knows what to expect, can type-hint the result, and can reason about the action's behavior without reading its implementation.

### Keep Constructor Dependencies Under 5-8

Actions with more than 5-8 constructor parameters indicate the action is orchestrating rather than executing. Extract orchestration to a service that composes multiple actions.

**Why it works:** Constructor parameter count correlates with responsibility scope. A high count means the action is coupled to too many subsystems. Each dependency is a reason the action might need to change.

### Use Domain Subdirectories, Not a Flat List

Organize actions by domain: `App\Actions\Billing\`, `App\Actions\Inventory\`, `App\Actions\User\`. Avoid flat `App\Actions\` with hundreds of files.

**Why it works:** Domain subdirectories provide navigation structure. Developers find actions by business domain, not by alphabetical listing. File proliferation (one file per operation) becomes manageable.

### Use a Single Naming Convention Across the Team

The team must agree on one convention for method naming, parameter style, and return types. Mixed conventions create cognitive overhead — a developer should not need to check each action to know whether it uses `handle()`, `execute()`, or `__invoke()`.

---

## Architecture Guidelines

### Layer Placement

Actions sit between the entry point layer (controllers, commands, listeners) and the data access layer (repositories, Eloquent models). They are the business logic execution layer.

```
HTTP Controllers / CLI Commands / Queue Jobs / Event Listeners
        ↓
    [Actions]  ← business logic layer
        ↓
Repositories / Eloquent Models / External Services
```

### Boundary Rules

- **Actions must not know about HTTP.** No `Request`, `Response`, or session dependencies in action constructor or method parameters.
- **Actions must not know about the queue.** If an action needs to be queued, use a trait or a wrapper job. The action itself should not contain queue configuration.
- **Actions must not know about the view.** No rendering, no view data preparation. Return data; let the caller decide how to present it.
- **Actions may call other actions.** Composition is the primary way to build complex operations from simple ones.
- **Actions may call repositories directly.** There is no requirement for a service layer between actions and repositories.
- **Actions should not call controllers.** The dependency direction is entry-point-to-action, not action-to-entry-point.

### Namespace Conventions

The community standard is `App\Actions\{Domain}\{ActionName}`. Keeping actions in a dedicated namespace avoids confusion with jobs (`App\Jobs\`), listeners (`App\Listeners\`), and services (`App\Services\`).

### Integration Recommendations

| Component | How Actions Integrate |
|---|---|
| **Controllers** | Controller extracts data from Request, passes to action, handles response based on action result |
| **Service Classes** | Services orchestrate multiple actions and coordinate cross-cutting concerns (transactions, logging) |
| **Queue** | Via Spatie `QueueableAction` trait or a wrapper job that calls the action |
| **CLI Commands** | `handle()` method calls action directly, passes CLI arguments as action input |
| **Event Listeners** | Listener calls action, action performs the business operation |
| **Other Actions** | Composition: action calls one or more child actions, manages result aggregation |

### Dependency Direction

```
Container (resolves action)
    ↓
Action ← DTO (input contract)
    ↓
Repository / Service / Gateway (infrastructure)
    ↓
ActionResult (DTO / Model / bool)
```

Dependencies flow into the action. The action does not depend on its callers. The action does not depend on the framework (beyond the container that resolves it).

---

## Performance Considerations

### Resolution Cost

Each action resolution requires the container to reflect on the constructor and recursively resolve dependencies. For typical actions with 2-4 constructor parameters, this adds approximately 0.01-0.05ms per resolution. The container's `build()` method uses `ReflectionClass::getConstructor()` → `getParameters()` → `resolveDependencies()` on each call. Cached container (`php artisan optimize`) eliminates reflection overhead for pre-resolved services, but actions are typically not pre-resolved.

**Tradeoff:** The container does not cache action instances by default. Every `app(Action::class)` call performs a full resolution. If the same action is called 10 times in a request, it is resolved 10 times. Use a local variable to hold the resolved instance if calling the same action multiple times.

### Memory Per Action

An action instance consumes approximately 1-2KB of memory for the object plus its resolved dependencies. In a request that calls 5 actions, this adds ~5-10KB. Negligible for most applications.

### Autoloading

Action class files are autoloaded via Composer's PSR-4 loader. After OpCache warmup, autoloading has zero per-request cost. The number of action classes in the codebase (potentially hundreds) has no measurable performance impact on warmed-up production systems.

### Octane/RoadRunner Considerations

In long-lived processes, action instances are cached in the container's singleton or scoped bindings. An action that captures request-scoped state (putting data on `$this`) will leak that state to the next request. Actions must be stateless — dependencies only, no mutable properties set during `handle()`.

**Important:** If an action is accidentally bound as a singleton in the container, its dependencies are resolved once and reused across all requests. This is normally correct (repositories are typically singletons), but if the action itself captures per-request state, data corruption occurs silently.

### Scaling Considerations

Actions scale well because they are lightweight objects with no framework overhead. The primary scaling concern is not action execution but database/network calls made by the action's dependencies. An action that calls 3 external APIs will be bottlenecked by those APIs, not by the action class itself.

---

## Security Considerations

### Data Leakage via Stateful Actions (Octane/RoadRunner)

If an action captures per-request data as instance properties and the action is resolved from a cached container, data from request N leaks to request N+1. This is a silent data corruption bug — no error is raised, but the wrong user's data is processed.

**Mitigation:** Enforce stateless actions. Never set `$this->property` during `handle()`. Use `readonly class` to prevent property mutation at the compiler level.

### Authorization Bypass via Action Reuse

When an action is called from multiple entry points (controller, CLI, queue), it is the caller's responsibility to authorize the operation. An action that was originally called only from an authorized controller endpoint may be called from an unauthorized CLI command later. The action itself does not enforce authorization.

**Mitigation:** Either enforce authorization at every entry point or add explicit `authorize()` calls in the action. The former is more common; the latter couples the action to the authorization system. Document which entry points are authorized to call each action.

### Input Validation Bypass

Actions that accept loose arrays (`handle(array $data)`) pass validation responsibility to the caller. If a controller validates via Form Request but a CLI command passes unvalidated data to the same action, the validation gap is invisible.

**Mitigation:** Use DTOs with validation rules (Spatie's `laravel-data` provides `rules()` method on DTOs). This ensures validation is part of the action's input contract, not the caller's discretion.

### Mass Assignment Exposure

Actions that pass arrays directly to Eloquent's `::create($data)` inherit any mass-assignment vulnerabilities in the model. The action provides no additional protection layer.

**Mitigation:** Explicitly map DTO properties to model attributes in the action. Never pass untrusted arrays to Eloquent. Use `only()` or explicit `fill()` with known keys.

### Indirect Risks

- Actions that call external services inherit those services' security vulnerabilities.
- Actions that log input may log sensitive data (PII, passwords, tokens).
- Actions that cache results may cache authorized data that becomes accessible to unauthorized users later.

---

## Common Mistakes

### Mistake 1: Actions with Mutable State

**Description:** Setting properties on `$this` during `handle()` to track progress or store intermediate results.

**Why developers make it:** Familiarity with class properties as a convenient place to store data. Unfamiliarity with Octane/RoadRunner's request lifecycle.

**Consequences:** Data leaks across requests in long-lived processes. State is lost between calls in PHP-FPM. The action's result is inaccessible to the caller.

**Better approach:** Return a result object (DTO, array, Model) that carries all output data. Never set properties on `$this` during execution.

### Mistake 2: Actions with Multiple Public Methods

**Description:** Adding a second public method to an action class (e.g., `handle()` and `rollback()`).

**Why developers make it:** Two operations are "related" so they belong in the same class. Avoiding "file proliferation."

**Consequences:** The class is no longer an action — it is a mini-service with a misleading name. Team expectations about single-responsibility are violated.

**Better approach:** Extract each operation to its own action class. If operations are truly related and share setup/teardown, use a service class instead.

### Mistake 3: Actions Accepting HTTP Request Objects

**Description:** Passing `Illuminate\Http\Request` (or `$request` variable) to the action's method.

**Why developers make it:** Convenience — the controller already has the Request. "The action needs the data from the request."

**Consequences:** Action is coupled to HTTP. Cannot be called from CLI, queue, or another action without constructing a fake Request.

**Better approach:** Extract data from Request in the controller and pass a DTO or individual parameters to the action.

### Mistake 4: Actions With Too Many Constructor Parameters

**Description:** 10+ constructor dependencies injected into a single action.

**Why developers make it:** The operation is complex and genuinely needs many services. "Each dependency is needed for some part of the operation."

**Consequences:** High coupling, difficult testing, the action is orchestrating rather than executing.

**Better approach:** Extract sub-operations into child actions. Use a service class to orchestrate the action composition.

### Mistake 5: Actions That Return Mixed Types

**Description:** Return type is `mixed`, `array`, or `void` with no documentation about what is returned.

**Why developers make it:** "The caller knows what to expect." "I'll document it in the docblock."

**Consequences:** Callers cannot reason about the result. Type errors at runtime instead of compile time. New developers must read the implementation to understand the return contract.

**Better approach:** Always specify a concrete return type: `Model`, `DTO`, `bool`, `void`, or a dedicated result class.

### Mistake 6: Actions That Wrap Every Eloquent Call

**Description:** A `CreateUserAction` that does nothing but `return User::create($data)`.

**Why developers make it:** "Following the pattern." "All business logic should be in actions."

**Consequences:** File proliferation without architectural benefit. Developers eventually ignore action classes and call models directly.

**Better approach:** Use actions only when the operation involves multiple steps, multiple models, or validation/authorization logic. Simple CRUD pass-through does not need an action.

---

## Anti-Patterns

### God Action

**Description:** An action class with 10+ constructor parameters that handles an entire business workflow — validation, authorization, database writes, email sending, logging, cache invalidation, and external API calls — all in one `handle()` method.

**Why it is harmful:** Violates single responsibility. The action cannot be tested in isolation. Any change to any part of the workflow requires modifying this one class. The constructor signature alone reveals excessive coupling.

**Detection:** Constructor parameter count > 8. The `handle()` method exceeds 50 lines. The action imports from 6+ different namespaces.

### Action as Service

**Description:** A class named `XxxAction` that has multiple public methods, each performing a separate operation. The file contradicts its own name — it is a service disguised as an action.

**Why it is harmful:** Confuses team expectations. Developers searching for "the action that creates orders" find a class that also updates, deletes, and lists orders. The action pattern's single-responsibility guarantee is false.

**Detection:** The class has `Action` suffix but more than one public method. The file has more methods than `handle()` (or `execute()` / `__invoke()`).

### HTTP-Coupled Action

**Description:** An action that depends on `Illuminate\Http\Request`, `Illuminate\Http\RedirectResponse`, or session data in its constructor or method parameters.

**Why it is harmful:** Binds business logic to the HTTP layer. The action cannot be called from CLI, queue, or another action. Testing requires mocking HTTP objects. The pattern's primary benefit (entry-point independence) is negated.

**Detection:** Any `use Illuminate\Http` import in the action file. Any `request()` helper call inside the action method.

### Stateful Action

**Description:** An action that stores intermediate results on `$this` during `handle()` and exposes getter methods to retrieve them after execution.

**Why it is harmful:** Unsafe in Octane/RoadRunner (data leaks across requests). Unsafe in standard PHP (state lost between calls). Forces callers to know about internal implementation details.

**Detection:** Properties set during `handle()`. Getter methods on the action class. The class is not `readonly`.

### Action-as-Queue-Job

**Description:** Using actions as queue jobs without awareness of serialization differences. Constructor parameters that are service instances in actions become serialized data in jobs. The action works in HTTP context but fails on the queue worker.

**Why it is harmful:** Silent failures or data corruption on the queue. The developer assumes the action works identically in both contexts, but the resolution mechanism is fundamentally different (container vs serializer).

**Detection:** The action implements `ShouldQueue` directly instead of using Spatie's `QueueableAction` trait or a wrapper job. The action's constructor mixes service type-hints with serialized model instances.

---

## Examples

### Architecture Example: Folder Structure

```
app/
├── Actions/
│   ├── Billing/
│   │   ├── GenerateInvoiceAction.php
│   │   ├── ProcessRefundAction.php
│   │   └── VoidTransactionAction.php
│   ├── Inventory/
│   │   ├── ReserveStockAction.php
│   │   ├── ReleaseStockAction.php
│   │   └── TransferStockAction.php
│   └── User/
│       ├── CreateUserAction.php
│       ├── UpdateUserProfileAction.php
│       └── DeleteUserAction.php
├── Http/
│   ├── Controllers/
│   │   ├── BillingController.php
│   │   ├── InventoryController.php
│   │   └── UserController.php
│   └── Requests/
└── Models/
```

Actions are organized by domain, not by technical layer. Each domain directory mirrors the business domain it serves.

### Request Flow Example

```
HTTP POST /orders
    ↓
StoreOrderRequest (validates input, authorizes user)
    ↓
OrderController::store(StoreOrderRequest $request)
    ↓  extracts DTO from validated request
PlaceOrderAction::handle(PlaceOrderData $data)
    ↓  composes sub-actions
  ├── ReserveInventoryAction::handle($reservationData)  → bool
  ├── ChargePaymentAction::handle($paymentData)          → Payment
  └── CreateOrderAction::handle($orderData)              → Order
    ↓
OrderController returns JsonResponse(OrderResource, 201)
```

The controller handles HTTP concerns. The action handles business logic. Sub-actions handle individual operations within the workflow.

### Decision Example: When to Extract to an Action

```
Does the operation have multiple steps (validation + logic + side effects)?
  ├── No → Is it simple CRUD pass-through?
  │   ├── Yes → Use Model directly
  │   └── No → Keep in controller or service
  └── Yes → Is it called from multiple entry points?
      ├── Yes → Extract to Action
      └── No → Will it be called from multiple entry points?
          ├── Yes → Extract to Action
          └── No → Keep in service, extract to Action when second caller emerges
```

### Constructor vs Method Injection Example

```php
// Action: constructor = dependencies (container resolved), method = operation input
final readonly class CreateUserAction
{
    public function __construct(
        private UserRepository $users,   // resolved by container via reflection
        private PasswordHasher $hasher,  // resolved by container via reflection
    ) {}

    public function handle(
        string $name,
        string $email,
        string $password
    ): User {
        // parameters = operational input for this specific call
    }
}

// Usage:
$user = app(CreateUserAction::class)->handle(
    name: $request->input('name'),
    email: $request->input('email'),
    password: $request->input('password'),
);
```

### Action Composition Example

```php
final readonly class PlaceOrderAction
{
    public function __construct(
        private ReserveInventoryAction $reserveInventory,
        private ChargePaymentAction $chargePayment,
        private CreateOrderAction $createOrder,
    ) {}

    public function handle(PlaceOrderData $data): Order
    {
        $this->reserveInventory->handle($data->items);
        $payment = $this->chargePayment->handle($data->payment);
        return $this->createOrder->handle($data, $payment);
    }
}
```

The parent action depends on child actions, not on low-level repositories. Each child action is independently testable.

---

## Related Topics

### Prerequisites

| Topic | Why It Matters |
|---|---|
| **Service Container Basics** | Understanding how `Container::make()` → `build()` → reflection on `__construct` resolves action dependencies |
| **Dependency Injection** | Understanding constructor injection, type-hinting, and how the container resolves recursive dependencies |
| **Controller Architecture** | Understanding how controllers delegate to actions — the most common action invocation pattern |

### Closely Related Topics

| Topic | Relationship |
|---|---|
| **Action Naming Conventions** | Defines the naming rules for action classes and methods within the team |
| **Action Composition** | Patterns for actions calling other actions, including error propagation and result aggregation |
| **Transactional Actions** | How actions interact with database transactions — when to wrap in `DB::transaction` and how to compose transactional boundaries |
| **Action Testing** | Testing strategies specific to action classes — unit testing with mocked dependencies, integration testing with real infrastructure |
| **Action vs Service vs Use Case** | The three-way decision framework for organizing business logic, including when each pattern applies |

### Advanced Follow-Up Topics

| Topic | Prerequisite Knowledge |
|---|---|
| **Queued Actions** | Action class design + Spatie QueueableAction trait or manual job wrapping |
| **Use Case Variant** | Action class design + DTO patterns + Clean Architecture boundaries |
| **Octane Safety** | Action class design + long-lived process implications |

### Cross-Domain Connections

| Domain | Connection |
|---|---|
| **Laravel Eloquent & Domain Modeling** | Actions use repositories/models for data access. Model design affects action implementation |
| **Async & Distributed Systems** | Queued actions bridge action pattern and queue systems |
| **API & CRUD System Engineering** | Actions provide the business logic layer that API controllers delegate to |
| **Testing & Reliability Engineering** | Action testability is a primary design goal. Action isolation simplifies test setup |

---

## AI Agent Notes

### Important Decisions

- **Method name choice** affects Spatie's `QueueableAction` auto-detection. `handle()` is the most common convention but is NOT auto-detected by the package. `execute()` is auto-detected. Teams using `handle()` with Spatie must override `queueMethod()`. This is a common source of runtime errors on queue workers.

- **`final` keyword decision** affects testability. `final` prevents mocking via inheritance (Mockery's `makePartial()`) but forces trait-based reuse and composition. There is no community consensus. The decision should be made at the project level and enforced by Pest architecture tests.

- **Parameter strategy (array vs DTO vs individual params)** is not a permanent decision. Actions should start with individual parameters or simple arrays and migrate to DTOs when complexity justifies it. The reverse migration (DTO back to array) is rarely necessary.

### Important Tradeoffs

- **Action granularity vs file proliferation.** More actions = better isolation + more files. The sweet spot varies by team size and domain complexity. Teams of 10+ tend toward finer granularity. Solo developers tend toward coarser granularity.

- **Action composition depth.** Deep composition (action → action → action) provides clear sub-operation boundaries but creates many files to navigate when debugging a single request flow. Maximum recommended depth: 3 levels.

- **Actions vs Services.** Actions are not a replacement for services. They solve different problems. The decision framework: if an entity has 10+ related operations, group them in a service. If a single operation is complex enough to warrant its own file, extract it to an action.

### Important Constraints

- **Actions cannot be serialized for queueing** without modification. Constructor dependencies are service instances, not serializable data. Spatie's `QueueableAction` handles this by serializing the action's class name and method name, then resolving fresh dependencies on the worker.

- **Actions must be stateless in Octane/RoadRunner.** This is not optional. A stateful action in a long-lived process will corrupt data. Enforce with `readonly class` and Pest architecture tests.

- **Actions should not be bound as singletons** unless the team fully understands the implications. Accidental singleton binding causes shared state across requests.

### Frequently Repeated Expert Recommendations

- "Start with individual parameters, graduate to DTOs as complexity grows."
- "One test class per action. If the test file is hard to write, the action design is wrong."
- "The constructor reveals the action's scope. Too many parameters = too much scope."
- "Actions are for business operations, not data access. If your action only calls `::create()`, it's probably unnecessary."
- "Domain subdirectories in `App\Actions\` are non-negotiable for teams. Flat action directories do not scale."
- "If you can't name an action with `[Verb][Noun]Action`, your operation boundaries are unclear."
- "Pest architecture tests should enforce: actions are `final`, have exactly one public method, and do not import from `Illuminate\Http`."
- "Do not use actions to satisfy a 'one action per controller method' quota. Use actions when the operation has intrinsic complexity that warrants isolation."

### Rules Generation Hints

The following observations should inform future rule generation:
- Enforce `final` on all action classes in Pest architecture tests
- Ban `Illuminate\Http` imports in `App\Actions\` namespace
- Enforce maximum 8 constructor parameters
- Enforce exactly one public method per action class
- Enforce `readonly` for PHP 8.2+ projects
- Require typed return values on all action methods

### Skills Generation Hints

The following observations should inform future skill generation:
- A skill for "extracting controller logic to an action" — step-by-step refactoring guide
- A skill for "composing actions" — transaction boundaries, error propagation, result aggregation
- A skill for "migrating actions to DTOs" — replacing array parameters with typed DTOs
- A skill for "Octane-safe action design" — stateless patterns, readonly enforcement, singleton avoidance

---

## Verification

This document has been validated against:

| Source | What Was Verified |
|---|---|
| Laravel Framework Source (`Container.php`) | Container resolution mechanics: `make()` → `resolve()` → `build()` → reflection on `__construct` → `resolveDependencies()` → recursive `make()` |
| Laravel Framework Source (`helpers.php`) | `app()` helper delegates to `Container::make()` |
| Laravel Jetstream (community convention) | Action namespace (`App\Actions\`), domain-specific method names (`create()`, `update()`, `delete()`), no base action class |
| Spatie QueueableAction (community convention) | Method auto-detection behavior: `__invoke()` first, then `execute()`, fallback to `queueMethod()` override |
| Lorisleiva/laravel-actions (community package) | Alternative approach with base action class and capability declaration |
