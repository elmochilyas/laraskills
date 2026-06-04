# BelongsToMany Skills

## Skill: Configure a BelongsToMany relationship with pivot table migration

### Purpose
Set up a many-to-many relationship between two models with proper pivot table conventions, unique constraints, and cascade deletes.

### When To Use
- Creating a new many-to-many relationship (User ↔ Role, Post ↔ Tag)
- Adding extra pivot columns beyond foreign keys
- Setting up pivot timestamps

### When NOT To Use
- One-to-many relationships (use HasMany + BelongsTo)
- Polymorphic many-to-many (use MorphToMany)
- Pivot table that needs to be a full domain entity

### Prerequisites
- Two existing Eloquent models
- A new pivot table migration

### Inputs
- Parent model class name
- Related model class name
- Extra pivot column definitions (optional)
- Custom pivot model class (optional)

### Workflow
1. Generate the pivot migration with singular model names in alphabetical order: `role_user` not `users_roles`
2. Add composite primary key on both foreign key columns to prevent duplicates
3. Chain `->cascadeOnDelete()` on both foreign key constraints
4. Add individual indexes on each foreign key for single-direction queries
5. Add any extra columns (expires_at, level, etc.)
6. Call `->withTimestamps()` if pivot timestamps are needed
7. On both models, define `belongsToMany()` with the same table name
8. Chain `->withPivot('col1', 'col2')` to whitelist extra columns
9. Chain `->as('customName')` for clear pivot accessor naming
10. If the pivot has behavior, create a custom pivot model extending `Pivot` and chain `->using(CustomPivot::class)`

### Validation Checklist
- [ ] Pivot table uses composite primary key on both FKs (`$table->primary(['role_id', 'user_id'])`)
- [ ] Both foreign keys have `->cascadeOnDelete()`
- [ ] Both models define `belongsToMany()` for bidirectional access
- [ ] Extra pivot columns are whitelisted via `->withPivot()`
- [ ] Custom pivot accessor name is set via `->as()` when model has multiple BelongsToMany relationships
- [ ] Both foreign keys have individual indexes for single-direction queries
- [ ] `sync()` validates IDs exist before passing to the method

### Common Failures
- Missing composite unique constraint allows duplicate pivot rows
- Missing `->withPivot()` causes silent null returns on extra columns
- Missing the inverse `belongsToMany()` breaks reverse navigation
- Missing `->cascadeOnDelete()` leaves orphaned pivot rows

### Decision Points
- **Composite PK or auto-increment + unique?** — Use composite PK (not auto-increment) for standard many-to-many; only use auto-increment if the pivot is a domain entity
- **withPivot() or using()?** — Use `withPivot()` for simple column access; use `using()` (custom pivot model) when the pivot has behavior, events, or complex casting

### Performance Considerations
- Composite unique index serves as covering index for two-column lookups
- Add individual indexes on each FK for single-direction queries
- `sync()` computes diff via SELECT then INSERT/DELETE — wraps in transaction automatically
- For massive pivot tables (>1M rows), consider chunked sync or direct query

### Security Considerations
- Validate that IDs passed to `sync()`/`attach()` reference real records: `'role_ids.*' => 'exists:roles,id'`
- Sanitize user input before passing to `sync()` — never pass raw request arrays
- Pivot data should be validated separately from model data

### Related Rules
- [Composite-Unique-Pivot](../belongs-to-many/05-rules.md)
- [Pivot-WithPivot-Whitelist](../belongs-to-many/05-rules.md)
- [Pivot-Cascade-On-Delete](../belongs-to-many/05-rules.md)
- [Both-Sides-BelongsToMany](../belongs-to-many/05-rules.md)
- [Pivot-As-Custom-Name](../belongs-to-many/05-rules.md)
- [Pivot-Column-Indexing](../belongs-to-many/05-rules.md)
- [Validate-Pivot-Input](../belongs-to-many/05-rules.md)

### Related Skills
- Configure and manage pivot table conventions
- Read and display many-to-many relationships

### Success Criteria
- Composite primary key prevents duplicate pivot rows
- Both models can navigate the relationship bidirectionally
- Extra pivot columns are accessible via `$model->relation->pivot->column`
- Deleting a parent cascades to pivot rows
- IDs are validated before being attached

---

## Skill: Sync pivot records with proper validation

### Purpose
Atomically update many-to-many pivot records using `sync()` with validated input, choosing the right sync variant for the operation.

### When To Use
- Setting a complete set of related model IDs (replacement)
- Adding new relationships without removing existing ones
- Toggling relationship existence
- Performing bulk attach/detach operations

### When NOT To Use
- Single relationship assignment to an existing record (use `attach()`)
- When each pivot row needs different extra attributes that arrays can't express
- When operating on individual pivot rows in a loop

### Prerequisites
- Defined `BelongsToMany` relationship on both models
- Validated input array of related model IDs

### Inputs
- Related model IDs (array from request, service, or computation)
- Extra pivot attributes (optional, per-relationship or per-ID)

