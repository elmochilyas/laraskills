# BelongsTo Rules

## Rule: FK-BelongsTo-Direction
---
## Category
Framework Usage
---
## Rule
Always define `BelongsTo` on the model whose database table holds the foreign key column.
---
## Reason
The foreign key location determines relationship direction. Defining `BelongsTo` on the wrong model creates broken joins and incorrect results.
---
## Bad Example
```php
// Post table has user_id, but BelongsTo is on User
class User extends Model
{
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
```
---
## Good Example
```php
class Post extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Runtime errors, broken queries, data integrity confusion.

## Rule: Associate-Save-Pair
---
## Category
Framework Usage
---
## Rule
Always call `save()` on the child model after `associate()` or `dissociate()`.
---
## Reason
`associate()` and `dissociate()` modify the foreign key in memory only. Without `save()`, the change is never persisted to the database.
---
## Bad Example
```php
$post->user()->associate($user);
// $post->user_id is set in memory but NOT saved to database
return $post;
```
---
## Good Example
```php
$post->user()->associate($user);
$post->save();
// Foreign key is now persisted
```
---
## Exceptions
When the model is saved later in the same request lifecycle by another component.
---
## Consequences Of Violation
Silent data loss — the relationship change never reaches the database.

## Rule: Prefer-Direct-FK-For-Auth
---
## Category
Performance
---
## Rule
Use direct foreign key comparison (`$post->user_id === $user->id`) for authorization instead of loading the relationship.
---
## Reason
Accessing the relationship loads an entire model from the database. Direct FK access is zero-query and eliminates unnecessary database work.
---
## Bad Example
```php
if ($post->user->id === auth()->id()) {
    // This query is completely unnecessary
}
```
---
## Good Example
```php
if ($post->user_id === auth()->id()) {
    // Zero-query authorization
}
```
---
## Exceptions
When the relationship is already eager-loaded in the same query context.
---
## Consequences Of Violation
N+1 queries on list pages, unnecessary database load, slower authorization checks.

## Rule: Create-Through-Relationship
---
## Category
Architecture
---
## Rule
Use `$parent->children()->create($data)` instead of `Child::create($data)` for belongs-to creation.
---
## Reason
Creating through the relationship auto-assigns the foreign key, preventing orphaned records and eliminating a common source of missing FK errors.
---
## Bad Example
```php
Post::create(['title' => 'New Post', 'user_id' => $user->id]);
// Forgetting user_id creates an orphan
```
---
## Good Example
```php
$user->posts()->create(['title' => 'New Post']);
// user_id is automatically set
```
---
## Exceptions
When the foreign key value comes from a source other than the parent model.
---
## Consequences Of Violation
Orphaned records with null foreign keys, missing relationship data, runtime errors.

## Rule: Index-Foreign-Key-Column
---
## Category
Performance
---
## Rule
Always add a database index on the foreign key column of the model defining `BelongsTo`.
---
## Reason
The foreign key is used in `WHERE`, `JOIN`, and `IN` clauses during eager loading. Without an index, every relationship query performs a full table scan.
---
## Bad Example
```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->string('title');
});
```
---
## Good Example
```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->index();
    $table->string('title');
});
```
---
## Exceptions
Extremely small tables (under 100 rows) where full scans are negligible.
---
## Consequences Of Violation
Slow eager loading queries, degraded join performance, scalability issues.

## Rule: Cascade-On-Delete
---
## Category
Reliability
---
## Rule
Add `ON DELETE CASCADE` to the foreign key constraint in the migration for required belongs-to relationships.
---
## Reason
Deleting a parent without cascading leaves orphaned child records with foreign keys pointing to deleted parents, causing application errors and data corruption.
---
## Bad Example
```php
$table->foreignId('user_id')->constrained();
// Deleting a User leaves orphaned Posts
```
---
## Good Example
```php
$table->foreignId('user_id')->constrained()->cascadeOnDelete();
```
---
## Exceptions
When children should persist after parent deletion (soft-delete parents, archival patterns).
---
## Consequences Of Violation
Orphaned child records, foreign key constraint violations, data integrity failures.

## Rule: Nullsafe-Nullable-BelongsTo
---
## Category
Reliability
---
## Rule
Use PHP 8+ nullsafe operator (`$post->user?->name`) when accessing a nullable BelongsTo relationship.
---
## Reason
A nullable foreign key can produce `null` when the relationship is accessed. Without null protection, accessing attributes on `null` throws a fatal error.
---
## Bad Example
```php
echo $post->author->name; // Fatal error if author_id is null
```
---
## Good Example
```php
echo $post->author?->name; // null if no author
```
---
## Exceptions
When `withDefault()` is used on the relationship (guarantees a model instance).
---
## Consequences Of Violation
Runtime crashes, 500 errors, degraded user experience.

## Rule: Validate-Parent-Existence
---
## Category
Reliability
---
## Rule
Validate parent model existence using `exists` rules in form requests when the foreign key comes from user input.
---
## Reason
Missing validation allows associating a child with a non-existent parent, causing foreign key constraint violations at the database level.
---
## Bad Example
```php
'user_id' => 'required|integer', // No existence check
```
---
## Good Example
```php
'user_id' => 'required|exists:users,id',
```
---
## Exceptions
When the foreign key is set programmatically from a trusted source.
---
## Consequences Of Violation
Foreign key constraint violations, 500 errors, data integrity corruption.

## Rule: Touches-On-Child
---
## Category
Architecture
---
## Rule
Define `$touches` on the child (BelongsTo side) model when parent `updated_at` should reflect child changes.
---
## Reason
The `$touches` property is a property of the model holding the foreign key. Placing it on the wrong model silently fails, and timestamps never propagate.
---
## Bad Example
```php
class User extends Model
{
    protected $touches = ['posts']; // HasMany — does NOT work
}
```
---
## Good Example
```php
class Post extends Model
{
    protected $touches = ['user']; // BelongsTo — works correctly
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Unchanged parent timestamps, broken cache invalidation, stale data.

## Rule: Inverse-Relationship-Definition
---
## Category
Architecture
---
## Rule
Always define the inverse `HasOne` or `HasMany` on the parent model when defining a `BelongsTo` on the child.
---
## Reason
Missing the inverse relationship breaks bidirectional navigation. Without it, code cannot navigate from parent to children without additional queries or definitions.
---
## Bad Example
```php
// Post defines belongsTo(User), but User has no posts() relationship
```
---
## Good Example
```php
class User extends Model
{
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}
```
---
## Exceptions
When the parent model will never need to access the child collection from that direction.
---
## Consequences Of Violation
Incomplete domain model, missing navigation paths, additional query overhead from workarounds.
