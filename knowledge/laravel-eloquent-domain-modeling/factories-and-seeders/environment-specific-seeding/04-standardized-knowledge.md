# Environment-Specific Seeding

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Environment-Specific Seeding |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Environment-specific seeding tailors database population to the environment (local, testing, staging, production). Production needs only essential reference data; local development benefits from rich demo datasets. Laravel provides environment detection via `app()->environment()` and conditional logic in seeders.

## Core Concepts

- **Environment detection**: `App::environment('local')` — used inside seeders for conditional logic
- **Environment layers**: Production (reference only) → Staging (reference + limited demo) → Local (reference + rich demo) → Testing (minimal)
- **Demo data separation**: Demo data in separate seeder classes, gated by environment checks
- **Production guard**: `db:seed` prompts for confirmation in production; `--force` bypasses

## When To Use

- Different environments need different data volumes
- Production should only have essential reference data
- Local dev benefits from realistic demo data

## When NOT To Use

- All environments get the same data set
- The seeding script is environment-agnostic (simple CRUD reference data)

## Best Practices

- **Gate demo seeders by environment**: Place all demo data in separate seeders called only for local/staging. This prevents accidental demo data in production.
- **Production seeders should be idempotent and minimal**: Production seeders run on every deploy. They should only create or update reference data that must exist. Never truncate production tables.
- **Use configuration for data volumes**: Read seeder counts from config files or environment variables rather than hard-coding. `User::factory()->count(config('seeding.users_count', 10))->create()`.

## Architecture Guidelines

- `DatabaseSeeder` checks `app()->environment()` before calling demo seeders
- Reference seeders always run; demo seeders are gated
- Production guard is Laravel's built-in `db:seed` confirmation

## Examples

```php
public function run(): void
{
    $this->callSilent(RoleSeeder::class);
    $this->callSilent(PermissionSeeder::class);

    if (app()->environment('local', 'staging')) {
        $this->call(DemoUserSeeder::class);
        $this->call(DemoPostSeeder::class);
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Seeder Organization |
| Closely Related | Seeding Strategies |
| Closely Related | Seeder Testing |

## AI Agent Notes

- Demo seeders are gated by `app()->environment()`
- Production seeders are minimal and idempotent
- Read data volumes from config, not hard-coded

## Verification

- [ ] Demo seeders are gated by environment check
- [ ] Production seeders are idempotent
- [ ] Data volumes are config-driven
