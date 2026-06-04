# Contextual Binding

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **Knowledge Unit:** Contextual Binding
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Contextual binding is Laravel's mechanism for providing different concrete implementations of the same abstract interface depending on which class is consuming it. Implemented through the `when()->needs()->give()` fluent API and the newer `#[Context]` and `#[Singleton]` PHP attributes (Laravel 11+), this feature eliminates conditional wiring logic from service providers and adheres to the Open/Closed Principle. Instead of writing `if ($consumer === 'X') { give A } else { give B }`, contextual binding declares the mapping declaratively.

The critical engineering decision in contextual binding is that it operates as a pre-resolution override layer, checked *after* the instances cache but *before* the general binding definition. This ordering means contextual bindings only affect the *first* resolution — once a singleton or scoped instance is cached, contextual rules have no effect on subsequent resolutions from different consumers. The consequence is that contextual binding is effectively single-resolution scoped: it controls construction-time injection but cannot alter already-cached objects. Teams expecting contextual binding to provide different singleton instances per consumer will encounter surprising shared-state bugs.

For production applications, contextual binding is the primary tool for interface segregation at the composition root. Rather than creating separate interfaces for each consumer (e.g., `AdminPaymentGateway`, `UserPaymentGateway`), teams can bind a single `PaymentGateway` interface and configure context-specific implementations through `when()->needs()->give()`. This reduces interface proliferation while maintaining precise dependency control.

---

## Core Concepts

### The when()->needs()->give() API
The fluent API declares: "When resolving class X, if it needs abstract Y, give it concrete Z."

```php
$this->app->when(PhotoController::class)
    ->needs(FileStorage::class)
    ->give(LocalFileStorage::class);

$this->app->when(VideoController::class)
    ->needs(FileStorage::class)
    ->give(S3FileStorage::class);
```

### Closure-Based give()
The `give()` method accepts a closure for dynamic resolution:

```php
$this->app->when(ReportController::class)
    ->needs(ReportFormatter::class)
    ->give(function ($app) {
        return $app->make(config('reports.default_formatter'));
    });
```

### Primitive Value Injection
Contextual binding can inject primitive values (strings, ints, arrays):

```php
$this->app->when(ReportService::class)
    ->needs('$apiKey')
    ->give(config('services.reports.api_key'));

$this->app->when(MailService::class)
    ->needs('$recipients')
    ->give(['admin@example.com', 'dev@example.com']);
```

### Attribute-Based Contextual Binding (Laravel 11+)
PHP 8 attributes provide a declarative alternative:

```php
use Illuminate\Container\Attributes\Context;
use Illuminate\Container\Attributes\Singleton;

class PaymentController {
    public function __construct(
        #[Context(on: PaymentController::class)]
        protected PaymentGateway $gateway,
    ) {}
}
```

---

## Mental Models

### The Building Security Desk
A building with a front desk that gives visitors different access badges depending on which floor they're visiting. The CEO's office (one consumer) gets a gold badge (concrete A), the server room (another consumer) gets a restricted badge (concrete B). The badge policy is configured at the front desk (composition root), not inside the visitors themselves.

### The Dependency Sorting Hat
Like the Sorting Hat from Harry Potter, but for dependencies: when a class "arrives" (is resolved), the hat checks which house (consumer class) it belongs to and assigns the appropriate tool (concrete implementation). The hat never tells the tools which house they're in — that knowledge stays at the sorting ceremony (composition root).

### The Restaurant Menu
Each table (consumer class) orders "steak" (abstract dependency), but the kitchen (container) checks the table's reservation and serves different cuts — table 1 gets filet mignon (concrete A), table 2 gets ribeye (concrete B). The menu says "steak" for both, but the kitchen knows the mapping.

---

## Internal Mechanics

### Storage Structure
Contextual bindings are stored in the `$contextual` array:

```php
// Internal structure
$this->contextual = [
    PhotoController::class => [
        FileStorage::class => LocalFileStorage::class,
    ],
    VideoController::class => [
        FileStorage::class => S3FileStorage::class,
    ],
];
```

For primitive injection, the key uses the parameter name prefixed with `$`:

```php
$this->contextual = [
    ReportService::class => [
        '$apiKey' => 'sk-1234',
    ],
];
```

### Resolution Path with Context

When `make()` is called, the container checks if the current build stack contains a class with contextual bindings:

```php
// Inside resolve() — after instances cache check
if ($this->needsContextualBuild($abstract)) {
    $this->withContextualBindings($abstract);
}
```

The `needsContextualBuild()` method checks if any class in the build stack has contextual bindings for the current abstract:

```php
protected function needsContextualBuild($abstract)
{
    $abstract = $this->normalize($abstract);

    foreach (array_reverse($this->buildStack) as $type) {
        if (isset($this->contextual[$type][$abstract])) {
            return true;
        }
    }
    return false;
}
```

