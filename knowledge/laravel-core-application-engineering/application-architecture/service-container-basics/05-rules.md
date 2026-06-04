# Service Container Basics — Rules

## Bind Interfaces, Not Concrete Classes

Always bind interfaces or abstract classes in the container. Concrete classes resolve automatically via reflection and do not need explicit binding.

---

## Category

Architecture

---

## Rule

Use `$app->bind(Interface::class, Concrete::class)` for polymorphic dependencies. Do not register `$app->bind(ConcreteService::class, ConcreteService::class)` — concrete classes auto-resolve.

---

## Reason

Interfaces cannot be resolved by reflection because the container cannot determine which implementation to use. Explicit binding is the required registration for interfaces. Concrete classes are resolved automatically through constructor reflection. Redundant binding adds noise without benefit.

---

## Bad Example

```php
$this->app->bind(FileLogger::class, FileLogger::class);
// Redundant — FileLogger auto-resolves via reflection
```

---

## Good Example

```php
$this->app->bind(LoggerInterface::class, FileLogger::class);
// Necessary — Interface must be explicitly bound
```

---

## Exceptions

Binding a concrete class to override auto-resolution with a closure for complex construction logic is acceptable.

---

## Consequences Of Violation

Redundant bindings clutter provider code, interface resolution fails without explicit binding, testing without interfaces is harder.

---

## Use Constructor Injection Over Container Resolution in Application Code

Prefer constructor injection over `app()->make()` in all business logic classes.

---

## Category

Design

---

## Rule

Declare dependencies in the constructor and let the container autowire them. Do not call `app()->make()` inside services, actions, or domain classes.

---

## Reason

Constructor injection makes dependencies explicit in the class signature, enables mock injection in tests, and makes the dependency graph visible without reading method bodies. `app()->make()` creates hidden dependencies that are invisible at the class API level.

---

## Bad Example

```php
class InvoiceService
{
    public function generate(int $orderId): Invoice
    {
        $repository = app(OrderRepository::class);
        $pdf = app(PdfGenerator::class);
        return $pdf->generate($repository->find($orderId));
    }
}
```

---

## Good Example

```php
class InvoiceService
{
    public function __construct(
        private OrderRepository $orders,
        private PdfGenerator $pdf,
    ) {}

    public function generate(int $orderId): Invoice
    {
        return $this->pdf->generate(
            $this->orders->find($orderId)
        );
    }
}
```

---

## Exceptions

Event listeners, route callbacks, and prototyping code may use `app()->make()` where constructor injection adds disproportionate ceremony.

---

## Consequences Of Violation

Hidden dependencies in business logic, untestable classes without container mocking, service locator anti-pattern.

---

## Use Singletons for Stateless Services

Register stateless services (repositories, gateways, loggers) as singletons in the container.

---

## Category

Performance

---

## Rule

Use `$app->singleton()` for services that hold no per-request state. Use `$app->bind()` only for services that need a fresh instance on every resolution.

---

## Reason

Singleton resolution is O(1) after the first resolution — the same instance is reused. Stateless services benefit from zero construction overhead on subsequent resolutions. Per-request state services need `bind()` to avoid state leaking across requests.

---

## Bad Example

```php
$this->app->bind(Logger::class, FileLogger::class);
// Logger is stateless — new instance created every resolution
```

---

## Good Example

```php
$this->app->singleton(Logger::class, FileLogger::class);
// Same instance reused — no construction overhead
```

---

## Exceptions

Services that maintain per-request state (e.g., services that cache request-scoped data) must use `bind()` or `scoped()`.

---

## Consequences Of Violation

Unnecessary object construction on every resolution, increased memory allocation, slower response times.

---

## Never Use Container Resolution for Value Objects or DTOs

Construct value objects and data transfer objects with `new`, not through the container.

---

## Category

Design

---

## Rule

Value objects, DTOs, plain data containers, and simple configuration objects must be constructed with `new` or named constructors. Do not resolve them via `$app->make()` or `app()`.

---

## Reason

The container provides dependency injection and service resolution. Value objects have no dependencies — they only carry data. Container resolution for value objects adds unnecessary reflection overhead and couples data construction to the container.

