# Environment-Specific Seeding

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Factories & Seeders
- **Last Updated:** 2026-06-02

## Executive Summary
Environment-specific seeding tailors database population to the current application environment (local, testing, staging, production). Different environments demand different data: production needs only essential reference data, while local development benefits from rich demo datasets. Laravel provides environment detection via `app()->environment()` and conditional logic in seeders to adapt data generation per environment.

## Core Concepts
- **Environment detection:** `App::environment('local')` returns boolean. Used inside seeders to conditionally execute logic. Accepts array for multiple environments.
- **Environment-aware seeding layers:**
  1. **Production:** Reference data only (roles, permissions, settings)
  2. **Staging:** Reference + limited demo data (synthetic but realistic)
  3. **Local:** Reference + rich demo data (many models, varied states)
  4. **Testing:** Minimal data (only what tests explicitly need)
- **Demo data separation:** Demo data is always in separate seeder classes, never mixed with reference data. Demo seeders are gated by environment checks.
- **Factory variance per environment:** Use different factory states or counts based on environment to produce appropriate data volumes.
- **Production guard:** `php artisan db:seed` prompts for confirmation in `production` environment. `--force` bypasses this.

## Mental Models
- **Environment layers as concentric circles:** Production data is the core (small, essential). Staging adds a thin layer. Local adds a thick outer layer. Each layer builds on the previous.
- **Water tap analogy:** Think of environment seeding like a water tap with different flow rates: production is a drip (just enough), staging is a stream, local is a fire hose.
- **Configuration-driven seeding:** The environment is a configuration input to the seeder. The seeder reads this input and adjusts its behaviour — data volume, data variety, data randomness.

## Internal Mechanics
- `App::environment()` reads `APP_ENV` from `.env`. Returns `'production'`, `'local'`, `'testing'`, etc.
- `php artisan db:seed` checks `App::environment('production')` and prompts unless `--force` is passed.
- Factory definitions have no built-in environment awareness. Environment logic is placed in seeders or conditional factory configuration.
- `config('app.env')` provides the same value as `app()->environment()`.

## Patterns
### Production Guarded Seeder
```php
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->callSilent(RoleSeeder::class);
        $this->callSilent(PermissionSeeder::class);

        if (App::environment('local')) {
            $this->call(DemoDataSeeder::class);
        }

        if (App::environment('staging')) {
            $this->call(StagingDataSeeder::class);
        }
    }
}
```

### Environment-Aware Data Volume
```php
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $userCount = match (App::environment()) {
            'local' => 100,
            'staging' => 20,
            'testing' => 5,
            default => 0,
        };

        User::factory()->count($userCount)->create();
    }
}
```

### Testing-Specific Seeder
```php
class TestingSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->create(['email' => 'test@example.com']);
        Role::firstOrCreate(['name' => 'default']);
    }
}
```

### Environment Configuration via Seeder Config
```php
// config/seed.php
return [
    'users' => [
        'count' => env('SEED_USER_COUNT', 10),
        'with_posts' => env('SEED_USER_POSTS', true),
    ],
];
```

### Conditional Factory States per Environment
```php
if (App::environment('local')) {
    User::factory()->count(100)->sequence(
        ['role' => 'admin'],
        ['role' => 'editor'],
        ['role' => 'viewer'],
    )->create();
} else {
    User::factory()->count(10)->create(['role' => 'viewer']);
}
```

## Architectural Decisions
### Decision: Environment Logic in Seeders vs. Configuration File
- **Seeder logic:** Simple, visible, self-contained. Best for small differences (run demo seeder or not).
- **Configuration file:** Externalizes volumes and flags. Best for large projects where data volumes are tuned by operations teams.

### Decision: Separate Seeder Files vs. Conditional Logic in One File
- **Separate files:** `DemoDataSeeder`, `StagingDataSeeder`, `TestingSeeder`. Clean separation, independently callable.
- **Conditional logic:** Single `DatabaseSeeder` with `if` blocks. Fewer files, everything visible in one place.

