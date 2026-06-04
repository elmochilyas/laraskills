# Polymorphic (MorphOne / MorphMany) Skills

## Skill: Configure MorphOne/MorphMany with morph map and cascade cleanup

### Purpose
Define polymorphic one-to-one or one-to-many relationships where a child model can belong to multiple parent types, with morph map registration and application-level cascade cleanup.

### When To Use
- Universal attachment systems: images, comments, likes that apply to multiple entity types
- Activity logs where the subject can be any model type
- Any scenario where a child can belong to heterogeneous parent types

### When NOT To Use
- When the child always belongs to a single parent type (use `HasOne`/`HasMany`)
- When foreign key constraints are required (polymorphic columns can't have FK constraints)
- For critical financial data where referential integrity must be database-enforced

### Prerequisites
- Child model migration with morphs() columns
- Morph map registered in `AppServiceProvider`

### Inputs
- Morph name string (e.g., 'imageable')
- Parent relationship method name
- Child model class

### Workflow
1. Register morph map in `AppServiceProvider::boot()` and call `Relation::enforceMorphMap()`
2. In child migration: `$table->morphs('imageable')` creates `imageable_id` and `imageable_type`
3. Add composite index on `(imageable_id, imageable_type)` for query performance
4. On parent models, define `morphOne(Child::class, 'imageable')` or `morphMany(Child::class, 'imageable')`
5. On child model, define `return $this->morphTo();` as the inverse
6. Add `deleting` event handlers on every parent model to clean up polymorphic children
7. Add scheduled orphan detection queries for resilience

### Validation Checklist
- [ ] Morph map is registered and `enforceMorphMap()` is enabled in production
- [ ] Child table has composite index on `(morph_id, morph_type)`
- [ ] `$parent->child` returns single model or collection correctly (MorphOne vs MorphMany)
- [ ] `$child->parent()` returns the correct parent type via morphTo
- [ ] Deleting parent cascades to children via `deleting` event
- [ ] No FK constraint on polymorphic columns — cascade is application-level

### Common Failures
- No morph map — FQCNs stored in type column break on model rename
- Missing composite index — only indexing `*_id` column forces scan on type filter
- Missing `morphTo()` on child — child cannot navigate to parent
- No cascade cleanup — orphaned children accumulate (no FK cascade possible)
- Using polymorphic for single-type relationship — unnecessary complexity

### Decision Points
- **MorphOne or MorphMany?** — Use `MorphOne` for singular child (one image per post); use `MorphMany` for multiple children (many comments per post)
- **Polymorphic or direct FK?** — Use polymorphic only when multiple parent types exist; use `HasOne`/`HasMany` + `BelongsTo` for single-parent-type

### Performance Considerations
- `morphTo()` eager loading fires one query per unique parent type — 5 types = 5 queries
- Composite index on `(morph_id, morph_type)` is essential
- No FK constraint means integrity depends on application code

### Security Considerations
- Validate `*_type` value is in morph map before writes
- Never accept arbitrary class names from user input as the morph type
- `Relation::enforceMorphMap()` prevents invalid types
- Orphaned children can expose stale data

### Related Rules
- [Polymorphic-Register-MorphMap](../polymorphic-morph-one-morph-many/05-rules.md)
- [Polymorphic-Composite-Index](../polymorphic-morph-one-morph-many/05-rules.md)
- [Polymorphic-Cascade-Delete-Via-Events](../polymorphic-morph-one-morph-many/05-rules.md)
- [Polymorphic-MorphTo-Inverse](../polymorphic-morph-one-morph-many/05-rules.md)
- [Polymorphic-Not-For-Single-Type](../polymorphic-morph-one-morph-many/05-rules.md)
- [Polymorphic-Not-For-Financial-Data](../polymorphic-morph-one-morph-many/05-rules.md)
- [Polymorphic-Validate-Type-Input](../polymorphic-morph-one-morph-many/05-rules.md)
- [Polymorphic-Orphan-Detection](../polymorphic-morph-one-morph-many/05-rules.md)

### Related Skills
- Configure polymorphic MorphToMany with morph map and cascading

### Success Criteria
- `$parent->child` returns correct model(s) with correct types
- `$child->parent` resolves the correct parent regardless of type
- Morph map prevents FQCN issues
- Composite index enables performant queries
- Deleting parent cascades to children via events
- Scheduled cleanup detects and removes orphans

---

## Skill: Query and eager load polymorphic relationships efficiently

### Purpose
Eager-load polymorphic relationships (MorphTo) and query polymorphic child tables with proper type-based filtering.

### When To Use
- Displaying polymorphic children alongside their parent models
- Querying all children regardless of parent type
- Querying children for a specific parent type only
- Eager loading mixed parent types efficiently

### Prerequisites
- Defined polymorphic relationships with morph map

### Inputs
- Relationship names for eager loading
- Parent type values for filtering

### Workflow
1. For eager loading from child to parent: `Image::with('imageable')->get()`
2. For eager loading from parent to child: `Post::with('images')->get()`
3. For querying children by parent type: `Image::where('imageable_type', (new Post)->getMorphClass())->get()`
4. Be aware that `MorphTo` with mixed parent types fires N queries (one per unique type)
5. Use `whereHasMorph()` for filtering parents by polymorphic child conditions (Laravel 8+)

### Validation Checklist
- [ ] Eager loading with mixed parent types executes correct number of queries
- [ ] Querying by specific parent type works correctly
- [ ] `with('morphTo')` loads all parent types in correct number of queries
- [ ] No N+1 for same-type parent collections

### Common Failures
- Assuming polymorphic eager loading is 1 query — it's N queries (one per unique parent type)
- Forgetting to use `getMorphClass()` for type comparison
- Missing composite index causing slow type-filtered queries

### Performance Considerations
- Eager loading MorphTo fires one query per unique parent type
- Composite index on `(morph_id, morph_type)` is essential
- Filtering by type adds a string comparison cost

### Security Considerations
- Ensure morph type comparisons use `getMorphClass()` not hardcoded strings
- Don't expose internal class names through filtering

### Related Rules
- [Polymorphic-Composite-Index](../polymorphic-morph-one-morph-many/05-rules.md)

### Related Skills
- Configure MorphOne/MorphMany with morph map and cascade cleanup

### Success Criteria
- Eager loading produces correct number of queries
- Type-filtered queries return correct results
- No N+1 when iterating children from same parent type
