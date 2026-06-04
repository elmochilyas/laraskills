# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** View Composers and Creators
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Centralize All Composer Registration in a Dedicated ViewServiceProvider
- [ ] Enforce: Cache Expensive Queries in Wildcard Composers
- [ ] Enforce: Prefer Class-Based Composers Over Closures
- [ ] Enforce: Avoid Wildcard Composers for Global Data That Most Views Do Not Use
- [ ] Enforce: Prevent Silent Data Override Between Composers and Controllers
- [ ] Enforce: Use Creators Only for Truly Static Configuration Data
- [ ] Enforce: Test Composer-Provided Data in View Tests
- [ ] Composer registration is centralized in a dedicated ViewServiceProvider
- [ ] Wildcard composers cache expensive queries or use only request-scoped data
- [ ] No composer data variable name conflicts with controller-passed variables (prefixed names used)
- [ ] Composer-provided variables are documented in the template or a central reference
- [ ] Class-based composers use constructor injection instead of `app()` in closures
- [ ] Creators are used only for truly static configuration data (not auth-dependent data)
- [ ] View tests include composer data setup or test composer class in isolation

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Dedicated ViewServiceProvider
- [ ] Architecture guideline: class ViewServiceProvider extends ServiceProvider
- [ ] Architecture guideline: public function boot(): void
- [ ] Architecture guideline: View::composer('*', CurrentUserComposer::class);
- [ ] Architecture guideline: View::composer('layouts.sidebar', SidebarComposer::class);
- [ ] Architecture guideline: View::composer('layouts.navigation', NavigationComposer::class);
- [ ] Architecture guideline: View::creator('*', AppConfigCreator::class);
- [ ] Architecture guideline: Register in `config/app.php` providers array.
- [ ] Architecture guideline: ### Class-Based vs Closure
- [ ] Architecture guideline: ### Composer vs Controller Data
- [ ] Decision: View Composer vs Controller Data Delivery - ensure correct choice is made
- [ ] Decision: View Composer vs @inject - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Centralize All Composer Registration in a Dedicated ViewServiceProvider
- [ ] Apply rule: Cache Expensive Queries in Wildcard Composers
- [ ] Apply rule: Prefer Class-Based Composers Over Closures
- [ ] Apply rule: Avoid Wildcard Composers for Global Data That Most Views Do Not Use
- [ ] Apply rule: Prevent Silent Data Override Between Composers and Controllers
- [ ] Apply rule: Use Creators Only for Truly Static Configuration Data
- [ ] Apply rule: Test Composer-Provided Data in View Tests
- [ ] Skill applied: Implement View Composers for Shared Data

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
- [ ] Composer registration is centralized in a dedicated ViewServiceProvider
- [ ] Wildcard composers cache expensive queries or use only request-scoped data
- [ ] No composer data variable name conflicts with controller-passed variables (prefixed names used)
- [ ] Composer-provided variables are documented in the template or a central reference
- [ ] Class-based composers use constructor injection instead of `app()` in closures
- [ ] Creators are used only for truly static configuration data (not auth-dependent data)
- [ ] View tests include composer data setup or test composer class in isolation

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Uncached Database Queries in Wildcard Composers -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Silent Data Override Between Composer and Controller -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Creators for Request-Scoped Data -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Wildcard Composer for Data Most Views Don't Use -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Closure-Based Composers in Service Provider -- apply preferred alternative
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
- Centralize All Composer Registration in a Dedicated ViewServiceProvider
- Cache Expensive Queries in Wildcard Composers
- Prefer Class-Based Composers Over Closures
- Avoid Wildcard Composers for Global Data That Most Views Do Not Use
- Prevent Silent Data Override Between Composers and Controllers
- Use Creators Only for Truly Static Configuration Data
- Test Composer-Provided Data in View Tests
### Skills (from 06)
- Implement View Composers for Shared Data
### Decision Trees (from 07)
- View Composer vs Controller Data Delivery
- View Composer vs @inject
- Wildcard vs Scoped Composer Registration
### Anti-Patterns (from 08)
- Uncached Database Queries in Wildcard Composers
- Silent Data Override Between Composer and Controller
- Creators for Request-Scoped Data
- Wildcard Composer for Data Most Views Don't Use
- Closure-Based Composers in Service Provider
### Related Rules (from 06 skills)
- view-composers-creators/05-rules.md: Centralize All Composer Registration in a Dedicated ViewServiceProvider
- view-composers-creators/05-rules.md: Cache Expensive Queries in Wildcard Composers
- view-composers-creators/05-rules.md: Prefer Class-Based Composers Over Closures
- view-composers-creators/05-rules.md: Avoid Wildcard Composers for Global Data That Most Views Do Not Use
- view-composers-creators/05-rules.md: Prevent Silent Data Override Between Composers and Controllers
- view-composers-creators/05-rules.md: Use Creators Only for Truly Static Configuration Data
- view-composers-creators/05-rules.md: Test Composer-Provided Data in View Tests
### Related Skills (from 06 skills)
- Service Injection: Use @inject for Non-Entity Read-Only Services
- View Models and Presenters: Implement View Models for Complex Template Data
- Component System: Create and Use Blade Components
- Layout Strategies: Implement Multi-Layout Strategy

