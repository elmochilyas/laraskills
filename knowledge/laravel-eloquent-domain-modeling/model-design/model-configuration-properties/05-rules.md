# Phase 5: Rules — Model Configuration Properties

## Rule: Set Only Properties That Differ from Defaults
---
## Category
Maintainability
---
## Rule
Declare a model configuration property only when its value differs from the Laravel convention; omit properties that match the default.
---
## Reason
Explicitly setting convention-matching properties is noise that obscures meaningful overrides. Every extra property declaration is a maintenance point that may drift from the actual schema during refactoring.
---
## Bad Example
```php
class User extends Model
{
    protected $table = 'users';       // Same as convention
    protected $primaryKey = 'id';      // Same as convention
    public $incrementing = true;       // Same as convention
    protected $keyType = 'int';        // Same as convention
    public $timestamps = true;         // Same as convention
}
```
---
## Good Example
```php
class Order extends Model
{
    protected $table = 'customer_orders'; // Override — differs from convention
    protected $primaryKey = 'uuid';       // Override — differs from convention
    public $incrementing = false;         // Override — differs from convention
}
```
---
## Exceptions
A base model class may explicitly declare defaults for documentation purposes even when they match conventions, as long as child models follow the override-only rule.
---
## Consequences Of Violation
Noise obscures meaningful configuration; property values drift from schema over time without detection.
---

## Rule: Prefer `casts()` Method Over `$casts` Property
---
## Category
Maintainability
---
## Rule
Define attribute casting using the `casts()` method instead of the `$casts` property in all new model code.
---
## Reason
The `casts()` method supports inheritance (calling `parent::casts()`), runtime conditions, and dynamic cast resolution. The `$casts` property is static and cannot be extended by child models without redefining the entire array.
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
Trivial models with two or fewer static casts may use the `$casts` property for brevity if inheritance is not a concern.
---
## Consequences Of Violation
Cannot extend or override individual casts in child models; forced to duplicate entire arrays, increasing maintenance surface.
---

## Rule: Avoid `$with` for Bulk Eager Loading
---
## Category
Performance
---
## Rule
Never use the `$with` property to eagerly load relationships on every query unless the relationship is universally required for every single query against the model.
---
## Reason
`$with` silently adds a join or extra query to every retrieval including unintended contexts (counts, exists checks, background jobs). Most relationships are context-specific and should be loaded explicitly via `with()` at the query site.
---
## Bad Example
```php
class Order extends Model
{
    protected $with = ['items', 'payments'];
    // Every Order::find(), Order::count(), Order::exists() loads two extra relations
}
```
---
## Good Example
```php
class Order extends Model
{
    // No $with — relationships loaded explicitly where needed:
    // Order::with('items')->find($id);
    // Order::with('items', 'payments')->where('status', 'paid')->get();
}
```
---
## Exceptions
A model with a universally required relation (e.g., every `User` always needs its `Profile` in every context) may use `$with`, but this is extremely rare.
---
## Consequences Of Violation
Unnecessary queries on every model retrieval; N+1 problems in unexpected places; performance degradation on simple existence checks.
---

## Rule: Keep `$appends` Lightweight
---
## Category
Performance
---
## Rule
Only include accessors in `$appends` that are computationally cheap (property reads, cached calculations) and never include accessors that execute database queries.
---
## Reason
`$appends` runs every appended accessor on every serialization (`toArray()`, `toJson()`, API resource output). A slow accessor in `$appends` degrades every API response that returns the model.
---
## Bad Example
```php
class Order extends Model
{
    protected $appends = ['total_revenue'];

    public function getTotalRevenueAttribute(): string
    {
        return $this->items()->sum('price'); // DB query per serialization
    }
}
```
---
## Good Example
```php
class Order extends Model
{
    protected $appends = ['formatted_created_at'];

    public function getFormattedCreatedAtAttribute(): string
    {
        return $this->created_at->format('Y-m-d');
    }
}
```
---
## Exceptions
Accessors that perform DB queries may be included if the query result is cached or if serialization is never called in hot paths, but this must be explicitly justified in a comment.
---
## Consequences Of Violation
Severe performance degradation on API responses; N+1 database queries triggered by serialization loops.
---

