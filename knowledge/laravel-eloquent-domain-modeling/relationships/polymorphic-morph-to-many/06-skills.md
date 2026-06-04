# Polymorphic MorphToMany Skills

## Skill: Configure MorphToMany with morph map and cascade cleanup

### Purpose
Define polymorphic many-to-many relationships using `MorphToMany` and `MorphedByMany` with proper morph map registration, composite indexing, and application-level cascade cleanup.

### When To Use
- Universal tagging: a Tag that applies to Posts, Videos, and Products via one pivot table
- Favorites/bookmarks: users can favorite any entity type
- Categories that span multiple entity types
- Labels/flags on heterogeneous entities

### When NOT To Use
- Non-polymorphic many-to-many (use `BelongsToMany`)
- When foreign key constraints are required on polymorphic columns
- For one-to-many polymorphic (use `MorphMany`)

### Prerequisites
- Shared model (e.g., Tag) and multiple parent model types
- Morph map registered in `AppServiceProvider`

### Inputs
- Morph name string (e.g., 'taggable')
- Shared model class
- Parent model classes

### Workflow
1. Register `Relation::morphMap()` with short aliases and call `Relation::enforceMorphMap()`
2. Create pivot migration with `$table->morphs('taggable')` and `foreignIdFor(Tag::class)`
3. Add composite primary key on `(taggable_type, taggable_id, tag_id)`
4. Add `->cascadeOnDelete()` on the shared model's FK (`tag_id`)
5. Add `deleting` event handlers on both parent and shared models to detach pivot rows
6. On parent models, define `morphToMany(Tag::class, 'taggable')`
7. On the shared model, define `morphedByMany(Parent::class, 'taggable')` (NOT `morphToMany`)
8. Ensure identical morph name across all definitions

### Validation Checklist
- [ ] Morph map is registered and enforced in production
- [ ] Composite primary key on `(type, id, related_id)` exists
- [ ] `morphToMany()` on parents, `morphedByMany()` on shared model
- [ ] All definitions use the same morph name
- [ ] `deleting` events detach pivot rows on both sides
- [ ] Shared model FK has `cascadeOnDelete()`
- [ ] Orphan detection query is scheduled

### Common Failures
- Using `morphToMany()` instead of `morphedByMany()` on the shared model — wrong inverse method
- Mismatched morph names — empty relationship results
- No cascade cleanup — orphaned pivot rows accumulate
- No morph map — FQCNs in type column break on rename
- Extending `Pivot` instead of `MorphPivot` for custom pivot models

### Decision Points
- **morphToMany or BelongsToMany?** — Use `morphToMany` when the related model (Tag) associates with multiple parent types; use `BelongsToMany` for single-type many-to-many

### Performance Considerations
- Composite index on `(type, id, related_id)` is mandatory
- Eager loading constrains on type — different parent types generate separate queries
- Pivot table size grows with number of parent types

### Security Considerations
- Validate `*_type` value is in morph map before attach/sync
- Never accept arbitrary class names from user input
- `Relation::enforceMorphMap()` prevents invalid types

### Related Rules
- [MorphToMany-Use-MorphedByMany-Inverse](../polymorphic-morph-to-many/05-rules.md)
- [MorphToMany-Register-Enforce-MorphMap](../polymorphic-morph-to-many/05-rules.md)
- [MorphToMany-Composite-Index](../polymorphic-morph-to-many/05-rules.md)
- [MorphToMany-Cascade-Cleanup-AppLevel](../polymorphic-morph-to-many/05-rules.md)
- [MorphToMany-MorphName-Consistency](../polymorphic-morph-to-many/05-rules.md)
- [MorphToMany-Validate-Type-Input](../polymorphic-morph-to-many/05-rules.md)
- [MorphToMany-Not-FK-Constraints-Awareness](../polymorphic-morph-to-many/05-rules.md)

### Related Skills
- Configure MorphOne/MorphMany with morph map and cascade cleanup

### Success Criteria
- `$parent->tags` returns correct Tags for the parent
- `$tag->posts` returns correct Posts via `morphedByMany`
- Morph map prevents FQCN issues on rename
- Composite index ensures performant queries
- Deleting parent or tag cascades to pivot rows
