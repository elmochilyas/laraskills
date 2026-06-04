# Anti-Patterns: HasOneThrough

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** HasOneThrough

## Anti-Patterns

### Wrong Argument Order
Passing the intermediate model as the first argument and the target as the second in `HasOneThrough`. The method signature is `hasOneThrough(Target, Intermediate, ...)` — target first, intermediate second.

**Problem:** Incorrect join SQL, wrong query results, silent data corruption.

**Solution:** Always pass the target first, intermediate second: `$this->hasOneThrough(Avatar::class, Profile::class)`.

### Assuming Write Support
Calling `create()` or `save()` on a `HasOneThrough` relationship. Through relationships are read-only — attempting writes throws a `BadMethodCallException`.

**Problem:** Runtime exceptions, developer confusion, wasted debugging time.

**Solution:** Create targets through the specific intermediate: `$user->profile->avatar()->create($data)`.

### Hiding Meaningful Intermediates
Using `HasOneThrough` when the intermediate model is meaningful in the domain and should be exposed. The intermediate becomes invisible to API consumers and view templates.

**Problem:** Hidden domain concepts, incomplete API responses, consumer confusion.

**Solution:** Expose the intermediate explicitly: `$user->profile` and `$user->profile->avatar` for access.

### Missing UNIQUE Constraints
Creating the intermediate and target foreign keys without `UNIQUE` constraints. `HasOneThrough` assumes one-to-one cardinality at each hop — duplicates break the guarantee.

**Problem:** Non-deterministic results, data integrity corruption.

**Solution:** Add `->unique()` on both `intermediate.parent_id` and `target.intermediate_id`.

### Missing Index on Both FKs
Creating the intermediate and target foreign keys without indexes. The join query traverses both FKs — without indexes, it performs full table scans.

**Problem:** Slow join queries, degraded page load times.

**Solution:** Add `->index()` on both `intermediate.parent_id` and `target.intermediate_id`.

### Missing Cascade Delete
Creating the target's foreign key to intermediate without `ON DELETE CASCADE`. Deleting the intermediate orphans the target record.

**Problem:** Orphaned target records, wasted storage, stale data.

**Solution:** Add `->cascadeOnDelete()` on the target's foreign key to the intermediate.

### Null Intermediate Access
Accessing the through target without nullsafe protection. If the intermediate model does not exist, the through relationship returns `null` — accessing attributes on `null` throws a fatal error.

**Problem:** Runtime crashes, 500 errors.

**Solution:** Use nullsafe access: `$user->avatar?->url` or guard with intermediate existence checks.
