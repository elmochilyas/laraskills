# Skill: Create Pest Custom Helpers

## Purpose
Build Pest helpers, custom expectations, macros, and higher-order message providers to reduce test boilerplate: `actingAsUser()`, `assertJsonResource()`, `withPagination()`.

## When To Use
- Repetitive test setup across multiple test files
- API-specific assertions used frequently
- Pest-based test suites

## When NOT To Use
- PHPUnit test suites — helpers live in test case classes
- One-off setups — inline is clearer than abstraction

## Prerequisites
- Pest test suite
- Understanding of Pest's macro system

## Inputs
- Reusable assertion patterns
- Common test setup sequences

## Workflow
1. Create helpers in `tests/Helpers.php` using Pest's `function()` for globally available helpers
2. Define custom expectations with `expect()->extend('toBeValidUuid', fn () => $this->toMatch('/^...$/'))`
3. Build higher-order message provider with `pest()->extend()` for data-driven tests
4. Create helper functions for common auth patterns: `function actingAsUser($abilities = [])`
5. Create JSON resource assertion helpers: `function assertJsonResource($response, $resource, $model)`
6. Implement pagination helpers: `function withPagination($perPage = 15, $page = 1)`
7. Create response structure matchers: `function assertEnvelope($response)`
8. Use Pest's `uses()->group()` for automatic grouping of shared traits
9. Register all helpers and macros in `tests/Pest.php` with `uses()` and `expect()->...`
10. Keep helpers focused — one responsibility per helper function

## Validation Checklist
- [ ] Helpers registered in `tests/Pest.php`
- [ ] Custom expectations defined with `expect()->extend()`
- [ ] Auth helpers reduce per-test setup
- [ ] Resource assertion helpers match JSON:API or envelope structure
- [ ] Pagination helpers abstract query parameter handling
- [ ] Response structure matchers test envelope shape
- [ ] Helpers focused — one responsibility each
- [ ] Helpers covered by their own tests
- [ ] Namespacing prevents conflicts with Pest/Laravel methods

## Common Failures
- Helpers too generic — something like `createUser()` is a factory call, not a helper
- Helpers with side effects — creating state that makes tests interdependent
- No tests for helpers — helper bugs make all dependent tests fail silently
- Over-abstraction — helper with 5 parameters is harder to read than inline code
- Forgetting to register in `tests/Pest.php` — helper not available in tests
- Helper name conflicts with Pest or Laravel methods

## Decision Points
- Helper function vs custom expectation — helpers for setup, expectations for assertions
- Global helper vs per-file trait — global for universal, trait for module-specific
- Macro vs function — `expect()->extend` for assertions, functions for setup

## Performance Considerations
- Helper overhead is negligible — function calls are inlined by Pest
- Custom expectations should be fast — avoid database queries in expectation logic
- Higher-order messages evaluate lazily — good for large datasets

## Security Considerations
- Helpers for auth setup must not hardcode admin user creation
- `actingAsUser` should be explicit about roles/abilities — never create superuser by default
- Assertion helpers should test presence of security headers where applicable

## Related Rules
- Create Helpers In tests/Helpers.php
- Define Custom Expectations With expect()->extend()
- Build Higher-Order Message Providers
- Register Helpers In tests/Pest.php
- Keep Helpers Focused — Single Responsibility
- Test Helper Functions Themselves

## Related Skills
- Pest Test Structure — for test organization
- HTTP Endpoint Assertions — for assertion patterns
- Pest Custom Expectations — for expectation extensions
- Higher-Order Test Messages — for data-driven tests

## Success Criteria
- Common test setups reduced to single helper calls
- Custom expectations read naturally as English
- Pagination, auth, and resource assertions are DRY
- Helpers have their own tests
- Helper API is intuitive and discoverable
- No helper conflicts with existing Pest or Laravel methods
