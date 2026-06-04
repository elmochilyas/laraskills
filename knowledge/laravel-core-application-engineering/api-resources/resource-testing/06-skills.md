# Skill: Write Unit Tests for an API Resource

## Purpose

Verify that a resource produces the correct JSON structure, conditional fields, relationship inclusion/omission, and field formatting for different inputs and contexts.

## When To Use

- Unit tests for resource logic: conditional fields, formatting, relationship inclusion/omission
- Integration tests for endpoint behavior: pagination metadata, status codes, authentication, headers
- Snapshot tests for complex resources with many fields
- Version compatibility tests to ensure old versions still produce expected shapes

## When NOT To Use

- Do not test that `JsonResource` works — test your resource's specific output
- Do not create integration tests for every resource unit test — unit tests are faster and sufficient for pure resource logic
- Do not use snapshot tests for resources with dynamic values (timestamps, random IDs, auto-increment) without fixing the model state

## Prerequisites

- A resource class to test
- PHPUnit configured in the project
- Model factory for creating test data
- Understanding of `response()->getData(true)` for extracting response data

## Inputs

- Resource class under test
- Test data (model instances created via `make()` or `create()`)
- Request context for conditional field testing

## Workflow

1. Create a test class that mirrors the resource's directory structure: `tests/Feature/Http/Resources/V1/UserResourceTest.php`.
2. In the base test class `setUp()`, mirror production wrapping configuration: `JsonResource::withoutWrapping()` if production uses it.
3. Use `User::factory()->make()` for most unit tests — no database writes needed. Use `create()` only when relationships or persistence are required.
4. Test the resource contract (JSON output), not implementation details (class type, method existence):
   ```php
   $response = (new UserResource($user))->response()->getData(true);
   $this->assertSame(['id' => 1, 'name' => 'John'], $response);
   ```
5. For every conditional method, write tests verifying both inclusion (field present) and omission (field absent) using data providers.
6. For `whenLoaded()` relationships, write two tests: one with `$user->load('relation')` → field present, one without → field omitted.
7. Write version compatibility tests that assert old version resources lack new version fields and new version resources include all expected fields.
8. For snapshot tests, use fixed, deterministic values: `User::factory()->make(['id' => 1, 'name' => 'John'])`.
9. Accompany every snapshot test with individual field-level assertions that document the expected contract.
10. For paginated endpoints, write integration tests that assert `links` and `meta` structure (key presence) rather than exact URL values.

## Validation Checklist

- [ ] Every conditional field has both inclusion and omission test cases
- [ ] Unit tests use `make()` instead of `create()` where possible
- [ ] Test wrapping configuration matches production (`withoutWrapping()` in test base class)
- [ ] Version compatibility tests verify old versions lack new fields
- [ ] Paginated collection tests verify `links` and `meta` structure
- [ ] Resource tests are fast (<50ms suite) and run early in CI
- [ ] Snapshot tests use fixed, reproducible model values

## Common Failures

- Testing framework behavior — asserting the resource extends a class or exists rather than testing its output; tests pass but provide zero confidence
- Testing with database when not needed — using `User::factory()->create()` when `make()` suffices slows tests 10-100x
- Forgetting wrapping configuration — tests check for `data` key but production uses `withoutWrapping()`
- Brittle snapshot tests — snapshots fail on every run due to auto-increment IDs or dynamic timestamps
- Over-testing conditionals — testing every combination of 8 conditional fields (2^8 = 256 tests); test each condition independently and only test combinations for critical interactions

## Decision Points

- **Unit vs integration tests**: Use unit tests for resource logic (conditional fields, formatting, relationship states). Use integration tests for endpoint behavior (status codes, headers, authentication, pagination).
- **make() vs create()**: Use `make()` for tests that only need model attributes (no persistence needed). Use `create()` when relationships or database-level operations are required.
- **Data provider vs individual methods**: Use data providers to test multiple conditional states from a single test method. Use individual methods when conditionals interact and need explicit combination testing.

## Performance Considerations

- Resource unit tests are the fastest test category — a suite of 50 unit tests completes in <50ms
- Integration tests are slower (50-200ms each) due to full framework boot and HTTP handling
- Use `make()` to avoid database writes in unit tests — saves the write query and the cleanup
- Group resource tests in early CI stages for fast feedback on contract changes

## Security Considerations

- Resource tests should verify that sensitive fields are never exposed, regardless of conditional state
- Test that authorization-conditional fields are properly omitted for unauthorized contexts
- Version compatibility tests ensure that old resource versions do not accidentally expose new fields
- Test that metadata does not leak internal information (server paths, query logs, configuration)

## Related Rules

- Use make() Instead of create() for Unit Tests (Performance)
- Test Both Inclusion and Omission for Every Conditional (Testing)
- Mirror Production Wrapping in Test Configuration (Testing)
- Run Resource Tests Early in CI (Testing)
- Use Fixed Values in Snapshot Tests (Testing)
- Test Relationship Loaded and Unloaded States (Testing)
- Test Resource Contract, Not Internals (Testing)
- Use Data Providers for Exhaustive Conditional Coverage (Testing)
- Do Not Use Snapshots as Sole Contract Validation (Testing)
- Test Version Compatibility (Testing)

## Related Skills

- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Conditional Attributes](../conditional-attributes/06-skills.md)
- [Conditional Relationships](../conditional-relationships/06-skills.md)
- [Pagination Metadata](../pagination-metadata/06-skills.md)
- [Top-Level Meta Data](../top-level-meta-data/06-skills.md)

## Success Criteria

- Every conditional field has passing tests for both inclusion and omission
- Unit tests use `make()` where possible, keeping the suite fast
- Test wrapping configuration matches production exactly
- Version compatibility tests prevent cross-version field leakage
- Snapshot tests use fixed, reproducible values and are accompanied by explicit field assertions
