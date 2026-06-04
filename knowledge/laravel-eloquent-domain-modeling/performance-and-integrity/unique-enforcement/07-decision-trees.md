# Decision Trees: Unique Enforcement

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Unique Enforcement |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Find-or-create method selection (concurrent context) | Primary |
| 2 | Unique constraint verification for createOrFirst | Architecture |
| 3 | Soft-delete handling in uniqueness | Architecture |

---

## Decision 1: Find-or-Create Method Selection (Concurrent Context)

### Context
`createOrFirst()` and `firstOrCreate()` both find or create records. `firstOrCreate()` has a race window — two concurrent SELECTs both see "no record" and both INSERT. `createOrFirst()` inserts first and catches the violation. The choice depends entirely on concurrency guarantees.

### Criteria
- Can the code path execute concurrently (web request, job, event listener)?
- Is there explicit serialization control (mutex, single-worker queue)?
- Is the code in a serial context (artisan command, seed)?
- Is `createOrFirst()` available (Laravel 10.20+)?

### Decision Tree
```
Can the code path execute concurrently?
├── YES (controllers, event listeners, queue jobs, web requests)
│   └── Is Laravel >= 10.20?
│       ├── YES → Use createOrFirst() (race-safe by design)
│       │   └── Is there a unique constraint on attributes?
│       │       ├── YES → Proceed
│       │       └── NO → Add unique constraint migration first
│       └── NO → Use firstOrCreate() with lockForUpdate() inside transaction
└── NO (artisan commands, database seeds, explicit serial)
    └── Use firstOrCreate() (simpler, no race concern)
        └── Is the serial guarantee documented?
            ├── YES → Proceed
            └── NO → Add comment documenting serial assumption
```

### Rationale
`firstOrCreate()` has a race window: SELECT checks existence, then INSERT creates. Two concurrent requests both pass the SELECT (no record exists) and both INSERT — producing duplicate records. `createOrFirst()` eliminates the window by attempting INSERT first; if a unique constraint violation occurs, it falls back to SELECT. The database constraint provides atomic collision detection.

### Recommended Default
`createOrFirst()` for all controllers, event listeners, and queue jobs. `firstOrCreate()` only for artisan commands, seeds, and explicitly documented serial contexts.

### Risks
- `createOrFirst()` without unique constraint: silently creates duplicates
- `firstOrCreate()` assumed serial without guarantee: duplicates under future refactoring
- `updateOrCreate()` assumed safe: same race condition as `firstOrCreate()`
- `lockForUpdate()` without transaction: lock released immediately, zero protection

### Related Rules/Skills
- Default to createOrFirst for Concurrent Paths (05-rules.md)
- Always Pair createOrFirst with a Unique Constraint (05-rules.md)
- Use firstOrCreate Only in Strictly Serial Contexts (05-rules.md)

---

## Decision 2: Unique Constraint Verification for createOrFirst

### Context
`createOrFirst()` is only as safe as the database constraint it relies on. Without a unique index on the `$attributes` columns, both concurrent INSERTs succeed and duplicates are created silently. The constraint must be verified before deployment.

### Criteria
- Does a database unique index exist on `$attributes` columns?
- Is the constraint visible in the migration file?
- Are there any soft-delete considerations?
- Could existing data violate the constraint?

### Decision Tree
```
Does a unique index exist on the $attributes columns?
├── YES
│   └── Is the index a composite (multiple columns)?
│       ├── YES → Verify the column order matches @attributes order
│       └── NO → Single-column unique is sufficient
├── NO — constraint must be added
│   └── Does the table already have data?
│       ├── YES
│       │   └── Any existing duplicates?
│       │       ├── YES → Clean duplicates first, then add constraint
│       │       └── NO → Add constraint in next migration
│       └── NO → Add constraint in table creation migration
└── NOT SURE → Audit migration files to verify
    └── Is the constraint visible?
        ├── YES → Document the verified constraint
        └── NO → Add missing constraint in new migration
```

### Rationale
`createOrFirst()` catches `UniqueConstraintViolationException` thrown by the database when a duplicate INSERT occurs. Without a unique index, the database does not throw — both INSERTs succeed. The constraint is the actual safety mechanism; the method is just the code path that handles the violation gracefully.

### Recommended Default
Always verify the unique constraint in the migration file before deploying `createOrFirst()`. Add the constraint in the same migration batch if missing. Never deploy `createOrFirst()` without an explicit constraint audit.

### Risks
- Missing constraint: duplicates created silently despite using `createOrFirst()`
- Composite constraint with wrong column order: may not protect all duplicate paths
- Existing data violates the constraint: migration fails — must clean data first
- Partial unique index (PostgreSQL): may not cover all desired uniqueness cases

### Related Rules/Skills
- Always Pair createOrFirst with a Unique Constraint (05-rules.md)
- Handle Soft-Deleted Records Explicitly (05-rules.md)
- Implement Atomic Bulk Upsert Operations (06-skills.md)

---

## Decision 3: Soft-Delete Handling in Uniqueness

### Context
`firstOrCreate()` and `createOrFirst()` query all rows including soft-deleted ones. If the unique constraint covers all rows, attempting to create a new record with a previously-used unique value will match the deleted record. The handling depends on whether the application should allow re-use of unique values after deletion.

### Criteria
- Does the model use `SoftDeletes`?
- Should deleted records block re-creation of the same unique value?
- Is the unique constraint scoped to active records only?
- Does the application provide feedback about returning a deleted record?

### Decision Tree
```
Does the model use SoftDeletes?
├── YES
│   └── Should uniqueness span deleted and active records?
│       ├── YES (block re-registration)
│       │   └── Standard unique constraint across all rows
│       │       └── User gets back trashed model — handle explicitly
│       └── NO (allow re-registration with same value)
│           └── Use ->whereNull('deleted_at') before find-or-create
│               └── Is the unique constraint also scoped?
│                   ├── YES (PostgreSQL partial unique index) → Fully consistent
│                   └── NO → Risk: constraint blocks but query doesn't find
└── NO → No soft-delete concern
    └── Standard find-or-create logic
```

### Rationale
If the unique constraint covers all rows (including soft-deleted), `createOrFirst(['email' => $email])` on a previously-used email returns the soft-deleted model. The application then holds a "trashed" model — subsequent operations may fail because `$model->trashed()` is true. Adding `->whereNull('deleted_at')` excludes deleted records from the match, but for full consistency, the unique constraint should also be scoped.

### Recommended Default
Exclude soft-deleted records from both the query and the unique constraint. Use `->whereNull('deleted_at')` in queries and, for PostgreSQL, a partial unique index with `WHERE deleted_at IS NULL`.

### Risks
- `->whereNull('deleted_at')` without scoped constraint: constraint blocks INSERT but query doesn't find record, causing exception loop
- Returning trashed model without checking: stale data processed as active
- Scoped constraint with NULL `deleted_at`: multiple NULL values may be allowed (MySQL treats NULL as non-unique)

### Related Rules/Skills
- Handle Soft-Deleted Records Explicitly (05-rules.md)
- Default to createOrFirst for Concurrent Paths (05-rules.md)
- Define Database Constraints for Referential Integrity (06-skills.md)
