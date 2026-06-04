# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-quality-static-analysis
**Knowledge Unit:** laravel-phpstan
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] PHPStan (Larastan) runs with level 6 without errors
- [ ] Facade calls (`Cache::get()`, `DB::table()`) analyzed correctly
- [ ] Eloquent model properties and relationships type-checked
- [ ] Generic collections used for type inference
- [ ] Baseline file committed for existing errors
- [ ] CI pipeline runs PHPStan and fails on new errors
- [ ] Memory limit configured (1024M)
- [ ] Performance: - Analysis time: medium app (500 files) 30-120s; large app (2000+ files) 5-15...
- [ ] Performance: - Memory: 256-512MB medium, 1-2GB large apps
- [ ] Performance: - Level impact: level 1 vs 6 difference is ~5-10% runtime

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - PHPStan configuration in `phpstan.neon` or `phpstan.neon.dist`
- [ ] Architecture guideline: - Exclude `vendor/`, `storage/`, `bootstrap/cache/` from analysis
- [ ] Architecture guideline: - Run PHPStan after Pint (style) but before PHPUnit (tests) in CI
- [ ] Architecture guideline: - Use `--generate-baseline` to create initial baseline for existing projects
- [ ] Architecture guideline: - Cache analysis results â€” configure `tmpDir` for persistent storage

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up Laravel PHPStan with Larastan

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Analysis time: medium app (500 files) 30-120s; large app (2000+ files) 5-15 min
- [ ] - Memory: 256-512MB medium, 1-2GB large apps
- [ ] - Level impact: level 1 vs 6 difference is ~5-10% runtime
- [ ] - Result cache: subsequent runs (no changes) are 10-50x faster

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - PHPStan can't analyze runtime-generated code or Blade templates
- [ ] - Dynamic method calls (`__call`, `__get`) may produce false negatives
- [ ] - Third-party packages without type stubs may have incomplete analysis

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
- [ ] PHPStan (Larastan) runs with level 6 without errors
- [ ] Facade calls (`Cache::get()`, `DB::table()`) analyzed correctly
- [ ] Eloquent model properties and relationships type-checked
- [ ] Generic collections used for type inference
- [ ] Baseline file committed for existing errors
- [ ] CI pipeline runs PHPStan and fails on new errors
- [ ] Memory limit configured (1024M)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Level 0 in Production -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Infinite Baseline -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring False Positives -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No PHPDoc on Models -- apply preferred alternative
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
- Set Up Laravel PHPStan with Larastan
### Anti-Patterns (from 08)
- Level 0 in Production
- Infinite Baseline
- Ignoring False Positives
- No PHPDoc on Models
### Related Rules (from 06 skills)
- PSR-RULE-001: Start at level 6
- PSR-RULE-002: Use baseline for existing code
- PSR-RULE-003: Add PHPDoc to models
- PSR-RULE-004: Use generic collections
- PSR-RULE-005: Run in CI with memory limit
### Related Skills (from 06 skills)
- Configure PHPStan for Laravel
- Generate PHPStan Baseline
- Integrate Static Analysis in CI

