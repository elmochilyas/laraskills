# Decision Trees: Soft Deletes Trait

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Soft Deletes & Pruning |
| Knowledge Unit | Soft Deletes Trait |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Soft deletes applicability | Primary |
| 2 | deleted_at column vs boolean is_deleted | Architecture |
| 3 | Unique constraint strategy | Architecture |
| 4 | Pruning and bloat strategy | Architecture |

---

## Decision 1: Soft Deletes Applicability

### Context
`SoftDeletes` marks records as deleted without physical removal. It enables recovery but adds query overhead and table bloat. Not every model needs soft deletes.

### Criteria
- Does the data need recoverability after accidental deletion?
- Is there an audit or compliance requirement to preserve deletion history?
- Do other records reference this record as a soft relationship?
- Is the data ephemeral (logs, cache, sessions)?
- Does GDPR right to erasure apply?

### Decision Tree
```
Does the record need recoverability after deletion?
├── YES → SoftDelete (recoverable, audit trail)
│   └── Does GDPR right to erasure apply?
│       ├── YES → SoftDelete + forceDelete capability for erasure requests
│       └── NO → SoftDelete is sufficient
└── NO
    └── Is the data ephemeral (logs, cache, sessions)?
        ├── YES → Hard delete (physical removal, no bloat)
        └── NO → Hard delete or SoftDelete?
            └── Are there soft references pointing to this record?
                ├── YES → SoftDelete (preserve referential integrity)
                └── NO → Hard delete
```
```
Does the table grow with soft-deleted rows faster than they are pruned?
├── YES → Hard delete or implement pruning before adding SoftDeletes
└── NO → SoftDelete is safe
```

### Rationale
Soft deletes should be applied selectively, not universally. Each soft-deletable model should have a clear business reason for recoverability and a pruning plan. Ephemeral data should never be soft-deleted. GDPR right to erasure requires actual data removal, which soft deletes don't provide.

### Recommended Default
Apply `SoftDeletes` only to models where data recovery is a documented business requirement. For all other models, use hard deletes. Always pair soft deletes with a pruning strategy.

### Risks
- Soft deletes on everything: table bloat, performance degradation
- No pruning strategy: unbounded table growth with dead rows
- Soft deletes for GDPR: non-compliant (data not actually removed)
- Hard delete on recoverable data: permanent data loss on accident
- Raw DB::table deletes: bypasses SoftDeletingScope entirely

### Related Rules/Skills
- SoftDeletes for Recovery Business Requirement (05-rules.md)
- Hard Delete for Ephemeral (05-rules.md)
- Pruning Strategy Required (05-rules.md)

---

## Decision 2: deleted_at Column vs Boolean is_deleted

### Context
Laravel conventions use a nullable `deleted_at` timestamp. Some legacy patterns use a boolean `is_deleted` column. The choice affects temporal information, unique indexing, and scope mechanics.

### Criteria
- Is temporal information (when deleted) needed?
- Are partial unique indexes available in the database?
- Is querying "deleted in a date range" needed?
- Is this a new project or migrating from a legacy schema?

### Decision Tree
```
Is temporal deletion information needed?
├── YES → Use nullable deleted_at timestamp
│   └── Example: audit trail, restore window, pruning conditions
└── NO → Consider boolean is_deleted
    └── Is partial unique index support available (MySQL 8.0.13+, PostgreSQL)?
        ├── YES → Both options work; deleted_at still recommended for convention
        └── NO → Boolean may be simpler; consider unique constraint implications
```
```
Is the project new (greenfield)?
├── YES → Use deleted_at timestamp (Laravel convention, full feature support)
└── NO (legacy migration)
    └── Can the schema be migrated to deleted_at?
        ├── YES → Migrate to deleted_at for consistency
        └── NO → Keep boolean; implement SoftDeletes-like behavior manually
```

### Rationale
The nullable `deleted_at` timestamp carries temporal information (when deletion occurred), supports time-based queries (prune records older than 30 days), and enables partial unique indexes. A boolean `is_deleted` loses all temporal context and cannot distinguish records deleted yesterday from those deleted a year ago.

### Recommended Default
Always use the nullable `deleted_at` timestamp convention. Boolean `is_deleted` should only be used when migrating a legacy schema where a column rename is infeasible.

### Risks
- Boolean is_deleted: no temporal data, no partial unique indexes
- Boolean is_deleted: manual scope implementation required
- deleted_at without index: full table scan on every query
- Both boolean + timestamp: data drift, confusion about source of truth

