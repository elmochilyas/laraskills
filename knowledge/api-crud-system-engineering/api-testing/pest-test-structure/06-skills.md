# Skill: Write Pest PHP Test Structure

## Purpose
Organize API tests using Pest's describe/group/arch features with data providers, test groups, lifecycle hooks, and integration with Laravel's test assertions.

## When To Use
- Pest-based test suites for Laravel APIs
- Test organization requiring nested describe blocks
- Teams adopting Pest's expressive syntax

## When NOT To Use
- PHPUnit-only teams — use feature test structure skill instead
- Projects mixing Pest and PHPUnit — stick to one

## Prerequisites
- Pest PHP installed and configured
- Laravel test suite setup

## Inputs
- Feature test directory structure
- Pest-specific syntax and helpers

## Workflow
1. Organize tests with `describe()` blocks per resource: `describe('Users', function () { ... })`
2. Use named test functions: `it('lists all users', function () { ... })`
3. Apply `beforeEach()` closures for shared setup at describe or file level
4. Use `dataset()` for data-driven test input: `$users = [...];
5. Apply `uses(Tests\TestCase::class)` for framework integration at file level
6. Leverage Pest's `toBe()` expectation matchers as API structure assertions
7. Use `arch()->expect('App\Models')->toUse('Illuminate\Database\Eloquent\Model')` for architecture tests
8. Group tests with `->group('users', 'api')` for targeted test runs
9. Use `highOrderMessage` providers for compact data tables with `with()` and `expect()` directly
10. Keep describe blocks focused — one resource per file with nested describes for actions

## Validation Checklist
- [ ] Test file uses `uses(Tests\TestCase::class)` for framework integration
- [ ] `describe()` blocks organize tests per resource
- [ ] `dataset()` providers for data-driven test scenarios
- [ ] `beforeEach()` for shared setup where applicable
- [ ] Test groups applied for targeted execution
- [ ] Architecture tests validate project structure
- [ ] Describe blocks focused — one resource per file
- [ ] Tests readable as plain language expectations

## Common Failures
- Unnecessary describe nesting — more than 3 levels makes tests harder to navigate
- No `uses()` call — Pest doesn't bootstrap Laravel, tests fail with framework errors
- Over-using `each()` assertion — makes test failures harder to debug
- Tests that are overly compact — readability over terseness
- Mixing `it()` and `test()` — use one convention consistently

## Decision Points
- `it()` vs `test()` — `it('does something')` reads more naturally
- `describe()` vs file-per-test — describe for grouping, file for separation of concerns
- `dataset()` vs inlined data — datasets for reuse, inlined for one-off cases

## Performance Considerations
- `dataset()` with large arrays is loaded eagerly — use generators for large datasets
- `beforeEach()` runs before each test in describe — test count impacts total runtime
- Architecture tests run once per file — group them to avoid per-test overhead

## Security Considerations
- Never include credentials or secrets in data providers
- Architecture tests for security traits (e.g. all auth controllers have `CheckAuth` middleware)
- Test that authorization checks exist via arch tests where appropriate

## Related Rules
- Use describe Blocks to Group Related Test Cases
- Use beforeEach Closures For Shared Setup
- Apply use Statement For Laravel Integration
- Use dataset For Data-Driven Tests
- Apply test Groups For Targeted Execution
- Keep Tests Readable As Plain Language
- Use Architectural Tests For Structural Enforcement

## Related Skills
- Feature Test Structure — for traditional PHPUnit structure
- HTTP Endpoint Assertions — for assertion patterns
- Pest Custom Expectations — for extending Pest expectations

## Success Criteria
- Tests are readable as natural language descriptions
- describe blocks clearly organize tests by resource and action
- Data providers cover boundary cases without duplication
- Test groups enable targeted execution of user-related or API-related tests
- Architecture tests enforce project conventions
- beforeEach setup is DRY and shared appropriately
