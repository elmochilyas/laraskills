# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-quality-static-analysis
**Knowledge Unit:** pre-commit-hooks-code-quality
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `pre-commit` framework installed globally
- [ ] `.pre-commit-config.yaml` at repo root with ordered hooks
- [ ] Hooks run on staged files only for speed
- [ ] `pre-commit install` completes successfully
- [ ] `git commit` triggers hooks and fails on issues
- [ ] Hook versions pinned
- [ ] `--no-verify` documented for emergencies
- [ ] Performance: - Pint on staged files: <1s
- [ ] Performance: - PHPStan on staged files: 5-30s (vs 2-5min full)
- [ ] Performance: - Rector on staged files: 10-60s (vs 5-10min full)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - One `.pre-commit-config.yaml` at repo root
- [ ] Architecture guideline: - Separate CI from pre-commit â€” CI runs full analysis, hooks run incremental
- [ ] Architecture guideline: - Staged-only PHPStan: `phpstan analyse --memory-limit=1G app/` (not full codebase)
- [ ] Architecture guideline: - Allow `--no-verify` for emergency commits (document in team norms)

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up Pre-commit Hooks for Code Quality

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Pint on staged files: <1s
- [ ] - PHPStan on staged files: 5-30s (vs 2-5min full)
- [ ] - Rector on staged files: 10-60s (vs 5-10min full)
- [ ] - pre-commit framework overhead: 200ms per hook

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
- [ ] `pre-commit` framework installed globally
- [ ] `.pre-commit-config.yaml` at repo root with ordered hooks
- [ ] Hooks run on staged files only for speed
- [ ] `pre-commit install` completes successfully
- [ ] `git commit` triggers hooks and fails on issues
- [ ] Hook versions pinned
- [ ] `--no-verify` documented for emergencies

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
- Set Up Pre-commit Hooks for Code Quality
### Anti-Patterns (from 08)
- Pattern Without Enforcement
- Inconsistent Application
- Missing Documentation
### Related Rules (from 06 skills)
- PRECOMMIT-RULE-001: Order hooks wisely
- PRECOMMIT-RULE-002: Run on staged files only
- PRECOMMIT-RULE-003: Use repo hooks
- PRECOMMIT-RULE-004: Skip for WIP
- PRECOMMIT-RULE-005: Version lock hooks
### Related Skills (from 06 skills)
- Integrate Pint into CI
- Integrate Static Analysis in CI
- Configure Laravel Pint for Code Style
- Set Up Laravel PHPStan with Larastan

