# Database Constraints — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Database Constraints |
| Focus | Anti-patterns in foreign keys, cascade behavior, constraint omission, and constraint disabling |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Omitting `->constrained()` After `foreignIdFor()` (No Constraint) | Reliability | Critical |
| 2 | Using `cascadeOnDelete()` Without Reviewing Cascade Depth | Reliability | Critical |
| 3 | Not Indexing Foreign Key Columns on PostgreSQL/SQLite | Performance | High |
| 4 | Disabling `FOREIGN_KEY_CHECKS` in Production | Reliability | Critical |
| 5 | Relying on `ON DELETE CASCADE` for Soft Deletes | Reliability | High |
| 6 | CASCADE-Everywhere Approach (Including Critical Data) | Reliability | Critical |

---

## 1. Omitting `->constrained()` After `foreignIdFor()` (No Constraint)

### Category
Reliability

### Description
Using `foreignIdFor(User::class)` without chaining `->constrained()`, creating the column but no referential integrity — any code path or direct DB access can create orphan rows.

### Preferred Alternative
```php
$table->foreignIdFor(User::class)->constrained();
```

### Detection Checklist
- [ ] Search for `foreignIdFor(` without `->constrained()`
- [ ] Add `->constrained()` to all foreign key columns
- [ ] Clean up orphaned rows that accumulated without constraints

### Related
| Rule | `05-rules.md` — Always Chain constrained() After foreignIdFor() |

---

## 2. Using `cascadeOnDelete()` Without Reviewing Cascade Depth

### Category
Reliability

### Description
Applying `cascadeOnDelete()` to foreign keys without understanding the cascade chain depth or expected child row count, risking mass deletion of millions of rows.

### Preferred Alternative
```php
// Reviewed: User posts cascade is acceptable (< 10k per user)
$table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
// For large cascade chains, batch-delete manually
```

### Detection Checklist
- [ ] Review each `cascadeOnDelete()` for cascade depth
- [ ] Audit expected child row counts
- [ ] Use `restrictOnDelete()` for financial/transactional data

### Related
| Rule | `05-rules.md` — Audit All CASCADE Constraints Before Deployment |

---

## 3. Not Indexing Foreign Key Columns on PostgreSQL/SQLite

### Category
Performance

### Description
Omitting `->index()` on foreign key columns on PostgreSQL or SQLite (which don't auto-index FK columns), causing full table scans on JOINs.

### Preferred Alternative
```php
$table->foreignIdFor(User::class)->constrained()->index();
```

### Detection Checklist
- [ ] Review PostgreSQL/SQLite FK columns for indexes
- [ ] Add `->index()` after `foreignIdFor()`
- [ ] Verify `EXPLAIN` shows index usage on JOINs

### Related
| Rule | `05-rules.md` — Index Foreign Key Columns on PostgreSQL and SQLite |

---

## 4. Disabling `FOREIGN_KEY_CHECKS` in Production

### Category
Reliability

### Description
Using `SET FOREIGN_KEY_CHECKS=0` in production migrations or application code, opening a window for data corruption.

### Preferred Alternative
```php
// Use pt-online-schema-change or gh-ost for zero-downtime migrations
```

### Detection Checklist
- [ ] Search for `FOREIGN_KEY_CHECKS` in codebase
- [ ] Remove from production code
- [ ] Use online schema change tools instead

### Related
| Rule | `05-rules.md` — Never Disable FOREIGN_KEY_CHECKS in Production |

---

## 5. Relying on `ON DELETE CASCADE` for Soft Deletes

### Category
Reliability

### Description
Assuming `cascadeOnDelete()` cascades to children when a parent is soft-deleted, when cascades only fire on hard (actual) `DELETE` SQL operations.

### Preferred Alternative
```php
protected static function booted(): void
{
    static::deleting(function ($user) {
        if ($user->isForceDeleting()) {
            return; // cascadeOnDelete handles hard deletes
        }
        $user->posts()->delete(); // Soft-delete children
    });
}
```

### Detection Checklist
- [ ] Review soft-deletable models with `cascadeOnDelete()` on children
- [ ] Add model event handlers for soft-delete cascading
- [ ] Verify soft-deleted parents cascade to children

### Related
| Rule | `05-rules.md` — Handle Cascade for Soft Deletes Separately |

---

## 6. CASCADE-Everywhere Approach (Including Critical Data)

### Category
Reliability

### Description
Applying `cascadeOnDelete()` to all foreign keys including financial, transactional, and audit data, risking irreversible data loss from accidental parent deletion.

### Preferred Alternative
```php
// Critical data → restrictOnDelete
$table->foreignIdFor(Customer::class)->constrained()->restrictOnDelete();
// User content → cascadeOnDelete
$table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
```

### Detection Checklist
- [ ] Review each `cascadeOnDelete()` for data criticality
- [ ] Replace with `restrictOnDelete()` for financial/transactional data
- [ ] Document exception for each cascade on critical data

### Related
| Rule | `05-rules.md` — Default to restrictOnDelete for Critical Data |
