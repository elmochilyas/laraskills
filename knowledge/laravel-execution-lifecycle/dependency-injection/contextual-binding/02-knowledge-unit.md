# Contextual Binding

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Contextual binding allows different implementations of the same interface to be injected for different consumers — `$app->when(Consumer::class)->needs(Interface::class)->give(Concrete::class)`. This eliminates conditional wiring inside services and adheres to the Open/Closed Principle. It is one of the most underutilized container features in Laravel, often replaced by factories or conditional logic that should be handled by the container.

## Core Concepts

### Fluent API
`when(Consumer)→needs(Abstract)→give(Concrete)` — three-method chain that registers a contextual binding.

### Storage
Contextual bindings are stored in `Container::$contextual[$consumer][$abstract] = $concrete`.

### Precedence
Contextual bindings take priority over global bindings. If both exist, the contextual one wins for that specific consumer.

### Consumer Resolution
When the container builds `Consumer`, it checks `$contextual[Consumer::class]` for each parameter before checking global bindings.

### Primitive Support
`needs('$parameterName')` works for named scalar parameters — e.g., `needs('$stripeSecret')` for a constructor's `$stripeSecret` parameter.

### Closure give()
The implementation can be a Closure for dynamic resolution: `give(function ($app) { return new Concrete(...); })`.

## Mental Models

### The Custom Tailor
Think of a tailor who makes suits differently for each client. One client gets wool, another gets linen, even though both ask for a "suit" (same interface). The tailor's notebook (`when()->needs()->give()`) says: "When Client A needs a suit, give wool. When Client B needs a suit, give linen."

### The Specialized Waitstaff
In a restaurant, two tables order "coffee" (same interface). Table 1 gets espresso (Italian restaurant). Table 2 gets drip coffee (American diner). The waiter knows: "When Table 1 orders coffee, give espresso. When Table 2 orders coffee, give drip."

### The Tool Crib
A factory floor has a tool crib where workers check out tools. Two mechanics both ask for a "socket wrench" (same interface). The tool crib knows: "When Mechanic A needs a socket wrench, give the 10mm. When Mechanic B needs one, give the 13mm."

## Internal Mechanics

### Storage Structure
```php
// Container::$contextual stores bindings as a nested array:
$this->contextual = [
    'App\Services\PaymentService' => [
        'App\Contracts\HttpClient' => 'App\Services\StripeHttpClient',
        '$apiKey' => 'sk_test_123', // Primitive binding
    ],
    'App\Controllers\ReportController' => [
        'App\Contracts\ReportGenerator' => 'App\Services\PdfReportGenerator',
    ],
];
```

### Resolution Check
```php
// During Container::build() for Consumer:
// 1. Get constructor parameters
// 2. For each parameter:
//    a. Check $contextual[Consumer::class][parameter $name]
//    b. If found: return contextual binding
//    c. If not: check global $bindings
//    d. If not: try auto-resolution

protected function resolveClass(ReflectionParameter $parameter)
{
    $consumer = end($this->buildStack); // Current class being built
    
    if (isset($this->contextual[$consumer][$parameter->getName()])) {
        // Primitive contextual binding
        return $this->contextual[$consumer][$parameter->getName()];
    }
    
    $class = $parameter->getType()->getName();
    
    if (isset($this->contextual[$consumer][$class])) {
        // Class contextual binding
        return $this->make($this->contextual[$consumer][$class]);
    }
    
    // Fall through to global binding or auto-resolution
    return $this->make($class);
}
```

### Registration Flow
```php
// when() returns ContextualBindingBuilder
// ContextualBindingBuilder::needs() stores abstract
// ContextualBindingBuilder::give() registers the binding

// $app->when(PaymentService::class)
//     ->needs(HttpClient::class)
//     ->give(StripeHttpClient::class);
//
// Internally: $container->$contextual[PaymentService::class][HttpClient::class] = StripeHttpClient::class
```

## Patterns

### Consumer-Specific Implementation Pattern
Different consumers of the same interface get different implementations. Eliminates `if (instanceof)` checks in factory classes.

### Primitive Configuration Injection Pattern
Inject specific config values instead of the entire `Config` repository: `needs('$apiKey')->give(config('services.stripe.key'))`.

