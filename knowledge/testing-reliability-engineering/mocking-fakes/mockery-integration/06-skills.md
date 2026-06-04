# Skill: Integrate Mockery into Laravel Tests

## Purpose
Use Mockery as a more expressive alternative to PHPUnit's built-in mocking for complex test scenarios requiring partial mocks, advanced argument matching, and flexible expectation verification.

## When To Use
- When PHPUnit's built-in mocking is insufficient (complex argument matching, ordered expectations)
- When using partial mocks to test a class while mocking only specific methods
- When verifying method call order or exact call counts
- When using advanced argument matchers like `any()`, `type()`, `contains()`
- When mocking non-instantiable classes or interfaces with complex contracts

## When NOT To Use
- For simple stubs and dummies (PHPUnit's built-in mocks are sufficient)
- When the team is unfamiliar with Mockery's API (consistency over features)
- When mocking Eloquent models (use real model factories instead)
- When the verification can be done without expectations (use spies or fakes)

## Prerequisites
- Mockery library installed (included with Laravel)
- Understanding of Mockery's expectation API: `shouldReceive`, `with`, `andReturn`, `times`
- Knowledge of `Mockery::mock()`, `Mockery::spy()`, and partial mocks

## Inputs
- Class or interface to mock
- Method names and expected arguments
- Return values or exceptions to simulate
- Expected call counts and order

## Workflow
1. Create a mock: `$mock = Mockery::mock(Interface::class)`
2. Set expectations: `$mock->shouldReceive('method')->with($arg)->andReturn($value)->once()`
3. For complex argument matching, use matchers: `Mockery::on(fn ($arg) => $arg->id > 0)`
4. For partial mocks: `$partial = Mockery::mock(RealClass::class)->makePartial()`
5. For spies (record and assert later): `$spy = Mockery::spy(Interface::class)`
6. Inject the mock into the system under test
7. Execute the action under test
8. For spies, assert after the action: `$spy->shouldHaveReceived('method')->with($arg)`
9. Verify all expectations: `Mockery::close()` in tearDown or `afterEach()`

## Validation Checklist
- [ ] `Mockery::close()` is called after the test to verify expectations
- [ ] Mock expectations use `with()` to verify arguments
- [ ] Call counts are specified (`once()`, `twice()`, `times(3)`, `zeroOrMoreTimes()`)
- [ ] Partial mocks are used correctly (only mock the specific method, not the whole class)
- [ ] Argument matchers are used for complex validation
- [ ] Spies are used when post-action assertion is more natural

## Common Failures
- Not calling `Mockery::close()` — expectations silently pass without verification
- Over-specifying expectations — `shouldReceive` without `with` is too loose; `exactly(1)` for every call is too strict
- Mocking the class under test — only mock collaborators, never the SUT itself
- Using `shouldReceive` on non-mock objects — must use a Mockery mock instance
- Partial mock confusion — `makePartial()` preserves real behavior except for specified methods

## Decision Points
- Mockery vs PHPUnit mock — Mockery for complex expectations, PHPUnit for simple stubs
- Mock vs spy — mock for pre-action expectations, spy for post-action assertions
- Partial mock vs real instance — partial when you need to stub one method, real when you don't need to mock

## Performance Considerations
- Mockery mocks have slightly more overhead than PHPUnit mocks (~0.2ms vs ~0.05ms)
- Complex argument matchers add negligible overhead
- `Mockery::close()` is fast (<0.5ms)
- Avoid creating many mocks in a single test — 5+ mocks indicate poor design

## Security Considerations
- Ensure security-related mocks return appropriate values for each test scenario
- Don't mock security services in tests that verify security behavior
- Mockery expectation errors are clear — use them to document expected security contracts

## Related Rules
- [Rule: Call `Mockery::close()` in TearDown](./05-rules.md)
- [Rule: Use Spies for Post-Action Assertions](./05-rules.md)
- [Rule: Prefer Real Instances Over Partial Mocks](./05-rules.md)

## Related Skills
- Test Doubles and Mocks
- Dependency Injection Testing
- Laravel Fakes

## Success Criteria
- [ ] Mockery `shouldReceive` expectations verify meaningful method calls
- [ ] `Mockery::close()` is always called and no lingering expectations exist
- [ ] Spies are used for verifiable side effects, mocks for call expectations
- [ ] Complex argument matching uses `Mockery::on()` rather than fragile exact matches