### Decision: Environment Variables vs. `APP_ENV` for Seeding Decisions
- **`APP_ENV`:** The standard Laravel environment indicator. Sufficient for most projects.
- **Custom env vars:** `SEED_USER_COUNT`, `SEED_DEMO_DATA=true`. More granular control without changing environment.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Production safety — never accidentally seed demo data | Environment logic adds complexity to seeders | Extract environment logic into base seeder class |
| Environment-specific volumes right-size data | Test suite may pass with small data but fail with large | Run CI tests with production-like data volumes periodically |
| Configuration-driven seeding is operations-friendly | Config file may not be version-controlled consistently | Commit default config; override via env vars in deployment |
| Separate seeder files are independently runnable | More files to maintain | Worth the overhead for projects >10 seeders |

## Performance Considerations
- Testing environments should seed minimal data. A testing seeder should run in <1 second.
- Local development seeding can be slow (1000+ models). Acceptable for occasional fresh seeds.
- Staging environments benefit from production-like volumes. Use raw inserts to keep seed time manageable.
- CI pipelines should cache seeded databases or use SQLite for speed.

## Production Considerations
- Never include a `DemoDataSeeder` in the default seeder chain without an environment guard.
- Always test production seeding on a staging environment before deploying. Verify only reference data is created.
- Use `php artisan db:seed --class=ProductionSeeder` explicitly in deployment scripts.
- Document seeding expectations per environment in the project's deployment guide.
- For production, consider using SQL dump files instead of seeders for reference data — fully auditable and exactly repeatable.

## Common Mistakes
**Mistake: No environment guard on demo data.**
Why it happens: Developer creates a demo seeder without considering production.
Why it's harmful: `php artisan db:seed --force` in production creates fake data.
Better approach: Always wrap demo seeders in `App::environment('local')` or `!App::environment('production')`.

**Mistake: Testing with production seeding assumptions.**
Why it happens: Tests rely on demo data that only exists in local environment.
Why it's harmful: Tests pass locally but fail in CI (testing environment).
Better approach: Use `RefreshDatabase` trait and seed only what each test needs.

**Mistake: Hard-coding environment names inconsistently.**
Why it happens: One seeder checks `'local'`, another checks `'dev'`, another checks `'development'`.
Why it's harmful: Some seeders don't run in some environments.
Better approach: Define a single environment check in a base seeder class or config.

## Failure Modes
1. **Demo data seeded in production:** Missing environment guard runs demo seeder in production. Mitigation: always double guard with `App::environment()` and never call demo seeders directly.
2. **Test suite data inconsistency:** Tests rely on seeder data that changes between environments. Mitigation: each test seeds its own required data using `RefreshDatabase`.
3. **Production guard bypassed accidentally:** `--force` in deployment script runs seeders without the interactive warning. Mitigation: use explicit seeder classes in deployments, not `DatabaseSeeder`.
4. **Environment detection mismatch:** `APP_ENV` is misconfigured in deployment, causing wrong seeder to run. Mitigation: verify `APP_ENV` in deployment pipeline before running seeds.

## Ecosystem Usage
- **Laravel Jetstream:** Checks environment before running demo team/workspace seeding.
- **Laravel Spark:** Uses environment-aware seeding for plans, features, and test subscriptions.
- **Laravel Nova:** Testing environment uses minimal seeding while development uses full demo data for resource previews.

## Related Knowledge Units


### Prerequisites
- Model Design
- Model Lifecycle
- Seeder Organization
- Seeding Strategies

### Related Topics
- Artisan Commands
- Environment Configuration

### Advanced Follow-up Topics
- CI/CD Database Initialization
- Deployment Pipelines


## Research Notes
- **Source Analysis:** `App::environment()` is defined in `Illuminate\Foundation\Application::environment()`. It checks `$this->environment` which is set from `APP_ENV` during application bootstrap.
- **Key Insight:** Environment-specific seeding is not a built-in Laravel feature — it's a convention. The framework provides the tools (environment detection, seeder classes), but the developer decides the strategy.
- **Version-Specific Notes:** Laravel 8+ has `App::environment()` accepting multiple environments as array `['local', 'staging']`. Laravel 9+ `--force` flag works with all `db:seed` variants. Laravel 10+ improved production confirmation messaging.
