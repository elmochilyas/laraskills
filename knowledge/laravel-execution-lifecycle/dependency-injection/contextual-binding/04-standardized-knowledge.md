# ku-05: Contextual Binding

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **KU:** ku-05-contextual-binding
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Contextual binding allows different implementations of the same interface to be injected for different consumers — `$app->when(Consumer::class)->needs(Interface::class)->give(Concrete::class)`. This eliminates conditional wiring inside services and adheres to the Open/Closed Principle. It is one of the most underutilized container features in Laravel.

## Core Concepts
- **Fluent API**: `when(Consumer)→needs(Abstract)→give(Concrete)` — three-method chain that registers a contextual binding.
- **Storage**: Contextual bindings are stored in `Container::$contextual[$consumer][$abstract] = $concrete`.
- **Precedence**: Contextual bindings take priority over global bindings. If both exist, the contextual one wins.
- **Consumer resolution**: When the container builds `Consumer`, it checks `$contextual[Consumer::class]` for each parameter before checking global bindings.
- **Primitive support**: `needs('$parameterName')` works for named scalar parameters — e.g., `needs('$stripeSecret')` for a constructor's `$stripeSecret` parameter.
- **Closure give()**: The implementation can be a Closure for dynamic resolution.

## When To Use
- When different classes need different implementations of the same interface.
- When injecting primitive configuration values that differ per consumer.
- When a factory pattern would be the only alternative — contextual binding replaces it cleanly.
- When a class needs a specific implementation that differs from the application default.

## When NOT To Use
- When all consumers should receive the same implementation — use a global `bind()`.
- When the consumer is resolved outside the container (e.g., created with `new`).
- When the contextual binding would create a circular dependency or overly complex wiring.
- When the binding decision depends on runtime request data — use middleware-based resolution instead.

## Best Practices (WHY)
- **Register in the provider with the consumer**: If `PaymentProvider` needs a special `HttpClient`, register the contextual binding in `PaymentServiceProvider`.
- **Use primitive contextual binding for config values**: `needs('$apiKey')->give(config('services.stripe.key'))` avoids injecting the entire config array.
- **Document the rationale**: Why does this consumer get a different implementation? Add a comment above the binding.
- **Prefer over factory pattern**: Contextual binding replaces `if (consumer instanceof X) { give(Y); } else { give(Z); }` in factory classes.

## Architecture Guidelines
- Organize contextual bindings near the consumer's registration for discoverability.
- For complex resolution logic, use a Closure in `give()`: `give(function ($app) { /* custom logic */ })`.
- Contextual bindings can chain — `when(A)->needs(X)->give(Y)` and `when(B)->needs(X)->give(Z)` for the same interface.
- Avoid hundreds of contextual bindings — consider whether the architecture needs simplification.

## Performance
- Contextual binding lookup is O(n) on the number of bindings for that specific consumer — negligible.
- Storage is a nested array — lookup is O(1) for the consumer, O(n) for the parameter match.
- Closure-based `give()` executes on every resolution — ensure closures are lightweight.
- No caching — the `$contextual` array is checked on every `make()`.

## Security
- Contextual bindings for auth/guard services should be carefully reviewed — ensure consumers get the correct guard.
- Closure `give()` captures the container at registration time — no request data leakage unless specifically captured.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Registering in boot() | Contextual binding after consumer already resolved | Not understanding timing | No effect on already-resolved instances | Register in register() |
| Wrong consumer class | `when(Interface::class)` instead of `when(ConcreteConsumer::class)` | Confusing consumer with abstract | Binding never matches | Use the actual consumer class |
| Contextual + singleton conflict | Consumer is singleton, binding added later | Late registration | Binding never takes effect | Register before first resolution |
| Forgetting the $ prefix | `needs('apiKey')` instead of `needs('$apiKey')` | Not knowing the syntax | Binding silently ignored | Use `$` prefix for primitive params |
| Overriding without intent | Contextual binding overrides global binding silently | Not checking existing bindings | Unexpected implementation change | Document the override |

## Anti-Patterns
- **Contextual binding sprawl**: 50+ contextual bindings — the architecture may need simplification.
- **Contextual as default**: Using contextual binding for every consumer instead of a well-chosen global default.
- **Runtime conditions in give()**: Using request data inside `give()` to decide implementation — use middleware or scoped singletons instead.

## Examples
```php
// In a service provider's register()
$app->when(ReportController::class)
    ->needs(ReportGeneratorInterface::class)
    ->give(PdfReportGenerator::class);

$app->when(DataExportController::class)
    ->needs(ReportGeneratorInterface::class)
    ->give(CsvReportGenerator::class);

// Primitive contextual binding
$app->when(PaymentService::class)
    ->needs('$apiKey')
    ->give(config('services.stripe.secret'));
```

## Related Topics
- DI Container Basics (ku-01) — the container's binding storage mechanism
- Interface Binding (ku-08) — the global binding counterpart
- Automatic Injection (ku-04) — how binding resolution works without contextual rules
- Aliasing Primitives (ku-07) — related primitive resolution patterns

## AI Agent Notes
- Contextual bindings are stored in `Container::$contextual[$consumer][$abstract]`.
- The `when()` method returns a `ContextualBindingBuilder` — the binding is registered when `give()` is called.
- Primitive contextual binding requires the `$` prefix: `needs('$paramName')`.
- Contextual bindings ONLY work for constructor injection — NOT for `Container::call()` method injection.

## Verification
- [ ] All contextual bindings are registered in provider `register()` methods
- [ ] No consumer is resolved before its contextual bindings are registered
- [ ] Primitive bindings use the correct `$parameterName` syntax
- [ ] Closure `give()` does not capture request-scoped state
- [ ] Contextual bindings are documented with rationale
- [ ] No runtime request data is used inside `give()` closures
