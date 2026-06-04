# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-generation-scaffolding
**Knowledge Unit:** laravel-starter-kits
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Starter kit selected based on project requirements
- [ ] Stack matches team skills
- [ ] Prototype path documented (Breeze â†’ Jetstream if needed)
- [ ] No starter kit for API-only projects
- [ ] Fortify considered for heavy custom auth
- [ ] Performance: - Breeze adds ~20 files; Jetstream adds ~80+ files to a fresh installation
- [ ] Performance: - NPM deps: Breeze ~300 packages; Jetstream ~400 â€” affects install and CI time
- [ ] Performance: - Livewire components add round-trip overhead for interactivity

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Start with Breeze for prototyping; upgrade to Jetstream if teams become necessary (documented m...
- [ ] Architecture guideline: - Keep starter kit code in designated directories â€” your application code should be separate fr...
- [ ] Architecture guideline: - Replace generated code with application-specific implementations as the app evolves
- [ ] Architecture guideline: - Configure through config (Jetstream::teams(), Fortify::authenticateUsing()) rather than modifyi...
- [ ] Architecture guideline: - For heavy custom auth, use Fortify directly instead of Jetstream's UI layers

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Choose Laravel Starter Kit

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Breeze adds ~20 files; Jetstream adds ~80+ files to a fresh installation
- [ ] - NPM deps: Breeze ~300 packages; Jetstream ~400 â€” affects install and CI time
- [ ] - Livewire components add round-trip overhead for interactivity
- [ ] - Inertia serves all JS upfront â€” implement code splitting for large apps
- [ ] - Starter kit code doesn't affect runtime performance significantly once deployed

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Starter kits implement basic security (CSRF, auth middleware, form validation)
- [ ] - Production hardening needed: rate limiting, account lockout, HTTPS enforcement
- [ ] - Jetstream includes Sanctum for API auth â€” configure token expiry appropriately
- [ ] - Team data isolation must be enforced at the query level (not automatic)
- [ ] - Enable MustVerifyEmail for production applications

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
- [ ] Starter kit selected based on project requirements
- [ ] Stack matches team skills
- [ ] Prototype path documented (Breeze â†’ Jetstream if needed)
- [ ] No starter kit for API-only projects
- [ ] Fortify considered for heavy custom auth

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Starter Kit as Application Framework -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring Upgrade Compatibility -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No Customization Boundary -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Stack Regret -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Kit for Everything -- apply preferred alternative
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
- Choose Laravel Starter Kit
### Anti-Patterns (from 08)
- Starter Kit as Application Framework
- Ignoring Upgrade Compatibility
- No Customization Boundary
- Stack Regret
- Kit for Everything
### Related Rules (from 06 skills)
- KIT-RULE-001: Choose kit based on needs
- KIT-RULE-002: Match stack to team skills
- KIT-RULE-005: Plan for customization
- KIT-RULE-006: Start with Breeze for prototyping
### Related Skills (from 06 skills)
- Scaffold Laravel Authentication with Breeze
- Scaffold Laravel with Jetstream
- Create New Laravel Projects with the Installer

