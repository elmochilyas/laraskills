# Skill: Select the Correct Test Double Type

## Purpose
Choose the appropriate test double type — dummy, stub, spy, mock, or fake — for each testing scenario based on what needs to be verified (return values, side effects, or interaction).

## When To Use
- When deciding how to replace a dependency in any test
- When writing test doubles for the first time in a project
- During code review to evaluate whether the right double type was chosen
- When designing interfaces for testability (prefer interfaces that are easy to double)

## When NOT To Use
- When the real implementation is simple and fast — don't double at all
- When you're unsure of the test goal — clarify the assertion first, then choose the double
- As a rigid classification system — practical overlaps between types are acceptable

## Prerequisites
- Understanding of the five double types and their purposes
- Knowledge of the system under test and its dependencies

## Inputs
- Type of verification needed (return value, side effect, call count)
- Dependency being replaced (interface, class)
- Test scenario (happy path, error handling, edge case)

## Workflow
1. Determine what the test needs to verify about the dependency interaction
2. If the dependency isn't used by the test but is required by the constructor → **Dummy** (null, empty object)
3. If the dependency returns controlled values for the test scenario → **Stub** (`willReturn`)
4. If the dependency records what methods were called for later inspection → **Spy** (assert after action)
5. If the dependency must be called with specific arguments a specific number of times → **Mock** (`shouldReceive`)
6. If a lightweight in-memory implementation of the interface is cleaner than per-test stubs → **Fake** (in-memory repository)
7. Document the double type choice in the test if it's not obvious

## Validation Checklist
- [ ] Dummy is used when the dependency's behavior is irrelevant
- [ ] Stub is used when providing controlled return values is sufficient
- [ ] Spy is used when recording interaction for later assertion
- [ ] Mock is used when verifying call expectations before the action
- [ ] Fake is used when an in-memory implementation reduces test complexity
- [ ] Double type choice is justified by the test's verification goal

## Common Failures
- Using a mock when a stub suffices — over-verification of implementation
- Using a stub when only a dummy is needed — wasted setup
- Using a mock for void methods when a spy is more natural
- Building a fake for an interface with complex behavior (use mocks instead)
- Not using a double when the real dependency is non-deterministic

## Decision Points
- Mock vs spy — mock for pre-action expectations, spy for post-action inspection
- Stub vs fake — stub for per-test custom values, fake for reusable in-memory implementation
- Dummy vs null driver — null driver when many tests use the dependency, dummy for one-off

## Performance Considerations
- Dummies and fakes have zero setup overhead after creation
- Mocks and spies have slight setup overhead (negligible)
- Fakes may be slower than mocks if they contain real logic
- All doubles are faster than real implementations that do I/O

## Security Considerations
- Security-related interfaces (auth, encryption) should rarely be doubled — prefer real or fake
- When doubling security services, ensure both pass and fail paths are tested
- Document when a security-critical service is replaced with a double

## Related Rules
- [Rule: Use the Right Double Type for the Job](./05-rules.md)
- [Rule: Prefer Real Implementations Over Doubles](./05-rules.md)
- [Rule: Choose Double Based on Verification Goal](./05-rules.md)

## Related Skills
- Test Doubles and Mocks
- Null Driver Pattern
- Laravel Fakes

## Success Criteria
- [ ] Each test's double type is justified by what the test needs to verify
- [ ] Team members consistently choose the same double type for the same scenario
- [ ] Code review discussions about doubles focus on verification goals, not personal preference
- [ ] Tests only use more complex doubles (mock, spy) when simpler ones (stub, dummy) are insufficient
