# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-generation-scaffolding
**Knowledge Unit:** laravel-jetstream
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Jetstream installed with correct stack and team support
- [ ] Team creation, invitation, and member management work
- [ ] Two-factor authentication setup works (QR code + recovery codes)
- [ ] API token creation and management function
- [ ] Session management shows active sessions
- [ ] Team data isolation verified (cross-team access blocked)
- [ ] Rate limiting configured on auth endpoints
- [ ] `MustVerifyEmail` enabled for production
- [ ] Performance: - Livewire components compile on first render â€” enable route/config caching
- [ ] Performance: - Team membership queries should use eager loading to avoid N+1
- [ ] Performance: - TOTP verification adds ~10-50ms per request when 2FA is active

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Jetstream's action classes follow Laravel's action/service class pattern â€” mirror this in app...
- [ ] Architecture guideline: - Enforce team data isolation with middleware or global scopes on all team-scoped models
- [ ] Architecture guideline: - Customize through configuration (Jetstream::teams()) rather than modifying generated code
- [ ] Architecture guideline: - Extend generated code (add new features), don't modify it directly (prevents update conflicts)
- [ ] Architecture guideline: - For heavy custom auth flows, consider using Fortify directly instead of Jetstream's UI

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Scaffold Laravel with Jetstream

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Livewire components compile on first render â€” enable route/config caching
- [ ] - Team membership queries should use eager loading to avoid N+1
- [ ] - TOTP verification adds ~10-50ms per request when 2FA is active
- [ ] - Session listing queries the sessions table â€” paginate for large user bases
- [ ] - Jetstream adds ~80+ files to the project; this affects initial project size but not runtime

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Enforce team data isolation in all models â€” cross-team data access is a common vulnerability
- [ ] - Configure Sanctum token expiry (`config/sanctum.php`) based on security requirements
- [ ] - Enable `MustVerifyEmail` for production applications
- [ ] - Rate limit: login attempts, 2FA code verification, invitation sending
- [ ] - 2FA recovery codes should be saved by users; provide support recovery flow
- [ ] - API tokens stored in SPA client code can be extracted â€” use short-lived tokens and HTTPS-only cookies

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
- [ ] Jetstream installed with correct stack and team support
- [ ] Team creation, invitation, and member management work
- [ ] Two-factor authentication setup works (QR code + recovery codes)
- [ ] API token creation and management function
- [ ] Session management shows active sessions
- [ ] Team data isolation verified (cross-team access blocked)
- [ ] Rate limiting configured on auth endpoints

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Jetstream for Everything -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No Team Scoping -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Direct Database Manipulation -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Over-Customization -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring Upgrade Path -- apply preferred alternative
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
- Scaffold Laravel with Jetstream
### Anti-Patterns (from 08)
- Jetstream for Everything
- No Team Scoping
- Direct Database Manipulation
- Over-Customization
- Ignoring Upgrade Path
### Related Rules (from 06 skills)
- JET-RULE-001: Scope queries to teams
- JET-RULE-002: Use Jetstream's action classes
- JET-RULE-003: Configure Sanctum for SPAs
- JET-RULE-004: Rate limit auth endpoints
- JET-RULE-006: Test team isolation
### Related Skills (from 06 skills)
- Scaffold Laravel Authentication with Breeze
- Choose Laravel Starter Kit
- Create New Laravel Projects with the Installer

