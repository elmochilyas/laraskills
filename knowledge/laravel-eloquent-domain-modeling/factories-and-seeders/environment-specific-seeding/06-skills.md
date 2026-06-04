# Skill: Set Up Environment-Gated Demo Seeders

## Purpose

Configure `DatabaseSeeder` to call demo data seeders only in local and staging environments, preventing fake or PII-like data from reaching production.

## When To Use

- Setting up development database seeding for the first time
- Adding demo data that should never appear in production
- Configuring CI/CD pipeline seeding

## When NOT To Use

- All environments should get the same data set (reference-only seeding)
- The demo data is already gated by a deployment pipeline (externally enforced)

## Prerequisites

- `DatabaseSeeder` exists in `database/seeders/`
- Demo seeder classes exist separately from reference seeder classes
- `app()->environment()` is available

## Inputs

- List of demo seeder classes to gate
- Target environments (e.g., `local`, `staging`)
- List of reference seeder classes (always run)

## Workflow

1. Separate reference seeders from demo seeders into different classes:
   - `RoleSeeder` (reference — always runs)
   - `DemoUserSeeder` (demo — gated)
2. In `DatabaseSeeder::run()`, call reference seeders unconditionally using `callSilent()`:
   ```
   $this->callSilent(RoleSeeder::class)
   ```
3. Wrap demo seeder calls in an environment check:
   ```
   if (app()->environment('local', 'staging')) {
       $this->call(DemoUserSeeder::class)
   }
   ```
4. Make reference seeders idempotent using `firstOrCreate()`:
   ```
   Role::firstOrCreate(['name' => 'admin'])
   ```
5. Read data volumes from config, not hard-coded values:
   ```
   User::factory()->count(config('seeding.users_count', 50))->create()
   ```

## Validation Checklist

- [ ] Demo seeders are wrapped in `app()->environment('local', 'staging')` check
- [ ] Reference seeders are idempotent (use `firstOrCreate()` or `updateOrCreate()`)
- [ ] No `DB::table()->truncate()` in production-runnable seeders
- [ ] Data volumes are read from config, not hard-coded
- [ ] Reference seeders use `callSilent()` to avoid event side effects

## Common Failures

- **Mixed reference and demo data**: A single seeder class containing both idempotent reference inserts and factory-generated demo data. Split into separate classes.
- **Missing environment gate**: A demo seeder called without `app()->environment()` guard. Wrap every demo call.
- **Non-idempotent reference seeder**: Using `insert()` instead of `firstOrCreate()` causes duplicate key errors on re-deploy.

## Decision Points

- **callSilent vs call**: Reference data uses `callSilent()` to skip model events. Demo data uses `call()` to trigger events useful in development.
- **Config vs env**: Use `config()` with a default for data volumes. Use environment variables only when the value must differ per developer machine.

## Performance Considerations

- `callSilent()` skips model event dispatch — faster for reference data insertion
- Config-driven counts allow CI to use smaller volumes for faster test runs

## Security Considerations

- Environment gates prevent demo data (potentially containing fake PII) from reaching production
- Never use `truncate()` in seeders that can run in production — catastrophic data loss

## Related Rules

- Rule 1: Gate All Demo Seeders Behind Environment Checks
- Rule 2: Keep Production Seeders Minimal and Idempotent
- Rule 3: Never Truncate Tables in Production Seeders
- Rule 4: Read Seeder Data Volumes from Configuration
- Rule 5: Separate Reference Seeders from Demo Seeders into Different Classes

## Related Skills

- Seeder Organization with Domain Groups
- Seeding Strategies for Bulk Data
- Factory Definition for Model Factories

## Success Criteria

- Running `db:seed` in production creates only reference data with no demo records
- Running `db:seed` in local creates both reference data and rich demo data
- All seeders can be re-run without producing duplicates
