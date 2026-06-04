# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-generation-scaffolding
**Knowledge Unit:** laravel-shift
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] PHP upgraded to compatible version before Laravel Shift
- [ ] Shift run for one version at a time (incremental)
- [ ] Git diff reviewed: composer.json, config files, code changes
- [ ] Full test suite passes after Shift
- [ ] Third-party packages verified for compatibility
- [ ] Staging deployment tested with manual smoke tests
- [ ] Production deployment monitored (errors, performance)
- [ ] Performance: - Shift analysis: 1-10 minutes depending on codebase size
- [ ] Performance: - Test suite execution after Shift is the main time cost
- [ ] Performance: - Reviewing a Shift PR for major version: 2-8 hours

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Upgrade PHP version in a separate step before Laravel version upgrade
- [ ] Architecture guideline: - Keep a clean Git history â€” Shift's atomic commits document every upgrade change
- [ ] Architecture guideline: - Plan review time: 2-8 hours for medium-sized application per major version upgrade
- [ ] Architecture guideline: - Run Shift as scheduled CI task to detect deprecated usage proactively
- [ ] Architecture guideline: - Maintain upgrade compatibility matrix for third-party packages

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Upgrade Laravel Versions with Shift

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Shift analysis: 1-10 minutes depending on codebase size
- [ ] - Test suite execution after Shift is the main time cost
- [ ] - Reviewing a Shift PR for major version: 2-8 hours
- [ ] - Complex apps (500+ files) may require multiple Shift passes

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Shift requires repository access â€” use GitHub OAuth for convenience, self-hosted for compliance
- [ ] - Review all config changes for security implications
- [ ] - Check for removed or deprecated security features in the new version
- [ ] - Validate that authentication and authorization still work after upgrade
- [ ] - Ensure encryption, hashing, and security-related configuration migrated correctly

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
- [ ] PHP upgraded to compatible version before Laravel Shift
- [ ] Shift run for one version at a time (incremental)
- [ ] Git diff reviewed: composer.json, config files, code changes
- [ ] Full test suite passes after Shift
- [ ] Third-party packages verified for compatibility
- [ ] Staging deployment tested with manual smoke tests
- [ ] Production deployment monitored (errors, performance)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Shift as Black Box -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No Staging Test -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring Deprecation Warnings -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Skipping Dependency Audit -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Shift for Non-Laravel Code -- apply preferred alternative
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
- Upgrade Laravel Versions with Shift
### Anti-Patterns (from 08)
- Shift as Black Box
- No Staging Test
- Ignoring Deprecation Warnings
- Skipping Dependency Audit
- Shift for Non-Laravel Code
### Related Rules (from 06 skills)
- SHIFT-RULE-001: Upgrade incrementally
- SHIFT-RULE-002: Run tests after Shift
- SHIFT-RULE-003: Review config diffs carefully
- SHIFT-RULE-004: Check third-party packages
- SHIFT-RULE-006: Test on staging first
### Related Skills (from 06 skills)
- Apply Rector Rules for Laravel Upgrades
- Configure Rector for Automated Laravel Refactoring
- Set Up Laravel PHPStan with Larastan