---

## Bad Example

```php
$dto = app(UserRegistrationData::class, [
    'email' => $request->email,
    'name' => $request->name,
]);
```

---

## Good Example

```php
$dto = new UserRegistrationData(
    email: $request->email,
    name: $request->name,
);
```

---

## Exceptions

Eloquent models are resolved through the container and are exempt from this rule.

---

## Consequences Of Violation

Unnecessary reflection overhead, container coupling for simple data, less readable construction code.

---

## Clean Up Instance Bindings Between Tests

Reset container instance bindings in test teardown to prevent state leakage across tests.

---

## Category

Testing

---

## Rule

When using `$this->instance()` or `$this->swap()` in tests, call `$this->forgetInstance(Abstract::class)` or rely on test case teardown that resets the container between tests.

---

## Reason

Instance bindings are stored in the container's `$instances` array. Without cleanup, an instance binding from one test persists into the next, causing tests to receive stale mocks or unexpected implementations.

---

## Bad Example

```php
public function test_payment(): void
{
    $this->instance(Gateway::class, $fakeGateway);
    // Instance persists — next test receives $fakeGateway
}

public function test_other(): void
{
    $gateway = app(Gateway::class); // receives $fakeGateway from previous test
}
```

---

## Good Example

```php
public function test_payment(): void
{
    $this->instance(Gateway::class, $fakeGateway);
    // Run assertions
    $this->forgetInstance(Gateway::class);
    // Or rely on: parent::tearDown()
}
```

---

## Exceptions

Tests that use the same mock across all test methods may set up instance bindings in `setUp()`.

---

## Consequences Of Violation

Flaky tests, stale mock state, test pollution that causes false passes or failures depending on execution order.

---

## Never Reference Container in Serialized Job Payloads

Do not store container instances or container-resolved closures in serialized job payloads.

---

## Category

Reliability

---

## Rule

Queued job payloads must not contain container references, container-resolved closures, or any non-serializable container services. Only pass primitive values or serializable models.

---

## Reason

The container is not serializable. Storing it in a job payload causes serialization failures when the job is pushed to the queue. Closures that capture `$this` (the container) also fail serialization.

---

## Bad Example

```php
class ProcessOrder implements ShouldQueue
{
    public function __construct(
        private Closure $callback, // closure may capture container
    ) {}
}
```

---

## Good Example

```php
class ProcessOrder implements ShouldQueue
{
    public function __construct(
        private int $orderId,
    ) {}

    public function handle(OrderService $service): void
    {
        $service->process($this->orderId);
    }
}
```

---

## Exceptions

No common exceptions. Job payloads must always be serializable.

---

## Consequences Of Violation

`SerializationException` when queueing jobs, jobs that fail before execution, data loss in queues.

---

## Avoid Circular Dependencies Through Constructor Injection

Design dependency graphs to be acyclic. Break circular dependencies with method injection or the container's `afterResolving` callbacks.

---

## Category

Design

---

## Rule

Class A must not depend on class B which depends on class A, both through constructor injection. Detect and resolve circular dependency chains early in the design phase using `resolving` callbacks or method injection.

---

## Reason

The container detects circular dependencies via `$buildStack` with a maximum depth of 25. When a cycle is detected, it throws a `CircularDependencyException`. Circular dependencies indicate poor separation of concerns.

---

## Bad Example

```php
class A { public function __construct(private B $b) {} }
class B { public function __construct(private A $a) {} }
// Container throws: Circular dependency detected
```

---

## Good Example

```php
class A
{
    public function __construct(private B $b) {}
}

class B
{
    public function setA(A $a): void { $this->a = $a; }
}

// Break cycle: register B with afterResolving
$this->app->afterResolving(B::class, function ($b, $app) {
    $b->setA($app->make(A::class));
});
```

---

## Exceptions

Event dispatchers that dispatch events handled by the dispatching class's dependencies are acceptable if carefully managed.

---

## Consequences Of Violation

Runtime `CircularDependencyException`, application crashes at resolution time, inability to construct the object graph.
