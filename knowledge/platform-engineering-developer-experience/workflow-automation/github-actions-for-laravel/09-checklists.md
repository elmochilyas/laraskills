# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Workflow Automation & CI/CD
**Knowledge Unit:** GithubActionsForLaravel
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Testing workflow runs Pint, PHPStan, and PHPUnit
- [ ] Composer dependencies cached (lock file hash key)
- [ ] MySQL/PostgreSQL service container with health checks
- [ ] Parallel jobs for style, analysis, and tests
- [ ] Deployment workflow gated on test success
- [ ] Secrets stored in GitHub Actions (not in workflow files)
- [ ] Branch protection requires CI checks

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Standard Laravel CI Pattern:** jobs with services (MySQL), actions/cache for vendor/, shivamm...
- [ ] Architecture guideline: - **Parallel Job Pattern:** Separate jobs for pint, phpstan, and tests running concurrently; each...
- [ ] Architecture guideline: - **Deployment Trigger Pattern:** Deploy only after all test jobs pass, on push to main branch (n...
- [ ] Architecture guideline: - **Scheduled Maintenance Pattern:** cron-scheduled workflows for health checks, data pruning, ca...
- [ ] Architecture guideline: - **Matrix Testing Pattern:** test against multiple PHP and Laravel version combinations; exclude...
- [ ] Architecture guideline: - **Runner Choice:** GitHub-hosted (ubuntu-latest) for standard projects; self-hosted for custom ...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure GitHub Actions for Laravel

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
- [ ] Testing workflow runs Pint, PHPStan, and PHPUnit
- [ ] Composer dependencies cached (lock file hash key)
- [ ] MySQL/PostgreSQL service container with health checks
- [ ] Parallel jobs for style, analysis, and tests
- [ ] Deployment workflow gated on test success
- [ ] Secrets stored in GitHub Actions (not in workflow files)
- [ ] Branch protection requires CI checks

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Monolithic workflow file -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Skipping parallelization -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring cache key strategy -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Deploying on PR events -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No environment-specific configuration -- apply preferred alternative
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
- Configure GitHub Actions for Laravel
### Anti-Patterns (from 08)
- Monolithic workflow file
- Skipping parallelization
- Ignoring cache key strategy
- Deploying on PR events
- No environment-specific configuration
### Related Rules (from 06 skills)
- GHA-RULE-001: Use dependency caching
- GHA-RULE-002: Health-check MySQL service containers
- GHA-RULE-003: Use parallel jobs
- GHA-RULE-004: Store secrets as GitHub Actions secrets
- GHA-RULE-005: Use matrix builds for packages
### Related Skills (from 06 skills)
- Set Up Automated Testing in CI
- Set Up Automated Deployment Pipelines
- Run PHPStan in CI

