# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development & Shared Libraries
**Knowledge Unit:** ViewComponentRegistrationPackages
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `loadViewsFrom()` called with correct namespace prefix
- [ ] Class components registered via `Blade::component()` or `->hasViewComponent()`
- [ ] Namespace prefix unique, based on package name
- [ ] Class component `render()` returns valid view path within namespace
- [ ] User-provided data escaped with `{{ }}`
- [ ] Views publishable for themeable components
- [ ] `php artisan view:cache` succeeds without conflicts

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Prefix Convention Pattern:** Use the package name (without vendor prefix) as the component na...
- [ ] Architecture guideline: - **Class-Based Default Pattern:** Register the most common components as class-based (enables lo...
- [ ] Architecture guideline: - **Component Library Pattern:** Package provides a set of related components (button, card, moda...
- [ ] Architecture guideline: - **Override Pattern:** Allow consumers to override package views by publishing (`$this->publishe...
- [ ] Architecture guideline: - **Spatie Tools Pattern:** Use `->hasViews()` to register the view namespace and `->hasViewCompo...
- [ ] Architecture guideline: - **Unique Namespace Prefix:** Ensure the namespace prefix is unique to prevent collisions; two p...
- [ ] Architecture guideline: - **View Cache:** Run `php artisan view:cache` in deployment to compile all Blade templates (incl...
- [ ] Decision: Make Views Publishable or Keep in Vendor? - ensure correct choice is made
- [ ] Decision: One Namespace vs Sub-Namespaces? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Register View Components in Laravel Packages

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
- [ ] `loadViewsFrom()` called with correct namespace prefix
- [ ] Class components registered via `Blade::component()` or `->hasViewComponent()`
- [ ] Namespace prefix unique, based on package name
- [ ] Class component `render()` returns valid view path within namespace
- [ ] User-provided data escaped with `{{ }}`
- [ ] Views publishable for themeable components
- [ ] `php artisan view:cache` succeeds without conflicts

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Global component registration -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No view namespace registration for class components -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Overriding component classes -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Deep directory structure for anonymous components -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: One namespace for everything -- apply preferred alternative
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
- Register View Components in Laravel Packages
### Decision Trees (from 07)
- Make Views Publishable or Keep in Vendor?
- One Namespace vs Sub-Namespaces?
### Anti-Patterns (from 08)
- Global component registration
- No view namespace registration for class components
- Overriding component classes
- Deep directory structure for anonymous components
- One namespace for everything
### Related Skills (from 06 skills)
- Register Blade Component Namespacing for Laravel Packages
- Set Up a Package Service Provider with Spatie Tools
- Integrate Inertia Components in Laravel Packages

