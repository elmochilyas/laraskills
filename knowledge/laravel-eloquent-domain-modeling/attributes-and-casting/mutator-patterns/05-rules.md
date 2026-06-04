## Use Attribute::make Over Legacy Mutator Methods
---
## Category
Framework Usage
---
## Rule
Always use `Attribute::make(set: fn ($value) => ...)` syntax for defining mutators. Never use legacy `set{Attribute}Attribute()` methods in new code.
---
## Reason
The closure-based API is the modern Laravel convention, supports multi-attribute returns, and is consistent with the accessor API. Legacy methods are deprecated, less composable, and cannot return arrays for multi-attribute updates.
---
## Bad Example
```php
public function setEmailAttribute($value)
{
    $this->attributes['email'] = strtolower(trim($value));
}
```
---
## Good Example
```php
protected function email(): Attribute
{
    return Attribute::make(set: fn (string $value) => strtolower(trim($value)));
}
```
---
## Exceptions
No common exceptions. Migrate legacy mutators during refactoring.
---
## Consequences Of Violation
Deprecated API usage, inability to use multi-attribute array returns, inconsistent code style, harder maintenance.

---
## Do Not Throw Business Rule Exceptions in Mutators
---
## Category
Design
---
## Rule
Never throw domain or business rule exceptions inside a mutator's set closure. Use FormRequest validation for input rules and model methods for business logic checks.
---
## Reason
Mutators run during property assignment, which can happen in mass-assignment, fill(), and hydration contexts. Business exceptions thrown in mutators produce unexpected failures far from the validation source and violate separation of concerns.
---
## Bad Example
```php
protected function status(): Attribute
{
    return Attribute::make(
        set: fn (string $value) => throw_if(
            ! in_array($value, ['active', 'inactive']),
            new \InvalidArgumentException('Invalid status')
        )
    );
}
```
---
## Good Example
```php
// Validation in FormRequest
public function rules(): array
{
    return ['status' => 'in:active,inactive'];
}

// Mutator handles normalization only
protected function status(): Attribute
{
    return Attribute::make(set: fn (string $value) => strtolower(trim($value)));
}
```
---
## Exceptions
When throwing a type error for values that cannot be meaningfully normalized (e.g., passing an object when a string is expected), an `\InvalidArgumentException` is acceptable in the mutator.
---
## Consequences Of Violation
Unexpected exceptions during mass assignment, business logic hidden in attribute assignment, difficulty tracking validation rules, FormRequest and mutator validation inconsistency.

---
## Do Not Perform Side Effects in Mutators
---
## Category
Design
---
## Rule
Never dispatch jobs, send emails, make API calls, or perform any I/O operations inside a mutator's set closure.
---
## Reason
Mutators run synchronously on every assignment, including during model hydration from the database, mass assignment, and test setup. Side effects execute in all these contexts, causing duplicate operations and unpredictable behavior.
---
## Bad Example
```php
protected function email(): Attribute
{
    return Attribute::make(
        set: fn (string $value) => SendWelcomeEmail::dispatch($this) // Side effect in mutator
    );
}
```
---
## Good Example
```php
// Mutator normalizes only
protected function email(): Attribute
{
    return Attribute::make(set: fn (string $value) => strtolower(trim($value)));
}

// Side effects in model events or actions
protected static function booted(): void
{
    static::created(function (User $user) {
        SendWelcomeEmail::dispatch($user);
    });
}
```
---
## Exceptions
No common exceptions. Side effects belong in model events, actions, or explicit method calls.
---
## Consequences Of Violation
Duplicate email dispatches during hydration, unexpected API calls during test setup, side effects running on every mass assignment, difficult-to-trace bugs.

---
## Use FormRequest Validation for Input Rules, Not Mutators
---
## Category
Code Organization
---
## Rule
Validate user input in FormRequest classes, not in mutators. Mutators normalize data; FormRequests validate data.
---
## Reason
Validation and normalization are separate concerns. Mutators run after validation and on every assignment path (including programmatic). FormRequests provide a single, clear validation boundary at the controller level with standardized error responses.
---
## Bad Example
```php
protected function age(): Attribute
{
    return Attribute::make(
        set: fn (mixed $value) => match (true) {
            ! is_numeric($value) => throw new \InvalidArgumentException(),
            $value < 0 => throw new \InvalidArgumentException(),
            $value > 150 => throw new \InvalidArgumentException(),
            default => (int) $value,
        },
    );
}
```
---
## Good Example
```php
// FormRequest
public function rules(): array
{
    return ['age' => 'required|integer|min:0|max:150'];
}

// Mutator
protected function age(): Attribute
{
    return Attribute::make(set: fn (mixed $value) => (int) $value);
}
```
---
## Exceptions
When normalizing third-party API input where no FormRequest exists, add defensive normalization with clear error handling in the mutator.
---
## Consequences Of Violation
Validation logic duplicated across mutators and FormRequests, inconsistent error responses, validation bypassed when setting attributes programmatically.

---
## Return Arrays for Multi-Attribute Updates
---
## Category
Framework Usage
---
## Rule
When a single logical value maps to multiple database columns, return an associative array from the set closure to update all relevant attributes atomically.
---
## Reason
The array return contract enables updating multiple columns from a single assignment. This maintains atomicity — all updates happen together — and keeps the multi-attribute relationship encapsulated in one place.
---
## Bad Example
```php
protected function password(): Attribute
{
    return Attribute::make(
        set: fn (string $value) => bcrypt($value) // Only sets password
    );
}
// Caller must manually set password_changed_at
```
---
## Good Example
```php
protected function password(): Attribute
{
    return Attribute::make(
        set: fn (string $value) => [
            'password' => bcrypt($value),
            'password_changed_at' => now(),
        ],
    );
}
```
---
## Exceptions
When the mutator only needs to modify a single attribute, return the scalar value directly for simplicity.
---
## Consequences Of Violation
Forgotten related column updates, multiple separate assignment statements where one would suffice, inconsistent state when related columns are not updated together.

---
## Understand Mutator and Cast Execution Order
---
## Category
Reliability
---
## Rule
When defining both a mutator and a cast for the same attribute, remember that the mutator runs before the cast. Design both to work correctly with this order in mind.
---
## Reason
Mutators transform the raw assigned value first. The cast then transforms the mutator's output. If the mutator returns an array (multi-attribute) or a value in a format the cast doesn't expect, the cast may produce incorrect results or throw errors.
---
## Bad Example
```php
protected function price(): Attribute
{
    return Attribute::make(
        set: fn ($value) => str_replace('$', '', $value) // String — then cast expects int
    );
}

protected $casts = ['price' => 'decimal:2']; // Cast expects numeric string
```
---
## Good Example
```php
// Mutator normalizes the string format
protected function price(): Attribute
{
    return Attribute::make(
        set: fn ($value) => (float) str_replace(['$', ','], '', $value)
    );
}

// Cast handles the numeric value
protected $casts = ['price' => 'decimal:2'];
```
---
## Exceptions
Avoid defining both a mutator and cast for the same attribute whenever possible. Use one mechanism consistently.
---
## Consequences Of Violation
Unexpected cast results when mutator outputs don't match cast expectations, runtime type errors, silent data corruption when types are coerced unexpectedly.
