# Phase 5: Rules — Custom Builder Pattern

## Rule 1: Only Create Custom Builders for Models with 5+ Distinct Query Methods
---
## Category
Code Organization
---
## Rule
Create a custom builder class only when the model has 5 or more distinct custom query methods or scopes. Do not create a custom builder for every model.
---
## Reason
A custom builder is an abstraction that adds indirection. For models with 1-2 simple scopes, the model class itself or anonymous scopes are sufficient. Premature extraction adds unnecessary file count and cognitive overhead.
---
## Bad Example
```php
// Custom builder for a model with only 2 scopes
class SimpleModelBuilder extends Builder {
    public function active(): static { return $this->where('active', true); }
    public function recent(): static { return $this->latest(); }
}
```
---
## Good Example
```php
// Keep scopes on the model; create builder only when complexity warrants it
class User extends Model {
    public function scopeActive(Builder $q): Builder { return $q->where('active', true); }
    public function scopeVerified(Builder $q): Builder { return $q->whereNotNull('email_verified_at'); }
}
```
---
## Exceptions
Models with fewer methods used extensively across the codebase where a builder provides meaningful testability or DI benefits. Models that are part of a package/library consumed by other applications.
---
## Consequences Of Violation
Unnecessary file overhead; reduced readability from indirection; team confusion about when to use builders vs scopes.

## Rule 2: Register Custom Builders via `HasBuilder` Trait (Laravel 10+) Instead of `newEloquentBuilder()`
---
## Category
Framework Usage
---
## Rule
Use the `HasBuilder` trait with the `$builder` static property to register a custom builder on Laravel 10+. Fall back to `newEloquentBuilder()` only on pre-Laravel 10 projects.
---
## Reason
`HasBuilder` is declarative, requires less boilerplate, and is the Laravel-convention approach for custom builders. `newEloquentBuilder()` is an override hook that couples the model to builder instantiation logic.
---
## Bad Example
```php
class User extends Model {
    public function newEloquentBuilder($query): UserBuilder {
        return new UserBuilder($query);
    }
}
```
---
## Good Example
```php
use Illuminate\Database\Eloquent\Concerns\HasBuilder;

class User extends Model {
    use HasBuilder;
    protected static string $builder = UserBuilder::class;
}
```
---
## Exceptions
Projects still on Laravel 9 or earlier must use `newEloquentBuilder()`. Custom builder registration that requires constructor arguments beyond the query instance.
---
## Consequences Of Violation
Unnecessary boilerplate; missed convention; harder IDE discovery; confusion for team members reading the code.

## Rule 3: Always Return `: static` from Fluent Custom Builder Methods
---
## Category
Maintainability
---
## Rule
Declare all fluent custom builder methods with the `: static` return type. Never omit the return type or use `: self`, `: Builder`, or `: mixed`.
---
## Reason
`static` enables proper IDE autocompletion for chained methods. Without it, the IDE resolves to the base `Builder` type and loses all custom method suggestions, breaking the fluent chain experience.
---
## Bad Example
```php
class UserBuilder extends Builder {
    public function active() // returns Builder, not UserBuilder
    {
        return $this->where('active', true);
    }
}
```
---
## Good Example
```php
class UserBuilder extends Builder {
    public function active(): static
    {
        return $this->where('active', true);
    }
}
```
---
## Exceptions
Methods that intentionally return a different type (e.g., `toBase()`, `dd()`, or a custom aggregator returning `int`). Those should have explicit return types documenting the actual return.
---
## Consequences Of Violation
Broken IDE autocompletion after the first custom method call; developer frustration; reduced adoption of custom builder methods.