### Attribute Resolution (Laravel 11+)
The `#[Context]` attribute is processed during parameter resolution. When `build()` encounters a parameter with the `Context` attribute, it calls `$container->make($type)` with the contextual binding for the specified consumer:

```php
// Simplified attribute resolution
if ($param->getAttributes(Context::class)) {
    $context = $param->getAttributes(Context::class)[0]->newInstance();
    return $this->make($param->getType()->getName(), context: $context->on);
}
```

---

## Patterns

### Repository Injection by Consumer
```php
$this->app->when(UserController::class)
    ->needs(UserRepository::class)
    ->give(CacheUserRepository::class);

$this->app->when(AdminController::class)
    ->needs(UserRepository::class)
    ->give(DatabaseUserRepository::class);
```

### Queue Configuration per Job
```php
$this->app->when(SendWelcomeEmail::class)
    ->needs('$queueName')
    ->give('high-priority');

$this->app->when(GenerateReport::class)
    ->needs('$queueName')
    ->give('low-priority');
```

### Nested Contextual Binding
For services consumed by another contextual-bound service:

```php
$this->app->when(PhotoController::class)
    ->needs(FileStorage::class)
    ->give(LocalFileStorage::class);

// LocalFileStorage itself needs a path resolver
$this->app->when(LocalFileStorage::class)
    ->needs(PathResolver::class)
    ->give(PhotoPathResolver::class);
```

---

## Architectural Decisions

### Why contextual binding is checked after instances cache
Contextual binding operates at construction time — it controls which implementation is instantiated, not which instance is returned. If a singleton was already constructed in a previous context, returning it to a different context would violate the "contextual" promise. The instances-first check ensures that contextual rules apply only to the first resolution. The tradeoff is that singletons resolved with contextual rules are shared across all subsequent consumers, even those with different contextual needs.

### Why primitives use `$` prefix notation
The `$variableName` syntax mirrors PHP variable syntax, making it visually distinct from class/interface names. This prevents ambiguity between `needs(StorageInterface::class)` (a class) and `needs('$apiKey')` (a primitive parameter name). The Dollar prefix convention was chosen for developer readability over alternatives like `needsPrimitive()` or array-based configuration.

### Why attribute-based contextual binding uses `#[Context(on: ...)]`
The `on` parameter explicitly names the consumer class, keeping the attribute declaration independent of the resolution stack. This design avoids coupling the parameter's attribute to whatever class happens to be resolving it, enabling the attribute to survive refactoring. The alternative — inferring context from the caller — would break when method injection or nested resolution changes the caller.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Eliminates conditional wiring in service providers | Contextual rules are scattered across providers | Harder to audit all contextual decisions for a given class |
| Supports primitive injection without factory closures | Primitive keys use `$name` convention | CI tooling cannot validate that `$name` matches actual constructor parameter |
| Attribute-based binding (Laravel 11+) enables inline declarations | Attributes couple class to container knowledge | Refactoring classes with attribute-based bindings requires container awareness |
| Works for deep nested resolution | Context check walks entire build stack | Deep dependency graphs with contextual rules add ~1-3μs per resolution level |

---

## Performance Considerations

Contextual binding adds a build stack traversal on every resolution: `needsContextualBuild()` iterates the build stack array in reverse order, checking each entry against the `$contextual` map. For shallow dependency graphs (1-2 levels), this is negligible (~0.5μs). For deep graphs (10+ levels), the overhead accumulates linearly.

The `$contextual` array is indexed by consumer class. Lookup is O(1) for each build stack entry. With 50 contextual rules, the entire array is ~2-5KB — negligible for memory.

Attribute-based contextual binding adds attribute parsing overhead during reflection. Each `#[Context]` attribute requires two reflection calls: `getAttributes()` to discover the attribute and `newInstance()` to instantiate it. For parameters without attributes, the overhead is a single `empty()` check on the `getAttributes()` result.

---

## Production Considerations

- **Keep contextual rules in dedicated service providers.** Grouping all `when()->needs()->give()` declarations for a given interface in one provider makes auditability possible.
- **Avoid overusing contextual binding for primitives.** Injecting scalar values through contextual binding makes the configuration harder to trace than using configuration objects. Prefer a typed configuration DTO over `needs('$apiKey')`.
- **Test contextual binding combinations.** Write a test that resolves each consumer class and asserts the correct concrete implementation is injected. This catches regressions when bindings change.
- **Be aware of singleton interaction.** A singleton with contextual binding is resolved once for the first consumer. All subsequent consumers share that instance, ignoring their contextual rules. This is often not what developers expect.

---

## Common Mistakes

**Why it happens:** Expecting contextual binding to work differently per consumer after a singleton is already cached. **Why it's harmful:** Once resolved, the singleton instance is shared across all consumers regardless of their contextual rules. Subsequent consumers get the first consumer's configuration. **Better approach:** Use `bind()` instead of `singleton()` for services that need context-specific resolution, or ensure the contextual binding affects only the non-cached first resolution.

**Why it happens:** Using contextual binding to inject primitives with parameter names that don't match the constructor. **Why it's harmful:** The container matches `needs('$parameterName')` against the constructor parameter name. A typo or refactoring silently breaks the injection — the primitive is not passed, and the parameter's default value (or an exception) is used instead. **Better approach:** Use a typed configuration object that's injected via type-hint, eliminating string-based parameter name matching.

**Why it happens:** Nesting contextual binding for a service that's used by multiple consumers with different contexts. **Why it's harmful:** The nested service is resolved once within the context of the first caller. If Service A (context X) depends on Service B, and Service B is also used by Service C (context Y), Service B's contextual resolution depends on which was resolved first. **Better approach:** Ensure services with contextual bindings are not shared across consumers with different contextual needs, or use `bind()` to avoid caching.

---

## Failure Modes

### Contextual Rule Not Applied
The contextual binding is defined but the consumer receives the default binding. **Common causes:** The consumer class name in `when()` does not match the actual consumer. Anonymous classes or dynamically generated proxies have different class names. **Detection:** Test the resolution and assert the concrete type. **Mitigation:** Use concrete class references (not strings) for `when()` and verify consumer class names match.

### Primitive Contextual Binding Silently Ignored
A `needs('$paramName')` rule is defined but the constructor parameter name changes due to refactoring. **Common causes:** Renaming constructor parameters without updating contextual binding rules. **Detection:** No error — the primitive default is used instead. **Mitigation:** Use typed parameter objects instead of primitives, or add a test that resolves the consumer with specific parameter assertions.

### Contextual Binding + Singleton Surprise
A singleton bound with contextual rules is resolved in one context, then shared with another context that expects different behavior. **Common causes:** Using `scoped()` or `singleton()` with `when()->needs()->give()` without understanding caching behavior. **Detection:** Intermittent bugs where different consumers appear to interfere with each other's configuration. **Mitigation:** Use `bind()` (non-shared) for services with context-dependent behavior.

---

## Ecosystem Usage

**Laravel Framework Core:** The `Illuminate\Queue\Worker` uses contextual binding to configure different queue connections per job type. Each job type received different `$connectionName` and `$queue` parameters via `when(Job::class)->needs('$connectionName')->give(...)` in `QueueServiceProvider`.

**Laravel Cashier (Stripe):** Uses contextual binding to inject different Stripe API key configurations depending on the billable model type. `when(User::class)->needs('$stripeKey')->give(config('cashier.key'))` ensures the correct keys are used for each billable entity.

**Spatie Laravel Permission:** Uses contextual binding to provide different `PermissionRepository` implementations depending on the consumer. Admin middleware receives a cached repository while front-end controllers receive a database-backed repository for real-time accuracy.

---

## Related Knowledge Units

### Prerequisites
- Container Fundamentals
- Binding Types

### Related Topics
- Binding Resolution
- Auto-Resolution via Reflection

### Advanced Follow-up Topics
- Tagged Bindings
- Binding Extending

---

## Research Notes

### Source Analysis
- `Illuminate\Container\Container::when()` (lines 150-160): Returns `ContextualBindingBuilder` instance.
- `Illuminate\Container\ContextualBindingBuilder::needs()` (lines 30-50): Stores the abstract being requested.
- `Illuminate\Container\ContextualBindingBuilder::give()` (lines 60-90): Stores the concrete in `$container->contextual`.
- `Illuminate\Container\Container::needsContextualBuild()` (lines 550-570): Checks build stack for contextual rules.
- `Illuminate\Container\Container::withContextualBindings()` (lines 575-590): Prepares resolution with contextual override.
- `Illuminate\Container\Container::resolveContextualBindings()` (lines 595-620): Applies contextual binding during resolution.
- `Illuminate\Container\Attributes\Context` (Laravel 11+): Attribute class for declarative contextual binding.

### Key Insight
The `$contextual` array is keyed by consumer class, not abstract type. This means lookup is: "Given the current build stack (consumers being resolved), does any of these consumers have a contextual rule for the abstract we're about to resolve?" This reverse-indexed design avoids iterating all contextual rules for every resolution.

### Version-Specific Notes
- **Laravel 10.x:** Contextual binding only available through `when()->needs()->give()` fluent API. No attribute support.
- **Laravel 11.x:** `#[Context]` and `#[Singleton]` attributes introduced. Attribute-based binding processed during parameter resolution in `build()`.
- **Laravel 12.x:** `give()` accepts tagged service references. `needs()->giveTagged()` shorthand added.
- **Laravel 13.x:** Contextual binding now supports variadic parameters. `needs(Service::class)` with variadic constructor parameter resolves all matching contextual bindings.
