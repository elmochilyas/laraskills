# Phase 5: Rules — Attribute Registration

## Rule: Prefer Attributes Over Boot Method Registration
---
## Category
Code Organization
---
## Rule
Prefer `#[ObservedBy]`, `#[ScopedBy]`, `#[CollectedBy]`, and `#[UseEloquentBuilder]` attributes over manual registration inside `boot()` methods or service providers.
---
## Reason
Attributes colocate configuration with the model definition, making registration discoverable, declarative, and removing the need to search through service providers to understand model behavior.
---
## Bad Example
```php
class Order extends Model
{
    // No attribute — observer registered elsewhere
}

// In AppServiceProvider:
Order::observe(OrderObserver::class);
```
---
## Good Example
```php
#[ObservedBy(OrderObserver::class)]
class Order extends Model
{
    //
}
```
---
## Exceptions
Use `boot()` when the registration depends on runtime conditions (environment checks, feature flags, authenticated user state) that cannot be resolved at class-load time.
---
## Consequences Of Violation
Reduced discoverability; scattered configuration across providers increases maintenance cost when onboarding developers.
---

## Rule: Stack Multiple Attributes for Multiple Registrations
---
## Category
Code Organization
---
## Rule
Use separate stacked attributes for each observer, scope, collection, or builder registration instead of combining them into a single string or array.
---
## Reason
Each attribute is independently readable, testable, and removable. Stacked attributes mirror PHP's native attribute syntax and clarify that multiple registrations of the same type are treated as additive.
---
## Bad Example
```php
#[ObservedBy([OrderObserver::class, AuditObserver::class])]
class Order extends Model
{
    //
}
```
---
## Good Example
```php
#[ObservedBy(OrderObserver::class)]
#[ObservedBy(AuditObserver::class)]
class Order extends Model
{
    //
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Non-standard attribute usage confuses developers; array wrapping breaks the conventional additive contract and may not be supported by future tooling.
---

## Rule: Group All Attribute Registrations Together
---
## Category
Code Organization
---
## Rule
Place all attribute registrations directly above the class declaration in a consistent order: `#[ObservedBy]`, `#[ScopedBy]`, `#[CollectedBy]`, `#[UseEloquentBuilder]`.
---
## Reason
A single block of attributes at the top of the class provides an immediate behavioral summary without scanning the class body. Consistent ordering reduces cognitive load.
---
## Bad Example
```php
#[ObservedBy(OrderObserver::class)]
class Order extends Model
{
    use SomeTrait;

    // ...
}

#[ScopedBy(TenantScope::class)]
```
---
## Good Example
```php
#[ObservedBy(OrderObserver::class)]
#[ScopedBy(TenantScope::class)]
#[CollectedBy(OrderCollection::class)]
#[UseEloquentBuilder(OrderBuilder::class)]
class Order extends Model
{
    //
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Scattered or unordered attributes reduce the readability benefits of the attribute-based approach, reintroducing discoverability problems.
---

## Rule: Use `#[ScopedBy]` Over `addGlobalScope` in `boot()`
---
## Category
Code Organization
---
## Rule
Use `#[ScopedBy(ScopeClass::class)]` to register global scopes instead of calling `static::addGlobalScope()` inside a `boot()` method.
---
## Reason
The attribute approach makes scope registration visible at the class level, eliminates boilerplate trait or boot method code, and prevents scope registration from being buried inside method bodies.
---
## Bad Example
```php
class Order extends Model
{
    protected static function boot(): void
    {
        parent::boot();
        static::addGlobalScope(new TenantScope());
    }
}
```
---
## Good Example
```php
#[ScopedBy(TenantScope::class)]
class Order extends Model
{
    //
}
```
---
## Exceptions
Use `boot()` when the scope requires constructor parameters that depend on runtime state (e.g., `new TenantScope(auth()->id())`).
---
## Consequences Of Violation
Unnecessary boilerplate; scope registration hidden inside boot method reduces readability.
---

