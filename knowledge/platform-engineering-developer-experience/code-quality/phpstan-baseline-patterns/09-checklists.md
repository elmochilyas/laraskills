# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-quality-static-analysis
**Knowledge Unit:** phpstan-baseline-patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Baseline generated at target analysis level
- [ ] Baseline included as separate file in `phpstan.neon`
- [ ] Baseline committed to version control
- [ ] CI fails when new errors exist beyond baseline
- [ ] Reduction targets set (10-15% per quarter)
- [ ] Baseline regenerated monthly to remove stale entries
- [ ] Level graduation plan documented
- [ ] Performance: - 10,000 baseline entries: ~100ms loading time (negligible)
- [ ] Performance: - Baseline file: 500KB-1MB for 10K entries â€” fast parsing
- [ ] Performance: - CI comparison: <1s overhead

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Commit baseline to version control (visible debt tracker)
- [ ] Architecture guideline: - Use separate file: `phpstan-baseline.neon` included from main config
- [ ] Architecture guideline: - Level graduation: level 2 â†’ fix â†’ level 4 â†’ fix â†’ level 6 â†’ fix â†’ level 9
- [ ] Architecture guideline: - Assign baseline ownership to specific team members
- [ ] Architecture guideline: - Dedicated cleanup PRs (not mixed with feature work)

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Generate and Manage PHPStan Baseline

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - 10,000 baseline entries: ~100ms loading time (negligible)
- [ ] - Baseline file: 500KB-1MB for 10K entries â€” fast parsing
- [ ] - CI comparison: <1s overhead

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
- [ ] Baseline generated at target analysis level
- [ ] Baseline included as separate file in `phpstan.neon`
- [ ] Baseline committed to version control
- [ ] CI fails when new errors exist beyond baseline
- [ ] Reduction targets set (10-15% per quarter)
- [ ] Baseline regenerated monthly to remove stale entries
- [ ] Level graduation plan documented

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Pattern Without Enforcement -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Inconsistent Application -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Missing Documentation -- apply preferred alternative
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
- Generate and Manage PHPStan Baseline
### Anti-Patterns (from 08)
- Pattern Without Enforcement
- Inconsistent Application
- Missing Documentation
### Related Rules (from 06 skills)
- BASELINE-RULE-001: Start comprehensive, reduce aggressively
- BASELINE-RULE-002: Set reduction targets
- BASELINE-RULE-003: Regenerate regularly
- BASELINE-RULE-004: Fail CI on new errors
- BASELINE-RULE-005: Baseline at strict level
### Related Skills (from 06 skills)
- Set Up Laravel PHPStan with Larastan
- Configure PHPStan for Laravel
- Integrate Static Analysis in CI

