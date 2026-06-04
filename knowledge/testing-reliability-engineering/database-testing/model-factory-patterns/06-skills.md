# Skill: Design and Use Model Factories

## Purpose
Create well-designed model factories with deterministic defaults, named states for reusable scenarios, proper relationship handling, and minimal data creation.

## When To Use
- Setting up any database-driven test
- Creating reusable model configurations used in multiple tests
- Testing relationships and complex data graphs
- Defining factory defaults that pass model validation

## When NOT To Use
- For reference/seed data shared across all tests (use seeders)
- When tests need exact control over every attribute (use explicit arrays)
- When model has no validation or persistence logic (test with mocks)

## Inputs
- Eloquent model class and its fillable attributes
- Model validation rules
- Required belongs-to relationships
- Named state scenarios used across tests

## Workflow
1. Create factory in `database/factories/` following `ModelNameFactory` convention
2. Use fixed strings in `definition()` for all fields — never `fake()` for defaults (ensures deterministic, reproducible tests)
3. For fields with unique constraints, use `fake()` only in a dedicated state method (e.g., `->uniqueEmail()`)
4. Define required belongs-to relationships in `definition()` using `User::factory()` as foreign key default — prevents foreign key constraint violations
5. Extract named states for any override pattern appearing in 2+ tests (e.g., `->admin()`, `->unverified()`)
6. Use `make()` instead of `create()` when the test doesn't need database persistence — <1ms vs 2-10ms
7. Keep `afterCreating()` callbacks lightweight — no job dispatching or API calls
8. Create only the minimum data needed — 1-2 records per entity for most tests

## Validation Checklist
- [ ] Factory defaults use fixed strings, not faker
- [ ] Named states exist for scenarios used in 2+ tests
- [ ] Required belongs-to relationships defined in factory definitions
- [ ] Tests create only minimum data needed
- [ ] `afterCreating()` callbacks are lightweight
- [ ] `make()` used when database persistence isn't required
- [ ] Factory locations follow Laravel conventions
- [ ] No circular factory dependencies

## Common Failures
- Random data in factory defaults — test failures are non-reproducible
- Creating more data than needed — 50 records when 1 suffices, slowing the suite
- Missing parent relationships in factory definition — foreign key constraint errors
- Overriding definitions instead of using states — duplicated setup across tests
- Heavy `afterCreating()` callbacks — every factory creation runs slow operations

## Decision Points
- Fixed strings for deterministic defaults vs `fake()` for unique-constraint scenarios
- `make()` for non-persistence tests vs `create()` when the record must exist in DB
- Named states for reusable scenarios vs explicit state overrides for one-offs

## Performance Considerations
- `make()`: <1ms per model (no persistence overhead)
- `create()`: 2-10ms per model (INSERT + callbacks)
- `count(N)->create()`: individual inserts; for N > 100, consider chunking
- Relationship creation: `hasPosts(3)` adds ~6-30ms
- `afterCreating()` callbacks: add linear time per created model

## Security Considerations
- Factory data should never contain real user credentials or secrets
- User password fields should use `Hash::make('password')` or `bcrypt('password')` for consistency
- Factory-created data should be clearly identifiable as test data

## Related Rules (from 05-rules.md)
- Rule 1: Use fixed strings, not faker, in factory `definition()` defaults
- Rule 2: Create only the minimum data needed for the test
- Rule 3: Extract named states for scenarios used in 2+ tests
- Rule 4: Define required belongs-to relationships in the factory definition
- Rule 5: Use `make()` instead of `create()` when database persistence is not needed
- Rule 6: Keep `afterCreating()` callbacks lightweight

## Success Criteria
- All tests use deterministic factory data (fixed strings in defaults)
- Named states centralize reusable model configurations
- Foreign key constraint errors eliminated (required relationships in definitions)
- Unnecessary database writes minimized (make() used where possible)
