# SupportsInverseRelations Rules

## Rule: Inverse-Both-Sides
---
## Category
Architecture
---
## Rule
Add `use SupportsInverseRelations` to both sides of the relationship for full bidirectional in-memory consistency.
---
## Reason
Adding the trait to only one side gives partial consistency — the parent sees child updates but the child does not see parent changes. Both sides must have the trait.
---
## Bad Example
```php
class User extends Model
{
    use SupportsInverseRelations;
    public function posts(): HasMany { ... }
}
// Post does not use the trait — $post->user won't update on save()
```
---
## Good Example
```php
class User extends Model
{
    use SupportsInverseRelations;
    public function posts(): HasMany { ... }
}
class Post extends Model
{
    use SupportsInverseRelations;
    public function user(): BelongsTo { ... }
}
```
---
## Exceptions
When only one direction of consistency is needed.
---
## Consequences Of Violation
Stale in-memory relation state, inconsistent model data within a request.

## Rule: Inverse-Explicit-Name
---
## Category
Maintainability
---
## Rule
Use `->inverse('name')` explicitly when the convention-based name guess may be wrong.
---
## Reason
Eloquent infers the inverse relationship name from the model class name. When the actual relationship name differs, the inference fails silently and the inverse is never set.
---
## Bad Example
```php
public function posts(): HasMany
{
    return $this->hasMany(Post::class);
    // Inverse inferred as 'user' — correct by convention, but fragile
}
```
---
## Good Example
```php
public function posts(): HasMany
{
    return $this->hasMany(Post::class)->inverse('user');
}
```
---
## Exceptions
When the relationship name matches convention exactly and the model name is stable.
---
## Consequences Of Violation
Silent failure to set inverse relations, stale in-memory data, debugging confusion.

## Rule: Inverse-Not-DB-Sync
---
## Category
Framework Usage
---
## Rule
Do not rely on inverse relations for database-level consistency or transaction guarantees.
---
## Reason
Inverse relations are purely an in-memory optimization. They do not affect database writes, transactions, or persistence in any way.
---
## Bad Example
```php
// Assuming inverse relation ensures database consistency
$post->user()->associate($user);
$post->save();
// expects $user->posts to be persisted — it's only in memory
```
---
## Good Example
```php
// Use inverse for in-memory consistency, DB for persistence
$post->user()->associate($user);
$post->save();
// $user->posts is updated in memory; DB consistency is separate
```
---
## Exceptions
None.
---
## Consequences Of Violation
False sense of data consistency, incorrect assumptions about persistence.

## Rule: Inverse-Laravel-Version-Check
---
## Category
Reliability
---
## Rule
Only use `SupportsInverseRelations` in Laravel 11+ projects.
---
## Reason
The trait does not exist in Laravel versions below 11. Using it causes a fatal class-not-found error.
---
## Bad Example
```php
// In Laravel 9 project
use SupportsInverseRelations; // Class not found
```
---
## Good Example
```php
// Verify composer.json requires laravel/framework: "^11.0"
// Then use the trait
```
---
## Exceptions
When backporting the trait via a custom package.
---
## Consequences Of Violation
Fatal runtime error, broken deployment.

## Rule: Inverse-Not-For-BelongsToMany
---
## Category
Framework Usage
---
## Rule
Do not expect inverse relations to work with `BelongsToMany` or polymorphic relationships.
---
## Reason
Inverse relation support is limited to `BelongsTo`, `HasOne`, and `HasMany`. Other relationship types do not support the `inverse()` method.
---
## Bad Example
```php
public function roles(): BelongsToMany
{
    return $this->belongsToMany(Role::class)->inverse('users');
    // inverse() not supported on BelongsToMany
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Runtime exception, broken relationship definition.

## Rule: Inverse-Memory-Awareness
---
## Category
Performance
---
## Rule
Monitor memory usage in long-running processes when using inverse relations extensively.
---
## Reason
Inverse relations hold model references in memory. In queue workers and CLI commands with thousands of models, these references prevent garbage collection and cause memory leaks.
---
## Bad Example
```php
// Queue worker processing thousands of models
// Inverse relations hold references to all processed models
```
---
## Good Example
```php
// Explicitly clear references when done or use fresh queries
$user->unsetRelation('posts');
```
---
## Exceptions
Short-lived web requests where memory is released after response.
---
## Consequences Of Violation
Memory leaks, OOM crashes in queue workers and long-running processes.
