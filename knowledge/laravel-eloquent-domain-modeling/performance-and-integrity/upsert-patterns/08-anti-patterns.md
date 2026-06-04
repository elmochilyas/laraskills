# Upsert Patterns — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Upsert Patterns |
| Focus | Anti-patterns in upsert constraint dependency, model event bypass, chunking, timestamp handling, and auto-increment PK |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | `upsert()` Without Database Unique Constraint | Reliability | Critical |
| 2 | Relying on Model Events When Using `upsert()` | Reliability | Critical |
| 3 | Not Chunking Large Datasets (Packet/Timeout Failures) | Performance | High |
| 4 | Forgetting `updated_at` in `upsert()` `$update` Array | Maintainability | High |
| 5 | Including Auto-Increment Primary Key in `$update` | Reliability | Critical |
| 6 | Not Validating Incoming Data Before `upsert()` | Security | High |

---

## 1. `upsert()` Without Database Unique Constraint

### Category
Reliability

### Description
Using `upsert()` without a unique index on the `$uniqueBy` columns. The database has no mechanism to detect conflicts, so rows are inserted as duplicates silently.

### Preferred Alternative
```php
// Migration: $table->string('email')->unique();
User::upsert($apiUsers, ['email'], ['name', 'role']);
```

### Detection Checklist
- [ ] Search for `upsert(` and verify unique constraint on `$uniqueBy`
- [ ] Add unique index migration before deploying
- [ ] Verify constraint exists on all unique-by columns

### Related
| Rule | `05-rules.md` — Always Create a Unique Constraint Before Using upsert |

---

## 2. Relying on Model Events When Using `upsert()`

### Category
Reliability

### Description
Depending on `creating`, `created`, `updating`, `updated`, `saving`, or `saved` events for logging, cache invalidation, or webhooks — events that `upsert()` bypasses.

### Preferred Alternative
```php
// Handle side effects explicitly after upsert
$beforeEmails = User::whereIn('email', $emails)->pluck('email');
User::upsert($apiUsers, ['email'], ['name', 'updated_at' => now()]);
$updatedEmails = User::whereIn('email', $emails)->pluck('email');
User::whereIn('email', $updatedEmails)->get()->each->invalidateCache();
```

### Detection Checklist
- [ ] Review upsert usage for event-dependent side effects
- [ ] Implement explicit post-upsert change tracking
- [ ] Document that events are bypassed

### Related
| Rule | `05-rules.md` — Handle Model Events Separately |

---

## 3. Not Chunking Large Datasets (Packet/Timeout Failures)

### Category
Performance

### Description
Passing 100k+ records to a single `upsert()` call, generating an SQL statement that exceeds `max_allowed_packet` or causes query timeout.

### Preferred Alternative
```php
collect($apiData)->chunk(500)->each(function ($chunk) {
    User::upsert($chunk->toArray(), ['email'], ['name', 'updated_at' => now()]);
});
```

### Detection Checklist
- [ ] Review upsert call sites for chunking
- [ ] Chunk to 500-1000 records per call for large datasets
- [ ] Handle partial failures gracefully

### Related
| Rule | `05-rules.md` — Chunk Large Datasets to 500-1000 Records per Call |

---

## 4. Forgetting `updated_at` in `upsert()` `$update` Array

### Category
Maintainability

### Description
Omitting `updated_at` from the `$update` array, causing matched rows to retain their original `created_at` value in `updated_at`.

### Preferred Alternative
```php
User::upsert(
    $apiUsers,
    ['email'],
    ['name', 'role', 'updated_at' => now()]
);
```

### Detection Checklist
- [ ] Search for `upsert(` calls without `updated_at` in $update
- [ ] Add `'updated_at' => now()` to the update array
- [ ] Document tables that don't use timestamps

### Related
| Rule | `05-rules.md` — Always Include updated_at in $update |

---

## 5. Including Auto-Increment Primary Key in `$update`

### Category
Reliability

### Description
Including the auto-increment primary key in `upsert()`'s `$update` array, causing unexpected PK overwrites and broken foreign key references.

### Preferred Alternative
```php
User::upsert(
    $apiUsers,
    ['email'],
    ['name', 'email', 'updated_at' => now()] // id excluded
);
```

### Detection Checklist
- [ ] Search for auto-increment columns in `upsert()` $update
- [ ] Remove PK from $update array
- [ ] For UUID PKs, verify inclusion is intentional

### Related
| Rule | `05-rules.md` — Never Include Auto-Increment PK in $update |

---

## 6. Not Validating Incoming Data Before `upsert()`

### Category
Security

### Description
Passing untrusted data directly to `upsert()` without validation, bypassing Eloquent's attribute casting, accessors, and mutators.

### Preferred Alternative
```php
$validated = collect($externalApiData)->map(fn($row) => [
    'email' => filter_var($row['email'], FILTER_VALIDATE_EMAIL),
    'name' => strip_tags($row['name']),
    'is_admin' => filter_var($row['is_admin'] ?? false, FILTER_VALIDATE_BOOLEAN),
    'updated_at' => now(),
]);
User::upsert($validated->toArray(), ['email'], ['name', 'is_admin', 'updated_at']);
```

### Detection Checklist
- [ ] Review upsert call sites for data validation
- [ ] Validate and sanitize all external data before upsert
- [ ] Cast security-sensitive fields explicitly

### Related
| Rule | `05-rules.md` — Validate All Incoming Data Before upsert |
