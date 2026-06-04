# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Laravel Facade System
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Business logic classes (services, actions, domain) use constructor injection for all dependencies
- [ ] Controllers may use facades for framework services but not for application services
- [ ] No class mixes facades and injection for the same dependency category
- [ ] No facade calls exist in service provider `register()` methods
- [ ] No facade calls exist in class constructors
- [ ] Package code uses constructor injection, never facades
- [ ] Custom facades (if used) are registered in `config/app.php` `aliases` array
- [ ] `php artisan ide-helper:generate` has been run for facade autocompletion

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Facade vs Helper vs Injection
- [ ] Architecture guideline: ### Decision Framework
- [ ] Architecture guideline: Is this a well-known framework service (Cache, Log, Config, DB)?
- [ ] Architecture guideline: â”œâ”€â”€ Yes â†’ Is it used in a business logic class (Service, Action)?
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ Yes â†’ Use constructor injection
- [ ] Architecture guideline: â”‚   â””â”€â”€ No â†’ Facade is acceptable (controller, view, event)
- [ ] Architecture guideline: â””â”€â”€ No â†’ Is it an application service?
- [ ] Architecture guideline: â”œâ”€â”€ Yes â†’ Constructor injection
- [ ] Architecture guideline: â””â”€â”€ No â†’ Consider the tradeoff; prefer injection for testability
- [ ] Architecture guideline: ### Custom Facade Registration
- [ ] Architecture guideline: // app/Facades/Payment.php
- [ ] Architecture guideline: use Illuminate\Support\Facades\Facade;

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Choose Between Facades and Constructor Injection

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
- [ ] Business logic classes (services, actions, domain) use constructor injection for all dependencies
- [ ] Controllers may use facades for framework services but not for application services
- [ ] No class mixes facades and injection for the same dependency category
- [ ] No facade calls exist in service provider `register()` methods
- [ ] No facade calls exist in class constructors
- [ ] Package code uses constructor injection, never facades
- [ ] Custom facades (if used) are registered in `config/app.php` `aliases` array

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Hidden Dependencies via Facades in Business Logic Classes -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Facade Calls in Constructors -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Facades in Service Provider `register()` Methods -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Real-Time Facade Overuse -- apply preferred alternative
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
### Skills (from 06)
- Choose Between Facades and Constructor Injection
### Decision Trees (from 07)
- Facades vs Constructor Injection
- Facade vs Helper vs Injection Access Pattern
- Real-Time Facades Usage
### Anti-Patterns (from 08)
- Hidden Dependencies via Facades in Business Logic Classes
- Facade Calls in Constructors
- Facades in Service Provider `register()` Methods
- Real-Time Facade Overuse
### Related Rules (from 06 skills)
- Use Facades for Framework Services, Injection for Application Services (05-rules.md)
- Never Use Facades in Service Provider register() Methods (05-rules.md)
- Avoid Facade Calls in Class Constructors (05-rules.md)
- Reset Facade State Between Tests (05-rules.md)
- Use IDE Helper for Facade Autocompletion (05-rules.md)
- Never Use Facades in Package Code (05-rules.md)
- Avoid Mixed Access Patterns in the Same Class (05-rules.md)
### Related Skills (from 06 skills)
- Skill: Test Classes That Use Facades
- Skill: Use Helpers in Controllers and Views
- Skill: Bind and Resolve Services in Container

