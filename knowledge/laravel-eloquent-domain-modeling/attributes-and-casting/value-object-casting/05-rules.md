## Handle Null Explicitly in Both get and set
---
## Category
Reliability
---
## Rule
Handle `null` values explicitly in both `get()` and `set()` methods of value object casts. Return `null` from `get()` for nullable columns. Return `[$key => null]` from `set()` when null is assigned.
---
## Reason
Value object constructors typically throw exceptions on invalid input. Passing `null` to a value object constructor crashes with a type error. Nullable columns must preserve null semantics throughout the cast.
---
## Bad Example
```php
public function get(Model $model, string $key, mixed $value, array $attributes): Email
{
    return new Email($value); // Fatal error when $value is null
}
```
---
## Good Example
```php
public function get(Model $model, string $key, mixed $value, array $attributes): ?Email
{
    return $value === null ? null : new Email($value);
}

public function set(Model $model, string $key, mixed $value, array $attributes): array
{
    if ($value === null) {
        return [$key => null];
    }
    return [$key => (string) $value];
}
```
---
## Exceptions
When the column is defined as `NOT NULL` in both the database and the domain, null handling can be omitted but should be documented.
---
## Consequences Of Violation
Runtime exceptions when nullable columns contain null, silent null-to-default coercion, data integrity issues, type errors from null passed to value object constructors.

---
## Accept Both Scalar and Value Object Instances in set
---
## Category
Design
---
## Rule
Handle both the raw scalar value and an already-constructed value object instance in the `set()` method. Type-check and convert accordingly.
---
## Reason
Model attributes can be assigned both from user input (scalar strings/integers) and from programmatic code (value object instances). A robust `set()` handles both cases, providing flexibility and preventing type errors.
---
## Bad Example
```php
public function set(Model $model, string $key, mixed $value, array $attributes): array
{
    return [$key => $value->toCents()]; // Fatal error when $value is a raw scalar
}
```
---
## Good Example
```php
public function set(Model $model, string $key, mixed $value, array $attributes): array
{
    if ($value instanceof Money) {
        return [$key => $value->toCents()];
    }
    return [$key => (int) ($value * 100)]; // Raw scalar — assume cents?
}
```
---
## Exceptions
When the attribute is only assigned programmatically through value objects and never from user input, scalar handling can be omitted if documented.
---
## Consequences Of Violation
Type errors when assigning raw values to cast attributes, brittle cast that forces callers to always construct value objects before assignment.

---
## Keep the Cast Focused on Serialization, Not Validation
---
## Category
Design
---
## Rule
The cast's `get()` and `set()` methods should handle format conversion only. Delegate validation to the value object's constructor, not the cast class.
---
## Reason
Validation in the cast duplicates the value object's own validation and creates two places where invariants must be enforced. The value object constructor is the single authoritative validation boundary.
---
## Bad Example
```php
public function get(Model $model, string $key, mixed $value, array $attributes): Email
{
    if (! filter_var($value, FILTER_VALIDATE_EMAIL)) {
        throw new \InvalidArgumentException(); // Validation duplicated in cast
    }
    return new Email($value);
}
```
---
## Good Example
```php
public function get(Model $model, string $key, mixed $value, array $attributes): ?Email
{
    return $value === null ? null : new Email($value); // Validation in Email constructor
}

// Email constructor validates
class Email
{
    public function __construct(public readonly string $address)
    {
        if (! filter_var($address, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: {$address}");
        }
    }
}
```
---
## Exceptions
When the cast must transform data before the value object can consume it (e.g., dividing cents by 100 before passing to a Money constructor), the transformation belongs in the cast.
---
## Consequences Of Violation
Duplicated validation logic, validation inconsistency between cast and value object, violation of the single responsibility principle, harder to test validation in isolation.

---
## Use Castable Interface for Multi-Model Value Objects
---
## Category
Code Organization
---
## Rule
Implement `Castable` on value objects used across multiple models to enable self-casting registration. For single-use value objects, register the cast class directly.
---
## Reason
When the same value object appears in multiple models, `Castable` eliminates duplicate cast class references and keeps the serialization logic tied to the value object. This reduces duplication and makes refactoring easier.
---
## Bad Example
```php
// Same cast class referenced in every model
class User extends Model { protected $casts = ['email' => EmailCast::class]; }
class Contact extends Model { protected $casts = ['email' => EmailCast::class]; }
class Lead extends Model { protected $casts = ['email' => EmailCast::class]; }
```
---
## Good Example
```php
// Value object knows how to cast itself
class Email implements Castable
{
    public static function castUsing(): string
    {
        return EmailCast::class;
    }
}

// Models register the value object directly
class User extends Model { protected $casts = ['email' => Email::class]; }
class Contact extends Model { protected $casts = ['email' => Email::class]; }
```
---
## Exceptions
When the value object is used in only one model, direct cast registration is simpler and preferred.
---
## Consequences Of Violation
Duplicate cast class references across models, higher refactoring cost when cast logic changes, easier to introduce inconsistencies between models.

---
## Return Value Objects From get, Not Plain Arrays
---
## Category
Design
---
## Rule
The `get()` method must return a value object instance (or null for nullable columns). Do not return plain arrays, strings, or scalars from a value object cast's `get()`.
---
## Reason
The purpose of a value object cast is to provide domain-typed access to attributes. Returning plain data defeats the purpose, requiring callers to manually construct value objects and breaking the abstraction.
---
## Bad Example
```php
public function get(Model $model, string $key, mixed $value, array $attributes): array
{
    return json_decode($value, true); // Returns raw array, not a value object
}
```
---
## Good Example
```php
public function get(Model $model, string $key, mixed $value, array $attributes): ?Address
{
    if ($value === null) return null;
    $data = json_decode($value, true);
    return new Address(
        street: $data['street'],
        city: $data['city'],
        state: $data['state'],
        postalCode: $data['postal_code'],
        country: $data['country'],
    );
}
```
---
## Exceptions
When the "value object" is a simple typed wrapper around a scalar with no additional methods, consider whether a value object cast is warranted at all.
---
## Consequences Of Violation
Callers must manually construct value objects from raw data, breaking the encapsulation the cast is meant to provide, scattered construction logic across the codebase.
