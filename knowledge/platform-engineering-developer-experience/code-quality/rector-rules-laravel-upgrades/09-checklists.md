# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-quality-static-analysis
**Knowledge Unit:** rector-rules-laravel-upgrades
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Upgrade config created for specific target version
- [ ] `--dry-run` executed and reviewed before application
- [ ] Rules applied to `app/` only first
- [ ] Full test suite passes after upgrade changes
- [ ] One version set applied at a time (10â†’11, then 11â†’12)
- [ ] Upgrade config removed from project after completion
- [ ] Changes in feature branch, not main
- [ ] Performance: - 1000-file Laravel app: 2-5 min full scan; 30-60s for app/ only
- [ ] Performance: - Memory: 512MB-1GB for medium Laravel apps
- [ ] Performance: - Incremental: Rector caches processed files for ~30% faster re-runs

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - One-time config per upgrade, removed after completion
- [ ] Architecture guideline: - Process: dry-run â†’ review â†’ apply â†’ commit â†’ manual verification
- [ ] Architecture guideline: - Run upgrade rules in feature branch, not main
- [ ] Architecture guideline: - Apply style rules as separate step after upgrade changes

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Apply Rector Rules for Laravel Upgrades

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - 1000-file Laravel app: 2-5 min full scan; 30-60s for app/ only
- [ ] - Memory: 512MB-1GB for medium Laravel apps
- [ ] - Incremental: Rector caches processed files for ~30% faster re-runs

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
- [ ] Upgrade config created for specific target version
- [ ] `--dry-run` executed and reviewed before application
- [ ] Rules applied to `app/` only first
- [ ] Full test suite passes after upgrade changes
- [ ] One version set applied at a time (10â†’11, then 11â†’12)
- [ ] Upgrade config removed from project after completion
- [ ] Changes in feature branch, not main

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
- Apply Rector Rules for Laravel Upgrades
### Anti-Patterns (from 08)
- Pattern Without Enforcement
- Inconsistent Application
- Missing Documentation
### Related Rules (from 06 skills)
- UPGRADE-RULE-001: Run sets incrementally
- UPGRADE-RULE-002: Review every change
- UPGRADE-RULE-003: Version-specific config
- UPGRADE-RULE-004: Use --dry-run first
- UPGRADE-RULE-005: Apply to app/ only
### Related Skills (from 06 skills)
- Configure Rector for Automated Laravel Refactoring
- Set Up Laravel PHPStan with Larastan
- Configure Laravel Pint for Code Style

