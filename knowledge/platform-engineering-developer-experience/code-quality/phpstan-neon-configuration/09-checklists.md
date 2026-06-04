# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-quality-static-analysis
**Knowledge Unit:** phpstan-neon-configuration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Base config includes Larastan extension
- [ ] Baseline is a separate file included via `includes`
- [ ] Paths use `%rootDir%` or `%currentWorkingDirectory%` for portability
- [ ] Custom rules tagged with `phpstan.rules.rule`
- [ ] CI config includes same rules as local
- [ ] Local overrides file is in `.gitignore`
- [ ] Ignored errors have path constraints
- [ ] Performance: - Config parsing: <10ms for typical configs
- [ ] Performance: - Baseline file: 5000+ entries add 50-100ms parsing (one-time cost)
- [ ] Performance: - Service registration: 1ms per extension; fine up to ~100

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Single file for simple projects; includes hierarchy for complex ones
- [ ] Architecture guideline: - Baseline as separate file managed by `--generate-baseline`
- [ ] Architecture guideline: - Local overrides in `.gitignore`d `phpstan.local.neon`
- [ ] Architecture guideline: - CI config should include the same rules as local

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure PHPStan NEON Files

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Config parsing: <10ms for typical configs
- [ ] - Baseline file: 5000+ entries add 50-100ms parsing (one-time cost)
- [ ] - Service registration: 1ms per extension; fine up to ~100

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
- [ ] Base config includes Larastan extension
- [ ] Baseline is a separate file included via `includes`
- [ ] Paths use `%rootDir%` or `%currentWorkingDirectory%` for portability
- [ ] Custom rules tagged with `phpstan.rules.rule`
- [ ] CI config includes same rules as local
- [ ] Local overrides file is in `.gitignore`
- [ ] Ignored errors have path constraints

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
- Configure PHPStan NEON Files
### Anti-Patterns (from 08)
- Pattern Without Enforcement
- Inconsistent Application
- Missing Documentation
### Related Rules (from 06 skills)
- NEON-RULE-001: Use separate baseline file
- NEON-RULE-002: Layered config
- NEON-RULE-003: Portable paths
- NEON-RULE-004: Tag custom rules properly
- NEON-RULE-005: Separate baseline file
### Related Skills (from 06 skills)
- Configure PHPStan for Laravel
- Generate and Manage PHPStan Baseline
- Set Up Laravel PHPStan with Larastan

