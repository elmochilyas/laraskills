# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-documentation
**Knowledge Unit:** SDK Generation from OpenAPI
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] SDK Generation from OpenAPI implementation follows api-documentation patterns
- [ ] All edge cases handled for SDK Generation from OpenAPI
- [ ] Full test coverage for SDK Generation from OpenAPI
- [ ] Security review completed for SDK Generation from OpenAPI
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for SDK Generation from OpenAPI

---

# Architecture Checklist

- [ ] Automate SDK generation and publishing in CI/CD pipeline (generate -> test -> publish to npm/Packagist/PyPI).
- [ ] Test generated SDKs against actual API before publishing. Run integration tests using generated clients.
- [ ] Provide SDK usage examples in OpenAPI spec's `externalDocs`.
- [ ] Maintain per-language config files for codegen tool (each language may need different settings).
- [ ] When spec changes produce breaking SDK changes, notify consumers before publishing new SDK version.
- [ ] Evaluate: Codegen Tool Selection â€” OpenAPI Generator vs Fern vs Speakeasy
- [ ] Evaluate: SDK Versioning Strategy â€” Aligned with API vs Independent

---

# Implementation Checklist

- [ ] Consistent `operationId` values on every operation (`{resource}.{action}`)
- [ ] All schemas defined in `components/schemas` with `$ref` references
- [ ] oneOf schemas include discriminator properties and mappings
- [ ] Error response models in components for typed error handling
- [ ] All object properties have explicit `properties` definitions
- [ ] Codegen configured with per-language settings
- [ ] SDK generation automated in CI/CD pipeline
- [ ] Generated SDKs tested before publishing
- [ ] SDK versions aligned with API versions
- [ ] Implement SDK Generation from OpenAPI following api-documentation patterns
- [ ] Configure all required settings for SDK Generation from OpenAPI
- [ ] Register route/middleware/service for SDK Generation from OpenAPI
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Codegen build time (100 endpoints, 5 languages): OpenAPI Generator 2-5 min, Fern 30-60s, Speakeasy 1-3 min.
- [ ] Generated SDKs can be large (5-50 MB per language) due to generated code and dependencies.
- [ ] Consider tree-shaking or modular SDK generation for large APIs.

---

# Security Checklist

- [ ] Generated SDKs include base URLs, API key placeholders, and authentication configuration. Review generated code before publishing to public registries.
- [ ] Do not include production secrets or tokens in spec examples used for SDK generation.
- [ ] Ensure SDK does not expose internal-only endpoints through spec.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of SDK Generation from OpenAPI
- [ ] Write feature tests for validation failure of SDK Generation from OpenAPI
- [ ] Write feature tests for authentication failure of SDK Generation from OpenAPI
- [ ] Write unit tests for service/action/DTO classes
- [ ] Test edge cases: empty results, boundary values, null inputs

---

# Maintainability Checklist

- [ ] Follow PSR-12 coding standards
- [ ] Use type hints on all methods and properties
- [ ] Keep methods under 15 lines
- [ ] Use meaningful class and method names
- [ ] Add PHPDoc for public API methods

---

# Anti-Pattern Prevention Checklist

- [ ] Avoid tight coupling between layers
- [ ] Avoid business logic in controllers
- [ ] Avoid skipping validation layers

---

# Production Readiness Checklist

- [ ] Add structured logging for all operations
- [ ] Configure monitoring alerts for error rate spikes
- [ ] Implement health check endpoint
- [ ] Document rollback procedure
- [ ] Set up error tracking integration
- [ ] Configure proper CORS for production

---

# Final Approval Checklist

- [ ] Architecture checklist complete
- [ ] Security checklist complete
- [ ] Performance checklist complete
- [ ] Testing checklist complete
- [ ] Anti-pattern prevention checklist complete
- [ ] Production readiness checklist complete
- [ ] All items resolved before merge

---

# Related Knowledge

### Rules
- Always Provide Consistent operationId Values
- Define Every Schema In Components With $ref References
- Use Discriminated Unions For oneOf Schemas
- Include Error Response Models In The Spec
- Avoid Untyped Object Properties
- Automate SDK Generation And Testing In CI
- Never Modify Generated SDK Code Directly

### Decisions
- Codegen Tool Selection â€” OpenAPI Generator vs Fern vs Speakeasy
- SDK Versioning Strategy â€” Aligned with API vs Independent

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



