# Anti-Patterns: Eager Loading Fundamentals

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Eager Loading Fundamentals

## Anti-Patterns

### N+1 in Blade
Iterating `$users` in a Blade template and accessing `$user->posts` without prior eager loading. The view layer triggers a lazy-load query for each user, multiplying query count.

**Problem:** N+1 query explosion invisible in controller code; database connection exhaustion under load.

**Solution:** Always eager-load in the controller before passing to the view: `User::with('posts')->get()`.

### N+1 in API Resources
Accessing relationships in `ApiResource::toArray()` without `loadMissing()`. Each resource serialization triggers a lazy load, causing N+1 in API responses.

**Problem:** Slow API responses; each serialized resource triggers extra queries.

**Solution:** Use `loadMissing()` defensively in API resources to ensure relationships are loaded.

### Giant Eager Loads
Loading all relationships for all models without constraint limiting. Eager loading hydrates every related model into memory — for large datasets, this exhausts PHP memory.

**Problem:** Memory exhaustion; all related models hydrated even when only a subset is needed.

**Solution:** Use constrained eager loading with `select()`, `where()`, and `limitBy()` to control which related records are loaded.

### Eager Loading Everything
Using `with('*')` or listing every possible relationship unconditionally. Most relationships are not needed on every request — loading them wastes memory and queries.

**Problem:** Unnecessary queries and memory overhead for unused relationships.

**Solution:** Only eager-load relationships that are actually consumed in the current request.

### Eager Loading After Pagination
Calling `->load('relation')` after `->paginate()`. Only the current page's models get the relationship — models on subsequent pages are not loaded.

**Problem:** Inconsistent relationship availability; only visible on the first page of results.

**Solution:** Call `with()` before `paginate()`, not `load()` after.

### load() in a Loop
Calling `$model->load('relation')` inside a `foreach` loop. Each iteration triggers a separate query, recreating the N+1 problem.

**Problem:** N+1 recreated with `load()` instead of lazy loading — same query count, different syntax.

**Solution:** Call `load()` on the collection: `$users->load('posts')` instead of inside the loop.

### Assuming Nested Loading Is One Query
Using `with('posts.comments.author')` and assuming it's one query. Each dot in the chain adds a separate query — this is 3 queries, not 1.

**Problem:** Underestimating query count; expecting O(1) but getting O(levels).

**Solution:** Factor in the number of relationship levels when evaluating eager loading performance.
