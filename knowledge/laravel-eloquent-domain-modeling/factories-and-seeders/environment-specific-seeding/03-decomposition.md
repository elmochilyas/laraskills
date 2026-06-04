# Environment-Specific Seeding — Decomposition

## Implementation Tasks

### 1. Define environment seeding strategy
- Document data requirements per environment (production, staging, local, testing)
- Identify which seeders are universal and which are environment-specific
- Create environment-specific seeder classes

### 2. Implement production guard in DatabaseSeeder
- Add `App::environment('local')` check for demo seeders
- Verify `php artisan db:seed` in testing environment does not run demo data
- Test that `--force` bypasses guard in production (with warning)

### 3. Create environment-aware data volume logic
- Use `match(App::environment())` to control model counts
- Create few models in testing, moderate in staging, many in local
- Assert correct counts per environment

### 4. Create dedicated testing seeder
- Generate `TestingSeeder` with minimal data
- Use `RefreshDatabase` + `Artisan::call('db:seed --class=TestingSeeder')` in test setUp
- Assert tests run quickly (<1 second for seeding)

### 5. Create staging seeder with realistic-but-limited data
- Generate 20-50 realistic model instances
- Include varied states and relationships
- Assert data is sufficient for manual QA verification

### 6. Implement configuration-driven seeding
- Create `config/seed.php` with count and flag defaults
- Override via `SEED_USER_COUNT` env var
- Assert configuration values are respected

### 7. Test environment detection edge cases
- Test seeder with unknown environment (fallback to minimal data)
- Assert empty environments list returns correct match result
- Test with `APP_ENV` set to null/empty

### 8. Document seeding per environment
- Create running guide in project README or deployment docs
- Document what data is created in each environment
- Document how to run specific seeders for each environment

## Validation Criteria
- [ ] Demo seeders do not run in `production` environment
- [ ] Demo seeders run in `local` environment
- [ ] Testing seeder creates minimal data in <1 second
- [ ] Staging seeder creates moderate data with realistic variety
- [ ] Custom env vars override default seeding configuration
- [ ] Unknown environment falls back to production-like minimal seed
- [ ] `php artisan db:seed --force` in production does not run demo data
- [ ] Each environment can be seeded independently via `--class=`
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization