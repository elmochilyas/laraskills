# Seeding Strategies — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Seeding Strategies |
| Focus | Anti-patterns in database seeding strategy, bulk data, and workflow |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Factory Overhead for Flat Bulk Data | Performance | High |
| 2 | Single Large Batch Causing Memory Exhaustion | Performance | High |
| 3 | Incremental Seeding Instead of Fresh Seed | Testing | Medium |
| 4 | Non-Atomic Large Seed Operations | Reliability | High |
| 5 | Using Factory `create()` When Raw Insert Would Suffice | Performance | Medium |

## Repository-Wide Cross-Cutting Patterns

- The most critical performance anti-pattern is using Eloquent factories for flat bulk data, causing 5-10x slower seeding with unnecessary model hydration and event dispatch
- Failing to batch large datasets leads to PHP memory exhaustion and failed seeding operations
- Not wrapping large seed operations in transactions risks half-seeded database state on failure

---

## 1. Factory Overhead for Flat Bulk Data

### Category
Performance

### Description
Using Eloquent factories with `->count(N)->create()` for flat lookup tables (zip codes, categories, tags) that have no relationships and don't need Eloquent events, instead of using raw `DB::table()->insert()`.

### Why It Happens
Factories are the standard data generation tool. Developers use them uniformly for all data without distinguishing between complex model graphs and simple flat tables.

### Warning Signs
- Factory `->count(N)->create()` for lookup/reference tables with no relationships
- Seeding takes significantly longer than expected for the data volume
- Model events fire for simple lookup data that doesn't need them
- Comments like "using factory but could use raw insert"

### Why Harmful
- Factory `create()` hydrates full Eloquent models, fires events, runs observers — all unnecessary for flat data
- Raw `DB::table()->insert()` achieves the same result 5-10x faster
- CI and development seeding delays accumulate over time
- Server resources are wasted on unnecessary object instantiation

### Preferred Alternative
```php
$tags = collect(range(1, 10000))->map(fn ($i) => ['name' => "tag-{$i}"])->all();
DB::table('tags')->insert($tags);
```

### Detection Checklist
- [ ] Identify flat lookup tables with no relationships
- [ ] Check if factories are used for these tables
- [ ] Measure seeding time — compare factory vs raw insert
- [ ] Replace factory `create()` with `DB::table()->insert()` for flat data

### Related
| Rule | `05-rules.md` — Use Raw DB::table()->insert() for Bulk Performance |
| Rule | `05-rules.md` — Use Factories for Relationships, Raw Inserts for Bulk Flat Data |
| Decision Tree | `07-decision-trees.md` — Factory vs Raw DB::insert for Bulk Data |

---

## 2. Single Large Batch Causing Memory Exhaustion

### Category
Performance

### Description
Creating 10,000+ models in a single `factory()->count(N)->create()` call, which hydrates all models into memory simultaneously and can exceed PHP's memory limit.

### Why It Happens
Developers don't realize that `->count(N)->create()` loads all N models into memory at once. The approach works fine for small N but fails silently (or with a memory error) for large N.

### Warning Signs
- `factory()->count(50000)->create()` or similar large single-batch calls
- `Allowed memory size exhausted` errors during seeding
- Seeding that works on machines with lots of RAM but fails on limited environments
- PHP memory limit increases committed to accommodate seeding

### Preferred Alternative
```php
foreach (range(1, 50) as $batch) {
    User::factory()->count(1000)->create();
}
```

### Detection Checklist
- [ ] Search for `->count(\d{5,})` patterns in seeders
- [ ] Check memory usage during large batch creation
- [ ] Break single large batches into chunks of ~1000

### Related
| Rule | `05-rules.md` — Batch Large Seed Sets to Avoid Memory Exhaustion |
| Decision Tree | `07-decision-trees.md` — Batch Size for Large Datasets |

---

## 3. Incremental Seeding Instead of Fresh Seed

### Category
Testing

### Description
Using `php artisan migrate` followed by `php artisan db:seed` (incremental) instead of `php artisan migrate:fresh --seed` (fresh), causing inconsistent database states from leftover data.

### Why It Happens
Developers follow the step-by-step workflow without realizing that leftover data from previous schema versions or manual testing creates inconsistencies that are hard to diagnose.

### Warning Signs
- Documentation says "run `migrate` then `db:seed`" instead of `migrate:fresh --seed`
- Tests that fail on one developer's machine but pass on another
- Stale data from deleted migrations still present in the database
- Comments like "works on my machine" for seeding-related test failures

### Preferred Alternative
```bash
php artisan migrate:fresh --seed
```

### Detection Checklist
- [ ] Verify the standard dev workflow uses `migrate:fresh --seed`
- [ ] Check for leftover data when running migrations incrementally
- [ ] Update workflow documentation to use fresh seed

### Related
| Rule | `05-rules.md` — Use migrate:fresh --seed as the Default Development Workflow |
| Skill | `06-skills.md` — Set Up migrate:fresh --seed Development Workflow |

---

## 4. Non-Atomic Large Seed Operations

### Category
Reliability

### Description
Running large multi-insert seeding operations without wrapping them in explicit `DB::transaction()`, risking a half-seeded database state on failure.

### Why It Happens
Developers assume seeding always succeeds. Individual insert statements each run in their own implicit transaction (auto-commit mode), so a failure midway leaves some data committed and some not.

### Warning Signs
- Large loops of `Model::create()` or `DB::table()->insert()` without a surrounding transaction
- Half-seeded database states after a failed deployment
- Manual cleanup required after seeding failures
- Comments like "if this fails, just run it again"

### Preferred Alternative
```php
DB::transaction(function () {
    foreach (range(1, 1000) as $i) {
        Badge::create(['name' => "badge-{$i}"]);
    }
});
```

### Detection Checklist
- [ ] Search for bulk insert/create loops without `DB::transaction()`
- [ ] Check for seeders that should be atomic but aren't wrapped
- [ ] Add transaction wrapping for all large multi-insert operations

### Related
| Rule | `05-rules.md` — Wrap Large Seed Operations in Explicit Transactions |
| Decision Tree | `07-decision-trees.md` — Transaction Strategy for Seeding |

---

## 5. Using Factory `create()` When Raw Insert Would Suffice

### Category
Performance

### Description
Using `factory()->count(N)->create()` when the data does not need Eloquent events, relationships, or attribute casting, and a raw `DB::table()->insert()` would be faster.

### Why It Happens
Factories are the path of least resistance. Developers use them without considering whether the Eloquent overhead is actually needed for the specific data being seeded.

### Warning Signs
- `factory()->count(N)->create()` for records that have no relationships or events
- Seeding that takes significantly longer than the raw equivalent
- Seeders that create models purely for data presence without needing Eloquent features
- Performance profiling showing factory hydration as the bottleneck

### Preferred Alternative
```php
// Factory when relationships/events needed
User::factory()->has(Post::factory()->count(3))->create();

// Raw insert when only data presence matters
$data = User::factory()->count(1000)->raw();
DB::table('users')->insert($data);
```

### Detection Checklist
- [ ] Review each factory `create()` call — does it use relationships, events, or casting?
- [ ] Check if `raw()` + `DB::insert()` would produce equivalent results faster
- [ ] Profile seeding performance to identify factory overhead

### Related
| Rule | `05-rules.md` — Use Raw DB::table()->insert() for Bulk Performance |
| Decision Tree | `07-decision-trees.md` — Factory vs Raw DB::insert for Bulk Data |
