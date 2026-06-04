# Phase 5: Action Class Design Rules

---

## Rule: Enforce Single Public Method Per Action

---

## Category

Architecture

---

## Rule

Every action class must have exactly one public method. Any additional public method must be extracted to a new action class or the class must be renamed to a Service.

---

## Reason

The single public method is the defining characteristic of the action pattern. A second public method violates the "one operation per class" contract and converts the class into a service without gaining any of the benefits of proper service design. It breaks team expectations and erodes test isolation.

---

## Bad Example

```php
class OrderAction
{
    public function create(array $data): Order { /* ... */ }
    public function cancel(int $id): void { /* ... */ }
    public function refund(int $id): void { /* ... */ }
}
```

---

## Good Example

```php
final readonly class CreateOrderAction
{
    public function __construct(
        private OrderRepository $orders,
        private InventoryService $inventory,
    ) {}

    public function handle(CreateOrderData $data): Order { /* ... */ }
}

final readonly class CancelOrderAction { /* single method */ }
final readonly class RefundOrderAction { /* single method */ }
```

---

## Exceptions

Utility methods declared `private` or `protected` (helpers, formatters) are allowed as long as they support the single public method. The class may also implement an interface that requires additional public methods — but in that case, the class is a Service, not an Action, and should be named accordingly.

---

## Consequences Of Violation

Maintenance risks: developers cannot rely on the action's single-responsibility guarantee. Code Organization risks: the boundary between actions and services blurs, making architectural decisions unpredictable.

---

---

## Rule: Declare Action Classes as `final readonly`

---

## Category

Maintainability

---

## Rule

All action classes must be declared `final readonly` in projects using PHP 8.2+. The `final` keyword prevents inheritance-based extension. The `readonly` keyword makes all properties implicitly readonly, preventing mutation of constructor dependencies.

---

## Reason

`final` prevents accidental inheritance that would couple subclasses to the action's internal implementation. `readonly` enforces statelessness at the compiler level — no property can be reassigned after construction, eliminating an entire class of state-leakage bugs in Octane and RoadRunner. Together they signal that actions are closed for modification and open for composition.

---

## Bad Example

```php
class CreateUserAction
{
    private UserRepository $users;
    private int $callCount = 0;

    public function execute(array $data): User
    {
        $this->callCount++;
        return $this->users->create($data);
    }
}
```

---

## Good Example

```php
final readonly class CreateUserAction
{
    public function __construct(
        private UserRepository $users,
    ) {}

    public function execute(array $data): User
    {
        return $this->users->create($data);
    }
}
```

---

## Exceptions

Legacy PHP 8.0/8.1 projects that cannot upgrade to 8.2 may omit `readonly` but must still enforce statelessness through code review and Pest architecture tests.

---

## Consequences Of Violation

Reliability risks: mutable properties leak data across requests in Octane/RoadRunner, causing silent data corruption. Maintenance risks: `final` omission allows inheritance chains that couple subclasses to parent internals, making refactoring dangerous.

---

---

## Rule: Never Accept HTTP Request Objects in Actions

---

## Category

Architecture

---

## Rule

Actions must never accept `Illuminate\Http\Request` or any other HTTP message (Response, RedirectResponse, UploadedFile) as a constructor or method parameter. Extract all HTTP data in the controller and pass DTOs, individual parameters, or validated arrays.

---

## Reason

Accepting HTTP objects couples business logic to the HTTP transport layer. The action becomes uncallable from CLI commands, queue workers, event listeners, or other actions without constructing a fake Request object. This negates the action pattern's primary benefit of entry-point independence.

---

## Bad Example

```php
final readonly class RegisterUserAction
{
    public function handle(Request $request): User
    {
        return User::create($request->all());
    }
}
```

---

## Good Example

