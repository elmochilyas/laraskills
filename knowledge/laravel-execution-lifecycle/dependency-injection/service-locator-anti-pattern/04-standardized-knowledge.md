# Service Locator Anti-Pattern

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | Service Locator Anti-Pattern |
| Difficulty | Intermediate |
| Lifecycle Phase | Design Pattern |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
The Service Locator anti-pattern occurs when a class pulls its dependencies from a global registry — typically the service container via `app()`, `resolve()`, or `App::make()` — instead of declaring them explicitly in its constructor. While convenient, this approach hides dependencies, makes the class harder to test, and couples the class to the container itself. Laravel's facade system is an intentional, documented service locator, but using `app()` in business logic classes is considered an anti-pattern.

## Core Concepts
- **Service Locator**: A design pattern where a class requests dependencies from a centralized registry rather than receiving them via injection.
- **Hidden dependencies**: Dependencies pulled via `app()->make()` are invisible in the class signature — they only appear in the method body.
- **Testability cost**: To swap a dependency in tests, you must configure the container before each test, not just pass a constructor argument.
- **Container coupling**: The class depends on the container being available, making it unusable outside a Laravel context.
- **Legitimate vs illegitimate use**: Controllers and route closures can use `app()` in limited cases; domain services and repositories should never use it.

## When To Use
- In service provider `register()` methods — pulling services from the container for configuration is expected.
- In testing utilities where you explicitly want container access.
- In top-level route closures for rapid prototyping (then refactor).

## When NOT To Use
- In domain services, repositories, actions, or any class that represents business logic.
- In classes that are injected into controllers — they should receive dependencies via constructor.
- When the dependency is used in multiple methods — pulling it inside each method is redundant.

## Best Practices (WHY)
- **Declare all dependencies in the constructor**: Make every collaborator visible in the class signature. *Why: Explicit dependencies enable static analysis, IDE autocompletion, and clear documentation of requirements.*
- **Never call app() in business logic**: Controllers, services, repositories should receive dependencies via injection. *Why: app() hides dependencies and couples to the container — the two main drawbacks of the pattern.*
- **Use facades sparingly and consciously**: Accept that facades are service locators — use them in views, route files, and controllers, but avoid in domain logic. *Why: Facades have testing support via shouldReceive(), but still hide dependencies.*
- **Refactor app() calls as you find them**: When modifying a class that uses app(), extract the dependency to the constructor. *Why: Incremental improvement over time reduces technical debt without massive rewrites.*

## Architecture Guidelines
- Dependency injection should be the default pattern for all classes resolved by the container.
- `app()` helper should only appear in service providers, configuration files, and top-level route files.
- Classes that accept `Container $container` and use it to resolve dependencies are disguised service locators.
- Real-time facades provide service locator access without explicit facade classes — they are still service locators.
- The `resolve()` helper function and `App::make()` are equivalent to `app()` — all are service locators.

## Performance
- `app()` calls add negligible direct overhead (~0.001ms per call).
- The real cost is indirect: hidden dependencies may be resolved multiple times in different methods if not cached.
- Service locator usage prevents the container from optimizing resolution order.
- In Octane, `app()` calls still work but may return stale instances if the container's scoped bindings are not properly flushed.

## Security
- Service locator access to the container bypasses access controls — any code with container access can resolve any bound service.
- Classes using service locators are harder to audit for security because dependencies are not visible in the class signature.
- Service locator usage in security-critical code (auth, middleware) should be replaced with explicit injection.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| app() in service class | Convenience during development | Hidden dependency; hard to test | Inject via constructor |
| Passing app() result to method | `$service->process(app(Logger::class))` | Dependency hidden in caller | Inject Logger in service constructor |
| Controller pulls services inline | `$report = app(ReportService::class)` in controller method | Hidden dependency; mocking requires container config | Inject in controller constructor |
| Facade in domain service | `Cache::get('key')` in repository | Service locator hidden behind facade syntax | Inject CacheInterface in constructor |

## Anti-Patterns
- **Container as dependency**: `class OrderService { public function __construct(Container $container) { ... } }` — this is a disguised service locator; the class pulls what it needs from the container.
- **Inline resolution**: Calling `app()->make()` inside a loop in business logic — repeated hidden resolution with no caching.
- **Mixed pattern**: Some dependencies injected, others pulled via app() — inconsistent and confusing.
- **Service locator in tests**: Using `app()->make()` in test assertions instead of injecting mocked dependencies.

## Examples
```php
// Anti-pattern: service locator in business logic
class OrderService
{
    public function process(Order $order)
    {
        $payment = app(PaymentGateway::class); // HIDDEN dependency
        $logger = app(Logger::class);           // HIDDEN dependency
        $payment->charge($order->total);
        $logger->info('Order processed');
    }
}

// Correct: explicit constructor injection
class OrderService
{
    public function __construct(
        private PaymentGateway $payment,
        private LoggerInterface $logger,
    ) {}

    public function process(Order $order)
    {
        $this->payment->charge($order->total);
        $this->logger->info('Order processed');
    }
}
```

## Related Topics
- **Prerequisites:** Constructor Injection — the correct alternative to service locators.
- **Closely Related:** Facade Architecture — Laravel's intentional, documented service locator.
- **Advanced:** Testing with Container — how to test classes using service locators vs injection.
- **Cross-Domain:** Code Quality and Design Patterns.

## AI Agent Notes
- The `app()` helper is defined in `src/Illuminate/Foundation/helpers.php` and calls `Container::getInstance()->make()`.
- `resolve()` is an alias for `app()` — same behavior, different name.
- Laravel's facades are documented as service locators with the tradeoff explicitly stated in the docs.
- Tools like PHPStan with `larastan` can detect `app()` calls in business logic and flag them.
- To find service locator usage: grep for `app(`, `resolve(`, `App::make(` in `app/` directory.

## Verification
- [ ] No `app()` or `resolve()` calls exist in business logic classes
- [ ] All dependencies are declared in constructor signatures
- [ ] Facade usage is limited to controllers, views, and route files
- [ ] No class accepts `Container $container` as a constructor dependency
- [ ] CI pipeline (PHPStan/deptrac) flags service locator usage in domain code
