# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development & Shared Libraries
**Knowledge Unit:** PackageVersioningSemanticVersioning
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Version follows MAJOR.MINOR.PATCH format
- [ ] Breaking changes only in MAJOR versions
- [ ] New features backward-compatible in MINOR versions
- [ ] Bug fixes backward-compatible in PATCH versions
- [ ] Git tag created and pushed
- [ ] CHANGELOG.md updated with categorized changes
- [ ] Version constraint in composer.json updated if needed
- [ ] `@deprecated` annotations added for upcoming removals
- [ ] composer.lock committed for consistent dev environments
- [ ] Migration guide included for MAJOR releases

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Laravel Version Alignment:** When the package requires a specific Laravel major version, use ...
- [ ] Architecture guideline: - **Dependency Bumping Pattern:** When updating a dependency that changes its own MAJOR version, ...
- [ ] Architecture guideline: - **LTS Alignment Pattern:** Align version support with Laravel's LTS releases; tag LTS-compatibl...
- [ ] Architecture guideline: - **Changelog-Driven Versioning:** Update CHANGELOG.md before each release; version number emerge...
- [ ] Architecture guideline: - **Major Version Preparation:** Before releasing a MAJOR version: deprecate APIs in MINOR versio...
- [ ] Architecture guideline: - **Tag Convention:** Use `v` prefix for Git tags (e.g., `v1.2.3`); Composer strips the prefix an...
- [ ] Decision: What Version Bump Does This Change Warrant? - ensure correct choice is made
- [ ] Decision: Pre-1.0 vs 1.0+ Versioning? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Version a Laravel Package with Semantic Versioning
- [ ] Skill applied: Publish a Laravel Package to Private Packagist / Satis

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified in source files

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
- [ ] Version follows MAJOR.MINOR.PATCH format
- [ ] Breaking changes only in MAJOR versions
- [ ] New features backward-compatible in MINOR versions
- [ ] Bug fixes backward-compatible in PATCH versions
- [ ] Git tag created and pushed
- [ ] CHANGELOG.md updated with categorized changes
- [ ] Version constraint in composer.json updated if needed

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: SemVer as marketing -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Major version churn -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No version constraints -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Silent breaking changes -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Version tag drift -- apply preferred alternative
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
- Version a Laravel Package with Semantic Versioning
- Publish a Laravel Package to Private Packagist / Satis
### Decision Trees (from 07)
- What Version Bump Does This Change Warrant?
- Pre-1.0 vs 1.0+ Versioning?
### Anti-Patterns (from 08)
- SemVer as marketing
- Major version churn
- No version constraints
- Silent breaking changes
- Version tag drift
### Related Skills (from 06 skills)
- Publish a Laravel Package to Private Packagist / Satis
- Automate Dependency Updates with Dependabot / Renovate
- Manage Laravel Version Upgrades with Shift / Rector

