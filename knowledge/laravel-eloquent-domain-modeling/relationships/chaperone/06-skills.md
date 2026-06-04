# Chaperone Skills

## Skill: Apply chaperone for mutation isolation in long-running processes

### Purpose
Prevent cross-parent mutation leakage by cloning related model instances during eager loading in long-running processes.

### When To Use
- Batch processing where you mutate related models temporarily (imports, exports)
- Queue jobs where accumulated mutations cause subtle bugs
- CLI commands where instance state persists across operations
- Long-running processes where identity map sharing is problematic

### When NOT To Use
- Short-lived web requests where identity map sharing is harmless
- When memory efficiency is more critical than mutation isolation
- When relying on identity map reference equality (`===`) checks
- When you expect deep clone isolation (chaperone is shallow only)

### Prerequisites
- Eloquent model with a relationship that shares related model instances across parents
- `SupportsInverseRelations` trait on the model if combining with inverse

### Inputs
- Model class with relationship to chaperone
- Relationship name to apply chaperone to
- Eager loading query (`with()`)

### Workflow
1. Add `use Illuminate\Database\Eloquent\Relations\Concerns\SupportsInverseRelations;` to the model
2. Chain `->chaperone()` on the relationship definition: `public function author(): BelongsTo { return $this->belongsTo(Author::class)->chaperone(); }`
3. Ensure eager loading is used: `Post::with('author.chaperone')->get()` — lazy loading is NOT chaperoned
4. Profile memory usage before and after adding chaperone, especially on high-cardinality relationships
5. For deep clone isolation, manually clone object-typed attributes after loading

### Validation Checklist
- [ ] Chaperoned relationship returns separate instances for each parent (verify via `spl_object_id()`)
- [ ] Mutations to one parent's related model don't affect others
- [ ] Memory usage is measured and acceptable for the dataset size
- [ ] Eager loading is used (not lazy loading or `load()`)
- [ ] Shallow clone behavior is understood — object-typed attributes (Carbon, nested relations) are still shared
- [ ] Chaperone applied only where mutation isolation is specifically needed

### Common Failures
- Applying chaperone "just in case" to all relationships — causes unnecessary memory bloat
- Expecting chaperone to work with lazy loading — only eager loading triggers cloning
- Expecting deep clone isolation — objects (casts, nested relations) are shared by reference
- Using chaperone in short-lived web requests where identity map sharing is fine
- Forgetting to add the `SupportsInverseRelations` trait if combining with `inverse()`

### Decision Points
- **Chaperone or no chaperone?** — Apply only when mutation isolation matters (long-running processes); skip for web requests
- **Chaperone alone or with inverse?** — Combine with `inverse()` when both mutation isolation and bidirectional consistency are required

### Performance Considerations
- Memory usage increases linearly with the number of parents sharing the same related model
- 1,000 posts sharing one author: 1 Author instance without chaperone, 1,000 with chaperone
- Shallow clone is fast (microseconds per model) — memory overhead is the primary concern
- Chaperoning 1:many relationships has the highest memory impact
- Profile with `memory_get_usage()` before and after

### Security Considerations
- Chaperone is a correctness feature, not a security feature
- No authorization implications
- Shallow clone means object-typed casted attributes are still shared by reference

### Related Rules
- [Chaperone-Selective-Only](../chaperone/05-rules.md)
- [Chaperone-Not-In-Web-Requests](../chaperone/05-rules.md)
- [Chaperone-Shallow-Clone-Awareness](../chaperone/05-rules.md)
- [Chaperone-Lazy-Loading-Limitation](../chaperone/05-rules.md)
- [Chaperone-Monitor-Memory](../chaperone/05-rules.md)

### Related Skills
- Combine chaperone with inverse relations

### Success Criteria
- Mutations to one parent's chaperoned relation don't affect other parents
- Memory impact is measured and acceptable
- Chaperone is only applied where mutation isolation is needed
- Team is aware of shallow clone limitations

---

## Skill: Combine chaperone with inverse relations

### Purpose
Apply `chaperone()` and `inverse()` together on the same relationship for full mutation isolation with bidirectional in-memory consistency.

### When To Use
- Long-running processes that both mutate related models and need bidirectional consistency
- Complex import/export scripts where both parent→child and child→parent navigation must stay in sync
- Batch updates where related model state is read back from the inverse side

### When NOT To Use
- When only one concern (isolation or consistency) is relevant
- In web requests where the identity map is acceptable

### Prerequisites
- Model uses `SupportsInverseRelations` trait
- Both `chaperone()` and `inverse()` are available (Laravel 11+)

### Inputs
- Relationship definition on the model
- Inverse relationship name string to pass to `inverse()`

### Workflow
1. Add `SupportsInverseRelations` trait to the model
2. Chain both `->chaperone()->inverse('inverse_relation_name')` on the relationship
3. Verify isolation: mutations to one parent's related model don't affect others
4. Verify consistency: the related model's inverse relationship reflects changes

### Validation Checklist
- [ ] Both `chaperone()` and `inverse()` are chained on the same relationship
- [ ] `SupportsInverseRelations` trait is applied to the model
- [ ] Mutation isolation verified — each parent has its own related model instance
- [ ] Bidirectional consistency verified — related model's inverse reflects parent changes
- [ ] Memory impact is measured and acceptable

### Common Failures
- Using one feature without the other leaves gaps in correctness
- Forgetting the `SupportsInverseRelations` trait causes runtime errors
- Expecting inverse to work with lazy loading — only eager loading triggers both features

### Decision Points
- **Both or one?** — Use both when you need isolation AND consistency; use only `chaperone()` when you only need isolation

### Performance Considerations
- Memory overhead of chaperone + inverse combines — profile carefully
- Inverse adds additional in-memory references but no additional queries

### Security Considerations
- Same as chaperone — correctness feature

### Related Rules
- [Chaperone-Combine-Inverse](../chaperone/05-rules.md)

### Related Skills
- Apply chaperone for mutation isolation in long-running processes
- Configure inverse relations for bidirectional consistency

### Success Criteria
- Full isolation with bidirectional consistency is achieved
- No cross-parent mutation leakage
- In-memory state is consistent in both directions
