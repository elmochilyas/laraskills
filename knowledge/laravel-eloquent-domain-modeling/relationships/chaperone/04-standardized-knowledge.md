# Chaperone — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** chaperone
- **ECC Version:** 1.0

## Overview
The `chaperone()` method (Laravel 11+) prevents a single related model instance from being shared across multiple parent models during eager loading. Without chaperoning, Eloquent's identity map returns the same object for all parents with the same related model — mutating it via one parent affects all others. Chaperoning ensures each parent gets a separate instance.

## Core Concepts
- Eloquent's identity map caches models by primary key — all parents with the same related model share one instance
- `->chaperone()` on the relationship definition clones the related model before assigning it to each parent
- Shallow clone: primitive attributes are copied, but object-typed attributes (relations, casts) are still shared
- Only affects eager-loaded relations — lazy-loaded relations still share instances
- Implemented in `Illuminate\Database\Eloquent\Relations\Concerns\SupportsInverseRelations`

## When To Use
- Batch processing where you mutate related models temporarily without wanting cross-parent leakage
- Import/export scripts where each row's parent relationship should be isolated
- Queue jobs where accumulated mutations could cause subtle bugs
- Combined with inverse relations for full isolation with bidirectional consistency
- Long-running processes (CLI commands, workers) where instance state persists across operations

## When NOT To Use
- Do NOT use in short-lived web requests where identity map sharing is desirable and harmless
- Do NOT use when memory efficiency matters more than mutation isolation
- Do NOT use when you rely on identity map reference equality (`===`) checks
- Do NOT use when you expect deep clone isolation — shallow clone still shares object attributes
- Do NOT apply to all relationships "just in case" — significant memory bloat on shared relations

## Best Practices (WHY)
- Apply chaperone selectively only on relationships where mutation isolation matters
- Monitor memory usage when enabling chaperone on high-cardinality relationships
- Use `chaperone()` combined with `inverse()` for full isolation with bidirectional consistency
- Test with realistic data volumes to understand the memory impact
- Document chaperone usage — developers may be surprised by broken identity map expectations

## Architecture Guidelines
- Reserve chaperone for CLI commands, queue workers, and import scripts — not web requests by default
- Avoid chaperoning highly-shared relations where many parents point to the same related model
- Combine with inverse relations trait when both features are needed
- Consider deep clone strategies if shallow clone isolation is insufficient
- Profile memory usage before and after adding chaperone to a relationship

## Performance
- Memory usage increases linearly with the number of parents sharing the same related model
- 1,000 posts sharing one author: 1 Author instance without chaperone, 1,000 with chaperone
- Shallow clone operation is fast (microseconds per model) — the memory overhead is the primary concern
- Chaperoning a 1:many relationship (many parents to one related) has the highest memory impact
- Chaperoning a 1:1 or many:many relationship has minimal memory impact

## Security
- Chaperone prevents cross-parent mutation leakage — primarily a correctness feature, not security
- No authorization implications — it's about instance isolation, not access control
- Shallow clone means object-typed casted attributes are still shared by reference

## Common Mistakes
- Using chaperone when identity map sharing is actually desired — wasting memory unnecessarily
- Expecting chaperone to prevent all state leakage — object-typed model attributes are still shared
- Applying chaperone to all relationships "just in case" — significant memory bloat on shared relations
- Forgetting that lazy loading is not chaperoned — only eager-loaded relations are cloned

## Anti-Patterns
- **Chaperone on every relationship**: applying to all relations regardless of need — memory waste
- **Expecting deep clone**: assuming chaperone fully isolates all nested state
- **Identity map reliance**: code using `===` comparisons that break with chaperoned instances
- **Web request chaperone**: using chaperone in short-lived requests where identity map sharing is fine

## Examples
```php
use Illuminate\Database\Eloquent\Relations\Concerns\SupportsInverseRelations;

class Post extends Model
{
    use SupportsInverseRelations;

    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class)->chaperone();
    }
}

// Without chaperone: all posts share the same Author instance
$posts = Post::with('author')->get();
$posts[0]->author->name = 'Changed';
echo $posts[1]->author->name; // 'Changed' — mutation leaked!

// With chaperone: each post gets its own Author instance
$posts = Post::with('author')->get();
$posts[0]->author->name = 'Changed';
echo $posts[1]->author->name; // original name — isolated

// Combined with inverse
class User extends Model
{
    use SupportsInverseRelations;

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class)->chaperone()->inverse('user');
    }
}

// Batch processing example
public function processImport(): void
{
    Post::with('author.chaperone')->chunk(100, function ($posts) {
        foreach ($posts as $post) {
            // Mutations to $post->author don't leak to other posts
            $post->author->name = strtoupper($post->author->name);
        }
    });
}
```

## Related Topics
- Inverse Relations — complementary in-memory consistency feature
- Eager Loading Mechanics — identity map and relation hydration
- Model Cloning and Replication — general model duplication
- SupportsInverseRelations trait — chaperone lives in the same trait

## AI Agent Notes
- Chaperone clones related model instances during eager loading — increased memory usage
- Shallow clone: primitives copied by value, objects by reference
- Only affects eager-loaded relations, not lazy-loaded ones
- Most useful in long-running processes (CLI, queues, imports)
- Combine with `inverse()` for full isolation with bidirectional consistency
- Monitor memory — chaperoning a highly-shared 1:many relation can cause OOM

## Verification
- [ ] Chaperoned relationship returns separate instances for each parent
- [ ] Mutations to one parent's related model don't affect others
- [ ] Shallow clone behavior is understood — object-typed attributes still shared
- [ ] Memory usage is acceptable for the dataset size
- [ ] Chaperone is only applied where mutation isolation is needed
- [ ] Lazy loading is not expected to be chaperoned
