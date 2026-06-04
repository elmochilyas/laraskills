# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-generation-scaffolding
**Knowledge Unit:** laravel-installer
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Installer updated to latest version
- [ ] New project creates without errors
- [ ] Starter kit installed and configured (if selected)
- [ ] NPM dependencies installed and built (for non-API projects)
- [ ] Database connection configured in `.env`
- [ ] Git initialized (if selected)
- [ ] Custom template applied (if using `--using`)
- [ ] Performance: - Installation: 30-120 seconds total (Composer download is bottleneck)
- [ ] Performance: - Composer cache reduces `create-project` from 30-60s to 5-15s
- [ ] Performance: - NPM install for starter kits adds 20-60 seconds

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Install globally via Composer: `composer global require laravel/installer`
- [ ] Architecture guideline: - For API-only projects, use `--no-starterkit` for minimal installation
- [ ] Architecture guideline: - Custom templates on GitHub should follow Laravel skeleton structure
- [ ] Architecture guideline: - The installer creates fresh projects only â€” never run over existing codebases
- [ ] Architecture guideline: - For automated workflows, script the full `laravel new project --no-interaction` command

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create New Laravel Projects with the Installer

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Installation: 30-120 seconds total (Composer download is bottleneck)
- [ ] - Composer cache reduces `create-project` from 30-60s to 5-15s
- [ ] - NPM install for starter kits adds 20-60 seconds
- [ ] - Full Breeze/React installation: ~50-80MB; minimal: ~10MB

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - The installer requires network access for Composer and NPM â€” ensure secure connections
- [ ] - Custom templates (`--using`) should be audited for security before use
- [ ] - Verify PHP extension requirements are met before installation
- [ ] - The installer doesn't handle secrets â€” configure .env separately

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
- [ ] Installer updated to latest version
- [ ] New project creates without errors
- [ ] Starter kit installed and configured (if selected)
- [ ] NPM dependencies installed and built (for non-API projects)
- [ ] Database connection configured in `.env`
- [ ] Git initialized (if selected)
- [ ] Custom template applied (if using `--using`)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Installer on Existing Projects -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No Flags in Scripts -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Skipping Post-Creation Steps -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring PHP Extensions -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Outdated Installer -- apply preferred alternative
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
- Create New Laravel Projects with the Installer
### Anti-Patterns (from 08)
- Installer on Existing Projects
- No Flags in Scripts
- Skipping Post-Creation Steps
- Ignoring PHP Extensions
- Outdated Installer
### Related Rules (from 06 skills)
- INSTALL-RULE-001: Keep the installer updated
- INSTALL-RULE-002: Use `--no-interaction` in CI
- INSTALL-RULE-004: Use custom templates for teams
- INSTALL-RULE-005: Prefer SQLite for development
### Related Skills (from 06 skills)
- Scaffold Laravel Authentication with Breeze
- Scaffold Laravel with Jetstream
- Choose Laravel Starter Kit

