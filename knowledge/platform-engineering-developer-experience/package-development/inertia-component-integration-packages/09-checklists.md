# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development & Shared Libraries
**Knowledge Unit:** InertiaComponentIntegrationPackages
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Server-side routes, controllers, and data providers registered in service provider
- [ ] Client-side components publishable with tagged command
- [ ] Pre-built (compiled) components available for zero-config
- [ ] Source components (`.vue`/`.jsx`) available for customization
- [ ] Component props and API follow SemVer
- [ ] Both Vue and React tested if both supported
- [ ] Unnecessary files excluded from publishing
- [ ] Inertia version compatibility declared

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Pre-Built vs Source Components:** Ship both compiled and source components; pre-built for imm...
- [ ] Architecture guideline: - **Inertia Pages in Package Pattern:** Use `Inertia::render('PackageName::PageName')` where `Pac...
- [ ] Architecture guideline: - **Hybrid Inertia + Blade Pattern:** For packages supporting both frontends, check the applicati...
- [ ] Architecture guideline: - **Component Composition Pattern:** Provide base components (Table, Form, Modal) for composition...
- [ ] Architecture guideline: - **NPM Package Distribution:** For complex libraries, distribute client components as an npm pac...
- [ ] Architecture guideline: - **Server-Side Registration:** Register routes, controllers, and data providers in the Laravel s...
- [ ] Architecture guideline: - **Client-Side Publishing:** Publish Vue/React components to `resources/js/vendor/package-name/`...
- [ ] Decision: Pre-Built vs Source Components? - ensure correct choice is made
- [ ] Decision: Should You Also Support Blade? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Integrate Inertia Components in Laravel Packages

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
- [ ] Server-side routes, controllers, and data providers registered in service provider
- [ ] Client-side components publishable with tagged command
- [ ] Pre-built (compiled) components available for zero-config
- [ ] Source components (`.vue`/`.jsx`) available for customization
- [ ] Component props and API follow SemVer
- [ ] Both Vue and React tested if both supported
- [ ] Unnecessary files excluded from publishing

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Inertia-only without Blade fallback -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Locked-in full pages -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No pre-built option -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Coupled server-client versioning -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring npm ecosystem -- apply preferred alternative
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
- Integrate Inertia Components in Laravel Packages
### Decision Trees (from 07)
- Pre-Built vs Source Components?
- Should You Also Support Blade?
### Anti-Patterns (from 08)
- Inertia-only without Blade fallback
- Locked-in full pages
- No pre-built option
- Coupled server-client versioning
- Ignoring npm ecosystem
### Related Skills (from 06 skills)
- Publish Frontend Assets from Laravel Packages
- Register Blade Component Namespacing for Laravel Packages
- Set Up a Package Service Provider with Spatie Tools

