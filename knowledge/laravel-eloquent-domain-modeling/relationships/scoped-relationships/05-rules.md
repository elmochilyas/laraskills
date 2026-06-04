# Scoped Relationships Rules

## Rule: Scoped-Descriptive-Naming
---
## Category
Maintainability
---
## Rule
Name scoped relationships to clearly reflect the constraints they apply (e.g., `approvedComments`, `recentPosts`).
---
## Reason
Consumers expect a relationship name to describe the data it returns. A scoped relationship named `posts` that only returns published posts violates the principle of least surprise.
---
## Bad Example
```php
public function posts(): HasMany
{
    return $this->hasMany(Post::class)->where('published', true);
    // "posts" suggests ALL posts, not just published
}
```
---
## Good Example
```php
public function publishedPosts(): HasMany
{
    return $this->hasMany(Post::class)->where('published', true);
}
```
---
## Exceptions
When the scope is a universal domain invariant (e.g., all posts must be published).
---
## Consequences Of Violation
Developer confusion, incorrect assumptions about data completeness.

## Rule: Scoped-Keep-Base-Relationship
---
## Category
Architecture
---
## Rule
Always keep the base (unscoped) relationship alongside scoped variants for unfiltered access.
---
## Reason
Scoped relationships embed constraints that cannot be overridden at query time. Without a base relationship, there is no way to access the full data set.
---
## Bad Example
```php
class User extends Model
{
    // Only scoped — no way to get all comments
    public function approvedComments(): HasMany
    {
        return $this->hasMany(Comment::class)->where('approved', true);
    }
}
```
---
## Good Example
```php
class User extends Model
{
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function approvedComments(): HasMany
    {
        return $this->hasMany(Comment::class)->where('approved', true);
    }
}
```
---
## Exceptions
When the constraint is a universal domain invariant that always applies.
---
## Consequences Of Violation
Inability to access unfiltered data, workarounds using raw queries.

## Rule: Scoped-Not-For-Runtime-Variation
---
## Category
Framework Usage
---
## Rule
Do not use scoped relationships when constraints need to vary by request context — use `with()` constraint closures instead.
---
## Reason
Scoped relationships are fixed at definition time and cannot be overridden. Runtime context (user permissions, request parameters) requires dynamic constraint closures.
---
## Bad Example
```php
class User extends Model
{
    public function visibleComments(): HasMany
    {
        return $this->hasMany(Comment::class)->where('visible', true);
        // Cannot vary visibility by user role
    }
}
```
---
## Good Example
```php
// Query site — dynamic constraint
$user->comments()->where(function ($q) use ($authUser) {
    if (! $authUser->isAdmin()) {
        $q->where('visible', true);
    }
})->get();
```
---
## Exceptions
When the constraint is truly universal and independent of request context.
---
## Consequences Of Violation
Inflexible constraints, authorization bypass, or overly restrictive data access.

## Rule: Scoped-Pair-Limit-With-OrderBy
---
## Category
Reliability
---
## Rule
Always pair `limit()` with `orderBy()` in scoped relationships for deterministic results.
---
## Reason
Without ordering, `limit()` returns an arbitrary subset of rows. The subset can change between queries, causing non-deterministic application behavior.
---
## Bad Example
```php
public function recentComments(): HasMany
{
    return $this->hasMany(Comment::class)->limit(5);
    // Which 5 comments? Non-deterministic
}
```
---
## Good Example
```php
public function recentComments(): HasMany
{
    return $this->hasMany(Comment::class)->latest()->limit(5);
}
```
---
## Exceptions
When any subset is acceptable (e.g., random samples).
---
## Consequences Of Violation
Inconsistent display, hard-to-reproduce bugs, confused users.

## Rule: Scoped-OfMany-Index-Ordering
---
## Category
Performance
---
## Rule
Create a composite index on `(foreign_key, ordering_column)` for every `latestOfMany()` or `ofMany()` relationship.
---
## Reason
`ofMany()` uses a correlated subquery with `ORDER BY`. Without a composite index covering both the FK and the ordering column, the subquery performs a full table scan per parent row.
---
## Bad Example
```php
// No composite index on (user_id, created_at)
public function latestLogin(): HasOne
{
    return $this->hasOne(Login::class)->latestOfMany();
}
```
---
## Good Example
```php
$table->index(['user_id', 'created_at']); // Composite index

public function latestLogin(): HasOne
{
    return $this->hasOne(Login::class)->latestOfMany();
}
```
---
## Exceptions
Trivially small tables under 1,000 rows.
---
## Consequences Of Violation
Slow `ofMany()` queries, degraded eager-loading performance.

## Rule: Scoped-Extract-Reusable-To-Trait
---
## Category
Code Organization
---
## Rule
Extract scoped relationships that are reused across multiple models into a shared trait.
---
## Reason
Duplicating the same scoped relationship definition across multiple models violates DRY and creates maintenance burden. A trait centralizes the definition.
---
## Bad Example
```php
class Post extends Model
{
    public function approvedComments(): HasMany
    {
        return $this->hasMany(Comment::class)->where('approved', true);
    }
}
class Article extends Model
{
    public function approvedComments(): HasMany
    {
        return $this->hasMany(Comment::class)->where('approved', true);
    }
}
```
---
## Good Example
```php
trait HasApprovedComments
{
    public function approvedComments(): HasMany
    {
        return $this->hasMany(Comment::class)->where('approved', true);
    }
}

class Post extends Model { use HasApprovedComments; }
class Article extends Model { use HasApprovedComments; }
```
---
## Exceptions
When the scoped relationship is unique to a single model.
---
## Consequences Of Violation
Code duplication, inconsistent constraints across models, maintenance overhead.

## Rule: Scoped-Document-Constraints
---
## Category
Maintainability
---
## Rule
Document scoped relationship constraints in the method DocBlock to prevent surprise about hidden filtering.
---
## Reason
Scoped relationships silently filter data. Without documentation, developers may be unaware that `$user->comments` only returns approved comments.
---
## Bad Example
```php
public function comments(): HasMany
{
    return $this->hasMany(Comment::class)->where('approved', true);
    // Hidden constraint surprises consumers
}
```
---
## Good Example
```php
/**
 * @return Collection<int, Comment> Only approved comments
 */
public function approvedComments(): HasMany
{
    return $this->hasMany(Comment::class)->where('approved', true);
}
```
---
## Exceptions
When the constraint name makes it obvious (e.g., `approvedComments`).
---
## Consequences Of Violation
Data surprises, debugging confusion, incorrect assumptions.
