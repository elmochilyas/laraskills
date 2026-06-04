# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-quality-static-analysis
**Knowledge Unit:** pint-ci-integration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] CI workflow runs `pint --test` after dependency install
- [ ] Pint version pinned in `composer.json`
- [ ] Pint runs early â€” before PHPStan and PHPUnit
- [ ] Token cache configured for speed
- [ ] PR annotations visible (GitHub Actions format)
- [ ] CI exits with 0 on clean style, 1 on issues
- [ ] Auto-fix mode (if used) commits changes correctly
- [ ] Performance: - Full project scan: 3-8 seconds (500 files); dirty scan: 1-2 seconds
- [ ] Performance: - Caching reduces subsequent runs 50-80%; cache key should include OS/PHP/Pin...
- [ ] Performance: - `--format=github` adds ~0.5s for annotation processing

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Gate mode (--test) for strict teams; auto-fix mode for flexible teams
- [ ] Architecture guideline: - Early timing (before tests) provides fast feedback
- [ ] Architecture guideline: - Separate CI config vs local config not needed if pint.json is committed
- [ ] Architecture guideline: - For monorepos, run Pint per module with separate configs

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Integrate Pint into CI Pipeline

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Full project scan: 3-8 seconds (500 files); dirty scan: 1-2 seconds
- [ ] - Caching reduces subsequent runs 50-80%; cache key should include OS/PHP/Pint version
- [ ] - `--format=github` adds ~0.5s for annotation processing
- [ ] - Auto-fix commits double CI time (commit triggers re-run)

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Pint only modifies PHP files â€” no security implications
- [ ] - Ensure CI has proper Git configuration if using auto-fix + commit

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
- [ ] CI workflow runs `pint --test` after dependency install
- [ ] Pint version pinned in `composer.json`
- [ ] Pint runs early â€” before PHPStan and PHPUnit
- [ ] Token cache configured for speed
- [ ] PR annotations visible (GitHub Actions format)
- [ ] CI exits with 0 on clean style, 1 on issues
- [ ] Auto-fix mode (if used) commits changes correctly

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
- Integrate Pint into CI Pipeline
### Anti-Patterns (from 08)
- Pattern Without Enforcement
- Inconsistent Application
- Missing Documentation
### Related Rules (from 06 skills)
- PINT-CI-RULE-001: Run Pint early in CI
- PINT-CI-RULE-002: Pin Pint version
- PINT-CI-RULE-003: Use --format=github
- PINT-CI-RULE-004: Cache tokens
- PINT-CI-RULE-005: Auto-fix then test
### Related Skills (from 06 skills)
- Configure Laravel Pint for Code Style
- Configure Custom Pint Rules
- Set Up Pre-commit Hooks for Code Quality
- Integrate Static Analysis in CI

