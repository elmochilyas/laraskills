# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Test Data Management
**Knowledge Unit:** Declarative Factory Methods
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Name Methods to Describe What Is Created, Not How
- [ ] Apply rule: Use `createX()` for Persisted, `makeX()` for Non-Persisted
- [ ] Apply rule: Always Declare Return Types
- [ ] Apply rule: Limit Parameters to 1-3 Per Method
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Declarative methods use descriptive names (what, not how)
- [ ] `createX()` = persisted, `makeX()` = non-persisted convention is followed
- [ ] Return types are declared on all methods
- [ ] Multi-object methods return all created objects
- [ ] Methods are organized in domain-specific traits
- [ ] Avoid: Over-parameterization
- [ ] Avoid: Methods that create hidden global state
- [ ] Avoid: Not using return types

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Method location**: Traits in `Tests/Helpers/` for domain-specific methods. Base test class for application-wide helpers. Dedicated factory class for complex setups.
- **Naming conventions**: `createX()` (persisted), `makeX()` (non-persisted), `buildX()` (with specific state).
- **Return type conventions**: Single model for simple methods. Named arrays/destructuring for multi-object returns. Avoid >3-4 objects per method.
- **Method organization**: Group related methods in traits (`UserFactory.php`, `TeamFactory.php`, `PostFactory.php`).
- **Parameterization balance**: 2-3 key parameters. Beyond that, use `$overrides` array or split into multiple methods.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Name Methods to Describe What Is Created, Not How
- [ ] Follow rule: Use `createX()` for Persisted, `makeX()` for Non-Persisted
- [ ] Follow rule: Always Declare Return Types
- [ ] Follow rule: Limit Parameters to 1-3 Per Method
- [ ] Follow rule: Return All Created Objects from Multi-Object Methods
- [ ] Follow rule: Organize Methods in Domain-Specific Traits
- [ ] - [ ] Declarative methods use descriptive names (what, not how)
- [ ] - [ ] `createX()` = persisted, `makeX()` = non-persisted convention is followed
- [ ] - [ ] Return types are declared on all methods
- [ ] - [ ] Multi-object methods return all created objects

# Performance Checklist
- Declarative methods have no performance overhead beyond underlying factory calls.
- Chained creation methods may create more data than needed for a specific test. Be mindful of unnecessary data creation.
- Traits loaded per-test have minimal overhead (PHP class loading).
- Methods creating many related objects should accept count parameters to limit data creation.
- Database transactions (RefreshDatabase) roll back all created data automatically.

# Security Checklist
- **Method documentation**: Document what each method creates and what assumptions it makes. Hidden behavior can lead to test false positives.
- **Naming consistency**: Ensure method names accurately describe what's created. A method named `createUser()` should not also create teams or posts without indicating so.

# Reliability Checklist
- [ ] Ensure: Declarative factory methods are custom helper methods that encapsulate complex o...
- [ ] Verify: Name Methods to Describe What Is Created, Not How
- [ ] Verify: Use `createX()` for Persisted, `makeX()` for Non-Persisted
- [ ] Verify: Always Declare Return Types
- [ ] Verify: Limit Parameters to 1-3 Per Method

# Testing Checklist
- [ ] Declarative methods use descriptive names (what, not how)
- [ ] `createX()` = persisted, `makeX()` = non-persisted convention is followed
- [ ] Return types are declared on all methods
- [ ] Multi-object methods return all created objects
- [ ] Methods are organized in domain-specific traits
- [ ] Parameters are limited to 1-3 per method
- [ ] Avoid: Over-parameterization
- [ ] Avoid: Methods that create hidden global state
- [ ] Avoid: Not using return types

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Name Methods to Describe What Is Created, Not How
- [ ] Apply: Use `createX()` for Persisted, `makeX()` for Non-Persisted
- [ ] Apply: Always Declare Return Types
- [ ] Apply: Limit Parameters to 1-3 Per Method

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Over-parameterization
- [ ] Avoid mistake: Methods that create hidden global state
- [ ] Avoid mistake: Not using return types
- [ ] Avoid mistake: Too many tiny methods

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Name Methods to Describe What Is Created, Not How
- Use `createX()` for Persisted, `makeX()` for Non-Persisted
- Always Declare Return Types
- Limit Parameters to 1-3 Per Method
- Return All Created Objects from Multi-Object Methods
- Organize Methods in Domain-Specific Traits
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Create Declarative Factory Methods


