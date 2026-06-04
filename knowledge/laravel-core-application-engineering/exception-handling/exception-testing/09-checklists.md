# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Error Pages Customization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Write a Unit Test for Every Custom Exception Class
- [ ] Enforce: Test Error Rendering for Every Request Type â€” HTML, JSON, and Inertia
- [ ] Enforce: Test Error Page Views to Ensure They Render Without Errors
- [ ] Enforce: Use $this->expectException() to Assert Exceptions Are Thrown
- [ ] Enforce: Test Both with and without Exception Handling
- [ ] Enforce: Test That Production Error Pages Do Not Expose Stack Traces
- [ ] Enforce: Use Log::spy() to Assert Logging Behavior Without Writing to Disk
- [ ] Enforce: Test Every findOrFail() Path for a 404 Response
- [ ] Enforce: Test That Expected Exceptions Are NOT Reported at ERROR Level
- [ ] Enforce: Include Exception Tests in CI Pipeline
- [ ] Every custom exception class has a unit test for construction and context
- [ ] HTTP error responses are tested for HTML requests (assertViewIs, assertSee)
- [ ] HTTP error responses are tested for JSON requests (assertJson, assertStatus)
- [ ] Inertia error rendering is tested if applicable
- [ ] Error page views (at minimum 404, 500) render without errors
- [ ] Production error pages do not expose stack traces, file paths, or line numbers
- [ ] Tests exist both with exception handling (rendered) and `withoutExceptionHandling` (raw)
- [ ] Every `findOrFail()` path has a "not found" test
- [ ] Exception tests are included in the CI pipeline

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Test every custom exception's construction and context data (unit test)
- [ ] Architecture guideline: - Test the handler's rendering for each request type (HTML, JSON, Inertia)
- [ ] Architecture guideline: - Test error page views render without errors (use `$this->view('errors.404')`)
- [ ] Architecture guideline: - Test API error response format matches documented contract
- [ ] Architecture guideline: - Use `Log::spy()` to verify logging without writing to disk
- [ ] Architecture guideline: - Include exception tests in CI â€” they're fast and catch regressions early

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Write a Unit Test for Every Custom Exception Class
- [ ] Apply rule: Test Error Rendering for Every Request Type â€” HTML, JSON, and Inertia
- [ ] Apply rule: Test Error Page Views to Ensure They Render Without Errors
- [ ] Apply rule: Use $this->expectException() to Assert Exceptions Are Thrown
- [ ] Apply rule: Test Both with and without Exception Handling
- [ ] Apply rule: Test That Production Error Pages Do Not Expose Stack Traces
- [ ] Apply rule: Use Log::spy() to Assert Logging Behavior Without Writing to Disk
- [ ] Apply rule: Test Every findOrFail() Path for a 404 Response
- [ ] Apply rule: Test That Expected Exceptions Are NOT Reported at ERROR Level
- [ ] Apply rule: Include Exception Tests in CI Pipeline
- [ ] Skill applied: Write Exception Handler Tests

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
- [ ] Every custom exception class has a unit test for construction and context
- [ ] HTTP error responses are tested for HTML requests (assertViewIs, assertSee)
- [ ] HTTP error responses are tested for JSON requests (assertJson, assertStatus)
- [ ] Inertia error rendering is tested if applicable
- [ ] Error page views (at minimum 404, 500) render without errors
- [ ] Production error pages do not expose stack traces, file paths, or line numbers
- [ ] Tests exist both with exception handling (rendered) and `withoutExceptionHandling` (raw)

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
- Write a Unit Test for Every Custom Exception Class
- Test Error Rendering for Every Request Type â€” HTML, JSON, and Inertia
- Test Error Page Views to Ensure They Render Without Errors
- Use $this->expectException() to Assert Exceptions Are Thrown
- Test Both with and without Exception Handling
- Test That Production Error Pages Do Not Expose Stack Traces
- Use Log::spy() to Assert Logging Behavior Without Writing to Disk
- Test Every findOrFail() Path for a 404 Response
- Test That Expected Exceptions Are NOT Reported at ERROR Level
- Include Exception Tests in CI Pipeline
### Skills (from 06)
- Write Exception Handler Tests
### Related Rules (from 06 skills)
- Write a Unit Test for Every Custom Exception Class
- Test Error Rendering for Every Request Type â€” HTML, JSON, and Inertia
- Test Error Page Views to Ensure They Render Without Errors
- Use $this->expectException() to Assert Exceptions Are Thrown
- Test Both with and without Exception Handling
- Test That Production Error Pages Do Not Expose Stack Traces
- Use Log::spy() to Assert Logging Behavior Without Writing to Disk
- Test Every findOrFail() Path for a 404 Response
- Test That Expected Exceptions Are NOT Reported at ERROR Level
- Include Exception Tests in CI Pipeline
### Related Skills (from 06 skills)
- Create a Typed Custom Exception Class (custom-exception-classes)
- Configure the Exception Handler (exception-fundamentals)
- Configure Global API Error Handler (api-exception-handling)

