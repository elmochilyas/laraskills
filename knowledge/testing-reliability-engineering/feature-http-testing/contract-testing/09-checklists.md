# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Feature & HTTP Testing
**Knowledge Unit:** Contract Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Assert JSON structure (shape) plus specific values for every API endpoint
- [ ] Apply rule: Treat snapshot test changes as deliberate contract changes requiring review
- [ ] Apply rule: Contract-test error responses with the same rigor as success responses
- [ ] Apply rule: Assert minimum required structure, not exact exhaustive structure
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Public API endpoints have contract tests (structure + type + values)
- [ ] Error responses contract-tested with structure assertions
- [ ] Contracts assert minimum required structure, not exhaustive field lists
- [ ] Field types asserted with `whereType()` for critical fields
- [ ] Snapshot changes require deliberate review (not auto-updated in CI)
- [ ] Avoid: Mistake
- [ ] Avoid: Treating snapshot tests as contracts without review
- [ ] Avoid: Over-specifying contracts

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Lightweight structure assertions vs Pact**: Most Laravel projects never need Pact. Structure assertions + snapshot tests cover 90% of contract testing needs. Use Pact only for multi-service architectures.
- **OpenAPI spec contract vs test-based contract**: OpenAPI spec is documentation + contract. Test-based contract is simpler but less visible. Use both for best coverage.
- **Snapshot baseline management**: Store snapshots in version control. Review snapshot diffs in PRs. A snapshot change means an API contract change.
- **Versioned contracts**: For versioned APIs, maintain separate contract tests per version. Structure assertions per version prevent cross-version contamination.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Assert JSON structure (shape) plus specific values for every API endpoint
- [ ] Follow rule: Treat snapshot test changes as deliberate contract changes requiring review
- [ ] Follow rule: Contract-test error responses with the same rigor as success responses
- [ ] Follow rule: Assert minimum required structure, not exact exhaustive structure
- [ ] Follow rule: Use `AssertableJson` for type-level contract enforcement
- [ ] Follow rule: Maintain separate contract tests per API version
- [ ] - [ ] Public API endpoints have contract tests (structure + type + values)
- [ ] - [ ] Error responses contract-tested with structure assertions
- [ ] - [ ] Contracts assert minimum required structure, not exhaustive field lists
- [ ] - [ ] Field types asserted with `whereType()` for critical fields

# Performance Checklist
- Structure assertions: <1ms per response. Fast enough for every API test.
- OpenAPI validation: 10-50ms. Run in CI-only or a subset of tests.
- Snapshot comparisons: <5ms per comparison. Acceptable for all endpoints.
- Pact verification: Slower; run in a separate CI workflow.

# Security Checklist
- Contract tests for security-related endpoints (auth, token refresh) should verify that sensitive fields are never exposed in responses.
- Error responses should not leak internal details (stack traces, query parameters). Contract-test the error format.

# Reliability Checklist
- [ ] Ensure: Contract testing verifies that API consumers and producers agree on request/resp...
- [ ] Verify: Assert JSON structure (shape) plus specific values for every API endpoint
- [ ] Verify: Treat snapshot test changes as deliberate contract changes requiring review
- [ ] Verify: Contract-test error responses with the same rigor as success responses
- [ ] Verify: Assert minimum required structure, not exact exhaustive structure

# Testing Checklist
- [ ] Public API endpoints have contract tests (structure + type + values)
- [ ] Error responses contract-tested with structure assertions
- [ ] Contracts assert minimum required structure, not exhaustive field lists
- [ ] Field types asserted with `whereType()` for critical fields
- [ ] Snapshot changes require deliberate review (not auto-updated in CI)
- [ ] Versioned APIs have separate contract tests per version
- [ ] Avoid: Mistake
- [ ] Avoid: Treating snapshot tests as contracts without review
- [ ] Avoid: Over-specifying contracts

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Assert JSON structure (shape) plus specific values for every API endpoint
- [ ] Apply: Treat snapshot test changes as deliberate contract changes requiring review
- [ ] Apply: Contract-test error responses with the same rigor as success responses
- [ ] Apply: Assert minimum required structure, not exact exhaustive structure

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Treating snapshot tests as contracts without review
- [ ] Avoid mistake: Over-specifying contracts
- [ ] Avoid mistake: No contract tests for error responses
- [ ] Avoid mistake: Ignoring consumer feedback on contracts

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
- Assert JSON structure (shape) plus specific values for every API endpoint
- Treat snapshot test changes as deliberate contract changes requiring review
- Contract-test error responses with the same rigor as success responses
- Assert minimum required structure, not exact exhaustive structure
- Use `AssertableJson` for type-level contract enforcement
- Maintain separate contract tests per API version
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Enforce API Contracts with Structure and Type Assertions


