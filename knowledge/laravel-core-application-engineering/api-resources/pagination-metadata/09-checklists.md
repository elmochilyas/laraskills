# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** API Resources
**Knowledge Unit:** Pagination Metadata
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Always Include per_page and total in Paginated Responses
- [ ] Enforce: Cap per_page to Prevent Oversized Responses
- [ ] Enforce: Use a Base Collection Class for Consistent Pagination Metadata
- [ ] Enforce: Prefer CursorPaginator for Datasets Over 1M Rows
- [ ] Enforce: Never Include Business Data Inside Pagination Metadata
- [ ] Enforce: Test Pagination Structure, Not Exact URLs
- [ ] Enforce: Document the Paginator Type Per Endpoint
- [ ] Enforce: Keep paginationInformation Customizations Minimal
- [ ] All list endpoints returning >50 items are paginated
- [ ] Paginated responses include consistent `links` and `meta` keys
- [ ] `per_page` is capped (max 100) to prevent oversized responses
- [ ] Pagination metadata structure is consistent across all endpoints (via base class)
- [ ] Cursor pagination is used for datasets >1M rows or deep page access
- [ ] No sensitive data in pagination metadata
- [ ] No business data mixed into pagination metadata
- [ ] Paginator type is documented per endpoint

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Controller decides pagination type and size; collection only formats.
- [ ] Architecture guideline: - Offset pagination (`LengthAwarePaginator`) requires a `COUNT(*)` query â€” expensive on large t...
- [ ] Architecture guideline: - Cursor pagination does not support random page access (no "go to page 5"). Use offset paginatio...
- [ ] Architecture guideline: - Pagination metadata is auto-generated based on the current request URL. In console commands or ...
- [ ] Architecture guideline: - Keep `paginationInformation()` customization minimal and consistent. Every collection using a d...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Always Include per_page and total in Paginated Responses
- [ ] Apply rule: Cap per_page to Prevent Oversized Responses
- [ ] Apply rule: Use a Base Collection Class for Consistent Pagination Metadata
- [ ] Apply rule: Prefer CursorPaginator for Datasets Over 1M Rows
- [ ] Apply rule: Never Include Business Data Inside Pagination Metadata
- [ ] Apply rule: Test Pagination Structure, Not Exact URLs
- [ ] Apply rule: Document the Paginator Type Per Endpoint
- [ ] Apply rule: Keep paginationInformation Customizations Minimal
- [ ] Skill applied: Customize Pagination Metadata in Collections

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
- [ ] All list endpoints returning >50 items are paginated
- [ ] Paginated responses include consistent `links` and `meta` keys
- [ ] `per_page` is capped (max 100) to prevent oversized responses
- [ ] Pagination metadata structure is consistent across all endpoints (via base class)
- [ ] Cursor pagination is used for datasets >1M rows or deep page access
- [ ] No sensitive data in pagination metadata
- [ ] No business data mixed into pagination metadata

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Missing or Inconsistent Pagination Metadata -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Unbounded `per_page` Parameter -- apply preferred alternative
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
- Always Include per_page and total in Paginated Responses
- Cap per_page to Prevent Oversized Responses
- Use a Base Collection Class for Consistent Pagination Metadata
- Prefer CursorPaginator for Datasets Over 1M Rows
- Never Include Business Data Inside Pagination Metadata
- Test Pagination Structure, Not Exact URLs
- Document the Paginator Type Per Endpoint
- Keep paginationInformation Customizations Minimal
### Skills (from 06)
- Customize Pagination Metadata in Collections
### Anti-Patterns (from 08)
- Missing or Inconsistent Pagination Metadata
- Unbounded `per_page` Parameter
### Related Rules (from 06 skills)
- Always Include per_page and total in Paginated Responses (Design)
- Cap per_page to Prevent Oversized Responses (Security)
- Use a Base Collection Class for Consistent Pagination Metadata (Code Organization)
- Prefer CursorPaginator for Datasets Over 1M Rows (Performance)
- Never Include Business Data Inside Pagination Metadata (Design)
- Test Pagination Structure, Not Exact URLs (Testing)
- Document the Paginator Type Per Endpoint (Maintainability)
- Keep paginationInformation Customizations Minimal (Maintainability)
### Related Skills (from 06 skills)
- [Resource Collections](../resource-collections/06-skills.md)
- [Top-Level Meta Data](../top-level-meta-data/06-skills.md)
- [Data Wrapping](../data-wrapping/06-skills.md)

