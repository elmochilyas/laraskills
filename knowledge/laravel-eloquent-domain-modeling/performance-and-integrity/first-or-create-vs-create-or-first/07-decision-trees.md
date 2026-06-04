# Decision Trees: firstOrCreate vs createOrFirst

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | first-or-create-vs-create-or-first |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | firstOrCreate() vs createOrFirst() selection | Primary |
| 2 | createOrFirst() constraint verification | Architecture |
| 3 | Soft-delete handling in find-or-create | Architecture |

---

## Decision 1: firstOrCreate() vs createOrFirst() Selection

### Context
Both methods find a record or create one, but `firstOrCreate()` has a race window: SELECT then INSERT. `createOrFirst()` inserts first and catches unique violations. The wrong choice under concurrency produces duplicate records.

### Criteria
- Can the code path execute concurrently (web request, event listener, job)?
- Is there explicit serialization (mutex, single-worker queue)?
- Is the code in an artisan command or database seed?
- Is `createOrFirst()` available (Laravel 10.20+)?

### Decision Tree
```
Is this code path concurrent-safe (web request, event listener, job)?
├── YES
│   └── Is Laravel >= 10.20?
│       ├── YES → Use createOrFirst()
│       │   └── Is there a unique constraint on match columns?
│       │       ├── YES → Proceed (safe)
│       │       └── NO → Add unique constraint first
│       └── NO → Use firstOrCreate() with lockForUpdate() inside transaction
└── NO (artisan command, database seed, single-worker job)
    └── Use firstOrCreate() (simpler, no concurrent risk)
        └── Has serial execution been documented with a comment?
            ├── YES → Proceed
            └── NO → Add comment documenting serial guarantee
```

### Rationale
Every web request is concurrent unless explicitly serialized. `firstOrCreate()` has a race window between SELECT and INSERT — two concurrent requests can both see "no record" and both INSERT, creating duplicates. `createOrFirst()` eliminates this by INSERTing first; if a unique constraint violation occurs, it catches the exception and SELECTs the existing record. The INSERT-first approach guarantees atomicity.

### Recommended Default
`createOrFirst()` for all controllers, event listeners, and queue jobs. `firstOrCreate()` only for artisan commands, seeds, and documented serial contexts.

### Risks
- `createOrFirst()` without unique constraint: silently creates duplicates
- `createOrFirst()` not available pre-Laravel 10.20: use locking alternative
- `firstOrCreate()` in job without single-worker guarantee: duplicates on retry
- `lockForUpdate()` without transaction: lock released immediately, zero protection

### Related Rules/Skills
- Prefer createOrFirst for Web-Facing Code (05-rules.md)
- Always Add a Unique Constraint Before Using createOrFirst (05-rules.md)
- Use firstOrCreate Only in Documented Serial Contexts (05-rules.md)
- Enforce Uniqueness with Database Constraints and createOrFirst (06-skills.md)

---

## Decision 2: createOrFirst() Constraint Verification

### Context
`createOrFirst()` is only safe when the `$attributes` columns have a database unique constraint. Without it, the INSERT always succeeds and duplicates are created silently. The constraint is the safety mechanism, not the method.

### Criteria
- Does a unique index exist on the `$attributes` columns?
- Has the migration been verified to include the constraint?
- Is the constraint visible in the migration file?
- Are there any conditions that could bypass the constraint (soft deletes, partial indexes)?

### Decision Tree
```
Does a database unique index exist on the $attributes columns?
├── YES
│   └── Does the index cover all columns in $attributes?
│       ├── YES → createOrFirst() is safe (proceed)
│       └── NO → Add missing columns or create composite index
└── NO → MUST add unique constraint before deploying
    └── What is the constraint type?
        ├── Single column → $table->string('email')->unique()
        ├── Composite → $table->unique(['col1', 'col2'])
        └── Partial (PostgreSQL) → $table->unique('email')->where('deleted_at IS NULL')
```

### Rationale
`createOrFirst()` relies on the database throwing `UniqueConstraintViolationException` when a duplicate insert occurs. Without a unique index, the database does not detect duplicates and both INSERTs succeed. The method then returns the newly created record, and the caller has no way to distinguish this from a find — duplicates are invisible.

### Recommended Default
Always verify the unique constraint in the migration file before deploying `createOrFirst()` calls. Add the constraint in the same migration batch if it's missing.

### Risks
- Partial unique index (PostgreSQL) with soft deletes: constraint may not cover all cases
- Composite constraint with wrong column order: may not protect all duplicate paths
- Adding constraint to table with existing duplicates: migration fails — clean data first
- Assuming existing `$unique` validation is enough: application validation is not a database constraint

### Related Rules/Skills
- Always Add a Unique Constraint Before Using createOrFirst (05-rules.md)
- Handle Soft-Deleted Records Explicitly (05-rules.md)
- Default to createOrFirst for Concurrent Paths (05-rules.md)

---

## Decision 3: Soft-Delete Handling in Find-or-Create

### Context
`firstOrCreate()` and `createOrFirst()` query all rows including soft-deleted ones. If a unique constraint covers all rows (including deleted), creating a "new" record with the same unique values will match the deleted record.

### Criteria
- Does the model use `SoftDeletes`?
- Does the unique constraint span deleted and non-deleted rows?
- Should the application allow "re-registration" with previously used values?
- Should deleted records block re-creation?

### Decision Tree
```
Does the model use SoftDeletes?
├── YES
│   └── Should the unique constraint ignore soft-deleted records?
│       ├── YES (allow re-registration with same email)
│       │   └── Add ->whereNull('deleted_at') before the call
│       │       └── Is the unique constraint also scoped?
│       │           ├── YES (PostgreSQL partial index) → Consistent behavior
│       │           └── NO (full table uniqueness) → Inconsistency risk: constraint blocks but query doesn't
│       └── NO (block re-registration, enforce uniqueness across all rows)
│           └── Use standard createOrFirst() without whereNull
│               └── Will the user see a "trashed" model?
│                   ├── YES → Handle gracefully (restore or provide feedback)
│                   └── NO → Proceed (reuse trashed record)
└── NO → No soft-delete concern, standard find-or-create logic
```

### Rationale
If the unique constraint covers all rows including deleted, attempting to create a record with a previously-used unique value will match the deleted record. This may be surprising — the user gets back a "trashed" model. Adding `->whereNull('deleted_at')` excludes soft-deleted records from the match, but only works correctly if the unique constraint is also scoped (PostgreSQL partial unique index).

### Recommended Default
For most applications, exclude soft-deleted records from both the query AND the unique constraint. Use `->whereNull('deleted_at')` in the query and, for PostgreSQL, a partial unique index.

### Risks
- `->whereNull('deleted_at')` without partial unique constraint: constraint blocks insertion, query finds nothing, exception loop
- Returning soft-deleted model without checking `trashed()`: stale data processed as active
- Batch restore of records: may create unique constraint violations on restore

### Related Rules/Skills
- Handle Soft-Deleted Records Explicitly (05-rules.md)
- Use firstOrCreate Only in Documented Serial Contexts (05-rules.md)
- Enforce Uniqueness with Database Constraints and createOrFirst (06-skills.md)
