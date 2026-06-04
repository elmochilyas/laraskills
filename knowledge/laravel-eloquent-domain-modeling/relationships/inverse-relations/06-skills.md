# Inverse Relations Skills

## Skill: Configure inverse relations for in-memory bidirectional consistency

### Purpose
Apply the `SupportsInverseRelations` trait to ensure related model instances are synchronized in memory after `associate()`, `dissociate()`, and `save()` operations.

### When To Use
- Laravel 11+ projects where relationship consistency after writes is important
- Queue jobs and long-running processes where model instances persist
- Tests where you read a relationship immediately after writing
- Livewire/Filament applications with frequent AJAX mutations and immediate reads

### When NOT To Use
- Laravel versions below 11 (trait doesn't exist)
- When in-memory consistency is not needed (simple request-response flows)
- On `BelongsToMany` or polymorphic relationships (not supported)

### Prerequisites
- Laravel 11+ project
- BelongsTo, HasOne, or HasMany relationship

### Inputs
- Models that participate in bidirectional relationships
- Relationship names for `->inverse()` declarations

### Workflow
1. Verify `composer.json` requires Laravel `^11.0`
2. Add `use Illuminate\Database\Eloquent\Relations\Concerns\SupportsInverseRelations;` to the parent model
3. Add the same `use` statement to the child model for full bidirectional sync
4. If the inferred relationship name might be wrong, chain `->inverse('explicit_name')` on the relationship
5. Test that `associate()` + `save()` updates the inverse relation in memory

### Validation Checklist
- [ ] `SupportsInverseRelations` trait is added to both parent and child models
- [ ] `->inverse('name')` is specified explicitly when convention may be wrong
- [ ] `associate()` + `save()` updates the inverse relation in memory
- [ ] `dissociate()` clears the inverse relation in memory
- [ ] `save()` on HasMany correctly updates the inverse
- [ ] Laravel version is ^11.0
- [ ] Not applied to BelongsToMany or polymorphic relationships

### Common Failures
- Adding trait to only one side — partial consistency
- Not using `->inverse()` when convention guesses wrong — inverse silently not set
- Using on Laravel 10 or below — class not found error
- Applying to BelongsToMany — throws exception
- Relying on inverse for database sync — in-memory only

### Decision Points
- **Explicit inverse or convention?** — Use explicit `->inverse('name')` when the relationship name differs from the model's snake_case; rely on convention for standard naming
- **Both sides or one side?** — Add trait to both sides for full bidirectional sync; single side if only one direction matters

### Performance Considerations
- Inverse update is a `setRelation()` call — no database queries
- Overhead is negligible — method call + array push
- In long-running processes, inverse relations hold references — monitor memory with `unsetRelation()` when done

### Security Considerations
- In-memory only — no security implications for persistence
- No authorization bypass — relationships are already defined on models

### Related Rules
- [Inverse-Both-Sides](../inverse-relations/05-rules.md)
- [Inverse-Explicit-Name](../inverse-relations/05-rules.md)
- [Inverse-Not-DB-Sync](../inverse-relations/05-rules.md)
- [Inverse-Laravel-Version-Check](../inverse-relations/05-rules.md)
- [Inverse-Not-For-BelongsToMany](../inverse-relations/05-rules.md)
- [Inverse-Memory-Awareness](../inverse-relations/05-rules.md)

### Related Skills
- Apply inverse relations in long-running processes

### Success Criteria
- `$parent->posts` includes newly created post after `$parent->posts()->save($post)`
- `$post->user` shows correct parent after `$post->user()->associate($user)`
- Both sides are consistently updated in memory
- Tests verify in-memory consistency
- No `load()` calls needed for consistency within the same request

---

## Skill: Apply inverse relations in long-running processes

### Purpose
Use `SupportsInverseRelations` in queue jobs and CLI commands with awareness of memory management considerations.

### When To Use
- Queue workers processing batches where subsequent operations depend on relationship state
- CLI commands with multi-step workflows that read and write relationships
- Import/export scripts where in-memory consistency reduces query count

### When NOT To Use
- Short-lived web requests where memory is released after response
- Processing millions of models where inverse relation references cause memory issues

### Prerequisites
- Laravel 11+ project with `SupportsInverseRelations` applied

### Inputs
- Model instances in long-running context
- Relationship names to manage

### Workflow
1. Apply the trait as configured for inverse relations
2. In long-running processes, explicitly clear relation references when no longer needed: `$user->unsetRelation('posts')`
3. For batch processing, use fresh model instances per chunk to prevent reference accumulation
4. Monitor memory usage with `memory_get_usage()` before and after batch operations

### Validation Checklist
- [ ] Inverse relations are active and working correctly
- [ ] `unsetRelation()` is called on processed models to free memory
- [ ] Memory usage is stable across batch iterations (not growing unbounded)
- [ ] No stale model references persist after processing

### Common Failures
- Memory leaks in queue workers from accumulated inverse relation references
- Not clearing relations between batch chunks — stale data leaks between iterations
- False expectation that inverse relations persist data — in-memory only

### Decision Points
- **Keep or clear inverse?** — Keep for immediate consistency within the same model set; clear with `unsetRelation()` when moving to the next batch

### Performance Considerations
- Inverse relations hold references — prevent garbage collection of both models
- For large batches, use chunking + unsetRelation per chunk
- Memory impact is proportional to the number of related model pairs held in memory

### Security Considerations
- None — in-memory relationship management doesn't affect persistence

### Related Rules
- [Inverse-Memory-Awareness](../inverse-relations/05-rules.md)

### Related Skills
- Configure inverse relations for in-memory bidirectional consistency

### Success Criteria
- Inverse relations provide in-memory consistency within batch operations
- Memory usage is bounded and stable
- No stale references accumulate across batch chunks
- `unsetRelation()` correctly clears references when needed
