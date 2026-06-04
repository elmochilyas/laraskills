# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-documentation
**Knowledge Unit:** OpenAPI Spec Generation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] OpenAPI Spec Generation implementation follows api-documentation patterns
- [ ] All edge cases handled for OpenAPI Spec Generation
- [ ] Full test coverage for OpenAPI Spec Generation
- [ ] Security review completed for OpenAPI Spec Generation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for OpenAPI Spec Generation

---

# Architecture Checklist

- [ ] Serve spec at well-known URL (`/openapi.yaml` or `/docs/openapi.yaml`) with CORS headers.
- [ ] Publish versioned specs alongside releases (`openapi-v2.yaml`).
- [ ] Use Scramble (code-first) for auto-generated specs or write manually (schema-first).
- [ ] Validate with `redocly lint` and `swagger-cli validate` in CI.
- [ ] Bundle multi-file specs before deployment to avoid broken `$ref` issues.
- [ ] Evaluate: Schema Approach â€” Schema-First vs Code-First
- [ ] Evaluate: Spec Organization â€” Single-File vs Multi-File
- [ ] Evaluate: Spec Delivery â€” Hosted Endpoint vs Downloadable File

---

# Implementation Checklist

- [ ] API spec generation tool configured
- [ ] Endpoint descriptions overridden with human-readable text
- [ ] Request schemas extracted from Form Request rules
- [ ] Custom response schemas for 4xx/5xx responses
- [ ] Security schemes defined (Bearer token, cookie, API key)
- [ ] Tags applied for logical grouping
- [ ] Server information (URLs, versioning) included
- [ ] Spec generated in JSON/YAML format
- [ ] Spec validated against OpenAPI schema
- [ ] Spec generation integrated into CI pipeline
- [ ] Implement OpenAPI Spec Generation following api-documentation patterns
- [ ] Configure all required settings for OpenAPI Spec Generation
- [ ] Register route/middleware/service for OpenAPI Spec Generation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Spec validation for 100+ endpoints may take 5-30 seconds. Use incremental validation in editors.
- [ ] Spec file size can reach 1-5 MB. Use gzip for serving.
- [ ] Multi-file specs require bundling step before deployment.

---

# Security Checklist

- [ ] Spec exposes complete API surface. Protect if API is internal.
- [ ] Do not include production server URLs in specs committed to public repositories during development.
- [ ] Review auto-generated specs for accidental exposure of internal endpoints.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of OpenAPI Spec Generation
- [ ] Write feature tests for validation failure of OpenAPI Spec Generation
- [ ] Write feature tests for authentication failure of OpenAPI Spec Generation
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
- Define All Schemas In Components With $ref References
- Use `resource.action` operationId Convention
- Always Include An `info.version` Matching The API Version
- Validate Spec In CI Before Deployment
- Set Global Security With Per-Operation Overrides
- Bundle Multi-File Specs Before Deployment

### Decisions
- Schema Approach â€” Schema-First vs Code-First
- Spec Organization â€” Single-File vs Multi-File
- Spec Delivery â€” Hosted Endpoint vs Downloadable File

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



