# Decision Trees: Restoring

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Soft Deletes & Pruning |
| Knowledge Unit | Restoring |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Instance vs bulk restore | Primary |
| 2 | Unique constraint validation before restore | Architecture |
| 3 | Cascading restore strategy | Architecture |

---

## Decision 1: Instance vs Bulk Restore

### Context
`$model->restore()` operates on a single instance and fires lifecycle events (`restoring`, `restored`). Builder-level `->restore()` operates on a query and does NOT fire events. The choice depends on event requirements and performance.

### Criteria
- Are per-record events needed (audit logging, cache clearing, notifications)?
- How many records are being restored?
- Are the records scoped to `onlyTrashed()`?
- Is event suppression acceptable?

### Decision Tree
```
Are per-record lifecycle events (restoring/restored) needed?
├── YES → Instance-level restore for each record
│   └── Iterate: User::onlyTrashed()->each(fn ($u) => $u->restore())
│   └── Event listeners will fire for each record
└── NO → Builder-level restore is appropriate
    └── User::onlyTrashed()->where('deleted_at', '>=', $date)->restore()
    └── Single UPDATE query, no events
```
```
How many records are being restored?
├── <100 → Instance restore (O(n) queries, events fire)
├── 100-1000 → Instance restore (acceptable, or bulk if events not needed)
└── >1000 → Builder-level restore (single query, no events)
    └── If events are needed: chunk and restore in batches
```
```
Is the restore scoped to onlyTrashed()?
├── YES → Safe — only trashed records will be restored
└── NO → WRONG — without scope, restore is a no-op on active records
```
```
Is restoreQuietly() appropriate?
├── YES → When events would cause side effects (maintenance scripts)
└── NO → Default restore() with events

### Rationale
Instance restore provides event fidelity at the cost of N queries. Builder restore is efficient but silent — no events, no audit trail. The choice is fundamentally about whether downstream effects (cache clearing, notifications, logging) depend on the restore event firing. Bulk operations that don't need events should always use the builder-level method.

### Recommended Default
Use instance `restore()` for user-initiated restores where audit logging and side effects are required. Use builder-level `onlyTrashed()->restore()` for internal batch operations (scheduled tasks, maintenance scripts) where event overhead is unnecessary.

### Risks
- Builder restore without onlyTrashed: no-op on active records (silent)
- Instance restore in loop for 10k records: slow, O(n) queries
- Builder restore when events needed: missing side effects (cache, audit)
- restoreQuietly() without understanding: suppressed events break downstream

### Related Rules/Skills
- Instance Restore for Events (05-rules.md)
- Builder Restore for Bulk (05-rules.md)
- onlyTrashed Before Bulk Restore (05-rules.md)

---

## Decision 2: Unique Constraint Validation Before Restore

### Context
Soft-deleted records retained their unique values. If a new record was created with the same unique value (email, slug), restoring the old record causes a `QueryException`. Validation before restore prevents this.

### Criteria
- Does the model have unique columns (email, slug, username)?
- Could a new record have claimed the unique value since deletion?
- Is the restore user-initiated or automated?

### Decision Tree
```
Does the model have unique columns?
├── NO → No unique constraint concern — restore directly
└── YES → MUST validate before restore
    └── Is the restore user-initiated?
        ├── YES → Check + report conflict to user
        │   └── Check: Model::withoutTrashed()->where('email', $user->email)->exists()
        │   └── Conflict: Show error with options (change value, skip, force)
        └── NO (automated/bulk)
            └── Check and skip conflicting records
                └── Log the conflict for manual resolution
```
```
Is the unique value reusable after deletion?
├── YES → Partial unique index allows reuse; no conflict on restore
│   └── Still check: concurrent create may have reused the value
└── NO → Conflict is likely; validate in restoring event listener
```
```
Is the restore wrapped in a transaction with locking?
├── YES → Prevents race conditions with concurrent creates
│   └── DB::transaction(fn () => User::onlyTrashed()->lockForUpdate()->find($id)->restore())
└── NO → Race condition risk: record restored but unique value already claimed by concurrent request

### Rationale
Unique constraint violations on restore are a common source of `QueryException`. The fix is not catching the exception but preventing it — validate the uniqueness of constrained columns before attempting the restore. The `restoring` event is the ideal hook for this validation, returning `false` to cancel if a conflict exists.

### Recommended Default
Implement a `restoring` event listener that checks unique column availability. For user-facing restores, return a meaningful error message suggesting how to resolve the conflict. For batch restores, skip conflicting records and log for manual resolution.

### Risks
- Restore without unique check: QueryException on constraint violation
- Catching QueryException instead of preventing: poor UX, potential data loss
- Concurrent create between check and restore: race condition
- No restoring event listener: validation bypassed

### Related Rules/Skills
- Unique Check Before Restore (05-rules.md)
- restoring Event for Validation (05-rules.md)
- Transaction with Locking (05-rules.md)

---

## Decision 3: Cascading Restore Strategy

### Context
Restoring a parent model does NOT automatically restore its soft-deleted children. Children orphaned in soft-delete state require explicit cascading.

### Criteria
- Does the parent model have soft-deletable children?
- Should children be restored when the parent is restored?
- Are pivot records involved (BelongsToMany)?

### Decision Tree
```
Does the parent have soft-deletable children?
├── NO → No cascade concern
└── YES
    └── Should children be restored when the parent is restored?
        ├── YES → Implement in restored event
        │   └── User::restored(fn ($u) => $u->posts()->onlyTrashed()->restore())
        │   └── Child cascade: only restores children that were soft-deleted
        └── NO → Children remain soft-deleted
            └── Manual per-child restore if needed later
```
```
Are there pivot tables (BelongsToMany)?
├── YES → Restoring parent does NOT restore pivot records
│   └── Handle pivot restore in restored event separately
│   └── Pivot tables don't use SoftDeletes; they are detached
└── NO → Direct relationship cascade only
```
```
Is the restoration happening in a transaction?
├── YES → Parent + children restored atomically
│   └── If child restore fails, parent restore also rolls back
└── NO → Parent may be restored without children (partial)
```

### Rationale
Cascading restore must be explicit because Eloquent does not provide automatic cascade for restores. The `restored` event is the correct hook — it fires after the parent is restored, at which point the relationship is available. Children should be scoped to `onlyTrashed()` during cascade to avoid touching active children.

### Recommended Default
Implement cascading restores in `restored` event listeners on the parent model. Scope child restores to `onlyTrashed()` to avoid affecting active records. Always wrap in a database transaction for atomicity.

### Risks
- No cascade: children remain orphaned in soft-delete state
- Cascade without onlyTrashed: attempts to restore active children (no-op)
- Pivot records not restored: many-to-many relationships broken after restore
- No transaction: parent restored but child restore fails

### Related Rules/Skills
- restored Event for Cascade (05-rules.md)
- onlyTrashed on Children (05-rules.md)
- Transaction for Atomicity (05-rules.md)
