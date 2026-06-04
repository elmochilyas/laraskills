# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-quality-static-analysis
**Knowledge Unit:** laravel-rector
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `rector.php` configured with appropriate sets and paths
- [ ] `--dry-run` reviewed before applying changes
- [ ] Test suite passes after Rector changes
- [ ] Incremental approach: one set at a time
- [ ] Vendor and generated files excluded
- [ ] Rector version pinned in `composer.json`
- [ ] Upgrade changes in feature branch, not main
- [ ] Performance: - Speed: ~50-100 files/second; medium app (500 files) 5-10s
- [ ] Performance: - Memory: large files (5000+ lines) spike to 100-200MB
- [ ] Performance: - Parallel processing: `--parallel` reduces time 2-4x on multi-core

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Configuration in `rector.php` at project root
- [ ] Architecture guideline: - Use `rectorphp/rector-laravel` for Laravel-specific rules
- [ ] Architecture guideline: - Schedule Rector as monthly CI task for continuous modernization
- [ ] Architecture guideline: - Run Rector before PHPStan â€” fixes deprecated patterns that PHPStan would flag
- [ ] Architecture guideline: - Use `--parallel` for large codebases to reduce analysis time

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Rector for Automated Laravel Refactoring

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Speed: ~50-100 files/second; medium app (500 files) 5-10s
- [ ] - Memory: large files (5000+ lines) spike to 100-200MB
- [ ] - Parallel processing: `--parallel` reduces time 2-4x on multi-core
- [ ] - Caching: processed file cache â€” clear with `clear-cache` after config changes

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Rector can modify any PHP file â€” always review changes in PR
- [ ] - Never run Rector on production servers
- [ ] - Lock versions to prevent surprise rule behavior changes
- [ ] - Rector changes may introduce security issues if rules are incorrect

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
- [ ] `rector.php` configured with appropriate sets and paths
- [ ] `--dry-run` reviewed before applying changes
- [ ] Test suite passes after Rector changes
- [ ] Incremental approach: one set at a time
- [ ] Vendor and generated files excluded
- [ ] Rector version pinned in `composer.json`
- [ ] Upgrade changes in feature branch, not main

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Rector as Black Box -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: One Giant PR -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No Testing After Rector -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Rector on Production -- apply preferred alternative
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
- Configure Rector for Automated Laravel Refactoring
### Anti-Patterns (from 08)
- Rector as Black Box
- One Giant PR
- No Testing After Rector
- Rector on Production
### Related Rules (from 06 skills)
- RECTOR-RULE-001: Always use --dry-run first
- RECTOR-RULE-002: Apply one rule set at a time
- RECTOR-RULE-003: Run tests after Rector
- RECTOR-RULE-004: Lock Rector version
- RECTOR-RULE-005: Exclude vendor
### Related Skills (from 06 skills)
- Apply Rector Rules for Laravel Upgrades
- Set Up Laravel PHPStan with Larastan
- Configure Laravel Pint for Code Style

