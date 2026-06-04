# whereBelongsTo Skills

## Skill: Filter queries by related model using whereBelongsTo

### Purpose
Use `whereBelongsTo()` to filter parent queries by a related model instance, replacing hard-coded foreign key names with relationship-based references.

### When To Use
- Filtering queries by a related model instance: "find all posts by this user"
- Replacing hard-coded foreign key names with relationship-based references
- Multi-tenant scoping: scoping queries to a tenant/team model
- API controllers: decoupling request parameters from database schema

### When NOT To Use
- With non-BelongsTo relationships (throws exception)
- When filtering by related model attributes (use `whereHas()`)
- With unpersisted models (no `id` — generates `WHERE FK IS NULL`)
- For authorization gates (use direct FK comparison for zero-query)

### Prerequisites
- Defined `BelongsTo` relationship on the queried model

### Inputs
- Related model instance (persisted, with non-null `id`)
- Optional explicit relationship name (when multiple BelongsTo to same model exist)

### Workflow
1. Obtain a persisted related model instance
2. Call `ParentModel::whereBelongsTo($relatedModel)->get()`
3. For models with multiple `BelongsTo` to the same related model, pass the explicit relationship name: `whereBelongsTo($author, 'author')`
4. For collection filtering, pass a Collection: `whereBelongsTo($users)` generates `WHERE FK IN (...)` 
5. Chain with other query conditions as needed

### Validation Checklist
- [ ] Related model is persisted (has non-null `id`)
- [ ] Relationship is `BelongsTo` (not HasMany or BelongsToMany)
- [ ] Explicit relationship name passed when ambiguous
- [ ] Collection support used for batch filtering (single `WHERE IN`)
- [ ] Not used for authorization gates (direct FK is cheaper)

### Common Failures
- Using with unpersisted model — generates `WHERE FK IS NULL`
- Using with non-BelongsTo relationship — throws exception
- Omitting explicit name when multiple BelongsTo to same model exist
- Using for authorization — unnecessary query vs direct FK access

### Decision Points
- **whereBelongsTo or whereHas?** — Use `whereBelongsTo` for filtering by model identity (FK match); use `whereHas` for filtering by related model attributes
- **whereBelongsTo or where('fk', $id)?** — Prefer `whereBelongsTo` for maintainability (FK knowledge in relationship); use direct `where()` for simple, stable FKs

### Performance Considerations
- Relationship resolution overhead is microseconds
- Generated SQL is identical to manual `where()` clause
- Collection support generates single `WHERE IN` — no N+1

### Security Considerations
- Method introspects relationship definitions — no SQL injection risk
- Ensure relationship name is not user-controllable

### Related Rules
- [WhereBelongsTo-Only-BelongsTo](../where-belongs-to/05-rules.md)
- [WhereBelongsTo-Explicit-Relation-Name](../where-belongs-to/05-rules.md)
- [WhereBelongsTo-Persisted-Model-Only](../where-belongs-to/05-rules.md)
- [WhereBelongsTo-Collection-IN](../where-belongs-to/05-rules.md)
- [WhereBelongsTo-Not-For-Authorization](../where-belongs-to/05-rules.md)
- [WhereBelongsTo-Preferred-Over-Hardcoded-FK](../where-belongs-to/05-rules.md)
- [WhereBelongsTo-Not-For-Attribute-Filtering](../where-belongs-to/05-rules.md)

### Related Skills
- Configure BelongsTo relationship with foreign key conventions

### Success Criteria
- `whereBelongsTo($model)` generates correct `WHERE FK = ?` SQL
- `whereBelongsTo($collection)` generates correct `WHERE FK IN (...)` SQL
- Explicit relationship name works with custom FK names
- Unpersisted model produces `WHERE FK IS NULL` (known behavior)
