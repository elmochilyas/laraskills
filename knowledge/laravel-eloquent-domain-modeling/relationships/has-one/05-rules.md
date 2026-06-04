# HasOne Rules

## Rule: HasOne-Unique-Constraint
---
## Category
Reliability
---
## Rule
Always add a database `UNIQUE` constraint on the foreign key column of the child table in a `HasOne` relationship.
---
## Reason
Eloquent does not enforce uniqueness for `HasOne`. Without a database constraint, duplicate child records silently accumulate, making `$parent->child` return unpredictable results.
---
## Bad Example
```php
Schema::create('profiles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    // No unique constraint — duplicate profiles possible
});
```
---
## Good Example
```php
Schema::create('profiles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->unique();
});
```
---
## Exceptions
When the one-to-one relationship is intentionally soft (the domain permits multiple children but only the first is used).
---
## Consequences Of Violation
Silent data corruption, duplicate children, unpredictable `$parent->child` results.

## Rule: HasOne-Inverse-BelongsTo
---
## Category
Architecture
---
## Rule
Always define the inverse `BelongsTo` on the child model when defining `HasOne` on the parent.
---
## Reason
Without the inverse, the child model cannot navigate back to the parent. Bidirectional access is a fundamental ORM pattern required for most domain operations.
---
## Bad Example
```php
class User extends Model
{
    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }
}
// Profile has no user() relationship defined
```
---
## Good Example
```php
class Profile extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```
---
## Exceptions
When the child model will never need to reference its parent (extremely rare in practice).
---
## Consequences Of Violation
Broken domain navigation, missing child-to-parent access, incomplete model API.

## Rule: HasOne-Create-Through-Parent
---
## Category
Framework Usage
---
## Rule
Use `$parent->child()->create($data)` instead of `Child::create($data)` to auto-associate the foreign key.
---
## Reason
Creating through the parent guarantees the foreign key is set. Manual assignment is error-prone and creates orphaned children.
---
## Bad Example
```php
Profile::create(['bio' => 'Hello', 'user_id' => $user->id]);
// Easy to forget user_id
```
---
## Good Example
```php
$user->profile()->create(['bio' => 'Hello']);
// user_id automatically assigned
```
---
## Exceptions
When the foreign key value comes from a different context than the parent model.
---
## Consequences Of Violation
Orphaned child records, null foreign keys, relationship integrity failures.

## Rule: HasOne-Cascade-Delete
---
## Category
Reliability
---
## Rule
Always configure cascade delete on the foreign key or handle child deletion in model events when the parent is deleted.
---
## Reason
Deleting a parent without cascading leaves orphaned child records. Since `HasOne` implies child existence depends on the parent, orphans represent corrupted data.
---
## Bad Example
```php
$table->foreignId('user_id')->constrained();
// Deleting User leaves orphaned Profile rows
```
---
## Good Example
```php
$table->foreignId('user_id')->constrained()->cascadeOnDelete();
```
---
## Exceptions
When children should outlive their parent (soft-delete patterns, archival requirements).
---
## Consequences Of Violation
Orphaned children, database integrity violations, wasted storage.

## Rule: HasOne-Eager-Load-Serialization
---
## Category
Performance
---
## Rule
Always eager-load `HasOne` relationships in serialization contexts (API resources, Blade views) to prevent N+1.
---
## Reason
`HasOne` is accessed per parent model. Without eager loading, each access triggers a separate database query, multiplying query count by the number of parents.
---
## Bad Example
```php
$users = User::all();
foreach ($users as $user) {
    echo $user->profile->bio; // N+1: one query per user
}
```
---
## Good Example
```php
$users = User::with('profile')->get();
foreach ($users as $user) {
    echo $user->profile->bio; // 2 queries total
}
```
---
## Exceptions
When only a few parent models are displayed (under 5) and the relationship is rarely accessed.
---
## Consequences Of Violation
N+1 query problem, performance degradation, database connection exhaustion.

## Rule: HasOne-Not-For-LatestOfMany
---
## Category
Framework Usage
---
## Rule
Do not use `HasOne` when you need the "latest" or "best" record from a one-to-many set. Use `HasOneOfMany` (`latestOfMany`, `ofMany`) instead.
---
## Reason
`HasOne` returns an arbitrary first child (by primary key order) when duplicates exist. `HasOneOfMany` guarantees deterministic retrieval based on specified ordering.
---
## Bad Example
```php
public function latestLogin(): HasOne
{
    return $this->hasOne(Login::class);
    // Returns arbitrary row, not the latest
}
```
---
## Good Example
```php
public function latestLogin(): HasOne
{
    return $this->hasOne(Login::class)->latestOfMany();
}
```
---
## Exceptions
When a `UNIQUE` constraint guarantees at most one child per parent.
---
## Consequences Of Violation
Non-deterministic results, data integrity confusion, subtle bugs in "latest" access patterns.

## Rule: HasOne-Index-Foreign-Key
---
## Category
Performance
---
## Rule
Always index the foreign key column on the child table in a `HasOne` relationship.
---
## Reason
Both eager loading (`WHERE FK IN (...)`) and existence checks (`WHERE EXISTS`) rely on the foreign key. Without an index, these queries perform full table scans.
---
## Bad Example
```php
$table->foreignId('user_id')->constrained();
// No index — eager loading scans entire table
```
---
## Good Example
```php
$table->foreignId('user_id')->constrained()->index();
// Index enables fast FK lookups
```
---
## Exceptions
Trivially small tables (under 100 rows) where index overhead exceeds benefit.
---
## Consequences Of Violation
Slow eager loading, slow existence queries, scalability bottlenecks.

## Rule: HasOne-Avoid-As-Lazy-Crutch
---
## Category
Performance
---
## Rule
Do not rely on lazy loading for `HasOne` relationships accessed in loops or serialization.
---
## Reason
Lazy loading `HasOne` in a loop is the most common form of N+1 in Eloquent applications. Each iteration adds a query.
---
## Bad Example
```php
$users = User::all();
foreach ($users as $user) {
    if ($user->profile) { // Lazy load per iteration
        // ...
    }
}
```
---
## Good Example
```php
$users = User::with('profile')->get();
// or
$users = User::has('profile')->with('profile')->get();
```
---
## Exceptions
Single-model views where only one parent exists.
---
## Consequences Of Violation
N+1 query problem, page load latency, excessive database connections.
