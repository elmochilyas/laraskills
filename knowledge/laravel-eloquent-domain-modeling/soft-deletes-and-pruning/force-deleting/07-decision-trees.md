# Decision Trees: Force Deleting

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Soft Deletes & Pruning |
| Knowledge Unit | Force Deleting |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Soft delete vs force delete | Primary |
| 2 | Bulk force delete strategy | Architecture |
| 3 | Authorization and audit for force delete | Architecture |

---

## Decision 1: Soft Delete vs Force Delete

### Context
`delete()` (soft) sets `deleted_at`. `forceDelete()` issues a real `DELETE`. The choice determines data recoverability, audit trail availability, and compliance standing.

### Criteria
- Should the record be recoverable later?
- Is there a compliance requirement for data removal (GDPR right to erasure)?
- Does the record participate in soft references?
- Is the deletion user-initiated or system-initiated?

### Decision Tree
```
Should the record be recoverable after deletion?
├── YES → Use delete() (soft delete)
│   └── Recovery window: how long?
│       ├── Temporary (30-90 days) → Soft delete + prune after window
│       └── Indefinite → Soft delete (with pruning for old records)
└── NO → Use forceDelete() (permanent removal)
    └── Is this a GDPR right to erasure request?
        ├── YES → forceDelete() is the correct tool
        └── NO → forceDelete() for admin cleanup
```
```
Does the record have soft references from other records?
├── YES → Use delete() (soft) — preserve referential integrity
│   └── forceDelete() would cause missing parent references
└── NO → forceDelete() or delete() based on recoverability
```
```
Is the deletion user-facing or background?
├── User-facing (admin panel, account deletion) → Confirm intention
│   └── Soft delete: confirm once
│   └── Force delete: require explicit confirmation ("type DELETE")
└── Background (pruning, maintenance) → forceDelete() is appropriate
```

### Rationale
Soft delete preserves the record for recovery and audit. Force delete is permanent and cannot be undone. The decision is a business requirement: can the data ever need to be recovered? If yes, soft delete. If no, force delete. GDPR right to erasure mandates force delete (or actual physical deletion).

### Recommended Default
Use `delete()` (soft) for all user-initiated deletions by default. Use `forceDelete()` only when: (1) compliance requires physical deletion, (2) the data is ephemeral and recovery is irrelevant, or (3) the record is past the soft-delete recovery window.

### Risks
- forceDelete on recoverable data: permanent data loss
- Soft delete when GDPR requires removal: non-compliant
- forceDelete with soft references: broken relationships
- No confirmation on forceDelete: accidental permanent deletion

### Related Rules/Skills
- Soft Delete as Default (05-rules.md)
- forceDelete for GDPR (05-rules.md)
- Confirmation for forceDelete (05-rules.md)

---

## Decision 2: Bulk Force Delete Strategy

### Context
`forceDelete()` is instance-only — no builder-level equivalent exists. Bulk force delete requires iterating records with `->each()`, using raw `DB::table()` delete, or using `MassPrunable`/`Prunable`.

### Criteria
- How many records are being force-deleted?
- Are per-record events needed (audit, cache, cascade)?
- Is the deletion time-sensitive?
- Are foreign key constraints present?

### Decision Tree
```
How many records are being force-deleted?
├── <100 → Instance-level: each(fn ($m) => $m->forceDelete())
│   └── Events fire, foreign key constraints honored
├── 100-10000 → Depends on event needs
│   ├── Events needed: Prunable trait with chunked iteration
│   └── Events not needed: MassPrunable trait (single DELETE)
└── >10000 → MassPrunable or raw DB::table delete
    └── MUST batch with limit() to avoid table locks
    └── MUST handle foreign key constraints manually
```
```
Are records scoped to onlyTrashed() before iteration?
├── YES → Safe — only soft-deleted records are force-deleted
└── NO → WRONG — iterating ALL records and force-deleting them
```
```
Are foreign key constraints on the table?
├── YES → forceDelete order matters
│   └── Delete children first (or set ON DELETE CASCADE)
│   └── Raw DELETE without constraint handling may fail
└── NO → No constraint ordering concern
```
```
Are per-record events needed during bulk force delete?
├── YES → Prunable trait (per-record forceDelete with pruning/pruned callbacks)
└── NO → MassPrunable (single DELETE, no callbacks, faster)

### Rationale
Bulk force delete without scoping is the most dangerous soft-delete mistake — `Model::all()->each->forceDelete()` permanently removes all records. The safe pattern: always scope to `onlyTrashed()`, batch with `limit()`, and choose `Prunable` or `MassPrunable` based on event requirements.

### Recommended Default
Always scope bulk force delete to `onlyTrashed()`. For <100 records, use instance iteration. For 100+, use `Prunable` (events needed) or `MassPrunable` (events not needed). Batch with `->limit(1000)` for large datasets to avoid table locks.

### Risks
- Bulk force delete without onlyTrashed: permanent deletion of all records
- No batching: table lock, transaction log overflow
- No foreign key handling: constraint violation, failed deletion
- Using Prunable when events not needed: unnecessary overhead

### Related Rules/Skills
- onlyTrashed Before Bulk Force Delete (05-rules.md)
- Prunable vs MassPrunable (05-rules.md)
- Batch Large Deletes (05-rules.md)

---

## Decision 3: Authorization and Audit for Force Delete

### Context
`forceDelete()` is an irreversible destructive operation. Authorization policies and audit logging are essential to prevent unauthorized permanent deletion and to track deletions for compliance.

### Criteria
- Who should be allowed to force delete?
- Is confirmation required before execution?
- Should force deletes be audited?
- Are force deletes subject to compliance requirements?

### Decision Tree
```
Who should be allowed to force delete?
├── Admin only → Gate via Policy: forceDelete() returns admin check
├── Record owner + admin → Gate via Policy: owner can force delete own records
└── No one (soft delete only) → Remove forceDelete() from controllers
```
```
Is user confirmation required?
├── YES → Require typing "DELETE" or record name
│   └── UI: confirmation dialog + text input
└── NO → Confirmation skipped (internal/maintenance only)
```
```
Should force deletes be audited?
├── YES → Implement forceDeleted event listener
│   └── Log: who, what, when, why
│   └── Store in audit table or log file
└── NO → Audit not required (ephemeral data)
```
```
Is the force delete subject to compliance (GDPR, SOX)?
├── YES → MUST audit force deletes
│   └── MUST implement retention/archival before deletion
│   └── MUST verify cascade deletes are compliant
└── NO → Standard audit practices apply

### Rationale
Force delete is the most destructive operation in the soft-delete lifecycle. A policy gate prevents unauthorized use. Confirmation prevents accidental use. Audit logging provides accountability and compliance. Without these safeguards, a force delete is a permanent, untraceable data loss.

### Recommended Default
Implement a `forceDelete` policy method gated to admin roles. Require explicit confirmation ("type DELETE") in all user-facing force delete UIs. Log all force deletes via the `forceDeleted` event with user ID, timestamp, and reason.

### Risks
- No policy gate: non-admin users can force delete
- No confirmation: accidental permanent deletion
- No audit trail: data loss is untraceable
- forceDeleteQuietly() bypassing audit: suppressed events = suppressed logging
- ON DELETE CASCADE without audit: children deleted without record

### Related Rules/Skills
- Policy Gate for forceDelete (05-rules.md)
- Confirmation Required (05-rules.md)
- Audit Log forceDeletes (05-rules.md)
