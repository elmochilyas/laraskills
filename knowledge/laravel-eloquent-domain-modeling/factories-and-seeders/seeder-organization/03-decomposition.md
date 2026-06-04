# Seeder Organization — Decomposition

## Implementation Tasks

### 1. Create dedicated seeder class per domain/entity
- Generate via `php artisan make:seeder RoleSeeder`
- Create one seeder per logical domain (Users, Blog, Billing)
- Place related seeders in subdirectories if project is large

### 2. Organize `DatabaseSeeder` as the entry point
- Add `call()` statements ordered by dependency
- Group related seeders in array syntax
- Add environment guards for demo/data seeders

### 3. Implement `callSilent()` for reference data
- Identify seeders that create lookup/reference data (roles, statuses, categories)
- Replace `call()` with `callSilent()` for these seeders
- Assert no events are fired during silent seeding

### 4. Add progress bars for large seed sets
- Use `$this->command->getOutput()->createProgressBar()`
- Advance progress bar during factory creation loop
- Display start/end informational messages

### 5. Create idempotent seeders
- Use `firstOrCreate()` or `updateOrCreate()` for reference data
- Truncate tables before seeding with `Model::truncate()`
- Test that re-running seeder does not create duplicates

### 6. Set up seeder dependency ordering
- Document which seeders depend on which
- Order `call()` statements to respect foreign key constraints
- Test full seeding from scratch passes without errors

### 7. Test individual seeder classes
- Run `php artisan db:seed --class=RoleSeeder` in isolation
- Assert only the expected data is created
- Test seeder can be called multiple times idempotently

## Validation Criteria
- [ ] `php artisan db:seed` completes without errors
- [ ] Foreign key constraints are respected (seed order is correct)
- [ ] `callSilent()` does not trigger model events
- [ ] Running seed twice does not create duplicate records
- [ ] Individual seeders run in isolation via `--class=`
- [ ] Progress bars display during long-running seeders
- [ ] Demo data seeders are guarded against production environment
- [ ] Reference data seeders are idempotent
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization