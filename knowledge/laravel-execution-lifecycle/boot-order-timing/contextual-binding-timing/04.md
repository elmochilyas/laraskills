# ku-04: Contextual Binding Timing

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **KU:** ku-04-contextual-binding-timing
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Contextual binding timing refers to when in the boot sequence `$app->when(Consumer::class)->needs(Abstract::class)->give(Concrete::class)` must be registered to take effect. Contextual bindings must be registered in a provider's `register()` method — before any resolution of the consumer class occurs. Understanding this timing is critical for ensuring the correct implementation is injected for each consumer.

## Core Concepts
- **Registration requirement**: Contextual bindings must be registered via `$app->when()->needs()->give()` in a service provider's `register()` method. Registering in `boot()` may be too late if the consumer has already been resolved.
- **Storage mechanism**: Contextual bindings are stored in `Container::$contextual` as a nested array: `$contextual[$consumer][$abstract] = $concrete`.
- **Resolution lookup**: When `Container::make($consumer)` is called, the container checks `$contextual[$consumer][$abstract]` before checking global bindings.
- **Priority**: Contextual bindings take precedence over global bindings. If both exist, the contextual concrete is used.
- **Closure support**: The `give()` method accepts both concrete class names and Closures for custom resolution logic.
- **Late binding exception**: If a contextual binding is registered in `boot()` but the consumer was already resolved in another provider's `boot()`, the binding has no effect on that already-resolved instance.

## When To Use
- When different consumers of the same interface need different implementations.
- When a constructor parameter is a named primitive (e.g., `$stripeSecret`) that varies per consumer.
- When a class needs a specific implementation that differs from the default binding.
- In testing, to swap dependencies for specific consumers without affecting global bindings.

## When NOT To Use
- When all consumers should receive the same implementation — use a global `bind()` instead.
- When the consumer class is never resolved by the container (e.g., new'd directly or created by a factory).
- When the contextual binding would create a circular dependency chain.
- For runtime-variable dependencies that change per request — use middleware or request-scoped singletons instead.

## Best Practices (WHY)
- **Register in the correct provider**: Place contextual bindings in the provider that registers the consumer class or in a dedicated provider.
- **Keep contextual bindings with consumer registration**: When registering a binding for `Consumer`, add the contextual bindings there.
- **Use primitive contextual binding**: `$app->when(Consumer::class)->needs('$key')->give('value')` resolves named primitive parameters without changing the consumer's constructor.
- **Avoid over-abstraction**: If every consumer needs a different implementation, consider whether the interface is correctly factored.

## Architecture Guidelines
- Organize contextual bindings by consumer — each consumer's specializations are clear when grouped together.
- Use contextual binding instead of factory pattern or if/else logic inside services.
- For complex contextual resolution, use a Closure in `give()` to access the container: `give(function ($app) { return new Implementation($app['config']['key']); })`.
- Document why a particular consumer gets a different implementation — the reason may not be obvious to future developers.

## Performance
- Contextual binding lookup is O(n) on the number of contextual bindings per consumer — negligible for <100 entries.
- Contextual binding storage (`Container::$contextual`) is a plain array. Lookup overhead is ~0.5-2µs per binding.
- Closure-based `give()` executes on every resolution of the consumer. Ensure closures are lightweight.
- No caching is provided for contextual binding resolution — the lookup runs on every `make()` call.

## Security
- Contextual bindings for auth/guard services should override global bindings carefully — ensure consumers get the correct guard.
- Do not use Closures in `give()` that capture secrets or request data in the Closure's scope — they persist in the container.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Registration in boot() | Contextual binding registered after consumer already resolved | Not understanding the register phase requirement | New binding has no effect on already-resolved instances | Register in `register()` or use `rebinding()` |
| Forgetting the consumer class | `when(Interface::class)` instead of `when(ConcreteConsumer::class)` | Confusing consumer with abstract | Binding applies to wrong consumer or has no effect | Specify the actual consumer class |
| Contextual + singleton conflict | Consumer is singleton, contextual binding added later | Late registration on already-resolved singleton | Contextual binding never takes effect | Register contextual bindings before singleton resolution |
| Overriding without intent | Contextual binding overrides a global binding silently | Not checking existing bindings | Implementation changes for that consumer unexpectedly | Document the override intent |

## Anti-Patterns
- **Contextual binding sprawl**: Hundreds of contextual bindings in the container — consider whether the architecture needs simplification.
- **Contextual as default**: Using contextual binding for every consumer instead of a single global binding with reasonable defaults.
- **Consumer misdirection**: Using contextual binding to "fix" a poorly designed interface that should be split into separate interfaces.

## Examples
```php
// In a service provider's register()
$app->when(ReportController::class)
    ->needs(ReportGenerator::class)
    ->give(PdfReportGenerator::class);

$app->when(DataExportController::class)
    ->needs(ReportGenerator::class)
    ->give(CsvReportGenerator::class);

// Primitive contextual binding
$app->when(PaymentService::class)
    ->needs('$apiKey')
    ->give(config('services.stripe.secret'));
```

## Related Topics
- Register vs Boot (ku-01) — why contextual bindings must be in register()
- Interface Binding Resolution — the global binding counterpart
- Dependency Injection Container — how contextual bindings are stored and resolved
- Provider Registration Order (ku-02) — ensures consumer is resolved after binding registration

## AI Agent Notes
- Contextual bindings are stored in `Container::$contextual` — inspect this array to debug binding resolution.
- The `when()` call returns a `ContextualBindingBuilder` instance — it's a fluent API, not an immediate registration.
- Primitive contextual binding requires the parameter name with `$` prefix in `needs()`.
- Contextual bindings do NOT work for `Container::call()` method injection — only for constructor injection.

## Verification
- [ ] All contextual bindings are registered in provider `register()` methods
- [ ] No consumer is resolved before its contextual bindings are registered
- [ ] Primitive contextual bindings use the correct `$parameterName` syntax
- [ ] Closure-based `give()` does not capture request-scoped state
- [ ] Contextual bindings are documented with rationale for the specialization
