# firstOrCreate vs createOrFirst — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | firstOrCreate vs createOrFirst |
| Focus | Anti-patterns in find-or-create race conditions, missing constraints, and soft-delete handling |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Blind `firstOrCreate()` in Concurrent Paths | Reliability | Critical |
| 2 | `createOrFirst()` Without Unique Constraint | Reliability | Critical |
| 3 | Not Handling Soft-Deleted Records in Find-or-Create | Reliability | High |
| 4 | Using `firstOrCreate()` Without Documenting Serial Guarantee | Maintainability | Medium |
| 5 | Assuming `updateOrCreate()` Is Concurrent-Safe | Reliability | Critical |
| 6 | Using `lockForUpdate()` Without Transaction as Alternative | Reliability | Critical |

---

## 1. Blind `firstOrCreate()` in Concurrent Paths

### Category
Reliability

### Description
Using `firstOrCreate()` throughout the codebase on web-facing code paths (controllers, event listeners, queue jobs) where concurrent requests can both pass the SELECT and both INSERT, producing duplicates.

### Preferred Alternative
```php
$user = User::createOrFirst(['email' => $request->email], $data);
```

### Detection Checklist
- [ ] Search for `firstOrCreate(` in controllers, listeners, jobs
- [ ] Replace with `createOrFirst()`
- [ ] Keep `firstOrCreate()` only in seeds, artisan commands, serial contexts

### Related
| Rule | `05-rules.md` — Prefer createOrFirst for Web-Facing Code |

---

## 2. `createOrFirst()` Without Unique Constraint

### Category
Reliability

### Description
Using `createOrFirst()` on a table without a database unique constraint on the matching columns, so the INSERT always succeeds and duplicates are created silently.

### Preferred Alternative
```php
// Migration: $table->string('email')->unique();
$user = User::createOrFirst(['email' => $request->email], $data);
```

### Detection Checklist
- [ ] Search for `createOrFirst(` and verify unique constraint exists
- [ ] Add migration with unique constraint before deploying
- [ ] Verify constraint on all `$attributes` columns

### Related
| Rule | `05-rules.md` — Always Add a Unique Constraint Before Using createOrFirst |

---

## 3. Not Handling Soft-Deleted Records in Find-or-Create

### Category
Reliability

### Description
Using `firstOrCreate()` or `createOrFirst()` without `->whereNull('deleted_at')`, matching soft-deleted records and returning a logically deleted model.

### Preferred Alternative
```php
$user = User::whereNull('deleted_at')
    ->firstOrCreate(['email' => $request->email], $data);
```

### Detection Checklist
- [ ] Search for `firstOrCreate(` / `createOrFirst(` on soft-deletable models
- [ ] Add `->whereNull('deleted_at')` filter
- [ ] Verify returned model is not trashed

### Related
| Rule | `05-rules.md` — Handle Soft-Deleted Records Explicitly |

---

## 4. Using `firstOrCreate()` Without Documenting Serial Guarantee

### Category
Maintainability

### Description
Using `firstOrCreate()` without a comment explaining why serial execution is guaranteed, allowing future developers to copy the pattern into concurrent paths.

### Preferred Alternative
```php
// Serial: single-worker queue, dispatched once per deployment
Tag::firstOrCreate(['slug' => 'featured'], ['name' => 'Featured']);
```

### Detection Checklist
- [ ] Search for `firstOrCreate(` without serial justification comment
- [ ] Add documentation for each `firstOrCreate()` usage
- [ ] Flag undocumented `firstOrCreate()` for review

### Related
| Rule | `05-rules.md` — Use firstOrCreate Only in Documented Serial Contexts |

---

## 5. Assuming `updateOrCreate()` Is Concurrent-Safe

### Category
Reliability

### Description
Using `updateOrCreate()` believing it's concurrent-safe, when it has the same race condition as `firstOrCreate()` (SELECT-then-INSERT/UPDATE).

### Preferred Alternative
```php
// Use createOrFirst with separate update or explicit locking
$user = User::createOrFirst(['email' => $email], $data);
```

### Detection Checklist
- [ ] Search for `updateOrCreate(` in concurrent paths
- [ ] Replace with `createOrFirst()` or manual locking pattern
- [ ] Document race condition awareness

### Related
| Rule | `04-standardized-knowledge.md` — updateOrCreate has same race condition as firstOrCreate |

---

## 6. Using `lockForUpdate()` Without Transaction as Alternative

### Category
Reliability

### Description
Using `lockForUpdate()` before `firstOrCreate()` as a concurrent-safe alternative, but without wrapping in `DB::transaction()`, so the lock is released immediately.

### Preferred Alternative
```php
DB::transaction(function () use ($email, $data) {
    $user = User::lockForUpdate()->where('email', $email)->first();
    return $user ?? User::create(array_merge(['email' => $email], $data));
});
```

### Detection Checklist
- [ ] Search for `lockForUpdate()` before find-or-create patterns
- [ ] Wrap in `DB::transaction()`
- [ ] Use `createOrFirst()` where available instead

### Related
| Rule | `05-rules.md` — Always Wrap lockForUpdate in a Transaction |
