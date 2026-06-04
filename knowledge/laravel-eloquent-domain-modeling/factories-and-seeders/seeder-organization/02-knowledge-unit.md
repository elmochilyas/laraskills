# Seeder Organization

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Factories & Seeders
- **Last Updated:** 2026-06-02

## Executive Summary
Seeder organization governs how `DatabaseSeeder` and individual seeder classes are structured, called, and ordered. Laravel's seeding system uses `DatabaseSeeder` as the entry point, which can invoke multiple dedicated seeder classes via `call()` or `callSilent()`. Proper organization ensures seeders are maintainable, composable, environment-aware, and free of unintended side effects from event listeners.

## Core Concepts
- **DatabaseSeeder class:** Located at `database/seeders/DatabaseSeeder.php`. The single entry point for `php artisan db:seed`. All other seeders are called from here.
- **call() method:** Invokes another seeder class. Runs all model events, observers, and listeners during seeding.
- **callSilent() method:** Invokes another seeder class without triggering model events. Faster and prevents unwanted side effects (e.g., notifications, cache invalidation).
- **Dedicated seeder classes:** Individual classes extending `Seeder` in `database/seeders/`. One per domain, model group, or functional area.
- **Seeding order:** The order of `call()` / `callSilent()` calls determines execution order. Dependency order matters â€” referenced models must be seeded first.
- **call() chaining:** `$this->call([...])` accepts an array of seeder classes, executed sequentially.

## Mental Models
- **Tree of execution:** `DatabaseSeeder` is the root of a tree. Each `call()` or `callSilent()` branches to a leaf seeder. The tree structure mirrors data dependencies.
- **Theatre stage manager:** The seeder is a stage manager calling actors (seeders) in order. Each actor sets up the props (data) needed for the next scene. `callSilent()` is like a stagehand â€” necessary work but the audience (tests) shouldn't see the commotion.
- **Dependency graph:** Seeders form a directed acyclic graph. RoleSeeder must run before UserSeeder, which must run before PostSeeder. Violating this order causes foreign key constraint failures.

## Internal Mechanics

> **Reference:** 
- `call()` and `callSilent()` instantiate the target seeder class, call its `run()` method, and return the results.
- `callSilent()` wraps the call in a `WithoutModelEvents` context, which sets a flag on the model's event dispatcher to skip events.
- Seeders have access to `$this->command` â€” the Artisan output instance â€” enabling progress bars, info/warn/error output.
- `call()` invokes the seeder's `__invoke()` or `run()` method via the Laravel container, allowing dependency injection in seeder constructors.

## Patterns
### Simple DatabaseSeeder
```php
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            PostSeeder::class,
        ]);
    }
}
```

### Using callSilent for Reference Data
```php
$this->callSilent(RoleSeeder::class);  // No events for reference data
$this->call(UserSeeder::class);         // Events fire for users
```

### Seeder with Progress Bar
```php
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding users...');
        $bar = $this->command->getOutput()->createProgressBar(100);

        User::factory()->count(100)->create();
        $bar->advance(100);

        $bar->finish();
        $this->command->newLine();
    }
}
```

### Domain-Organized Seeders
```php
// database/seeders/Users/
//   RoleSeeder.php
//   UserSeeder.php
//   ProfileSeeder.php
// database/seeders/Blog/
//   CategorySeeder.php
//   PostSeeder.php
//   CommentSeeder.php
```

### Conditional Seeding per Environment
```php
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->callSilent(RoleSeeder::class);
        $this->call(UserSeeder::class);

        if (app()->environment('local', 'staging')) {
            $this->call(DemoDataSeeder::class);
        }
    }
}
```

## Architectural Decisions
### Decision: Single Large Seeder vs. Multiple Dedicated Seeders
- **Multiple dedicated seeders:** Each class handles one domain or model group. Composable, testable, maintainable. Preferred for any project with >5 tables.
- **Single large seeder:** Everything in `DatabaseSeeder::run()`. Simple for prototypes. Becomes unmanageable quickly.
- **Tradeoff:** Multiple seeders add files but improve organization. Single seeder is simpler initially but harder to maintain.

### Decision: `call()` vs. `callSilent()`
- **`call()`:** Events fire. Use when the seeding should trigger observers, notifications, cache warming.
- **`callSilent()`:** Events suppressed. Use for reference/lookup data (roles, permissions, categories) where events are irrelevant.
- **Tradeoff:** `call()` is safer (behaviour matches production). `callSilent()` is faster and avoids side effects.

