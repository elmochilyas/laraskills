## Use Attribute::make Over Legacy Accessor Methods
---
## Category
Framework Usage
---
## Rule
Always use `Attribute::make(get: fn ($value) => ...)` syntax for defining accessors. Never use legacy `get{Attribute}Attribute()` methods in new code.
---
## Reason
The closure-based API is composable, supports `shouldCache`, and is the future-proof Laravel convention. Legacy methods lack caching, are harder to test, and may be deprecated.
---
## Bad Example
```php
public function getNameAttribute($value)
{
    return ucfirst($value);
}
```
---
## Good Example
```php
protected function name(): Attribute
{
    return Attribute::make(get: fn ($value) => ucfirst($value));
}
```
---
## Exceptions
No common exceptions. Migrate legacy accessors during refactoring.
---
## Consequences Of Violation
Maintainability burden of deprecated API, inability to use `shouldCache`, inconsistent code style across the codebase.

---
## Keep Accessors Pure With No Side Effects
---
## Category
Design
---
## Rule
Never write to the database, dispatch jobs, send emails, or call external APIs inside an accessor. Accessors must be pure functions of the stored value.
---
## Reason
Accessors run implicitly on every attribute read, including during serialization, Blade rendering, and debugging. Side effects cause unpredictable behavior, duplicate operations, and hard-to-trace bugs.
---
## Bad Example
```php
protected function total(): Attribute
{
    return Attribute::make(
        get: fn ($value) => $this->logAccess() + $value
    );
}
```
---
## Good Example
```php
protected function total(): Attribute
{
    return Attribute::make(get: fn ($value) => $value + $this->tax);
}
```
---
## Exceptions
Logging for debugging in non-production environments only, with a clear guard condition.
---
## Consequences Of Violation
Unpredictable behavior on reads, duplicate email dispatches, performance degradation, debugging nightmares.

---
## Cache Expensive Accessor Computations
---
## Category
Performance
---
## Rule
Use `shouldCache: true` on `Attribute::make()` when the accessor performs expensive computation, string formatting, or is accessed multiple times per request.
---
## Reason
Uncached accessors re-execute on every attribute read. Blade layouts, API resources, and serialization pipelines read the same attribute multiple times. `shouldCache` eliminates redundant computation per model instance.
---
## Bad Example
```php
protected function summary(): Attribute
{
    return Attribute::make(
        get: fn ($value) => sprintf('%s - %s', $this->name, $this->formatExpensiveReport())
    );
}
```
---
## Good Example
```php
protected function summary(): Attribute
{
    return Attribute::make(
        get: fn ($value) => sprintf('%s - %s', $this->name, $this->formatExpensiveReport()),
        shouldCache: true
    );
}
```
---
## Exceptions
Do not cache accessors whose return value should differ on each read (random values, current time) or that depend on mutable model state.
---
## Consequences Of Violation
N+1 performance degradation when expensive accessors are read multiple times (views, serialization, loops), slower page loads, unnecessary CPU usage.

---
## Never Perform Authorization in Accessors
---
## Category
Security
---
## Rule
Do not check user permissions, roles, or authorization gates inside accessors. Authorization must be explicit in controllers, policies, or middleware.
---
## Reason
Accessors run implicitly and have no access to the current request context. Implicit authorization leads to security gaps where serialized output leaks protected data, or conversely, blocks legitimate access.
---
## Bad Example
```php
protected function ssn(): Attribute
{
    return Attribute::make(
        get: fn ($value) => auth()->user()->isAdmin() ? $value : '***'
    );
}
```
---
## Good Example
```php
// In controller
if ($request->user()->can('view', $user)) {
    return $user->toArray();
}
```
---
## Exceptions
No common exceptions. Authorization must always be explicit.
---
## Consequences Of Violation
Security vulnerabilities from implicit access control, serialization leaks, hard-to-audit authorization logic, broken API responses.

