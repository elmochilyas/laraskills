## Handle Null Explicitly in get and set
---
## Category
Reliability
---
## Rule
Always handle `null` values explicitly in both `get()` and `set()` methods. Return `null` from `get()` when the database value is null and the column is nullable. Return `[$key => null]` from `set()` when null is assigned.
---
## Reason
Auto-coercing null to a default value causes silent data loss when nullable columns are introduced. Explicit null handling preserves null semantics and prevents subtle bugs when null is a meaningful domain value.
---
## Bad Example
```php
public function get(Model $model, string $key, mixed $value, array $attributes): Money
{
    return new Money($value / 100); // Fails when $value is null
}

public function set(Model $model, string $key, mixed $value, array $attributes): array
{
    return [$key => $value->toCents()]; // Fails when $value is null
}
```
---
## Good Example
```php
public function get(Model $model, string $key, mixed $value, array $attributes): ?Money
{
    return $value === null ? null : new Money($value / 100);
}

public function set(Model $model, string $key, mixed $value, array $attributes): array
{
    if ($value === null) {
        return [$key => null];
    }
    return [$key => $value->toCents()];
}
```
---
## Exceptions
When the column is defined as `NOT NULL` in the database and the domain guarantees the value is always present, null handling can be omitted but should be documented.
---
## Consequences Of Violation
Runtime type errors when null values are encountered, silent corruption of null to meaningless defaults, data integrity issues when nullable columns are introduced after deployment.

---
## Return Full Key-Value Array From set
---
## Category
Design
---
## Rule
Always return an associative array with the attribute key as the array key from `set()`. Return `[$key => $value]` even when setting only one attribute.
---
## Reason
The array return contract supports multi-attribute mutations. Returning a single value or a differently-keyed array breaks the casting contract. The `$key` provided by Laravel must be used as the array key for consistency.
---
## Bad Example
```php
public function set(Model $model, string $key, mixed $value, array $attributes): array
{
    return ['total_cents' => $value * 100]; // Wrong key — hardcoded
}
```
---
## Good Example
```php
public function set(Model $model, string $key, mixed $value, array $attributes): array
{
    return [$key => $value * 100];
}
```
---
## Exceptions
When implementing multi-attribute casts that intentionally update multiple columns, return an array with multiple keys, one of which is the original `$key`.
---
## Consequences Of Violation
Broken attribute assignment — the wrong attribute is updated, or no attribute is updated, causing data corruption and debugging confusion.

---
## Keep Cast Methods Fast — No DB Queries or External Calls
---
## Category
Performance
---
## Rule
Never perform database queries, HTTP requests, or filesystem operations inside `get()` or `set()` methods. These methods execute on every attribute read and write.
---
## Reason
Custom casts run synchronously during attribute access. External calls inside cast methods increase latency for every attribute access, block the request thread, and create hidden N+1 problems that are difficult to diagnose.
---
## Bad Example
```php
public function get(Model $model, string $key, mixed $value, array $attributes): Role
{
    $permissions = $model->permissions()->pluck('name'); // Hidden query on every read
    return new Role($value, $permissions);
}
```
---
## Good Example
```php
public function get(Model $model, string $key, mixed $value, array $attributes): Role
{
    return new Role($value);
}
```
---
## Exceptions
When the cast must validate a value against a small, cached lookup (e.g., an in-memory currency list), the cost is acceptable as long as no I/O occurs.
---
## Consequences Of Violation
N+1 query problems from attribute access, request latency spikes, difficult-to-diagnose performance issues, database connection exhaustion under load.

---
## Use Model Instance for Context Only, Not Business Logic
---
## Category
Design
---
## Rule
Use the `$model` parameter in `get()` and `set()` only for attribute name resolution or accessing sibling attribute values. Do not call model methods, relationships, or business logic through the model instance.
---
## Reason
Using the model instance for business logic couples the cast to the model's internal API, making the cast fragile, model-specific, and untestable in isolation. The cast should transform data, not orchestrate domain behavior.
---
## Bad Example
```php
public function get(Model $model, string $key, mixed $value, array $attributes): float
{
    return $model->applyDiscount($value); // Business logic in cast
}
```
---
## Good Example
```php
public function get(Model $model, string $key, mixed $value, array $attributes): float
{
    return (float) $value;
}
```
---
## Exceptions
Valid use of the model instance includes checking sibling attribute values for multi-attribute casts or resolving dynamic column names.
---
## Consequences Of Violation
Fragile casts that break when model methods change, casts that cannot be reused across models, difficulty unit testing casts in isolation without bootstrapping full model instances.

---
## Implement Both get and set for Bidirectional Casts
---
## Category
Framework Usage
---
## Rule
When implementing `CastsAttributes`, implement both `get()` and `set()` methods. If only one direction is needed, use `CastsInboundAttributes` (write-only) or an accessor (read-only) instead.
---
## Reason
`CastsAttributes` contracts for bidirectional transformation. Leaving one method unimplemented or throwing an exception violates the contract and causes cryptic errors when the framework calls the missing method.
---
## Bad Example
```php
class MoneyCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): Money
    {
        return new Money($value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        throw new \RuntimeException('Not implemented'); // Breaks save/update
    }
}
```
---
## Good Example
```php
class MoneyCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): Money
    {
        return new Money($value / 100);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        if ($value instanceof Money) {
            $value = $value->cents;
        }
        return [$key => $value];
    }
}
```
---
## Exceptions
When using `CastsInboundAttributes` intentionally for write-only transformations, implement only `set()` as the interface contract allows it.
---
## Consequences Of Violation
Runtime exceptions when saving or updating models with the cast attribute, incomplete cast implementation that silently fails in edge cases, broken bidirectional transformation.