### Closure-Based Dynamic Resolution Pattern
Use a Closure in `give()` when the implementation depends on runtime-available state (but not per-request state).

## Architectural Decisions

### Why contextual over global binding priority?
Contextual bindings are more specific — the developer explicitly says "for this consumer, use this implementation." This specificity takes precedence over the general "for any consumer, use this" rule.

### Why the fluent API (when→needs→give)?
The fluent API makes contextual bindings readable as a sentence: "When PaymentService needs HttpClient, give StripeHttpClient." This readability improves maintainability.

### Why contextual binding for primitives too?
Primitive contextual binding extends the pattern beyond classes. A parameter named `$apiKey` in one consumer can get a different value than the same parameter name in another consumer.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Eliminates conditional wiring | Must know all consumers upfront | Late-arriving consumers need new bindings |
| Open/Closed Principle compliance | Contextual bindings spread across providers | 50+ bindings = architecture review needed |
| Primitive injection support | $ prefix required (easy to forget) | Binding silently ignored without $ |
| Closure give() for dynamic logic | Closure not serializable (cache constraints) | Cannot cache contextual bindings with Closures |

## Performance Considerations

- **Contextual binding lookup:** O(n) on the number of bindings for that specific consumer — negligible.
- **Storage:** Nested array — O(1) for the consumer, O(n) for the parameter match.
- **Closure give():** Executes on every resolution — ensure closures are lightweight.
- **No caching:** The `$contextual` array is checked on every `make()`.

## Production Considerations

- **Register in provider register():** Contextual binding after consumer already resolved has no effect.
- **Use the actual consumer class:** `when(ConcreteConsumer::class)` not `when(Interface::class)`.
- **Contextual + singleton conflict:** Consumer is singleton, binding added later — binding never takes effect.
- **Document the rationale:** Why does this consumer get a different implementation?

## Common Mistakes

- **Registering in boot():** Contextual binding after consumer already resolved — no effect.
- **Wrong consumer class:** `when(Interface::class)` instead of `when(ConcreteConsumer::class)` — binding never matches.
- **Contextual + singleton conflict:** Consumer is singleton, binding added too late — binding never takes effect.
- **Forgetting the $ prefix:** `needs('apiKey')` instead of `needs('$apiKey')` — binding silently ignored.
- **Overriding without intent:** Contextual binding overrides global binding silently — unexpected implementation change.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Binding never applies | Wrong implementation injected | Consumer registered in wrong provider or singleton already resolved | Register in register(), not boot() |
| Binding silently ignored | Default implementation used | Missing $ prefix for primitive | Use `needs('$paramName')` |
| Override not documented | Unexpected behavior | Contextual binding overrides global without notice | Document the override |
| Closure give() too heavy | Slow resolution | Complex logic in give() closure | Move logic to a factory class |

## Ecosystem Usage

- **Laravel Framework:** Uses contextual binding internally for core services. The `MailManager` uses contextual binding for different mailer configurations.
- **Laravel Horizon:** Uses contextual binding to provide different queue implementations for different job types.
- **Laravel Nova:** Uses contextual binding to inject different authorization gates for different resources.
- **Spatie packages:** Use contextual binding for providing different implementations of package interfaces per consumer.

## Related Knowledge Units

### Prerequisites
- [DI Container Basics (ku-01)](../ku-01-di-container-basics/02-knowledge-unit.md) — the container's binding storage mechanism.

### Related Topics
- [Interface Binding (ku-08)](../ku-08-interface-binding/02-knowledge-unit.md) — the global binding counterpart.
- [Aliasing Primitives (ku-07)](../ku-07-aliasing-primitives/02-knowledge-unit.md) — related primitive resolution patterns.
- [Automatic Injection (ku-04)](../ku-04-automatic-injection/02-knowledge-unit.md) — how binding resolution works without contextual rules.

## Research Notes
- Contextual bindings are stored in `Container::$contextual[$consumer][$abstract]`.
- The `when()` method returns a `ContextualBindingBuilder` — the binding is registered when `give()` is called.
- Primitive contextual binding requires the `$` prefix: `needs('$paramName')`.
- Contextual bindings ONLY work for constructor injection — NOT for `Container::call()` method injection.
