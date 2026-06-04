# Select Constraints — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Select Constraints |
| Focus | Anti-patterns in SELECT *, partial model saves, constrained eager loading, and serialization vs I/O confusion |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | `SELECT *` Everywhere (No Explicit Column Selection) | Performance | High |
| 2 | Saving Partial Models (Loaded via `select()`) | Reliability | Critical |
| 3 | Missing Foreign Key in Constrained Eager Loading Selects | Reliability | High |
| 4 | Using `$hidden` Instead of `select()` for Sensitive/I/O Columns | Security | Critical |
| 5 | Same Column Select for List and Detail Views | Performance | Medium |

---

## 1. `SELECT *` Everywhere (No Explicit Column Selection)

### Category
Performance

### Description
Never specifying columns, always relying on `SELECT *`. For a model with 20+ columns but views that only use 3, this wastes bandwidth and memory on every query.

### Preferred Alternative
```php
$users = User::select('id', 'name', 'email')->withCount('posts')->paginate(20);
```

### Detection Checklist
- [ ] Review list/index queries for `SELECT *`
- [ ] Add explicit `select()` with minimal columns
- [ ] Use `addSelect()` in scopes to extend column lists

### Related
| Rule | `05-rules.md` — Use Different Select Sets for List vs. Detail Views |

---

## 2. Saving Partial Models (Loaded via `select()`)

### Category
Reliability

### Description
Loading a model with `select()`, modifying it, and calling `save()`, which overwrites unloaded columns with null/default values — causing silent data loss.

### Preferred Alternative
```php
$user = User::find($id); // All columns loaded
$user->name = 'New Name';
$user->save();
```

### Detection Checklist
- [ ] Search for `select(` followed by `->save()`
- [ ] Use `fresh()` or re-fetch full model before saves
- [ ] Keep partial models for display-only code paths

### Related
| Rule | `05-rules.md` — Never Save Partial Models |

---

## 3. Missing Foreign Key in Constrained Eager Loading Selects

### Category
Reliability

### Description
Constraining eager loading with `select()` but omitting the foreign key, causing Eloquent to fail matching relations — they load but never attach to parents.

### Preferred Alternative
```php
Post::with(['comments' => fn($q) => $q->select('id', 'post_id', 'body')])->get();
// foreign key 'post_id' included — relations attach correctly
```

### Detection Checklist
- [ ] Search for constrained eager loading `select()` calls
- [ ] Verify foreign key column is always included
- [ ] Test that relations actually attach to parent models

### Related
| Rule | `05-rules.md` — Always Include the Foreign Key in Constrained Eager Loading |

---

## 4. Using `$hidden` Instead of `select()` for Sensitive/I/O Columns

### Category
Security

### Description
Relying on `$hidden` to protect sensitive columns (SSN, tokens) or avoid loading large columns (BLOB, TEXT). `$hidden` only filters serialization — data is still loaded into memory.

### Preferred Alternative
```php
// Never load sensitive data — select() prevents it from leaving DB
User::select('id', 'name', 'email')->paginate(20);
```

### Detection Checklist
- [ ] Review `$hidden` columns — should they use `select()` instead?
- [ ] Use `select()` for sensitive/large columns
- [ ] Keep `$hidden` only for serialization filtering, not I/O reduction

### Related
| Rule | `05-rules.md` — Use $hidden for Serialization, select() for I/O Reduction |
| Rule | `05-rules.md` — Never Select Sensitive Columns in Non-Privileged Queries |

---

## 5. Same Column Select for List and Detail Views

### Category
Performance

### Description
Using the same `SELECT *` or same column set for both list (index) and detail (show) views, loading large columns (TEXT, JSON) in list views where only a summary is needed.

### Preferred Alternative
```php
// List — minimal columns
public function index() {
    return Post::select('id', 'title', 'excerpt', 'published_at')->paginate(20);
}
// Detail — all columns
public function show($id) {
    return Post::select('id', 'title', 'body', 'excerpt', 'published_at')->findOrFail($id);
}
```

### Detection Checklist
- [ ] Compare index and show query column sets
- [ ] Differentiate select lists per view type
- [ ] Exclude large columns from list queries

### Related
| Rule | `05-rules.md` — Use Different Select Sets for List vs. Detail Views |
