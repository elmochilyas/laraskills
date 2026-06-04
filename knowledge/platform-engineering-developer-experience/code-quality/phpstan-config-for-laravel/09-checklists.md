# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-quality-static-analysis
**Knowledge Unit:** phpstan-config-for-laravel
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `phpstan.neon` includes Larastan extension
- [ ] Level set to 6 (or appropriate for project maturity)
- [ ] Vendor, storage, bootstrap/cache excluded
- [ ] Memory limit configured (1024M)
- [ ] Baseline file included as separate file
- [ ] CI config includes same rules as local
- [ ] Scan paths cover app/ and tests/ directories
- [ ] Performance: - Path exclusion reduces scan time proportionally
- [ ] Performance: - Memory limit: 1GB for medium apps, 2-4GB for large apps
- [ ] Performance: - Bootstrap files add 1-5s startup time â€” keep minimal

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Level 6 for new projects; level 9 for critical modules
- [ ] Architecture guideline: - Use includes hierarchy: base config â†’ CI config â†’ local overrides
- [ ] Architecture guideline: - Exclude test files from strict rules (or use per-directory level configs)
- [ ] Architecture guideline: - Register custom rules in services section with proper tags
- [ ] Architecture guideline: - Enable parallel processing for large codebases

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure PHPStan for Laravel

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Path exclusion reduces scan time proportionally
- [ ] - Memory limit: 1GB for medium apps, 2-4GB for large apps
- [ ] - Bootstrap files add 1-5s startup time â€” keep minimal
- [ ] - Parallel processing: 4 processes for typical CI runners

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
- [ ] `phpstan.neon` includes Larastan extension
- [ ] Level set to 6 (or appropriate for project maturity)
- [ ] Vendor, storage, bootstrap/cache excluded
- [ ] Memory limit configured (1024M)
- [ ] Baseline file included as separate file
- [ ] CI config includes same rules as local
- [ ] Scan paths cover app/ and tests/ directories

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
- Configure PHPStan for Laravel
### Anti-Patterns (from 08)
- Pattern Without Enforcement
- Inconsistent Application
- Missing Documentation
### Related Rules (from 06 skills)
- PSCONF-RULE-001: Minimum level 6
- PSCONF-RULE-002: Exclude vendor and storage
- PSCONF-RULE-003: Set explicit memory limit
- PSCONF-RULE-004: Use separate baseline file
- PSCONF-RULE-006: Separate CI config
### Related Skills (from 06 skills)
- Set Up Laravel PHPStan with Larastan
- Generate and Manage PHPStan Baseline
- Configure PHPStan NEON Files

