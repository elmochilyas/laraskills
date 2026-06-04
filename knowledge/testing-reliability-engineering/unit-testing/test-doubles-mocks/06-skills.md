# Skill: Use Test Doubles, Stubs, and Mocks

## Purpose
Substitute real dependencies with controlled test doubles (dummies, stubs, spies, mocks, fakes) to isolate the system under test and verify specific interactions without relying on external services.

## When To Use
- When a dependency makes HTTP calls, writes to the filesystem, or sends emails
- When testing error handling for external service failures
- When verifying that specific methods are called with correct arguments
- When a real dependency would make the test slow, non-deterministic, or impossible
- When you need to assert the side effects of a method (what was called, how many times)

## When NOT To Use
- When the real implementation is faster and equally deterministic
- For value objects, collections, or simple data containers (use real instances)
- When mocking leads to brittle tests that fail on implementation changes
- When you don't need to verify interaction — use real implementations for output verification

## Prerequisites
- Understanding of the five double types: dummy, stub, spy, mock, fake
- PHPUnit's built-in mock methods or Mockery library
- Knowledge of the interface or class being doubled

## Inputs
- Real dependency class or interface
- Specific return values or exceptions for stubbed methods
- Expected call counts and argument constraints for mocks
- Fake implementation logic for state-verifying doubles

## Workflow
1. Identify the type of double needed: dummy (ignored), stub (returns value), spy (records calls), mock (expects calls), fake (working alternative)
2. Create the double using `$this->createMock()` (PHPUnit) or `Mockery::mock()` (Mockery)
3. Configure stubs with `method()->willReturn()` for return values
4. Set up mock expectations with `shouldReceive()->with()->andReturn()` for call verification
5. For fakes, implement the interface with a lightweight in-memory version
6. Inject the double into the system under test via constructor or method parameter
7. Execute the action under test
8. Verify mock expectations (automatic in Mockery with `Mockery::close()`)
9. For spies, assert on recorded calls after the action

## Validation Checklist
- [ ] Correct double type is chosen for the test scenario
- [ ] Stub return values are deterministic and cover edge cases
- [ ] Mock expectations verify meaningful interaction, not implementation details
- [ ] Mock expectations are verified (Mockery::close or PHPUnit mock verification)
- [ ] Fakes behave like the real implementation for the scenario under test
- [ ] Tests pass without network or filesystem access

## Common Failures
- Using a mock when a stub suffices — over-verification of implementation details
- Not covering error scenarios — stubs should also throw exceptions to test error handling
- Mocking value objects — leads to brittle tests; use real instances
- Not resetting mocks between tests — mock expectations leak and cause false failures
- Verifying call order unnecessarily — only use `at()` or `ordered()` when order is truly critical

## Decision Points
- Mock vs stub — mock for behavior verification, stub for providing values
- Mock vs fake — mock for interaction verification, fake for state verification
- PHPUnit mock vs Mockery — PHPUnit for simple cases, Mockery for complex argument matching

## Performance Considerations
- Test doubles have negligible overhead (<0.1ms per mock method call)
- Fakes may be slower than mocks but still faster than real implementations
- Avoid creating doubles for every class in the dependency graph — one level of indirection is sufficient

## Security Considerations
- Mock security services carefully — ensure authorization checks are tested with both pass/fail paths
- Don't mock authentication middleware — test the full auth flow with HTTP feature tests
- Verify that security-sensitive methods are called with correct parameters

## Related Rules
- [Rule: Use the Right Double Type for the Job](./05-rules.md)
- [Rule: Prefer Real Implementations Over Mocks](./05-rules.md)
- [Rule: Reset Mock State Between Tests](./05-rules.md)

## Related Skills
- Mockery Integration
- Null Driver Pattern
- Laravel Fakes

## Success Criteria
- [ ] Each test uses the minimum double type that achieves the testing goal
- [ ] Tests with mocks pass without any external service dependency
- [ ] Error handling is tested by configuring stubs/mocks to throw exceptions
- [ ] Mock expectations verify behavior, not implementation
- [ ] Fakes provide a working in-memory alternative to the real implementation
