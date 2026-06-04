# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** API Resources
**Knowledge Unit:** Data Wrapping
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Keep Wrapping Strategy Consistent Across All Endpoints
- [ ] Enforce: Always Wrap Collection Responses from the Start
- [ ] Enforce: Mirror Production Wrapping in Test Configuration
- [ ] Enforce: Never Rely on $wrap for Nested Resource Formatting
- [ ] Enforce: Prefer Global withoutWrapping for Unwrapped APIs
- [ ] Enforce: Avoid Bare JSON Arrays as Top-Level Responses
- [ ] Enforce: Use Consistent $wrap Keys Across the API
- [ ] Wrapping choice is consistent across all endpoints in the same API version
- [ ] Collection responses are wrapped from the start (even without pagination)
- [ ] Test configuration mirrors production wrapping behavior
- [ ] No bare JSON arrays are used as top-level responses for list endpoints
- [ ] `$wrap` is not relied upon for nested resource formatting
- [ ] Wrapping behavior is documented in API docs
- [ ] Consistent `$wrap` keys are used for the same resource type

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Global scope: `withoutWrapping()` is a static call â€” typically in `AppServiceProvider::boot()`.
- [ ] Architecture guideline: - Version-based wrapping: Conditionally call `withoutWrapping()` based on request prefix for mixe...
- [ ] Architecture guideline: - `$wrap` on a `ResourceCollection` changes the collection wrapper key, not the individual item w...
- [ ] Architecture guideline: - When a resource with custom `$wrap` is nested inside another resource, the wrapping is lost. On...
- [ ] Architecture guideline: - Unwrapped paginated collections still get `links` and `meta` at the top level (these are not wr...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Keep Wrapping Strategy Consistent Across All Endpoints
- [ ] Apply rule: Always Wrap Collection Responses from the Start
- [ ] Apply rule: Mirror Production Wrapping in Test Configuration
- [ ] Apply rule: Never Rely on $wrap for Nested Resource Formatting
- [ ] Apply rule: Prefer Global withoutWrapping for Unwrapped APIs
- [ ] Apply rule: Avoid Bare JSON Arrays as Top-Level Responses
- [ ] Apply rule: Use Consistent $wrap Keys Across the API
- [ ] Skill applied: Configure Data Wrapping for an API

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
- [ ] Wrapping choice is consistent across all endpoints in the same API version
- [ ] Collection responses are wrapped from the start (even without pagination)
- [ ] Test configuration mirrors production wrapping behavior
- [ ] No bare JSON arrays are used as top-level responses for list endpoints
- [ ] `$wrap` is not relied upon for nested resource formatting
- [ ] Wrapping behavior is documented in API docs
- [ ] Consistent `$wrap` keys are used for the same resource type

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Inconsistent Wrapping Across Endpoints -- apply preferred alternative
    - [ ] Are all endpoints consistent in their wrapping format?
    - [ ] Is `withoutWrapping()` called globally or not?
- [ ] Prevent: Forgetting `withoutWrapping()` in Tests -- apply preferred alternative
    - [ ] Do test assertions match production wrapping configuration?
    - [ ] Is wrapping configured in test base class?

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
- Keep Wrapping Strategy Consistent Across All Endpoints
- Always Wrap Collection Responses from the Start
- Mirror Production Wrapping in Test Configuration
- Never Rely on $wrap for Nested Resource Formatting
- Prefer Global withoutWrapping for Unwrapped APIs
- Avoid Bare JSON Arrays as Top-Level Responses
- Use Consistent $wrap Keys Across the API
### Skills (from 06)
- Configure Data Wrapping for an API
### Anti-Patterns (from 08)
- Inconsistent Wrapping Across Endpoints
- Forgetting `withoutWrapping()` in Tests
### Related Rules (from 06 skills)
- Keep Wrapping Strategy Consistent Across All Endpoints (Architecture)
- Always Wrap Collection Responses from the Start (Scalability)
- Mirror Production Wrapping in Test Configuration (Testing)
- Never Rely on $wrap for Nested Resource Formatting (Design)
- Prefer Global withoutWrapping for Unwrapped APIs (Code Organization)
- Avoid Bare JSON Arrays as Top-Level Responses (Scalability)
- Use Consistent $wrap Keys Across the API (Design)
### Related Skills (from 06 skills)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Resource Collections](../resource-collections/06-skills.md)
- [Pagination Metadata](../pagination-metadata/06-skills.md)
- [Top-Level Meta Data](../top-level-meta-data/06-skills.md)

