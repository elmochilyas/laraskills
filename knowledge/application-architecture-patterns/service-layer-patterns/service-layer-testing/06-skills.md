# Skill: Test Service Layer Components Effectively

## Purpose
Test services, actions, and use cases by mocking boundaries (repositories, mailers, APIs), testing outcomes not call sequences, using in-memory implementations for contract tests, adding integration tests for repositories, and prioritizing unit tests for coverage.

## When To Use
- Always — service layer is where orchestration bugs live

## When NOT To Use
- Prototype-stage (but add tests before production)

## Prerequisites
- PHPUnit test knowledge
- Understanding of mocking and dependency injection

## Inputs
- Service/action/use case classes under test
- Identified boundary dependencies to mock

## Workflow
1. **Mock the boundaries, not the internals.** Mock repositories, mailers, and external APIs — the boundaries of the service. Do not mock value objects, request data, or domain models.

2. **Test outcomes, not call sequences.** Assert on return values and observable state, not the specific order of method calls on mocks. Testing call sequences couples tests to implementation details.

3. **Use in-memory implementations for contract tests.** In-memory repositories are faster than mocks for testing complex query logic and more reliable than mocked expectations. Create `InMemoryInvoiceRepository` that implements the interface.

4. **Add integration tests for repositories.** Test every repository method against a real database using `RefreshDatabase`. Mocked repositories can produce incorrect results that pass tests.

5. **Prioritize unit tests for coverage, feature tests for critical paths.** Unit tests (milliseconds) should be the majority. Feature tests (hundreds of milliseconds) reserved for critical business journeys.

6. **Avoid over-mocking.** Each mock increases test complexity and reduces confidence. Mock only external boundaries that have side effects or alternative implementations.

## Validation Checklist
- [ ] Services tested with mocked dependencies (boundaries only)
- [ ] Tests verify outcomes, not call sequences
- [ ] In-memory implementations exist for contract tests
- [ ] Repository methods have integration tests against real DB
- [ ] Tests are fast (unit) with few slow (feature) tests
- [ ] No over-mocking (value objects and models are real objects)

## Common Failures
- **Testing implementation details.** Verifying specific method calls in specific order — brittle tests break on refactoring.
- **Over-mocking.** Mocking every dependency including value objects — tests don't verify real behavior.
- **No integration tests for repositories.** Relying only on mocked repos — mock may pass while real DB fails.

## Decision Points
- **Unit test vs Feature test?** Unit test (mocked deps) for service logic coverage. Feature test (full stack) for critical business journeys only.

## Performance Considerations
- Unit tests with mocks: milliseconds.
- Feature tests with database: hundreds of milliseconds.
- Prioritize unit tests for coverage, feature tests for critical paths.

## Security Considerations
- No direct implications. Test authorization separately (policies, form requests).

## Related Rules
- Rule: Mock The Boundaries, Not The Internals (SLP-17/05-rules.md)
- Rule: Test Outcomes, Not Call Sequences (SLP-17/05-rules.md)
- Rule: Use In-Memory Implementations For Contract Tests (SLP-17/05-rules.md)
- Rule: Add Integration Tests For Repositories (SLP-17/05-rules.md)
- Rule: Avoid Over-Mocking (SLP-17/05-rules.md)
- Rule: Prioritize Unit Tests For Coverage, Feature Tests For Critical Paths (SLP-17/05-rules.md)

## Related Skills
- Design Service Classes (SLP-01/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)
- Design Use Case Classes (SLP-06/06-skills.md)
- Run Architecture Tests (AEG-01/06-skills.md)
- Write Modular Monolith Tests (MMD-16/06-skills.md)

## Success Criteria
- Service tests mock only boundary dependencies; value objects and models are real.
- Tests assert on outcomes and state, not on call sequences.
- In-memory implementations exist for contract testing of complex query logic.
- Every repository method has an integration test against a real database.
- Unit tests dominate the test suite; feature tests cover only critical paths.
