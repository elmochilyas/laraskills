# Skill: Apply the Minimal Data Principle

## Purpose
Create only the minimum data required in each test to verify the specific behavior under test, keeping test suites fast, focused, and maintainable.

## When To Use
- All feature and unit tests as the default approach
- Database assertions where specific records need to exist
- Authorization and ownership boundary testing
- List/filtering behavior verification
- Pagination boundary testing (with minimum required records)

## When NOT To Use
- For performance/load testing (needs production-like data volumes)
- For sorting tests (needs diverse values for meaningful order)
- For concurrency tests (needs multiple simultaneous operations)
- For integration tests that verify data rendering (needs realistic display data)
- For regression tests for edge cases involving large datasets

## Prerequisites
- Understanding of model factories and factory methods
- Knowledge of database test assertions
- Awareness of the behavior under test (what data is needed exactly)

## Inputs
- Test scenario and the exact data needed to test it
- Record count guidelines: 1 for existence, 2-3 for scoping/boundaries, per_page+1 for pagination
- Explicit attribute values for assertions (not Faker defaults)

## Workflow
1. Determine the minimum data required to trigger and verify the target behavior
2. Create exactly that data: 1 record for existence, 2-3 for boundary tests, per_page+1 for pagination
3. Use explicit values for any field that appears in an assertion
4. Avoid creating relationships unless they are directly needed
5. Use specific factory states over inline attributes for reusable patterns
6. Remove any unused factory-created records (copy-paste leftovers)
7. If a test creates >10 records, add a comment explaining why
8. Use `--profile` to identify data-heavy tests and optimize them

## Validation Checklist
- [ ] Tests create the minimum records needed for the assertion
- [ ] Explicit values are used for assertion-related attributes
- [ ] No unused factory-created records exist in tests
- [ ] Relationship creation is minimized to what the test requires
- [ ] Pagination tests create exactly page_size + 1 records
- [ ] Code review flags `User::factory(10)` when 2 would suffice
- [ ] CI profiling identifies data-heavy tests for optimization
- [ ] Faker data is not used in test assertions

## Common Failures
- Creating production-like datasets for every test — slow, hard to debug
- Using Faker in assertions — edge-case Faker output causes false failures
- Creating data that's never used — copy-pasted factory calls add dead weight
- Confusing "realistic" with "correct" — focusing on aesthetic realism over behavioral correctness
- Factory relationship over-creation — creating parent-child relationships when only the parent is needed

## Decision Points
- 1 vs 3 records — 1 for existence/ownership, 2-3 for scoping/list tests
- Explicit values vs factory defaults — explicit for asserted fields, defaults for non-asserted fields
- `->has()` vs separate `create()` — `->has()` for directly tested relationships, separate create for independence

## Performance Considerations
- Per-record creation: 1-5ms for simple models, 5-20ms for models with relationships
- 1-3 records: ~3-15ms per test — 50 records: ~50-250ms per test
- Transaction rollback is proportional to modified data — 3 records vs 50 is 10x faster
- Less data = less connection pool contention across parallel workers
- Faker generation: ~0.01ms per call — 50 calls × 50 models = 25ms in Faker alone

## Security Considerations
- Minimal data means fewer records with sensitive attributes
- Explicit attribute values in assertions may be visible in CI logs — don't use real PII
- Factory defaults may include placeholder values resembling real data — review definitions
- `RefreshDatabase` uses transactions — no data persists after test

## Related Rules
- [Rule: Create Only the Data Your Assertion Checks](./05-rules.md)
- [Rule: Use Explicit Values for Asserted Attributes](./05-rules.md)
- [Rule: Follow the Record Count Decision Guide](./05-rules.md)

## Related Skills
- Declarative Factory Methods
- Factory States and Sequences
- Test Suite Profiling

## Success Criteria
- [ ] Most tests create 1-3 records; exceptions have documented reasons
- [ ] No test creates >10 records without a comment
- [ ] Assertions use explicit fixed values, not Faker
- [ ] Pagination tests create exactly per_page + 1 records
- [ ] Profiling shows data-heavy tests as rare exceptions