## Rule 4: Never Override Core Builder Methods (`where`, `get`, `first`, `count`)
---
## Category
Reliability
---
## Rule
Do not override core Eloquent Builder methods (`where`, `get`, `first`, `count`, `orderBy`, `select`, etc.) in custom builder classes. Use distinct method names instead.
---
## Reason
Overriding core methods changes the behavior of every query on the model, including those generated internally by relationships, eager loading, and framework components. This causes unpredictable side effects that are extremely difficult to debug.
---
## Bad Example
```php
class UserBuilder extends Builder {
    public function get($columns = ['*']) {
        Log::info('User query executed');
        return parent::get($columns); // affects ALL get() calls, including relationship loading
    }
}
```
---
## Good Example
```php
class UserBuilder extends Builder {
    public function withAuditLog(): static {
        return $this; // marker method used before get()
    }
    public function get($columns = ['*']) {
        if ($this->auditLogged) { Log::info('User query executed'); }
        return parent::get($columns);
    }
}
```
---
## Exceptions
No common exceptions. Core method override is always a design smell. Use events, middleware, or explicit methods instead.
---
## Consequences Of Violation
Unexpected behavior in relationship queries; framework upgrades breaking custom logic; team members unaware that standard builder methods behave differently.

## Rule 5: Place Custom Builder Classes in `app/Models/Builders/` Directory
---
## Category
Code Organization
---
## Rule
Place all custom builder classes in the `app/Models/Builders/` directory. Use the `App\Models\Builders` namespace. Name the class after the model (e.g., `UserBuilder` for `User`).
---
## Reason
Standardized placement makes builders discoverable by convention, not by search. New team members immediately know where to find custom query logic. Consistent with Laravel ecosystem conventions.
---
## Bad Example
```php
// app/Builders/UserBuilder.php — wrong location
```
---
## Good Example
```php
// app/Models/Builders/UserBuilder.php
namespace App\Models\Builders;
```
---
## Exceptions
Builders shared across multiple models (e.g., a base builder for a polymorphic model). Use `app/Models/Builders/Shared/` in that case.
---
## Consequences Of Violation
Builders scattered across the codebase; difficulty finding query logic; inconsistent naming and namespacing.

## Rule 6: Never Place Business Logic (Calculations, External Calls) in Builder Methods
---
## Category
Architecture
---
## Rule
Limit custom builder methods to query construction only — adding WHERE clauses, JOINs, ORDER BY, and SELECT modifications. Do not perform calculations, API calls, file I/O, or event dispatching inside builder methods.
---
## Reason
Builder methods are called during query construction and may be executed multiple times or in unexpected contexts. Business logic belongs in services, actions, or domain classes, not in the query layer. Mixing concerns violates single responsibility.
---
## Bad Example
```php
class UserBuilder extends Builder {
    public function eligibleForPromotion(): static {
        $this->calculateDiscounts(); // business logic
        Mail::send(...); // external side effect
        return $this->where('active', true);
    }
}
```
---
## Good Example
```php
class UserBuilder extends Builder {
    public function eligibleForPromotion(): static {
        return $this->where('active', true)
            ->whereNotNull('email_verified_at');
    }
}
```
---
## Exceptions
Builder methods that set query-level metadata needed for later execution (e.g., marking a query for audit). Even then, use dedicated state on the builder, not business operations.
---
## Consequences Of Violation
Unpredictable builder behavior; side effects triggered during query construction; testing complexity; violation of separation of concerns.

## Rule 7: Add `@mixin` Annotation on Model for IDE Autocompletion
---
## Category
Maintainability
---
## Rule
Add `@mixin \App\Models\Builders\UserBuilder` PHPDoc annotation on the model class for every model using a custom builder.
---
## Reason
Without `@mixin` or `@method` annotations, IDEs do not resolve custom builder methods on the model's static query methods (`User::active()`), breaking autocompletion for developers.
---
## Bad Example
```php
class User extends Model {
    use HasBuilder;
    protected static string $builder = UserBuilder::class;
    // No @mixin annotation — IDE shows no custom methods
}
```
---
## Good Example
```php
/** @mixin \App\Models\Builders\UserBuilder */
class User extends Model {
    use HasBuilder;
    protected static string $builder = UserBuilder::class;
}
```
---
## Exceptions
When using a `@method` annotation per method instead of `@mixin`. Both are acceptable, but `@mixin` is more maintainable as the builder grows.
---
## Consequences Of Violation
Developers unaware of custom builder methods; team members reverting to inline where() calls; reduced adoption of builder pattern.
