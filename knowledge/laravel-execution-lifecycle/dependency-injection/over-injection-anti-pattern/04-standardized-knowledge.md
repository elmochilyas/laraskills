# Over-Injection Anti-Pattern

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | Over-Injection Anti-Pattern |
| Difficulty | Intermediate |
| Lifecycle Phase | Design Pattern |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Over-injection occurs when a class's constructor receives more dependencies than it should, typically 5-7 or more parameters. This is a design smell indicating the class has too many responsibilities — it violates the Single Responsibility Principle. The fix is not to switch to service locators (app()), but to refactor the class by grouping related dependencies into higher-level abstractions or splitting the class into smaller, focused classes.

## Core Concepts
- **Over-injection threshold**: More than 3-4 constructor parameters is a warning sign; more than 7 is a strong indicator of over-injection.
- **Responsibility bloat**: Each dependency represents a concern the class is coupled to — too many indicates the class does too much.
- **Not a container problem**: Over-injection is a design issue, not a container issue. Switching to `app()` makes it worse (hides the dependencies).
- **Refactoring direction**: Group related dependencies into value objects or facade services, or split the class along responsibility boundaries.
- **Parameter object pattern**: Bundle related dependencies (config, logger, metrics) into a single parameter object.

## When To Use
- For identifying classes that need refactoring — number of constructor parameters is a useful metric.
- During code review when a class has 5+ dependencies — discuss whether the class is doing too much.
- As a design principle when writing new classes — keep constructor parameters minimal.

## When NOT To Use
- As a hard rule — some classes legitimately need many dependencies (e.g., an HTTP client wrapper with config, logger, cache, serializer, metrics).
- To justify switching to service locator — `app()` hides dependencies but doesn't solve the design problem.
- For framework classes that follow a different pattern — controllers may inject multiple services because they orchestrate.

## Best Practices (WHY)
- **Target 3-4 constructor parameters maximum**: Beyond this, look for ways to group dependencies. *Why: Fewer parameters means clearer responsibilities and easier testing.*
- **Refactor by concern, not convenience**: Group dependencies that change together into a single abstraction. *Why: Cohesive groups reduce parameter count while maintaining explicit dependencies.*
- **Consider command/query separation**: A class with many methods may be doing too much — split it. *Why: Smaller classes with focused responsibilities naturally have fewer dependencies.*
- **Don't hide over-injection with app()**: Switching from constructor injection to service locator hides the problem. *Why: app() conceals the dependency count but the class still has too many responsibilities.*

## Architecture Guidelines
- Parameter count is a heuristic, not an absolute rule — examine what each dependency is used for.
- Related dependencies often appear together: `LoggerInterface + LogLevelConfig`, `CacheInterface + CacheConfig`.
- The Parameter Object pattern bundles related constructor parameters into a single typed object.
- The Facade Service pattern combines several low-level services into one higher-level service.
- Splitting a class along method boundaries naturally reduces constructor parameters per class.

## Performance
- Constructor parameter count does not directly affect resolution performance — each parameter still requires one resolution.
- The performance impact is indirect: over-injected classes are harder to cache effectively.
- Splitting classes may increase total resolution count (more `make()` calls) but improves maintainability.
- Over-injection is primarily a maintainability concern, not a performance concern.

## Security
- Classes with many dependencies are harder to audit for security — each dependency is a potential attack surface.
- Over-injected classes may leak capabilities through their many dependencies.
- Security-critical code should have clearly scoped dependencies — over-injection obscures which dependencies handle sensitive operations.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Using app() to reduce parameter count | "Too many parameters, let me just pull them" | Hidden dependencies; harder to test | Refactor into smaller classes or group dependencies |
| Ignoring over-injection smell | "It works, let's merge" | Maintainability debt grows over time | Refactor before adding more features |
| Bundling unrelated dependencies | Creating a generic "services" parameter | Single parameter hides many concerns | Group related dependencies only |
| Splitting at wrong boundary | Splitting class but dependencies duplicate | Same dependencies in multiple split classes | Identify natural separation of concerns |

## Anti-Patterns
- **Parameter count tolerance creep**: Allowing 8 parameters because "one more won't hurt" — sets a precedent.
- **Hiding over-injection behind a "config" object**: Passing a generic `Config $config` that contains unrelated settings.
- **Injecting the container**: `Container $container` as a single parameter to avoid listing all dependencies — the worst form of over-injection.

## Examples
```php
// Over-injected — 6 parameters
class OrderService
{
    public function __construct(
        private OrderRepository $orders,
        private PaymentGateway $payment,
        private LoggerInterface $logger,
        private MailService $mail,
        private AnalyticsService $analytics,
        private CacheInterface $cache,
    ) {}
}

// Refactored — 3 parameters with grouped concerns
class OrderService
{
    public function __construct(
        private OrderRepository $orders,
        private PaymentGateway $payment,
        private NotificationService $notifications, // groups logger + mail + analytics
    ) {}
}
```

## Related Topics
- **Prerequisites:** Constructor Injection — the pattern that makes over-injection visible.
- **Closely Related:** Service Locator Anti-Pattern — the wrong way to "fix" over-injection.
- **Advanced:** Injection Guidelines by Class Type — appropriate dependency counts per class type.
- **Cross-Domain:** Single Responsibility Principle, Class Design.

## AI Agent Notes
- Over-injection is detectable by static analysis — PHPStan rules can flag constructors with more than N parameters (typically 5+).
- The parameter count is a design heuristic, not a hard rule — some classes legitimately need many dependencies.
- Tools like PhpMetrics can measure "class coupling" and "weighted method count" to identify over-injected classes.
- The Parameter Object pattern (Joshua Bloch, Effective Java) is the standard refactoring for over-injection.
- Over-injection is correlated with high cyclomatic complexity — both indicate a class doing too much.

## Verification
- [ ] No class has more than 5 constructor parameters (exceptions justified)
- [ ] Related dependencies are grouped into higher-level services where appropriate
- [ ] No class uses `Container $container` or `app()` to hide over-injection
- [ ] CI pipeline flags constructors with excessive parameters
- [ ] Over-injected classes are refactored during normal development, not deferred
