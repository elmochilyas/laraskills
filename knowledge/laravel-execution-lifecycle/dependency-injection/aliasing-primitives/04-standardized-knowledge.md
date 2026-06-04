# ku-07: Aliasing Primitives

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **KU:** ku-07-aliasing-primitives
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Primitive aliasing is the technique of binding scalar values (strings, ints, arrays) to named parameters in the container, enabling constructor injection of configuration values without type-hinting the entire config array. This is done via contextual binding: `$app->when(Consumer::class)->needs('$paramName')->give(value)`.

## Core Concepts
- **Primitive parameters**: Constructor parameters without class type-hints — `string`, `int`, `array`, `bool`. The container cannot auto-resolve these.
- **Contextual primitive binding**: The `when()->needs('$parameterName')->give(value)` pattern provides scalar values to specific parameters.
- **Parameter name matching**: The `$` prefix in `needs()` matches the constructor parameter name exactly.
- **Default values vs bindings**: If a primitive has a default value (`$timeout = 30`), the container uses it when no binding exists. Explicit bindings override defaults.
- **Config injection**: The most common use case — inject a specific config value instead of the entire `Config` repository.
- **Type enforcement**: The container does NOT validate the given value's type against the parameter — a string binding for an `int $timeout` will work but may cause runtime errors.

## When To Use
- When a class needs specific configuration values (API keys, timeouts, URLs, feature flags).
- Instead of injecting the entire `Config` repository or using `config()` inside the class.
- When testing — swap primitive values via `instance()` or contextual binding to control behavior.
- When a constructor parameter is a primitive that differs per consumer.

## When NOT To Use
- When the value is truly constant across the application — use a class constant or default value instead.
- When you have 10+ primitive bindings for a single class — the class likely needs architectural refactoring.
- When the primitive value changes per request — use middleware to inject request-scoped values.
- For values that should be computed at runtime — use a Closure binding or factory.

## Best Practices (WHY)
- **Bind named parameters over entire config**: `needs('$stripeSecret')->give(config('services.stripe.secret'))` is cleaner than injecting `Config $config` and calling `$config->get('services.stripe.secret')`.
- **Document primitive bindings**: Unlike type-hinted dependencies, primitives are invisible in the class interface — comment the binding rationale.
- **Use environment-specific values in give()**: `give(config('app.timeout'))` resolves at registration time — ensure config is loaded.
- **Combine with contextual binding**: Different consumers can get different primitive values for the same parameter name.

## Architecture Guidelines
- Register primitive bindings in the provider that registers the consumer class.
- For configuration-heavy classes, consider a dedicated configuration object or DTO.
- Primitive bindings are resolved once at consumer construction time — they don't change between resolutions.
- Use descriptive parameter names (`$apiKey`, `$timeoutSeconds`) to make bindings self-documenting.

## Performance
- Primitive binding lookup is part of the contextual binding lookup — O(n) on contextual bindings for that consumer.
- The given value is passed directly — no serialization, no additional resolution.
- Closure-based `give()` executes on every consumer resolution — ensure Closures are simple array lookups.
- No caching — the primitive value is fetched from the binding array on each `make()`.

## Security
- API keys and secrets bound as primitives are stored in the container's binding array — accessible via `$app->getBindings()`. Protect container access.
- Primitive bindings are set at registration time — use `config()` to reference environment variables rather than hardcoding values.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Missing $ prefix | `needs('apiKey')` instead of `needs('$apiKey')` | Not knowing the syntax | Binding silently ignored | Always use `$` prefix for primitive params |
| Hardcoding values | `give('sk_test_123')` instead of `give(config(...))` | Convenience | Secret in codebase, not env-configurable | Use `config()` in give() |
| Wrong parameter name | Binding doesn't match constructor | Constructor renamed but binding not updated | Binding ignored; default used or error | Keep parameter names stable |
| Binding array with wrong type | `give('string')` for `int $timeout` | Type mismatch | Runtime TypeError | Ensure give() value matches parameter type |
| Forgetting default value | Primitive has no binding and no default | Missing resolution path | BindingResolutionException | Always provide default or binding |

## Anti-Patterns
- **Injecting entire Config array**: `__construct(Config $config)` only to call `$config->get('key')` — bind the specific config value instead.
- **Hardcoded secrets in give()**: `give('my-secret-key')` instead of `give(config('services.secret'))`.
- **Over-aliasing**: Binding every primitive individually when a configuration object would be cleaner.

## Examples
```php
// In service provider's register()
$app->when(PaymentService::class)
    ->needs('$apiKey')
    ->give(config('services.stripe.key'));

$app->when(PaymentService::class)
    ->needs('$timeout')
    ->give(30);

// Consumer class
class PaymentService
{
    public function __construct(
        protected string $apiKey,
        protected int $timeout = 10, // Default if no binding
    ) {}
}
```

## Related Topics
- Contextual Binding (ku-05) — the mechanism that powers primitive aliasing
- DI Container Basics (ku-01) — how the container resolves constructor parameters
- Constructor Injection (ku-02) — the injection pattern that consumes primitive bindings

## AI Agent Notes
- Primitive aliasing uses `needs('$paramName')` — the `$` prefix is required.
- Under the hood, it's stored in `Container::$contextual[Consumer][$paramName]`.
- The container checks for primitive bindings during `Container::build()` parameter loop.
- If no binding exists and no default value is defined, `BindingResolutionException` is thrown.
- For variadic primitives (`...$config`), use tagged bindings or array binding.

## Verification
- [ ] All primitive bindings use the `$` prefix in `needs()`
- [ ] No hardcoded secrets in `give()` — use `config()` instead
- [ ] Parameter names are stable and documented
- [ ] Default values exist as fallback when no binding is provided
- [ ] Primitive bindings are registered in provider `register()` methods
