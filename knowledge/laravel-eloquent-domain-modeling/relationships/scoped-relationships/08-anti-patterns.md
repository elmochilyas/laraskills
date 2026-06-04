# Anti-Patterns: Scoped Relationships

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** scoped-relationships

## Anti-Patterns

### Only Scoped, No Base
Defining only scoped relationships without an unscoped version for full access. Consumers have no way to access the unfiltered relationship, limiting query flexibility.

**Problem:** Cannot access unfiltered related records; consumers forced to use workarounds.

**Solution:** Always keep a base (unscoped) relationship alongside scoped variants.

### Runtime Filtering in Definition
Using scoped relationships when the constraints should vary per query context. Scoped relationships encode constraints at definition time — they cannot be overridden at runtime.

**Problem:** Rigid constraints that cannot adapt to different query contexts.

**Solution:** Use runtime constraint closures in `with(['rel' => fn($q) => ...])` for request-specific filtering.

### Hidden Constraints
Defining scoped relationships that silently filter in unexpected ways without clear naming or documentation. Other developers may not realize the relationship has hidden constraints.

**Problem:** Unexpected query results; confusion when the relationship returns fewer records than expected.

**Solution:** Name scoped relationships descriptively (`approvedComments`, `recentPosts`) and document the constraints.

### ofMany Without Index
Using `latestOfMany()` or `ofMany()` on an unindexed ordering column. The correlated subquery performs a full scan per parent row.

**Problem:** Slow subqueries; O(N) scan per parent row; degraded page load times.

**Solution:** Create a composite index on `(foreign_key, ordering_column)` for every `ofMany()` relationship.

### Limit Without OrderBy
Using `->limit(N)` in a scoped relationship without pairing it with `->orderBy()`. Without ordering, which records are kept is non-deterministic.

**Problem:** Non-deterministic results — different queries may return different related records.

**Solution:** Always pair `limit()` with `orderBy()` for deterministic results.

### Scoped on BelongsTo
Applying `ofMany()` or `latestOfMany()` on a `BelongsTo` relationship. These methods only work on `HasOne`/`MorphOne`.

**Problem:** Runtime exceptions or incorrect SQL; broken relationship.

**Solution:** Only use `ofMany()` on `HasOne`/`MorphOne` relationships.
