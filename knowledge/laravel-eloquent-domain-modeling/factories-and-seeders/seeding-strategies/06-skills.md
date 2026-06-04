# Skill: Set Up migrate:fresh --seed Development Workflow

## Purpose

Establish `php artisan migrate:fresh --seed` as the standard development database refresh workflow, ensuring consistent, reproducible database state across all developer machines.

## When To Use

- Setting up a new project's development seeding workflow
- Onboarding new developers to the project
- Configuring CI/CD database setup

## When NOT To Use

- Working on a shared development database where dropping tables is not possible
- Incremental seeding is explicitly required (document the inconsistency risk)

## Prerequisites

- Migrations are written for all tables
- Seeders exist and are organized in `DatabaseSeeder`
- `migrate:fresh` command is available (Laravel default)

## Inputs

- Seeder classes (reference and demo)
- Data volume configuration values
- Environment detection logic

## Workflow

1. Configure `DatabaseSeeder` with environment-gated demo seeders as described in "Environment-Specific Seeding"
2. Use `php artisan migrate:fresh --seed` as the standard command:
   ```
   php artisan migrate:fresh --seed
   ```
3. For bulk flat data (thousands of rows), use raw `DB::table()->insert()` instead of factories:
   ```
   $data = collect(range(1, 10000))->map(fn ($i) => ['name' => "tag-{$i}"])->all()
   DB::table('tags')->insert($data)
   ```
4. For very large datasets (10,000+ records), batch into chunks:
   ```
   foreach (range(1, 50) as $batch) {
       User::factory()->count(1000)->create()
   }
   ```
5. Wrap large seed operations in explicit transactions:
   ```
   DB::transaction(function () {
       // multi-insert logic here
   })
   ```
6. Use sequences for deterministic test data; use Faker for realistic development data

## Validation Checklist

- [ ] `migrate:fresh --seed` is documented as the standard dev workflow
- [ ] Bulk data uses raw `DB::table()->insert()` for performance
- [ ] Large datasets are batched to avoid memory exhaustion
- [ ] Large seed operations are wrapped in transactions
- [ ] Test environment uses sequences; development uses Faker

## Common Failures

- **Incremental seeding**: Running `migrate` + `db:seed` separately leaves stale data from previous schema versions. Always use `migrate:fresh --seed`.
- **Factory overhead for flat data**: Using `ZipCode::factory()->count(50000)->create()` for a flat lookup table with no relationships. Use raw `DB::table()->insert()` instead.
- **Memory exhaustion**: `factory()->count(50000)->create()` hydrates all models into memory simultaneously. Batch into chunks of ~1000.

## Decision Points

- **Factory vs raw insert**: Use factories for models with relationships and events. Use raw `DB::table()->insert()` for flat lookup tables and bulk data without Eloquent requirements.
- **Sequence vs Faker**: Use sequences in tests for deterministic data. Use Faker in development seeders for realistic data.

## Performance Considerations

- Raw `DB::table()->insert()` is 5-10x faster than factory `create()` for bulk data
- Batching prevents memory exhaustion for datasets over 10,000 records
- Transactions ensure atomicity and can improve insert speed (single commit)

## Security Considerations

- Never use `factory()->create()` for sensitive production data seeding
- Raw inserts bypass Eloquent attribute casting — ensure data types match schema

## Related Rules

- Rule 1: Use firstOrCreate() or updateOrCreate() for Idempotent Reference Seeders
- Rule 2: Use migrate:fresh --seed as the Default Development Workflow
- Rule 3: Batch Large Seed Sets to Avoid Memory Exhaustion
- Rule 4: Use Raw DB::table()->insert() for Bulk Performance
- Rule 6: Wrap Large Seed Operations in Explicit Transactions

## Related Skills

- Seeder Organization with Domain Groups
- Environment-Specific Seeding with Gates
- Factory Definition for Model Factories

## Success Criteria

- `php artisan migrate:fresh --seed` produces a clean, consistent database state
- Bulk data seeding completes within acceptable time limits
- Memory usage remains bounded during large seed operations
- Test data is deterministic; development data is realistic
