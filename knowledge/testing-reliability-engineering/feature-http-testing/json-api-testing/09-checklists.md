# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Feature & HTTP Testing
**Knowledge Unit:** JSON API Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Assert both structure and values for every API endpoint
- [ ] Apply rule: Prefer `assertJson()` (partial match) over `assertExactJson()` for most tests
- [ ] Apply rule: Assert types (not hardcoded values) for dynamic fields like IDs and timestamps
- [ ] Apply rule: Test empty states and collection boundaries
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Every API endpoint tests structure + values + types
- [ ] `getJson()`/`postJson()` used (not `get()`/`post()`)
- [ ] `assertJsonStructure()` validates minimum required shape
- [ ] Dynamic fields (IDs, timestamps) asserted by type, not hardcoded value
- [ ] Empty collections return `{"data": []}`, not 404
- [ ] Avoid: Mistake
- [ ] Avoid: Using assertJson() for exact matching
- [ ] Avoid: Hardcoding IDs in assertions

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **`assertJson()` vs `assertExactJson()`**: Partial match for most tests (less brittle). Exact match for idempotency tests.
- **`assertJsonPath()` vs `AssertableJson`**: Simple path assertions use `assertJsonPath()`. Multi-value nested assertions use `AssertableJson`.
- **Structure + values**: One endpoint test should assert: status code, structure, and 1-3 specific values. Too many value assertions make tests brittle.
- **API versioning**: Include version in URL path (`/api/v1/users`). Test each version separately.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Assert both structure and values for every API endpoint
- [ ] Follow rule: Prefer `assertJson()` (partial match) over `assertExactJson()` for most tests
- [ ] Follow rule: Assert types (not hardcoded values) for dynamic fields like IDs and timestamps
- [ ] Follow rule: Test empty states and collection boundaries
- [ ] Follow rule: Use `AssertableJson` fluent API for deeply nested or multi-field assertions
- [ ] Follow rule: Test all error response formats (422, 401, 403, 404, 500)
- [ ] - [ ] Every API endpoint tests structure + values + types
- [ ] - [ ] `getJson()`/`postJson()` used (not `get()`/`post()`)
- [ ] - [ ] `assertJsonStructure()` validates minimum required shape
- [ ] - [ ] Dynamic fields (IDs, timestamps) asserted by type, not hardcoded value

# Performance Checklist
- Large JSON responses (1000+ items) take longer to decode and assert. Paginate in tests to 10-15 items.
- `AssertableJson` chain overhead: Each fluent call adds <0.5ms for 20+ assertions.
- `assertJson()` with large expected arrays is slower than `assertJsonPath()` with specific values.

# Security Checklist
- JSON responses may expose sensitive data (PII, internal IDs). Test that sensitive fields are excluded from API responses.
- Assert that error responses don't leak stack traces or internal configuration.
- Test that authenticated endpoints return proper 401/403 JSON responses for unauthorized access.

# Reliability Checklist
- [ ] Ensure: JSON API testing validates the structure, content, and contracts of JSON respons...
- [ ] Verify: Assert both structure and values for every API endpoint
- [ ] Verify: Prefer `assertJson()` (partial match) over `assertExactJson()` for most tests
- [ ] Verify: Assert types (not hardcoded values) for dynamic fields like IDs and timestamps
- [ ] Verify: Test empty states and collection boundaries

# Testing Checklist
- [ ] Every API endpoint tests structure + values + types
- [ ] `getJson()`/`postJson()` used (not `get()`/`post()`)
- [ ] `assertJsonStructure()` validates minimum required shape
- [ ] Dynamic fields (IDs, timestamps) asserted by type, not hardcoded value
- [ ] Empty collections return `{"data": []}`, not 404
- [ ] All error response formats tested (422, 401, 403, 404, 500)
- [ ] Avoid: Mistake
- [ ] Avoid: Using assertJson() for exact matching
- [ ] Avoid: Hardcoding IDs in assertions

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Assert both structure and values for every API endpoint
- [ ] Apply: Prefer `assertJson()` (partial match) over `assertExactJson()` for most tests
- [ ] Apply: Assert types (not hardcoded values) for dynamic fields like IDs and timestamps
- [ ] Apply: Test empty states and collection boundaries

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using assertJson() for exact matching
- [ ] Avoid mistake: Hardcoding IDs in assertions
- [ ] Avoid mistake: Not testing JSON structure (only values)
- [ ] Avoid mistake: Asserting dates/timestamps as exact strings

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Assert both structure and values for every API endpoint
- Prefer `assertJson()` (partial match) over `assertExactJson()` for most tests
- Assert types (not hardcoded values) for dynamic fields like IDs and timestamps
- Test empty states and collection boundaries
- Use `AssertableJson` fluent API for deeply nested or multi-field assertions
- Test all error response formats (422, 401, 403, 404, 500)
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test JSON API Responses


