# Skill: Apply Unit Testing Patterns for Laravel Classes

## Purpose
Apply established unit testing patterns — First-Right, Given-When-Then, and the 70/20/10 distribution — to write effective, maintainable unit tests for Laravel service classes, actions, and helpers.

## When To Use
- When establishing testing patterns for a new Laravel project
- When writing unit tests for service classes, actions, jobs, and listeners
- When deciding how many tests to write and at what level
- When reviewing tests for consistency with team patterns

## When NOT To Use
- For testing Eloquent models or database interactions (use feature tests)
- For testing HTTP request/response cycles (use feature tests)
- When the pattern adds ceremony without value for simple tests
- When the team hasn't agreed on a shared pattern vocabulary

## Prerequisites
- Pest or PHPUnit test writing experience
- Understanding of the 70/20/10 test distribution
- Knowledge of the class under test and its collaborators

## Inputs
- Class under test and its public API
- Test distribution decision (unit vs feature vs E2E)
- Pattern for organizing test files and names

## Workflow
1. Apply the 70/20/10 rule: 70% feature (HTTP) tests, 20% unit tests, 10% E2E/browser tests
2. Write unit tests for classes with complex business logic: services, actions, value objects, domain events
3. Use Given-When-Then as an alternative naming/structure convention for behavior-driven tests
4. Use First-Right: write the test before the implementation (red-green-refactor cycle)
5. Extract shared setup into declarative factory methods when patterns repeat across 3+ tests
6. Test the happy path first, then edge cases, then error conditions
7. Keep unit tests focused on a single class — mock or stub all collaborators

## Validation Checklist
- [ ] 70/20/10 distribution is maintained across the test suite
- [ ] Unit tests exist for service classes, actions, and value objects
- [ ] Each unit test verifies one behavior
- [ ] Tests are organized by feature, not by implementation type
- [ ] First-Right (TDD) is used for new business logic
- [ ] Given-When-Then structure is used consistently if adopted by the team

## Common Failures
- Writing unit tests for classes with no business logic (empty services, pass-through actions)
- Testing implementation details (internal methods, private state) instead of behavior
- Over-relying on mocks — unit tests with 5+ mocks are brittle and slow
- Neglecting unit tests entirely (only writing feature tests) — slow suite, poor isolation
- Writing too many E2E tests (slow, brittle) — keep E2E to 10% of the suite

## Decision Points
- Unit vs feature test — unit for isolated logic, feature for database/HTTP integration
- Given-When-Then vs AAA — GWT for behavior-driven style, AAA for technical structure
- TDD vs test-after — TDD for new complex logic, test-after for bug fixes and simple classes

## Performance Considerations
- Unit tests run in milliseconds — invest more in unit tests for faster CI feedback
- 70% feature tests is fine but ensure they're optimized (minimal data, RefreshDatabase)
- Each mock adds ~0.5ms overhead — 10 mocks per test adds up across 100 tests
- Feature tests with database are 10-50x slower than unit tests per test

## Security Considerations
- Unit test authorization logic with every role/permission combination
- Security-critical unit tests (password hashing, rate limiting) must be deterministic
- Never mock security services in unit tests that verify security behavior

## Related Rules
- [Rule: Apply the 70/20/10 Distribution](./05-rules.md)
- [Rule: Write Tests Before Implementation](./05-rules.md)
- [Rule: Test the What, Not the How](./05-rules.md)

## Related Skills
- Class Method Testing
- Test Doubles and Mocks
- Dependency Injection Testing

## Success Criteria
- [ ] Unit tests run in <5 seconds for a project with 200+ unit tests
- [ ] Each service class has a corresponding test file covering its public API
- [ ] New features include tests at the unit level before integration tests
- [ ] Test suite follows the 70/20/10 distribution consistently
