# Skill: Create and Use Invokable Custom Validation Rules

## Purpose
Build reusable, testable custom validation rules as invokable classes that encapsulate domain-specific validation logic.

## When To Use
- Validation logic used in more than one FormRequest or validation context
- Complex validation requiring database queries, API calls, or business logic
- Domain-specific constraints (valid postal code, coupon code, membership number)
- When built-in Laravel rules are insufficient

## When NOT To Use
- Simple checks expressible with built-in rules
- One-off validation for a single FormRequest (use Closure rules)
- Validation that depends heavily on FormRequest context

## Prerequisites
- Laravel 10+ (for `ValidationRule` interface)
- Understanding of the `$fail` closure mechanism

## Inputs
- The attribute name (string)
- The value to validate (mixed)
- The $fail closure (callable)

## Workflow
1. Create a new class in `app/Rules/` (or feature module) implementing `Illuminate\Contracts\Validation\ValidationRule`
2. Define the `validate(string $attribute, mixed $value, Closure $fail): void` method
3. Implement the validation logic — check the value against your constraint
4. On failure, call `$fail('validation.custom.rule_name')->translate()` for translatable messages
5. Use constructor dependency injection for services, repositories, or external APIs
6. Use the rule in any FormRequest: `'field' => ['required', new ValidRuleName]`
7. Write unit tests by instantiating the rule, calling `validate()`, and asserting on the `$fail` callback

## Validation Checklist
- [ ] Class implements `ValidationRule` interface
- [ ] `$fail()` used instead of throwing exceptions
- [ ] No side effects (DB writes, API calls) in `validate()`
- [ ] Messages are translatable where needed
- [ ] Descriptive class name (e.g., `ValidPostalCode`, `NotFutureDate`)
- [ ] Dependency injection used for required services
- [ ] Unit tests cover valid input, invalid input, and edge cases
- [ ] Database queries cached for repeated calls (array validation)

## Common Failures
- Throwing exceptions instead of calling `$fail()` — aborts remaining validation
- Performing side effects in `validate()` (mutations, writes) — unexpected behavior
- Not caching database queries — N+1 problem in array validation
- Using legacy `Validator::extend()` instead of invokable classes in Laravel 10+
- Hardcoded error messages that don't support translation

## Decision Points
- Use invokable class for reusable rules vs Closure for one-off validation
- Use constructor DI for service access vs method injection for context-specific data
- Use static cache for database results vs fresh query per call

## Performance Considerations
- Rule execution cost depends on validation logic — cache DB/API results
- Static cache pattern prevents N+1 queries in array validation
- `$fail()` is a boolean flag — not an exception — very lightweight
- Rules run in the per-attribute loop during `Validator::passes()`

## Security Considerations
- Rules must validate only — never mutate or write data
- Database queries must use parameterized queries (Eloquent/Query Builder)
- Do not trust user input in rule logic — validate all external data
- Ensure rules don't introduce paths for ReDoS via regex patterns

## Related Rules
- Rule 1: Prefer Invokable Classes Over Closures for Reusable Rules
- Rule 2: Use $fail() — Do Not Throw Exceptions in Custom Rules
- Rule 3: Do Not Perform Side Effects in validate()
- Rule 5: Use Descriptive Class Names for Custom Rules
- Rule 6: Cache or Batch Database Queries in Validation Rules

## Related Skills
- Test Custom Validation Rules in Isolation
- Apply Declarative Conditional Validation Rules

## Success Criteria
- Custom rule correctly validates valid input (no $fail call)
- Custom rule correctly rejects invalid input ($fail called)
- Rule is reusable across multiple FormRequests
- Rule is unit-testable without HTTP stack
- No side effects occur during validation
- Database queries are cached for repeated calls

---

# Skill: Test Custom Validation Rules in Isolation

## Purpose
Write unit tests for custom invokable validation rules by exercising the `validate()` method directly without the HTTP stack.

## When To Use
- Testing invokable rule classes (`ValidationRule` implementations)
- Covering edge cases (null, empty, boundary values) efficiently
- Validating rule logic before integration testing

## When NOT To Use
- Testing FormRequest integration (use HTTP integration tests)
- Testing built-in Laravel rule behavior
- Testing rules that depend on container services that require full bootstrap

## Prerequisites
- Custom invokable rule class implementing `ValidationRule`
- PHPUnit or Pest test framework

## Inputs
- Rule instance (with mocked dependencies if needed)
- Test values (valid, invalid, edge cases)
- `$fail` callback spy/assertion

## Workflow
1. Instantiate the rule class (inject mocked dependencies if needed)
2. Create a `$fail` callback that captures whether it was called
3. Call `$rule->validate('attribute', $testValue, $failCallback)`
4. Assert the `$fail` callback was called (or not) based on expected outcome
5. Test multiple values: valid, invalid, null, empty, boundary, special characters
6. Test with dependency injection by mocking services
7. Write separate test methods or Pest datasets for each value category

## Validation Checklist
- [ ] Unit test exists for each custom rule
- [ ] Test covers valid input (no $fail call)
- [ ] Test covers invalid input ($fail called)
- [ ] Test covers edge cases (null, empty, boundary values)
- [ ] Test covers dependency injection (mocked services)
- [ ] No integration test dependencies required for the unit test
- [ ] Pest datasets used for combinatorial value testing

## Common Failures
- Only testing through HTTP integration — misses edge cases
- Not testing the `$fail` callback spy pattern
- Forgetting to test dependency injection paths
- Testing the framework's behavior instead of the custom rule logic

## Decision Points
- Unit test in isolation vs integration test with container
- Use Pest datasets for combinatorial testing vs separate test methods

## Performance Considerations
- Unit tests are fast (~1-10ms per test) — no HTTP stack
- Run rule unit tests on every commit in the test suite
- Integration tests for the same rules can be limited to key scenarios

## Security Considerations
- Ensure tests cover malicious input (XSS, injection attempts, oversized values)
- Test that rules reject invalid input without leaking internal state

## Related Rules
- Rule 4: Test Custom Rules in Isolation

## Related Skills
- Create and Use Invokable Custom Validation Rules
- Test Validation Boundaries via HTTP Integration Tests

## Success Criteria
- All valid input values pass the rule
- All invalid input values are rejected
- All edge cases are covered by the test dataset
- Tests complete in milliseconds without HTTP bootstrap
- Rule behavior is verified independently of FormRequest context
