# Skill: Enforce API Contracts with Structure and Type Assertions

## Purpose
Write contract tests for API endpoints that verify JSON structure, field types, and error response formats to prevent breaking changes for consumers.

## When To Use
- Public API endpoints consumed by external teams or mobile apps
- Inter-service communication in microservice architectures
- Versioned APIs where backward compatibility is critical
- When multiple consumers depend on the same API response shape

## When NOT To Use
- Internal-only endpoints with a single consumer (test with the consumer directly)
- Endpoints changing frequently during early development
- When structure assertions alone provide sufficient coverage (add contracts later)

## Prerequisites
- JSON API endpoints defined
- Understanding of `AssertableJson`, `assertJsonStructure`, `assertJsonPath`
- Snapshot testing library installed (if using snapshot-based contracts)

## Inputs
- API endpoint routes and expected response shapes
- Error response format (validation errors, 404, 401, 403, 500)
- Optional: OpenAPI/Swagger specification

## Workflow
1. For each public API endpoint, assert minimum JSON structure using `assertJsonStructure()` — only required fields that consumers depend on
2. Assert field types using `$response->assertJson(fn (AssertableJson $json) => $json->whereType('id', 'integer')->etc())` — catches type-breaking changes
3. Assert 1-3 specific values with `assertJsonPath()` to verify business logic, not just shape
4. Write separate contract tests for each error response: validation (422), auth (401), authz (403), not found (404), server error (500) — each with structure assertions
5. For snapshot-based contracts, set `CREATE_SNAPSHOTS=false` in CI to prevent automatic updates — require explicit review of snapshot changes
6. For versioned APIs, maintain separate contract test files per version — never share contracts across versions
7. Test both success and error responses with the same structural rigor

## Validation Checklist
- [ ] Public API endpoints have contract tests (structure + type + values)
- [ ] Error responses contract-tested with structure assertions
- [ ] Contracts assert minimum required structure, not exhaustive field lists
- [ ] Field types asserted with `whereType()` for critical fields
- [ ] Snapshot changes require deliberate review (not auto-updated in CI)
- [ ] Versioned APIs have separate contract tests per version
- [ ] Error responses don't leak internal details (stack traces, file paths)

## Common Failures
- Asserting exhaustive field lists that break when optional fields are added
- No contract tests for error responses — error format changes silently break consumers
- Snapshot tests auto-updating in CI, silently accepting breaking changes
- Sharing contract tests across API versions — cross-version contamination
- Asserting structure only, missing type changes (int → string)

## Decision Points
- Use lightweight `assertJsonStructure()` for most projects vs Pact for multi-service architectures
- Use snapshot testing for change detection vs explicit structure assertions for precise contracts
- Assert minimum required structure (consumers' dependency) vs exhaustive structure (full specification)

## Performance Considerations
- Structure assertions: <1ms per response — safe for every API test
- OpenAPI validation: 10-50ms — run in CI-only or a subset of tests
- Snapshot comparisons: <5ms per comparison
- Pact verification: slower — run in a separate CI workflow

## Security Considerations
- Contract tests for auth endpoints should verify sensitive fields are never exposed
- Error responses must not leak stack traces, query parameters, or internal paths
- Test that 404 is used for both "not found" and "not authorized" when appropriate

## Related Rules (from 05-rules.md)
- Rule 1: Assert JSON structure (shape) plus specific values for every API endpoint
- Rule 2: Treat snapshot test changes as deliberate contract changes
- Rule 3: Contract-test error responses with same rigor as success
- Rule 4: Assert minimum required structure, not exact exhaustive structure
- Rule 5: Use `AssertableJson` for type-level contract enforcement
- Rule 6: Maintain separate contract tests per API version

## Success Criteria
- Breaking API changes (missing fields, type changes) are caught by contract tests
- Error format changes are caught before reaching consumers
- Adding optional fields does not trigger false-positive failures
- Each API version's contract is independently verified
