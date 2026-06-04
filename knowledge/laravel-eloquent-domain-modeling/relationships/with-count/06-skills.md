# withCount / loadCount Skills

## Skill: Count related records using withCount

### Purpose
Use `withCount()` to add scalar count attributes to models without loading the related model instances.

### When To Use
- Displaying badge counts in list views and index pages
- Dashboard aggregates and reporting summaries
- Any scenario where you need "how many?" without loading related models

### When NOT To Use
- When you only need a boolean existence check (use `withExists()`)
- When you need the actual related models (use `with()`)
- On a relationship already being eager-loaded (redundant)
- On unindexed foreign keys (correlated subquery becomes expensive)

### Prerequisites
- Defined relationship on the parent model
- Indexed foreign key on the child table

### Inputs
- Relationship name(s) to count
- Optional constraint callback for filtered counts

### Workflow
1. Add `->withCount('relation')` to the parent query
2. Access the count via `$parent->relation_count`
3. For filtered counts, use a closure: `->withCount(['comments' => fn($q) => $q->where('approved', true)])`
4. For multiple counts: `->withCount(['comments', 'likes', 'views'])`
5. For nested counts: `->withCount('posts.comments')` — attribute is `posts_comments_count`
6. Use `loadCount()` for deferred/conditional count loading

### Validation Checklist
- [ ] Count is obtained via `withCount()`, not by loading + PHP counting
- [ ] Count attribute is accessed as `$parent->relation_count`
- [ ] Constrained counts correctly filter only relevant children
- [ ] Foreign key on child table is indexed
- [ ] `withCount()` not used when `withExists()` would suffice
- [ ] `withCount()` not used on a relationship also being eager-loaded
- [ ] Soft-deleted records are excluded from count if applicable

### Common Failures
- Loading full models just to count them (memory waste)
- Using `withCount()` and `with()` on the same relation (redundant subquery)
- Not constraining for soft-deletes — inflated counts
- Using `withCount()` when `withExists()` would be more efficient

### Decision Points
- **withCount vs withExists?** — Use `withCount()` when the actual number matters; use `withExists()` for yes/no checks
- **withCount vs loading + PHP count?** — Always prefer `withCount()` for counts alone; use loaded collection `->count()` (zero DB) only when the models are already loaded

### Performance Considerations
- Correlated subquery overhead is bounded by parent query — one execution per row
- Index the FK on child table for subquery performance
- Each `withCount()` adds one subquery — multiple counts add multiple subqueries
- For soft-deleted relations, add `->whereNull('deleted_at')` constraint

### Security Considerations
- `withCount()` exposes only count scalars — no related model data
- Constraint callbacks follow standard authorization patterns

### Related Rules
- [WithCount-Over-Loading-Collection](../with-count/05-rules.md)
- [WithExists-Over-WithCount-For-Boolean](../with-count/05-rules.md)
- [WithCount-Index-Foreign-Key](../with-count/05-rules.md)
- [WithCount-Not-With-Eager-Loaded-Relation](../with-count/05-rules.md)
- [WithCount-Nested-Naming-Awareness](../with-count/05-rules.md)
- [WithCount-SoftDelete-Awareness](../with-count/05-rules.md)
- [WithCount-Multiple-Subqueries](../with-count/05-rules.md)

### Related Skills
- Count related records with constrained aggregates

### Success Criteria
- `withCount('relation')` adds correct `{relation}_count` attribute
- Count is integer type
- Constraint callbacks correctly filter counted rows
- Subquery uses index on FK
- No redundant `withCount()` on already-loaded relations
