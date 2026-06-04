# Injection Guidelines by Class Type

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | Injection Guidelines by Class Type |
| Difficulty | Intermediate |
| Lifecycle Phase | Design Pattern |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Different class types in Laravel have different conventions and best practices for how dependencies should be injected. Controllers, jobs, listeners, middleware, commands, and services each follow specific patterns — some use constructor injection, others use method injection, and some (like Blade directives and route closures) rely on facades or helpers. This KU provides a quick-reference guide for choosing the right injection strategy per class type.

## Core Concepts
- **Class type determines injection strategy**: Controllers can use both constructor and method injection; listeners use method injection; services always use constructor injection.
- **Container-resolved classes**: Most class types resolved by the container support constructor injection automatically.
- **Framework-invoked methods**: Methods called by the framework (controller actions, event handlers, job handle()) support method injection.
- **Static contexts**: Blade directives, service providers, and facades cannot use constructor injection — they use the container directly.
- **Injection availability**: Not all class types have access to the full container — middleware has limited access during early bootstrap.

## When To Use
- When creating a new class — consult the guidelines for the appropriate injection pattern.
- When refactoring existing code — ensure the injection strategy matches the class type's conventions.
- When onboarding new developers — provide a reference for which injection pattern to use where.

## When NOT To Use
- As rigid rules — conventions may vary by team or project preferences.
- When introducing new class types not covered — follow the closest matching pattern.
- When the guidelines conflict with team-specific coding standards — team conventions take priority.

## Best Practices (WHY)
- **Controllers**: Constructor injection for shared services, method injection for action-specific services and Request. *Why: Controllers may have 2-3 actions needing different services — constructor for shared, method for specific.*
- **Jobs**: Constructor injection for services (serialized with the job), method injection in handle() for non-serializable services. *Why: Job constructor dependencies are serialized to the queue; handle() dependencies are resolved at execution time.*
- **Listeners**: Method injection in handle() — the event instance and additional services. *Why: Listeners are resolved fresh per event — method injection keeps the registration simple.*
- **Middleware**: Constructor injection for dependencies, handle() receives $request and $next. *Why: Middleware is resolved per-request — constructor injection works for all dependencies.*
- **Services/Repositories**: Constructor injection exclusively — never use app() in business logic. *Why: Business logic should have explicit, visible dependencies for clarity and testability.*

## Architecture Guidelines

| Class Type | Injection Pattern | Notes |
|------------|------------------|-------|
| Controllers | Constructor + Method injection | Method injection for action-specific deps; constructor for shared |
| Jobs | Constructor injection (serialized) + Method injection (handle()) | Constructor deps serialized to queue |
| Listeners | Method injection (handle()) | Event instance is always first parameter |
| Middleware | Constructor injection | handle($request, $next, ...$params) |
| Commands | Constructor injection + handle() injection | Both supported; handle() for runtime deps |
| Service Providers | Method injection (boot()) | register() should not resolve anything |
| Blade Directives | Container resolution via app() | No constructor injection available |
| Route Closures | Dependency injection in closure params | Type-hinted params resolved by container |
| Facades | N/A — proxy pattern | Use shouldReceive() for testing |
| Event Subscribers | Method injection (subscribe()) | Subscribe method receives events dispatcher |
| Mailables | Constructor injection | Dependencies resolved when queued |
| Notifications | Constructor injection | Dependencies resolved when sent |
| Form Requests | Method injection | Type-hinted dependencies in rules/authorize |
| Rules (Validation) | Constructor injection | Dependencies injected when instantiated |

## Performance
- Method injection adds ~0.01-0.03ms per method call for Reflection-based resolution.
- Constructor injection with singletons pays resolution cost once per process lifetime (FPM) or once per worker (Octane).
- Heavy constructor dependencies in queued jobs (Jobs, Mailables, Notifications) are serialized — large dependency graphs increase queue payload size.

## Security
- Security-related class types (Middleware, Form Requests, Gates) should always use constructor injection — never app() — for clear dependency visibility.
- Jobs and listeners that handle sensitive data should inject security services explicitly rather than pulling them.
- Blade directives and facades bypass dependency controls — avoid injecting security-sensitive services into static contexts.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Constructor injection in listener | Listener depends on services in constructor | Services resolved when listener registered, not when event fires | Use method injection in handle() |
| Method injection for shared controller deps | Same service injected in every action method | Duplicated type-hints across methods | Inject once in controller constructor |
| app() in service class | Using app() in domain services | Hidden dependencies; hard to test | Use constructor injection |
| Constructor injection in Blade directive | Directives are not resolved by container | Dependencies never injected | Use app() from directive class |

## Anti-Patterns
- **One-size-fits-all injection**: Using constructor injection for ALL class types without considering each type's conventions — listeners and jobs have different optimal patterns.
- **Serialized bloat**: Injecting heavy services (full container, repository with all methods) into queued job constructors — increases queue payload size.
- **Static context misuse**: Using facades or app() in places where constructor injection would work (e.g., services that are always created by the container).

## Examples
```php
// Controller: constructor + method injection
class OrderController
{
    public function __construct(
        private OrderService $orders, // shared across actions
    ) {}

    public function store(CreateOrderRequest $request, OrderService $orders)
    {
        // method injection for action-specific use
    }
}

// Job: constructor + method injection
class ProcessOrder implements ShouldQueue
{
    public function __construct(
        private Order $order,          // serialized to queue
    ) {}

    public function handle(LoggerInterface $logger) // resolved at execution
    {
        $logger->info('Processing order: ' . $this->order->id);
    }
}
```

## Related Topics
- **Prerequisites:** Constructor Injection, Method Injection — the two primary injection patterns.
- **Closely Related:** Service Locator Anti-Pattern — when and why to avoid app().
- **Advanced:** Container::call() — the engine behind method injection.
- **Cross-Domain:** Laravel Class Architecture — the different class types and their lifecycle.

## AI Agent Notes
- The framework determines which injection pattern to use based on how the class is invoked.
- Controllers use `Container::call()` for method injection; services use `Container::make()` for constructor injection.
- Queued job constructor dependencies are serialized — use `ShouldQueue` with caution for heavy dependency graphs.
- Blade directives are closures registered by the framework — they have no container resolution and must use `app()`.
- The injection pattern for a class type may evolve between Laravel versions — verify against the current framework source.

## Verification
- [ ] Controllers use constructor injection for shared services, method injection for action-specific
- [ ] Jobs use constructor injection for serialized data, handle() injection for runtime services
- [ ] Listeners use method injection in handle(), not constructor injection
- [ ] Services and repositories use constructor injection exclusively
- [ ] Blade directives and static contexts use app() when no constructor injection is available
