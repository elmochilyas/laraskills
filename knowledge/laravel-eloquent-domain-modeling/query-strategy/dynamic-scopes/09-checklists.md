# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Query Strategy
**Knowledge Unit:** Dynamic Scopes
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Dynamic scope names from user input are validated against a whitelist
- [ ] Parameterized scopes have focused parameters (< 3)
- [ ] No `method_exists()` calls without a whitelist for dynamic dispatch
- [ ] Dynamic scopes documented with parameter types
- [ ] Scope parameters sanitized and validated before use
- [ ] Auditing/logging in place for dynamic scope application in security contexts
- [ ] Unknown scope names rejected with clear error messages

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Implement a `$filterable` property on models listing allowed dynamic scope names
- [ ] Architecture guideline: - Create a `applyFilters()` method on models or query objects encapsulating dynamic scope logic
- [ ] Architecture guideline: - Keep parameterized scopes focused (< 3 parameters); split complex logic into multiple scopes
- [ ] Architecture guideline: - Document available dynamic scopes with parameter types for API consumers
- [ ] Architecture guideline: - Separate the scope registry (what scopes are available) from scope application (how they're app...
- [ ] Decision: Dynamic Dispatch vs Explicit Scopes - ensure correct choice is made
- [ ] Decision: Whitelist Security for User Input - ensure correct choice is made
- [ ] Decision: Parameterized Scope Complexity - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Dynamic Scopes with Whitelisted Dispatch

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
- [ ] Dynamic scope names from user input are validated against a whitelist
- [ ] Parameterized scopes have focused parameters (< 3)
- [ ] No `method_exists()` calls without a whitelist for dynamic dispatch
- [ ] Dynamic scopes documented with parameter types
- [ ] Scope parameters sanitized and validated before use
- [ ] Auditing/logging in place for dynamic scope application in security contexts
- [ ] Unknown scope names rejected with clear error messages

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
### Skills (from 06)
- Implement Dynamic Scopes with Whitelisted Dispatch
### Decision Trees (from 07)
- Dynamic Dispatch vs Explicit Scopes
- Whitelist Security for User Input
- Parameterized Scope Complexity
### Related Rules (from 06 skills)
- Always Whitelist Dynamic Scope Names from User Input (query-strategy/dynamic-scopes)
- Limit Parameterized Scopes to 3 Parameters Maximum (query-strategy/dynamic-scopes)
- Explicitly Chain Scopes for Business-Logic Queries (query-strategy/dynamic-scopes)
- Validate Scope Parameters Before Passing Them to Parameterized Scopes (query-strategy/dynamic-scopes)
- Reject Unknown Scope Names with a Clear Error Message (query-strategy/dynamic-scopes)
- Avoid Dynamic Dispatch for Code Requiring Static Analysis (query-strategy/dynamic-scopes)
### Related Skills (from 06 skills)
- Implement Local Scopes for Reusable Constraints
- Compose Conditional Query Chains with when()
- Implement Domain-Specific Query Methods on Custom Builders

