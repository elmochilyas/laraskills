# cursor — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | cursor |
| Focus | Anti-patterns in cursor iteration, relationship access, materialization, and connection management |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Accessing Relationships Inside a Cursor Loop (N+1) | Performance | Critical |
| 2 | Using `cursor()` in Web Controllers | Architecture | Critical |
| 3 | Materializing the LazyCollection via `->toArray()` or `->all()` | Performance | Critical |
| 4 | Not Setting Connection Timeout for Long-Running Cursor Jobs | Reliability | High |
| 5 | Not Using `READ UNCOMMITTED` for Read-Only Cursor Processing | Performance | High |
| 6 | Chaining `with()` Before `cursor()` (Silently Ignored) | Performance | Medium |

---

## 1. Accessing Relationships Inside a Cursor Loop (N+1)

### Category
Performance

### Description
Accessing Eloquent relationships inside a `cursor()` loop, where eager loading (`with()`) is silently ignored, causing N+1 query explosion per row.

### Warning Signs
- `$user->profile`, `$user->posts` inside a cursor foreach
- N+1 query explosion (100k rows → 100k+1 queries)
- Comments like "cursor with relationship is slow"

### Preferred Alternative
```php
foreach (User::cursor() as $user) {
    echo $user->name; // No relationship access — single query only
}
```

### Detection Checklist
- [ ] Search for cursor loops with relationship access
- [ ] Remove relationship access from cursor iteration
- [ ] Use `lazy()` with `with()` when relationships are needed

### Related
| Rule | `05-rules.md` — Never Access Relationships Inside a Cursor Loop |

---

## 2. Using `cursor()` in Web Controllers

### Category
Architecture

### Description
Iterating `cursor()` in a web controller or middleware, holding the database connection open for the entire HTTP response and risking connection pool starvation.

### Preferred Alternative
```php
class ExportUsersJob implements ShouldQueue
{
    public function handle(): void
    {
        foreach (User::cursor() as $user) { /* ... */ }
    }
}
```

### Detection Checklist
- [ ] Search for `cursor()` in controllers/middleware
- [ ] Move to queue jobs or artisan commands
- [ ] Never allow cursor in request-response cycle

### Related
| Rule | `05-rules.md` — Only Use Cursor in CLI or Queue Contexts |

---

## 3. Materializing the LazyCollection via `->toArray()` or `->all()`

### Category
Performance

### Description
Calling `->toArray()`, `->all()`, `->count()`, or `collect()` on the `LazyCollection` returned by `cursor()`, loading the full dataset into memory.

### Preferred Alternative
```php
foreach (User::cursor() as $user) {
    // One model at a time
}
```

### Detection Checklist
- [ ] Search for `->toArray()`, `->all()`, `->count()` on cursor results
- [ ] Replace with iteration or lazy chain methods
- [ ] Use `get()` for small datasets instead of cursor

### Related
| Rule | `05-rules.md` — Do Not Materialize the LazyCollection |

---

## 4. Not Setting Connection Timeout for Long-Running Cursor Jobs

### Category
Reliability

### Description
Running cursor iteration longer than the database's `wait_timeout`, causing mid-iteration disconnection and partial processing.

### Preferred Alternative
```php
DB::statement('SET SESSION wait_timeout = 3600');
foreach (User::cursor() as $user) { /* ... */ }
```

### Detection Checklist
- [ ] Review cursor jobs for timeout configuration
- [ ] Set session timeout before cursor iteration
- [ ] Implement keepalive queries for very long jobs

### Related
| Rule | `05-rules.md` — Set a Generous Connection Timeout for Cursor Jobs |

---

## 5. Not Using `READ UNCOMMITTED` for Read-Only Cursor Processing

### Category
Performance

### Description
Iterating read-only cursor at default `REPEATABLE READ` isolation, risking deadlocks with concurrent writes.

### Preferred Alternative
```php
DB::statement('SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');
foreach (User::cursor() as $user) { /* ... */ }
```

### Detection Checklist
- [ ] Review read-only cursor jobs for isolation level
- [ ] Set to `READ UNCOMMITTED` for read-only processing
- [ ] Use `READ COMMITTED` if dirty reads are unacceptable

### Related
| Rule | `05-rules.md` — Use READ UNCOMMITTED for Read-Only Cursor Processing |

---

## 6. Chaining `with()` Before `cursor()` (Silently Ignored)

### Category
Performance

### Description
Adding `with('relation')->cursor()` believing relationships are eagerly loaded, when `with()` is silently ignored and relationships trigger N+1 inside the loop.

### Preferred Alternative
```php
// No with() — cursor works with model columns only
foreach (User::cursor() as $user) {
    echo $user->name;
}
```

### Detection Checklist
- [ ] Search for `->with(` before `->cursor()`
- [ ] Remove `with()` calls before cursor
- [ ] Use `lazy()` with `with()` when relationships are needed

### Related
| Rule | `05-rules.md` — Never Add with() Before cursor() |
