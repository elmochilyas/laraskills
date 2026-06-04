# Skill: Test Class Methods in Isolation

## Purpose
Test individual PHP class methods in isolation by instantiating the class with mocked dependencies, invoking the method, and asserting the return value or side effect without triggering the full framework or database.

## When To Use
- Testing service classes, actions, jobs, listeners, and other non-controller classes
- When you need to verify business logic without database or HTTP overhead
- For classes with external dependencies that slow down or complicate testing
- When isolating the method under test from side effects (mail, queues, HTTP calls)

## When NOT To Use
- For trivial methods that simply delegate to another object
- When the class under test is an Eloquent model (use feature tests with the database)
- For controller methods (use feature/HTTP tests for request/response verification)
- When over-mocking makes the test brittle (test collaborator behavior, not implementation)

## Prerequisites
- PHPUnit or Pest test class
- Understanding of the class constructor and its dependencies
- Knowledge of dependency injection and interface design

## Inputs
- Class name and constructor parameters
- Method name and arguments to test
- Expected return value or side effect
- Mock/fake definitions for external dependencies

## Workflow
1. Instantiate the class with its dependencies (use real implementations when possible, mocks only for slow/unreliable services)
2. Set up the test data and mock expectations for the method call
3. Invoke the method under test with specific arguments
4. Assert the return value matches expectations
5. Assert expected side effects on mocked collaborators (method was called with correct args)
6. Cover the happy path, edge cases (null inputs, empty collections), and error conditions
7. Follow AAA structure with blank line separation

## Validation Checklist
- [ ] Class is instantiated with all constructor dependencies
- [ ] Mocks are used only for slow or unreliable dependencies
- [ ] Method is invoked with explicit, deterministic arguments
- [ ] Return value or side effect is asserted
- [ ] Happy path and at least one error/edge case are tested
- [ ] Mock expectations verify correct interaction (call count, arguments)

## Common Failures
- Testing implementation details (which methods were called) instead of behavior (what result was produced)
- Over-mocking — mocking every dependency, making the test brittle
- Not covering edge cases — null inputs, empty arrays, boundary values
- Testing the framework or ORM instead of business logic
- Mocking Eloquent models (use real model instances or factories)

## Decision Points
- Real implementation vs mock — always prefer real for fast, deterministic services
- Return value assertion vs side effect assertion — prefer return value when possible
- Unit test vs feature test — unit for isolated logic, feature for database/HTTP integration

## Performance Considerations
- Unit tests are the fastest test type (<10ms per test)
- Avoid database calls in unit tests — they slow tests and add dependencies
- Mocked method calls have negligible overhead (<0.1ms)

## Security Considerations
- Test authorization and permission logic in isolation with different user states
- Ensure sensitive data is not logged or exposed in test output
- Verify input validation and sanitization at the method level

## Related Rules
- [Rule: Use Descriptive Test Names](./05-rules.md)
- [Rule: Use AAA with Blank Line Separation](./05-rules.md)
- [Rule: Test the What, Not the How](./05-rules.md)

## Related Skills
- Test Doubles and Mocks
- Dependency Injection Testing
- Unit Testing Patterns

## Success Criteria
- [ ] Each public method has at least one happy-path and one edge-case test
- [ ] Tests run without database or HTTP setup (>10x faster than feature tests)
- [ ] Mock expectations verify meaningful interactions, not implementation details
- [ ] Business logic is verified independently of framework concerns
