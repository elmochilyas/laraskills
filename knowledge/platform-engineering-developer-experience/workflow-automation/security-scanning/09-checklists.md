# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Workflow Automation & CI/CD
**Knowledge Unit:** SecurityScanning
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `composer audit` runs in CI and fails on known vulnerabilities
- [ ] Dependabot configured with security-only scope
- [ ] Secret scanning push protection enabled
- [ ] Severity thresholds configured
- [ ] Remediation SLAs defined and communicated
- [ ] Dev dependencies included in scanning
- [ ] `composer.lock` committed for accurate scanning

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Composer Audit in CI Pattern:** Run `composer audit` as a CI step; fails build if known vulne...
- [ ] Architecture guideline: - **NPM Audit in CI Pattern:** Run `npm audit --audit-level=high` to check NPM packages; fails on...
- [ ] Architecture guideline: - **SAST GitHub Action Pattern (TruffleHog/Gitleaks):** Scan repository (including git history) f...
- [ ] Architecture guideline: - **Dependabot Security-Only Pattern:** Configure daily scanning with security label; limited PR ...
- [ ] Architecture guideline: - **GitHub Security Advisory Webhook Pattern:** Notify team via Slack when new security advisorie...
- [ ] Architecture guideline: - **Laravel Security Check Custom Pattern:** Custom scripts checking for common Laravel security ...
- [ ] Architecture guideline: - **Dependency Scanning:** Use Dependabot (free, auto-PR) and Composer Audit (fast, CI-integrated)
- [ ] Architecture guideline: - **Secret Scanning:** Use GitHub secret scanning (free, push-level) for first line of defense

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Run Security Scanning in CI

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
- [ ] `composer audit` runs in CI and fails on known vulnerabilities
- [ ] Dependabot configured with security-only scope
- [ ] Secret scanning push protection enabled
- [ ] Severity thresholds configured
- [ ] Remediation SLAs defined and communicated
- [ ] Dev dependencies included in scanning
- [ ] `composer.lock` committed for accurate scanning

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Secret Scanning -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: GitHub Advisory Database -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Security Scanner as Automated Pen Tester -- apply preferred alternative
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
- Run Security Scanning in CI
### Anti-Patterns (from 08)
- Secret Scanning
- GitHub Advisory Database
- Security Scanner as Automated Pen Tester
### Related Rules (from 06 skills)
- SECSCAN-RULE-001: Use Composer Audit in CI
- SECSCAN-RULE-002: Enable GitHub secret scanning push protection
- SECSCAN-RULE-003: Use both Dependabot and Composer Audit
- SECSCAN-RULE-004: Configure severity thresholds
- SECSCAN-RULE-005: Always commit composer.lock
### Related Skills (from 06 skills)
- Configure Dependency Update Automation
- Set Up Automated Testing in CI
- Set Up Automated Deployment Pipelines