### Decision: Flat vs. Namespaced Seeder Organization
- **Flat:** All seeders in `database/seeders/`. Simple, but many files in one directory.
- **Namespaced:** Group by domain (`Users/`, `Blog/`, `Billing/`). Cleaner for larger projects. Requires namespace declarations and autoloader configuration.
- **Tradeoff:** Flat is simpler for <20 seeders. Namespaced is essential for >20 seeders or multi-domain projects.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Dedicated seeders are testable in isolation | File proliferation for small projects | Choose dedicated approach only when >5 seeders |
| `callSilent()` prevents unwanted side effects | Events suppressed that may be needed for data integrity | Use `call()` for seeders that create business-critical data |
| Progress bars provide visibility in CLI | Extra code in each seeder class | Extract progress bar logic into a base seeder class |
| Conditional seeding adapts to environment | Environment logic in seeder can hide issues | `php artisan db:seed` in production should be explicit |

## Performance Considerations
- `callSilent()` is measurably faster than `call()` because model events (e.g., `created`, `updated`) are skipped. For large reference datasets, always use `callSilent()`.
- Each `call()` adds a small overhead for class resolution and instantiation. Group seeders into fewer `call()` invocations for micro-optimization.
- Transaction wrapping: By default, each `factory()->create()` is auto-committed. For large seed sets, manually wrap in a transaction for speed: `DB::transaction(fn() => ...)`.

## Production Considerations
- `php artisan db:seed` should never run in production without explicit confirmation. Laravel prompts for confirmation in production environment.
- Seeders in production should only create essential reference data (roles, settings, default categories). Never create demo or fake user data in production.
- Always use `callSilent()` for seeder classes that populate reference data to avoid triggering email notifications, webhooks, or cache flushes.
- Version-control seeder outputs. Changes to seeders should be reviewed as part of code review, just like migrations.

## Common Mistakes
**Mistake: Running seeders in wrong order causing FK constraint failures.**
Why it happens: Dependencies not analyzed before ordering `call()` statements.
Why it's harmful: `php artisan db:seed` fails with foreign key violation.
Better approach: Order seeders by dependency: reference data first, then transactional data.

**Mistake: Using `call()` when `callSilent()` is appropriate.**
Why it happens: Default to `call()` without considering event implications.
Why it's harmful: Tests and seeding trigger real notifications, emails, or cache operations.
Better approach: Default to `callSilent()` for reference/lookup data; use `call()` only when events are intentionally tested.

**Mistake: Placing demo data seeders in `DatabaseSeeder` without environment guard.**
Why it happens: Developer runs `db:seed` locally and the demo seeder runs.
Why it's harmful: `php artisan db:seed --env=production` creates fake data in production.
Better approach: Always guard demo seeders with `app()->environment()` checks.

## Failure Modes
1. **Foreign key constraint failure on seed:** Seeder A creates models that reference Seeder B's data, but Seeder B hasn't run yet. Mitigation: order seeders by dependency, or allow nullable FKs.
2. **Duplicate entry on re-seed:** Running `db:seed` without `--fresh` or `migrate:fresh` causes unique constraint violations. Mitigation: use `Model::truncate()` or `firstOrCreate()` in seeders for idempotency.
3. **Memory exhaustion from event listeners:** `call()` triggers observers that load large related datasets. Mitigation: use `callSilent()` for bulk seeding and test event behaviour separately.

## Ecosystem Usage
- **Laravel Jetstream:** Ships with `DatabaseSeeder` that calls `RoleSeeder` and `UserSeeder` for team-based authorization.
- **Spatie Laravel Permission:** Provides `PermissionSeeder` as a recommended pattern for seeding roles and permissions.
- **Laravel Nova:** Uses seeders for populating action and resource test data organized by domain.

## Related Knowledge Units


### Prerequisites
- Model Design
- Model Lifecycle
- Factory Definition
- Eloquent Model Events

### Related Topics
- Seeding Strategies
- Environment-Specific Seeding
- Artisan Commands

### Advanced Follow-up Topics
- Seeder Testing
- CI/CD Database Initialization
- Idempotent Seeders


## Research Notes
- **Source Analysis:** `Illuminate\Database\Seeder` â€” base class providing `call()`, `callSilent()`, `command` access. The `WithoutModelEvents` trait used internally by `callSilent()` leverages `Model::getEventDispatcher()->forget()` and restores it after seeding.
- **Key Insight:** The seeder architecture mirrors controller organization â€” a central entry point dispatching to focused classes. This similarity is intentional; both are command-dispatch patterns.
- **Version-Specific Notes:** Laravel 8 flattened seeder namespaces. `callSilent()` was introduced in Laravel 8.x. Laravel 9+ added array syntax for `call()`: `$this->call([...])` as shorthand for multiple calls. Laravel 10+ added `WithoutModelEvents` trait as reusable for custom batch operations.