## Rule: Use `#[CollectedBy]` Over `newCollection` Override
---
## Category
Code Organization
---
## Rule
Use `#[CollectedBy(CustomCollection::class)]` to set a custom collection class instead of overriding the `newCollection()` method on the model.
---
## Reason
The attribute is declarative, requires no method body, and makes the custom collection binding visible at the class level alongside other configuration.
---
## Bad Example
```php
class Order extends Model
{
    public function newCollection(array $models = []): OrderCollection
    {
        return new OrderCollection($models);
    }
}
```
---
## Good Example
```php
#[CollectedBy(OrderCollection::class)]
class Order extends Model
{
    //
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Extra boilerplate method; custom collection binding is less discoverable compared to an attribute.
---

## Rule: Use `#[UseEloquentBuilder]` Over `newEloquentBuilder` Override
---
## Category
Code Organization
---
## Rule
Use `#[UseEloquentBuilder(CustomBuilder::class)]` to set a custom query builder class instead of overriding the `newEloquentBuilder()` method.
---
## Reason
The attribute provides a declarative, zero-boilerplate way to bind a custom builder, keeping the model class focused on domain logic rather than wiring.
---
## Bad Example
```php
class Order extends Model
{
    public function newEloquentBuilder($query): OrderBuilder
    {
        return new OrderBuilder($query);
    }
}
```
---
## Good Example
```php
#[UseEloquentBuilder(OrderBuilder::class)]
class Order extends Model
{
    //
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unnecessary method override; reduced discoverability of the custom builder binding.
---

## Rule: Verify Child Model Attribute Inheritance
---
## Category
Design
---
## Rule
Do not repeat parent attribute registrations on child models unless the child explicitly needs additional or different registrations.
---
## Reason
Attribute registrations are inherited. Duplicating parent attributes on child models creates maintenance debt — changes must be made in multiple places and the intent to override versus duplicate is ambiguous.
---
## Bad Example
```php
#[ObservedBy(AuditObserver::class)]
class BaseModel extends Model { /* ... */ }

#[ObservedBy(AuditObserver::class)]
class User extends BaseModel { /* ... */ }
```
---
## Good Example
```php
#[ObservedBy(AuditObserver::class)]
class BaseModel extends Model { /* ... */ }

// AuditObserver already inherited from BaseModel
class User extends BaseModel { /* ... */ }
```
---
## Exceptions
Repeat the attribute only when the child model genuinely needs an additional or different registration and cannot use STI or polymorphic patterns.
---
## Consequences Of Violation
Duplicated registrations cause maintenance drift; one sibling may be updated while others are forgotten, leading to inconsistent behavior.
---

## Rule: Combine Attribute Registration with Trait Decomposition
---
## Category
Code Organization
---
## Rule
Keep attribute registrations on the model class itself and trait methods on traits; do not move attribute registration into traits.
---
## Reason
Attributes on the model class provide a single-line summary of all registered behaviors. Moving attributes into traits hides this summary and forces developers to inspect every used trait to understand the model's full registration surface.
---
## Bad Example
```php
trait HasAudit
{
    #[ObservedBy(AuditObserver::class)]
    // Trait with attribute — registration hidden
}
```
---
## Good Example
```php
#[ObservedBy(AuditObserver::class)]
class Order extends Model
{
    use HasAudit; // Trait handles behavior, not registration
}
```
---
## Exceptions
Package traits that must self-register are the only acceptable case (e.g., a third-party package trait that includes `#[ObservedBy]`).
---
## Consequences Of Violation
Attribute-based discoverability is lost; developers must inspect every trait to understand what is registered on the model.
---

## Rule: Do Not Register Observers in Service Providers When Attributes Suffice
---
## Category
Code Organization
---
## Rule
Do not call `Model::observe()` in a service provider when the observer could be registered via `#[ObservedBy]` on the model class.
---
## Reason
Service provider registration scatters observer bindings away from the model they observe. Centralizing registration on the model class via attributes obsoletes the provider-based approach for static registration.
---
## Bad Example
```php
// In AppServiceProvider:
public function boot(): void
{
    Order::observe(OrderObserver::class);
    Invoice::observe(InvoiceObserver::class);
    Payment::observe(PaymentObserver::class);
}
```
---
## Good Example
```php
// On the model:
#[ObservedBy(OrderObserver::class)]
class Order extends Model
{
    //
}
```
---
## Exceptions
Use service provider registration when the observer class depends on runtime resolution (e.g., `$this->app->make(Observer::class)` with constructor parameters).
---
## Consequences Of Violation
Scattered registration in providers increases maintenance overhead, especially when models are moved between modules or domains.
---

## Rule: Keep `boot()` Reserved for Runtime-Conditional Registration
---
## Category
Design
---
## Rule
Limit `boot()` method usage on models exclusively to registration logic that cannot be expressed statically through attributes (environment checks, dynamic class resolution, feature flags).
---
## Reason
Static attribute registration should be the default. Any `boot()` method that duplicates attribute-registerable functionality (observers, scopes, builders) is unnecessary code that reduces readability.
---
## Bad Example
```php
class Order extends Model
{
    protected static function boot(): void
    {
        parent::boot();
        if (config('features.audit')) {
            static::observe(AuditObserver::class);
        }
    }
}
```
---
## Good Example
```php
#[ObservedBy(OrderObserver::class)]
class Order extends Model
{
    protected static function boot(): void
    {
        parent::boot();
        if (config('features.audit')) {
            static::observe(AuditObserver::class);
        }
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unnecessary boot method obscures the model's registration surface; developers cannot determine what is registered without reading the method body.
