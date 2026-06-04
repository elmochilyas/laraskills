# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** cli-tooling-artisan-extensions
**Knowledge Unit:** ploi-cli-forge-cli
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Target explicitly specified with `--site=<id>` for all operations
- [ ] API tokens stored in CI secrets, not in version control
- [ ] Deployment logs checked after trigger (confirm execution success)
- [ ] Retry logic implemented for network failures and rate limits
- [ ] `--wait` used for synchronous deploys in CI
- [ ] Deployment scripts tested on staging before production
- [ ] Rate limits respected with delays between bulk operations
- [ ] CI pipeline uses quality gate before triggering deploy
- [ ] `forge deploy` triggers via webhook for "deploy on git push" workflows
- [ ] Performance: - Each CLI command makes 1-3 API calls with 100-500ms latency each
- [ ] Performance: - List operations on many servers/sites may take 2-10 seconds
- [ ] Performance: - `forge deploy` without `--wait` returns immediately; with `--wait`, blocks ...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Integrate into CI pipelines: tests pass â†’ quality gate â†’ `forge deploy` for gated deployments
- [ ] Architecture guideline: - Use deployment scripts (configured in Forge UI) for build steps; CLI triggers the script execution
- [ ] Architecture guideline: - Environment management: pull `.env` with `forge site:env:get`, modify, push with `forge site:en...
- [ ] Architecture guideline: - For bulk operations, add delays between requests to avoid rate limiting (~60 req/min)
- [ ] Architecture guideline: - Use webhooks for "deploy on git push" workflows instead of polling CLI in CI

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Manage Servers and Deployments with Forge CLI / Ploi CLI

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Each CLI command makes 1-3 API calls with 100-500ms latency each
- [ ] - List operations on many servers/sites may take 2-10 seconds
- [ ] - `forge deploy` without `--wait` returns immediately; with `--wait`, blocks 30-120 seconds
- [ ] - Cached responses make subsequent list commands fast; first command after cache expiry is slower
- [ ] - Rate limit: ~60 requests/minute â€” batch operations need pacing

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - API tokens provide full access to server management capabilities â€” treat as sensitive credentials
- [ ] - Store tokens in CI secrets, environment variables, or encrypted config (never in VCS)
- [ ] - Mistargeting a production server from local CLI can cause unintended changes â€” always verify server ID
- [ ] - Webhooks for deployment should use secret tokens to prevent unauthorized triggers
- [ ] - Rotate API tokens periodically and on team member departure

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
- [ ] Target explicitly specified with `--site=<id>` for all operations
- [ ] API tokens stored in CI secrets, not in version control
- [ ] Deployment logs checked after trigger (confirm execution success)
- [ ] Retry logic implemented for network failures and rate limits
- [ ] `--wait` used for synchronous deploys in CI
- [ ] Deployment scripts tested on staging before production
- [ ] Rate limits respected with delays between bulk operations

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Manual Production Changes -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Shared API Tokens -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Deployment Bypass -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Config Drift -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Script Dependence -- apply preferred alternative
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
- Manage Servers and Deployments with Forge CLI / Ploi CLI
### Anti-Patterns (from 08)
- Manual Production Changes
- Shared API Tokens
- Deployment Bypass
- Config Drift
- Script Dependence
### Related Rules (from 06 skills)
- FORGECLI-RULE-001 through FORGECLI-RULE-012
### Related Skills (from 06 skills)
- Set Up Automated Deployment Pipelines
- Set Up GitHub Actions for Laravel
- Automate CLI Workflows
- Manage Environment Files

