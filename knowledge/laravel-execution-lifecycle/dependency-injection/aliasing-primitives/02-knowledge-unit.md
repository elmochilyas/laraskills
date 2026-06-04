# Aliasing Primitives

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Primitive aliasing is the technique of binding scalar values (strings, ints, arrays) to named parameters in the container, enabling constructor injection of configuration values without type-hinting the entire config array. This is done via contextual binding: `$app->when(Consumer::class)->needs('$paramName')->give(value)`. It replaces the common anti-pattern of injecting the entire `Config` repository when only one key is needed.

## Core Concepts

### Primitive Parameters
Constructor parameters without class type-hints — `string`, `int`, `array`, `bool`. The container cannot auto-resolve these.

### Contextual Primitive Binding
The `when()->needs('$parameterName')->give(value)` pattern provides scalar values to specific parameters.

### Parameter Name Matching
The `$` prefix in `needs()` matches the constructor parameter name exactly.

### Default Values vs Bindings
If a primitive has a default value (`$timeout = 30`), the container uses it when no binding exists. Explicit bindings override defaults.

### Config Injection
The most common use case — inject a specific config value instead of the entire `Config` repository.

### Type Enforcement
The container does NOT validate the given value's type against the parameter — a string binding for an `int $timeout` will work but may cause runtime errors.

## Mental Models

### The Bartender's Recipe
A bartender has recipes that call for specific ingredients. Instead of handing the bartender the entire liquor cabinet (Config repository), you hand them the specific bottle needed: "For a Margarita, use this tequila" (primitive binding). The bartender doesn't need access to everything — just what's needed for that drink.

### The Tailor's Measurements
A tailor needs specific measurements for a suit: chest, waist, inseam. Instead of giving the tailor your entire medical file (Config), you provide just the measurements: "Chest: 40, Waist: 34, Inseam: 32." The specific values are injected for that specific customer.

### The Single Key
Config injection is like a hotel room with 100 doors (config keys). Injecting the entire Config is giving someone the master key. Primitive aliasing gives them only the key to the one room they need.

## Internal Mechanics

### Registration
```php
// Primitive binding uses the contextual storage
// $app->when(PaymentService::class)
//     ->needs('$apiKey')
//     ->give(config('services.stripe.key'));

// Result:
// Container::$contextual['App\Services\PaymentService']['$apiKey'] = 'sk_test_123'
```

### Resolution in build()
```php
// During Container::build() parameter resolution:
foreach ($constructor->getParameters() as $parameter) {
    $name = $parameter->getName();
    $consumer = end($this->buildStack);
    
    // Check for primitive contextual binding
    if (isset($this->contextual[$consumer]['$' . $name])) {
        $results[] = $this->contextual[$consumer]['$' . $name];
        continue;
    }
    
    // Check for class type-hint
    if ($type = $parameter->getType()) {
        // ... resolve class
    }
    
    // Check for default value
    if ($parameter->isDefaultValueAvailable()) {
        $results[] = $parameter->getDefaultValue();
        continue;
    }
    
    // No resolution path — throw
    throw new BindingResolutionException(...);
}
```

### Why the $ Prefix?
```php
// needs('$apiKey') matches constructor parameter $apiKey
// needs('apiKey') would NOT match — container specifically looks for '$' prefix

// This prevents confusion with class-type expressions
// and makes primitive bindings visually distinct from class bindings
```

## Patterns

### Specific Value Injection Pattern
Instead of injecting `Config $config` and calling `$config->get('services.stripe.secret')`, bind the specific value: `needs('$stripeSecret')->give(config('services.stripe.secret'))`.

### Environment-Derived Values Pattern
Bind values that come from environment via config: `give(config('app.timeout'))`. Resolves at registration time — ensures config is loaded.

### Consumer-Specific Defaults Pattern
Different consumers can get different values for the same parameter name using contextual binding per consumer.

## Architectural Decisions

