## Keep castUsing() Simple
---
## Category
Design
---
## Rule
Return only a fully-qualified cast class name string or a simple factory closure from `castUsing()`. Do not put complex logic or external service resolution in `castUsing()`.
---
## Reason
`castUsing()` is called at model boot time, during application startup. Complex logic here adds overhead to every request, and failures in `castUsing()` break the entire model, not just the cast attribute.
---
## Bad Example
```php
public static function castUsing(): string
{
    $config = app()->make(ConfigRepository::class)->get('casting.money');
    return $config['use_v2_cast'] ? MoneyCastV2::class : MoneyCastV1::class;
}
```
---
## Good Example
```php
public static function castUsing(): string
{
    return MoneyCast::class;
}
```
---
## Exceptions
Use factory closures when the cast class requires constructor parameters: `return fn () => new MoneyCast(currency: 'USD')`.
---
## Consequences Of Violation
Increased application boot time, fragility from runtime resolution logic at boot time, difficult-to-debug startup failures.

---
## One Cast Class Per Value Object
---
## Category
Code Organization
---
## Rule
Create one dedicated cast class per value object. Do not reuse a cast class across semantically unrelated value objects with different serialization logic.
---
## Reason
Each value object has unique serialization requirements (field mapping, format conversion, validation). Reusing cast classes across unrelated value objects forces conditional logic inside the cast and couples unrelated domain concepts.
---
## Bad Example
```php
// Single GenericCast handles both Email and Phone
class GenericCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        return match ($key) {
            'email' => new Email($value),
            'phone' => new Phone($value),
            default => $value,
        };
    }
}
```
---
## Good Example
```php
class EmailCast implements CastsAttributes { /* Email-specific logic */ }
class PhoneCast implements CastsAttributes { /* Phone-specific logic */ }
```
---
## Exceptions
When two value objects differ only in configuration (e.g., `MoneyCast` with different currencies), a single parameterized cast class is appropriate.
---
## Consequences Of Violation
Violation of the Single Responsibility Principle, cast classes bloated with conditional serialization logic, tight coupling between unrelated value objects, difficult to test independently.

---
## Only Implement Castable for Multi-Model Value Objects
---
## Category
Code Organization
---
## Rule
Implement `Castable` on value objects that are used across multiple models. For a value object used in only one model, register the cast class directly in the model's `$casts` array.
---
## Reason
`Castable` adds indirection (model → value object → cast class) that is justified only when it eliminates duplicate cast class references across multiple models. For single-use value objects, the indirection adds complexity without benefit.
---
## Bad Example
```php
// SingleModelValueObject used in only one model but implements Castable
class SingleModelValueObject implements Castable
{
    public static function castUsing(): string
    {
        return SingleModelCast::class;
    }
}
```
---
## Good Example
```php
// Direct registration — no Castable needed for single use
class User extends Model
{
    protected $casts = [
        'status' => StatusCast::class,
    ];
}
```
---
## Exceptions
When the team convention is to always implement `Castable` for consistency, apply uniformly but document the rationale.
---
## Consequences Of Violation
Unnecessary indirection making the codebase harder to navigate, extra classes loaded per request for no benefit, violating YAGNI.

---
## Use Factory Closures for Parameterized Castable Classes
---
## Category
Design
---
## Rule
Return a factory closure from `castUsing()` when the cast class requires constructor parameters that depend on the value object's context.
---
## Reason
Returning a class name string does not allow passing parameters to the cast constructor. A factory closure captures the necessary configuration at cast resolution time, enabling reusable parameterized casts.
---
## Bad Example
```php
class Money implements Castable
{
    public static function castUsing(): string
    {
        return MoneyCast::class; // MoneyCast hardcodes USD
    }
}
```
---
## Good Example
```php
class Money implements Castable
{
    public function __construct(
        public readonly int $cents,
        public readonly string $currency = 'USD',
    ) {}

    public static function castUsing(): Closure
    {
        return fn () => new MoneyCast(currency: 'USD');
    }
}
```
---
## Exceptions
When the cast class has no constructor parameters, a class name string is preferred for simplicity.
---
## Consequences Of Violation
Hardcoded cast behavior that doesn't vary with value object state, inability to configure cast behavior per value object type, duplicated cast classes for minor variations.

---
## Place Cast Classes Alongside Value Objects or in App\Casts
---
## Category
Code Organization
---
## Rule
Place the cast class either in the same file as the value object (for tightly coupled pairs) or in `App\Casts\*`. Do not scatter cast classes across unrelated directories.
---
## Reason
Consistent location conventions make casts discoverable. Placing the cast alongside the value object keeps the serialization logic co-located with the domain object, while `App\Casts\*` provides a single authoritative directory for all custom casts.
---
## Bad Example
```php
// Cast class in App\Services\MoneyCast.php — unrelated to domain
namespace App\Services;
```
---
## Good Example
```php
// Either co-located
namespace App\ValueObjects;
class Money implements Castable
{
    // ...
    private static function castUsing(): string { return MoneyCast::class; }
}

// Or in App\Casts
namespace App\Casts;
class MoneyCast implements CastsAttributes { /* ... */ }
```
---
## Exceptions
Teams may adopt a different convention as long as it is documented and applied consistently.
---
## Consequences Of Violation
Time wasted searching for cast classes, inconsistent project structure, difficulty onboarding new developers.
