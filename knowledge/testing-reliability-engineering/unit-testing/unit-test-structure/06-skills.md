# Skill: Structure Unit Tests with AAA and Descriptive Naming

## Purpose
Write clear, maintainable unit tests using the Arrange-Act-Assert pattern with descriptive test names that document expected behavior.

## When To Use
- Every unit test as the standard structure
- When writing tests that need to be readable by other developers
- When test failure reports must immediately indicate what broke
- When onboarding new team members who need tests as documentation

## When NOT To Use
- For extremely trivial tests (1-2 lines where AAA adds vertical space)
- For data-driven tests where the assertion is inline with the data provider
- When testing simple getters/setters (overkill)

## Prerequisites
- PHPUnit or Pest test class structure
- Understanding of the test target's expected behavior

## Inputs
- Description of the expected behavior (becomes the test name)
- Setup data (Arrange)
- Action to perform (Act)
- Expected outcome (Assert)

## Workflow
1. Write a descriptive test name as a sentence: `test('rejects invoice with past due date')`
2. Separate the test into three sections with blank line breaks
3. **Arrange**: Create the minimum objects needed, configure state with explicit values
4. **Act**: Execute the single action being tested — one clear method call
5. **Assert**: Verify the outcome with the appropriate assertion method
6. Ensure each test verifies exactly one behavior — one logical assertion
7. Use Pest's `->assert()` chaining or PHPUnit's fluent assertions for multiple checks

## Validation Checklist
- [ ] Test name describes the expected behavior, not the implementation
- [ ] AAA sections are visually separated by blank lines
- [ ] Arrange creates only the minimum data needed
- [ ] Act is a single, clear action
- [ ] Assert verifies the outcome, not implementation details
- [ ] One logical assertion per test

## Common Failures
- Test names like `test_invoice()` that don't convey intent
- AAA sections mixed together with no visual separation
- Multiple actions in one test (asserting after each step)
- Arrange section creating data that's never used in the assertion
- Testing implementation details instead of behavior

## Decision Points
- One assertion vs multiple related assertions — multiple is fine if they verify the same outcome
- Inline setup vs declarative factory method — factory methods for complex or repeated setup
- Pest `test()` vs PHPUnit method — Pest for descriptive names, PHPUnit for IDE navigation

## Performance Considerations
- AAA structure does not affect performance
- Well-structured tests are easier to profile and optimize
- Descriptive names make CI failure reports immediately actionable

## Security Considerations
- Test names and assertion values may appear in CI logs — avoid real PII
- Arrange section should not create data with real user credentials

## Related Rules
- [Rule: Use Descriptive Test Names](./05-rules.md)
- [Rule: Use AAA with Blank Line Separation](./05-rules.md)
- [Rule: Prefer Readable Tests Over DRY Tests](./05-rules.md)

## Related Skills
- Declarative Factory Methods
- Unit Test Naming Conventions
- Test Organization Patterns

## Success Criteria
- [ ] Each test is readable as a specification of behavior
- [ ] A new team member can understand the system behavior by reading test names
- [ ] Failure reports immediately indicate what expected behavior was violated
- [ ] Tests are self-contained and don't require navigating to setup methods
