# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Middleware Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Pass-through path test asserts 200 and calls `$next`
- [ ] Every short-circuit condition has its own test method
- [ ] Modification assertions verify request attributes or response headers
- [ ] All test methods complete in under 1ms each
- [ ] No HTTP feature tests used for pure middleware logic
- [ ] Security middleware has 100% branch coverage

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Direct unit test pattern:** Instantiate middleware â†’ create `Request::create()` â†’ call `$...
- [ ] Architecture guideline: - **Feature test pattern:** Make HTTP request to route â†’ assert on response status, headers, re...
- [ ] Architecture guideline: - **Terminable middleware test:** Call `$middleware->terminate($request, $response)` directly. As...
- [ ] Architecture guideline: - **Parameterized middleware test:** Pass parameters as additional arguments to `handle()`: `$mid...
- [ ] Architecture guideline: - **Architecture test (Pest):** `expect('App\Http\Middleware')->toHaveMethod('handle')`.
- [ ] Architecture guideline: - **`withoutMiddleware()` in tests:** Disables specific or all middleware. Use sparingly â€” only...
- [ ] Architecture guideline: - **Security middleware coverage:** Auth, CSRF, rate limiting, CORS should have 100% branch cover...
- [ ] Decision: Direct Unit Tests vs Feature Tests for Middleware - ensure correct choice is made
- [ ] Decision: Testing Pass-Through Path vs Short-Circuit Path vs Modification Path - ensure correct choice is made
- [ ] Decision: Terminable Middleware Testing via Direct Invocation vs Feature Tests - ensure correct choice is made
- [ ] Decision: Architecture Tests vs Manual Convention Enforcement - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Write Direct Unit Tests for Middleware Covering All Three Paths
- [ ] Skill applied: Test Terminable Middleware by Calling terminate() Directly

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
- [ ] Pass-through path test asserts 200 and calls `$next`
- [ ] Every short-circuit condition has its own test method
- [ ] Modification assertions verify request attributes or response headers
- [ ] All test methods complete in under 1ms each
- [ ] No HTTP feature tests used for pure middleware logic
- [ ] Security middleware has 100% branch coverage

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: All Middleware Tests as Feature Tests -- apply preferred alternative
    - [ ] Middleware logic tests are direct unit tests (not HTTP feature tests)
    - [ ] Feature tests are only used for pipeline integration (parsing, priority, aliases)
    - [ ] Suite of 50 middleware tests runs in <200ms
- [ ] Prevent: Only Testing the Happy Path -- apply preferred alternative
    - [ ] Every gating middleware has short-circuit tests for all conditions
    - [ ] Branch coverage for security middleware is 100%
    - [ ] Auth middleware tested with both authenticated and unauthenticated states
- [ ] Prevent: Testing Through the Controller Instead of Middleware -- apply preferred alternative
    - [ ] Middleware tests do not depend on controller implementation
    - [ ] Middleware behavior is verified by direct assertions on middleware return
    - [ ] Controller refactoring does not break middleware tests
- [ ] Prevent: Never Testing Terminable Middleware -- apply preferred alternative
    - [ ] Every terminable middleware has a direct `terminate()` test
    - [ ] Side effects (log, metrics, cleanup) are asserted in the test
    - [ ] Feature tests do not claim coverage for `terminate()` behavior
- [ ] Prevent: Overusing withoutMiddleware() -- apply preferred alternative
    - [ ] `withoutMiddleware()` is not used in standard feature tests
    - [ ] Tests exercise the full middleware pipeline by default
    - [ ] Middleware interaction bugs are caught by the test suite

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
- Write Direct Unit Tests for Middleware Covering All Three Paths
- Test Terminable Middleware by Calling terminate() Directly
### Decision Trees (from 07)
- Direct Unit Tests vs Feature Tests for Middleware
- Testing Pass-Through Path vs Short-Circuit Path vs Modification Path
- Terminable Middleware Testing via Direct Invocation vs Feature Tests
- Architecture Tests vs Manual Convention Enforcement
### Anti-Patterns (from 08)
- All Middleware Tests as Feature Tests
- Only Testing the Happy Path
- Testing Through the Controller Instead of Middleware
- Never Testing Terminable Middleware
- Overusing withoutMiddleware()
### Related Rules (from 06 skills)
- Prefer Direct Unit Tests Over HTTP Feature Tests for Middleware Logic (middleware-testing:5)
- Test All Three Middleware Paths: Pass-Through, Short-Circuit, and Modification (middleware-testing:5)
- Require 100% Branch Coverage for Security Middleware (middleware-testing:5)
- Test Parameterized Middleware with Each Parameter Variant (middleware-testing:5)
### Related Skills (from 06 skills)
- Test Terminable Middleware by Calling terminate() Directly
- Test All Three Execution Paths of Custom Middleware

