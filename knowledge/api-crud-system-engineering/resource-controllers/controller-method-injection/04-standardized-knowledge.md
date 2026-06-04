| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Controller Method Injection |
| **Metadata** | Difficulty | Foundation |
| **Metadata** | Dependencies | Service Container Fundamentals, Controller Dependency Injection |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Beyond constructor injection, Laravel also supports injecting dependencies directly into controller methods. The container resolves type-hinted parameters in controller methods on every call, providing per-action dependencies specific to that endpoint. This is most commonly used for `Illuminate\Http\Request` instances and form requests, but works for any class the container can resolve.

## Core Concepts

- **Per-Action Resolution**: Dependencies are resolved fresh on every method call, not cached per request.
- **Type-Hinted Parameters**: Any parameter the container can resolve is automatically injected.
- **Route Model Binding Integration**: Model bindings are resolved before method injection.
- **Mixed Parameters**: Method injection and route parameters coexist — Laravel differentiates by type-hint and parameter name.
- **Request as Primary Example**: `public function store(StorePhotoRequest $request)` — the most common use case.

## When To Use

- Dependencies used by only one or two methods (avoids constructor clutter).
- `Request` objects and form requests (cannot be constructor-injected — not fully initialized).
- Action-specific services needed only by a single endpoint.
- Optional dependencies with default values (`?LoggerInterface $logger = null`).

## When NOT To Use

- Dependencies used in three or more methods — use constructor injection.
- Services that are expensive to construct — constructor injection is more efficient.
- Dependencies that should be stateful across methods — constructor injection provides a single instance.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Use constructor injection for shared deps, method injection for action-specific | Keeps constructor lean without hiding per-action dependencies |
| Never inject `Request` in the constructor | Request is populated after controller instantiation |
| Keep method parameter order: form request first, then route bindings, then services | Standardized signature improves readability |
| Use type-hints for injectable params; leave route params untyped | Prevents parameter collision between route and container resolution |
| Test that methods can be called with both route and service parameters | Ensures injection chain works correctly |

## Architecture Guidelines

- Prefer constructor injection for dependencies used in 3+ methods; method injection for 1-2 method dependencies.
- Document the distinction between route parameters and injected services in team conventions.
- Use PHP 8 attributes (`#[RouteParameter]`) for clarity if available.
- Avoid method injection of request-scoped singletons that maintain mutable state across calls.

## Performance Considerations

- Container `call()` uses reflection once per route, then caches the result.
- Method injection overhead: ~0.1-0.3ms per call for simple services.
- Form request validation adds its own overhead (1-5ms depending on rules).
- Route model binding (database query) dominates performance, not the injection mechanism.

## Security Considerations

- Route parameter name vs service type-hint collisions: a route param `{logger}` can conflict with `LoggerInterface $logger`.
- Always type-hint injectable parameters; untyped parameters receive route values.
- Form request's `authorize()` returns 403 silently if authorization fails.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Confusing route params and injected services | Both use the same parameter list | Route value injected instead of container-resolved service | Use distinct naming; type-hint services |
| Method-injecting a dependency used in all methods | Avoiding constructor parameter growth | Cluttered method signatures, re-resolution overhead | Inject shared deps in constructor once |
| Forgetting `$request` param when using form request | Mixing form request data and route params | Logic bugs when route and request diverge | Use form request for input, route binding for models |

## Anti-Patterns

- **Injecting the same dependency in every method**: Should be constructor-injected.
- **No type-hints on injectable parameters**: Untyped params receive route values instead.
- **Method injection of the `Request` in addition to a form request**: Redundant; form request extends Request.
- **Inconsistent parameter ordering across methods**: Confuses readers and makes patterns harder to recognize.

## Examples

- **Form request injection**: `public function store(StorePhotoRequest $request) { ... }`
- **Route binding + service**: `public function show(Photo $photo, PhotoViewService $viewer) { ... }`
- **Multiple services**: `public function index(PhotoFilterService $filter, PhotoCacheService $cache) { ... }`
- **Optional service**: `public function show(Photo $photo, ?LoggerInterface $logger = null) { ... }`

## Related Topics

- Controller Dependency Injection — Constructor injection for shared dependencies
- Controller Form Request Integration — Form request resolution via method injection
- Route Model Binding — How route parameters resolve to models

## AI Agent Notes

- Default to constructor injection; use method injection only for action-specific dependencies.
- Always inject form requests via method injection (never constructor).
- Ensure type-hints are present on all injectable parameters.
- For new endpoints, use method injection for all single-use services.

## Verification

- [ ] No `Request` objects injected in constructors
- [ ] Shared dependencies (3+ methods) use constructor injection
- [ ] Action-specific dependencies use method injection
- [ ] All injectable parameters have type-hints
- [ ] Route parameter names don't collide with service type-hints
- [ ] Method injection works correctly with route caching enabled
