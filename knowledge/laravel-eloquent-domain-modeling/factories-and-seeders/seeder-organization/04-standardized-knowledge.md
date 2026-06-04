# Seeder Organization

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Seeder Organization |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Seeder organization governs how `DatabaseSeeder` and individual seeder classes are structured, called, and ordered. `DatabaseSeeder` is the entry point, invoking dedicated seeders via `call()` or `callSilent()`. Proper organization ensures seeders are maintainable, composable, environment-aware, and free of unwanted side effects.

## Core Concepts

- **DatabaseSeeder**: Single entry point at `database/seeders/DatabaseSeeder.php`
- **call() method**: Invokes another seeder — runs all model events
- **callSilent() method**: Invokes without model events — faster, prevents side effects
- **Dedicated seeder classes**: One per domain or model group
- **Seeding order**: Determined by `call()` / `callSilent()` order — dependency order matters

## When To Use

- Populating development/staging databases with sample data
- Setting up reference data (roles, permissions, settings)
- Creating initial test data for feature tests

## When NOT To Use

- The data is generated inline in tests (use factories directly)
- The operation belongs in a migration (schema changes, not data)

## Best Practices

- **Use `callSilent()` for reference data**: Reference data seeders (roles, permissions, settings) shouldn't trigger model events. Use `callSilent()` to avoid cache invalidation, notification dispatch, and other side effects.
- **Order seeders by dependency**: Models with foreign key dependencies must be seeded before their dependents. Document the dependency order in comments.
- **One domain, one seeder**: Group seeders by domain boundary (Users, Billing, Content). Each domain seeder calls model-specific seeders internally.

## Architecture Guidelines

- `DatabaseSeeder` imports all domain seeders in dependency order
- Domain seeders call model-specific seeders
- Reference data uses `callSilent()`; demo data uses `call()`
- Seeders are idempotent — they can run multiple times

## Examples

```php
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->callSilent(RoleSeeder::class);      // No events
        $this->call(UserSeeder::class);              // Events for notifications
        $this->call(PostSeeder::class);              // Depends on users existing

        if (app()->environment('local')) {
            $this->call(DemoDataSeeder::class);
        }
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Factory Definition |
| Closely Related | Seeding Strategies |
| Closely Related | Environment-Specific Seeding |
| Closely Related | Factory Callbacks |

## AI Agent Notes

- Use `callSilent()` for reference data to avoid event side effects
- Order seeders by dependency
- Group seeders by domain

## Verification

- [ ] `DatabaseSeeder` calls seeders in correct dependency order
- [ ] Reference data uses `callSilent()`
- [ ] Seeders are idempotent
