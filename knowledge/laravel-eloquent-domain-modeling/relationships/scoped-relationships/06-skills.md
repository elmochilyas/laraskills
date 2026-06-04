# Scoped Relationships Skills

## Skill: Define scoped relationships with descriptive naming

### Purpose
Create scoped relationships that embed constraints (where, orderBy, limit) at the definition level, with descriptive names and a base unscoped relationship for full access.

### When To Use
- Domain-specific relationship variants: `approvedComments()`, `recentPosts()`, `latestLogin()`
- Default ordering on relationships
- Filtering to always exclude certain records (soft deletes, spam filters)
- "Best of" relationships using `latestOfMany()` or `ofMany()`

### When NOT To Use
- When constraints need to vary by request context (use runtime `with()` closures)
- When you need the unconstrained relationship regularly without a base version
- Overly complex scoped relationships that would be better as query scopes

### Prerequisites
- Base (unscoped) relationship method

### Inputs
- Relationship method name (descriptive of the constraint)
- Query builder methods to chain (where, orderBy, limit, ofMany)

### Workflow
1. Define the base (unscoped) relationship first: `public function comments(): HasMany`
2. Define scoped variants with clear names: `public function approvedComments(): HasMany`
3. Chain constraints on the return value: `return $this->hasMany(Comment::class)->where('approved', true)`
4. For singular "best of" relations: `$this->hasOne(Login::class)->latestOfMany()`
5. Always pair `limit()` with `orderBy()` for deterministic results
6. Create composite indexes for `ofMany()` relationships on `(fk, ordering_column)`
7. Document constraints in the method DocBlock

### Validation Checklist
- [ ] Base (unscoped) relationship exists alongside scoped variants
- [ ] Scoped relationship names clearly reflect the constraints applied
- [ ] `limit()` is paired with `orderBy()` for deterministic results
- [ ] `ofMany()` relationships have composite index on `(fk, ordering_column)`
- [ ] Constraints cannot be overridden at query time (known limitation)
- [ ] Scoped relationships are documented

### Common Failures
- Naming scoped relationships generically (`posts` when filtered) — violates least surprise
- Only scoped, no base — can't access unfiltered data
- Using scoped for runtime-varying constraints — can't be overridden
- `ofMany()` without composite index — slow correlated subqueries

### Decision Points
- **Scoped or runtime constraint?** — Use scoped for fixed domain concepts (approved comments); use runtime `with()` closures for request-specific filtering
- **One scoped or multiple?** — Create multiple scoped variants for different use cases (e.g., `publishedPosts`, `recentPosts`, `featuredPosts`); extract to trait if shared across models

### Performance Considerations
- Scoped relationships generate identical SQL to hand-written constraints
- `ofMany()` uses correlated subquery — index the ordering column
- Multiple scoped relationships on same base table each generate independent subqueries

### Security Considerations
- Scoped relationships filter at definition level — applied to all queries
- Ensure constraints don't hide data that should be accessible via authorization
- Document constraints to prevent data surprises

### Related Rules
- [Scoped-Descriptive-Naming](../scoped-relationships/05-rules.md)
- [Scoped-Keep-Base-Relationship](../scoped-relationships/05-rules.md)
- [Scoped-Not-For-Runtime-Variation](../scoped-relationships/05-rules.md)
- [Scoped-Pair-Limit-With-OrderBy](../scoped-relationships/05-rules.md)
- [Scoped-OfMany-Index-Ordering](../scoped-relationships/05-rules.md)
- [Scoped-Extract-Reusable-To-Trait](../scoped-relationships/05-rules.md)
- [Scoped-Document-Constraints](../scoped-relationships/05-rules.md)

### Related Skills
- Apply constrained eager loading with proper foreign key inclusion

### Success Criteria
- Scoped relationships apply constraints on both eager and lazy loading
- Base relationship exists for unfiltered access
- Names clearly reflect constraints
- `ofMany()` relationships have proper indexing
- Constraints are documented and expected
