# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Parameterized Middleware
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Optional parameters have default values â€” no `TypeError` when parameter is omitted
- [ ] Parameters are validated at the start of `handle()` against a whitelist
- [ ] Invalid parameters throw `InvalidArgumentException` with a descriptive message
- [ ] Variadic parameters (`string ...$values`) used for multiple values of the same kind
- [ ] Parameter syntax documented in the class docblock
- [ ] No commas in individual parameter values (use semicolons as internal delimiter)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Parameter parsing:** Split on first colon only (`explode(':', $pipe, 2)`). Everything after i...
- [ ] Architecture guideline: - **Optional parameters:** `public function handle(Request $request, Closure $next, string $guard...
- [ ] Architecture guideline: - **Variadic parameters:** `public function handle(Request $request, Closure $next, string ...$gu...
- [ ] Architecture guideline: - **Route caching:** Parameters are serialized as part of the route configuration. `auth:sanctum`...
- [ ] Architecture guideline: - **Alias resolution:** Middleware aliases are resolved to FQCNs before parameter extraction. Par...
- [ ] Architecture guideline: - **Parameters vs separate classes:** Parameterized middleware is almost always the right choice ...
- [ ] Decision: Parameterized Middleware vs Separate Middleware Classes - ensure correct choice is made
- [ ] Decision: Static Colon-Delimited Parameters vs Named Limiters/Resolvers - ensure correct choice is made
- [ ] Decision: Optional Parameters with Default Values vs Required Parameters - ensure correct choice is made
- [ ] Decision: Variadic Parameters vs Fixed Parameters for Multiple Values - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Parameterized Middleware with Defaults and Validation
- [ ] Skill applied: Test Parameterized Middleware with All Parameter Variants

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
- [ ] Optional parameters have default values â€” no `TypeError` when parameter is omitted
- [ ] Parameters are validated at the start of `handle()` against a whitelist
- [ ] Invalid parameters throw `InvalidArgumentException` with a descriptive message
- [ ] Variadic parameters (`string ...$values`) used for multiple values of the same kind
- [ ] Parameter syntax documented in the class docblock
- [ ] No commas in individual parameter values (use semicolons as internal delimiter)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Missing Default Values for Optional Parameters -- apply preferred alternative
    - [ ] All parameterized middleware has default values for optional parameters
    - [ ] Middleware works when registered without the colon syntax
    - [ ] Fallback logic exists for the no-parameter case
- [ ] Prevent: Using Environment Variables in Route Definitions -- apply preferred alternative
    - [ ] No `${VARIABLE}` or `env()` in route middleware parameter strings
    - [ ] Config values are used instead of env values in route definitions
    - [ ] Named limiters are preferred for dynamic rate limits
- [ ] Prevent: Comma Delimiter Abuse in Parameter Values -- apply preferred alternative
    - [ ] No parameter values contain unescaped commas
    - [ ] Semicolons are used as internal delimiters for structured values
    - [ ] Middleware parameter count matches the `handle()` signature
- [ ] Prevent: Numeric Parameters for User-Tier-Based Limits -- apply preferred alternative
    - [ ] No numeric throttle parameters for user-dependent limits
    - [ ] Named limiters are used for tier-based rate limiting
    - [ ] Rate limit configuration is centralized in service providers
- [ ] Prevent: Route Parameter Mismatch with `can:` Middleware -- apply preferred alternative
    - [ ] All `can:` middleware second parameters match route parameter names
    - [ ] No `can:` middleware uses model class names as parameters
    - [ ] Renaming a route parameter also updates the `can:` middleware parameter

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
- Implement Parameterized Middleware with Defaults and Validation
- Test Parameterized Middleware with All Parameter Variants
### Decision Trees (from 07)
- Parameterized Middleware vs Separate Middleware Classes
- Static Colon-Delimited Parameters vs Named Limiters/Resolvers
- Optional Parameters with Default Values vs Required Parameters
- Variadic Parameters vs Fixed Parameters for Multiple Values
### Anti-Patterns (from 08)
- Missing Default Values for Optional Parameters
- Using Environment Variables in Route Definitions
- Comma Delimiter Abuse in Parameter Values
- Numeric Parameters for User-Tier-Based Limits
- Route Parameter Mismatch with `can:` Middleware
### Related Rules (from 06 skills)
- Always Provide Default Values for Optional Middleware Parameters (parameterized-middleware:5)
- Validate Middleware Parameters Early in handle() (parameterized-middleware:5)
- Use Named Limiters Instead of Numeric Parameters for Dynamic Rate Limits (parameterized-middleware:5)
- Avoid Commas in Parameter Values (parameterized-middleware:5)
- Use Variadic Parameters for Multiple Values Instead of Single Comma-Separated Parameters (parameterized-middleware:5)
### Related Skills (from 06 skills)
- Test Parameterized Middleware with All Parameter Variants
- Implement Custom Middleware with Single-Responsibility Pattern

