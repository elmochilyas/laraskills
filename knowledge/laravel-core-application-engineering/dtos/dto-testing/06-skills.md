# Skill: Write DTO Contract Tests

## Purpose

Write fast, deterministic unit tests for DTOs that verify the data contract — factory methods produce correct property values, output methods produce expected shapes, and invalid input is rejected — without mocking or database setup.

## When To Use

- Every factory method (`fromArray`, `fromModel`, `fromRequest`) needs test coverage
- Every output method (`toArray`, `jsonSerialize`) needs test coverage
- Null/optional field handling needs explicit verification
- Validation rules need rejection testing per distinct path
- CI pipeline needs a fast first stage for data contract verification

## When NOT To Test

- Properties that PHP already type-checks (`assertIsString` when `public string $name` is declared)
- Internal constructor implementation — test observable behavior, not how it works
- Framework behavior (spatie/laravel-data internals) — test your Data classes' behavior, not the package
- Simple DTOs with 2 properties and no factory methods — trivially correct

## Prerequisites

- PHPUnit (or equivalent test framework) configured
- DTO class with factory methods and output methods implemented
- Understanding of what constitutes the DTO's "contract" (observable behavior)

## Inputs

- DTO class with factories (`fromArray`, `fromModel`, `fromRequest`)
- DTO output methods (`toArray`, `jsonSerialize`)
- Validation rules if applicable
- List of construction variants: full data, minimal data, edge cases, null variants

## Workflow

1. Create a test class extending `PHPUnit\Framework\TestCase` (or `Tests\TestCase` if helper methods needed)
2. For each factory method, write a test method that:
   - Provides known input data
   - Calls the factory method
   - Asserts each property matches the expected mapped value
3. Use PHPUnit data providers to test multiple construction variants (full data, minimal data, null handling) with a single test method
4. For each output method, write a test that asserts the exact output shape using `assertSame()`:
   - Expected keys and values
   - Type formatting (ISO 8601 dates, integer cents, null handling)
   - Nested DTO serialization yields correct child arrays
5. For optional/nullable properties, write explicit test cases that verify null handling when the field is omitted
6. For DTOs with validation rules, write one test per distinct validation path that asserts `ValidationException`
7. For bidirectional DTOs, write a round-trip test: `fromArray()` → DTO → `toArray()` → assert matches input
8. Name test methods to document the contract: `test_from_array_sets_name_and_email()`, `test_to_array_null_when_bio_omitted()`
9. Run the test suite and verify all DTO tests complete in <50ms
10. Configure CI to run DTO tests as the first pipeline stage

## Validation Checklist

- [ ] Every factory method has at least one valid-input test
- [ ] Output shape tests assert exact keys and values with `assertSame()`
- [ ] Null/optional field handling has explicit test cases
- [ ] Invalid input rejection has one test per distinct validation path
- [ ] Data providers are used for construction variants where applicable
- [ ] Tests verify the contract, not the implementation
- [ ] Tests do not assert PHP-enforced type hints
- [ ] DTO tests complete in <50ms total
- [ ] DTO tests run as the first stage in CI pipeline

## Common Failures

- **Testing implementation, not contract**: Mocking the constructor to verify it was called. Test observable behavior — property values match input.
- **Over-testing simple DTOs**: Separate test methods for every property of a 2-field DTO. Use a single data provider.
- **Under-testing factory methods**: Only `fromArray` is tested; `fromModel` and `fromRequest` have no coverage. Test every factory.
- **Stale data providers**: Adding a DTO property without updating the data provider. Update in the same commit.
- **False positives from loose assertions**: Using `assertCount()` instead of `assertSame()` for output shape. Assert exact shape.

## Decision Points

- **Data provider vs separate methods**: Use data provider for 3+ construction variants. Use separate methods for distinct validation paths with different expected exceptions.
- **Exact shape vs key subset**: Prefer exact shape (`assertSame`) for stable output. Use key subset only when output is intentionally dynamic.
- **Unit test vs integration test**: DTO tests are pure unit tests — no database, no HTTP, no mocking. Only use integration when testing `fromModel` with actual Eloquent models.

## Performance Considerations

- DTO unit tests execute in <1ms each — 20 DTO tests complete in <20ms
- This is the fastest test category — no database, no HTTP, no service container
- Run DTO tests first in CI — if they fail, all downstream stages are invalid

## Security Considerations

- DTO tests verify that invalid data is rejected at construction — prevents bad data from reaching the service layer
- Test that sensitive data is not exposed in `toArray()` output
- Test that factory methods do not accept extra, unvalidated data from input sources

## Related Rules

- Rule 1: Test the DTO's Contract, Not Its Implementation
- Rule 2: Use Data Providers for Construction Variants
- Rule 3: Run DTO Tests First in the CI Pipeline
- Rule 4: Test Every Factory Method with at Least One Valid-Input Test
- Rule 5: Test Invalid Input Rejection with Explicit Validation Test Cases
- Rule 6: Test Output Methods for Expected Shape, Keys, Types, and Null Handling

## Related Skills

- Data Object Transformation: Implement and Test DTO Output Methods
- Data Object Validation: Add Domain-Level Validation to a DTO

## Success Criteria

- All DTO tests pass in <50ms
- Every factory method has a passing test for valid input
- Every output method has a passing test asserting exact shape
- Null handling has explicit test coverage
- Invalid input rejection is tested per validation path
- Tests are the first stage in CI pipeline
