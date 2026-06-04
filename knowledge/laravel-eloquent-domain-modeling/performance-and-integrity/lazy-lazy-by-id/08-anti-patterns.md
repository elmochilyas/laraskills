# lazy / lazyById — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | lazy / lazyById |
| Focus | Anti-patterns in lazy iteration, offset drift, materialization, eager loading, and chunk sizing |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Using `lazy()` Instead of `lazyById()` for Mutable Datasets | Reliability | Critical |
| 2 | Materializing a `LazyCollection` via `->toArray()` or `->all()` | Performance | Critical |
| 3 | Accessing Relationships Without `with()` Before `lazy()` | Performance | High |
| 4 | Wrong Chunk Size for Model Complexity | Performance | Medium |
| 5 | Using `lazy()` in Web Controllers | Architecture | High |
| 6 | Iterating a `LazyCollection` Twice | Reliability | Medium |

---

## 1. Using `lazy()` Instead of `lazyById()` for Mutable Datasets

### Category
Reliability

### Description
Using `lazy()` (offset-based) for batch mutations on live tables, where inserts/deletes during iteration cause offset drift — skipping or duplicating rows.

### Preferred Alternative
```php
User::lazyById(200)->each(function ($user) {
    $user->update(['processed_at' => now()]);
});
```

### Detection Checklist
- [ ] Search for `lazy(` with mutations in the loop
- [ ] Replace with `lazyById()`
- [ ] Keep `lazy()` only for read-only, static datasets

### Related
| Rule | `05-rules.md` — Use lazyById for Concurrent Scenarios by Default |

---

## 2. Materializing a `LazyCollection` via `->toArray()` or `->all()`

### Category
Performance

### Description
Calling `->toArray()`, `->all()`, `->count()`, or `collect()` on a `LazyCollection`, forcing all chunks into memory and defeating the purpose of lazy iteration.

### Preferred Alternative
```php
foreach (User::lazy(100) as $user) { /* one chunk at a time */ }
```

### Detection Checklist
- [ ] Search for `->toArray()`, `->all()`, `->count()` on lazy results
- [ ] Replace with iteration or lazy chain methods
- [ ] Use `get()` for small datasets instead

### Related
| Rule | `05-rules.md` — Never Materialize the LazyCollection |

---

## 3. Accessing Relationships Without `with()` Before `lazy()`

### Category
Performance

### Description
Accessing relationships inside a `lazy()` loop without calling `with()` first, triggering N+1 queries within each chunk.

### Preferred Alternative
```php
foreach (User::with('profile')->lazy(100) as $user) {
    echo $user->profile->display_name; // 1 extra query per chunk
}
```

### Detection Checklist
- [ ] Search for lazy loops with relationship access
- [ ] Add `with()` before `lazy()` for accessed relations
- [ ] Verify eager loading is working (not `cursor()` confusion)

### Related
| Rule | `05-rules.md` — Use with() Before lazy() for Relationships |

---

## 4. Wrong Chunk Size for Model Complexity

### Category
Performance

### Description
Using large chunk sizes (5000) for relation-heavy models or small chunks (50) for simple models, causing memory spikes or excessive query overhead.

### Preferred Alternative
```php
// Relation-heavy: small chunks
User::with('profile', 'posts', 'comments', 'settings', 'roles')
    ->lazy(100)
    ->each(fn($u) => ...);
// Simple model: larger chunks
User::lazy(1000)->each(fn($u) => ...);
```

### Detection Checklist
- [ ] Review chunk sizes against model complexity
- [ ] Smaller chunks for relation-heavy models (50-200)
- [ ] Larger chunks for simple models (1000-5000)

### Related
| Rule | `05-rules.md` — Size Chunks According to Model Complexity |

---

## 5. Using `lazy()` in Web Controllers

### Category
Architecture

### Description
Using `lazy()` or `lazyById()` iteration in a web controller, where processing time depends on dataset size and grows unpredictably over time.

### Preferred Alternative
```php
class GenerateReportJob implements ShouldQueue
{
    public function handle(): void
    {
        foreach (Post::lazy(100) as $post) { /* ... */ }
    }
}
```

### Detection Checklist
- [ ] Search for lazy iteration in controllers
- [ ] Move to queue jobs or artisan commands
- [ ] Verify no unbounded iteration in web requests

### Related
| Rule | `05-rules.md` — Place Lazy Iteration in CLI or Queue Contexts |

---

## 6. Iterating a `LazyCollection` Twice

### Category
Reliability

### Description
Attempting to iterate a `LazyCollection` more than once, getting zero results because the underlying generator cannot be rewound.

### Preferred Alternative
```php
// Create fresh query for each iteration
foreach (User::lazy(100) as $user) { /* first pass */ }
foreach (User::lazy(100) as $user) { /* second pass */ }
```

### Detection Checklist
- [ ] Search for multi-use lazy collection variables
- [ ] Create new query for re-iteration
- [ ] Materialize if truly multiple passes needed (defeats purpose — reconsider)

### Related
| Rule | `05-rules.md` — Never Iterate a LazyCollection Twice |
