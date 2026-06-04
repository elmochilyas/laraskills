# Seeding Strategies Rules

## Rule 1: Use firstOrCreate() or updateOrCreate() for Idempotent Reference Seeders
---
## Category
Reliability
---
## Rule
Always use `firstOrCreate()` or `updateOrCreate()` in reference data seeders to ensure they can run multiple times without duplication.
---
## Reason
Reference seeders (roles, permissions, settings) execute on every deploy. `insert()` creates duplicates on re-run. `firstOrCreate()` checks for existing records before inserting, guaranteeing identical state regardless of execution count.
---
## Bad Example
```php
public function run(): void
{
    DB::table('roles')->insert(['name' => 'admin']); // Duplicates on second run
}
```
---
## Good Example
```php
public function run(): void
{
    Role::firstOrCreate(['name' => 'admin']);
}
```
---
## Exceptions
When using `DB::table()->truncate()` followed by `insert()` inside an explicit `app()->environment('local')` guard. Never use truncate outside local.
---
## Consequences Of Violation
Reliability: duplicate key exceptions on seeder re-run. Data integrity: accumulated garbage records in reference tables.
---

## Rule 2: Use migrate:fresh --seed as the Default Development Workflow
---
## Category
Testing
---
## Rule
Always recommend `php artisan migrate:fresh --seed` (or `migrate:fresh --seed`) as the standard development database refresh command.
---
## Reason
Incremental seeding on an existing database produces inconsistent states — records left over from previous schema versions, mutated data from manual testing, and partial migrations. A fresh migration + seed guarantees a clean, consistent starting point identical across all developer machines.
---
## Bad Example
```php
// Incremental — inconsistent across environments
php artisan migrate
php artisan db:seed
```
---
## Good Example
```php
// Fresh — clean, consistent, reproducible
php artisan migrate:fresh --seed
```
---
## Exceptions
When working on a shared development database where dropping tables is not possible. Use `migrate --seed` but document the inconsistency risk.
---
## Consequences Of Violation
Reliability: stale data from previous migrations causes hard-to-diagnose test failures. Developer friction: "works on my machine" due to different incremental states.
---

## Rule 3: Batch Large Seed Sets to Avoid Memory Exhaustion
---
## Category
Performance
---
## Rule
Chunk or batch large dataset creations (10,000+ records) to prevent PHP memory exhaustion.
---
## Reason
Creating 50,000 Eloquent models in a single `factory()->count()->create()` call hydrates all models into memory simultaneously. This can exceed PHP's memory limit. Batching or chunking processes records in smaller groups, keeping memory usage bounded.
---
## Bad Example
```php
User::factory()->count(50000)->create(); // May exhaust PHP memory
```
---
## Good Example
```php
foreach (range(1, 50) as $batch) {
    User::factory()->count(1000)->create();
}
```
---
## Exceptions
When the total dataset is small (under 1,000 records). The default single-call behavior is fine for small datasets.
---
## Consequences Of Violation
Performance: seeding crashes with `Allowed memory size exhausted` error. Reliability: partial seeding with no transaction rollback.
---

## Rule 4: Use Raw DB::table()->insert() for Bulk Performance
---
## Category
Performance
---
## Rule
Use `DB::table('table')->insert()` with raw arrays when seeding thousands of records that do not need Eloquent events or relationships.
---
## Reason
Eloquent's `create()` fires model events, runs observers, hydrates full objects, and performs individual inserts. Raw `DB::insert()` bypasses all of this, achieving 5-10x faster bulk inserts for reference data, lookup tables, and large demo datasets.
---
## Bad Example
```php
// Eloquent overhead for simple lookup data
foreach (range(1, 10000) as $i) {
    Tag::create(['name' => "tag-{$i}"]);
}
```
---
## Good Example
```php
$data = [];
foreach (range(1, 10000) as $i) {
    $data[] = ['name' => "tag-{$i}"];
}
DB::table('tags')->insert($data); // Single bulk insert
```
---
## Exceptions
When the models need Eloquent events (search indexing, cache invalidation, notification dispatch). Use factories with `create()` and accept the performance trade-off.
---
## Consequences Of Violation
Performance: seeding time is 5-10x longer than necessary. Developer experience: slow setup delays development and CI.
---

