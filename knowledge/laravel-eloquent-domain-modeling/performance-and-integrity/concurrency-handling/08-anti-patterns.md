# Concurrency Handling — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Concurrency Handling |
| Focus | Anti-patterns in pessimistic locking, transaction scope, deadlock retry, lock ordering, and isolation |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | `lockForUpdate()` Without a Transaction | Reliability | Critical |
| 2 | Holding Locks During I/O (Shotgun Transactions) | Performance | Critical |
| 3 | Inconsistent Lock Order (Guaranteed Deadlock) | Reliability | Critical |
| 4 | No Deadlock Retry | Reliability | High |
| 5 | `lockForUpdate()` on Unindexed Columns | Performance | Critical |
| 6 | Pessimistic Locking for Read-Only Operations | Performance | High |
| 7 | Using Pessimistic Locking for Long-Running Operations | Design | High |
| 8 | Not Using `skipLocked()` for Queue Workers | Performance | Medium |

---

## 1. `lockForUpdate()` Without a Transaction

### Category
Reliability

### Description
Calling `lockForUpdate()` outside a `DB::transaction()` closure, causing the lock to be released immediately after the SELECT executes — providing zero protection.

### Warning Signs
- `->lockForUpdate()` without surrounding `DB::transaction()`
- Lost updates despite using `lockForUpdate()`
- Race condition still occurs with locking code

### Preferred Alternative
```php
DB::transaction(function () use ($id, $quantity) {
    $product = Product::lockForUpdate()->find($id);
    $product->decrement('stock', $quantity);
});
```

### Detection Checklist
- [ ] Search for `lockForUpdate()` without `DB::transaction(` above
- [ ] Wrap every `lockForUpdate()` in a transaction
- [ ] Verify lock is held until commit

### Related
| Rule | `05-rules.md` — Always Wrap lockForUpdate in a Transaction |

---

## 2. Holding Locks During I/O (Shotgun Transactions)

### Category
Performance

### Description
Including HTTP calls, file writes, or email sending inside a locked transaction, holding database locks for milliseconds to seconds and blocking all other writers.

### Preferred Alternative
```php
DB::transaction(function () use ($product) {
    $inventory = Product::lockForUpdate()->find($product->id);
    $inventory->decrement('stock', 1);
});
Mail::to($user)->send(new OrderConfirmation()); // I/O after lock released
```

### Detection Checklist
- [ ] Review locked transactions for I/O operations
- [ ] Move I/O outside transaction
- [ ] Keep locked scope to read-modify-write only

### Related
| Rule | `05-rules.md` — Keep Locked Transactions Short |

---

## 3. Inconsistent Lock Order (Guaranteed Deadlock)

### Category
Reliability

### Description
Transaction A locks Table1 then Table2; transaction B locks Table2 then Table1 — creating a circular wait that guarantees deadlock under concurrency.

### Preferred Alternative
```php
// Both transactions lock in the same (alphabetical) order
DB::transaction(function () {
    $order = Order::lockForUpdate()->find(1);
    $user = User::lockForUpdate()->find(1);
});
```

### Detection Checklist
- [ ] Review multi-table transactions for consistent lock ordering
- [ ] Establish and document global lock order convention
- [ ] Verify all code paths follow the convention

### Related
| Rule | `05-rules.md` — Lock Tables in Consistent Global Order |

---

## 4. No Deadlock Retry

### Category
Reliability

### Description
Using `DB::transaction()` without the retry attempt parameter, causing deadlock victims to receive a non-retried exception.

### Preferred Alternative
```php
DB::transaction(function () {
    $product = Product::lockForUpdate()->find(1);
    $product->decrement('stock', 1);
}, 3); // Up to 3 attempts
```

### Detection Checklist
- [ ] Search for `DB::transaction(` without retry count
- [ ] Add at least 3 retry attempts for locked code paths
- [ ] Ensure closures are idempotent

### Related
| Rule | `05-rules.md` — Implement Deadlock Retry |

---

## 5. `lockForUpdate()` on Unindexed Columns

### Category
Performance

### Description
Locking rows via `WHERE` on an unindexed column, causing MySQL InnoDB to escalate to a table-level lock.

### Preferred Alternative
```php
DB::transaction(function () {
    $product = Product::lockForUpdate()->where('sku', 'ABC-123')->first(); // sku must be indexed
});
```

### Detection Checklist
- [ ] Review `lockForUpdate()` WHERE columns for indexes
- [ ] Add indexes on all lock-target columns
- [ ] Verify with `EXPLAIN` that index is used

### Related
| Rule | `05-rules.md` — Lock Only on Indexed Columns |

---

## 6. Pessimistic Locking for Read-Only Operations

### Category
Performance

### Description
Applying `lockForUpdate()` to read-only queries that never write, acquiring unnecessary locks that block concurrent writers.

### Preferred Alternative
```php
$product = Product::find($id); // No lock needed for read-only
```

### Detection Checklist
- [ ] Search for `lockForUpdate()` on read-only paths
- [ ] Remove locking from display-only queries
- [ ] Verify locking is used only for write operations

### Related
| Rule | `05-rules.md` — Never Use Pessimistic Locking for Read-Only Operations |

---

## 7. Using Pessimistic Locking for Long-Running Operations

### Category
Design

### Description
Holding pessimistic locks for operations that span seconds or longer (form edits, document editing), blocking all other writers for the entire duration.

### Preferred Alternative
```php
$product = Product::find($id);
// User edits form for 5 minutes
// On submit: optimistic locking check
$affected = Product::where('id', $product->id)
    ->where('lock_version', $product->lock_version)
    ->update(['name' => $newName, 'lock_version' => $product->lock_version + 1]);
```

### Detection Checklist
- [ ] Review long-running operations for pessimistic locking
- [ ] Replace with optimistic locking (version column)
- [ ] Implement retry/conflict resolution for optimistic lock failures

### Related
| Rule | `05-rules.md` — Use Optimistic Locking for Long-Running Operations |

---

## 8. Not Using `skipLocked()` for Queue Workers

### Category
Performance

### Description
Multiple queue workers querying for the same pending jobs, contending for the same locked rows and causing deadlocks.

### Preferred Alternative
```php
DB::transaction(function () {
    $job = Job::where('status', 'pending')
        ->lockForUpdate()
        ->skipLocked()
        ->first();
});
```

### Detection Checklist
- [ ] Search for job claiming queries without `skipLocked()`
- [ ] Add `->skipLocked()` after `->lockForUpdate()`
- [ ] Verify workers don't compete for the same rows

### Related
| Rule | `05-rules.md` — Use skipLocked for Queue Workers |