```php
final readonly class RegisterUserAction
{
    public function handle(RegisterUserData $data): User
    {
        return User::create($data->toArray());
    }
}

// Controller extracts HTTP data:
$user = $this->registerUserAction->handle(
    new RegisterUserData(
        name: $request->validated('name'),
        email: $request->validated('email'),
    )
);
```

---

## Exceptions

No common exceptions. If an action needs request metadata (IP address, user agent), extract it in the controller and pass it as a typed parameter.

---

## Consequences Of Violation

Scalability risks: the action cannot be reused across entry points without HTTP coupling. Testing risks: tests must mock or construct Request objects, increasing setup complexity and coupling tests to HTTP infrastructure. Maintenance risks: changing HTTP contracts (e.g., migrating from Request to a DTO) requires changes in every caller.

---

---

## Rule: Return Typed Results from Every Action

---

## Category

Design

---

## Rule

Every action method must declare a concrete return type — `Model`, `DTO`, `bool`, `void`, or a dedicated result class. Never use `mixed`, bare `array`, or omit the return type.

---

## Reason

A typed return is a contract. The caller knows what to expect, can type-hint the result, and can reason about the action's behavior without reading its implementation. Typed returns enable static analysis and IDE autocompletion and prevent runtime type errors that surface only in production.

---

## Bad Example

```php
final readonly class ProcessPaymentAction
{
    public function execute(array $data)
    {
        // Returns mixed — could be Payment, bool, array, or null
    }
}
```

---

## Good Example

```php
final readonly class ProcessPaymentAction
{
    public function execute(PaymentData $data): PaymentResult
    {
        // Returns typed result
    }
}
```

---

## Exceptions

Actions that dispatch queued work and return no meaningful result may declare `void`. Actions that conditionally skip processing may declare `?Model` with `null` meaning "no operation performed."

---

## Consequences Of Violation

Maintenance risks: callers cannot reason about the result without reading the implementation. Reliability risks: type errors surface at runtime instead of compile time. Testing risks: tests must assert on implementation details rather than contract-level outcomes.

---

---

## Rule: Limit Constructor Dependencies to a Maximum of 8

---

## Category

Maintainability

---

## Rule

Action class constructors must not accept more than 8 parameters. When an action reaches this threshold, extract sub-operations into child actions or extract the orchestrating workflow into a Service class.

---

## Reason

Constructor parameter count correlates directly with responsibility scope. Each dependency is a reason the action might need to change. More than 8 dependencies indicates the action is orchestrating multiple sub-operations rather than executing a single one — it has crossed the threshold from action to service.

---

## Bad Example

```php
final readonly class ProcessOrderAction
{
    public function __construct(
        private InventoryService $inventory,
        private PaymentGateway $payment,
        private EmailService $email,
        private LoggerInterface $logger,
        private Cache $cache,
        private AnalyticsService $analytics,
        private ShippingService $shipping,
        private TaxService $tax,
        private DiscountService $discount,
        private FraudService $fraud,
    ) {}
}
```

---

## Good Example

```php
// Decompose into sub-actions and a service orchestrator
final readonly class ProcessOrderService
{
    public function __construct(
        private ValidateOrderAction $validateOrder,
        private ProcessPaymentAction $processPayment,
        private ShipOrderAction $shipOrder,
        private NotifyCustomerAction $notifyCustomer,
    ) {}
}
```

---

## Exceptions

Actions that genuinely require many infrastructure dependencies (e.g., complex multi-gateway payment actions) may exceed 8 parameters only if each dependency represents a distinct, independently mockable collaborator — not when the parameter count is inflated by decomposable sub-operations.

---

## Consequences Of Violation

Maintenance risks: high coupling makes the action fragile — any change to any dependency requires changing the action. Testing risks: each test must mock 9+ collaborators, making tests brittle and slow. Scalability risks: the action cannot be decomposed later without breaking callers.

---

---

## Rule: Organize Actions in Domain Subdirectories

---

## Category

Code Organization

---

## Rule

