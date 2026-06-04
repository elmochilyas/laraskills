# Skill: Write Unit Tests for a Service Class

## Purpose
To write fast, reliable unit tests that validate service method behavior by instantiating the service with mocked dependencies and asserting on return values.

## When To Use
- Every service method containing business logic, conditional branching, or orchestration
- When adding new service methods
- When fixing bugs in service methods (test the repro case first)

## When NOT To Use
- CRUD pass-through methods that only delegate to a repository (test at feature level or eliminate the method)
- Methods with no business logic, no branching, and no orchestration

## Prerequisites
- Service class with constructor injection
- PHPUnit or Pest configured
- Mockery or Laravel's mocking helpers available
- Model/DTO factories for test data creation

## Inputs
- Service class under test
- List of methods and their conditional branches
- Factory definitions for test inputs

## Workflow
1. Create a test file for the service: `tests/Unit/Services/{Entity}ServiceTest.php`.
2. In `setUp()`, instantiate the service with mocked dependencies. Mock only external/expensive dependencies (repositories, HTTP clients, gateways). Use real implementations for pure domain services, calculators, and value objects.
3. For each service method, identify all conditional branches. Create one test per branch:
   - Happy path: mock dependencies to return success, call the method, assert on the return value.
   - Error paths: mock a dependency to throw an exception, assert the service handles it correctly (re-throws, wraps, returns fallback).
   - Edge cases: empty inputs, boundary values, null returns from dependencies.
4. Prefer result assertions (assert on the return value) over mock interaction assertions (assert that a method was called). Use mock assertions only to verify I/O operations happened with correct parameters.
5. Use factory methods or DTO factories to create test inputs — never raw arrays with inline data for inputs with more than 2 fields.
6. Run the test suite and verify all tests pass. Confirm branch coverage is 100% for each tested method.
7. Name each test method after the single behavior it verifies: `test_place_order_creates_order()`, `test_place_order_throws_when_payment_fails()`.

## Validation Checklist
- [ ] Service is instantiated directly (not via HTTP request) — unit test, not feature test
- [ ] Only external/expensive dependencies are mocked; pure logic uses real implementations
- [ ] All conditional branches have at least one test case
- [ ] Each test method verifies exactly one behavior
- [ ] Result assertions are preferred over mock interaction assertions
- [ ] Test inputs use factories, not raw inline arrays (for inputs with 2+ fields)
- [ ] Error handling paths are tested: each dependency failure scenario has a test
- [ ] Test method names describe the behavior being verified
- [ ] No tests for CRUD pass-through methods that lack business logic
- [ ] Tests run in milliseconds — no framework boot per test

## Common Failures
- Testing services via HTTP feature tests (slow, tests HTTP not service logic)
- Over-mocking — mocking pure domain services and value objects (fragile tests)
- Only testing the happy path, missing error branches
- Testing multiple behaviors in a single test method
- Using raw arrays instead of factories for test data (brittle to field additions)
- Asserting mock interactions instead of return values (tests implementation not behavior)
- Writing tests for CRUD pass-through methods (low-value, brittle)

## Decision Points
- Mock or use real implementation? → Mock only I/O dependencies (repositories, gateways, HTTP). Use real for pure domain services, calculators, DTOs.
- One test per branch or one test per method? → One test per conditional branch within each method.
- Exactly how to assert? → Assert on return values first. Use mock assertions only for verifying I/O calls.

## Performance Considerations
- Unit tests should run in milliseconds — no database, no HTTP, no framework boot
- Use in-memory or fake implementations for repositories when practical instead of mocking every call
- Group related service tests in the same test class to share setup

## Security Considerations
- Do not include real credentials, API keys, or secrets in test fixtures
- Use faker or factories to generate realistic but non-sensitive test data
- Tests should not connect to external services — all external calls must be mocked

## Related Rules
- **Rule 1**: Test Services as Unit Tests, Not Feature Tests
- **Rule 2**: Mock Only External or Expensive Dependencies
- **Rule 3**: Prefer Result Assertions Over Mock Interaction Assertions
- **Rule 4**: Test All Conditional Branches
- **Rule 5**: Use Factory Data for Test Inputs
- **Rule 6**: Test Error Handling Paths
- **Rule 7**: Each Test Must Verify One Behavior
- **Rule 8**: Do Not Test CRUD Pass-Through at the Service Level

## Related Skills
- Design a Service Class
- Orchestrate a Multi-Step Workflow in a Service Method

## Success Criteria
- Every service method with business logic has corresponding unit tests
- All conditional branches are covered by at least one test
- Tests run in milliseconds without framework boot
- Test failures clearly indicate which behavior broke
- Adding a new dependency to the service requires minimal test changes
