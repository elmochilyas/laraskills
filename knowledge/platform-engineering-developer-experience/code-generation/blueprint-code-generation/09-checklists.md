# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-generation-scaffolding
**Knowledge Unit:** blueprint-code-generation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `draft.yaml` is version-controlled and reviewed in PRs
- [ ] `blueprint:validate` passes without errors
- [ ] Generated migrations have correct columns, types, and indexes
- [ ] Generated controllers have proper validation from draft rules
- [ ] Tests generated and pass
- [ ] Business logic added to service classes, not controllers
- [ ] Only needed components generated (use `--only` flag)
- [ ] Performance: - Generates a complete CRUD component in 1-3 seconds â€” much faster than ind...
- [ ] Performance: - YAML parsing: <10ms for typical files; 50-100ms for 50+ model files
- [ ] Performance: - Cached definitions speed up regeneration by 50-80%

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Keep `draft.yaml` at project root by convention; override with `--path`
- [ ] Architecture guideline: - Use resource controllers for web apps, API controllers for API-first apps
- [ ] Architecture guideline: - Let Blueprint generate form requests for validation by default
- [ ] Architecture guideline: - After generation, add custom business logic in service classes (generated controllers stay thin)
- [ ] Architecture guideline: - For complex multi-file patterns, combine Blueprint with custom generator commands

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Generate Laravel Code with Blueprint

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Generates a complete CRUD component in 1-3 seconds â€” much faster than individual `make:` commands
- [ ] - YAML parsing: <10ms for typical files; 50-100ms for 50+ model files
- [ ] - Cached definitions speed up regeneration by 50-80%
- [ ] - Generation time dominated by file I/O, not parsing

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Review generated form requests for proper authorization gates
- [ ] - Generated migrations should include appropriate indexes and foreign keys
- [ ] - Blueprint follows Laravel security conventions (CSRF, mass assignment protection)
- [ ] - Always review generated code for security-sensitive operations

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
- [ ] `draft.yaml` is version-controlled and reviewed in PRs
- [ ] `blueprint:validate` passes without errors
- [ ] Generated migrations have correct columns, types, and indexes
- [ ] Generated controllers have proper validation from draft rules
- [ ] Tests generated and pass
- [ ] Business logic added to service classes, not controllers
- [ ] Only needed components generated (use `--only` flag)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Complete Automation -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Draft as Documentation Only -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring Tests -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: One Giant Draft -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Forced Blueprint Fit -- apply preferred alternative
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
- Generate Laravel Code with Blueprint
### Anti-Patterns (from 08)
- Complete Automation
- Draft as Documentation Only
- Ignoring Tests
- One Giant Draft
- Forced Blueprint Fit
### Related Rules (from 06 skills)
- BPGEN-RULE-001: Version control the draft
- BPGEN-RULE-002: Review generated code
- BPGEN-RULE-003: Use `--only` flag
- BPGEN-RULE-005: Validate in CI
- BPGEN-RULE-009: Business logic in service classes
### Related Skills (from 06 skills)
- Write Blueprint YAML DSL
- Customize Laravel Stubs
- Create Custom Artisan Make Commands

