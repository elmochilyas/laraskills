# Relationship Touch Skills

## Skill: Configure $touches for parent timestamp propagation

### Purpose
Use the `$touches` property to automatically update parent model timestamps when child models are created, updated, or deleted.

### When To Use
- Cache invalidation: when a Comment changes, touch the Post to invalidate its cache
- Hierarchical timestamps: child change propagates up to parent and grandparent
- "Last modified" tracking on parent when child changes
- Feed/listing freshness: Post touches User so profile shows latest activity

### When NOT To Use
- On write-heavy relationships — each child save generates an extra UPDATE on the parent
- On deep chains — recursive touches multiply query cost
- On `HasMany` or `BelongsToMany` — only works with singular relations
- On models without an `updated_at` column

### Prerequisites
- Child model with singular relationship (BelongsTo, HasOne) to parent
- Parent model has `updated_at` column

### Inputs
- Relationship names to include in `$touches` array
- Child model class

### Workflow
1. On the child model, add `protected $touches = ['parent_relation'];`
2. Ensure the relationship name is a singular relation (BelongsTo or HasOne) — not HasMany
3. If the parent also needs to touch its parent, add `$touches` on the parent too
4. Keep chains to a maximum of 2 levels deep
5. Document the touch chain in a DocBlock on the model

### Validation Checklist
- [ ] `$touches` only lists singular relationships (BelongsTo, HasOne)
- [ ] Parent model has `updated_at` column
- [ ] Touch chain is at most 2 levels deep
- [ ] No circular touch chains exist
- [ ] Touch chain is documented in model DocBlock
- [ ] Update queries on parent are monitored and acceptable

### Common Failures
- Listing `HasMany` in `$touches` — silently does nothing
- Deep touch chains (3+ levels) multiplying queries
- Circular touches causing infinite loops
- Forgetting `withoutTouching()` in batch operations
- No monitoring — touch overhead invisible until production

### Decision Points
- **$touches or manual touch()?** — Use `$touches` for automatic propagation on every child save; use manual `$parent->touch()` for one-off updates
- **$touches or queue?** — Use `$touches` for low-to-moderate write volume; use queued cache invalidation for high-volume write paths

### Performance Considerations
- Each touch generates one UPDATE on the parent table
- Each touch lazy-loads the parent model (one SELECT)
- 100 child saves with touch = 100 extra UPDATE + 100 extra SELECT queries
- `withoutTouching()` is essential for batch operations

### Security Considerations
- Touches fire `saving`/`saved` events on parent — can trigger observers
- `touching`/`touched` events can be listened to for cache invalidation

### Related Rules
- [Touch-Singular-Only](../relationship-touch/05-rules.md)
- [Touch-Limit-Chain-Depth](../relationship-touch/05-rules.md)
- [Touch-Circular-Prevention](../relationship-touch/05-rules.md)
- [Touch-Avoid-Write-Heavy](../relationship-touch/05-rules.md)
- [Touch-Monitor-Query-Logs](../relationship-touch/05-rules.md)
- [Touch-Hierarchy-Documentation](../relationship-touch/05-rules.md)

### Related Skills
- Suppress touch propagation in batch operations

### Success Criteria
- Child save updates parent's `updated_at`
- Touch chain propagates to grandparent (if configured)
- No circular touch chains
- Query logs show expected number of UPDATE queries
- Touch chain is documented

---

## Skill: Suppress touch propagation in batch operations

### Purpose
Use `Model::withoutTouching()` to prevent automatic parent timestamp updates during seeders, factories, imports, and bulk operations.

### When To Use
- Seeding large datasets with factory-generated models
- Bulk import scripts that create thousands of child records
- Data migrations that modify existing child records
- Test setup that creates many related models

### When NOT To Use
- When parent timestamps must be updated for each individual child change

### Prerequisites
- Models with `$touches` configured

### Inputs
- Operation to wrap in suppression scope
- Optional model class array for targeted suppression

### Workflow
1. Wrap the batch operation: `Model::withoutTouching(function () { ... })`
2. For targeted suppression, pass an array of model classes: `Model::withoutTouching([Comment::class], function () { ... })`
3. Inside the callback, create/update models normally — touch queries are suppressed
4. After the callback, touch behavior resumes normally

### Validation Checklist
- [ ] `withoutTouching()` is used in all batch operations
- [ ] Touch queries are suppressed during the batch
- [ ] Parent timestamps are not updated during the batch
- [ ] Targeted suppression works correctly when specified

### Common Failures
- Not using `withoutTouching()` in seeders — thousands of extra UPDATE queries
- Suppressing globally when only specific model touches should be suppressed
- Expecting touch to work inside `withoutTouching()` — it's intentionally suppressed

### Decision Points
- **Global or targeted?** — Use `Model::withoutTouching(function() { ... })` for global suppression; use `Model::withoutTouching([Comment::class], function() { ... })` for model-specific suppression

### Performance Considerations
- Suppressing touch for 1,000 child saves eliminates 1,000+ UPDATE queries
- No side effects — touch is purely timestamp management

### Security Considerations
- None — touches are timestamp management, not security

### Related Rules
- [Touch-WithoutTouching-Batch](../relationship-touch/05-rules.md)

### Related Skills
- Configure $touches for parent timestamp propagation

### Success Criteria
- Batch operations complete without touch-related UPDATE queries
- Parent timestamps are not affected by batch child operations
- Targeted suppression works correctly
