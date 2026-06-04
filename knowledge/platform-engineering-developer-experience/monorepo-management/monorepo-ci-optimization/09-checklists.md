# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 03MonorepoManagement
**Knowledge Unit:** MonorepoCiOptimization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Change detection correctly identifies which packages changed in a PR
- [ ] Dependency graph resolution correctly identifies all affected packages (direct + transitive)
- [ ] Setup job outputs correct JSON matrix consumed by downstream test jobs
- [ ] Independent packages run in parallel; dependent packages wait correctly
- [ ] Composer cache key includes `composer.lock` hash for cache accuracy
- [ ] Nightly full suite is scheduled and runs all packages
- [ ] Shared infrastructure changes trigger appropriate test levels
- [ ] Main pipeline completes under 10 minutes

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Change Detection Implementation:** GitHub Actions: `dorny/paths-filter` or `tj-actions/change...
- [ ] Architecture guideline: - **Dependency Resolution:** Parse `composer.json` files across the monorepo to build the depende...
- [ ] Architecture guideline: - **Job Matrix Generation:** Setup job â†’ detect changes â†’ resolve deps â†’ generate JSON matr...
- [ ] Architecture guideline: - **Parallel Execution:** Independent packages run in parallel. Dependent packages wait for their...
- [ ] Architecture guideline: - **Test Levels:** Unit tests (all changed packages), integration tests (packages with infra chan...
- [ ] Architecture guideline: - **Merge Queue:** Use GitHub merge queues or GitLab merge trains to batch commits and run CI onc...
- [ ] Decision: Change-Aware CI vs Full Suite on Every Commit? - ensure correct choice is made
- [ ] Decision: Test Only Changed Packages or Include Dependents? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Optimize Monorepo CI Pipeline with Change-Aware Testing

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
- [ ] Change detection correctly identifies which packages changed in a PR
- [ ] Dependency graph resolution correctly identifies all affected packages (direct + transitive)
- [ ] Setup job outputs correct JSON matrix consumed by downstream test jobs
- [ ] Independent packages run in parallel; dependent packages wait correctly
- [ ] Composer cache key includes `composer.lock` hash for cache accuracy
- [ ] Nightly full suite is scheduled and runs all packages
- [ ] Shared infrastructure changes trigger appropriate test levels

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Full Suite on Every Commit -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The No-Cache Pipeline -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The False Negative Machine -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Hidden Failure -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Not Testing Dependent Packages
- [ ] Avoid mistake: Overly Aggressive Caching
- [ ] Avoid mistake: Ignoring Shared Infrastructure Changes
- [ ] Avoid mistake: Slow Package Holding Up Pipeline

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
- Optimize Monorepo CI Pipeline with Change-Aware Testing
### Decision Trees (from 07)
- Change-Aware CI vs Full Suite on Every Commit?
- Test Only Changed Packages or Include Dependents?
### Anti-Patterns (from 08)
- The Full Suite on Every Commit
- The No-Cache Pipeline
- The False Negative Machine
- The Hidden Failure
### Common Mistakes (from 04)
- Not Testing Dependent Packages
- Overly Aggressive Caching
- Ignoring Shared Infrastructure Changes
- Slow Package Holding Up Pipeline
### Related Rules (from 06 skills)
- CIRULE-001: Test changed packages AND their dependents
- CIRULE-002: Use CI setup job to generate test matrix
- CIRULE-003: Run full suite nightly
- CIRULE-004: Cache Composer dependencies per package
- CIRULE-005: Include shared infrastructure in change detection
### Related Skills (from 06 skills)
- Configure Monorepo Dependency Management
- Set Up Split Testing for Monorepo Packages
- Extract Shared Libraries from Monorepo

