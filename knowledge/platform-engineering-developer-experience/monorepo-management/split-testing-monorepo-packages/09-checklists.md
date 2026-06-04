# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 03MonorepoManagement
**Knowledge Unit:** SplitTestingMonorepoPackages
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `monorepo-builder.php` correctly maps each package directory to its target repository
- [ ] Split CI workflow triggers only on tag pushes matching `*/v*`
- [ ] Split is gated on monorepo CI passing
- [ ] Target repositories have branch protection on `main`
- [ ] Split output validated: files exist, `composer.json` valid, autoloading works
- [ ] No direct commits allowed to split repositories
- [ ] Post-split CI in each target repository passes
- [ ] Split operations are logged with timestamps and results

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Split Configuration:** `monorepo-builder.php` (or `split-monorepo.php`) defines directory â†’...
- [ ] Architecture guideline: - **Tag Convention:** `{package-name}/{version}` (e.g., `laravel-api/1.2.0`) â€” standard in the ...
- [ ] Architecture guideline: - **Split Trigger:** Tag push to the monorepo. A CI workflow runs the split, pushing to all targe...
- [ ] Architecture guideline: - **Split Execution:** `vendor/bin/monorepo-split` iterates each mapping, performs `git subtree s...
- [ ] Architecture guideline: - **CI Chain:** Monorepo tag â†’ split â†’ split repo push â†’ split repo CI â†’ Packagist (or pr...
- [ ] Architecture guideline: - **History Preservation:** Use `git subtree split --rejoin` for squashed history that doesn't in...
- [ ] Architecture guideline: - **Fallback:** If split fails, the monorepo remains the authoritative source. Package consumers ...
- [ ] Decision: Split Testing vs Simple Tagging? - ensure correct choice is made
- [ ] Decision: Split on Tag vs Split on Every Push? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up Split Testing for Monorepo Packages

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
- [ ] `monorepo-builder.php` correctly maps each package directory to its target repository
- [ ] Split CI workflow triggers only on tag pushes matching `*/v*`
- [ ] Split is gated on monorepo CI passing
- [ ] Target repositories have branch protection on `main`
- [ ] Split output validated: files exist, `composer.json` valid, autoloading works
- [ ] No direct commits allowed to split repositories
- [ ] Post-split CI in each target repository passes

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Split-on-Push Pipeline -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Untested Split -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Snowflake Split Repo -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Manual Split Process -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Split-and-Forget -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Splitting on Every Commit
- [ ] Avoid mistake: No Split Validation
- [ ] Avoid mistake: Conflicting Tag Names
- [ ] Avoid mistake: Splitting Without CI Pass
- [ ] Avoid mistake: Manual Changes to Split Repos

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
- Set Up Split Testing for Monorepo Packages
### Decision Trees (from 07)
- Split Testing vs Simple Tagging?
- Split on Tag vs Split on Every Push?
### Anti-Patterns (from 08)
- The Split-on-Push Pipeline
- The Untested Split
- The Snowflake Split Repo
- The Manual Split Process
- The Split-and-Forget
### Common Mistakes (from 04)
- Splitting on Every Commit
- No Split Validation
- Conflicting Tag Names
- Splitting Without CI Pass
- Manual Changes to Split Repos
### Related Rules (from 06 skills)
- SPLIT-RULE-001: Split on tags, not commits
- SPLIT-RULE-002: Validate before splitting
- SPLIT-RULE-003: Protect split repository branches
- SPLIT-RULE-005: Validate split output
- SPLIT-RULE-011: Authentication with SSH key or token
### Related Skills (from 06 skills)
- Configure Laravel Monorepo Tools
- Optimize Monorepo CI Pipeline
- Configure Composer Path Repository Usage
- Publish Packages to Packagist

