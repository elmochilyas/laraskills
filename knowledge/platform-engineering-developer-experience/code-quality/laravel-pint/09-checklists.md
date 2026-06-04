# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-quality-static-analysis
**Knowledge Unit:** laravel-pint
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Pint installed and runs without errors
- [ ] Codebase formatted with `pint` in initial commit
- [ ] `pint.json` committed (if using custom config)
- [ ] `pint --test` passes with exit code 0
- [ ] Generated code excluded from formatting
- [ ] Pint version pinned in `composer.json`
- [ ] CI pipeline includes `pint --test`
- [ ] Performance: - Formatting speed: ~100-200 files/second; medium app (500 files) in 2-5 seconds
- [ ] Performance: - Memory: 50-100MB during formatting due to token-based parsing
- [ ] Performance: - CI impact: 3-10 seconds per run â€” acceptable for CI pipelines

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Exclude generated code: `bootstrap/cache`, `storage`, `vendor` (included by default)
- [ ] Architecture guideline: - Run Pint before PHPStan in CI (fix style first, then analyze)
- [ ] Architecture guideline: - For monorepos, use nested `pint.json` per package with appropriate presets
- [ ] Architecture guideline: - Lock Pint version in `composer.json` to prevent unexpected rule changes

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Laravel Pint for Code Style

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Formatting speed: ~100-200 files/second; medium app (500 files) in 2-5 seconds
- [ ] - Memory: 50-100MB during formatting due to token-based parsing
- [ ] - CI impact: 3-10 seconds per run â€” acceptable for CI pipelines

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Pint modifies PHP files â€” always review changes before committing
- [ ] - Generated PHP files (compiled views, cached configs) should be excluded
- [ ] - Formatting changes are cosmetic, not security-related

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
- [ ] Pint installed and runs without errors
- [ ] Codebase formatted with `pint` in initial commit
- [ ] `pint.json` committed (if using custom config)
- [ ] `pint --test` passes with exit code 0
- [ ] Generated code excluded from formatting
- [ ] Pint version pinned in `composer.json`
- [ ] CI pipeline includes `pint --test`

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Pint in Production -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No Configuration -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring Vendor Updates -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Blind Auto-Fix -- apply preferred alternative
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
- Configure Laravel Pint for Code Style
### Anti-Patterns (from 08)
- Pint in Production
- No Configuration
- Ignoring Vendor Updates
- Blind Auto-Fix
### Related Rules (from 06 skills)
- PINT-RULE-001: Use --test in CI
- PINT-RULE-002: Use --dirty locally
- PINT-RULE-003: Keep config minimal
- PINT-RULE-004: Commit pint.json
- PINT-RULE-005: Initial formatting commit
### Related Skills (from 06 skills)
- Configure Custom Pint Rules
- Select Appropriate Pint Preset
- Integrate Pint into CI

