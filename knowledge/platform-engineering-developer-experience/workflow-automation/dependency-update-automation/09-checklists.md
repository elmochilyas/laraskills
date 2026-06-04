# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Workflow Automation & CI/CD
**Knowledge Unit:** DependencyUpdateAutomation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Dependabot/Renovate configured for Composer and NPM
- [ ] Patch and minor updates grouped into single PRs
- [ ] Auto-merge enabled for patch+minor (CI must pass)
- [ ] Major updates require human review
- [ ] Security updates bypass regular schedule
- [ ] Test suite is reliable (no flaky tests)
- [ ] `composer.lock` committed
- [ ] Weekly schedule configured

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Dependabot Configuration Pattern:** .github/dependabot.yml with package-ecosystem (composer, ...
- [ ] Architecture guideline: - **Renovate Grouping Pattern:** Group laravel/* packages together, non-breaking updates together...
- [ ] Architecture guideline: - **CI Integration Pattern:** Full CI pipeline (tests, Pint, PHPStan) runs on every dependency up...
- [ ] Architecture guideline: - **Security Update Priority Pattern:** Security updates auto-merged (with CI passing) for prompt...
- [ ] Architecture guideline: - **Schedule Pattern:** Weekly for most projects (balance freshness vs noise); daily for security...
- [ ] Architecture guideline: - **Bot Tool:** Dependabot for simplicity; Renovate for advanced grouping, scheduling, auto-merge...
- [ ] Architecture guideline: - **Auto-merge Policy:** Patch and minor auto-merge; major requires human review
- [ ] Architecture guideline: - **Update Grouping:** Type-based: non-breaking in one PR, breaking in separate PRs

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Dependency Update Automation

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
- [ ] Dependabot/Renovate configured for Composer and NPM
- [ ] Patch and minor updates grouped into single PRs
- [ ] Auto-merge enabled for patch+minor (CI must pass)
- [ ] Major updates require human review
- [ ] Security updates bypass regular schedule
- [ ] Test suite is reliable (no flaky tests)
- [ ] `composer.lock` committed

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: No dependency automation -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Auto-merging everything -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Daily updates for all packages -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring Dependabot alerts -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No major update strategy -- apply preferred alternative
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
- Configure Dependency Update Automation
### Anti-Patterns (from 08)
- No dependency automation
- Auto-merging everything
- Daily updates for all packages
- Ignoring Dependabot alerts
- No major update strategy
### Related Rules (from 06 skills)
- DEPAUTO-RULE-001: Start with Dependabot for simplicity
- DEPAUTO-RULE-002: Use type-based grouping
- DEPAUTO-RULE-003: Auto-merge for patch and minor updates
- DEPAUTO-RULE-004: Security updates bypass regular schedule
- DEPAUTO-RULE-005: Ensure test suite is reliable before auto-merge
### Related Skills (from 06 skills)
- Set Up Automated Testing in CI
- Run Security Scanning in CI
- Generate Automated Changelogs

