# Skill: Create and Use DTO Test Factories

## Purpose
Build custom factory classes for non-Eloquent objects (DTOs, value objects, plain PHP classes) to enable consistent, readable test data creation without relying on Eloquent models.

## When To Use
- Testing value objects, DTOs, or plain PHP classes that lack Eloquent factories
- When test data for custom classes requires repeated setup in multiple tests
- When encapsulating complex object construction behind a clear, named factory
- In unit tests where Eloquent models are not available or appropriate

## When NOT To Use
- For simple DTOs with 1-2 properties (inline construction is clearer)
- When the DTO constructor parameters are trivially simple
- As a replacement for existing Laravel model factories (use those instead)
- When the factory adds more complexity than the inline construction it replaces

## Prerequisites
- Understanding of PHP class constructors and named parameters
- Familiarity with the DTO/value object being tested
- Test class with access to helper methods or factory traits

## Inputs
- DTO class definition and constructor signature
- Default values for each DTO property
- Custom overrides for specific test scenarios

## Workflow
1. Identify non-Eloquent classes used in tests that require repeated data creation
2. Create a factory class or trait with a `make()` method returning a default instance
3. Accept `$overrides` array to customize specific properties
4. Provide `create()` method if persistence is needed (uncommon for DTOs)
5. Use parameterized methods for common variations (e.g., `makeExpiredSubscription()`)
6. Organize factories in domain-specific traits under `Tests/Helpers/`
7. Return typed values for IDE autocompletion
8. Use deterministic defaults — never `now()`, `rand()`, or Faker in factory defaults

## Validation Checklist
- [ ] Factory method returns the correct DTO type
- [ ] Overrides correctly merge with defaults
- [ ] Default values are deterministic and test-relevant
- [ ] Factory is organized in a domain-specific trait or class
- [ ] Return type is explicitly declared
- [ ] Complex variations have their own named methods

## Common Failures
- Factory defaults that use `now()` or Faker → non-reproducible tests
- Factory with too many parameters → unreadable call sites
- Hidden side effects in factory methods → unexpected test behavior
- No return type declaration → no IDE autocompletion
- Over-engineering simple DTOs → more code than inline construction

## Decision Points
- Trait vs dedicated factory class — traits for simple helpers, dedicated classes for complex construction
- `make()` vs `create()` — `make()` for in-memory (common for DTOs), `create()` rarely needed
- Fixed defaults vs parameterized — fixed for simple factories, parameterized for varied scenarios

## Performance Considerations
- DTO factory instantiation is negligible (<0.1ms)
- No database writes, making DTO factories much faster than model factories
- PHP class loading for factory traits adds no measurable overhead

## Security Considerations
- Factory defaults should not contain sensitive or real user data
- DTO factories bypass Eloquent attribute casting — ensure type consistency with production code

## Related Rules
- [Rule: Name Methods to Describe What Is Created](./05-rules.md)
- [Rule: Use `create`/`make` Convention](./05-rules.md)
- [Rule: Always Declare Return Types](./05-rules.md)

## Related Skills
- Declarative Factory Methods
- Factory States and Sequences
- Minimal Data Principle

## Success Criteria
- [ ] A non-Eloquent factory can create a default DTO instance in one method call
- [ ] Overrides customize specific properties without affecting defaults
- [ ] Named variation methods exist for common test scenarios
- [ ] Factory is reused across multiple test files in the same domain
