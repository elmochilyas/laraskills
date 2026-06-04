# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 03MonorepoManagement
**Knowledge Unit:** DependencyManagementAcrossMonorepo
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Root `composer.json` has path repositories for all local packages
- [ ] All packages use identical version constraints for shared dependencies
- [ ] Root `composer.lock` is committed and not in `.gitignore`
- [ ] CI pipeline validates dependency consistency across all packages
- [ ] No circular dependencies exist between packages
- [ ] Automated dependency update tooling is configured (Renovate/Dependabot)
- [ ] `VERSIONS.md` documents approved PHP, Laravel, and library versions

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Root composer.json:** Requires all packages' dependencies at compatible versions. Uses `repla...
- [ ] Architecture guideline: - **Version Alignment:** Single version for framework/PHP. Per-package versions for minor librari...
- [ ] Architecture guideline: - **Dependency Update Process:** Automated PRs (Renovate/Dependabot) with monorepo-aware configur...
- [ ] Architecture guideline: - **Conflict Resolution:** When a dependency version conflict arises, upgrade all packages to a c...
- [ ] Architecture guideline: - **Lock File Strategy:** Single root `composer.lock` committed to version control. Per-package l...
- [ ] Architecture guideline: - **CI Validation:** Run `composer validate` and `composer install --locked` to ensure consistenc...
- [ ] Decision: Single Version Policy vs Per-Package Versions? - ensure correct choice is made
- [ ] Decision: Commit Root composer.lock or Not? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Monorepo Dependency Management

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
- [ ] Root `composer.json` has path repositories for all local packages
- [ ] All packages use identical version constraints for shared dependencies
- [ ] Root `composer.lock` is committed and not in `.gitignore`
- [ ] CI pipeline validates dependency consistency across all packages
- [ ] No circular dependencies exist between packages
- [ ] Automated dependency update tooling is configured (Renovate/Dependabot)
- [ ] `VERSIONS.md` documents approved PHP, Laravel, and library versions

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Version Free-for-All -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Frozen Lock File -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Ignored Conflict -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Manual Bump -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Inconsistent Dependency Versions
- [ ] Avoid mistake: Not Committing Root composer.lock
- [ ] Avoid mistake: Circular Inter-Package Dependencies
- [ ] Avoid mistake: Version Ranges Too Broad

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
- Configure Monorepo Dependency Management
### Decision Trees (from 07)
- Single Version Policy vs Per-Package Versions?
- Commit Root composer.lock or Not?
### Anti-Patterns (from 08)
- The Version Free-for-All
- The Frozen Lock File
- The Ignored Conflict
- The Manual Bump
### Common Mistakes (from 04)
- Inconsistent Dependency Versions
- Not Committing Root composer.lock
- Circular Inter-Package Dependencies
- Version Ranges Too Broad
### Related Rules (from 06 skills)
- DEP-RULE-001: Enforce single version policy
- DEP-RULE-002: Commit root composer.lock
- DEP-RULE-003: Automate version bumps across packages
- DEP-RULE-004: CI-validate dependency consistency
- DEP-RULE-005: Root composer.json with `replace` for local packages
### Related Skills (from 06 skills)
- Configure Path Repository Usage for Local Packages
- Optimize Monorepo CI Pipeline
- Extract Shared Libraries from Monorepo