## Rule 5: Use Factories for Relationships, Raw Inserts for Bulk Flat Data
---
## Category
Performance
---
## Rule
Use raw `DB::insert()` for bulk flat data without relationships; use factories for complex graphs with relationships.
---
## Reason
Factories handle foreign key resolution, pivot table insertion, and nested graph creation — but with overhead. For simple, flat tables (zip codes, categories, lookup tables) that have no relationships, raw inserts are faster and simpler. Mixing the two strategies optimizes for both correctness and speed.
---
## Bad Example
```php
// Factory overhead for a flat lookup table that has no relationships
ZipCode::factory()->count(50000)->create();
```
---
## Good Example
```php
// Raw insert for flat data
$zips = collect(range(1, 50000))->map(fn ($i) => ['code' => "{$i:05}"])->all();
DB::table('zip_codes')->insert($zips);

// Factory for graph data
User::factory()->has(Post::factory()->count(3))->create();
```
---
## Exceptions
No common exceptions. The strategy choice is dictated purely by whether the data has relationships.
---
## Consequences Of Violation
Performance: 5-10x slower seeding for flat data. Maintainability: factories are overkill for simple lookup tables.
---

## Rule 6: Wrap Large Seed Operations in Explicit Transactions
---
## Category
Reliability
---
## Rule
Wrap multi-insert seed operations inside explicit `DB::transaction()` calls to ensure atomicity.
---
## Reason
A partial seed failure (constraint violation, connection drop, out-of-memory) leaves the database in an inconsistent half-seeded state. A transaction ensures the entire seed set succeeds or is fully rolled back.
---
## Bad Example
```php
public function run(): void
{
    foreach (range(1, 1000) as $i) {
        Badge::create(['name' => "badge-{$i}"]); // No transaction — partial failure risk
    }
}
```
---
## Good Example
```php
public function run(): void
{
    DB::transaction(function () {
        foreach (range(1, 1000) as $i) {
            Badge::create(['name' => "badge-{$i}"]);
        }
    });
}
```
---
## Exceptions
When seeding into a database engine that does not support transactions (some MyISAM tables). Document the engine limitation.
---
## Consequences Of Violation
Reliability: half-seeded database state after a failure. Data integrity: orphaned records with missing references.
---

## Rule 7: Use Sequences for Deterministic Seeding, Faker for Realistic Seeding
---
## Category
Testing
---
## Rule
Choose `sequence()` for deterministic, repeatable seeding in test environments; choose Faker for realistic, varied seeding in development environments.
---
## Reason
Tests need deterministic data — the same seed output every run ensures assertions pass or fail consistently. Developers need realistic data — varied names, addresses, and content surface UI and validation issues. The choice depends entirely on the audience: tests vs. humans.
---
## Bad Example
```php
// Faker in tests — non-deterministic, flaky
public function test_user_count(): void
{
    User::factory()->count(3)->create();
}
```
---
## Good Example
```php
// Sequence in tests — deterministic
public function test_user_count(): void
{
    User::factory()
        ->count(3)
        ->sequence(['name' => 'Alice'], ['name' => 'Bob'], ['name' => 'Charlie'])
        ->create();
}

// Faker in demo seeder — realistic
public function run(): void
{
    User::factory()->count(100)->create(); // Realistic data for dev
}
```
---
## Exceptions
When Faker is used in tests with a fixed seed (`fake()->seed(12345)`) for reproducibility. This is acceptable but still less predictable than sequences.
---
## Consequences Of Violation
Testing: flaky tests that fail sporadically. Development: unrealistic data that misses edge cases.
---
