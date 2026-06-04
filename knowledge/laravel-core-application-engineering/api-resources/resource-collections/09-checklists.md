# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** API Resources
**Knowledge Unit:** Resource Collections
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Always Set $collects Explicitly on Custom Collections
- [ ] Enforce: Keep Pagination Logic in the Controller, Not the Collection
- [ ] Enforce: Paginate List Endpoints That Could Exceed 50 Items
- [ ] Enforce: Standardize the Collection Envelope via a Base Class
- [ ] Enforce: Use Anonymous Collections for Simple Endpoints
- [ ] Enforce: Only Preserve Collection Keys When Clients Rely on Them
- [ ] Enforce: Keep Collection Types Homogeneous
- [ ] Collection responses consistently include `data` key
- [ ] Paginated collections include `links` and `meta` with correct structure
- [ ] `$collects` is explicitly set on all custom resource collections
- [ ] Controller decides pagination parameters; collection only formats
- [ ] Relationships accessed in the collection's items are eager-loaded in the controller
- [ ] No sensitive data exposed in custom metadata fields

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Prefer `AnonymousResourceCollection` (`Resource::collection()`) for simple endpoints. Introduce...
- [ ] Architecture guideline: - Paginated collections execute two queries (count + data) via `LengthAwarePaginator` â€” this co...
- [ ] Architecture guideline: - For collections >1000 items, consider cursor pagination, chunked responses, or streaming JSON t...
- [ ] Architecture guideline: - Non-paginated collections return a bare array when unwrapped â€” always wrap to avoid breaking ...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Always Set $collects Explicitly on Custom Collections
- [ ] Apply rule: Keep Pagination Logic in the Controller, Not the Collection
- [ ] Apply rule: Paginate List Endpoints That Could Exceed 50 Items
- [ ] Apply rule: Standardize the Collection Envelope via a Base Class
- [ ] Apply rule: Use Anonymous Collections for Simple Endpoints
- [ ] Apply rule: Only Preserve Collection Keys When Clients Rely on Them
- [ ] Apply rule: Keep Collection Types Homogeneous
- [ ] Skill applied: Create a Resource Collection

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
- [ ] Collection responses consistently include `data` key
- [ ] Paginated collections include `links` and `meta` with correct structure
- [ ] `$collects` is explicitly set on all custom resource collections
- [ ] Controller decides pagination parameters; collection only formats
- [ ] Relationships accessed in the collection's items are eager-loaded in the controller
- [ ] No sensitive data exposed in custom metadata fields

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Collection-as-Controller -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Over-Customized Pagination Metadata -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing `$collects` Property -- apply preferred alternative
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
- Always Set $collects Explicitly on Custom Collections
- Keep Pagination Logic in the Controller, Not the Collection
- Paginate List Endpoints That Could Exceed 50 Items
- Standardize the Collection Envelope via a Base Class
- Use Anonymous Collections for Simple Endpoints
- Only Preserve Collection Keys When Clients Rely on Them
- Keep Collection Types Homogeneous
### Skills (from 06)
- Create a Resource Collection
### Anti-Patterns (from 08)
- Collection-as-Controller
- Over-Customized Pagination Metadata
- Missing `$collects` Property
### Related Rules (from 06 skills)
- Always Set $collects Explicitly on Custom Collections (Maintainability)
- Keep Pagination Logic in the Controller, Not the Collection (Architecture)
- Paginate List Endpoints That Could Exceed 50 Items (Performance)
- Standardize the Collection Envelope via a Base Class (Code Organization)
- Use Anonymous Collections for Simple Endpoints (Design)
- Only Preserve Collection Keys When Clients Rely on Them (Design)
- Keep Collection Types Homogeneous (Reliability)
### Related Skills (from 06 skills)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Pagination Metadata](../pagination-metadata/06-skills.md)
- [Data Wrapping](../data-wrapping/06-skills.md)
- [Conditional Relationships](../conditional-relationships/06-skills.md)

