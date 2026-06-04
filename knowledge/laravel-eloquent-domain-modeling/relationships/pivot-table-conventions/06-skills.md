# Pivot Table Conventions Skills

## Skill: Create pivot tables with proper naming and composite keys

### Purpose
Create pivot table migrations following Eloquent's naming conventions with composite primary keys for data integrity.

### When To Use
- Every many-to-many relationship between two Eloquent models
- Role-User, Post-Tag, Product-Category associations
- When the relationship needs extra metadata columns on the join table

### When NOT To Use
- One-to-many relationships (use foreign key on child table)
- When the intermediate should be a full model (create a dedicated model)
- Polymorphic many-to-many (use morph pivot pattern)

### Prerequisites
- Two Eloquent models for the many-to-many relationship

### Inputs
- Two model class names (for table name resolution)
- Extra pivot column definitions (optional)
- Timestamp requirement

### Workflow
1. Name the pivot table using singular model names in alphabetical order: `role_user` (Role + User)
2. Use `foreignIdFor(Model::class)->constrained()->cascadeOnDelete()` for each FK
3. Add a composite primary key on both FK columns: `$table->primary(['role_id', 'user_id'])`
4. Add `$table->timestamps()` if pivot timestamps are needed
5. Add individual indexes on each FK for single-direction query performance
6. Add any extra columns needed for pivot metadata
7. On the relationship definition, call `->withTimestamps()` if timestamps were added

### Validation Checklist
- [ ] Pivot table follows alphabetical singular naming convention
- [ ] Composite primary key on both FK columns (not auto-increment ID)
- [ ] `ON DELETE CASCADE` on both foreign keys
- [ ] `->withTimestamps()` called on relationship if pivot has timestamps
- [ ] Extra pivot columns are whitelisted via `->withPivot()`
- [ ] Individual FK indexes added for single-direction queries

### Common Failures
- Auto-increment `id` as primary key without unique constraint on FK pair — duplicate rows
- Wrong table name from non-alphabetical model names
- Plural model names causing incorrect pivot table names
- Forgetting `->withTimestamps()` — timestamps never populated
- Missing cascade delete — orphaned pivot rows accumulate

### Decision Points
- **Composite PK or auto-increment?** — Use composite PK for standard many-to-many; use auto-increment only when pivot is a domain entity
- **Custom table name or convention?** — Use convention (`role_user`) unless the name doesn't fit the domain; use `belongsToMany(Role::class, 'custom_name')` for exceptions

### Performance Considerations
- Composite PK serves as covering index for two-column lookups
- Individual FK indexes help single-direction queries
- Omitting auto-increment `id` saves 4–8 bytes per row at scale

### Security Considerations
- Composite PK prevents duplicate relationship rows at database level
- Validate IDs before attaching — ensure referenced records exist

### Related Rules
- [PivotTable-Singular-Alphabetical-Name](../pivot-table-conventions/05-rules.md)
- [PivotTable-Composite-Primary-Key](../pivot-table-conventions/05-rules.md)
- [PivotTable-Index-Both-Foreign-Keys](../pivot-table-conventions/05-rules.md)
- [PivotTable-Not-For-One-To-Many](../pivot-table-conventions/05-rules.md)
- [PivotTable-Not-For-Domain-Entity](../pivot-table-conventions/05-rules.md)

### Related Skills
- Configure cascade deletes and timestamp sync on pivot tables

### Success Criteria
- Pivot table name follows alphabetical singular convention
- Composite PK prevents duplicate pivot rows
- Cascade deletes clean up pivot rows on parent deletion
- Timestamps are populated correctly
- FK indexes enable fast queries

---

## Skill: Configure cascade deletes and timestamp sync on pivot tables

### Purpose
Ensure pivot tables have proper cascade delete behavior and timestamp synchronization between the migration and the relationship definition.

### When To Use
- Setting up cascade deletes on pivot table foreign keys
- Synchronizing pivot timestamps between migration and relationship
- Configuring `withTimestamps()` on the relationship definition

### Prerequisites
- Pivot table migration with FK columns and optional timestamps

### Inputs
- Pivot migration definition
- Relationship definition in the model

### Workflow
1. In the pivot migration, chain `->cascadeOnDelete()` on each `foreignIdFor()`
2. If timestamps are desired, add `$table->timestamps()` to the migration
3. On the relationship definition in the model, call `->withTimestamps()`
4. Verify that deleting a parent model cascades to pivot rows
5. Verify that `attach()` and `sync()` populate `created_at`/`updated_at`

### Validation Checklist
- [ ] Both foreign keys have `->cascadeOnDelete()`
- [ ] `->withTimestamps()` is called on the relationship when pivot has timestamps
- [ ] Deleting a parent cascades to pivot rows
- [ ] `attach()`/`sync()` correctly populate pivot timestamps
- [ ] Orphaned pivot rows are prevented

### Common Failures
- Missing `cascadeOnDelete()` — orphaned pivot rows accumulate
- Missing `withTimestamps()` — timestamp columns exist but stay null
- Cascade on only one FK — deletion from the other side leaves orphans

### Decision Points
- **DB cascade or event cleanup?** — Prefer DB-level `cascadeOnDelete()` for reliability; use event cleanup only when cascade can't be used

### Performance Considerations
- Cascade deletes are handled at the database level — no application overhead
- Timestamp columns add minimal storage (8 bytes each)

### Security Considerations
- Cascade delete requires careful consideration if pivot data must be preserved for audit

### Related Rules
- [PivotTable-Cascade-On-Delete](../pivot-table-conventions/05-rules.md)
- [PivotTable-WithTimestamps-Sync](../pivot-table-conventions/05-rules.md)

### Related Skills
- Create pivot tables with proper naming and composite keys

### Success Criteria
- Deleting a parent removes all associated pivot rows
- Pivot timestamps are correctly populated during attach/sync
- No orphaned pivot rows from either side of the relationship
