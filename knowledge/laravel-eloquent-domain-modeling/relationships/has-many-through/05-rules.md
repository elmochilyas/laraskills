# HasManyThrough Rules

## Rule: Through-Argument-Order
---
## Category
Framework Usage
---
## Rule
Always pass the target model as the first argument and the intermediate model as the second argument in `HasManyThrough`.
---
## Reason
`hasManyThrough(Target, Intermediate)` has a non-intuitive order that developers frequently reverse. Swapping them produces incorrect SQL.
---
## Bad Example
```php
public function posts(): HasManyThrough
{
    return $this->hasManyThrough(User::class, Post::class);
    // Wrong: intermediate and target swapped
}
```
---
## Good Example
```php
public function posts(): HasManyThrough
{
    return $this->hasManyThrough(Post::class, User::class);
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Incorrect joins, wrong query results, silent data corruption.

## Rule: Through-Create-Via-Intermediate
---
## Category
Architecture
---
## Rule
Create target records through the specific intermediate instance, not through the `HasManyThrough` relationship.
---
## Reason
`HasManyThrough` is read-only — calling `create()` on it throws an exception. Targets must be created through the intermediate model's own `HasMany` relationship.
---
## Bad Example
```php
$country->posts()->create(['title' => 'New']);
// Throws BadMethodCallException
```
---
## Good Example
```php
$user = $country->users->first();
$user->posts()->create(['title' => 'New']);
```
---
## Exceptions
None.
---
## Consequences Of Violation
Runtime exceptions, developer confusion.

## Rule: Through-Index-Both-Foreign-Keys
---
## Category
Performance
---
## Rule
Index both `intermediate.parent_id` and `target.intermediate_id` for every `HasManyThrough` relationship.
---
## Reason
The join query uses both foreign keys in `WHERE` and `JOIN` clauses. Without indexes, the query performs full table scans.
---
## Bad Example
```php
Schema::create('users', function (Blueprint $table) {
    $table->foreignId('country_id')->constrained();
    // No index
});
Schema::create('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained();
    // No index
});
```
---
## Good Example
```php
Schema::create('users', function (Blueprint $table) {
    $table->foreignId('country_id')->constrained()->index();
});
Schema::create('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained()->index();
});
```
---
## Exceptions
Trivially small tables under 1,000 rows.
---
## Consequences Of Violation
Slow join queries, query timeout on large datasets.

## Rule: Through-Not-When-Intermediate-Is-Meaningful
---
## Category
Design
---
## Rule
Do not use `HasManyThrough` when the intermediate models themselves are needed in the result.
---
## Reason
`HasManyThrough` flattens the hierarchy — it returns only the target collection. If intermediate models carry meaningful data, use nested eager loading instead.
---
## Bad Example
```php
$country->posts; // User intermediate is invisible
// But user data (author name) is needed for display
```
---
## Good Example
```php
$country->load('users.posts'); // Keep both levels
$country->users->each->posts; // Access both
```
---
## Exceptions
When intermediate is purely structural (no meaningful attributes).
---
## Consequences Of Violation
Lost domain data, multiple workaround queries, incomplete results.

## Rule: Through-Cascade-Intermediate
---
## Category
Reliability
---
## Rule
Add `ON DELETE CASCADE` on both `intermediate.parent_id` and `target.intermediate_id` foreign keys.
---
## Reason
Deleting a parent or intermediate orphans the chain. Without cascading, target records point to deleted intermediates, causing query pollution and data integrity issues.
---
## Bad Example
```php
$table->foreignId('country_id')->constrained();
// Deleting Country leaves Users and Posts orphaned
```
---
## Good Example
```php
$table->foreignId('country_id')->constrained()->cascadeOnDelete();
$table->foreignId('user_id')->constrained()->cascadeOnDelete();
```
---
## Exceptions
When records must persist for audit or archival purposes.
---
## Consequences Of Violation
Orphaned records, integrity violations, data bloat.

## Rule: Through-Document-ReadOnly
---
## Category
Maintainability
---
## Rule
Document the read-only constraint of `HasManyThrough` in the relationship method DocBlock.
---
## Reason
Developers new to the codebase assume relationships support writes. Without explicit documentation, they discover the limitation at runtime.
---
## Bad Example
```php
public function posts(): HasManyThrough
{
    return $this->hasManyThrough(Post::class, User::class);
}
```
---
## Good Example
```php
/**
 * Read-only. Create posts through specific user: $user->posts()->create(...).
 */
public function posts(): HasManyThrough
{
    return $this->hasManyThrough(Post::class, User::class);
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Runtime exceptions, wasted debugging time.

## Rule: Through-Paginate-Count-Overhead
---
## Category
Performance
---
## Rule
Be aware that `withCount()` on a `HasManyThrough` generates a more expensive nested subquery than on a direct `HasMany`.
---
## Reason
The count subquery must traverse the intermediate table join, adding complexity and execution cost compared to a simple FK filter.
---
## Bad Example
```php
Country::withCount('posts')->paginate(); // Nested subquery on join
```
---
## Good Example
```php
// Consider caching count values
Country::withCount('posts')->paginate();
// But monitor with EXPLAIN
```
---
## Exceptions
When the count accuracy is required and the dataset is small.
---
## Consequences Of Violation
Slow paginated list queries, increased database load.

## Rule: Through-HasMany-Not-BelongsTo-Intermediate
---
## Category
Framework Usage
---
## Rule
Ensure the intermediate-to-target relationship is `HasMany` (not `HasOne`) when using `HasManyThrough`.
---
## Reason
`HasManyThrough` expects a one-to-many chain. Using it with a `HasOne` intermediate-to-target relationship produces incorrect queries.
---
## Bad Example
```php
// User hasOne(Profile) but HasManyThrough expects HasMany
```
---
## Good Example
```php
// User hasMany(Post) — correct cardinality for HasManyThrough
```
---
## Exceptions
None.
---
## Consequences Of Violation
Incorrect SQL, wrong results, query failures.
