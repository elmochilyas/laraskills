# Skill: Implement API Feature Test Structure

## Purpose
Organize API feature tests per resource with setup methods, data providers, test groups, and database transactions using Laravel's `RefreshDatabase` or `DatabaseTransactions` trait.

## When To Use
- API integration test suite
- Feature-level testing of endpoints
- Test organization for maintainability

## When NOT To Use
- Unit testing models/services
- Browser/Dusk tests

## Prerequisites
- PHPUnit or Pest test suite
- Database configuration for testing

## Inputs
- Resource list to test
- Test scenarios per endpoint

## Workflow
1. Organize test files per resource: `tests/Feature/Api/UserTest.php`
2. Use `RefreshDatabase` trait for migrations or `DatabaseTransactions` for speed
3. Set up shared test data in `setUp()` or `beforeEach()` — create common models
4. Use named test methods: `test_authenticated_user_can_create_post()`
5. Group tests by HTTP method: `/** @test */` annotations or Pest `describe()`
6. Separate happy path, error path, and edge case tests into methods
7. Use data providers for repeated test scenarios with different inputs
8. Apply `@group` annotations for targeted test execution
9. Use `refreshDatabase` for tests that need fresh migrations, `databaseTransactions` for speed
10. Keep tests independent — never depend on other tests' side effects

## Validation Checklist
- [ ] Test file per resource organized
- [ ] DatabaseTransactions or RefreshDatabase applied
- [ ] Shared setup in setUp/beforeEach
- [ ] Test methods named by scenario
- [ ] Tests grouped by HTTP method
- [ ] Happy/error/edge case tests separated
- [ ] Data providers for repeated scenarios
- [ ] @group annotations for targeted runs
- [ ] Database strategy matches test needs
- [ ] Tests independent — no shared mutable state

## Common Failures
- One test file for all API tests — grows unmanageable
- No database trait — tests leave data in DB, subsequent tests fail
- Tests referencing each other's data — test order dependency
- No data providers — repetitive test code for similar scenarios
- setUp too heavy — creates data every test, test suite runs slow
- Tests not grouped — can't run specific resource tests
- setUp without clearing — mutable state shared between tests

## Decision Points
- `RefreshDatabase` vs `DatabaseTransactions` — RefreshDatabase for migrations, DatabaseTransactions for speed
- PHPUnit vs Pest — PHPUnit for stability, Pest for expressiveness
- setUp vs passed data — setUp for shared models, factories for fresh data

## Performance Considerations
- `RefreshDatabase` runs migrations every test — 10x slower than `DatabaseTransactions`
- `DatabaseTransactions` rolls back after test — faster but can't test transaction behavior
- setUp with factory creation adds 5-10ms per test — create once and reuse
- Data providers with large datasets add startup time — keep under 100 cases

## Security Considerations
- Test database must be separate from production — never run tests on production DB
- Factory default data must not create admin/superuser accounts
- Test credentials must not match production credentials
- Tests should verify auth failures return 401/403 — sensitive endpoints protected

## Related Rules
- Organize Test Files Per Resource
- Use DatabaseTransactions For Test Speed
- Keep Tests Independent
- Use setUp For Shared Test Data
- Use Data Providers For Repeated Scenarios
- Apply @group Annotations For Targeted Execution

## Related Skills
- HTTP Endpoint Assertions — for test assertions
- Pest Test Structure — for Pest-specific tests
- Authentication Test Patterns — for auth-related tests
- Validation Error Testing — for validation tests

## Success Criteria
- Test files organized per resource for easy navigation
- Tests run independently — no shared mutable state
- DatabaseTransactions ensures fast test execution
- Data providers reduce code duplication
- @group enables targeted test runs
- setUp provides clean, reusable test data
- Happy path, error path, and edge cases all tested
