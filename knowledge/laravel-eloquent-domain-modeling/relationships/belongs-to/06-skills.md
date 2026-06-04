# BelongsTo Skills

## Skill: Configure a BelongsTo relationship with foreign key conventions

### Purpose
Define a child-to-parent BelongsTo relationship with correct foreign key placement, indexing, cascade deletes, and touch propagation.

### When To Use
- Creating a new child model that references a parent via a foreign key (Post belongsTo User)
- Setting up optional (nullable) parent relationships
- Defining self-referential hierarchies (Comment belongsTo Comment via `parent_id`)

### When NOT To Use
- The foreign key is on the related model's table (use HasOne/HasMany instead)
- Many-to-many relationship (use BelongsToMany)
- Variable parent type (use MorphTo)

### Prerequisites
- Two Eloquent models where the child's table has the foreign key column
- Migration with the foreign key column

### Inputs
- Parent model class
- Foreign key column name (defaults to `snake_case` of parent basename + `_id`)
- Local key on parent (defaults to `id`)
- Relationship method name on child model

### Workflow
1. Create the foreign key column in the child's migration: `$table->foreignId('user_id')`
2. Chain `->constrained()->cascadeOnDelete()->index()` on the foreign key
3. On the child model, define the relationship method returning `$this->belongsTo(Parent::class)`
4. For non-conventional keys, specify custom FK and local key: `belongsTo(User::class, 'author_id', 'id')`
5. For nullable parents, use nullable FK: `$table->foreignId('user_id')->nullable()->constrained()->nullOnDelete()`
6. Optionally define `$touches = ['parent_relation']` on the child to update parent's `updated_at` on child changes
7. Define the inverse `HasMany`/`HasOne` on the parent for bidirectional access

### Validation Checklist
- [ ] Foreign key column exists on child's table
- [ ] `BelongsTo` defined on the model that holds the FK (not the parent)
- [ ] Foreign key has `->index()` for join/where performance
- [ ] Foreign key has `->cascadeOnDelete()` for required relationships
- [ ] Inverse `HasMany`/`HasOne` defined on the parent model
- [ ] `$touches` defined on child if parent timestamps should reflect child changes
- [ ] Nullable FKs handled with nullsafe operator or `withDefault()`

### Common Failures
- Defining BelongsTo on the parent model instead of the child (wrong direction)
- Missing `save()` after `associate()` — FK change only in memory
- Missing cascade on delete — orphaned child records
- Missing index on FK — slow eager loading

### Decision Points
- **Required or optional?** — Use `constrained()->cascadeOnDelete()` for required; use `nullable()->constrained()->nullOnDelete()` for optional
- **Default or custom FK name?** — Stick with defaults (`parent_id`) unless legacy schema demands otherwise

### Performance Considerations
- Eager loading uses `WHERE id IN (...child_foreign_keys)` — efficient with PK index
- Direct FK access (`$post->user_id`) is zero-query — prefer in authorization
- Index the FK column on the child table for joins and WHERE clauses

### Security Considerations
- Validate parent existence: `'user_id' => 'required|exists:users,id'`
- Foreign key must be `$fillable` if set via mass assignment
- Use nullsafe `$post->author?->name` for nullable FKs

### Related Rules
- [FK-BelongsTo-Direction](../belongs-to/05-rules.md)
- [Index-Foreign-Key-Column](../belongs-to/05-rules.md)
- [Cascade-On-Delete](../belongs-to/05-rules.md)
- [Touches-On-Child](../belongs-to/05-rules.md)
- [Inverse-Relationship-Definition](../belongs-to/05-rules.md)
- [Nullsafe-Nullable-BelongsTo](../belongs-to/05-rules.md)

### Related Skills
- Create child records through parent relationship
- Authorize access using direct foreign key checks

### Success Criteria
- `$child->parent` returns a single model instance or null
- Deleting parent cascades to children via DB constraint
- `$child->touch()` propagates to parent via `$touches`
- Bidirectional navigation works (parent→children and child→parent)
- Foreign key column is indexed

---

## Skill: Create child records through parent relationship