Actions must be organized by domain subdirectory (`App\Actions\Billing\`, `App\Actions\Inventory\`, `App\Actions\User\`). Flat `App\Actions\` directories are forbidden when the total exceeds 20 files.

---

## Reason

Flat action directories do not scale. A single directory with 100+ action files forces developers to search alphabetically through unrelated operations, increasing navigation time and cognitive load. Domain subdirectories group related actions, making the file tree a map of the application's bounded contexts.

---

## Bad Example

```
app/Actions/
├── CancelOrder.php
├── CreateOrder.php
├── CreateUser.php
├── DeleteUser.php
├── GenerateInvoice.php
├── ProcessRefund.php
├── ReserveStock.php
├── SendWelcomeEmail.php
└── SuspendUser.php  (20+ more files)
```

---

## Good Example

```
app/Actions/
├── Billing/
│   ├── GenerateInvoiceAction.php
│   ├── ProcessRefundAction.php
│   └── VoidTransactionAction.php
├── Inventory/
│   ├── ReleaseStockAction.php
│   ├── ReserveStockAction.php
│   └── TransferStockAction.php
└── User/
    ├── CreateUserAction.php
    ├── DeleteUserAction.php
    ├── SendWelcomeEmailAction.php
    └── SuspendUserAction.php
```

---

## Exceptions

Small projects with fewer than 20 actions total may use a flat `App\Actions\` directory. Teams should adopt subdirectories proactively as soon as the count approaches the threshold.

---

## Consequences Of Violation

Scalability risks: flat directories become unmanageable beyond 50 actions. Code Organization risks: developers waste time navigating unrelated actions. Maintenance risks: action files are harder to discover, encouraging duplication instead of reuse.

---

---

## Rule: Keep Actions Stateless — Never Set Mutable Properties During Execution

---

## Category

Reliability

---

## Rule

Actions must never set properties on `$this` during the `handle()`/`execute()` method. All execution state must be returned as a result value. Actions must not expose getter methods for execution results.

---

## Reason

In Octane and RoadRunner, action instances are cached across requests. State set during one request leaks to the next, causing silent data corruption. In PHP-FPM, state is lost between calls, so storing it on `$this` is useless. The `readonly` keyword provides compiler-level enforcement.

---

## Bad Example

```php
final class ProcessFileAction
{
    private ?string $processedPath = null;

    public function execute(string $path): void
    {
        $this->processedPath = storage_path('processed/' . basename($path));
        // State leaks across requests in Octane
    }

    public function getProcessedPath(): ?string
    {
        return $this->processedPath;
    }
}
```

---

## Good Example

```php
final readonly class ProcessFileAction
{
    public function execute(string $path): ProcessedFileResult
    {
        $processedPath = storage_path('processed/' . basename($path));
        return new ProcessedFileResult($processedPath);
    }
}
```

---

## Exceptions

Memoization of expensive infrastructure lookups (e.g., cached configuration, resolved gateway instances) is acceptable if the memoized value is truly invariant across requests. Any property whose value depends on per-request data is strictly forbidden.

---

## Consequences Of Violation

Reliability risks: data corruption in long-lived processes (Octane, RoadRunner). Maintenance risks: developers cannot reason about the action's state at any point in execution. Testing risks: tests must reset action state between runs, creating test pollution.

---

---

## Rule: Do Not Create Actions for Simple Eloquent CRUD Pass-Through

---

## Category

Design

---

## Rule

Do not create action classes whose only logic is to call a single Eloquent method (`::create()`, `::update()`, `::delete()`) with pass-through data. Use Eloquent models directly or service methods for simple CRUD operations.

---

## Reason

An action that does nothing but `User::create($data)` adds a file, a class, and constructor injection ceremony without any architectural benefit. The Indirection has no value because there is no business logic to isolate, test, or reuse independently. File proliferation without benefit reduces the signal-to-noise ratio of the action directory.

---

## Bad Example

```php
final readonly class CreateUserAction
{
    public function execute(array $data): User
    {
        return User::create($data);
    }
}

// Controller:
$user = app(CreateUserAction::class)->execute($request->validated());
```

---

## Good Example

```php
// Controller handles simple CRUD directly:
$user = User::create($request->validated());

// Extract to action only when business logic exists:
final readonly class CreateUserAction
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
        private EmailValidator $emailValidator,
    ) {}

    public function execute(CreateUserData $data): User
    {
        $this->emailValidator->assertUnique($data->email);
        return $this->users->create([
            'name' => $data->name,
            'email' => $data->email,
            'password' => $this->hasher->hash($data->password),
        ]);
    }
}
```

---

## Exceptions

If the Eloquent pass-through is called from multiple entry points (controller, CLI, queue) and the simple creation logic must be centralized to prevent divergence, a thin action wrapper is acceptable — but only after a second caller emerges.

---

## Consequences Of Violation

Maintenance risks: file proliferation dilutes the signal of meaningful actions. Testing risks: tests for pass-through actions duplicate model tests. Scalability risks: developers eventually ignore action classes and call models directly, creating two code paths for the same operation.

---

---

## Rule: Establish a Single Method Name Convention Across the Team

---

## Category

Framework Usage

---

## Rule

All actions in the codebase must use the same public method name — either `handle()`, `execute()`, or `__invoke()`. Mixing method names within the same project is forbidden. Jetstream-style domain-specific method names (`create()`, `update()`) are allowed only if used consistently across all actions.

---

## Reason

Mixed method names create cognitive overhead. A developer should not need to check each action to know whether it uses `handle()`, `execute()`, or `__invoke()`. Consistent method names enable generic callers, consistent testing patterns, and uniform dynamic dispatch.

---

## Bad Example

```php
// Three different actions in the same codebase:
class CreateUserAction
{
    public function handle(array $data): User { /* ... */ }
}

