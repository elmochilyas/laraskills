# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** API Resources
**Knowledge Unit:** Sparse Fieldsets
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Always Include Identifier Fields Regardless of Sparse Fieldset
- [ ] Enforce: Validate Requested Field Names Against an Allowed List
- [ ] Enforce: Each Resource Type Must Independently Filter Its Own Fields
- [ ] Enforce: Always Include Primary and Foreign Keys in Database Selection
- [ ] Enforce: Provide a Sensible Default Field Set
- [ ] Enforce: Never Use Sparse Fieldsets as Authorization
- [ ] Enforce: Normalize Field Set Keys for Caching
- [ ] Enforce: Document Available Fields Per Resource Type
- [ ] Enforce: Validate Before Passing to Database select()
- [ ] Sparse fieldsets are documented per resource type with available field names
- [ ] Requested fields are validated against an allowed list
- [ ] Identifier fields (`id`, `type`) are always included regardless of field selection
- [ ] Each resource type in compound responses independently supports sparse fieldsets
- [ ] Database-level selection includes primary and foreign keys for relationship integrity
- [ ] A reasonable default field set is provided when the client does not specify fields

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Field filtering happens at two levels: query (controller, database column selection) and respon...
- [ ] Architecture guideline: - `JsonApiResource` handles response-level filtering automatically. For `JsonResource`, implement...
- [ ] Architecture guideline: - Each resource type in a compound response (with includes) must independently support sparse fie...
- [ ] Architecture guideline: - Default field sets should be curated for the common client use case. When in doubt, include all...
- [ ] Architecture guideline: - Version the default field set â€” changing defaults can break clients that do not specify fields.

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Always Include Identifier Fields Regardless of Sparse Fieldset
- [ ] Apply rule: Validate Requested Field Names Against an Allowed List
- [ ] Apply rule: Each Resource Type Must Independently Filter Its Own Fields
- [ ] Apply rule: Always Include Primary and Foreign Keys in Database Selection
- [ ] Apply rule: Provide a Sensible Default Field Set
- [ ] Apply rule: Never Use Sparse Fieldsets as Authorization
- [ ] Apply rule: Normalize Field Set Keys for Caching
- [ ] Apply rule: Document Available Fields Per Resource Type
- [ ] Apply rule: Validate Before Passing to Database select()
- [ ] Skill applied: Implement Sparse Fieldsets for a Resource

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
- [ ] Sparse fieldsets are documented per resource type with available field names
- [ ] Requested fields are validated against an allowed list
- [ ] Identifier fields (`id`, `type`) are always included regardless of field selection
- [ ] Each resource type in compound responses independently supports sparse fieldsets
- [ ] Database-level selection includes primary and foreign keys for relationship integrity
- [ ] A reasonable default field set is provided when the client does not specify fields

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Sparse Fieldsets Without Requested Field Validation -- apply preferred alternative
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
- Always Include Identifier Fields Regardless of Sparse Fieldset
- Validate Requested Field Names Against an Allowed List
- Each Resource Type Must Independently Filter Its Own Fields
- Always Include Primary and Foreign Keys in Database Selection
- Provide a Sensible Default Field Set
- Never Use Sparse Fieldsets as Authorization
- Normalize Field Set Keys for Caching
- Document Available Fields Per Resource Type
- Validate Before Passing to Database select()
### Skills (from 06)
- Implement Sparse Fieldsets for a Resource
### Anti-Patterns (from 08)
- Sparse Fieldsets Without Requested Field Validation
### Related Rules (from 06 skills)
- Always Include Identifier Fields Regardless of Sparse Fieldset (Design)
- Validate Requested Field Names Against an Allowed List (Security)
- Each Resource Type Must Independently Filter Its Own Fields (Design)
- Always Include Primary and Foreign Keys in Database Selection (Performance)
- Provide a Sensible Default Field Set (Design)
- Never Use Sparse Fieldsets as Authorization (Security)
- Normalize Field Set Keys for Caching (Performance)
- Document Available Fields Per Resource Type (Maintainability)
- Validate Before Passing to Database select() (Security)
### Related Skills (from 06 skills)
- [JSON:API Resources](../json-api-resources/06-skills.md)
- [Conditional Attributes](../conditional-attributes/06-skills.md)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)

