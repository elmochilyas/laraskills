## Use SoftDeletes Trait for Automatic Scout Handling
---
## Category
Reliability
---
## Rule
Always use Laravel's `SoftDeletes` trait on models that need soft delete with Scout; Scout detects it automatically.
---
## Reason
Without `SoftDeletes`, Scout treats deleted records as hard deletes, removing them from the index permanently. Soft-deleted records should remain searchable-excluded, not deleted.
---
## Bad Example
```php
class Post extends Model
{
    use Searchable;
    // No SoftDeletes — deleted records vanish from index entirely
}
```
---
## Good Example
```php
class Post extends Model
{
    use SoftDeletes, Searchable;
    // Scout auto-sets __soft_deleted = true on delete
}
```
---
## Exceptions
Models using hard deletes where index removal is the desired behavior.
---
## Consequences Of Violation
Permanent index removal on soft delete, inability to restore searchability, data loss.

## Test Soft Delete/Force Delete Index Behavior
---
## Category
Testing
---
## Rule
Always write tests verifying that soft-deleted records are excluded from search results and force-deleted records are removed from the index.
---
## Reason
Scout's automatic soft delete handling can break silently after Scout version upgrades or configuration changes, causing deleted data to appear in search.
---
## Bad Example
```php
// No tests for soft delete search behavior
```
---
## Good Example
```php
public function test_soft_deleted_post_not_in_search(): void
{
    $post = Post::factory()->create();
    $post->delete(); // Soft delete

    $results = Post::search('test')->get();

    $this->assertCount(0, $results);
}
```
---
## Exceptions
No common exceptions for production search implementations.
---
## Consequences Of Violation
Deleted records appearing in search results, data leakage, compliance violations.

## Use forceDelete for Complete Index Removal
---
## Category
Architecture
---
## Rule
Use `forceDelete()` instead of `delete()` when a record must be permanently removed from both database and search index.
---
## Reason
`delete()` on a SoftDeletes model only sets `__soft_deleted = true` in the index. The record remains searchable-excluded but still consumes storage. `forceDelete()` removes it completely.
---
## Bad Example
```php
$post->delete(); // Record stays in index as excluded — wastes storage
```
---
## Good Example
```php
$post->forceDelete(); // Removes from DB and index entirely
```
---
## Exceptions
When retaining the record in the index (as excluded) is desired for analytics or auditing.
---
## Consequences Of Violation
Index bloat from excluded records, wasted storage, potential confusion in analytics.
