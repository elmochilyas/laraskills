# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Custom Directives
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Use `Blade::if()` for Custom Conditionals, Not `Blade::directive()`
- [ ] Enforce: Prefix All Custom Directive Names
- [ ] Enforce: Keep Directive Logic Simple â€” No Business Logic
- [ ] Enforce: Register All Custom Directives in a Dedicated Service Provider
- [ ] Enforce: Run `php artisan view:clear` After Every Directive Change
- [ ] Enforce: Document Every Custom Directive
- [ ] Enforce: Do Not Create Directives for Reusable UI
- [ ] Custom `@directive` compiles to correct PHP in compiled view cache
- [ ] `Blade::if()` correctly handles `@name` / `@elsename` / `@endname`
- [ ] Expression parsing handles commas within quoted arguments and nested parentheses
- [ ] `php artisan view:clear` + re-render picks up directive changes
- [ ] No directive name conflicts with built-in Blade directives
- [ ] Directive registration is centralized in a dedicated service provider
- [ ] Each custom directive has documentation for parameters and behavior
- [ ] `Blade::if()` closures contain no side effects or expensive database queries

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Directive vs Helper Function
- [ ] Architecture guideline: Use directives for control flow. Use helpers for value transformation.
- [ ] Architecture guideline: ### Directive vs Component
- [ ] Architecture guideline: Use components for reusable UI, directives for reusable PHP logic in templates.
- [ ] Decision: Custom Directive vs Blade Component - ensure correct choice is made
- [ ] Decision: Custom Directive vs Helper Function - ensure correct choice is made
- [ ] Decision: Blade::if() vs Blade::directive() for Custom Conditionals - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Use `Blade::if()` for Custom Conditionals, Not `Blade::directive()`
- [ ] Apply rule: Prefix All Custom Directive Names
- [ ] Apply rule: Keep Directive Logic Simple â€” No Business Logic
- [ ] Apply rule: Register All Custom Directives in a Dedicated Service Provider
- [ ] Apply rule: Run `php artisan view:clear` After Every Directive Change
- [ ] Apply rule: Document Every Custom Directive
- [ ] Apply rule: Do Not Create Directives for Reusable UI
- [ ] Skill applied: Register Custom Blade Directives

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
- [ ] Custom `@directive` compiles to correct PHP in compiled view cache
- [ ] `Blade::if()` correctly handles `@name` / `@elsename` / `@endname`
- [ ] Expression parsing handles commas within quoted arguments and nested parentheses
- [ ] `php artisan view:clear` + re-render picks up directive changes
- [ ] No directive name conflicts with built-in Blade directives
- [ ] Directive registration is centralized in a dedicated service provider
- [ ] Each custom directive has documentation for parameters and behavior

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Business Logic in Directive Callbacks -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Unprefixed Directive Names -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: `Blade::directive()` for Conditionals -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Directive Returning HTML -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing `php artisan view:clear` After Directive Changes -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern

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
### Rules (from 05)
- Use `Blade::if()` for Custom Conditionals, Not `Blade::directive()`
- Prefix All Custom Directive Names
- Keep Directive Logic Simple â€” No Business Logic
- Register All Custom Directives in a Dedicated Service Provider
- Run `php artisan view:clear` After Every Directive Change
- Document Every Custom Directive
- Do Not Create Directives for Reusable UI
### Skills (from 06)
- Register Custom Blade Directives
### Decision Trees (from 07)
- Custom Directive vs Blade Component
- Custom Directive vs Helper Function
- Blade::if() vs Blade::directive() for Custom Conditionals
### Anti-Patterns (from 08)
- Business Logic in Directive Callbacks
- Unprefixed Directive Names
- `Blade::directive()` for Conditionals
- Directive Returning HTML
- Missing `php artisan view:clear` After Directive Changes
### Related Rules (from 06 skills)
- custom-directives/05-rules.md: Use `Blade::if()` for Custom Conditionals, Not `Blade::directive()`
- custom-directives/05-rules.md: Prefix All Custom Directive Names
- custom-directives/05-rules.md: Keep Directive Logic Simple â€” No Business Logic
- custom-directives/05-rules.md: Register All Custom Directives in a Dedicated Service Provider
- custom-directives/05-rules.md: Run `php artisan view:clear` After Every Directive Change
- custom-directives/05-rules.md: Document Every Custom Directive
- custom-directives/05-rules.md: Do Not Create Directives for Reusable UI
### Related Skills (from 06 skills)
- Component System: Create and Use Blade Components
- Blade Testing: Write Assertions for Blade View Rendering
- Service Injection: Use @inject for Non-Entity Read-Only Services
- Rendering Performance: Profile and Optimize Slow View Rendering

