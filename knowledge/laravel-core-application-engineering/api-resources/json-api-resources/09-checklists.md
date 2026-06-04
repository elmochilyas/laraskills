# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** API Resources
**Knowledge Unit:** JSON:API Resources
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Always Return Closures from toRelationships
- [ ] Enforce: Validate Include Parameters Against a Whitelist
- [ ] Enforce: Ensure Every JSON:API Resource Has a Valid type and String id
- [ ] Enforce: Set application/vnd.api+json Content Type
- [ ] Enforce: Detect and Prevent Circular Includes
- [ ] Enforce: Map Include Parameters to Eager Loads in the Controller
- [ ] Enforce: Expose Resource Type via $type Property for Non-Eloquent Sources
- [ ] Enforce: Limit Include Depth and Count
- [ ] Enforce: Use JsonApiResource for JSON:API Compliance
- [ ] All JSON:API resources have explicit `$type` or valid table-derived type
- [ ] `toRelationships()` returns closures, not resolved values
- [ ] Include parameters are validated against a whitelist
- [ ] Circular includes are detected and prevented
- [ ] Responses use `application/vnd.api+json` content type
- [ ] IDs are strings in the response
- [ ] Sparse fieldsets correctly filter `toAttributes()` output
- [ ] Include depth is limited (max 3 levels)
- [ ] Include count is limited (max 5 relationships)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Map `include` parameters to eager loads in the controller, not the resource. The resource only ...
- [ ] Architecture guideline: - Set limits on include depth and count â€” a single request with `?include=posts.comments.author...
- [ ] Architecture guideline: - Detect and prevent circular includes (e.g., `PostResource` includes `user`, `UserResource` incl...
- [ ] Architecture guideline: - JSON:API error formatting (errors array) must be handled in the exception handler, not in resou...
- [ ] Architecture guideline: - Use `JsonApiResource` for new JSON:API projects on Laravel 11+; for older Laravel versions, use...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Always Return Closures from toRelationships
- [ ] Apply rule: Validate Include Parameters Against a Whitelist
- [ ] Apply rule: Ensure Every JSON:API Resource Has a Valid type and String id
- [ ] Apply rule: Set application/vnd.api+json Content Type
- [ ] Apply rule: Detect and Prevent Circular Includes
- [ ] Apply rule: Map Include Parameters to Eager Loads in the Controller
- [ ] Apply rule: Expose Resource Type via $type Property for Non-Eloquent Sources
- [ ] Apply rule: Limit Include Depth and Count
- [ ] Apply rule: Use JsonApiResource for JSON:API Compliance
- [ ] Skill applied: Build a JSON:API-Compliant Resource

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
- [ ] All JSON:API resources have explicit `$type` or valid table-derived type
- [ ] `toRelationships()` returns closures, not resolved values
- [ ] Include parameters are validated against a whitelist
- [ ] Circular includes are detected and prevented
- [ ] Responses use `application/vnd.api+json` content type
- [ ] IDs are strings in the response
- [ ] Sparse fieldsets correctly filter `toAttributes()` output

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Unvalidated `include` Parameters -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Eagerly Resolved Relationships in `toRelationships()` -- apply preferred alternative
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
- Always Return Closures from toRelationships
- Validate Include Parameters Against a Whitelist
- Ensure Every JSON:API Resource Has a Valid type and String id
- Set application/vnd.api+json Content Type
- Detect and Prevent Circular Includes
- Map Include Parameters to Eager Loads in the Controller
- Expose Resource Type via $type Property for Non-Eloquent Sources
- Limit Include Depth and Count
- Use JsonApiResource for JSON:API Compliance
### Skills (from 06)
- Build a JSON:API-Compliant Resource
### Anti-Patterns (from 08)
- Unvalidated `include` Parameters
- Eagerly Resolved Relationships in `toRelationships()`
### Related Rules (from 06 skills)
- Always Return Closures from toRelationships (Performance)
- Validate Include Parameters Against a Whitelist (Security)
- Ensure Every JSON:API Resource Has a Valid type and String id (Framework Usage)
- Set application/vnd.api+json Content Type (Framework Usage)
- Detect and Prevent Circular Includes (Reliability)
- Map Include Parameters to Eager Loads in the Controller (Architecture)
- Expose Resource Type via $type Property for Non-Eloquent Sources (Framework Usage)
- Limit Include Depth and Count (Scalability)
- Use JsonApiResource for JSON:API Compliance (Framework Usage)
### Related Skills (from 06 skills)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Conditional Relationships](../conditional-relationships/06-skills.md)
- [Sparse Fieldsets](../sparse-fieldsets/06-skills.md)
- [Data Wrapping](../data-wrapping/06-skills.md)

