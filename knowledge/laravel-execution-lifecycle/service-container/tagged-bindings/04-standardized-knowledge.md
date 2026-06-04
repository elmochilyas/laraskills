# Tagged Bindings

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Container |
| Knowledge Unit | Tagged Bindings |
| Difficulty | Advanced |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Tagged bindings allow grouping multiple service container bindings under a common tag name, enabling batch resolution of all services sharing that tag. Implemented through `Container::tag()` and resolved via `Container::tagged()`, this feature provides a registration-time mechanism for service collections without requiring a dedicated registry class. The critical engineering decision is that tag resolution returns a lazy collection — services are not resolved at tag time but when the collection is iterated. This prevents eager resolution of all tagged services at registration time, deferring construction until the services are actually used.

## Core Concepts
- **`tag()`** — Associates one or more abstract names with a tag: `$this->app->tag([ServiceA::class, ServiceB::class], 'reports')`.
- **`tagged()`** — Returns an `Illuminate\Support\Collection` of resolved instances: `$this->app->tagged('reports')`.
- **Lazy Resolution** — Tagged services are resolved when the collection is iterated, not when `tagged()` is called.
- **Variadic Injection** — Tagged bindings naturally support variadic constructor parameters: `ReportService ...$services`.
- **Tag Overlap** — A binding can belong to multiple tags.

## When To Use
- Collecting multiple implementations of the same interface for sequential processing (pipeline, chain of responsibility).
- Batch registration of event listeners, commands, or middleware from multiple providers.
- Variadic constructor parameters where you need all registered implementations injected.
- Reporting/monitoring where you need to iterate all services of a category.

## When NOT To Use
- When a single service instance is needed (use standard `bind()` or `make()`).
- When services need to be resolved eagerly at registration time (use `tagged()` inside `boot()`).
- When tag membership needs to be dynamic at runtime (tags are static — defined at registration).

## Best Practices
- **Use tags for service collections** — Instead of a dedicated registry class that collects services, tag them and resolve with `tagged()`.
- **Combine tags with variadic constructors** — Constructor injection with variadic parameters on tagged types enables clean dependency injection of collections.
- **Use descriptive tag names** — Tags are string keys; use namespaced conventions like `'reports.generators'`, `'commands.maintenance'`.
- **Leverage lazy resolution** — The collection returned by `tagged()` resolves services lazily on iteration, avoiding construction of unused services.
- WHY: Tagged bindings eliminate the need for manual collection registries, enabling SRP-compliant service registration where each provider tags its services and consumers iterate the tag.

## Architecture Guidelines
- Tags are stored in a `$tags` array: `$tags[tagName] = [abstract1, abstract2, ...]`.
- `tagged()` returns a `Collection` with a `lazy` resolve mechanism — each `make()` call happens on first access.
- A binding can belong to multiple tags; tag resolution is intersection-free (each tag is independent).
- Tags are defined at registration time — they cannot be modified at resolution time.

## Performance Considerations
- `tag()` registration is O(1) per abstract-tag pair — an array push.
- `tagged()` returns immediately (Collection wrapper); resolution cost is deferred until iteration.
- Each service resolved during iteration pays full `make()` cost (reflection, extenders, callbacks).
- With 50 tagged services where only 5 are used per request, lazy resolution saves 45 `make()` calls.

## Security Considerations
- Tags are string identifiers; avoid encoding sensitive information in tag names.
- Services resolved via `tagged()` still go through the full container pipeline — security extenders and callbacks apply.
- Ensure tagged services that handle sensitive data are not iterated in unauthenticated contexts.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Assuming `tagged()` resolves eagerly | Default collection behavior | Tagged services resolved early, increasing bootstrap time | Iterate lazily; only resolve what's needed |
| Tagging interfaces without bindings | Interface should be bound first | `tagged()` returns empty collection or fails | Register bindings before tagging |
| Not using variadic injection with tags | Manual iteration of `tagged()` | More code, harder to test | Use variadic constructor params with tags |

## Anti-Patterns
- **Tagging Concrete Classes** — Tag interfaces or abstract contracts, not concrete classes.
- **Dynamic Tag Membership** — Trying to add/remove bindings from a tag at runtime (tags are static).
- **Eager Tag Resolution in Boot** — Calling `tagged()->each()` in `boot()` defeats lazy resolution purpose.

## Examples

### Tag registration
```php
$this->app->tag([
    PullReportGenerator::class,
    PushReportGenerator::class,
    CsvReportGenerator::class,
], 'reports.generators');
```

### Lazy tagged resolution
```php
$generators = $this->app->tagged('reports.generators');
foreach ($generators as $generator) {
    $generator->generate();
    // Each generator is resolved here, not earlier
}
```

### Variadic injection with tags
```php
class ReportProcessor {
    public function __construct(
        protected ReportGenerator ...$generators
    ) {}
    // All tagged 'reports.generators' are injected
}
```

## Related Topics
- **Prerequisites:** Container Fundamentals, Binding Types, Binding Resolution
- **Closely Related:** Contextual Binding, Binding Extending
- **Advanced:** Resolution Callbacks, Auto-Resolution via Reflection
- **Cross-Domain:** Service Providers (tag registration in providers)

## AI Agent Notes
- When troubleshooting empty `tagged()` collections, check that bindings are registered before `tag()` calls.
- Tags are great for Chain of Responsibility patterns — register handlers via tags, iterate in order.
- Lazy resolution means iterating `tagged()` twice resolves services twice; cache the collection if needed.

## Verification
- [ ] Can register and resolve tagged bindings correctly
- [ ] Understand lazy resolution behavior of `tagged()`
- [ ] Know how to combine tags with variadic constructor injection
- [ ] Can explain the storage structure (`$tags[tagName][abstracts]`)
- [ ] Can decide when to use tags vs a dedicated registry class
