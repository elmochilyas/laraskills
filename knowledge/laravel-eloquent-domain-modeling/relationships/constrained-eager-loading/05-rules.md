# Constrained Eager Loading Rules

## Rule: Constrained-Select-Include-Foreign-Key
---
## Category
Framework Usage
---
## Rule
Always include the foreign key column in `select()` calls within constrained eager loading closures.
---
## Reason
Eloquent matches related models to parents using the foreign key. Omitting it from `select()` breaks hydration — related models cannot be assigned to their parents.
---
## Bad Example
```php
User::with(['profile' => fn($q) => $q->select('avatar_url')])->get();
// Missing user_id — profiles can't be matched to users
```
---
## Good Example
```php
User::with(['profile' => fn($q) => $q->select('id', 'user_id', 'avatar_url')])->get();
```
---
## Exceptions
None.
---
## Consequences Of Violation
Broken relationship hydration, null relations despite matching records.

## Rule: Use-LimitBy-Not-Limit
---
## Category
Framework Usage
---
## Rule
Use `limitBy()` (Laravel 8.52+) for per-parent limiting instead of `limit()` which applies globally.
---
## Reason
`limit()` constrains the total query result, not the results per parent. With 100 parents, `limit(5)` returns 5 related records total, not 5 per parent.
---
## Bad Example
```php
User::with(['posts' => fn($q) => $q->latest()->limit(5)])->get();
// Returns 5 posts total, not 5 per user
```
---
## Good Example
```php
User::with(['posts' => fn($q) => $q->latest()->limitBy(5)])->get();
// Returns 5 posts per user
```
---
## Exceptions
When global limiting is actually the desired behavior.
---
## Consequences Of Violation
Unexpectedly few related records, incorrect data in views.

## Rule: Extract-Complex-Closures
---
## Category
Maintainability
---
## Rule
Extract complex constraint closures into named query scopes on the related model.
---
## Reason
Inline closures in `with()` arrays cannot be reused across queries. Named scopes provide reusability, testability, and self-documenting code.
---
## Bad Example
```php
$posts = Post::with(['comments' => fn($q) => $q
    ->where('approved', true)
    ->where('spam', false)
    ->whereNotNull('body')
    ->latest()
])->get();
// Same closure duplicated in 3 controllers
```
---
## Good Example
```php
class Comment extends Model
{
    public function scopeApproved(Builder $q): void
    {
        $q->where('approved', true)->where('spam', false)->whereNotNull('body');
    }
}

$posts = Post::with(['comments' => fn($q) => $q->approved()->latest()])->get();
```
---
## Exceptions
When the constraint is simple and used only once.
---
## Consequences Of Violation
Code duplication, maintenance burden, inconsistent constraints across codebase.

## Rule: Constrained-Count-Not-Load
---
## Category
Performance
---
## Rule
Use `withCount()` with constraint closures for aggregate counts instead of constrained eager loading + PHP counting.
---
## Reason
Loading full related models just to count them hydrates unnecessary objects. `withCount()` adds a single aggregate subquery with zero model hydration.
---
## Bad Example
```php
$posts = Post::with(['comments' => fn($q) => $q->where('approved', true)])->get();
$posts->each(fn($p) => $p->comments->count()); // Hydrates all approved comments
```
---
## Good Example
```php
$posts = Post::withCount(['comments' => fn($q) => $q->where('approved', true)])->get();
// Zero comment model hydration
```
---
## Exceptions
When the actual comment models are needed for display alongside the count.
---
## Consequences Of Violation
Memory bloat from unnecessary model hydration.

## Rule: Pair-OrderBy-With-Limit
---
## Category
Reliability
---
## Rule
Always pair `limit()` or `limitBy()` with `orderBy()` in constrained loading closures for deterministic results.
---
## Reason
Without explicit ordering, the database returns arbitrary rows when limited. The returned subset can vary between queries.
---
## Bad Example
```php
$users = User::with(['posts' => fn($q) => $q->limitBy(5)])->get();
// Which 5 posts? Non-deterministic
```
---
## Good Example
```php
$users = User::with(['posts' => fn($q) => $q->latest()->limitBy(5)])->get();
// Returns 5 most recent posts per user
```
---
## Exceptions
When any subset is acceptable (e.g., random sampling).
---
## Consequences Of Violation
Non-deterministic results, inconsistent display between requests.

## Rule: Verify-Constraint-Selectivity
---
## Category
Performance
---
## Rule
Verify constraint selectivity by inspecting the generated SQL with `toSql()` to ensure the constraint actually reduces the result set.
---
## Reason
Low-selectivity constraints (matching 90%+ of rows) provide minimal performance benefit while adding query complexity. They may even degrade performance by misleading the query planner.
---
## Bad Example
```php
User::with(['posts' => fn($q) => $q->where('type', '!=', 'deleted')])->get();
// If 1% of posts are deleted, this loads 99% of all posts — no benefit
```
---
## Good Example
```php
User::with(['posts' => fn($q) => $q->where('published', true)])->get();
// If 20% of posts are published, this provides meaningful reduction
```
---
## Exceptions
When correctness demands the constraint regardless of selectivity.
---
## Consequences Of Violation
Unnecessary query complexity without performance benefit.

## Rule: Nested-Constraint-Consistency
---
## Category
Reliability
---
## Rule
When constraining both a parent relationship and its nested relationship, ensure the parent constraint is selective enough to make the nested constraint useful.
---
## Reason
Constraining a nested relationship without a selective parent constraint loads many parents unnecessarily, diluting the benefit of the nested constraint.
---
## Bad Example
```php
User::with([
    'posts' => fn($q) => $q, // No constraint — loads all users
    'posts.comments' => fn($q) => $q->where('approved', true),
])->get();
```
---
## Good Example
```php
User::with([
    'posts' => fn($q) => $q->where('published', true),
    'posts.comments' => fn($q) => $q->where('approved', true),
])->get();
```
---
## Exceptions
When all parents are needed regardless.
---
## Consequences Of Violation
Excessive parent hydration, wasted memory and bandwidth.
