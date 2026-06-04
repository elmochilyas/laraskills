# Skill: Implement the Null Driver Pattern for Testing

## Purpose
Create no-op implementations of interfaces (null drivers) that silently accept calls and return default values, enabling classes to be tested without mocking every consumer of the interface.

## When To Use
- For interfaces consumed by many classes where mocking each call site is tedious
- When you need a default "nothing happens" implementation for testing
- For logging, caching, metrics, and notification services that are side-effect-free in tests
- When you want to verify that code runs without errors without checking specific side effects

## When NOT To Use
- When you need to verify specific interactions (use a mock or spy instead)
- For interfaces with complex return values that affect control flow (use a stub)
- When the null driver's silent behavior would mask bugs (use a real implementation)
- As a replacement for all test doubles — null drivers are one tool among many

## Prerequisites
- Interface definition that the null driver will implement
- Understanding of the interface's method signatures and expected return types

## Inputs
- Interface to implement silently
- Default return values for each method (null, empty array, 0, false)
- Methods that return `void` or `$this` for chaining

## Workflow
1. Create a class that implements the target interface
2. For each method, return a default safe value (null, empty array, 0, false, or `$this`)
3. For void methods, leave the body empty
4. Use the null driver in tests by binding it to the container: `$this->app->instance(Contract::class, new NullDriver())`
5. In production, replace the null driver with the real implementation via container binding
6. Document the null driver's behavior — it should be explicitly clear that it does nothing

## Validation Checklist
- [ ] Null driver implements every method of the target interface
- [ ] Return values are safe defaults (null, empty array, 0, false, `$this`)
- [ ] Methods with side effects (logging, caching, emailing) do nothing
- [ ] Null driver can be bound via container and resolved in tests
- [ ] Tests using the null driver pass without side effects
- [ ] Null driver is documented as a testing-only implementation

## Common Failures
- Null driver returns values that accidentally affect test assertions
- Not implementing new interface methods when the interface evolves
- Using null driver when mock verification is needed (not tracking interaction)
- Null driver with side effects (defeats the purpose)
- Not clearly marking the class as a null driver (confusing for new developers)

## Decision Points
- Null driver vs mock — null driver for silent pass-through, mock for interaction verification
- Null driver vs fake — null driver for no-op, fake for lightweight working implementation
- Null driver in production — never use null drivers in production; they hide real behavior

## Performance Considerations
- Null drivers are the fastest possible implementation (empty method bodies)
- No overhead for mock setup or expectation verification
- Ideal for hot paths where performance matters

## Security Considerations
- Null drivers silence security-related services (logging, audit) — ensure security tests use real or spy implementations
- Never use null drivers for authentication, authorization, or encryption interfaces in any environment
- Document security implications in the null driver class docblock

## Related Rules
- [Rule: Use Null Drivers for Silent No-Op in Tests](./05-rules.md)
- [Rule: Never Use Null Drivers in Production](./05-rules.md)
- [Rule: Document Null Driver Behavior Explicitly](./05-rules.md)

## Related Skills
- Test Doubles and Mocks
- Laravel Fakes
- Dependency Injection Testing

## Success Criteria
- [ ] Null driver exists for at least one interface and implements all methods
- [ ] Tests using the null driver run without side effects (no emails, no log output)
- [ ] New interface methods are added to the null driver when the interface changes
- [ ] The null driver is clearly documented as a testing-only implementation
