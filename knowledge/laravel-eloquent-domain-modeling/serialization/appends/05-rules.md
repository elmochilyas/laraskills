# Appends — Rules

## Rule 1: Never Append Accessors That Query Relationships
---
## Category
Performance
---
## Rule
Never include an accessor in `$appends` that queries a relationship unless that relationship is always eagerly loaded at every call site.
---
## Reason
Each serialized model triggers the accessor independently, producing N+1 queries when iterating over collections.
---
## Bad Example
```php
protected $appends = ['post_count'];

protected function postCount(): Attribute
{
    return Attribute::make(fn () => $this->posts()->count());
}
```
---
## Good Example
```php
// Eager-load and cache
protected $appends = ['post_count'];

protected function postCount(): Attribute
{
    return Attribute::make(fn () => $this->cachedPostCount ??= $this->posts->count());
}

// Call site:
User::withCount('posts')->get();
```
---
## Exceptions
Single-model endpoints (not collections) where the N+1 cost is acceptable and documented.
---
## Consequences Of Violation
Unbounded query explosion on listing endpoints; database load spikes; degraded API response times.

---

## Rule 2: Cache Expensive Accessor Results Per-Instance
---
## Category
Performance
---
## Rule
Always cache expensive accessor computations inside the accessor using `$this->cached ??= ...` before appending.
---
## Reason
The accessor may be called multiple times on the same model instance through different serialization paths; uncached recomputation wastes CPU cycles.
---
## Bad Example
```php
protected function score(): Attribute
{
    return Attribute::make(fn () => $this->computeScore());
}
```
---
## Good Example
```php
protected function score(): Attribute
{
    return Attribute::make(fn () => $this->cachedScore ??= $this->computeScore());
}
```
---
## Exceptions
Trivial accessors that return pre-existing property concatenation (e.g., `"$this->a $this->b"`) with no computation cost.
---
## Consequences Of Violation
Redundant recomputation per instance; avoidable CPU overhead in serialization-intensive code paths.

---

## Rule 3: Prefer Runtime `append()` Over Global `$appends` for Endpoint-Specific Values
---
## Category
Architecture
---
## Rule
Use runtime `$model->append('field')` for computed values needed only in specific endpoints rather than adding them to the global `$appends` array.
---
## Reason
Global `$appends` executes accessors on every serialization path (API, queue, broadcast, notifications), including contexts where the value is unnecessary, wasting resources.
---
## Bad Example
```php
protected $appends = ['expensive_metric'];

protected function expensiveMetric(): Attribute
{
    return Attribute::make(fn () => $this->computeExpensiveMetric());
}

// Used in one controller but runs on every serialization
```
---
## Good Example
```php
// No $appends declaration

// Controller:
$user = User::find($id)->append('expensive_metric');
return response()->json($user);
```
---
## Exceptions
Values that are genuinely required in every serialization path (e.g., `full_name` for a user profile model).
---
## Consequences Of Violation
Wasted computation on every `toArray()` call; unexpected performance degradation in queue jobs and broadcasts.

---

## Rule 4: Always Pair `$appends` with a Defined Accessor
---
## Category
Maintainability
---
## Rule
Every entry in `$appends` must have a matching accessor method defined on the same model or a used trait.
---
## Reason
A missing accessor throws `BadMethodCallException` at serialization time, causing a 500 error that is only caught at runtime.
---
## Bad Example
```php
protected $appends = ['full_name'];
// No fullName() accessor exists
```
---
## Good Example
```php
protected $appends = ['full_name'];

protected function fullName(): Attribute
{
    return Attribute::make(
        get: fn () => "{$this->first_name} {$this->last_name}",
    );
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Runtime 500 errors on every serialization attempt; no compile-time detection of the missing method.

---

## Rule 5: Never Put Database-Writing Business Logic in Appended Accessors
---
## Category
Architecture
---
## Rule
Do not perform database writes, external API calls, or state mutations inside an appended accessor.
---
## Reason
Accessors are called during serialization, which should be a pure transformation. Side effects make serialization unpredictable, can cause duplicate writes, and violate the principle of least astonishment.
---
## Bad Example
```php
protected function loginCount(): Attribute
{
    return Attribute::make(fn () => DB::table('logins')
        ->where('user_id', $this->id)
        ->update(['last_accessed' => now()]));
}
```
---
## Good Example
```php
protected $appends = ['last_login_at'];

protected function lastLoginAt(): Attribute
{
    return Attribute::make(
        get: fn () => $this->logins()->max('created_at'),
    );
}
```
---
## Exceptions
No common exceptions. Serialization must remain side-effect-free.
---
## Consequences Of Violation
Duplicate mutations when serializing the same model multiple times; hard-to-debug state corruption; test flakiness.

---

## Rule 6: Type Appended Values with `$casts`
---
## Category
Framework Usage
---
## Rule
Add a `$casts` entry for every appended accessor whose value requires a specific type (boolean, float, array, enum) to ensure consistent JSON output.
---
## Reason
Without casts, appended values may serialize as integers, strings, or objects inconsistently depending on the accessor's return type, breaking API contracts.
---
## Bad Example
```php
protected $appends = ['is_featured'];

