# Always Bind Interfaces Explicitly — Never Rely on Auto-Resolution
---
## Category
Reliability
---
## Rule
Never type-hint an interface or abstract class without registering an explicit binding in a service provider.
---
## Reason
Auto-resolution only works for concrete classes. Interfaces and abstract classes are not instantiable — the container throws `TargetInterfaceNotInstantiableException` when it encounters an unresolvable abstraction.
---
## Bad Example
```php
class PaymentService
{
    public function __construct(
        private PaymentGatewayInterface $gateway, // No binding — will throw
    ) {}
}
```
---
## Good Example
```php
// In service provider
$this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);

class PaymentService
{
    public function __construct(
        private PaymentGatewayInterface $gateway,
    ) {}
}
```
---
## Exceptions
No common exceptions. All abstractions must have explicit bindings.
---
## Consequences Of Violation
`TargetInterfaceNotInstantiableException` at resolution; application crash.

---

# Provide Defaults for Primitive Constructor Parameters
---
## Category
Reliability
---
## Rule
Always provide default values for scalar constructor parameters (int, string, array) that lack explicit primitive bindings.
---
## Reason
Auto-resolution cannot resolve scalar types. Without a type-hint, a binding, or a default value, the container cannot determine what value to inject and throws `BindingResolutionException`.
---
## Bad Example
```php
class ReportService
{
    public function __construct(
        private int $pageSize, // No type resolution possible for int
    ) {}
}
```
---
## Good Example
```php
class ReportService
{
    public function __construct(
        private int $pageSize = 25, // Default fallback
    ) {}
}
```
---
## Exceptions
When an explicit primitive binding is always registered via `when()->needs('$paramName')->give(value)`.
---
## Consequences Of Violation
`BindingResolutionException` when the class is resolved without a matching binding.

---

# Use Explicit Singletons for Hot-Path Auto-Resolved Classes
---
## Category
Performance
---
## Rule
Register classes resolved on every request as singletons to avoid per-request Reflection overhead from auto-resolution.
---
## Reason
Auto-resolution re-inspects the constructor via Reflection on every `make()` call. For classes resolved per-request, this cost accumulates. A singleton binding pays the Reflection cost once.
---
## Bad Example
```php
// Every request triggers Reflection on OrderProcessingService
$service = app(OrderProcessingService::class);
```
---
## Good Example
```php
// In service provider
$this->app->singleton(OrderProcessingService::class);

// No Reflection cost on subsequent resolutions
$service = app(OrderProcessingService::class);
```
---
## Exceptions
Classes with per-request mutable state must not be singletons.
---
## Consequences Of Violation
Per-request Reflection overhead; measurable latency in high-throughput applications.

---

# Avoid Over-Reliance on Auto-Resolution
---
## Category
Maintainability
---
## Rule
Do not use auto-resolution as the default strategy for all classes. Register explicit bindings for architectural boundaries like repositories, gateways, and services.
---
## Reason
Auto-resolution creates brittle code — a constructor parameter change silently affects all resolution paths. Explicit bindings make the dependency graph visible, testable, and resilient to refactoring.
---
## Bad Example
```php
// No bindings at all — relying entirely on auto-resolution
class OrderService
{
    public function __construct(
        private Logger $log,
        private PaymentGateway $payment,
        private Mailer $mail,
    ) {}
}
```
---
## Good Example
```php
// Explicit binding for the important architectural boundary
$this->app->singleton(PaymentGateway::class);

class OrderService
{
    public function __construct(
        private Logger $log,          // Auto-resolved — safe
        private PaymentGateway $payment, // Explicit binding — intentional
        private Mailer $mail,         // Auto-resolved — safe
    ) {}
}
```
---
## Exceptions
Prototyping and simple applications where the dependency graph is small and well-understood.
---
## Consequences Of Violation
Brittle resolution; silent breakage on constructor changes; difficult debugging.

---

# Design Dependency Graphs to Avoid Circular Chains
---
## Category
Architecture
---
## Rule
Ensure auto-resolution chains form a Directed Acyclic Graph with no circular dependencies.
---
## Reason
Auto-resolution recurses through the dependency tree depth-first. If class A depends on B, B depends on C, and C depends on A, the container detects the cycle in `$buildStack` and throws `CircularDependencyException`.
---
## Bad Example
```php
class A { public function __construct(private B $b) {} }
class B { public function __construct(private C $c) {} }
class C { public function __construct(private A $a) {} } // Cycle!
```
---
## Good Example
```php
class A { public function __construct(private SharedDependency $shared) {} }
class B { public function __construct(private SharedDependency $shared) {} }
class C { public function __construct(private SharedDependency $shared) {} }
// No cycle — all depend on shared abstraction
```
---
## Exceptions
No common exceptions. Circular dependencies must always be resolved by structural refactoring.
---
## Consequences Of Violation
`CircularDependencyException`; application crash; forced debugging of dependency graph.

---

# Let Concrete Classes Auto-Resolve — Do Not Over-Bind
---
## Category
Code Organization
---
## Rule
Do not register explicit bindings for concrete classes with resolvable constructors — let auto-resolution handle them.
---
## Reason
Auto-resolution resolves concrete classes automatically. Adding `bind(Concrete::class, Concrete::class)` creates unnecessary noise in service providers without changing behavior.
---
## Bad Example
```php
$this->app->bind(Logger::class, Logger::class);
$this->app->bind(Cache::class, Cache::class);
```
---
## Good Example
```php
// No binding needed — auto-resolution works
class ReportService
{
    public function __construct(
        private Logger $log,
        private Cache $cache,
    ) {}
}
// app(ReportService::class) works without any binding
```
---
## Exceptions
When lifecycle control is needed — use `singleton()` for a concrete class.
---
## Consequences Of Violation
Unnecessary service provider clutter; harder to identify true intentional bindings.
