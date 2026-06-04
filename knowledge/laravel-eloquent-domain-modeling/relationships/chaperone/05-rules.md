# Chaperone Rules

## Rule: Chaperone-Selective-Only
---
## Category
Performance
---
## Rule
Apply `chaperone()` only on relationships where mutation isolation is a specific requirement, not on every relationship.
---
## Reason
Chaperone clones each related model instance per parent. On highly-shared relationships (many parents, one related model), this multiplies memory usage linearly with parent count.
---
## Bad Example
```php
class Post extends Model
{
    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class)->chaperone();
        // Chaperoned "just in case" — high memory cost
    }
}
```
---
## Good Example
```php
class Post extends Model
{
    // Only chaperone when mutation isolation is needed
    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }
}
```
---
## Exceptions
When profiling proves memory impact is acceptable for the dataset size.
---
## Consequences Of Violation
Unnecessary memory bloat, potential OOM errors in production.

## Rule: Chaperone-Not-In-Web-Requests
---
## Category
Performance
---
## Rule
Do not use `chaperone()` in short-lived web requests where identity map sharing is harmless.
---
## Reason
Web requests are short-lived and each response gets its own scope. The identity map sharing that chaperone prevents is not a problem in request-response flows, making the memory cost unnecessary.
---
## Bad Example
```php
// Web controller — request lives milliseconds
Post::with('author.chaperone')->get();
```
---
## Good Example
```php
// CLI command or queue job — mutation isolation matters
public function handle(): void
{
    Post::with('author.chaperone')->chunk(100, function ($posts) {
        foreach ($posts as $post) {
            $post->author->name = strtoupper($post->author->name);
        }
    });
}
```
---
## Exceptions
Livewire or Filament applications where same-model instances persist across multiple request cycles.
---
## Consequences Of Violation
Memory bloat on every request, increased response times.

## Rule: Chaperone-Shallow-Clone-Awareness
---
## Category
Reliability
---
## Rule
Do not assume chaperone provides deep clone isolation — object-typed attributes (casts, nested relations) are still shared by reference.
---
## Reason
Chaperone performs a shallow clone. Primitive attributes are copied, but object references (Carbon instances, related models, custom cast objects) remain shared.
---
## Bad Example
```php
$posts[0]->author->profile->city = 'NYC';
// $posts[1]->author->profile->city may also be 'NYC'
```
---
## Good Example
```php
// Clone deep manually if full isolation is needed
$posts[0]->author->profile = clone $posts[0]->author->profile;
$posts[0]->author->profile->city = 'NYC';
```
---
## Exceptions
When the chaperoned model has no object-typed attributes.
---
## Consequences Of Violation
Unexpected cross-parent mutation leakage through shared object references.

## Rule: Chaperone-Lazy-Loading-Limitation
---
## Category
Reliability
---
## Rule
Do not rely on chaperone for lazy-loaded relationships — it only affects eager-loaded relations.
---
## Reason
Chaperone clones models during the eager-loading hydration phase. Lazy loading allocates new instances per access, so the identity map limitation that chaperone addresses does not apply.
---
## Bad Example
```php
$post->author; // Lazy loaded — not chaperoned even if defined
$post->load('author'); // Loaded — also not chaperoned (load uses lazy path)
```
---
## Good Example
```php
Post::with('author.chaperone')->get(); // Eager loaded — chaperoned
```
---
## Exceptions
None.
---
## Consequences Of Violation
False expectation of isolation, mutation leakage on lazy-loaded relations.

## Rule: Chaperone-Monitor-Memory
---
## Category
Performance
---
## Rule
Profile memory usage before and after adding `chaperone()` to a high-cardinality relationship.
---
## Reason
Chaperoning a 1:many relationship where many parents share one related model can increase memory usage 1000×. Measuring validates the cost is acceptable.
---
## Bad Example
```php
// Added chaperone without measuring impact
// 10,000 posts all by same author = 10,000 Author instances
```
---
## Good Example
```php
// Before: memory_get_usage() baseline
// After: memory_get_usage() with chaperone
// Only add if increase is acceptable
```
---
## Exceptions
When dataset size is known and trivially small.
---
## Consequences Of Violation
Unexpected OOM errors, increased hosting costs, degraded performance.

## Rule: Chaperone-Combine-Inverse
---
## Category
Architecture
---
## Rule
Combine `chaperone()` with `inverse()` when both mutation isolation and bidirectional consistency are required.
---
## Reason
Using both features together provides full isolation with consistent in-memory state. Using one without the other leaves gaps in correctness.
---
## Bad Example
```php
public function author(): BelongsTo
{
    return $this->belongsTo(Author::class)->chaperone();
    // No inverse — parent doesn't see child updates
}
```
---
## Good Example
```php
public function author(): BelongsTo
{
    return $this->belongsTo(Author::class)->chaperone()->inverse('posts');
}
```
---
## Exceptions
When only one concern (isolation or consistency) is relevant.
---
## Consequences Of Violation
Incomplete data consistency, stale relation state.
