# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** Spatie/laravel-data Integration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Data object extends `Spatie\LaravelData\Data`
- [ ] Validation rules are defined in one place only (FormRequest or Data object, not both)
- [ ] `Data::fromRequest()` is used over `Data::from($request->all())`
- [ ] `Data::fromRaw()` or `new Data(...)` is not used in production code
- [ ] Custom casters implement `Spatie\LaravelData\Casts\Cast`
- [ ] No business logic or persistence code in Data objects
- [ ] Nullable nested Data objects use `?` type hints
- [ ] Pipeline order is respected (authorization â†’ validation â†’ casting)
- [ ] TypeScript generation is configured in CI (if applicable)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Place Data objects in `app/Data/` with namespace `App\Data\` and suffix `Data` (e.g., `UserData`)
- [ ] Architecture guideline: - Use FormRequest for HTTP-specific concerns (authorization, input preparation); Data object for ...
- [ ] Architecture guideline: - Configure TypeScript generation in CI to prevent PHP/TypeScript type drift
- [ ] Architecture guideline: - Handle nullable nested Data properties explicitly with `?` type hints
- [ ] Architecture guideline: - Keep the default pipeline â€” custom pipes are rarely needed and can break the authorization â†...
- [ ] Decision: spatie/laravel-data vs Plain DTOs - ensure correct choice is made
- [ ] Decision: `Data::fromRequest()` vs `Data::from()` with Validated Data - ensure correct choice is made
- [ ] Decision: Validation in Data Object vs FormRequest - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Define a Data Object with Spatie/laravel-data

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
- [ ] Data object extends `Spatie\LaravelData\Data`
- [ ] Validation rules are defined in one place only (FormRequest or Data object, not both)
- [ ] `Data::fromRequest()` is used over `Data::from($request->all())`
- [ ] `Data::fromRaw()` or `new Data(...)` is not used in production code
- [ ] Custom casters implement `Spatie\LaravelData\Casts\Cast`
- [ ] No business logic or persistence code in Data objects
- [ ] Nullable nested Data objects use `?` type hints

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Mega Data Object -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Double Validation -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Pipeline Bypass -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Data Object as ORM Entity -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Framework Lock-In -- apply preferred alternative
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
- Define a Data Object with Spatie/laravel-data
### Decision Trees (from 07)
- spatie/laravel-data vs Plain DTOs
- `Data::fromRequest()` vs `Data::from()` with Validated Data
- Validation in Data Object vs FormRequest
### Anti-Patterns (from 08)
- The Mega Data Object
- The Double Validation
- The Pipeline Bypass
- Data Object as ORM Entity
- Framework Lock-In
### Related Rules (from 06 skills)
- Rule 1: Use `Data::fromRequest()` Over `Data::from($request->all())`
- Rule 2: Define Validation Rules in Exactly One Layer â€” Either FormRequest or Data Object, Never Both
- Rule 3: Never Add Business Logic or Persistence Code to Data Objects
- Rule 4: Respect the Pipeline Order â€” Never Add Custom Pipes That Violate Authorization â†’ Validation â†’ Casting
- Rule 5: Never Use `Data::fromRaw()` or `new Data(...)` in Production Code
- Rule 6: Configure TypeScript Generation in CI to Prevent PHP/TypeScript Type Drift
- Rule 7: Handle Nullable Nested Data Properties Explicitly with `?` Type Hints
### Related Skills (from 06 skills)
- DTO Fundamentals: Implement Baseline DTO
- Data Object Validation: Add Domain-Level Validation to a DTO
- Nested DTOs: Construct and Serialize Nested DTO Trees