class SendInvoiceAction
{
    public function execute(Invoice $invoice): void { /* ... */ }
}

class ProcessPaymentAction
{
    public function __invoke(PaymentData $data): Payment { /* ... */ }
}
```

---

## Good Example

```php
// Consistent method name across all actions:
class CreateUserAction
{
    public function handle(CreateUserData $data): User { /* ... */ }
}

class SendInvoiceAction
{
    public function handle(Invoice $invoice): void { /* ... */ }
}

class ProcessPaymentAction
{
    public function handle(PaymentData $data): Payment { /* ... */ }
}
```

---

## Exceptions

When using Spatie's `QueueableAction` trait, the method name choice affects auto-detection. If using `handle()`, the action must override `queueMethod()` to return `'handle'`. Teams using `execute()` get auto-detection. Document this tradeoff in the convention decision.

---

## Consequences Of Violation

Maintenance risks: developers waste mental cycles checking method names before calling actions. Testing risks: cannot create generic test utilities for actions. Framework Usage risks: Spatie's QueueableAction auto-detection fails silently (falls back to `execute()`), causing worker-time errors.

---

---

## Rule: Enforce Action Purity with Pest Architecture Tests

---

## Category

Testing

---

## Rule

Every Laravel project using the action pattern must include Pest or PHPUnit architecture tests that enforce: all classes in `App\Actions\` namespace are `final`, have exactly one public method, do not import from `Illuminate\Http`, do not use `Facades\*`, and are declared `readonly` (PHP 8.2+).

---

## Reason

Architecture tests act as executable documentation. They prevent accidental violations from entering the codebase without requiring manual code review for every action class. Automated enforcement ensures the action pattern's constraints are maintained as the team grows and changes.

---

## Bad Example

```php
// No architecture tests — violations go undetected until code review
// A developer accidentally adds a second public method or imports Request
```

---

## Good Example

```php
// tests/Arch/ActionsTest.php
test('actions are final')
    ->expect('App\Actions')
    ->toBeFinal();

test('actions have exactly one public method')
    ->expect('App\Actions')
    ->toHaveOnlyOnePublicMethod();

