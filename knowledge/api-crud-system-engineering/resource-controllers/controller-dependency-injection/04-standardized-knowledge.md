| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Controller Dependency Injection |
| **Metadata** | Difficulty | Foundation |
| **Metadata** | Dependencies | Service Container Fundamentals, Controller Basics |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Laravel's service container automatically resolves dependencies defined in controller constructors. Any class type-hinted in the constructor is instantiated and injected by the container, including repository classes, service classes, and configuration bindings. This eliminates manual instantiation and enables dependency inversion at the controller boundary.

## Core Concepts

- **Auto-Resolution**: The container recursively resolves constructor parameters without explicit configuration for most classes.
- **Constructor Type-Hinting**: Any concrete class or interface in the constructor is injected automatically.
- **Contextual Binding**: Different controllers can receive different implementations of the same interface.
- **Unshared Instances**: Controllers are instantiated once per request, so constructor dependencies are fresh every request.
- **Explicit vs Implicit Binding**: Concrete classes resolve implicitly; interfaces require `app()->bind()` in a service provider.

## When To Use

- All controllers that need external services, repositories, loggers, or any injectable dependency.
- When the same dependency is used in multiple controller methods.
- When you need to swap implementations per controller (contextual binding).
- When testing and you need to mock dependencies.

## When NOT To Use

- For dependencies valid only for a single action — use method injection instead.
- For `Request` objects — these are not fully initialized at constructor time.
- For simple strings or scalar values — these require explicit binding.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Keep constructor to 3-4 dependencies max | More indicates the controller does too much (SRP violation) |
| Use PHP 8 constructor promotion for concise syntax | `private readonly Service $service` is clean and declarative |
| Register all interface bindings in one service provider | Prevents scattered binding configuration |
| Inject action classes, not repositories, after delegation pattern | Controllers should delegate, not directly query |
| Never inject `Request` in the constructor | Request is not fully initialized; use method injection |

## Architecture Guidelines

- Controller constructors are the dependency manifest — what the controller needs is visible at a glance.
- Use interfaces in constructor signatures for testability and contextual binding.
- Register contextual bindings in `AppServiceProvider` using `app()->when(C::class)->needs(I::class)->give(...)`.
- Test every route to catch missing container bindings before deployment.
- Use `scoped()` bindings (Laravel 11+) for request-scoped singletons.

## Performance Considerations

- Reflection-based resolution has a one-time cost per class; the container caches the parameter list.
- Constructor injection has zero per-request overhead beyond normal PHP object construction.
- Using `app()->make()` inside methods bypasses caching and forces re-resolution.

## Security Considerations

- Unresolved bindings throw `BindingResolutionException` at runtime — catch and handle appropriately.
- Circular dependencies in constructor graphs cause infinite loops or nesting limit errors.
- Singleton bindings retain state across requests — use `scoped()` for request-scoped state.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Injecting `Request` in constructor | Natural instinct | Request not fully initialized; properties empty | Use method injection |
| Constructor explosion (8+ parameters) | Accumulating dependencies over time | Hard to read, harder to test | Group into service/action classes |
| Using `app()` helper inside methods | Convenience | Hides dependencies from constructor signature | Declare in constructor |

## Anti-Patterns

- **Using `app()->make()` in controller methods**: Hides dependencies; makes signature misleading.
- **No interface binding for shared services**: Tight coupling to concrete implementations.
- **Injecting every possible dependency**: Violates SRP; signals the controller does too much.
- **Scattered binding definitions across providers**: Hard to audit and maintain.

## Examples

- **Standard injection**: `__construct(private PhotoRepository $photos) {}`
- **Interface binding**: `__construct(private RepositoryInterface $repo) {}` with contextual binding per controller.
- **Automatic resolution**: `__construct(private LoggerInterface $logger) {}` — Laravel auto-resolves from config.
- **Contextual binding**: `app()->when(PhotoController::class)->needs(RepoInterface::class)->give(PhotoRepo::class)`

## Related Topics

- Controller Method Injection — Per-action dependency injection
- Controller Form Request Integration — Form request resolution via method injection
- Controller Action Delegation — Injecting action classes instead of repositories

## AI Agent Notes

- Always use constructor injection for shared dependencies used in multiple methods.
- Use method injection for action-specific dependencies (form requests, single-use services).
- Keep controller constructors to 3-4 parameters max.
- Generate controllers with constructor promotion syntax.

## Verification

- [ ] No `Request` objects injected in constructors
- [ ] Constructor has ≤4 injected dependencies
- [ ] All interface bindings are registered in a service provider
- [ ] No `app()->make()` calls in controller methods
- [ ] Missing bindings are caught by feature tests for every route
- [ ] Circular dependencies are detected and resolved
