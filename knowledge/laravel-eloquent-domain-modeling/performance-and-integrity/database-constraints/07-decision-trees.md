# Decision Trees: Database Constraints

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Database Constraints |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Foreign key constraint declaration | Primary |
| 2 | Cascade behavior selection (cascade vs restrict vs set null) | Architecture |
| 3 | Unique constraint placement | Architecture |

---

## Decision 1: Foreign Key Constraint Declaration

### Context
`foreignIdFor(User::class)` only creates a column — it does not create a foreign key constraint. Without `->constrained()`, the database has no referential integrity. The decision is whether to add the constraint and how to configure it.

### Criteria
- Has `foreignIdFor()` or `foreignId()` been used?
- Is `->constrained()` chained after it?
- Is the referenced table guaranteed to exist when migration runs?
- Does the column need to be indexed (PostgreSQL/SQLite)?

### Decision Tree
```
Is foreignIdFor() used in the migration?
├── YES
│   └── Is ->constrained() chained?
│       ├── YES
│       │   └── Is the database PostgreSQL or SQLite?
│       │       ├── YES → Add ->index() after constrained()
│       │       └── NO (MySQL) → OK (auto-indexed)
│       └── NO → MUST add ->constrained() (it's a bug otherwise)
└── NO (raw foreignId or column definition)
    └── Use foreign()->references()->on() syntax instead
```

### Rationale
`foreignIdFor()` without `->constrained()` creates a column that Eloquent relationships can use but provides zero database-level referential integrity. Any code path or direct database connection can create orphaned child records. `constrained()` adds the actual foreign key constraint that guarantees every child references an existing parent.

### Recommended Default
Always chain `->constrained()` after `foreignIdFor()`. Add `->index()` for PostgreSQL/SQLite. This is the standard pattern for all foreign keys.

### Risks
- Omitting `->constrained()`: orphaned child records silently accumulate
- Adding constraint too early in migration: referenced table may not exist yet
- `cascadeOnDelete()` without review: accidental mass deletion

### Related Rules/Skills
- Always Chain constrained() After foreignIdFor() (05-rules.md)
- Default to restrictOnDelete for Critical Data (05-rules.md)
- Index Foreign Key Columns on PostgreSQL and SQLite (05-rules.md)
- Enforce Uniqueness with Database Constraints and createOrFirst (06-skills.md)

---

## Decision 2: Cascade Behavior Selection

### Context
`cascadeOnDelete()` automates child cleanup when a parent is deleted but can cause irreversible data loss. `restrictOnDelete()` forces explicit handling. `nullOnDelete()` preserves child records by nullifying the FK.

### Criteria
- Does the child record have meaning without the parent?
- Is the data financial, transactional, or audit-related?
- Is the child user-generated content?
- What is the expected volume of child records?

### Decision Tree
```
Does the child record have meaning without the parent?
├── NO (profiles, settings, comments, likes)
│   └── Use cascadeOnDelete()
│       └── Has the cascade depth been reviewed?
│           ├── YES → Proceed (parent → children → grandchildren)
│           └── NO → Audit cascade depth before deploying
└── YES (invoices, orders, audit logs, transactions)
    └── Can the child exist independently?
        ├── YES → Use nullOnDelete() (child becomes orphaned but persists)
        └── NO → Use restrictOnDelete()
            └── Is there explicit handling for parent deletion?
                ├── YES → Proceed (archive, reassign, or batch-delete children)
                └── NO → Add explicit child handling before deletion logic
```

### Rationale
`cascadeOnDelete()` is appropriate when the child has no meaning without the parent (a user's profile, a post's comments). `restrictOnDelete()` protects critical data — deleting a customer should not silently delete their invoices. `nullOnDelete()` preserves the child record while removing the relationship.

### Recommended Default
- User-generated content: `cascadeOnDelete()`
- Financial/transactional data: `restrictOnDelete()`
- Optional relationships that can be reassigned: `nullOnDelete()`

### Risks
- Cascade depth on large child sets (millions of rows): table locks, replication lag
- `cascadeOnDelete()` on soft-delete: only works for hard deletes, not soft deletes
- Using `restrictOnDelete()` without error handling: uncaught constraint violation exceptions in production

### Related Rules/Skills
- Default to restrictOnDelete for Critical Data (05-rules.md)
- Audit All CASCADE Constraints Before Deployment (05-rules.md)
- Implement Concurrent-Safe Find-Or-Create with createOrFirst (06-skills.md)

---

## Decision 3: Unique Constraint Placement

### Context
Unique constraints prevent duplicate values at the database level. They are required for `createOrFirst()` and `upsert()` to work safely. The decision involves which columns to include and whether to use single-column or composite constraints.

### Criteria
- Which columns must be unique (email, slug, composite keys)?
- Is `createOrFirst()` or `upsert()` used on this table?
- Are soft-delete records included in the uniqueness check?
- Are there composite uniqueness requirements (user_id + role_id)?

### Decision Tree
```
Is createOrFirst() or upsert() used?
├── YES → MUST add a unique constraint on the matching columns
│   └── Are soft-delete records included?
│       ├── YES (unique across all rows including deleted)
│       │   └── Add standard unique constraint on columns
│       └── NO (unique among active records only)
│           └── Consider partial unique index (PostgreSQL) or scope
├── NO
│   └── Is this a pivot table (belongsToMany)?
│       ├── YES → Add composite unique constraint on (FK1, FK2)
│       └── NO
│           └── Is the column naturally unique (email, slug)?
│               ├── YES → Add unique constraint proactively
│               └── NO → Skip (not needed)
```

### Rationale
Unique constraints serve double duty: they guarantee data integrity AND enable concurrent-safe `createOrFirst()` / `upsert()` patterns. For pivot tables, composite unique constraints prevent duplicate relationship records. For soft-delete scenarios, the constraint strategy depends on whether uniqueness should span all rows or only active ones.

### Recommended Default
Add unique constraints on all columns that business logic requires to be unique. For `createOrFirst()` and `upsert()`, the constraint is mandatory — never deploy these methods without it.

### Risks
- Missing constraint with `createOrFirst()`: duplicates inserted silently
- Composite constraint with wrong column order: index not used efficiently
- Unique constraint on nullable columns: multiple NULL values may be allowed (MySQL behavior varies from PostgreSQL)
- Adding constraint to large live table: table locking during migration

### Related Rules/Skills
- Always Add a Unique Constraint Before Using createOrFirst (05-rules.md)
- Always Create a Unique Constraint Before Using upsert (05-rules.md)
- Audit All CASCADE Constraints Before Deployment (05-rules.md)
- Enforce Uniqueness with Database Constraints and createOrFirst (06-skills.md)
