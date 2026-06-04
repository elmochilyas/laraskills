# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Workflow Automation & CI/CD
**Knowledge Unit:** AutomatedDeploymentPipelines
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Quality gates run before deployment (tests, analysis, style, security)
- [ ] Migrations tested in staging before production
- [ ] All migrations have reversible `down()` methods
- [ ] Zero-downtime deployment configured (Envoyer/Vapor)
- [ ] Health check validates post-deployment application state
- [ ] Config/route/view cached during deployment
- [ ] Rollback plan documented and tested
- [ ] Staging auto-deploy + production manual approval

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Forge Deployment Pattern:** git pull â†’ composer install --no-dev â†’ artisan migrate --forc...
- [ ] Architecture guideline: - **Vapor Deployment Pattern:** `php artisan vapor deploy production` handles the full deployment...
- [ ] Architecture guideline: - **GitHub Actions + Forge Pattern:** CI passes â†’ curl Forge deploy webhook URL â†’ Forge runs ...
- [ ] Architecture guideline: - **Envoyer Zero-Downtime Pattern:** Clone to new directory â†’ composer install â†’ migrate â†’ ...
- [ ] Architecture guideline: - **CI Graceful Deploy Pattern:** artisan down â†’ deploy â†’ health check â†’ artisan up (on suc...
- [ ] Architecture guideline: - **Deployment Trigger:** Auto-deploy to staging (push to develop); manual approval gate for prod...
- [ ] Architecture guideline: - **Migration Order:** Run migrations before code switchover; test migration backward compatibili...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up Automated Deployment Pipelines for Laravel

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
- [ ] Quality gates run before deployment (tests, analysis, style, security)
- [ ] Migrations tested in staging before production
- [ ] All migrations have reversible `down()` methods
- [ ] Zero-downtime deployment configured (Envoyer/Vapor)
- [ ] Health check validates post-deployment application state
- [ ] Config/route/view cached during deployment
- [ ] Rollback plan documented and tested

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Friday deployments -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Automatic production deployment without staging verification -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No rollback procedure -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Manual deployment steps -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: One-click deploy that skips CI -- apply preferred alternative
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
- Set Up Automated Deployment Pipelines for Laravel
### Anti-Patterns (from 08)
- Friday deployments
- Automatic production deployment without staging verification
- No rollback procedure
- Manual deployment steps
- One-click deploy that skips CI
### Related Rules (from 06 skills)
- DEPLOY-RULE-001: Always run quality gates before deployment
- DEPLOY-RULE-002: Test migrations in staging before production
- DEPLOY-RULE-003: Make all migrations reversible
- DEPLOY-RULE-004: Use zero-downtime deployment
- DEPLOY-RULE-005: Include health check post-deployment
### Related Skills (from 06 skills)
- Generate Automated Changelogs
- Set Up Automated Testing in CI
- Configure Dependency Update Automation

