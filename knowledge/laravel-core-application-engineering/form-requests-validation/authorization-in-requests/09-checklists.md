# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Authorization in Requests
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `authorize()` implemented on every FormRequest (no reliance on default `true`)
- [ ] Authorization logic delegated to Policy or Gate (not inline)
- [ ] Route model binding accessed via `$this->route('param')` (no redundant queries)
- [ ] `Response::deny('reason')` used with descriptive message instead of `false`
- [ ] No database queries or business rules inside `authorize()`
- [ ] Tests cover 403 response for unauthorized users
- [ ] Tests verify authorization runs before validation (no validation errors for unauthorized users)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - `authorize()` resolves through the container, enabling method injection
- [ ] Architecture guideline: - Route parameters accessed via `$this->route('paramName')`
- [ ] Architecture guideline: - Policy methods should contain the actual authorization logic
- [ ] Architecture guideline: - `failedAuthorization()` throws `AuthorizationException` â†’ maps to HTTP 403
- [ ] Architecture guideline: - `AuthorizationException` is never logged (in `internalDontReport` list)
- [ ] Architecture guideline: - Customize denial reason by passing message to `AuthorizationException` constructor
- [ ] Decision: authorize() Method vs Controller/Service Authorization - ensure correct choice is made
- [ ] Decision: Policy Delegation vs Inline Authorization Logic - ensure correct choice is made
- [ ] Decision: authorize() Return Type: bool vs Response vs Throw - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement HTTP-Layer Authorization in FormRequests
- [ ] Skill applied: Implement Custom 403 Response Format via failedAuthorization

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
- [ ] `authorize()` implemented on every FormRequest (no reliance on default `true`)
- [ ] Authorization logic delegated to Policy or Gate (not inline)
- [ ] Route model binding accessed via `$this->route('param')` (no redundant queries)
- [ ] `Response::deny('reason')` used with descriptive message instead of `false`
- [ ] No database queries or business rules inside `authorize()`
- [ ] Tests cover 403 response for unauthorized users
- [ ] Tests verify authorization runs before validation (no validation errors for unauthorized users)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Complex Inline Logic in authorize() -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing authorize() on Mutating Actions -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Database Queries in authorize() -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Returning false Without a Denial Message -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Unlogged Authorization Denials -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Authorization in the Wrong Pipeline Step -- apply preferred alternative
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
- Implement HTTP-Layer Authorization in FormRequests
- Implement Custom 403 Response Format via failedAuthorization
### Decision Trees (from 07)
- authorize() Method vs Controller/Service Authorization
- Policy Delegation vs Inline Authorization Logic
- authorize() Return Type: bool vs Response vs Throw
### Anti-Patterns (from 08)
- Complex Inline Logic in authorize()
- Missing authorize() on Mutating Actions
- Database Queries in authorize()
- Returning false Without a Denial Message
- Unlogged Authorization Denials
- Authorization in the Wrong Pipeline Step
### Related Rules (from 06 skills)
- Rule 1: Keep authorize() Thin â€” Delegate to Policies and Gates
- Rule 2: Always Implement authorize() on Each FormRequest
- Rule 3: Do Not Put Business Logic or Database Queries in authorize()
- Rule 4: Return Response::deny() with a Message Instead of False
- Rule 5: Override failedAuthorization() for Custom 403 Responses
- Rule 6: Route Model Binding Results Accessed via $this->route()
### Related Skills (from 06 skills)
- Implement HTTP-Layer Authorization in FormRequests
- Implement Custom Error Responses Using failedValidation

