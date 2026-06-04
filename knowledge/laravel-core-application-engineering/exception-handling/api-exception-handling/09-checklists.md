# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** JSON Error Formatting
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Always Return Consistent JSON Envelope for API Errors
- [ ] Enforce: Never Expose Stack Traces or Internal Paths in Production API Responses
- [ ] Enforce: Always Configure a Catch-All renderable() for Throwable in API Routes
- [ ] Enforce: Use Machine-Readable Error Types Instead of Parsing Status Codes or Messages
- [ ] Enforce: Include a Request ID in Every API Error Response
- [ ] Enforce: Map HTTP Status Codes Correctly for Common Exception Types
- [ ] Enforce: Configure shouldRenderJsonWhen for API Routes
- [ ] Enforce: Include Structured Field-Level Validation Errors in API Responses
- [ ] Enforce: Document API Error Format in OpenAPI/Swagger
- [ ] Enforce: Never Leak User-Specific Information in Public Error Messages
- [ ] Enforce: Use Centralized Error Formatting, Not Per-Controller JsonResponse
- [ ] Catch-all `renderable()` for `Throwable` exists and returns JSON for API routes
- [ ] `shouldRenderJsonWhen` is configured using both route prefix and `Accept` header
- [ ] HTTP status code is mapped correctly per exception type (401, 403, 422, 404, 429, 500)
- [ ] Machine-readable type string is included in every response
- [ ] No stack traces, file paths, or line numbers appear in production JSON responses
- [ ] Request ID is included from the `X-Request-Id` header
- [ ] Validation error responses include field-level `details` mapping
- [ ] Generic error message is used for 500-level errors in non-local environments

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Use a global `renderable()` callback for `Throwable` in API routes as a catch-all
- [ ] Architecture guideline: - Define a consistent error envelope: `message` (human-readable), `type` (machine-readable), `cod...
- [ ] Architecture guideline: - Include a `request_id` for traceability
- [ ] Architecture guideline: - Return 401 for authentication failures, 403 for authorization, 422 for validation, 409 for conf...
- [ ] Architecture guideline: - Document the error response format in API documentation (OpenAPI/Swagger)

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Always Return Consistent JSON Envelope for API Errors
- [ ] Apply rule: Never Expose Stack Traces or Internal Paths in Production API Responses
- [ ] Apply rule: Always Configure a Catch-All renderable() for Throwable in API Routes
- [ ] Apply rule: Use Machine-Readable Error Types Instead of Parsing Status Codes or Messages
- [ ] Apply rule: Include a Request ID in Every API Error Response
- [ ] Apply rule: Map HTTP Status Codes Correctly for Common Exception Types
- [ ] Apply rule: Configure shouldRenderJsonWhen for API Routes
- [ ] Apply rule: Include Structured Field-Level Validation Errors in API Responses
- [ ] Apply rule: Document API Error Format in OpenAPI/Swagger
- [ ] Apply rule: Never Leak User-Specific Information in Public Error Messages
- [ ] Apply rule: Use Centralized Error Formatting, Not Per-Controller JsonResponse
- [ ] Skill applied: Configure Global API Error Handler

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged

# Reliability Checklist (from 04/05/06)
- [ ] Error handling covers all failure modes
- [ ] Database transactions wrap multi-step operations
- [ ] Stateless design enforced (no mutable per-request state)
- [ ] Logging is configured for debugging without leaking sensitive data

# Testing Checklist (from 04/06)
- [ ] Unit tests cover happy path
- [ ] Unit tests cover error/exception paths
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Test coverage includes edge cases
- [ ] Architecture tests enforce patterns (Pest arch tests)
- [ ] Catch-all `renderable()` for `Throwable` exists and returns JSON for API routes
- [ ] `shouldRenderJsonWhen` is configured using both route prefix and `Accept` header
- [ ] HTTP status code is mapped correctly per exception type (401, 403, 422, 404, 429, 500)
- [ ] Machine-readable type string is included in every response
- [ ] No stack traces, file paths, or line numbers appear in production JSON responses
- [ ] Request ID is included from the `X-Request-Id` header
- [ ] Validation error responses include field-level `details` mapping

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Error responses do not leak stack traces or internals
- [ ] Logging level is appropriate for production (INFO/WARN/ERROR)
- [ ] Feature flags or toggles are in place for risky changes
- [ ] Migration rollback strategy is defined
- [ ] Rate limiting is applied where appropriate
- [ ] Monitoring/alerting is configured for failure modes
- [ ] Dependencies are up to date with no known vulnerabilities

# Final Approval Checklist
- [ ] All previous checklist sections have been reviewed and satisfied
- [ ] Code review has been completed by at least one peer
- [ ] The implementation matches the approved design/architecture
- [ ] Tests pass in CI environment
- [ ] Documentation is updated (if applicable)
- [ ] No known regressions introduced
- [ ] Change log entry is added (if applicable)

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Rules (from 05)
- Always Return Consistent JSON Envelope for API Errors
- Never Expose Stack Traces or Internal Paths in Production API Responses
- Always Configure a Catch-All renderable() for Throwable in API Routes
- Use Machine-Readable Error Types Instead of Parsing Status Codes or Messages
- Include a Request ID in Every API Error Response
- Map HTTP Status Codes Correctly for Common Exception Types
- Configure shouldRenderJsonWhen for API Routes
- Include Structured Field-Level Validation Errors in API Responses
- Document API Error Format in OpenAPI/Swagger
- Never Leak User-Specific Information in Public Error Messages
- Use Centralized Error Formatting, Not Per-Controller JsonResponse
### Skills (from 06)
- Configure Global API Error Handler
- Implement API Validation Error Responses
### Related Rules (from 06 skills)
- Always Return Consistent JSON Envelope for API Errors
- Never Expose Stack Traces or Internal Paths in Production API Responses
- Always Configure a Catch-All renderable() for Throwable in API Routes
- Use Machine-Readable Error Types Instead of Parsing Status Codes or Messages
- Include a Request ID in Every API Error Response
- Map HTTP Status Codes Correctly for Common Exception Types
- Configure shouldRenderJsonWhen for API Routes
### Related Skills (from 06 skills)
- Create a Typed Custom Exception Class (custom-exception-classes)
- Configure the Exception Handler (exception-fundamentals)