protected function isFeatured(): Attribute
{
    return Attribute::make(fn () => (bool) $this->featured_at);
}
// Output: "is_featured": 1  instead of true
```
---
## Good Example
```php
protected $appends = ['is_featured'];
protected $casts = ['is_featured' => 'boolean'];

protected function isFeatured(): Attribute
{
    return Attribute::make(fn () => $this->featured_at !== null);
}
// Output: "is_featured": true
```
---
## Exceptions
Accessors that already return a native JSON-safe type matching the desired output format.
---
## Consequences Of Violation
Type inconsistencies between API responses; frontend parsing errors; broken strict comparison tests.

---

## Rule 7: Disable Appends with `setAppends([])` Before Bulk Export
---
## Category
Performance
---
## Rule
Call `setAppends([])` on model collections before serialization for bulk export or background processing when computed values are not needed.
---
## Reason
Bulk exports serialize hundreds or thousands of models; running accessors on every model multiplies processing time linearly with no benefit for export data.
---
## Bad Example
```php
$users = User::all();
return $users->toArray(); // All $appends accessors execute for every user
```
---
## Good Example
```php
$users = User::all();
$users->each(fn ($u) => $u->setAppends([]));
return $users->toArray();
```
---
## Exceptions
Export endpoints that specifically require the computed fields (documented in requirements).
---
## Consequences Of Violation
Unnecessary CPU load on export jobs; timeout risks on large datasets; user-facing latency on bulk operations.

---

## Rule 8: Never Append an Attribute Name That Collides with a Database Column
---
## Category
Maintainability
---
## Rule
Do not declare an attribute in `$appends` whose name matches an existing database column on the same model.
---
## Reason
When an appended name matches a real column, the real column value takes precedence and the accessor is never called, silently breaking the intended computed behavior.
---
## Bad Example
```php
protected $appends = ['name']; // Database column 'name' exists

protected function name(): Attribute
{
    return Attribute::make(fn () => strtoupper($this->name));
}
// $this->name returns the DB value, not the uppercased version
```
---
## Good Example
```php
protected $appends = ['name_uppercase'];

protected function nameUppercase(): Attribute
{
    return Attribute::make(fn () => strtoupper($this->name));
}
```
---
## Exceptions
No common exceptions. Use a distinct name for every computed attribute.
---
## Consequences Of Violation
Silent logic bugs that pass code review and tests because the accessor appears correct but is never invoked.

---

## Rule 9: Hide Sensitive Appended Attributes via `$hidden`
---
## Category
Security
---
## Rule
Add any appended attribute that exposes sensitive computed data to the model's `$hidden` array to prevent accidental exposure.
---
## Reason
Appended attributes appear in every serialization output. Computed values like `is_eligible_for_discount` or `internal_risk_score` may reveal business logic.
---
## Bad Example
```php
protected $appends = ['risk_score'];
// risk_score returns internal fraud probability but is not hidden
```
---
## Good Example
```php
protected $appends = ['risk_score'];
protected $hidden = ['risk_score'];

// Only reveal via explicit makeVisible in authorized contexts
$user->makeVisible('risk_score')->toArray();
```
---
## Exceptions
Appended attributes that are intentionally public (e.g., `full_name`, `formatted_price`).
---
## Consequences Of Violation
Leakage of internal business intelligence or PII through API responses, queue payloads, and notification serialization.

---

## Rule 10: Extract Shared Appends into Reusable Traits
---
## Category
Maintainability
---
## Rule
When the same set of appended attributes is needed across multiple models, extract the accessors and `$appends` declaration into a reusable trait.
---
## Reason
Duplicating accessor logic across models creates drift — one model may be updated while others are not, leading to inconsistent serialization output.
---
## Bad Example
```php
class User extends Model {
    protected $appends = ['full_name'];
    protected function fullName(): Attribute { ... }
}

class Admin extends Model {
    protected $appends = ['full_name'];
    protected function fullName(): Attribute { ... } // Duplicate
}
```
---
## Good Example
```php
trait HasFullName
{
    protected $appends = ['full_name'];

    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => "{$this->first_name} {$this->last_name}",
        );
    }
}

class User extends Model { use HasFullName; }
class Admin extends Model { use HasFullName; }
```
---
## Exceptions
Trivial single-line accessors on a single model; models without shared column structures.
---
## Consequences Of Violation
Duplicated code; inconsistent serialization shape across models; maintenance overhead when accessor logic changes.
