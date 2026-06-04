# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Service Container Basics
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Prefer Constructor Injection
- [ ] Verify: Bind Interfaces, Not Concrete Classes
- [ ] Verify: Use Singletons for Stateless Services
- [ ] Verify: Avoid app()->make() in Application Code
- [ ] Interfaces are bound to implementations (concrete classes auto-resolve â€” no redundant binding)
- [ ] Stateless services use `singleton()` or `scoped()` (not `bind()`)
- [ ] Contextual bindings are used when different consumers need different implementations
- [ ] All bindings are registered in service provider `register()` methods (not after boot)
- [ ] Value objects and DTOs are constructed with `new`, not resolved from the container
- [ ] No `app()->make()` calls exist in business logic classes (use constructor injection)
- [ ] No circular dependencies exist between constructor-injected classes
- [ ] Container is not referenced in serialized job payloads
- [ ] Performance: ### Reflection Cost
- [ ] Performance: Each resolution calls `ReflectionClass::getConstructor()` and recursively res...
- [ ] Performance: ### Singleton Performance

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Resolution Flow
- [ ] Architecture guideline: â†’ Check $instances (singleton cache)
- [ ] Architecture guideline: â†’ Check contextual bindings
- [ ] Architecture guideline: â†’ Check explicit bindings
- [ ] Architecture guideline: â†’ Check aliases
- [ ] Architecture guideline: â†’ Auto-resolution via build() + reflection
- [ ] Architecture guideline: ### Service Locator vs DI
- [ ] Architecture guideline: Constructor injection is preferred for mandatory dependencies. `resolve()` (via container) is acc...
- [ ] Architecture guideline: ### Container Data Structures
- [ ] Architecture guideline: - `$bindings` â€” abstract â†’ concrete + shared flag
- [ ] Architecture guideline: - `$instances` â€” resolved singletons
- [ ] Architecture guideline: - `$contextual` â€” [consumer => [abstract => concrete]]

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Prefer Constructor Injection
- [ ] Best practice: Bind Interfaces, Not Concrete Classes
- [ ] Best practice: Use Singletons for Stateless Services
- [ ] Best practice: Avoid app()->make() in Application Code
- [ ] Skill applied: Bind and Resolve Services in Container

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] ### Reflection Cost
- [ ] Each resolution calls `ReflectionClass::getConstructor()` and recursively resolves parameters. For a class with 5 dep...
- [ ] ### Singleton Performance
- [ ] `$instances` lookup is O(1). After first resolution, singletons cost nothing. This is why stateless services should b...
- [ ] ### Resolution Caching
- [ ] Non-singletons are NOT cached. Each `make()` repeats the full resolution. For hot-path code, resolve once and reuse t...
- [ ] ### Closure vs Class Bindings
- [ ] Closure bindings avoid reflection (invoked directly). Class-name bindings trigger `build()` with reflection. For simp...

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Container Injection
- [ ] Never inject untrusted user data through the container. The container resolves constructor dependencies; if a class a...
- [ ] ### Singleton Data Leakage
- [ ] Singleton services must be stateless. If a singleton captures per-request state, that state leaks across requests in ...
- [ ] ### Binding Override in Tests
- [ ] `$this->instance()` replaces bindings. Ensure test cleanup calls `forgetInstance()` to prevent binding pollution acro...

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
- [ ] Interfaces are bound to implementations (concrete classes auto-resolve â€” no redundant binding)
- [ ] Stateless services use `singleton()` or `scoped()` (not `bind()`)
- [ ] Contextual bindings are used when different consumers need different implementations
- [ ] All bindings are registered in service provider `register()` methods (not after boot)
- [ ] Value objects and DTOs are constructed with `new`, not resolved from the container
- [ ] No `app()->make()` calls exist in business logic classes (use constructor injection)
- [ ] No circular dependencies exist between constructor-injected classes

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Service Locator Abuse -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Binding Concrete-to-Concrete Redundantly -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Using `bind()` for Stateless Services -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Resolving Value Objects Through Container -- apply preferred alternative
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
- Bind and Resolve Services in Container
### Decision Trees (from 07)
- Binding Strategy (bind vs singleton vs scoped vs instance)
- Interface Binding vs Auto-Resolution
- Constructor Injection vs Service Locator
### Anti-Patterns (from 08)
- Service Locator Abuse
- Binding Concrete-to-Concrete Redundantly
- Using `bind()` for Stateless Services
- Resolving Value Objects Through Container
### Related Rules (from 06 skills)
- Bind Interfaces, Not Concrete Classes (05-rules.md)
- Use Constructor Injection Over Container Resolution in Application Code (05-rules.md)
- Use Singletons for Stateless Services (05-rules.md)
- Never Use Container Resolution for Value Objects or DTOs (05-rules.md)
- Clean Up Instance Bindings Between Tests (05-rules.md)
- Never Reference Container in Serialized Job Payloads (05-rules.md)
- Avoid Circular Dependencies Through Constructor Injection (05-rules.md)
### Related Skills (from 06 skills)
- Skill: Keep register() Thin with Container Bindings
- Skill: Choose Between Facades and Constructor Injection
- Skill: Use Helpers in Controllers and Views

