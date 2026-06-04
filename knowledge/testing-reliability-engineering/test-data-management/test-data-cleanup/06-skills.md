# Skill: Clean Up Test Data and Apply Minimal Data Principle

## Purpose
Ensure tests create only the minimum data required for assertions and properly clean up database state using `RefreshDatabase` and controlled data creation practices.

## When To Use
- Every feature test that creates database records
- When setting up new test classes (apply minimal data from the start)
- When reviewing and optimizing slow tests (data creation is often the bottleneck)
- When tests exhibit order-dependent failures (isolation issue)
- When CI test execution time is increasing due to data bloat

## When NOT To Use
- For testing database persistence across requests (rare, requires specific handling)
- For read-only tests that don't create data
- When the test specifically verifies behavior with large datasets
- For performance/load tests (intentionally need data volume)

## Prerequisites
- `RefreshDatabase` trait understanding
- Model factory patterns
- Knowledge of `DatabaseTruncation` trait (Laravel 11+)
- Understanding of test database isolation

## Inputs
- Test class with database operations
- Minimum records needed for each test assertion
- Cleanup strategy (RefreshDatabase vs DatabaseTruncation)
- Test data creation patterns to optimize

## Workflow
1. Apply `RefreshDatabase` trait to all test classes that create database records
2. Create only the minimum records needed for the specific assertion
3. Use explicit values for asserted attributes (not Faker)
4. Remove any unused factory-created records from tests
5. Use `--profile` to identify data-heavy tests
6. For large suites, consider `DatabaseTruncation` instead of `RefreshDatabase` for speed
7. Set a team convention: no test creates >10 records without a comment
8. During code review, flag tests with unused data or excessive data creation
9. Profile the test suite quarterly and optimize data-heavy tests

## Validation Checklist
- [ ] `RefreshDatabase` or equivalent trait is applied to all database tests
- [ ] Each test creates only the data needed for its specific assertion
- [ ] Tests use explicit values for attributes in assertions, not Faker data
- [ ] Most tests create 1-3 records; exceptions have comments explaining why
- [ ] No test creates more than 10 records without a documented reason
- [ ] Pagination tests create exactly (per_page + 1) records or use config values
- [ ] `--profile` output does not show data-heavy tests as the slowest
- [ ] Team has an established convention for maximum records per test

## Common Failures
- Not using `RefreshDatabase` — order-dependent failures from leftover data
- Creating production-like datasets for every test — slow and hard to debug
- Using Faker in assertions — edge-case Faker output causes false failures
- Creating data that's never used — copy-pasted factory calls add dead weight
- Confusing "realistic" with "correct" — focusing on aesthetic realism over behavioral correctness
- No data budget — data creation grows unchecked, CI time creeps up

## Decision Points
- `RefreshDatabase` vs `DatabaseTruncation` — RefreshDatabase for complete isolation, DatabaseTruncation for faster truncation (Laravel 11+)
- `RefreshDatabase` vs `DatabaseTransactions` — RefreshDatabase for thorough isolation, DatabaseTransactions for faster per-test rollback
- Manual cleanup vs automatic — always prefer automatic (`RefreshDatabase`) over manual `tearDown` cleanup

## Performance Considerations
- Per-record creation: 1-5ms for simple models, 5-20ms with relationships
- 1-3 records: ~3-15ms per test — 50 records: ~50-250ms per test
- Transaction rollback: proportional to modified data — fewer records = faster rollback
- `DatabaseTruncation` is faster than `RefreshDatabase` for large suites
- Profiling reveals data creation bottlenecks

## Security Considerations
- Explicit test data values (not Faker) should not contain real PII
- Factory defaults may include placeholder values resembling real data — review definitions
- `RefreshDatabase` rolls back all data — safe for sensitive test data
- Parallel databases prevent cross-test data leaks

## Related Rules
- [Rule: Create Only the Minimum Data Required](./05-rules.md)
- [Rule: Use Explicit Values for Asserted Attributes](./05-rules.md)
- [Rule: Set a Team Convention for Maximum Records Per Test](./05-rules.md)

## Related Skills
- Minimal Data Principle
- Declarative Factory Methods
- Test Suite Profiling

## Success Criteria
- [ ] All database tests use `RefreshDatabase` or equivalent
- [ ] Tests create minimum data (1-3 records by default)
- [ ] No unused factory-created records exist
- [ ] Tests with >10 records have documented justification
- [ ] Profiling shows data creation is not the test suite bottleneck
