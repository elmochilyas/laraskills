# Relationship Touch Rules

## Rule: Touch-Singular-Only
---
## Category
Framework Usage
---
## Rule
Only list singular relationships (`BelongsTo`, `HasOne`) in the `$touches` property — never `HasMany` or `BelongsToMany`.
---
## Reason
`$touches` calls `touch()` on the related model, which is a single-model method. Listing a collection-returning relationship silently does nothing.
---
## Bad Example
```php
class Post extends Model
{
    protected $touches = ['comments']; // HasMany — does nothing
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
Parent timestamps never updated, broken cache invalidation, silent failure.

## Rule: Touch-WithoutTouching-Batch
---
## Category
Performance
---
## Rule
Wrap batch operations (seeders, imports, factories) in `Model::withoutTouching()` to prevent N+1 UPDATE queries.
---
## Reason
Each child save triggers a separate `UPDATE` on the parent. 1,000 child saves = 1,000 extra `UPDATE` queries. `withoutTouching()` suppresses this completely.
---
## Bad Example
```php
// Seeder — 1,000 child creates = 1,000 parent UPDATEs
Comment::factory(1000)->create();
```
---
## Good Example
```php
Model::withoutTouching(function () {
    Comment::factory(1000)->create();
});
```
---
## Exceptions
When the operation requires parent timestamps to be updated after each child change.
---
## Consequences Of Violation
Massive query overhead, slow batch operations, test suite slowdown.

## Rule: Touch-Limit-Chain-Depth
---
## Category
Performance
---
## Rule
Keep `$touches` chains to a maximum of 2 levels deep.
---
## Reason
Each level in the touch chain adds a separate `UPDATE` query plus a `SELECT` to lazy-load the parent. Comment → Post → User = 4 extra queries per comment save.
---
## Bad Example
```php
class Comment extends Model
{
    protected $touches = ['post'];
}
class Post extends Model
{
    protected $touches = ['category'];
}
class Category extends Model
{
    protected $touches = ['user'];
}
// 6 extra queries per Comment save
```
---
## Good Example
```php
class Comment extends Model
{
    protected $touches = ['post'];
}
// Only touch the immediate parent
```
---
## Exceptions
When timestamp propagation through the hierarchy is a verified domain requirement and performance is acceptable.
---
## Consequences Of Violation
Massive query multiplication, performance degradation on write paths.

## Rule: Touch-Monitor-Query-Logs
---
## Category
Performance
---
## Rule
Monitor query logs for excessive `UPDATE ... SET updated_at = ...` queries to detect touch overhead.
---
## Reason
Touch queries are silent — they execute on every child save without appearing in code. Query log monitoring is the only way to detect unintended touch multiplication.
---
## Bad Example
```php
// No monitoring — touch overhead invisible until production issues
```
---
## Good Example
```php
// Laravel Debugbar or Telescope shows
// 1002 queries on a page that should have 2 queries
// Investigation reveals 1000 touch UPDATEs
```
---
## Exceptions
None.
---
## Consequences Of Violation
Undetected write-path performance regression, production slowdown.

## Rule: Touch-Circular-Prevention
---
## Category
Reliability
---
## Rule
Never create circular touch chains where two models touch each other.
---
## Reason
Circular touches create an infinite loop: A touches B, B touches A, A touches B... continuing until PHP execution timeout.
---
## Bad Example
```php
class Post extends Model
{
    protected $touches = ['user'];
}
class User extends Model
{
    protected $touches = ['posts']; // Circular — posts not singular anyway
}
```
---
## Good Example
```php
class Post extends Model
{
    protected $touches = ['user'];
}
// User does not touch Post — one-directional only
```
---
## Exceptions
None.
---
## Consequences Of Violation
Infinite loop, PHP timeout, 500 errors on child save.

## Rule: Touch-Avoid-Write-Heavy
---
## Category
Performance
---
## Rule
Avoid `$touches` on write-heavy relationships where children are frequently created or updated.
---
## Reason
Each child write adds a parent UPDATE. High-volume write paths (logging, analytics, activity feeds) suffer disproportionately from touch overhead.
---
## Bad Example
```php
class Login extends Model
{
    protected $touches = ['user'];
    // 10,000 logins/hour = 10,000 extra UPDATEs
}
```
---
## Good Example
```php
class Login extends Model
{
    // No touches — update user timestamp via queue instead
}
```
---
## Exceptions
When real-time parent timestamp accuracy is a domain requirement.
---
## Consequences Of Violation
Database write amplification, increased I/O, slower write throughput.

## Rule: Touch-Hierarchy-Documentation
---
## Category
Maintainability
---
## Rule
Document touch chains clearly in model DocBlocks to prevent confusion about cascading UPDATE queries.
---
## Reason
Touch behavior is invisible in controller and service code. Without documentation, developers are surprised by extra UPDATE queries and cannot trace their origin.
---
## Bad Example
```php
class Comment extends Model
{
    protected $touches = ['post'];
}
```
---
## Good Example
```php
/**
 * Touches: Comment → Post (cache invalidation)
 */
class Comment extends Model
{
    protected $touches = ['post'];
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Developer confusion, wasted debugging time, unintended performance changes.