### Workflow
1. Validate that all input IDs reference real records: `'ids' => 'required|array', 'ids.*' => 'exists:related_table,id'`
2. Choose the correct sync variant:
   - `sync($ids)` — full replacement (removes IDs not in array)
   - `syncWithoutDetaching($ids)` — additive only (keeps existing)
   - `toggle($ids)` — toggles each ID (attach if absent, detach if present)
3. Pass extra pivot attributes as associative array: `sync([1 => ['expires_at' => now()], 2, 3])`
4. For custom pivot models, ensure the pivot model has fillable attributes for the extra data

### Validation Checklist
- [ ] Input IDs validated with `exists` rule before sync
- [ ] Correct sync variant chosen (sync vs syncWithoutDetaching vs toggle)
- [ ] Extra pivot attributes are whitelisted via `withPivot()`
- [ ] Sync is not called inside a loop

### Common Failures
- `sync()` removes existing IDs unintentionally — use `syncWithoutDetaching()` for additive operations
- Passing unvalidated user input creates phantom pivot rows
- Loop calling `sync()` for each parent instead of batching

### Decision Points
- **sync vs syncWithoutDetaching?** — Use `sync()` when the input represents the complete desired set; use `syncWithoutDetaching()` when only adding new relationships
- **attach/detach vs sync?** — Use `sync()` for atomic bulk operations; use `attach()`/`detach()` for single-record operations

### Performance Considerations
- `sync()` computes diff in a single SELECT query
- For large pivot updates, wrap multiple sync calls in a database transaction
- `detach()` generates a single DELETE query — efficient with proper indexing

### Security Considerations
- Always validate IDs — never pass `$request->input('role_ids')` directly to `sync()`
- Pivot attribute values should be validated separately

### Related Rules
- [Sync-Not-Loop-Attach](../belongs-to-many/05-rules.md)
- [SyncWithoutDetaching-For-Additive](../belongs-to-many/05-rules.md)
- [Validate-Pivot-Input](../belongs-to-many/05-rules.md)

### Related Skills
- Configure a BelongsToMany relationship with pivot table migration

### Success Criteria
- Pivot set is atomically updated to match the desired state
- No unintended removals or phantom pivot rows
- Extra pivot attributes correctly set per pivot row
- Input validation prevents invalid ID injection

---

## Skill: Read and display many-to-many relationships with pivot data

### Purpose
Eagerly load BelongsToMany relationships and access pivot attributes in views, APIs, and collections.

### When To Use
- Displaying related models in views (user's roles, post's tags)
- Accessing pivot metadata (expires_at, quantity, level)
- Filtering pivot data in queries (Laravel 10+ `wherePivot`)

### When NOT To Use
- When only a count is needed (use `withCount()`)
- When the pivot table has no extra columns beyond FKs

### Prerequisites
- Defined `BelongsToMany` relationship with pivot column whitelisting
- Eager loading setup

### Inputs
- Parent model instances or collection
- Relationship name string
- Pivot column names to access

### Workflow
1. Eager load with `->with('relation')` to avoid N+1
2. Access related collection via `$parent->relation` — returns Collection
3. Access pivot data on each related model via the pivot accessor
4. Use custom accessor name from `->as()`: `$role->membership->expires_at`
5. Filter pivot rows using `wherePivot()` (Laravel 10+): `$user->roles()->wherePivot('expires_at', '>=', now())->get()`
6. Order by pivot columns: `->orderBy('pivot_sort_order')`

### Validation Checklist
- [ ] Extra pivot columns whitelisted via `->withPivot()` on the relationship definition
- [ ] Eager loading used to prevent N+1
- [ ] Custom pivot accessor name used when model has multiple BelongsToMany relations
- [ ] Pivot data accessed via correct accessor name

### Common Failures
- Accessing `$role->pivot->column` without `withPivot('column')` returns null
- N+1 when accessing `$role->pivot->customColumn` in a loop without eager loading
- Accessing `pivot` property when `->as('name')` renamed the accessor

### Decision Points
- **Eager load or lazy load?** — Always eager load with `with()` when pivot data is accessed in a loop
- **wherePivot or collection filter?** — Use `wherePivot()` at query level (Laravel 10+) for database-level filtering; filter collection in PHP when already loaded

### Performance Considerations
- Eager loading BelongsToMany uses a join query — with 5+ such relationships, query volume multiplies
- Use `select()` inside constraint closures to reduce pivot column transfer

### Security Considerations
- Extra pivot columns exposed in API responses require explicit whitelisting via `withPivot()`

### Related Rules
- [Pivot-WithPivot-Whitelist](../belongs-to-many/05-rules.md)
- [Pivot-As-Custom-Name](../belongs-to-many/05-rules.md)

### Related Skills
- Configure a BelongsToMany relationship with pivot table migration
- Sync pivot records with proper validation

### Success Criteria
- Related models are available as a Collection on the parent
- Pivot data is correctly read from the accessor
- No N+1 queries occur
- Custom pivot naming provides readable code
