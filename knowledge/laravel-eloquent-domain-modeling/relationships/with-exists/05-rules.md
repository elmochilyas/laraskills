# withExists / loadExists Rules

## Rule: WithExists-Over-WithCount-For-Boolean
---
## Category
Performance
---
## Rule
Use `withExists()` instead of `withCount()` when you only need to know whether related records exist, not how many.
---
## Reason
`EXISTS` short-circuits on the first matching row, while `COUNT(*)` scans all rows. For boolean checks, `withExists()` is significantly faster, especially on large child tables.
---
## Bad Example
```php
$users = User::withCount('posts')->get();
$hasPosts = $users->first()->posts_count > 0; // Full count scan
```
---
## Good Example
```php
$users = User::withExists('posts')->get();
$hasPosts = $users->first()->posts_exists; // Short-circuits on first match
```
---
## Exceptions
When the actual count value is needed.
---
## Consequences Of Violation
Unnecessary full table scans, slower queries on large datasets.

## Rule: WithExists-Index-Foreign-Key
---
## Category
Performance
---
## Rule
Index the foreign key column for optimal `EXISTS` short-circuit performance.
---
## Reason
Without an index, `EXISTS` still performs a full table scan per parent row — losing the short-circuit benefit. An index enables immediate first-row lookup.
---
## Bad Example
```php
Schema::create('comments', function (Blueprint $table) {
    $table->foreignId('post_id')->constrained();
    // No index — EXISTS scans whole table per parent
});
```
---
## Good Example
```php
Schema::create('comments', function (Blueprint $table) {
    $table->foreignId('post_id')->constrained()->index();
});
```
---
## Exceptions
Trivially small tables.
---
## Consequences Of Violation
Loss of EXISTS performance advantage, full table scans.

## Rule: WithExists-Not-With-WithCount-Same-Relation
---
## Category
Performance
---
## Rule
Do not use `withExists()` and `withCount()` on the same relationship in the same query — they are redundant.
---
## Reason
If the count is already being calculated, the existence boolean adds no additional information. Choose the appropriate aggregate for the use case.
---
## Bad Example
```php
$posts = Post::withCount('comments')->withExists('comments')->get();
// Both subqueries on same relation — redundant
```
---
## Good Example
```php
$posts = Post::withCount('comments')->get(); // When count is needed
// OR
$posts = Post::withExists('comments')->get(); // When boolean is enough
```
---
## Exceptions
When different constraint filters apply to each (e.g., count all, exists for approved).
---
## Consequences Of Violation
Unnecessary subquery, wasted database resources.

## Rule: WithExists-SoftDelete-Awareness
---
## Category
Reliability
---
## Rule
Add `->whereNull('deleted_at')` in constraint callbacks for `withExists()` on soft-deletable relations if trashed should not count as existing.
---
## Reason
`withExists()` returns `true` if any related row exists, including soft-deleted ones. This may not match the application's concept of "existing."
---
## Bad Example
```php
$posts = Post::withExists('comments')->get();
// true even if all comments are soft-deleted
```
---
## Good Example
```php
$posts = Post::withExists(['comments' => fn($q) => $q->whereNull('deleted_at')])->get();
```
---
## Exceptions
When soft-deleted records should be considered existing.
---
## Consequences Of Violation
Misleading existence flags, incorrect UI state.

## Rule: WithExists-Not-For-Parent-Filtering
---
## Category
Framework Usage
---
## Rule
Use `has()`/`whereHas()` for filtering the parent query by existence — use `withExists()` only for annotation.
---
## Reason
`withExists()` adds an attribute to the result. `has()`/`whereHas()` filters the query. They serve different purposes and neither replaces the other.
---
## Bad Example
```php
// Using withExists to filter — doesn't work
User::withExists('posts')->get()->filter(fn($u) => $u->posts_exists);
// Loads all users then filters in PHP
```
---
## Good Example
```php
// Filter at database level
User::has('posts')->get();
// Annotate separately if needed
User::has('posts')->withExists('posts')->get();
```
---
## Exceptions
When the result set is already loaded and re-querying is impractical.
---
## Consequences Of Violation
Inefficient PHP-side filtering, unnecessary data transfer.

## Rule: WithExists-Boolean-Attribute
---
## Category
Framework Usage
---
## Rule
Cast the `{relation}_exists` attribute to boolean in API responses for clarity.
---
## Reason
The raw attribute is an integer (0 or 1) from the database. Explicit boolean casting ensures consistent typing in API responses and prevents type-strictness issues.
---
## Bad Example
```php
// $user->posts_exists is 0 or 1 (integer)
if ($user->posts_exists === true) { // Fails with 1 !== true
```
---
## Good Example
```php
// In model
protected function postsExists(): Attribute
{
    return Attribute::make(get: fn($value) => (bool) $value);
}
// Or cast in accessor
```
---
## Exceptions
When strict type comparison is not used in the codebase.
---
## Consequences Of Violation
Type-strictness bugs, failed comparisons, inconsistent API typing.
