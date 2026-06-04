# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** API Resources
**Knowledge Unit:** Top-Level Meta Data
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Standardize Metadata Structure via a Base Resource Class
- [ ] Enforce: Use Middleware for Global Metadata; Use with() for Endpoint-Specific
- [ ] Enforce: Avoid Key Conflicts with Pagination Metadata
- [ ] Enforce: Keep with() Computation Light
- [ ] Enforce: Never Include Sensitive Data in with() Output
- [ ] Enforce: Use withResponse() for HTTP Headers, with() for JSON Body
- [ ] Enforce: Only Expect with() on the Outer Resource
- [ ] Enforce: Test That Metadata Keys Appear in the Response
- [ ] Enforce: Use Unique Key Names to Avoid Array Union Surprises
- [ ] All resources use a shared base class with standardized `with()` structure
- [ ] No sensitive data (internal state, server paths, config values) in metadata
- [ ] `with()` does not contain expensive database queries or external calls
- [ ] Metadata keys do not conflict with pagination keys (`data`, `links`, `meta`)
- [ ] `withResponse()` headers are integration-tested to confirm no collisions with middleware
- [ ] `with()` on sub-resources is not expected to appear at the top level

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Static metadata (API version, format version) belongs in `with()` on a base class.
- [ ] Architecture guideline: - Dynamic metadata (request time, applied filters, user context) belongs in `with()` with request...
- [ ] Architecture guideline: - Response modifications (headers, status codes) belong in `withResponse()`.
- [ ] Architecture guideline: - `withResponse()` is useful for deprecation headers, custom status codes (201 Created), and ETag...
- [ ] Architecture guideline: - Collection metadata overrides individual resource metadata when both define `with()`.

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Standardize Metadata Structure via a Base Resource Class
- [ ] Apply rule: Use Middleware for Global Metadata; Use with() for Endpoint-Specific
- [ ] Apply rule: Avoid Key Conflicts with Pagination Metadata
- [ ] Apply rule: Keep with() Computation Light
- [ ] Apply rule: Never Include Sensitive Data in with() Output
- [ ] Apply rule: Use withResponse() for HTTP Headers, with() for JSON Body
- [ ] Apply rule: Only Expect with() on the Outer Resource
- [ ] Apply rule: Test That Metadata Keys Appear in the Response
- [ ] Apply rule: Use Unique Key Names to Avoid Array Union Surprises
- [ ] Skill applied: Add Top-Level Metadata to a Resource

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
- [ ] All resources use a shared base class with standardized `with()` structure
- [ ] No sensitive data (internal state, server paths, config values) in metadata
- [ ] `with()` does not contain expensive database queries or external calls
- [ ] Metadata keys do not conflict with pagination keys (`data`, `links`, `meta`)
- [ ] `withResponse()` headers are integration-tested to confirm no collisions with middleware
- [ ] `with()` on sub-resources is not expected to appear at the top level

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Expensive Computation Inside `with()` -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Sensitive Data Leaked via Metadata -- apply preferred alternative
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
### Rules (from 05)
- Standardize Metadata Structure via a Base Resource Class
- Use Middleware for Global Metadata; Use with() for Endpoint-Specific
- Avoid Key Conflicts with Pagination Metadata
- Keep with() Computation Light
- Never Include Sensitive Data in with() Output
- Use withResponse() for HTTP Headers, with() for JSON Body
- Only Expect with() on the Outer Resource
- Test That Metadata Keys Appear in the Response
- Use Unique Key Names to Avoid Array Union Surprises
### Skills (from 06)
- Add Top-Level Metadata to a Resource
### Anti-Patterns (from 08)
- Expensive Computation Inside `with()`
- Sensitive Data Leaked via Metadata
### Related Rules (from 06 skills)
- Standardize Metadata Structure via a Base Resource Class (Code Organization)
- Use Middleware for Global Metadata; Use with() for Endpoint-Specific (Architecture)
- Avoid Key Conflicts with Pagination Metadata (Design)
- Keep with() Computation Light (Performance)
- Never Include Sensitive Data in with() Output (Security)
- Use withResponse() for HTTP Headers, with() for JSON Body (Framework Usage)
- Only Expect with() on the Outer Resource (Design)
- Test That Metadata Keys Appear in the Response (Testing)
- Use Unique Key Names to Avoid Array Union Surprises (Reliability)
### Related Skills (from 06 skills)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Pagination Metadata](../pagination-metadata/06-skills.md)
- [Data Wrapping](../data-wrapping/06-skills.md)

