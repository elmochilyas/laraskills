# Seeding Strategies — Decomposition

## Implementation Tasks

### 1. Implement `migrate:fresh --seed` workflow
- Configure `.env` for development database
- Run `php artisan migrate:fresh --seed` successfully
- Assert all expected data exists after seeding

### 2. Create sequential seeding strategy
- Use `->sequence(fn ($seq) => [...])` for ordered data
- Create predictable relationship distributions (e.g., 5 posts per user)
- Assert deterministic output across multiple runs

### 3. Create random seeding with fixed Faker seed
- Set `fake()->seed(12345)` in seeder for reproducibility
- Assert same data generated across runs
- Test removing the fixed seed — output should differ

### 4. Implement raw insert for bulk data
- Build array of 10,000 rows
- Use `DB::table('users')->insert()` with `array_chunk(..., 500)`
- Compare execution time vs. factory approach

### 5. Implement idempotent seeding for reference data
- Use `firstOrCreate()` for roles, permissions, statuses
- Run seeder twice and assert no duplicates
- Assert data is preserved between runs

### 6. Implement truncate-and-seed strategy for transactional data
- Call `Model::truncate()` before seeding transactional data
- Ensure foreign key checks are handled (disable/re-enable)
- Assert fresh data after re-seed

### 7. Add transactional wrapper to DatabaseSeeder
- Wrap all `call()` statements in `DB::transaction()`
- Test that failure in one seeder rolls back previous seeders
- Assert database is in clean state after failed seed

### 8. Benchmark seed performance
- Time factory-based seeding for 1,000 records
- Time raw-insert seeding for 1,000 records
- Document speed difference in project README

## Validation Criteria
- [ ] `migrate:fresh --seed` completes and populates all tables
- [ ] Sequential seeding produces identical results across runs
- [ ] Fixed Faker seed produces deterministic random data
- [ ] Raw insert seeding is faster than factory seeding (10x+ for 10k rows)
- [ ] Idempotent seeders produce no duplicates on re-run
- [ ] Truncate-and-seed clears existing data before re-populating
- [ ] Transactional wrapper rolls back on failure
- [ ] Demo data is created only in allowed environments
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization