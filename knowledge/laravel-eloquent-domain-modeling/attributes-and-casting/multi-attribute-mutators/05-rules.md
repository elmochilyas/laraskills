## Document Multi-Attribute Relationships in Code Comments
---
## Category
Maintainability
---
## Rule
Add a docblock to any attribute using a multi-attribute mutator explaining which columns are updated when the attribute is assigned.
---
## Reason
A single assignment like `$model->password = '...'` updating multiple columns (`password`, `password_changed_at`) is non-obvious. Without documentation, developers debugging unexpected column changes waste significant time.
---
## Bad Example
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
## Good Example
```php
/**
 * Multi-attribute mutator: sets 'password' (hashed) and
 * 'password_changed_at' (current timestamp) atomically.
 */
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
No common exceptions. Always document multi-attribute behavior.
---
## Consequences Of Violation
Confusion during debugging when columns change without corresponding code assignment, accidental assumption that only one column is affected.

---
## Return Explicit Key-Value Arrays From Multi-Attribute Set Closures
---
## Category
Framework Usage
---
## Rule
Always return an explicit associative array with column names as keys from a multi-attribute mutator's set closure. Never rely on side effects inside the closure to set other attributes.
---
## Reason
The array return contract is the documented mechanism for multi-attribute updates. Using `$this->attribute =` assignments inside the closure circumvents Eloquent's attribute handling and can cause inconsistent state.
---
## Bad Example
```php
protected function password(): Attribute
{
    return Attribute::make(
        set: fn (string $value) => bcrypt($value)  // Only sets 'password'
    );
}
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
When only one attribute needs updating, return the scalar value directly for simplicity.
---
## Consequences Of Violation
Missing column updates when multi-attribute behavior is expected, inconsistent model state, need for additional save operations.

---
## Ensure Array Keys Correspond to Fillable Attributes
---
## Category
Reliability
---
## Rule
Verify that all keys returned from a multi-attribute mutator set closure are listed in the model's `$fillable` array or are not guarded.
---
## Reason
Multi-attribute mutators are subject to mass-assignment protection. If a returned key is not `$fillable`, the value is silently discarded, causing the related column to not be updated despite the mutator returning it.
---
## Bad Example
```php
class User extends Model
{
    protected $fillable = ['password'];

    protected function password(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => [
                'password' => bcrypt($value),
                'password_changed_at' => now(), // Not in $fillable — silently ignored
            ],
        );
    }
}
```
---
## Good Example
```php
class User extends Model
{
    protected $fillable = ['password', 'password_changed_at'];

    protected function password(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => [
                'password' => bcrypt($value),
                'password_changed_at' => now(),
            ],
        );
    }
}
```
---
## Exceptions
When using `$guarded = []`, fillable protection is disabled and any attribute can be set.
---
## Consequences Of Violation
Multi-attribute updates silently incomplete, columns not updated despite mutator returning them, data integrity issues from missing timestamp/counter updates.

---
## Do Not Use Multi-Attribute Mutators as Business Logic Substitutes
---
## Category
Design
---
## Rule
Use explicit model methods (e.g., `changePassword()`) for complex multi-field updates that involve validation, event dispatching, or business rules. Multi-attribute mutators are a mapping convenience, not a business logic pattern.
---
## Reason
Multi-attribute mutators run automatically on assignment. They hide business operations behind a simple property set, making the code's intent unclear and bypassing explicit intent-expression.
---
## Bad Example
```php
// Business logic hidden in mutator — no explicit method
$user->password = $newPassword; // Also resets tokens, sends email, logs event
```
---
## Good Example
```php
// Mutator handles mapping only
protected function password(): Attribute
{
    return Attribute::make(
        set: fn (string $value) => [
            'password' => bcrypt($value),
            'password_changed_at' => now(),
        ],
    );
}

// Business logic in explicit method
public function changePassword(string $newPassword): void
{
    $this->password = $newPassword;
    $this->tokens()->delete();
    Event::dispatch(new PasswordChanged($this));
}
```
---
## Exceptions
Simple multi-field mappings without business rules (e.g., `full_name` updating `first_name` and `last_name`) are appropriate as multi-attribute mutators.
---
## Consequences Of Violation
Business logic hidden behind implicit property assignment, unclear side effects, difficult to test business rules in isolation, events dispatched unexpectedly during mass assignment.

---
## Avoid Expensive Operations Inside Multi-Attribute Mutators
---
## Category
Performance
---
## Rule
Do not perform expensive computations, database queries, or external API calls inside a multi-attribute mutator's set closure. The closure runs synchronously on every assignment.
---
## Reason
Multi-attribute mutators execute synchronously and immediately when the property is assigned. Expensive operations block the request, cannot be queued, and run even when the assignment is part of a multi-step process.
---
## Bad Example
```php
protected function address(): Attribute
{
    return Attribute::make(
        set: fn (string $value) => [
            'address' => $value,
            'coordinates' => $this->geocode($value), // External API call — blocks assignment
        ],
    );
}
```
---
## Good Example
```php
// Mutator handles only local mapping
protected function address(): Attribute
{
    return Attribute::make(
        set: fn (string $value) => [
            'address' => $value,
            'address_normalized' => trim($value),
        ],
    );
}

// Geocoding in a queued job
public function geocodeAddress(): void
{
    GeocodeJob::dispatch($this);
}
```
---
## Exceptions
No common exceptions. Expensive operations belong in jobs or explicit method calls.
---
## Consequences Of Violation
Request latency from synchronous external calls inside property assignment, inability to retry failed operations, hidden performance bottlenecks in seemingly innocuous assignments.

---
## Do Not Introduce Side Effects Inside Multi-Attribute Mutators
---
## Category
Design
---
## Rule
Do not call `request()`, `auth()`, `session()`, or any global state accessors inside a multi-attribute mutator's set closure.
---
## Reason
Multi-attribute mutators run during attribute assignment, which can occur in contexts where request/session/auth state is unavailable (queued jobs, console commands, tests). Depending on global state creates hidden coupling and runtime failures.
---
## Bad Example
```php
protected function lastLoginAt(): Attribute
{
    return Attribute::make(
        set: fn ($value) => [
            'last_login_at' => $value,
            'last_login_ip' => request()->ip(), // Fails in console/testing
        ],
    );
}
```
---
## Good Example
```php
// Mutator sets only local data
protected function lastLoginAt(): Attribute
{
    return Attribute::make(
        set: fn ($value) => [
            'last_login_at' => $value,
        ],
    );
}

// IP logging in explicit method
public function recordLogin(Request $request): void
{
    $this->last_login_at = now();
    $this->last_login_ip = $request->ip();
    $this->save();
}
```
---
## Exceptions
No common exceptions. Global state must never be accessed inside attribute mutators.
---
## Consequences Of Violation
Runtime exceptions when assignments occur in non-HTTP contexts, untestable mutators requiring full HTTP environment bootstrap, hidden coupling to request lifecycle.
