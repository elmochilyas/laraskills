# Skill: Test API Version Behavior

## Purpose
Write feature tests verifying versioned endpoints return correct responses per version — mirroring version directory structure, sharing common assertions via base test class, testing deprecation headers, unsupported version rejection, and version-specific response shapes.

## When To Use
- Any API with multiple active versions
- APIs with deprecation schedules and sunset policies
- Teams maintaining backward compatibility across versions

## When NOT To Use
- Single-version APIs (versioning not yet needed)
- Backward-compatible additions only (new fields added to existing version)
- Internal microservices with single consumer

## Prerequisites
- Laravel Route Grouping
- API Versioning Strategies (URL, header, query parameter)
- Feature test structure

## Inputs
- Version route definitions (V1, V2, etc.)
- Version-specific controllers and resources
- Deprecation schedule and sunset dates

## Workflow
1. Mirror version directory structure in tests: `tests/Feature/Api/V1/`, `tests/Feature/Api/V2/`
2. Create a shared `ApiVersionTestCase` base class with common assertions (error shape, pagination, auth failure) — extract via abstract `apiPrefix()` method
3. Use PestPHP `describe()` with `beforeEach` to set version base URL prefix, reducing repetition
4. Test deprecation headers on deprecated versions: assert `Deprecation: true` and `Sunset` header
5. Test unsupported version returns 404: access `/api/v3/posts` when v3 doesn't exist
6. Version per-endpoint response shape separately: assert v1 returns `author_name` field, v2 returns nested `author` object
7. Clean up: when removing a version, delete all version tests and route group — never leave dead test code

## Validation Checklist
- [ ] Each active API version has corresponding test directory and test class
- [ ] Shared behavior (error shape, pagination) tested in shared base class
- [ ] `describe()` + `beforeEach` used for version base URL prefix
- [ ] Deprecated versions return `Deprecation` and `Sunset` headers
- [ ] Unsupported versions return 404
- [ ] Version-specific response shapes asserted per version
- [ ] Version leakage prevented (v2 tests don't hit v1 routes)

## Common Failures
- Copy-pasting tests between version test classes without adjusting version-specific assertions
- Forgetting to version the OpenAPI spec — all versions validate against same spec file
- Testing shared behavior in every version test class instead of shared base
- Not testing that unsupported version returns 404
- Version-specific bug fixed in v2 but test not added to v1 suite to confirm bug still exists in v1

## Decision Points
- Versioning strategy: URL-prefix vs header-based vs query-parameter — determines test approach
- Shared base class vs traits: base class for common assertions, traits for version-specific differences
- Deprecation signaling: automated via middleware vs manual per-route

## Performance Considerations
- Per-version test suites duplicate assertion logic — use shared base class to avoid duplication
- Use `describe()` + `beforeEach` for version base URL to reduce repetition
- Maintain `BaseApiTest` class with shared endpoint tests that both versions extend

## Security Considerations
- Deprecated versions may have known security vulnerabilities — test they still maintain auth/authorization standards
- Ensure old versions don't expose deprecated security practices (weak password hashing, old encryption)
- Unsolicited version migration (redirecting v1 to v2) may break clients expecting v1 behavior

## Related Rules
- Mirror Version Directory Structure In Tests
- Share Common Assertions Via Base Test Class
- Test Deprecation Headers On Deprecated Versions
- Test Unsupported Version Returns 404
- Use PestPHP Describe With Version Prefix
- Version Per-Endpoint Response Shape Separately

## Related Skills
- Test Response Shape
- Test Error Response Shape
- Test Response Headers

## Success Criteria
- Every active version has dedicated test directory and test classes
- Shared contract assertions in base class, not duplicated
- Deprecated versions return correct deprecation headers
- Unsupported versions correctly rejected
- Version-specific response shapes independently verified
- No version leakage between test suites
