# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-generation-scaffolding
**Knowledge Unit:** laravel-breeze
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Breeze installed with correct stack
- [ ] NPM dependencies installed and built
- [ ] Login, registration, password reset pages render correctly
- [ ] Dark mode working (if `--dark` flag used)
- [ ] Email verification flow works (if `MustVerifyEmail` enabled)
- [ ] Rate limiting configured on auth routes
- [ ] Session driver configured for production (Redis/Database)
- [ ] Performance: - Tailwind CSS compiled size: ~10-20KB in production after purge (from 2-4MB ...
- [ ] Performance: - Alpine.js adds ~10KB minified; Livewire ~50KB; React ~130KB
- [ ] Performance: - Vite HMR dev server consumes ~200-400MB RAM

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Install Breeze on fresh Laravel applications, never on existing apps with custom auth
- [ ] Architecture guideline: - Customize derived files (your own controllers/views), not Breeze's generated scaffolding
- [ ] Architecture guideline: - For multi-tenant apps, use Jetstream instead of Breeze for built-in team support
- [ ] Architecture guideline: - Configure session driver (Redis/Database) for production; Breeze defaults to file
- [ ] Architecture guideline: - Add password policies (history, complexity) for production security

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Scaffold Laravel Authentication with Breeze

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Tailwind CSS compiled size: ~10-20KB in production after purge (from 2-4MB unoptimized)
- [ ] - Alpine.js adds ~10KB minified; Livewire ~50KB; React ~130KB
- [ ] - Vite HMR dev server consumes ~200-400MB RAM
- [ ] - Inertia SPA loads all page components upfront â€” consider code splitting for large apps

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Add rate limiting on login/register routes (default Breeze doesn't include it)
- [ ] - Configure HTTPS enforcement and secure cookies in production
- [ ] - Breeze includes CSRF protection â€” verify it's active in production
- [ ] - Enable `MustVerifyEmail` on User model for email verification
- [ ] - Consider two-factor authentication (use Jetstream if needed)

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
- [ ] Breeze installed with correct stack
- [ ] NPM dependencies installed and built
- [ ] Login, registration, password reset pages render correctly
- [ ] Dark mode working (if `--dark` flag used)
- [ ] Email verification flow works (if `MustVerifyEmail` enabled)
- [ ] Rate limiting configured on auth routes
- [ ] Session driver configured for production (Redis/Database)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Breeze on Existing Apps -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Skipping Asset Compilation -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Over-Customization of Auth -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring Generated Tests -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Stack Regret -- apply preferred alternative
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
- Scaffold Laravel Authentication with Breeze
### Anti-Patterns (from 08)
- Breeze on Existing Apps
- Skipping Asset Compilation
- Over-Customization of Auth
- Ignoring Generated Tests
- Stack Regret
### Related Rules (from 06 skills)
- BREEZE-RULE-001: Choose stack based on team skills
- BREEZE-RULE-002: Use `--dark` during install
- BREEZE-RULE-003: Run `npm install && npm run build`
- BREEZE-RULE-004: Enable `MustVerifyEmail`
- BREEZE-RULE-005: Add rate limiting
### Related Skills (from 06 skills)
- Scaffold Laravel with Jetstream
- Choose Laravel Starter Kit
- Create Custom Artisan Make Commands

