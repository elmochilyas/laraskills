# Contextual Binding

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Container |
| Knowledge Unit | Contextual Binding |
| Difficulty | Advanced |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Contextual binding enables different implementations of the same interface to be injected depending on which class is consuming the dependency. Implemented through the `when()->needs()->give()` fluent API, this feature provides context-specific resolution without modifying the consuming classes — they all type-hint the same interface but receive different concrete implementations based on their identity. The critical engineering decision is that contextual binding uses array-keyed storage (`$contextual[$concrete][$abstract]`) rather than closure-based resolution, enabling O(1) lookup at resolution time. The tradeoff is that contextual bindings are checked after the instances cache, meaning cached singletons are shared regardless of context.

## Core Concepts
- **when()->needs()->give()** — Fluent API: specify consumer class, abstract dependency, and concrete implementation.
- **Contextual Storage** — `$contextual` array: `[ConsumerClass => [AbstractInterface => ConcreteClass]]`.
- **Resolution Integration** — Checked in `resolve()` after alias normalization but before instances cache (for contextual builds).
- **Contextual Build Flag** — `$needsContextualBuild` tells the container to skip instances cache when context is active.
- **Primitive Contextual Binding** — `give()` can return primitive values (strings, ints, arrays), not just class names.

## When To Use
- Different controllers needing different implementations of the same interface.
- Testing — overriding a dependency for a specific consumer without affecting other consumers.
- Multi-tenant applications where different contexts require different service configurations.
- Replacing factory pattern where consumers would otherwise need to call a factory with parameters.

## When NOT To Use
- When all consumers need the same implementation (use standard `bind()` instead).
- When the binding decision depends on runtime request data (use middleware + scoped binding).
- Overusing contextual binding for every variation — consider if separate interfaces better model the domain.

## Best Practices
- **Prefer contextual binding over factories** — The `when()->needs()->give()` pattern eliminates conditional wiring and adheres to the Open/Closed Principle.
- **Use contextual binding for interface-based variation** — Different concrete implementations for the same interface based on consumer.
- **Avoid contextual binding for runtime data** — If the binding decision depends on request data, use middleware to set a scoped binding.
- **Test contextual bindings explicitly** — Write a test that resolves the consumer and verifies the correct concrete is injected.
- WHY: Contextual binding is the cleanest way to implement the Strategy pattern without conditional logic in consumers. It eliminates `if` statements inside services and makes dependency graphs explicit.

## Architecture Guidelines
- Contextual bindings are stored in a nested array: `$contextual[consumer][abstract] = concrete`.
- During resolution, the container checks if the current `$buildStack` top (consumer) has a contextual rule for the requested abstract.
- If a contextual rule matches, the container builds the contextual concrete directly (bypassing instances cache for that resolution).
- Contextual binding is not inherited — child classes must have their own rules or the rule applies to the exact consumer class.

## Performance Considerations
- Contextual binding lookup is O(1) — array key check in `$contextual` using the consumer abstract name.
- The `$needsContextualBuild` flag adds a single boolean check per resolution step.
- Contextual binding storage is O(C × A) where C = number of consumers and A = number of abstracts. With 50 consumers each with 2 contextual rules, storage is ~100 entries (~2KB).
- Contextual building bypasses singleton cache for that resolution — the first resolution will not use cached singleton but builds a new instance (which is then cached if shared).

## Security Considerations
- Contextual binding can override security-related interface implementations per consumer — verify the substitution does not bypass authorization.
- Primitive contextual binding via `give()` can inject sensitive configuration values; ensure these are not exposed through serialization.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Expecting contextual binding to work with already-cached singletons | Contextual check after instances cache | Cached singleton returned regardless of context | Design singletons to be truly context-independent |
| Using class-string instead of interface in `needs()` | Confusion about what `needs()` accepts | Binding never matches; wrong implementation resolved | Always use the abstract/interface in `needs()` |
| Not testing contextual bindings | Assuming correct wiring | Wrong implementation in production without compile-time error | Write resolution tests for each consumer |

## Anti-Patterns
- **Contextual Binding for Runtime Request Data** — Decision depends on request-time data; use middleware + scoped binding instead.
- **Overusing Contextual Binding** — Binding every interface per-consumer creates a maintenance burden; consider distinct interfaces.
- **Contextual Binding to Primitive Strings** — Using `give('some-string')` for class-name-based dispatching instead of proper polymorphism.

## Examples

### Controller-specific interface binding
```php
$this->app->when(ReportController::class)
    ->needs(ReportFormatter::class)
    ->give(PdfReportFormatter::class);

$this->app->when(AnalyticsController::class)
    ->needs(ReportFormatter::class)
    ->give(CsvReportFormatter::class);
```

### Primitive contextual binding
```php
$this->app->when(ReportController::class)
    ->needs('$resultsPerPage')
    ->give(50);

$this->app->when(AnalyticsController::class)
    ->needs('$resultsPerPage')
    ->give(100);
```

### Closure-based contextual binding
```php
$this->app->when(ReportController::class)
    ->needs(ReportFormatter::class)
    ->give(function ($app) {
        return $app->make(PdfReportFormatter::class, [
            'orientation' => 'landscape',
        ]);
    });
```

## Related Topics
- **Prerequisites:** Container Fundamentals, Binding Types, Binding Resolution
- **Closely Related:** Auto-Resolution via Reflection
- **Advanced:** Tagged Bindings, Scoped Instance Management
- **Cross-Domain:** Service Providers (contextual binding registration in providers)

## AI Agent Notes
- When debugging "wrong implementation injected", check if the consumer has a contextual binding rule that's being matched incorrectly.
- Contextual binding is one of the least-used container features — recommend it when teams use factories or `if` statements inside services.
- For primitives, remember the `$` prefix in `needs('$paramName')` matches the constructor parameter name.

## Verification
- [ ] Can write a `when()->needs()->give()` chain correctly
- [ ] Understand why cached singletons bypass contextual binding
- [ ] Know how to bind primitives contextually (`$` prefix on parameter name)
- [ ] Can explain the storage structure (nested `$contextual` array)
- [ ] Can test contextual bindings with consumer resolution tests
