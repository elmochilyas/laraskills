# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Service Injection
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Use `@inject` Only for Non-Entity, Read-Only Services
- [ ] Enforce: Register Injected Services as Singletons
- [ ] Enforce: Never Trigger Write Operations from Injected Services
- [ ] Enforce: Prefer View Composers Over `@inject` for Shared Data
- [ ] Enforce: Document All `@inject` Dependencies with Blade Comments
- [ ] Enforce: Do Not Use `@inject` Inside Component Views
- [ ] Injected service is registered as singleton in a service provider
- [ ] `@inject` variable name does not conflict with controller-passed variables
- [ ] Service methods called from view are read-only (no mutations)
- [ ] Template documents all injected dependencies with Blade comments
- [ ] No repositories or entity-related services are injected
- [ ] Service resolution does not trigger database queries in constructor
- [ ] Missing binding test exists for each `@inject` usage

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### @inject vs View Composer vs Controller Data
- [ ] Architecture guideline: ### Acceptable Use Cases
- [ ] Architecture guideline: - Global site settings
- [ ] Architecture guideline: - Navigation structure
- [ ] Architecture guideline: - Analytics/diagnostics
- [ ] Architecture guideline: - Feature flag evaluation
- [ ] Architecture guideline: ### Avoid Use Cases
- [ ] Architecture guideline: - Primary data (the resource being displayed)
- [ ] Architecture guideline: - User-specific data
- [ ] Architecture guideline: - Business logic
- [ ] Architecture guideline: - Write/mutation operations
- [ ] Decision: @inject vs Controller Data - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Use `@inject` Only for Non-Entity, Read-Only Services
- [ ] Apply rule: Register Injected Services as Singletons
- [ ] Apply rule: Never Trigger Write Operations from Injected Services
- [ ] Apply rule: Prefer View Composers Over `@inject` for Shared Data
- [ ] Apply rule: Document All `@inject` Dependencies with Blade Comments
- [ ] Apply rule: Do Not Use `@inject` Inside Component Views
- [ ] Skill applied: Use @inject for Non-Entity Read-Only Services

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
- [ ] Injected service is registered as singleton in a service provider
- [ ] `@inject` variable name does not conflict with controller-passed variables
- [ ] Service methods called from view are read-only (no mutations)
- [ ] Template documents all injected dependencies with Blade comments
- [ ] No repositories or entity-related services are injected
- [ ] Service resolution does not trigger database queries in constructor
- [ ] Missing binding test exists for each `@inject` usage

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Injecting Entity Repositories -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: @inject as Primary Data Delivery -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Write/Mutation Operations in @inject Calls -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing Singleton Registration -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: @inject Inside Component Views -- apply preferred alternative
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
- Use `@inject` Only for Non-Entity, Read-Only Services
- Register Injected Services as Singletons
- Never Trigger Write Operations from Injected Services
- Prefer View Composers Over `@inject` for Shared Data
- Document All `@inject` Dependencies with Blade Comments
- Do Not Use `@inject` Inside Component Views
### Skills (from 06)
- Use @inject for Non-Entity Read-Only Services
### Decision Trees (from 07)
- @inject vs Controller Data
- @inject vs View Composer
- @inject vs Component Constructor Injection
### Anti-Patterns (from 08)
- Injecting Entity Repositories
- @inject as Primary Data Delivery
- Write/Mutation Operations in @inject Calls
- Missing Singleton Registration
- @inject Inside Component Views
### Related Rules (from 06 skills)
- service-injection/05-rules.md: Use `@inject` Only for Non-Entity, Read-Only Services
- service-injection/05-rules.md: Register Injected Services as Singletons
- service-injection/05-rules.md: Never Trigger Write Operations from Injected Services
- service-injection/05-rules.md: Prefer View Composers Over `@inject` for Shared Data
- service-injection/05-rules.md: Document All `@inject` Dependencies with Blade Comments
- service-injection/05-rules.md: Do Not Use `@inject` Inside Component Views
### Related Skills (from 06 skills)
- View Composers and Creators: Implement View Composers for Shared Data
- Component System: Create and Use Blade Components
- View Models and Presenters: Implement View Models for Complex Template Data

