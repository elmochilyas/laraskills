## Return Plain Arrays or Scalars From serialize()
---
## Category
Framework Usage
---
## Rule
Ensure the `serialize()` method returns only plain arrays, strings, numbers, booleans, or null. The return value must be directly JSON-serializable.
---
## Reason
The return value of `serialize()` is passed directly to `json_encode()` during model serialization. Returning non-serializable types (objects, resources, closures) causes `json_encode()` to fail silently or throw, breaking API responses.
---
## Bad Example
```php
public function serialize(Model $model, string $key, mixed $value, array $attributes): Money
{
    return $value; // Returns a Money object — not JSON-serializable
}
```
---
## Good Example
```php
public function serialize(Model $model, string $key, mixed $value, array $attributes): array
{
    return [
        'amount' => $value->format(),
        'currency' => $value->currency(),
    ];
}
```
---
## Exceptions
No common exceptions. Always return JSON-serializable types from `serialize()`.
---
## Consequences Of Violation
Broken JSON API responses, silent `null` values in serialized output from failed `json_encode()`, runtime exceptions during serialization.

---
## Do Not Access Model State in serialize()
---
## Category
Design
---
## Rule
Do not access the `$model` parameter in `serialize()` for business logic, authorization checks, or relationship loading. Use it only for the attribute key if needed.
---
## Reason
The `serialize()` method receives the model instance, but using it creates hidden coupling between serialization format and model internals. The method signature includes `$model` primarily for consistency with `get()` and `set()` — not for business logic.
---
## Bad Example
```php
public function serialize(Model $model, string $key, mixed $value, array $attributes): array
{
    return [
        'amount' => $value->format(),
        'currency' => $value->currency(),
        'is_visible' => $model->user->can('view', $value), // Authorization in serialize
    ];
}
```
---
## Good Example
```php
public function serialize(Model $model, string $key, mixed $value, array $attributes): array
{
    return [
        'amount' => $value->format(),
        'currency' => $value->currency(),
    ];
}
```
---
## Exceptions
When the serialization format depends on a sibling attribute value (e.g., including a field name in the output), accessing `$attributes` is acceptable.
---
## Consequences Of Violation
Hidden coupling between serialization and model state, N+1 query problems from relationship loading in serialization, authorization logic running during serialization.

---
## Keep serialize() Focused on Format Conversion
---
## Category
Design
---
## Rule
Limit `serialize()` to converting the value object into a serializable representation. Do not apply business rules, transformations, or filtering.
---
## Reason
The serialization method is called during every `toArray()` and `toJson()`. Business logic in serialization runs implicitly during API responses, Jobs, queue serialization, and logging, causing unpredictable behavior.
---
## Bad Example
```php
public function serialize(Model $model, string $key, mixed $value, array $attributes): ?array
{
    if ($value->amount <= 0) {
        return null; // Business rule filtering in serialize
    }
    return ['amount' => $value->format()];
}
```
---
## Good Example
```php
public function serialize(Model $model, string $key, mixed $value, array $attributes): array
{
    return ['amount' => $value->format()];
}
```
---
## Exceptions
No common exceptions. Format conversion is the sole responsibility of `serialize()`.
---
## Consequences Of Violation
Business rules executed during serialization, inconsistent output depending on when serialization occurs, difficult-to-predict side effects during broadcasting, queuing, and logging.

---
## Only Implement SerializesCastableAttributes When Representation Differs
---
## Category
Maintainability
---
## Rule
Implement `SerializesCastableAttributes` only when the PHP representation differs from the desired API representation. If they are identical, do not implement the interface.
---
## Reason
Implementing `serialize()` when it returns the same value as `get()` adds unnecessary code, increases maintenance surface, and creates a redundant serialization path that must be kept in sync.
---
## Bad Example
```php
// serialize() returns the same value as get() — unnecessary implementation
public function serialize(Model $model, string $key, mixed $value, array $attributes): float
{
    return $value->toFloat(); // Same as get() output
}
```
---
## Good Example
```php
// No serialize() needed — get() value is used automatically
```
---
## Exceptions
When future API format changes are anticipated and the separation is intentionally planned, implementing `serialize()` early can reduce later refactoring.
---
## Consequences Of Violation
Unnecessary code complexity, duplicate serialization logic that must remain consistent with `get()`, confusion about which method controls serialization.

---
## Use API Resources Instead When Serialization Varies Per Model
---
## Category
Code Organization
---
## Rule
Use Laravel API Resources for serialization when the output format differs per model, per endpoint, or depends on the request context. `SerializesCastableAttributes` is for consistent serialization across all uses.
---
## Reason
`SerializesCastableAttributes` applies globally to all models using the cast. If different endpoints need different serialization formats (e.g., admin vs public view of the same attribute), API Resources provide the necessary per-endpoint control.
---
## Bad Example
```php
// Global serialize applies to all endpoints — no flexibility
class MoneyCast implements SerializesCastableAttributes
{
    public function serialize(...): array
    {
        return ['amount' => $value->format()]; // Same format for admin and public
    }
}
```
---
## Good Example
```php
// API Resource controls per-endpoint formatting
class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'salary' => $this->salary->detailedFormat(),
        ];
    }
}

class PublicUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'salary' => $this->salary->obfuscatedFormat(),
        ];
    }
}
```
---
## Exceptions
When the serialization format is truly universal across all models and endpoints, `SerializesCastableAttributes` is appropriate.
---
## Consequences Of Violation
Rigid serialization that cannot vary per context, workarounds using conditional logic inside `serialize()` based on model type, duplicated serialization logic in API Resources that override the cast's serialization.
