# Seeding Strategies

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Seeding Strategies |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Seeding strategies define how databases are populated with test, demo, and reference data. Choices affect seed speed, data quality, test reliability, and developer velocity. Key strategies include migration + seed workflows, sequential vs. random generation, idempotent seeding, and batch sizing.

## Core Concepts

- **Migration + seed workflow**: `php artisan migrate:fresh --seed` — drops tables, re-runs migrations, then seeds
- **Sequential data**: Predictable, ordered data via sequences — deterministic tests
- **Random data**: Faker-based variety — realistic but non-deterministic
- **Idempotent seeding**: Can run multiple times without duplicates — uses `firstOrCreate()`, `truncate()`, or upsert
- **Factory vs. raw insert**: Factories for convenience/relationships; raw inserts for bulk speed

## When To Use

- Setting up development databases with demo data
- Creating reproducible test database states
- Populating reference/lookup tables

## When NOT To Use

- Production data migration (use database migrations or dedicated scripts)
- One-off ad-hoc data (use tinker)

## Best Practices

- **Use idempotent seeders for reference data**: Reference data (roles, permissions) should be seedable multiple times without duplicates. Use `firstOrCreate()` or truncate + re-insert.
- **Prefer `migrate:fresh --seed` for development**: Clean slate every time ensures a consistent starting point. Avoid incremental seeding for development.
- **Batch large seed sets**: Creating 10,000 models in one call may exhaust memory. Use `chunk()` or batch within seeder loops.

## Architecture Guidelines

- Reference data: idempotent, `callSilent()`, always runs
- Demo data: environment-gated, `call()`, best-effort
- Deterministic data for tests: sequences, factory states
- Realistic data for dev: Faker, factory states

## Performance Considerations

- Factory `create()` triggers model events — slow for bulk inserts
- Raw inserts (`DB::table()->insert()`) bypass Eloquent for maximum speed (5-10x faster)
- Batch inserts in transactions for atomicity and performance

## Examples

```php
// Idempotent reference seeder
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['admin', 'editor', 'viewer'] as $role) {
            Role::firstOrCreate(['name' => $role]);
        }
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Factory Definition |
| Closely Related | Seeder Organization |
| Closely Related | Environment-Specific Seeding |
| Closely Related | Factory Performance |

## AI Agent Notes

- Reference data: idempotent, `firstOrCreate()`
- Demo data: environment-gated
- Bulk inserts: raw `DB::table()` for speed

## Verification

- [ ] Reference seeders use idempotent patterns
- [ ] Batch sizes are appropriate for memory limits
- [ ] `migrate:fresh --seed` is the standard dev workflow