test('actions do not import from Illuminate\Http')
    ->expect('App\Actions')
    ->not->toUse('Illuminate\Http\Request');

test('actions are readonly')
    ->expect('App\Actions')
    ->toBeReadonly();
```

---

## Exceptions

Projects on PHP 8.0/8.1 may omit the readonly check. Projects using Jetstream's action pattern should adjust to match Jetstream's conventions (which do not use `final` or `readonly` by default).

---

## Consequences Of Violation

Maintenance risks: pattern erosion accelerates as violations accumulate without detection. Reliability risks: stateful, HTTP-coupled, or multi-method actions enter the codebase silently. Testing risks: architecture tests lose their enforcement value, and pattern discipline degrades over time.

---

---

## Rule: Prefer DTOs or Individual Parameters Over Loose Arrays

---

## Category

Design

---

## Rule

Action methods must accept typed DTOs or individual named parameters instead of bare `array $data`. Loose arrays are permitted only for simple CRUD pass-through actions that are called from a single entry point and have no business logic.

---

## Reason

Loose arrays shift the contract burden to the caller — there is no type safety, no IDE autocompletion, no discoverable shape, and no compile-time validation. The caller must know which keys are expected, and any key typo becomes a runtime error. DTOs or individual parameters make the contract explicit and enforceable.

---

## Bad Example

```php
final readonly class RegisterUserAction
{
    public function execute(array $data): User
    {
        // What keys does $data need? 'name'? 'username'? 'full_name'?
        return User::create($data);
    }
}

// Caller must guess:
$action->execute(['name' => 'John', 'email' => 'john@test.com']);
```

---

## Good Example

```php
final readonly class RegisterUserAction
{
    public function execute(RegisterUserData $data): User
    {
        return User::create([
            'name' => $data->name,
            'email' => $data->email,
            'password' => $data->password,
        ]);
    }
}

// DTO contract is explicit:
final readonly class RegisterUserData
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
}
```

---

## Exceptions

Internal or private actions called from a single location where the data shape is trivially obvious and stable (e.g., 1-2 parameters) may use individual parameters instead of a DTO. Arrays are acceptable only for generic processing actions (e.g., `LogDataAction` that handles arbitrary key-value data).

---

## Consequences Of Violation

Maintenance risks: array key changes are not caught by static analysis. Reliability risks: production errors surface when callers pass incorrect array keys. Scalability risks: as the action is reused across more callers, array contract violations increase.

---

---

## Rule: Do Not Bind Actions as Singleton Services

---

## Category

Performance

---

## Rule

Actions must not be bound as singletons in the service container unless the team fully understands and has explicitly documented the stateless requirements. The default resolution mode must be the standard transient (new instance per resolution).

---

## Reason

Singleton-bound actions share state across all requests. In Octane/RoadRunner, a singleton action whose dependencies include request-scoped services (session, auth) will leak data between requests. Accidental singleton binding via a service provider's `singleton()` call or via automatic binding conventions is a common source of silent data corruption.

---

## Bad Example

```php
// In a service provider:
$this->app->singleton(CreateUserAction::class);

// Now every request reuses the same action instance.
// If any property is set during execution, it leaks across requests.
```

---

## Good Example

```php
// Default transient resolution — new instance per call:
public function register(): void
{
    // No binding needed — container resolves transient by default
    // app(CreateUserAction::class) creates a fresh instance each time
}
```

---

## Exceptions

Actions whose dependencies are all stateless infrastructure services (gateways, HTTP clients, loggers) and whose `handle()` method never assigns any state to `$this` may be safely bound as singletons for a minor performance gain. This must be explicitly documented and enforced by architecture tests.

---

## Consequences Of Violation

Reliability risks: data corruption in long-lived processes. Security risks: user A's data may be visible to user B in Octane due to shared action state. Maintenance risks: subtle heisenbugs that only reproduce in production under load.

---