### Why the $ prefix for primitives?
The `$` prefix makes primitive bindings syntactically distinct from class-type bindings. This avoids ambiguity — `needs(HttpClient::class)` vs `needs('$httpClient')` are clearly different.

### Why not auto-resolve primitives from config?
Primitive values can come from anywhere — config, environment, hardcoded values, factories. Auto-resolution would require a registration mechanism anyway, so the explicit binding approach is more flexible.

### Why NOT inject Config and call get()?
Injecting Config couples the class to the entire configuration system. The class can access any config key, making its true dependencies unclear. Primitive aliasing makes the dependency explicit and specific.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Explicit dependency on specific value | More bindings to register | Parameter name must match exactly |
| No Config coupling | $ prefix required (easy to forget) | Binding silently ignored without $ |
| Consumer-specific values | Hardcoded values in give() | Always use config() in give(), not literals |
| Testable — swap values via instance() | Type mismatch possible | Runtime error if type is wrong |

## Performance Considerations

- **Lookup cost:** Part of contextual binding lookup — O(n) on contextual bindings for that consumer.
- **Value passing:** Given value passed directly — no serialization, no additional resolution.
- **Closure give():** Executes on every consumer resolution — ensure Closures are simple array lookups.
- **No caching:** Primitive value fetched from binding array on each `make()`.

## Production Considerations

- **Bind named parameters over entire config:** Cleaner and more explicit.
- **Document primitive bindings:** Unlike type-hinted dependencies, primitives are invisible in the class interface.
- **Use config() in give(), not literals:** `give(config('app.timeout'))` not `give(30)`.
- **Combine with contextual binding:** Different consumers can get different primitive values.
- **Maintain parameter name stability:** Renaming a constructor parameter breaks the binding silently.

## Common Mistakes

- **Missing $ prefix:** `needs('apiKey')` instead of `needs('$apiKey')` — binding silently ignored.
- **Hardcoding values:** `give('sk_test_123')` instead of `give(config(...))` — secret in codebase.
- **Wrong parameter name:** Binding doesn't match constructor — binding ignored, default used or error.
- **Binding array with wrong type:** `give('string')` for `int $timeout` — runtime TypeError.
- **Forgetting default value:** Primitive has no binding and no default — `BindingResolutionException`.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Binding silently ignored | Wrong value used (default or error) | Missing $ prefix | Always use `needs('$paramName')` |
| Hardcoded secret in repo | Secret exposed in source control | Using literal instead of config() | Always use `give(config(...))` |
| Runtime TypeError | Type mismatch at runtime | give() value doesn't match parameter type | Ensure type consistency |
| Parameter renamed | Binding no longer applies | Constructor changed but binding not updated | Keep parameter names stable |

## Ecosystem Usage

- **Laravel Framework:** Uses primitive aliasing internally for configuration values — e.g., database connection names, cache prefixes.
- **Laravel Horizon:** Binds configuration values like `$horizonPrefix` via primitive aliasing in its service provider.
- **Laravel Nova:** Uses primitive aliasing for tool-specific configuration values.
- **Spatie packages:** Use primitive aliasing to inject package configuration values without exposing the entire Config repository.

## Related Knowledge Units

### Prerequisites
- [Contextual Binding (ku-05)](../ku-05-contextual-binding/02-knowledge-unit.md) — the mechanism that powers primitive aliasing.
- [DI Container Basics (ku-01)](../ku-01-di-container-basics/02-knowledge-unit.md) — how the container resolves constructor parameters.

### Related Topics
- [Constructor Injection (ku-02)](../ku-02-constructor-injection/02-knowledge-unit.md) — the injection pattern that consumes primitive bindings.

## Research Notes
- Primitive aliasing uses `needs('$paramName')` — the `$` prefix is required.
- Under the hood, it's stored in `Container::$contextual[Consumer][$paramName]`.
- The container checks for primitive bindings during `Container::build()` parameter loop.
- If no binding exists and no default value is defined, `BindingResolutionException` is thrown.
