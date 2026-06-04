# Seeding Strategies

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Factories & Seeders
- **Last Updated:** 2026-06-02

## Executive Summary
Seeding strategies define the approach to populating databases with test, demo, and reference data. The choice of strategy affects seed speed, data quality, test reliability, and development velocity. Key strategies include migration + seed workflows (`migrate:fresh --seed`), sequential vs. random data generation, idempotent seeding, and environment-specific datasets.

## Core Concepts
- **Migration + seed workflow:** `php artisan migrate:fresh --seed` drops all tables, re-runs migrations, then seeds. The standard for resetting and populating development databases.
- **Sequential data:** Predictable, ordered data generated via sequences. Good for deterministic tests. Always produces the same output for the same seed.
- **Random data:** Faker-based data. Realistic variety. Non-deterministic — may produce different results on each run.
- **Idempotent seeding:** Seeders that can run multiple times without duplicates. Uses `firstOrCreate()`, `truncate()`, or upsert patterns.
- **Batch sizing:** The number of models created per seeder call. Affects memory usage, execution time, and data relationship complexity.
- **Factory vs. raw insert:** Factories provide convenience and relationship handling. Raw inserts (`DB::table()->insert()`) provide maximum speed for bulk data.

## Mental Models
- **Refresh cycle:** Think of `migrate:fresh --seed` as reformatting a hard drive and reinstalling the OS — complete reset to a known state.
- **Deterministic vs. stochastic data:** Sequential seeding is like a fixed recipe (same ingredients, same result). Random seeding is like cooking without measuring — similar but not identical each time.
- **Seeding as a transaction:** Approach large seed operations as atomic units. If any part fails, the entire seed should roll back to a consistent state.

## Internal Mechanics
- `migrate:fresh --seed` is a composite Artisan command. It calls `migrate:fresh` (drops + re-runs all migrations), then `db:seed` (runs `DatabaseSeeder`).
- `db:seed` accepts `--class` to run a specific seeder, `--force` to bypass production confirmation.
- Factory `create()` issues individual INSERT statements. For bulk seeding, raw `insert()` with batches of 100-500 rows is significantly faster.
- The `DatabaseSeeder` runs inside a default transaction only if the database driver supports DDL transactions (MySQL does not for `migrate:fresh`; PostgreSQL does).

## Patterns
### Fast Fresh Seed for Development
```bash
php artisan migrate:fresh --seed --force
```

### Sequential Demo Data
```php
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['admin', 'editor', 'viewer'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        User::factory()->count(10)
            ->sequence(fn ($seq) => ['role' => $roles[$seq->index % 3]])
            ->create();
    }
}
```

### Random Demo Data with Fixed Seed
```php
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        fake()->seed(12345);  // Fixed seed for reproducibility
        User::factory()->count(100)->create();
    }
}
```

### Bulk Raw Insert for Performance
```php
public function run(): void
{
    $users = [];
    for ($i = 0; $i < 10000; $i++) {
        $users[] = [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    foreach (array_chunk($users, 500) as $chunk) {
        DB::table('users')->insert($chunk);
    }
}
```

### Idempotent Reference Data Seeding
```php
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'admin', 'guard_name' => 'web'],
            ['name' => 'editor', 'guard_name' => 'web'],
            ['name' => 'viewer', 'guard_name' => 'web'],
        ];
        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['name' => $role['name']],
                $role
            );
        }
    }
}
```

### Transactional Seed Wrapper
```php
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $this->callSilent(RoleSeeder::class);
            $this->call(UserSeeder::class);
            $this->call(PostSeeder::class);
        });
    }
}
```

## Architectural Decisions
### Decision: Factory Seeding vs. Raw Insert Seeding
- **Factory seeding:** Uses relationship handling, states, sequences, callbacks. Best for complex data with relationships. Slower due to per-model overhead.
- **Raw insert:** Bypasses Eloquent entirely. Maximum speed for bulk data. No relationship handling.
- **Tradeoff:** Factories for relationship complexity; raw inserts for pure speed. Use factories for <1,000 records, raw inserts for 10,000+.

### Decision: Sequential vs. Random Data
- **Sequential:** Predictable, deterministic, testable. Best for tests and demo data where specific scenarios must be reproducible.
- **Random:** More realistic variety. Best for development environments where exploring different data states is valuable.
- **Tradeoff:** Sequential is reliable but may not catch edge cases. Random finds more issues but is non-deterministic for tests.

