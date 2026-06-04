# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-generation-scaffolding
**Knowledge Unit:** blueprint-yaml-dsl
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Models use singular names (`User`, `Post`, `Comment`)
- [ ] `id` columns not specified (Blueprint auto-generates)
- [ ] `timestamps` explicitly set to `false` only on models that genuinely don't need them
- [ ] Foreign keys follow convention for auto-detection (`user_id`)
- [ ] Explicit `relationships:` block for non-standard FK names
- [ ] YAML validated with `blueprint:validate`
- [ ] `draft.yaml` committed to version control
- [ ] Performance: - YAML parsing: <20ms for 20 models; 100-200ms for 50+ models
- [ ] Performance: - DSL parsing is a one-time cost per `blueprint:build` invocation
- [ ] Performance: - Performance impact of DSL complexity is negligible compared to generation I/O

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Start with models, then add controllers for models that need CRUD endpoints
- [ ] Architecture guideline: - Use `api: true` on controllers for API-only apps (excludes `create`/`edit` views)
- [ ] Architecture guideline: - Define utility/value objects as models without controller sections
- [ ] Architecture guideline: - Document custom DSL conventions or deviations in project README
- [ ] Architecture guideline: - The `draft.yaml` should be treated as source code â€” reviewed in PRs

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Write Blueprint YAML DSL Definitions

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - YAML parsing: <20ms for 20 models; 100-200ms for 50+ models
- [ ] - DSL parsing is a one-time cost per `blueprint:build` invocation
- [ ] - Performance impact of DSL complexity is negligible compared to generation I/O

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Validation rules defined in DSL translate to form request validation â€” review for injection protection
- [ ] - Authorization not enforced by DSL; add policies after generation
- [ ] - DSL doesn't handle sensitive data encryption â€” configure casts on generated models
- [ ] - Review generated mass assignment protection (`$fillable`/`$guarded`)

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
- [ ] Models use singular names (`User`, `Post`, `Comment`)
- [ ] `id` columns not specified (Blueprint auto-generates)
- [ ] `timestamps` explicitly set to `false` only on models that genuinely don't need them
- [ ] Foreign keys follow convention for auto-detection (`user_id`)
- [ ] Explicit `relationships:` block for non-standard FK names
- [ ] YAML validated with `blueprint:validate`
- [ ] `draft.yaml` committed to version control

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: DSL Complexity -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No Validation CI -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Inconsistent Column Naming -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Relationship Over-Inference -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Draft as Afterthought -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern

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
- Write Blueprint YAML DSL Definitions
### Anti-Patterns (from 08)
- DSL Complexity
- No Validation CI
- Inconsistent Column Naming
- Relationship Over-Inference
- Draft as Afterthought
### Related Rules (from 06 skills)
- BPYAML-RULE-001: Use explicit relationships for non-standard FKs
- BPYAML-RULE-002: Validate before building
- BPYAML-RULE-003: Keep models singular
- BPYAML-RULE-004: Don't specify `id`
- BPYAML-RULE-005: Use `timestamps: false` deliberately
### Related Skills (from 06 skills)
- Generate Laravel Code with Blueprint
- Customize Laravel Stubs
- Create Custom Artisan Make Commands

