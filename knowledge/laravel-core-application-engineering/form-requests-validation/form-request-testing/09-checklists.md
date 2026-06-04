# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Form Request Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Integration test for each FormRequest
- [ ] Test covers valid data passing validation
- [ ] Test covers each defined rule violation with field-specific assertion
- [ ] Boundary conditions tested (null, empty, max, special chars)
- [ ] Authorization failure tested (403 response)
- [ ] Pest datasets used for combinatorial testing (reduces test boilerplate)
- [ ] API and web response formats tested where applicable
- [ ] No unit-testing of FormRequest internals

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Web requests (no `Accept: application/json`): Redirect back + flash errors to session
- [ ] Architecture guideline: - API requests (with `Accept: application/json`): JSON response with 422 status and `errors` object
- [ ] Architecture guideline: - `assertSessionHasErrors(['email'])` checks the session error bag for specific field errors
- [ ] Architecture guideline: - `assertInvalid(['email'])` (Laravel 11+) works for both web and API contexts
- [ ] Architecture guideline: - Authorization: `$response->assertStatus(403)` for `AuthorizationException`
- [ ] Architecture guideline: - Use `$this->actingAs($user)` to set authenticated user for authorization tests
- [ ] Decision: Integration Test vs Unit Test for FormRequest Validation - ensure correct choice is made
- [ ] Decision: Test Coverage Scope for Validation Rules - ensure correct choice is made
- [ ] Decision: Separate Validation Tests vs Combined Controller + Validation Tests - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Test Validation Boundaries via HTTP Integration Tests
- [ ] Skill applied: Test Authorization Failures in FormRequests

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
- [ ] Integration test for each FormRequest
- [ ] Test covers valid data passing validation
- [ ] Test covers each defined rule violation with field-specific assertion
- [ ] Boundary conditions tested (null, empty, max, special chars)
- [ ] Authorization failure tested (403 response)
- [ ] Pest datasets used for combinatorial testing (reduces test boilerplate)
- [ ] API and web response formats tested where applicable

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Testing Validation Rules via HTTP End-to-End Tests Only -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Testing Without the authorize() Method -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Testing Only the Happy Path -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Testing FormRequest Methods Through the Parent Class Auth Check -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Testing Every Rule Individually Without Using Datasets -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Ignoring Input Preparation in Tests -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern

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
### Skills (from 06)
- Test Validation Boundaries via HTTP Integration Tests
- Test Authorization Failures in FormRequests
### Decision Trees (from 07)
- Integration Test vs Unit Test for FormRequest Validation
- Test Coverage Scope for Validation Rules
- Separate Validation Tests vs Combined Controller + Validation Tests
### Anti-Patterns (from 08)
- Testing Validation Rules via HTTP End-to-End Tests Only
- Testing Without the authorize() Method
- Testing Only the Happy Path
- Testing FormRequest Methods Through the Parent Class Auth Check
- Testing Every Rule Individually Without Using Datasets
- Ignoring Input Preparation in Tests
### Related Rules (from 06 skills)
- Rule 1: Test FormRequests via HTTP Integration Tests â€” Not Unit Tests
- Rule 2: Test Authorization Failure Separately from Validation
- Rule 3: Assert on Field-Specific Errors â€” Not Generic Checks
- Rule 4: Use Pest Datasets for Combinatorial Rule Testing
- Rule 5: Test Boundary Conditions â€” Not Just Happy Paths
- Rule 6: Use assertInvalid() for Cross-Context Assertions (Laravel 11+)
### Related Skills (from 06 skills)
- Test Custom Validation Rules in Isolation
- Implement HTTP-Layer Authorization in FormRequests

