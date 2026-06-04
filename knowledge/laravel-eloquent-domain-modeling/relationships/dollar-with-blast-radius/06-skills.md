# $with Blast Radius Skills

## Skill: Eliminate $with blast radius by migrating to explicit loading

### Purpose
Remove `$with` declarations from widely-used models to prevent hidden, unconditional eager loading that impacts every query across the application.

### When To Use
- Auditing legacy codebases with `$with` on models
- Found `$with` on widely-used models (User, Team, Post, etc.)
- Performance investigation reveals unexpected query counts
- Preparing for batch operations or test suite optimization

### When NOT To Use
- On highly specialized models with narrow usage scope (e.g., a model used only in one subsystem)
- When profiling proves the relationship is needed on 100% of queries

### Prerequisites
- Model with `$with` property defined
- List of all query sites using that model

### Inputs
- Model class with `$with` declarations
- List of consumers (controllers, commands, jobs, tests)

### Workflow
1. Identify all models with `$with` declarations: search for `protected $with =` in the codebase
2. For each model, audit every query site that uses the model
3. At each query site, add explicit `->with('relation')` where the relationship is actually needed
4. Add explicit `->withoutEagerLoads()` or `Model::withoutEagerLoads(function () { ... })` at sites that don't need the relationship (batch jobs, seeders, tests)
5. Remove the `$with` declaration from the model
6. Verify query count per endpoint stays the same or decreases with Laravel Debugbar/Telescope
7. Add CI lint rules to prevent reintroduction of `$with` on widely-used models

### Validation Checklist
- [ ] No widely-used models have `$with` declarations
- [ ] All query sites that need the relationship use explicit `with()`
- [ ] Batch jobs, seeders, and commands use `withoutEagerLoads()`
- [ ] Query count per endpoint is stable (no regression from removal)
- [ ] Test suite runs without `$with` overhead
- [ ] CI lint rules flag `$with` usage on widely-used models

### Common Failures
- Removing `$with` without adding explicit `with()` at query sites — relationship data is missing
- Not auditing all query sites — some consumers lose relationship data silently
- CI lint rules not added — `$with` creeps back in over time
- Using `$with` for convenience on a model that appears in 20+ places

### Decision Points
- **Remove or keep?** — Remove if the model is widely used and the relationship isn't needed on every query; keep only with documented profiling evidence
- **Explicit with or withoutEagerLoads?** — Add explicit `with()` where the relationship is needed; use `withoutEagerLoads()` where it's not

### Performance Considerations
- Removing `$with` eliminates N extra queries per model query (where N = number of `$with` relationships)
- The blast radius multiplies: 1 model × 100 query sites × 2 relationships = 200 eliminated queries
- Test suite speed improves dramatically when `$with` is removed from factory-created models
- Batch jobs see the biggest improvement (memory + query count)

### Security Considerations
- `$with` may load sensitive relationships into every response context — removing it prevents data leaks
- Explicit `with()` is self-documenting — easier to review what relationships are loaded in each context

### Related Rules
- [Avoid-With-On-Widely-Used-Models](../dollar-with-blast-radius/05-rules.md)
- [Prefer-Explicit-With](../dollar-with-blast-radius/05-rules.md)
- [Audit-With-Regularly](../dollar-with-blast-radius/05-rules.md)
- [Add-CI-Lint-For-With](../dollar-with-blast-radius/05-rules.md)

### Related Skills
- Suppress unnecessary eager loading in batch operations

### Success Criteria
- All widely-used models have empty `$with` arrays
- Explicit `with()` calls exist at all query sites that need relationships
- Batch jobs and tests are faster
- CI prevents `$with` regression

---

## Skill: Suppress unnecessary eager loading in batch operations

### Purpose
Use `withoutEagerLoads()` to prevent `$with` relationships from loading in contexts where they are not needed, such as batch jobs, seeders, factories, and Artisan commands.

### When To Use
- Seeding large datasets with factory-generated models
- Queue jobs processing large batches of models
- Artisan commands that don't need relationship data
- Export scripts generating CSV/Excel files
- Test suite base setup

### When NOT To Use
- When the batch operation actually uses the `$with` relationships
- On models without `$with` declarations

### Prerequisites
- Models with `$with` declarations exist in the codebase

### Inputs
- Model class(es) to suppress eager loading for
- Operation to wrap in suppression scope

### Workflow
1. Identify batch operations that don't need `$with` relationships
2. Use `Model::withoutEagerLoads(function () { ... })` to wrap the entire operation
3. For single queries, use `Model::withoutEagerLoads()->where(...)->get()`
4. In test base setup (`TestCase::setUp`), wrap the entire test scope

### Validation Checklist
- [ ] `withoutEagerLoads()` is used in seeders and factories
- [ ] Batch jobs (queue workers, scheduled commands) use `withoutEagerLoads()`
- [ ] Test suite base setup suppresses `$with` overhead
- [ ] No regression in contexts where relationships are actually needed

### Common Failures
- Forgetting to wrap batch jobs — `$with` loads unnecessary relationships for every model
- Not testing that suppressed eager loading doesn't break the operation
- Applying `withoutEagerLoads()` in contexts where relationships ARE needed

### Decision Points
- **Global or per-query suppression?** — Use `Model::withoutEagerLoads(function() { ... })` for scoped blocks; use `Model::query()->withoutEagerLoads()` for individual queries

### Performance Considerations
- Batch jobs can see 5-10× speed improvement when `$with` is suppressed
- Memory usage drops dramatically — especially with large chunk sizes
- Factory-created models in tests don't trigger relationship queries

### Security Considerations
- None — it's an optimization, not a security feature

### Related Rules
- [WithoutEagerLoads-Batch-Operations](../dollar-with-blast-radius/05-rules.md)
- [WithoutEagerLoads-Tests](../dollar-with-blast-radius/05-rules.md)

### Related Skills
- Eliminate $with blast radius by migrating to explicit loading

### Success Criteria
- Batch operations complete faster with suppressed eager loading
- Seeders and factories don't trigger unnecessary relationship queries
- Test suite runs are measurably faster
- No functional regression from suppression
