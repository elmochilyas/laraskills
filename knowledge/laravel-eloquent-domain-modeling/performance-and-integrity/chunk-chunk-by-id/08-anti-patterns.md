# chunk vs chunkById — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | chunk / chunkById |
| Focus | Anti-patterns in chunk iteration, mutation safety, checkpointing, and key column usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Using `chunk()` Instead of `chunkById()` for Mutable Datasets | Reliability | Critical |
| 2 | No Transaction Wrapping in Chunk Callbacks | Reliability | High |
| 3 | No Checkpoint for Resumable Batch Jobs | Reliability | Medium |
| 4 | Modifying the Key Column Inside `chunkById()` | Reliability | Critical |
| 5 | Using `chunkById()` on Non-Indexed Columns | Performance | Critical |
| 6 | Chunk Size Too Small or Too Large | Performance | Medium |
| 7 | Running Chunked Processing in Web Requests | Architecture | Critical |
| 8 | Using `chunkById()` on Non-Unique Columns | Reliability | Critical |

---

## 1. Using `chunk()` Instead of `chunkById()` for Mutable Datasets

### Category
Reliability

### Description
Using offset-based `chunk()` for batch updates or deletes where the dataset changes during iteration, causing offset drift that skips or duplicates rows.

### Warning Signs
- `chunk(N)` followed by `->delete()`, `->update()`, or other mutations
- Rows missed or processed twice in batch jobs
- Comments like "some rows were skipped" or "processed twice"

### Preferred Alternative
```php
User::chunkById(100, function ($users) {
    $users->each->delete();
});
```

### Detection Checklist
- [ ] Search for `chunk(` calls
- [ ] Replace with `chunkById()` for any mutation during iteration
- [ ] Keep `chunk()` only for read-only, static datasets

### Related
| Rule | `05-rules.md` — Default to chunkById for Mutable Datasets |

---

## 2. No Transaction Wrapping in Chunk Callbacks

### Category
Reliability

### Description
Not wrapping chunk callback body in `DB::transaction()` when performing writes, causing partial state persistence if the callback throws mid-batch.

### Preferred Alternative
```php
User::chunkById(100, function ($users) {
    DB::transaction(function () use ($users) {
        $users->each(fn($u) => $u->update(['processed_at' => now()]));
    });
});
```

### Detection Checklist
- [ ] Search for chunk callbacks with write operations no transaction
- [ ] Add `DB::transaction()` wrapping
- [ ] Verify atomicity per chunk

### Related
| Rule | `05-rules.md` — Wrap Chunk Callbacks in Transactions |

---

## 3. No Checkpoint for Resumable Batch Jobs

### Category
Reliability

### Description
Not saving the last processed ID as a checkpoint, requiring full reprocessing if the job fails midway.

### Preferred Alternative
```php
$lastId = Cache::get('user_report_last_id', 0);
User::where('id', '>', $lastId)->chunkById(100, function ($users) {
    $users->each(fn($u) => $u->generateReport());
    Cache::put('user_report_last_id', $users->last()->id);
});
```

### Detection Checklist
- [ ] Review chunk jobs for checkpoint mechanism
- [ ] Add cache/key-based checkpoint tracking
- [ ] Verify resumption from failure point

### Related
| Rule | `05-rules.md` — Store Checkpoints for Resumability |

---

## 4. Modifying the Key Column Inside `chunkById()`

### Category
Reliability

### Description
Updating the column used for `chunkById()` pagination inside the callback, causing the next batch to use an incorrect cursor value.

### Preferred Alternative
```php
User::chunkById(100, function ($users) {
    $users->each(fn($u) => $u->update(['name' => Str::random(8)])); // Not key column
});
```

### Detection Checklist
- [ ] Search for key column updates inside `chunkById()` callbacks
- [ ] Verify only non-key columns are modified
- [ ] Use `chunk()` or reprocess with explicit ID tracking if key must change

### Related
| Rule | `05-rules.md` — Never Modify the Key Column Inside chunkById |

---

## 5. Using `chunkById()` on Non-Indexed Columns

### Category
Performance

### Description
Using `chunkById()` with a key column that has no database index, causing each chunk query to perform a full table scan.

### Preferred Alternative
```php
Schema::table('logs', function ($table) {
    $table->string('batch_id')->index();
});
```

### Detection Checklist
- [ ] Review `chunkById()` key columns for indexes
- [ ] Add indexes on custom key columns
- [ ] Verify `EXPLAIN` shows index usage

### Related
| Rule | `05-rules.md` — Ensure the Key Column Is Indexed |

---

## 6. Chunk Size Too Small or Too Large

### Category
Performance

### Description
Setting chunk batch size too small (excessive query count) or too large (memory exhaustion, long-running queries).

### Preferred Alternative
```php
User::chunkById(500, function ($users) { ... }); // 100-1000 range
```

### Detection Checklist
- [ ] Review chunk sizes outside 100-1000 range
- [ ] Tune for model complexity (smaller for heavy relations)
- [ ] Monitor memory usage and query count

### Related
| Rule | `05-rules.md` — Set Batch Size Between 100 and 1000 |

---

## 7. Running Chunked Processing in Web Requests

### Category
Architecture

### Description
Executing chunked batch processing in a web controller or middleware, risking HTTP timeout and connection pool exhaustion.

### Preferred Alternative
```php
class ExportAllUsersJob implements ShouldQueue
{
    public function handle(): void
    {
        User::chunkById(100, function ($users) { /* ... */ });
    }
}
```

### Detection Checklist
- [ ] Search for chunk functions in controllers
- [ ] Move to queue jobs or artisan commands
- [ ] Verify no long-running database iteration in request-response cycle

### Related
| Rule | `05-rules.md` — Do Not Run Chunked Processing in Web Requests |

---

## 8. Using `chunkById()` on Non-Unique Columns

### Category
Reliability

### Description
Passing a non-unique column (`status`, `type`, `category`) to `chunkById()`, causing infinite loops or skipped rows.

### Preferred Alternative
```php
User::chunkById(100, fn($users) => ..., 'id'); // Primary key — unique, monotonically increasing
```

### Detection Checklist
- [ ] Review `chunkById()` key column for uniqueness and monotonic increase
- [ ] Default to primary key
- [ ] For UUIDs, use ordered UUIDs or a timestamp column

### Related
| Rule | `05-rules.md` — Never Use chunkById on Non-Unique Columns |
