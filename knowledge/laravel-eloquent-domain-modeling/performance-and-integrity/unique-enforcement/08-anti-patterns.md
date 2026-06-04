# Unique Enforcement — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Unique Enforcement |
| Focus | Anti-patterns in firstOrCreate race conditions, createOrFirst constraint dependency, and soft-delete handling |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Blind `firstOrCreate()` Without Concurrency Awareness | Reliability | Critical |
| 2 | `createOrFirst()` Without Database Unique Constraint | Reliability | Critical |
| 3 | Using `firstOrCreate()` Without Documenting Serial Guarantee | Maintainability | Medium |
| 4 | Not Handling Soft-Deleted Records in Find-or-Create | Reliability | High |
| 5 | Assuming `updateOrCreate()` Is Concurrent-Safe | Reliability | Critical |
| 6 | Not Monitoring `SQLSTATE[23000]` Error Rates | Reliability | Medium |

---

## 1. Blind `firstOrCreate()` Without Concurrency Awareness

### Category
Reliability

### Description
Using `firstOrCreate()` in web-facing code paths without considering that concurrent requests both pass the SELECT and both INSERT, producing duplicate records.

### Preferred Alternative
```php
$user = User::createOrFirst(
    ['email' => $request->email],
    ['name' => $request->name]
);
```

### Detection Checklist
- [ ] Search for `firstOrCreate(` in controllers, listeners, jobs
- [ ] Replace with `createOrFirst()`
- [ ] Keep `firstOrCreate()` only in serial contexts

### Related
| Rule | `05-rules.md` — Default to createOrFirst for Concurrent Paths |

---

## 2. `createOrFirst()` Without Database Unique Constraint

### Category
Reliability

### Description
Using `createOrFirst()` without a unique index on the matching columns, so the database never throws a constraint violation and duplicates are inserted silently.

### Preferred Alternative
```php
// Migration: $table->string('slug')->unique();
Tag::createOrFirst(['slug' => 'featured'], ['name' => 'Featured']);
```

### Detection Checklist
- [ ] Search for `createOrFirst(` and verify unique constraint
- [ ] Add migration with unique constraint before deploying
- [ ] Verify constraint on all `$attributes` columns

### Related
| Rule | `05-rules.md` — Always Pair createOrFirst with a Unique Constraint |

---

## 3. Using `firstOrCreate()` Without Documenting Serial Guarantee

### Category
Maintainability

### Description
Using `firstOrCreate()` without a comment explaining why serial execution is guaranteed, allowing future developers to copy the pattern into concurrent paths.

### Preferred Alternative
```php
// Serial: single invocation per deployment, no concurrency possible
Tag::firstOrCreate(['slug' => 'featured'], ['name' => 'Featured']);
```

### Detection Checklist
- [ ] Search for `firstOrCreate(` without serial justification
- [ ] Add documentation for each serial assumption
- [ ] Flag undocumented `firstOrCreate()` for review

### Related
| Rule | `05-rules.md` — Use firstOrCreate Only in Strictly Serial Contexts |

---

## 4. Not Handling Soft-Deleted Records in Find-or-Create

### Category
Reliability

### Description
Using `firstOrCreate()` or `createOrFirst()` without `->whereNull('deleted_at')`, returning a logically deleted model.

### Preferred Alternative
```php
$user = User::whereNull('deleted_at')
    ->firstOrCreate(['email' => $request->email], $data);
```

### Detection Checklist
- [ ] Search for find-or-create on soft-deletable models
- [ ] Add `->whereNull('deleted_at')` filter
- [ ] Verify returned model is not trashed

### Related
| Rule | `05-rules.md` — Handle Soft-Deleted Records in Find-or-Create |

---

## 5. Assuming `updateOrCreate()` Is Concurrent-Safe

### Category
Reliability

### Description
Using `updateOrCreate()` believing it is safe from race conditions, when it has the same SELECT-then-act race window as `firstOrCreate()`.

### Preferred Alternative
Use `createOrFirst()` or manual locking pattern for concurrent-safe find-or-create.

### Detection Checklist
- [ ] Search for `updateOrCreate(` in concurrent paths
- [ ] Replace with `createOrFirst()` or locking pattern
- [ ] Document concurrency awareness

### Related
| Rule | `04-standardized-knowledge.md` — updateOrCreate has same race condition as firstOrCreate |

---

## 6. Not Monitoring `SQLSTATE[23000]` Error Rates

### Category
Reliability

### Description
Not monitoring unique constraint violation rates in production, allowing duplicate-bug patterns to silently accumulate near-duplicate records.

### Preferred Alternative
Set up alerting: "Alert when `SQLSTATE[23000]` rate > 0 per minute for non-migration queries."

### Detection Checklist
- [ ] Add monitoring for unique constraint violations
- [ ] Set up alerting on spike detection
- [ ] Investigate violations to identify missing `createOrFirst()` calls

### Related
| Rule | `05-rules.md` — Monitor SQLSTATE[23000] Error Rates |