### Decision: Idempotent vs. Truncate-and-Seed
- **Idempotent:** Seeders can run multiple times safely. Adds overhead of existence checks. Good for reference data that must persist.
- **Truncate-and-seed:** Clear then re-populate. Simple, pure. Good for demo data that should be replaced fresh each time.
- **Tradeoff:** Idempotent is safer for shared databases. Truncate is simpler for local development.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Factories handle relationships automatically | Slower than raw inserts for bulk data | Use factories for relational seeding; raw for flat bulk data |
| Sequential data is deterministic | May miss edge cases discovered with random data | Use sequential for tests, random for dev exploration |
| Raw inserts are 10-100x faster | No relationship wiring, no events, manual FK management | Acceptable for non-relational reference data |
| Idempotent seeders are safe for re-runs | Extra query per row for existence check | Use only for reference seeders; truncate for demo seeders |
| Fixed Faker seed gives reproducibility | Identical data on every run loses variety | Use fixed seed for CI tests, random seed for development |

## Performance Considerations
- Raw inserts with batch chunking (500-1000 rows) are the fastest seeding method. 10,000 rows in <1 second vs. 30+ seconds via factories.
- Factories issue one INSERT per model. 1,000 models = 1,000 queries. Wrapping in `DB::transaction()` reduces overhead but still issues individual inserts.
- `fake()->unique()` maintains an in-memory set. For large datasets (10,000+), it becomes memory-heavy and slow. Remove unique constraints or use raw SQL for truly large sets.
- Index maintenance: Bulk inserts may be slower with many indexes. Consider dropping non-critical indexes before seeding and rebuilding afterward.

## Production Considerations
- Never use demo data seeders in production. Guard with `app()->environment('local', 'staging')`.
- Production seeding should be limited to essential reference data (roles, permissions, settings).
- Always run `php artisan db:seed --force` explicitly in deployment scripts — do not rely on interactive confirmation.
- For production deployments, consider SQL dump files instead of seeders for reference data — faster and fully auditable.
- Use `php artisan db:seed --class=SpecificSeeder` to run targeted seeders during deployments.

## Common Mistakes
**Mistake: Using factories for 10,000+ records.**
Why it happens: Factories are the default go-to for seeding.
Why it's harmful: Extremely slow execution, potential timeout for Artisan commands.
Better approach: Use raw inserts with batch chunking for large datasets.

**Mistake: Not using a fixed Faker seed in CI tests.**
Why it happens: Default Faker behavior is random.
Why it's harmful: Tests pass locally but fail in CI due to different random data.
Better approach: Set `fake()->seed(12345)` in test setUp or seeder.

**Mistake: Running `migrate:fresh --seed` on shared development databases.**
Why it happens: Default habit for local development without considering team members.
Why it's harmful: Destroys other developers' data in shared databases.
Better approach: Use SQLite or separate database per developer for development seeding.

## Failure Modes
1. **Seed timeout:** Large factory-based seeding exceeds PHP `max_execution_time`. Mitigation: use raw inserts for bulk data, increase timeout for CLI commands.
2. **Unique constraint violation on re-seed:** Repeated `db:seed` without truncation. Mitigation: idempotent seeders or truncate before seeding.
3. **Memory exhaustion from `fake()->unique()`:** Large uniqueness tracking set. Mitigation: batch uniqueness checking manually or remove unique constraints.
4. **Foreign key violation on out-of-order seeding:** Referenced data not yet seeded. Mitigation: order seeders by dependency, use nullable FKs.

## Ecosystem Usage
- **Laravel Jetstream:** Uses `migrate:fresh --seed` in CI pipeline with factory-based team seeding.
- **Laravel Spark:** Employs raw insert seeding for default subscription plans and features.
- **Laravel Nova:** Test suite uses sequential seeding with fixed Faker seeds for deterministic test data.

## Related Knowledge Units


### Prerequisites
- Model Design
- Model Lifecycle
- Seeder Organization
- Factory Definition
- Migrations

### Related Topics
- Environment-Specific Seeding
- Factory Performance
- Artisan Commands

### Advanced Follow-up Topics
- Database CI/CD
- SQL Dump Seeding
- Parallel Seeding


## Research Notes
- **Source Analysis:** `php artisan migrate:fresh --seed` is defined in `Illuminate\Database\Console\Migrations\FreshCommand`. It runs `migrate:fresh`, then calls `db:seed` internally.
- **Key Insight:** The biggest performance gain in seeding comes from replacing factory `create()` with raw `insert()` for bulk data. For reference data, idempotent seeding with `firstOrCreate()` is the safest pattern.
- **Version-Specific Notes:** Laravel 8 introduced class-based factories, making factory seeding the primary pattern. Laravel 9+ added `--seeder` option to `migrate:fresh` for specifying a specific seeder. Laravel 10+ improved `db:seed` transaction handling for PostgreSQL.
