# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-documentation
**Knowledge Unit:** Request Body Schema Documentation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Request Body Schema Documentation implementation follows api-documentation patterns
- [ ] All edge cases handled for Request Body Schema Documentation
- [ ] Full test coverage for Request Body Schema Documentation
- [ ] Security review completed for Request Body Schema Documentation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Request Body Schema Documentation

---

# Architecture Checklist

- [ ] Version request schemas: when API version changes request structure, create new schema component (CreateUserRequestV2) rather than modifying existing one.
- [ ] Auto-generate from Form Requests (Scramble) to eliminate drift between validation and documentation.
- [ ] Use contract tests to verify documented schema accepts/rejects same payloads as actual validation.
- [ ] Evaluate: Schema Structure â€” Flat vs Nested
- [ ] Evaluate: Schema Source â€” Auto-Generated vs Manually Curated

---

# Implementation Checklist

- [ ] Validation rules mirrored in schema constraints (required, maxLength, format, pattern)
- [ ] Reusable schemas in components/schemas with $ref references
- [ ] Nested objects have explicit property definitions at every level
- [ ] Required fields in explicit `required` array
- [ ] Complete request body example per mutation endpoint
- [ ] Enum values documented with descriptions
- [ ] Schemas auto-generated from Form Requests (if using Scramble)
- [ ] Implement Request Body Schema Documentation following api-documentation patterns
- [ ] Configure all required settings for Request Body Schema Documentation
- [ ] Register route/middleware/service for Request Body Schema Documentation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Each request schema adds to OpenAPI spec size. 50 request schemas with nested structures can add 5,000-10,000 lines.
- [ ] Bundle and compress spec for production serving.

---

# Security Checklist

- [ ] Review request schemas for sensitive field exposure (passwords, tokens) in example values.
- [ ] Do not include internal validation implementation details in descriptions.
- [ ] Ensure nullable fields do not bypass required validation through documentation ambiguity.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Request Body Schema Documentation
- [ ] Write feature tests for validation failure of Request Body Schema Documentation
- [ ] Write feature tests for authentication failure of Request Body Schema Documentation
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
- Mirror Validation Rules In Schema Constraints
- Document Every Nesting Level Of Nested Objects
- Always Mark Required Fields Explicitly
- Include A Complete Request Body Example
- Document Enum Values With Descriptions
- Auto-Generate Schemas From Form Requests Using Scramble

### Decisions
- Schema Structure â€” Flat vs Nested
- Schema Source â€” Auto-Generated vs Manually Curated

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