### Related Rules/Skills
- deleted_at Timestamp (05-rules.md)
- Index deleted_at Column (05-rules.md)

---

## Decision 3: Unique Constraint Strategy

### Context
Soft-deleted records retain their unique column values. A new record with the same unique value (email, slug) conflicts with the soft-deleted record. Partial unique indexes solve this by only enforcing uniqueness on active records.

### Criteria
- Does the table have unique columns (email, slug, username)?
- Can multiple soft-deleted records have the same unique value?
- Does the database support partial/indexed unique constraints?
- Is application-level uniqueness enforcement acceptable?

### Decision Tree
```
Does the table have unique columns?
├── YES
│   └── Does the database support partial unique indexes?
│       ├── YES (MySQL 8.0.13+, PostgreSQL, SQLite 3.25+) 
│       │   └── Use: CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL
│       ├── YES but older MySQL (< 8.0.13)
│       │   └── Use: composite unique index on (column, deleted_at) with null handling
│       └── NO (SQLite < 3.25)
│           └── Application-level uniqueness check (validates in PHP, not DB)
└── NO → No unique constraint concern
```
```
Do soft-deleted records reuse the same unique value as new records?
├── YES → Partial unique index (DB-enforced) or app-level check
│   └── For restore: ensure the unique value is available before restoring
└── NO → Unique constraint on restore is not a concern
```
```
Is UUID/ULID used as primary key?
├── YES → Unique constraint conflicts less likely (no sequential reuse)
└── NO → Auto-increment IDs: unique constraint on secondary columns is the concern
```

### Rationale
Partial unique indexes (`WHERE deleted_at IS NULL`) are the gold standard — they enforce uniqueness only among active records, allowing soft-deleted records to retain their values. Without them, restoring a soft-deleted record may conflict with a new record that took its unique value.

### Recommended Default
Add a partial unique index for every unique column on soft-deletable tables. For databases that don't support partial indexes, use a composite unique index on `(column, deleted_at)` and handle `NULL` comparison behavior in migrations.

### Risks
- No partial unique index: duplicate active values on restore
- Partial index on wrong columns: performance impact on writes
- Application-level check without DB constraint: race condition on concurrent writes
- No index on unique column: full table scan on uniqueness check

### Related Rules/Skills
- Partial Unique Index for Active Records (05-rules.md)
- Unique Check Before Restore (05-rules.md)

---

## Decision 4: Pruning and Bloat Strategy

### Context
Soft-deleted records accumulate indefinitely, degrading performance through table bloat, index bloat, and buffer pool pressure. A pruning strategy determines when and how to permanently remove old soft-deleted records.

### Criteria
- How long does the application need to retain soft-deleted records?
- Is there a compliance or retention policy?
- How many soft-deleted records are created per day?
- Is disk space a concern?

### Decision Tree
```
Are soft-deleted records retained indefinitely?
├── YES → REQUIRED pruning strategy
│   └── What is the retention window?
│       ├── 30 days → Prune with model:prune daily (Prunable or MassPrunable)
│       ├── 90 days → Prune weekly
│       ├── 1 year → Prune monthly
│       └── Indefinite → Requires external archiving (cold storage export before prune)
└── NO → Hard delete instead of soft delete
```
```
How many soft-deleted records accumulate per day?
├── <100 → Prunable trait (per-record events acceptable)
├── 100-10k → Prunable or MassPrunable depending on event needs
└── >10k → MassPrunable (single DELETE, no events)
```
```
Is archival needed before removal?
├── YES → Prunable trait with pruned() callback for archiving
└── NO → MassPrunable (faster, no callbacks)
```

### Rationale
Without a pruning strategy, every soft-deletable table becomes a growing sink. A pruning policy defines the retention window, removal frequency, and whether to archive before deletion. The choice between `Prunable` and `MassPrunable` depends on volume and whether per-record events are needed.

### Recommended Default
Define a retention window for every soft-deletable model (default: 90 days). Use `Prunable` for models needing per-record archiving or event side effects. Use `MassPrunable` for high-volume ephemeral soft-delete data. Schedule via `model:prune` in `Kernel::schedule()`.

### Risks
- No pruning strategy: unbounded table growth, performance degradation
- Too-short retention: records deleted before recovery window expires
- Too-long retention: unnecessary storage and performance overhead
- Pruning without archiving: data permanently lost
- MassPrunable when events are needed: missing side effects

### Related Rules/Skills
- Retention Policy Per Model (05-rules.md)
- Prunable for Archival (05-rules.md)
- MassPrunable for High Volume (05-rules.md)
- Schedule model:prune (05-rules.md)
