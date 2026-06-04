# withExists / loadExists Skills

## Skill: Check relationship existence using withExists

### Purpose
Use `withExists()` to add boolean existence attributes to models, answering "does this model have at least one related record?" without loading or counting related models.

### When To Use
- Feature flag checks: does the user have an active subscription?
- Conditional UI rendering: show/hide sections based on existence
- Authorization gates: does the user have the required role?
- Presence detection in list views
- Any yes/no question about relationship existence

### When NOT To Use
- When you need the actual count (use `withCount()`)
- When you need the related models (use `with()`)
- When filtering the parent query by existence (use `has()`/`whereHas()`)
- With `withCount()` on the same relation (redundant)

### Prerequisites
- Defined relationship on the parent model
- Indexed foreign key on child table

### Inputs
- Relationship name to check
- Optional constraint callback for filtered existence

### Workflow
1. Add `->withExists('relation')` to the parent query
2. Access the boolean via `$parent->relation_exists`
3. For filtered existence: `->withExists(['comments' => fn($q) => $q->where('approved', true)])`
4. Cast the attribute to boolean in API responses for type clarity
5. For soft-deletable relations, exclude trashed records in constraint

### Validation Checklist
- [ ] `withExists()` is used instead of `withCount()` > 0 for boolean checks
- [ ] Attribute is boolean or cast to boolean
- [ ] `EXISTS` short-circuits on first match (verify via EXPLAIN)
- [ ] FK on child table is indexed for short-circuit performance
- [ ] Soft-deleted records are excluded from existence check if applicable
- [ ] `withExists()` not used when `with()` (actual models) is needed

### Common Failures
- Using `withCount()` > 0 when `withExists()` is more efficient
- Forgetting to cast attribute to boolean in API responses
- Not constraining for soft-deletes — misleading existence flags
- Using `withExists()` and `withCount()` on same relation (redundant)

### Decision Points
- **withExists vs withCount?** — Use `withExists()` for yes/no; use `withCount()` when cardinality matters
- **withExists vs has()?** — Use `withExists()` for annotation (adds attribute); use `has()` for filtering

### Performance Considerations
- `EXISTS` short-circuits on first matching row — faster than `COUNT(*)`
- Advantage grows with child table cardinality
- Index the FK for optimal short-circuit performance

### Security Considerations
- Exposes only boolean — no related model data leaked
- Constraint callbacks follow standard authorization patterns

### Related Rules
- [WithExists-Over-WithCount-For-Boolean](../with-exists/05-rules.md)
- [WithExists-Index-Foreign-Key](../with-exists/05-rules.md)
- [WithExists-Not-With-WithCount-Same-Relation](../with-exists/05-rules.md)
- [WithExists-SoftDelete-Awareness](../with-exists/05-rules.md)
- [WithExists-Not-For-Parent-Filtering](../with-exists/05-rules.md)
- [WithExists-Boolean-Attribute](../with-exists/05-rules.md)

### Related Skills
- Count related records using withCount

### Success Criteria
- `withExists('relation')` adds boolean `{relation}_exists` attribute
- `EXISTS` subquery short-circuits on first match
- Boolean attribute works in conditional checks
- Index on FK enables short-circuit performance
