# Skill: Design Test Data Factories

## Purpose
Create and manage Laravel model factories — defining states for every significant scenario, using `raw()` for request bodies, `sequence()` for distinct records, relationship factories for batch creation, `make()` over `create()` when persistence is unnecessary, and edge-case states for boundary testing.

## When To Use
- Every Eloquent model that needs test data
- Feature tests requiring persisted database records
- Form request tests using `raw()` for request body generation
- Seeding test databases for integration tests

## When NOT To Use
- DTO construction tests (use direct instantiation)
- Non-Eloquent data objects (use plain PHP builders)
- Unit tests that mock repositories (no database needed)

## Prerequisites
- Laravel Eloquent Models
- Database Migrations

## Inputs
- Eloquent model schema and migrations
- Model relationship definitions
- Edge-case scenarios per model

## Workflow
1. Define factory states for each significant model scenario — `published()`, `draft()`, `archived()` — instead of inline overrides
2. Use `Post::factory()->raw()` for request body generation — guaranteed to match model schema
3. Use `sequence()` for distinct records: `factory()->count(3)->sequence(['status' => 'draft'], ['status' => 'published'])`
4. Define relationship factories with `has()`/`for()`: `User::factory()->hasPosts(10)->create()` for batch creation
5. Prefer `make()` over `create()` when only in-memory attributes needed — avoids unnecessary database writes
6. Define edge-case factory states: null values, empty strings, soft-deleted, max-length, boundary values
7. Use `afterCreating()` sparingly for side effects that must run after persistence
8. Use `configure()` for conditional defaults — a `thumbnail()` state changes both `has_thumbnail` and `thumbnail_url`

## Validation Checklist
- [ ] Every Eloquent model has a corresponding factory
- [ ] Factory states defined for all significant model states
- [ ] Factory relationships defined using `has()` / `for()` methods
- [ ] Edge-case states (null, empty, boundary) are factory-producible
- [ ] No circular factory relationships
- [ ] Factories use `fake()` for unique fields with `->unique()`
- [ ] `raw()` available for request body generation in feature tests

## Common Failures
- Using `create()` when `make()` suffices — unnecessary database writes
- Forgetting to refresh database between tests — factory-created records pollute subsequent tests
- Defining factories with hardcoded values instead of `fake()` — tests become brittle to uniqueness constraints
- Not defining states for edge cases — null values, empty strings, boundary values must be factory-producible
- Circular factory relationships — PostFactory tries to create User that creates Post — infinite loop

## Decision Points
- State vs inline override: use states for scenarios used in multiple tests; inline overrides acceptable for one-off edge cases
- `make()` vs `create()`: `make()` for attribute testing; `create()` for relationship queries and route model binding
- `afterCreating()` usage: prefer factory states + relationship methods over callbacks for performance

## Performance Considerations
- Factory `create()` calls are database writes — each call adds overhead
- Use `make()` instead of `create()` when only model instance attributes needed
- Use `factory()->count(N)->create()` to batch-insert N records in a single chunk
- Use `afterCreating()` sparingly — callbacks run for each created record

## Security Considerations
- Factory definitions should match production model schema exactly
- Never use factory data in production (`php artisan db:seed` in production is a risk)
- Factory `fake()` data should be locale-aware for internationalized applications
- Ensure factories don't generate data that violates security constraints

## Related Rules
- Use Explicit States Over Inline Overrides
- Use Raw For Request Bodies
- Use Sequences For Distinct Records
- Define All Relationship Factories
- Use Make Over Create When Persistence Is Unnecessary
- Define Edge-Case States

## Related Skills
- Test Happy Path
- Test Validation Failures
- Test Response Shape

## Success Criteria
- Every model has well-factored factory with named states
- States used over inline overrides throughout test suite
- `raw()` generates valid request bodies for feature tests
- Relationship factories batch-create related models efficiently
- `make()` used where persistence unnecessary
- Edge-case states cover null, empty, boundary, and soft-delete scenarios
- No circular relationships; no factory infinite loops