## Rule: Define `$dateFormat` in the Base Model
---
## Category
Maintainability
---
## Rule
Define `$dateFormat` once in the project's base model class rather than on every individual model.
---
## Reason
Date storage format is an application-wide concern, not a per-model concern. Duplicating it on every model creates maintenance debt and risks inconsistent behavior when one model is updated and another is not.
---
## Bad Example
```php
class User extends Model
{
    protected $dateFormat = 'Y-m-d H:i:s';
}

class Order extends Model
{
    protected $dateFormat = 'Y-m-d H:i:s';
}

class Product extends Model
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

class User extends BaseModel { /* inherited */ }
class Order extends BaseModel { /* inherited */ }
```
---
## Exceptions
A model that stores dates in a different format (e.g., a legacy table with Unix timestamps) may override `$dateFormat` locally.
---
## Consequences Of Violation
Inconsistent date serialization across models; duplicated configuration that drifts over time.
---

## Rule: Set `$connection` via Runtime Resolution
---
## Category
Scalability
---
## Rule
Set `$connection` to resolve the connection name at runtime (via config or environment) instead of hard-coding a connection string literal.
---
## Reason
Hard-coded connection names prevent environment-specific routing. Runtime resolution via `config()` or a method call allows database connections to change per environment, per tenant, or per deployment without modifying model code.
---
## Bad Example
```php
class Order extends Model
{
    protected $connection = 'mysql_billing'; // Hard-coded
}
```
---
## Good Example
```php
class Order extends Model
{
    protected $connection = 'billing';

    // In config/database.php:
    // 'connections' => [
    //     'billing' => $environments['billing_connection'],
    // ],
}
```
---
## Exceptions
A model that always uses the default connection may omit `$connection` entirely.
---
## Consequences Of Violation
Environment-specific database routing requires model-level changes; multi-tenant setups become more difficult to implement.
---

## Rule: Use `$primaryKey`, `$incrementing`, and `$keyType` Together
---
## Category
Reliability
---
## Rule
When overriding the primary key convention, always set `$primaryKey`, `$incrementing`, and `$keyType` together as a group.
---
## Reason
These three properties are interdependent. A UUID primary key requires `$incrementing = false` and `$keyType = 'string'`. Setting only one or two leaves Eloquent in a mismatched state that produces SQL type errors or silent data corruption.
---
## Bad Example
```php
class Order extends Model
{
    protected $primaryKey = 'uuid';
    public $incrementing = false;
    // Missing $keyType — defaults to 'int'
}
```
---
## Good Example
```php
class Order extends Model
{
    protected $primaryKey = 'uuid';
    public $incrementing = false;
    protected $keyType = 'string';
}
```
---
## Exceptions
A primary key that is non-standard but still integer-based (e.g., `order_number` with auto-increment) needs only `$primaryKey` set.
---
## Consequences Of Violation
SQL type mismatch errors on relationship joins; incorrect primary key casting in comparisons and JSON output.
---

## Rule: Keep `$fillable` in Alphabetical Order
---
## Category
Maintainability
---
## Rule
Maintain `$fillable` array entries in alphabetical order to simplify locating and comparing entries across models and code reviews.
---
## Reason
Alphabetical ordering makes it trivial to check whether an attribute is fillable by visual scan, reduces merge conflicts when two developers add attributes to the same array, and ensures consistent formatting across the codebase.
---
## Bad Example
```php
protected $fillable = [
    'zip',
    'city',
    'address_line_2',
    'country',
    'address_line_1',
    'state',
];
```
---
## Good Example
```php
protected $fillable = [
    'address_line_1',
    'address_line_2',
    'city',
    'country',
    'state',
    'zip',
];
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unnecessary cognitive load during code review; increased merge conflict frequency; inconsistent coding style.