---
## Do Not Place Business Logic in Accessors
---
## Category
Code Organization
---
## Rule
Keep accessors limited to presentation transformations (formatting, concatenation, type conversion). Extract business rules, computations, and validation into model methods or domain services.
---
## Reason
Accessors run transparently on every read, including during serialization and Blade rendering. Business logic in accessors couples presentation formatting to domain rules, making the code harder to test, reason about, and refactor.
---
## Bad Example
```php
protected function discountPrice(): Attribute
{
    return Attribute::make(
        get: fn ($value) => $this->isVip()
            ? $value * 0.8
            : $value
    );
}
```
---
## Good Example
```php
// Accessor handles formatting only
protected function discountPrice(): Attribute
{
    return Attribute::make(
        get: fn ($value) => number_format($value, 2)
    );
}

// Business logic in explicit method
public function calculateDiscountedPrice(): Money
{
    return $this->isVip() ? $this->price->applyDiscount(0.8) : $this->price;
}
```
---
## Exceptions
Trivial computed properties that are purely derived from other attributes (e.g., `fullName` from `firstName` and `lastName`) are acceptable as accessors.
---
## Consequences Of Violation
Business rules executed implicitly during serialization, difficult to test business logic in isolation, logic scattered across accessors instead of centralized in domain methods.

---
## Do Not Use Accessors as Service Locators
---
## Category
Design
---
## Rule
Avoid calling `app()->make()`, `resolve()`, or any service container resolution inside accessors. Accessors must not establish dependencies on application services.
---
## Reason
Accessors are attribute transforms, not dependency injection points. Container calls inside accessors create hidden coupling to the service container, make testing difficult, and violate the principle of explicit dependencies.
---
## Bad Example
```php
protected function avatarUrl(): Attribute
{
    return Attribute::make(
        get: fn ($value) => app(FileStorage::class)->url($value)
    );
}
```
---
## Good Example
```php
// Inject via explicit model method
public function getAvatarUrl(FileStorage $storage): string
{
    return $storage->url($this->avatar);
}
```
---
## Exceptions
No common exceptions. Always prefer explicit dependency injection through methods or actions.
---
## Consequences Of Violation
Hidden coupling to the container, difficult to unit test accessors without bootstrapping the full framework, violation of dependency inversion principle.

---
## Ensure Accessor Return Type Consistency
---
## Category
Reliability
---
## Rule
Always return the same type from an accessor regardless of the input value or model state. Do not return `string` conditionally and `null` under other circumstances without documenting the contract.
---
## Reason
Inconsistent return types from accessors cause type errors in Blade templates, API resources, and chained method calls. Callers should be able to rely on a predictable return type.
---
## Bad Example
```php
protected function displayName(): Attribute
{
    return Attribute::make(
        get: fn ($value) => $value ? ucfirst($value) : null
    );
}
```
---
## Good Example
```php
protected function displayName(): Attribute
{
    return Attribute::make(
        get: fn ($value) => $value ? ucfirst($value) : ''
    );
}
```
---
## Exceptions
When the backing column is nullable and the domain meaning of null is distinct from empty, return `null` explicitly and document the contract.
---
## Consequences Of Violation
Type errors at runtime, Blade template errors from calling methods on null, inconsistent API response shapes, increased debugging time.

---
## Be Deliberate With $appends for Serialization
---
## Category
Security
---
## Rule
Only add accessors to `$appends` when the computed value must be exposed in JSON and array serialization. Review each appended accessor for data sensitivity.
---
## Reason
Accessors listed in `$appends` are included in every `toArray()` and `toJson()` response, potentially exposing computed data to API consumers, including sensitive derived values.
---
## Bad Example
```php
class User extends Model
{
    protected $appends = ['full_name', 'ssn_last_four', 'internal_notes'];

    protected function internalNotes(): Attribute
    {
        return Attribute::make(get: fn ($value) => $this->notes);
    }
}
```
---
## Good Example
```php
class User extends Model
{
    protected $appends = ['full_name'];

    protected function fullName(): Attribute
    {
        return Attribute::make(get: fn ($value) => "{$this->first_name} {$this->last_name}");
    }
}
```
---
## Exceptions
When using API Resources that explicitly control serialization, `$appends` can be more permissive since the resource layer filters output.
---
## Consequences Of Violation
Unintentional data exposure through API responses, serialization of sensitive computed values, brittle responses that change when accessors are modified.
