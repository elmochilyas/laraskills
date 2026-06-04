# Phase 5: Rules — Base Model Class

## Rule: Always Define `$fillable` on Every Model
---
## Category
Security
---
## Rule
Always define `$fillable` as an explicit whitelist on every Eloquent model and never use `$guarded = []`.
---
## Reason
Mass assignment protection is a security boundary. An explicit `$fillable` whitelist ensures only intended attributes can be set via `create()` or `update()`, preventing unintended attribute overwrites from user input.
---
## Bad Example
```php
class User extends Model
{
    protected $guarded = [];
    // All attributes mass-assignable — is_admin can be set via request
}
```
---
## Good Example
```php
class User extends Model
{
    protected $fillable = ['name', 'email', 'password'];
    // Only whitelisted attributes are mass-assignable
}
```
---
## Exceptions
Legacy projects migrating from `$guarded` may add fillable attributes incrementally, but `$guarded = []` must never be the final state.
---
## Consequences Of Violation
Critical mass-assignment vulnerability; any column on the table may be set by the user, including privilege escalation fields like `is_admin`, `role_id`, or `balance`.
---

## Rule: Place Sensitive Attributes in `$hidden`
---
## Category
Security
---
## Rule
Always list sensitive attributes (passwords, tokens, internal notes) in the `$hidden` property to prevent accidental serialization.
---
## Reason
Eloquent's `toArray()` and `toJson()` are called implicitly by API resources, controllers, and queued job payloads. Leaked credentials in serialized output are compliance violations (PCI-DSS, GDPR) and security incidents.
---
## Bad Example
```php
class User extends Model
{
    protected $fillable = ['name', 'email', 'password'];
    // password and remember_token will be included in JSON output
}
```
---
## Good Example
```php
class User extends Model
{
    protected $fillable = ['name', 'email', 'password'];
    protected $hidden = ['password', 'remember_token'];
}
```
---
## Exceptions
Use `$visible` instead of `$hidden` when only a select few attributes should be visible in serialization.
---
## Consequences Of Violation
Credential leakage in API responses; compliance failures; security audit findings.
---

## Rule: Create a Project-Specific Base Model
---
## Category
Code Organization
---
## Rule
Create `App\Models\BaseModel` extending `Illuminate\Database\Eloquent\Model` for all app-wide configuration defaults instead of duplicating them on every model.
---
## Reason
A single base model class centralizes serialization format, date format, strict mode enforcement, and global trait usage. Every model then extends `BaseModel`, ensuring consistent behavior across the application.
---
## Bad Example
```php
class User extends Model
{
    protected $dateFormat = 'Y-m-d H:i:s';
    // Duplicated on Order, Invoice, Payment...
}

class Order extends Model
{
    protected $dateFormat = 'Y-m-d H:i:s';
}
```
---
## Good Example
```php
abstract class BaseModel extends Model
{
    protected $dateFormat = 'Y-m-d H:i:s';
}

class User extends BaseModel { /* dateFormat inherited */ }
class Order extends BaseModel { /* dateFormat inherited */ }
```
---
## Exceptions
Third-party package models that must extend a vendor base class cannot use the project's `BaseModel`.
---
## Consequences Of Violation
Duplicated configuration across N models multiplies maintenance cost when a global default must change; inconsistent behavior if one model misses the update.
---

## Rule: Use `Model::withoutEvents` for Bulk Operations
---
## Category
Performance
---
## Rule
Wrap bulk persistence operations that do not require event side effects in `Model::withoutEvents()`.
---
## Reason
Model events (`creating`, `created`, `updating`, `updated`) fire per-row during bulk operations. Disabling events for batch imports, mass updates, or data migrations eliminates unnecessary overhead without changing the persistence result.
---
## Bad Example
```php
foreach ($rows as $row) {
    Order::create($row); // Events fire 10,000 times
}
```
---
## Good Example
```php
Order::withoutEvents(function () use ($rows) {
    foreach ($rows as $row) {
        Order::create($row); // No event overhead
    }
});
```
---
## Exceptions
Keep events enabled when listeners have side effects that must occur per-row (e.g., sending a welcome email on `created`).
---
## Consequences Of Violation
Significant performance degradation on bulk operations; unnecessary event dispatch for operations where listeners are irrelevant.
---

## Rule: Use `toBase()` for Read-Only Bulk Queries
---
## Category
Performance
---
## Rule
Use `toBase()` on query builders for read-only operations that do not require Eloquent model features (accessors, mutators, relationships) to skip hydration overhead.
---
## Reason
Hydrating Eloquent models for each row in a large result set is memory-intensive. `toBase()` returns plain `stdClass` objects, reducing memory allocation and hydration time.
---
## Bad Example
```php
$users = User::where('active', true)->get(); // Hydrates 50k User models
```
---
## Good Example
```php
$users = User::where('active', true)->toBase()->get(); // Returns stdClass
```
---
## Exceptions
Use full model hydration when the result set needs relationship loading, accessor values, or attribute casting.
---
## Consequences Of Violation
Unnecessary memory pressure and reduced throughput for read-heavy endpoints or reports; potential out-of-memory errors on large datasets.
---

## Rule: Override `$table` When Convention Does Not Match
---
## Category
Design
---
## Rule
Always set `protected $table` explicitly on a model when the database table name does not match the snake_case plural of the class name.
---
## Reason
Relying on convention when the table name is non-standard silently maps to the wrong table. Data reads return empty sets or wrong rows; writes create or modify data in the wrong table.
---
## Bad Example
```php
class Metadata extends Model
{
    // Convention gives "metadata" (already plural)
    // But the actual table is "model_meta"
}
```
---
## Good Example
```php
class Metadata extends Model
{
    protected $table = 'model_meta';
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Silent data corruption; operations target the wrong table; debugging data misalignment wastes development time.
---

## Rule: Use `casts()` Method Over `$casts` Property in New Code
---
## Category
Maintainability
---
## Rule
Define attribute casting using the `casts()` method rather than the `$casts` property on all new model code.
---
## Reason
The `casts()` method supports runtime conditions, inheritance overrides, and method-based composition (e.g., calling `parent::casts()`). The `$casts` property is static and cannot reference runtime values.
---
## Bad Example
```php
class Order extends Model
{
    protected $casts = [
        'total_cents' => 'integer',
        'paid_at' => 'datetime',
    ];
}
```
---
## Good Example
```php
class Order extends Model
{
    protected function casts(): array
    {
        return [
            'total_cents' => 'integer',
            'paid_at' => 'datetime',
        ];
    }
}
```
---
## Exceptions
Simple models with purely static casts may use the `$casts` property for brevity.
---
## Consequences Of Violation
Cannot extend casts in child models without redefining the entire array; cannot conditionally apply casts based on environment or configuration.
---

## Rule: Never Use Eloquent Model as a DTO
---
## Category
Design
---
## Rule
Never use Eloquent models as Data Transfer Objects for read-only projections, form data, or API request payloads.
---
## Reason
Eloquent models carry the full Active Record surface area: save, delete, relationship loading, event dispatching. Using a model as a DTO invites accidental persistence, and the overhead is unnecessary for transient data.
---
## Bad Example
```php
class OrderData extends Model
{
    public $timestamps = false;
    protected $fillable = ['customer_name', 'items'];
    // Model used as DTO — accidental save() possible
}
```
---
## Good Example
```php
readonly class OrderData
{
    public function __construct(
        public string $customerName,
        public array $items,
    ) {}
}
```
---
## Exceptions
Use a model in read-only mode (via `toBase()`) when the query requires relationship eager loading that a plain DTO cannot express.
---
## Consequences Of Violation
Accidental writes to unintended tables; unnecessary overhead from event dispatching and hydration for transient data.
---

## Rule: Always Use `create()` or `fill()` with User Input
---
## Category
Security
---
## Rule
Always use `Model::create()` or `$model->fill()` with validated user input arrays instead of directly assigning individual attributes from request data.
---
## Reason
Direct assignment bypasses mass-assignment protection. Even with `$fillable` defined, skipping the whitelist check at the call site allows future refactoring to introduce vulnerabilities.
---
## Bad Example
```php
$user = new User();
$user->name = $request->input('name');
$user->email = $request->input('email');
$user->is_admin = true; // Bypasses fillable — is_admin is set
$user->save();
```
---
## Good Example
```php
$validated = $request->validate([
    'name' => 'required|string',
    'email' => 'required|email',
]);

$user = User::create($validated); // Only fillable attributes set
```
---
## Exceptions
Direct assignment is acceptable for non-user attributes set internally by the system (e.g., `$user->email_verified_at = now()`).
---
## Consequences Of Violation
Mass-assignment protection is rendered useless; any user parameter can set any database column.
