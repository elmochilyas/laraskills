# whereBelongsTo Rules

## Rule: WhereBelongsTo-Only-BelongsTo
---
## Category
Framework Usage
---
## Rule
Only use `whereBelongsTo()` with `BelongsTo` relationships — it throws `BadMethodCallException` for other types.
---
## Reason
`whereBelongsTo()` introspects the relationship's foreign key. Non-BelongsTo relationships do not have a single foreign key on the defining model's table, so the method cannot resolve the column.
---
## Bad Example
```php
$user->whereBelongsTo($post); // Post is not a BelongsTo of User — throws exception
```
---
## Good Example
```php
Post::whereBelongsTo($user)->get(); // Post belongsTo User — correct
```
---
## Exceptions
None.
---
## Consequences Of Violation
Runtime exception, 500 error.

## Rule: WhereBelongsTo-Explicit-Relation-Name
---
## Category
Maintainability
---
## Rule
Pass the explicit relationship name to `whereBelongsTo()` when the model has multiple `BelongsTo` relations to the same related model.
---
## Reason
Without an explicit name, Eloquent infers the relationship from the class name. When multiple relationships exist, the inference may resolve to the wrong one.
---
## Bad Example
```php
class Post extends Model
{
    public function author(): BelongsTo { ... }
    public function reviewer(): BelongsTo { ... }
}

Post::whereBelongsTo($user); // Ambiguous — which BelongsTo?
```
---
## Good Example
```php
Post::whereBelongsTo($author, 'author')->get();
Post::whereBelongsTo($reviewer, 'reviewer')->get();
```
---
## Exceptions
When only one `BelongsTo` to the related model exists.
---
## Consequences Of Violation
Wrong foreign key used, incorrect query results.

## Rule: WhereBelongsTo-Persisted-Model-Only
---
## Category
Reliability
---
## Rule
Only pass persisted models (with a non-null `id`) to `whereBelongsTo()`.
---
## Reason
An unpersisted model has no `id`, causing `whereBelongsTo()` to generate `WHERE foreign_key IS NULL`. This rarely produces the desired result.
---
## Bad Example
```php
$unsavedUser = new User(['name' => 'Temp']);
Post::whereBelongsTo($unsavedUser)->get();
// SQL: WHERE user_id IS NULL — probably not intended
```
---
## Good Example
```php
$savedUser = User::findOrFail($id);
Post::whereBelongsTo($savedUser)->get();
```
---
## Exceptions
When explicitly querying for records with a null foreign key.
---
## Consequences Of Violation
Unexpected empty result sets, silent logic errors.

## Rule: WhereBelongsTo-Collection-IN
---
## Category
Performance
---
## Rule
Pass `whereBelongsTo()` a collection of models to generate a single `WHERE IN` clause instead of iterating individual IDs.
---
## Reason
`whereBelongsTo($collection)` generates one `WHERE FK IN (...)` query. Filtering in a loop generates separate queries per model.
---
## Bad Example
```php
$users = User::where('active', true)->get();
$posts = collect();
foreach ($users as $user) {
    $posts = $posts->merge(Post::whereBelongsTo($user)->get());
}
// N queries
```
---
## Good Example
```php
$users = User::where('active', true)->get();
$posts = Post::whereBelongsTo($users)->get();
// 2 queries total
```
---
## Exceptions
When the collection is very large and causes SQL `max_allowed_packet` issues.
---
## Consequences Of Violation
Multiple database round trips, performance degradation.

## Rule: WhereBelongsTo-Not-For-Authorization
---
## Category
Performance
---
## Rule
Use direct FK comparison (`$post->user_id === $user->id`) for authorization gates instead of `whereBelongsTo()`.
---
## Reason
`whereBelongsTo()` executes a database query. Direct FK access is zero-query and is the most efficient way to check ownership.
---
## Bad Example
```php
if (Post::whereBelongsTo($user)->where('id', $post->id)->exists()) {
    // Executes a query for authorization
}
```
---
## Good Example
```php
if ($post->user_id === $user->id) {
    // Zero-query authorization
}
```
---
## Exceptions
When authorization logic must be centralized in the query builder for policy reuse.
---
## Consequences Of Violation
Unnecessary database queries, slower authorization checks.

## Rule: WhereBelongsTo-Preferred-Over-Hardcoded-FK
---
## Category
Maintainability
---
## Rule
Prefer `whereBelongsTo()` over hard-coded foreign key column names for query maintainability.
---
## Reason
Hard-coded foreign key names couple query code to the database schema. `whereBelongsTo()` centralizes FK knowledge in the relationship definition, making schema changes easier.
---
## Bad Example
```php
Post::where('author_id', $author->id)->get();
// FK name spread across controllers
```
---
## Good Example
```php
Post::whereBelongsTo($author, 'author')->get();
// FK knowledge stays in the relationship definition
```
---
## Exceptions
When the relationship name is unstable or does not exist.
---
## Consequences Of Violation
Schema changes require changes in multiple places, increased maintenance cost.

## Rule: WhereBelongsTo-Not-For-Attribute-Filtering
---
## Category
Framework Usage
---
## Rule
Use `whereHas()` instead of `whereBelongsTo()` when filtering by related model attributes.
---
## Reason
`whereBelongsTo()` filters by the related model's identity only. For attribute-based filtering (e.g., posts by admin users), `whereHas()` with a constraint closure is required.
---
## Bad Example
```php
Post::whereBelongsTo($user)->get();
// Can't filter by $user->is_admin
```
---
## Good Example
```php
Post::whereHas('user', fn($q) => $q->where('is_admin', true))->get();
```
---
## Exceptions
When filtering by model identity only.
---
## Consequences Of Violation
Inability to express attribute-based filters, mixing concerns.
