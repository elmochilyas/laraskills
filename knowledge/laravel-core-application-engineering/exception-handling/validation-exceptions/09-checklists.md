# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Validation Error Formatting
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Use FormRequest Classes Instead of Inline Validation in Controllers
- [ ] Enforce: Never Catch ValidationException in Controllers
- [ ] Enforce: Log Validation Failures at INFO Level, Not ERROR
- [ ] Enforce: Use Named Error Bags for Pages with Multiple Independent Forms
- [ ] Enforce: Customize failedValidation() for Non-Standard Error Responses
- [ ] Enforce: Test Validation Failure Paths for Every Form and Endpoint
- [ ] Enforce: Always Perform Server-Side Validation â€” Never Trust Client-Side Alone
- [ ] Enforce: Structure API Validation Errors as Field â†’ Messages Mapping
- [ ] Enforce: Use assertSessionHasErrors() for HTML and assertJsonValidationErrors() for API Validation Tests
- [ ] FormRequest is used instead of inline `$request->validate()` for 3+ rules
- [ ] `authorize()` method gates access (or returns `true` for public endpoints)
- [ ] Rules use array syntax for consistency and extensibility
- [ ] Named error bag is set when the page has multiple forms
- [ ] Controller uses `$request->validated()` instead of `$request->all()`
- [ ] Tests exist for success path (assertCreated, assertRedirect)
- [ ] Tests exist for validation failure paths (assertSessionHasErrors)
- [ ] `ValidationException` is never caught in the controller

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Use FormRequest classes for complex validation (not inline in controllers)
- [ ] Architecture guideline: - Use named error bags when a page has multiple independent forms
- [ ] Architecture guideline: - Customize `failedValidation()` on FormRequest for custom error responses
- [ ] Architecture guideline: - Log validation failures at INFO level (not ERROR) â€” they're expected behavior
- [ ] Architecture guideline: - Test validation failure paths in every form submission test
- [ ] Architecture guideline: - For API responses, format validation errors consistently (field â†’ messages)
- [ ] Decision: FormRequest vs Inline $request->validate() for Validation - ensure correct choice is made
- [ ] Decision: Named Error Bags vs Single Default Error Bag for Multi-Form Pages - ensure correct choice is made
- [ ] Decision: Custom failedValidation() vs Handler renderable() for Validation Response - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Use FormRequest Classes Instead of Inline Validation in Controllers
- [ ] Apply rule: Never Catch ValidationException in Controllers
- [ ] Apply rule: Log Validation Failures at INFO Level, Not ERROR
- [ ] Apply rule: Use Named Error Bags for Pages with Multiple Independent Forms
- [ ] Apply rule: Customize failedValidation() for Non-Standard Error Responses
- [ ] Apply rule: Test Validation Failure Paths for Every Form and Endpoint
- [ ] Apply rule: Always Perform Server-Side Validation â€” Never Trust Client-Side Alone
- [ ] Apply rule: Structure API Validation Errors as Field â†’ Messages Mapping
- [ ] Apply rule: Use assertSessionHasErrors() for HTML and assertJsonValidationErrors() for API Validation Tests
- [ ] Skill applied: Create FormRequest-Validated Endpoint
- [ ] Skill applied: Customize Validation Error Responses

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
- [ ] FormRequest is used instead of inline `$request->validate()` for 3+ rules
- [ ] `authorize()` method gates access (or returns `true` for public endpoints)
- [ ] Rules use array syntax for consistency and extensibility
- [ ] Named error bag is set when the page has multiple forms
- [ ] Controller uses `$request->validated()` instead of `$request->all()`
- [ ] Tests exist for success path (assertCreated, assertRedirect)
- [ ] Tests exist for validation failure paths (assertSessionHasErrors)

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
- Use FormRequest Classes Instead of Inline Validation in Controllers
- Never Catch ValidationException in Controllers
- Log Validation Failures at INFO Level, Not ERROR
- Use Named Error Bags for Pages with Multiple Independent Forms
- Customize failedValidation() for Non-Standard Error Responses
- Test Validation Failure Paths for Every Form and Endpoint
- Always Perform Server-Side Validation â€” Never Trust Client-Side Alone
- Structure API Validation Errors as Field â†’ Messages Mapping
- Use assertSessionHasErrors() for HTML and assertJsonValidationErrors() for API Validation Tests
### Skills (from 06)
- Create FormRequest-Validated Endpoint
- Customize Validation Error Responses
### Decision Trees (from 07)
- FormRequest vs Inline $request->validate() for Validation
- Named Error Bags vs Single Default Error Bag for Multi-Form Pages
- Custom failedValidation() vs Handler renderable() for Validation Response
### Related Rules (from 06 skills)
- Use FormRequest Classes Instead of Inline Validation in Controllers
- Never Catch ValidationException in Controllers
- Log Validation Failures at INFO Level, Not ERROR
- Use Named Error Bags for Pages with Multiple Independent Forms
- Test Validation Failure Paths for Every Form and Endpoint
- Always Perform Server-Side Validation â€” Never Trust Client-Side Alone
- Use assertSessionHasErrors() for HTML and assertJsonValidationErrors() for API Validation Tests
### Related Skills (from 06 skills)
- Customize Validation Error Responses (this file, below)
- Implement Content-Negotiated HTTP Error Responses (http-exceptions)