### Purpose
Create new child records that automatically receive the correct foreign key using the parent's relationship method.

### When To Use
- Creating a new child record that belongs to an existing parent
- Batch-creating children for a parent
- Ensuring FK is never omitted during creation

### When NOT To Use
- Creating records without a parent relationship (use model factory or direct `::create`)
- When the FK value comes from a source other than the parent model

### Prerequisites
- Parent model with `HasMany` or `HasOne` relationship defined
- Child model with `BelongsTo` relationship defined

### Inputs
- Parent model instance
- Child attributes array (without the FK — it's auto-assigned)
- Number of children to create (for `createMany()`)

### Workflow
1. Call `$parent->children()->create($attributes)` instead of `Child::create($attributes + ['parent_id' => $parent->id])`
2. For multiple records, use `$parent->children()->createMany([...])`
3. For one-shot create-and-save, use `$parent->children()->save($childInstance)`
4. The FK is auto-assigned from the parent's primary key

### Validation Checklist
- [ ] Child records are created without explicitly setting the FK
- [ ] FK is correctly set to the parent's ID
- [ ] Multiple children created with `createMany()` in one query
- [ ] Created children are accessible via the parent's relationship

### Common Failures
- Explicitly setting FK via mass assignment but forgetting to `$fillable` it
- Creating via `Child::create()` and forgetting the FK — orphaned record
- Using `create()` on a nullable relationship without handling the FK

### Decision Points
- **create() vs save()?** — Use `create()` with an attributes array; use `save()` when you already have a model instance
- **createMany() vs loop?** — Prefer `createMany()` for batch creation — single query

### Performance Considerations
- `createMany()` generates one INSERT with multiple value rows
- No performance difference for single-record creation

### Security Considerations
- Validate child attributes before creating
- The auto-assigned FK is trusted (comes from the parent model, not user input)

### Related Rules
- [Create-Through-Relationship](../belongs-to/05-rules.md)

### Related Skills
- Configure a BelongsTo relationship with foreign key conventions

### Success Criteria
- Child created with correct FK automatically
- No orphaned records
- Single query for single creation, single query for batch

---

## Skill: Authorize access using direct foreign key checks

### Purpose
Use zero-query foreign key comparisons to authorize user access to child resources without loading the parent model.

### When To Use
- Authorization gates or policies checking ownership
- Middleware or form request ownership validation
- Blade directives for conditional rendering

### When NOT To Use
- When the entire relationship is already eager-loaded (use the loaded model)
- When authorization logic extends beyond ownership (load the relationship)

### Prerequisites
- Child model with FK column pointing to parent (e.g., `user_id`)
- Authenticated user or user model instance

### Inputs
- Child model instance (with FK value)
- User ID to compare against

### Workflow
1. Access the FK column directly: `$post->user_id`
2. Compare against the auth ID: `$post->user_id === auth()->id()`
3. For Gate definitions: `Gate::define('update-post', fn($user, $post) => $post->user_id === $user->id)`
4. For optional owners, handle null FK: `$post->user_id && $post->user_id === $user->id`

### Validation Checklist
- [ ] FK column accessed directly, not through relationship
- [ ] Comparison works without loading the parent model
- [ ] Null FKs are handled without causing errors
- [ ] Authorization returns boolean as expected

### Common Failures
- Loading the entire parent model just to check the ID
- Forgetting to handle nullable FK — calling `$post->user_id` on null returns null

### Decision Points
- **Direct FK vs relationship?** — Always prefer direct FK for simple ownership checks; use relationship when you need parent attributes beyond the ID

### Performance Considerations
- Zero-query — no database call needed
- Critical for list pages (N+1 prevention for authorization)

### Security Considerations
- Direct FK access cannot lie — it reads the raw column value
- No risk of relationship caching issues

### Related Rules
- [Prefer-Direct-FK-For-Auth](../belongs-to/05-rules.md)

### Related Skills
- Configure a BelongsTo relationship with foreign key conventions

### Success Criteria
- Authorization works without loading parent model from database
- Nullable FKs don't cause crashes
- Gate/policy passes for owners and fails for non-owners
