# Morph Pivot Skills

## Skill: Configure morph pivot table with proper indexing and morph map

### Purpose
Create a polymorphic many-to-many pivot table with proper composite indexing, morph map registration, and cascade cleanup for relationships like tagging, favoriting, or categorizing multiple entity types.

### When To Use
- Universal tagging: one tag system for Posts, Videos, and Products
- Polymorphic favorites/bookmarks where users can favorite any entity type
- Categories/labels that span multiple entity types

### When NOT To Use
- Non-polymorphic many-to-many (use `BelongsToMany` with regular pivot)
- When foreign key constraints are required on polymorphic columns
- When the pivot needs different columns per parent type

### Prerequisites
- Related model (e.g., Tag) and multiple parent models to associate
- Morph map registered in `AppServiceProvider::boot()`

### Inputs
- Morph name string (e.g., 'taggable')
- Related model class (e.g., Tag::class)
- Pivot migration definition

### Workflow
1. Register morph map in `AppServiceProvider::boot()`:
   ```php
   Relation::morphMap(['post' => Post::class, 'video' => Video::class]);
   Relation::enforceMorphMap();
   ```
2. Create pivot migration with `$table->morphs('taggable')` and `foreignIdFor(Tag::class)`
3. Add composite primary key on `(taggable_type, taggable_id, tag_id)`
4. Add `->cascadeOnDelete()` on the related model's FK (`tag_id`)
5. Add application-level cascade cleanup via `deleting` events on parent models
6. On parent models, define `morphToMany(Tag::class, 'taggable')`
7. On the shared model, define `morphedByMany(Parent::class, 'taggable')` — using the same morph name
8. Ensure the same morph name is used on all relationships

### Validation Checklist
- [ ] Morph map is registered and enforced in production
- [ ] Composite primary key on `(type, id, related_id)` exists
- [ ] `morphToMany()` and `morphedByMany()` use the same morph name
- [ ] `deleting` events on parent models call `$parent->tags()->detach()`
- [ ] Related model FK has `cascadeOnDelete()`
- [ ] Eager loading produces correct type-constrained queries

### Common Failures
- Not registering morph map — FQCNs stored in type column break on rename
- Mismatched morph names between `morphToMany()` and `morphedByMany()` — empty relationships
- No cascade cleanup — orphaned pivot rows accumulate (no FK constraint on polymorphic columns)
- Extending `Pivot` instead of `MorphPivot` for custom pivot models

### Decision Points
- **Morph alias or FQCN?** — Always use morph aliases via `Relation::morphMap()`; never rely on FQCNs
- **Cascade cleanup method?** — Use `deleting` events for guaranteed cleanup; add scheduled job for orphan detection as backup

### Performance Considerations
- Composite index on `(type, id, related_id)` is mandatory — queries filter on type first
- String `_type` comparison is slightly slower than integer FK — use short morph aliases
- No FK constraint possible — orphaned rows accumulate without cleanup
- Eager loading constrains on type, generating one query per parent type

### Security Considerations
- Validate that `*_type` values are in morph map before allowing writes
- Never accept arbitrary class names from user input as morph type
- `Relation::enforceMorphMap()` rejects invalid types automatically

### Related Rules
- [MorphPivot-Register-MorphMap](../morph-pivot/05-rules.md)
- [MorphPivot-Composite-Index](../morph-pivot/05-rules.md)
- [MorphPivot-Cascade-Cleanup-AppLevel](../morph-pivot/05-rules.md)
- [MorphPivot-MorphName-Consistency](../morph-pivot/05-rules.md)
- [MorphPivot-Orphan-Detection](../morph-pivot/05-rules.md)
- [MorphPivot-Validate-Type-Input](../morph-pivot/05-rules.md)

### Related Skills
- Create custom morph pivot models for polymorphic many-to-many

### Success Criteria
- `$post->tags` returns correct tags for the post
- `$tag->posts` returns correct posts for the tag
- Composite index ensures performant queries
- Morph map prevents FQCN issues
- Deleting a parent cascades to pivot rows

---

## Skill: Create custom morph pivot models for polymorphic many-to-many

### Purpose
Create custom pivot models that extend `MorphPivot` (not `Pivot`) to add casting, accessors, and behavior to polymorphic many-to-many pivot data.

### When To Use
- Polymorphic pivot tables with extra columns needing type casting
- Computed attributes on polymorphic pivot data
- Domain logic on polymorphic pivot relationships

### When NOT To Use
- Simple polymorphic pivots with only foreign keys
- Non-polymorphic pivots (extend `Pivot` instead)
- When casting isn't needed on pivot attributes

### Prerequisites
- Polymorphic pivot table with extra columns
- Morph map registered and enforced

### Inputs
- Custom pivot class extending `MorphPivot`
- Casts and accessor definitions
- `->using()` registration on the relationship

### Workflow
1. Create a class extending `Illuminate\Database\Eloquent\Relations\MorphPivot` (NOT `Pivot`)
2. Configure `$casts` for pivot columns
3. Add accessors and domain methods
4. Register with `->using(CustomPivot::class)` on `morphToMany()`
5. Register on both sides (parent and shared model)

### Validation Checklist
- [ ] Custom morph pivot extends `MorphPivot` (not `Pivot`)
- [ ] `->using()` is registered on both sides of the relationship
- [ ] Casts and accessors work correctly on pivot data
- [ ] `delete()` and `save()` respect the morph type constraint

### Common Failures
- Extending `Pivot` instead of `MorphPivot` — `delete()` and `save()` ignore morph type, corrupting data
- Not registering `->using()` consistently on both sides
- Missing `Relation::enforceMorphMap()` — FQCNs in type column

### Decision Points
- **MorphPivot or Pivot?** — Always use `MorphPivot` for polymorphic pivots; `Pivot` is incorrect

### Performance Considerations
- Custom pivot models add no query overhead — SQL is identical
- Casts and accessors add serialization cost

### Security Considerations
- `MorphPivot` ensures type constraint on writes — prevents cross-type data corruption
- `$casts` apply to serialized output — be mindful of data exposure

### Related Rules
- [MorphPivot-Extend-MorphPivot-Not-Pivot](../morph-pivot/05-rules.md)

### Related Skills
- Configure morph pivot table with proper indexing and morph map

### Success Criteria
- Custom morph pivot methods work via `$model->relation->pivot->methodName()`
- Casts correctly convert pivot column types
- `delete()` and `save()` respect morph type constraint
