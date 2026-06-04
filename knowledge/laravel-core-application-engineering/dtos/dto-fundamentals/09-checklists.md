# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** DTO Fundamentals
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Class declared as `readonly class` (PHP 8.2+) or all properties `public readonly` (PHP 8.1)
- [ ] All properties use constructor promotion â€” no manual property declarations
- [ ] All properties have PHP native type hints
- [ ] `fromArray()` factory exists with explicit key mapping
- [ ] `toArray()` method exists with explicit output mapping
- [ ] No business logic methods (calculations, validation, persistence)
- [ ] No HTTP dependencies (no `Request` imports or type hints)
- [ ] No setters or mutable properties
- [ ] No default values that mask missing data â€” use nullable types
- [ ] DTO is in the correct directory per team organizational strategy

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Apply the 2-3 layer threshold: introduce a DTO when data crosses at least 2-3 application layers
- [ ] Architecture guideline: - Use per-operation DTOs (`CreateUserDto`, `UpdateProfileDto`) for larger codebases; per-entity D...
- [ ] Architecture guideline: - Never type-hint `Request` or contain `$request` properties in DTOs â€” this couples the service...
- [ ] Architecture guideline: - Use nullable typed properties (`?string`) for optional fields, not default values that mask mis...
- [ ] Architecture guideline: - Use named constructors (`fromRequest`, `fromModel`, `fromArray`) to document the source of data
- [ ] Architecture guideline: - Always validate input before DTO construction â€” DTOs assume valid data
- [ ] Decision: DTO vs Raw Array (2-3 Layer Threshold) - ensure correct choice is made
- [ ] Decision: Per-Entity vs Per-Operation DTO - ensure correct choice is made
- [ ] Decision: Class-Level Readonly vs Individual Readonly Properties - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement a Baseline DTO

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
- [ ] Class declared as `readonly class` (PHP 8.2+) or all properties `public readonly` (PHP 8.1)
- [ ] All properties use constructor promotion â€” no manual property declarations
- [ ] All properties have PHP native type hints
- [ ] `fromArray()` factory exists with explicit key mapping
- [ ] `toArray()` method exists with explicit output mapping
- [ ] No business logic methods (calculations, validation, persistence)
- [ ] No HTTP dependencies (no `Request` imports or type hints)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Mutable DTOs (Setters, Non-Readonly Properties) -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Business Logic in DTOs -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Balloon DTO -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Echo Chamber DTO -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Leaking HTTP Dependencies -- apply preferred alternative
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
- Implement a Baseline DTO
### Decision Trees (from 07)
- DTO vs Raw Array (2-3 Layer Threshold)
- Per-Entity vs Per-Operation DTO
- Class-Level Readonly vs Individual Readonly Properties
### Anti-Patterns (from 08)
- Mutable DTOs (Setters, Non-Readonly Properties)
- Business Logic in DTOs
- The Balloon DTO
- The Echo Chamber DTO
- Leaking HTTP Dependencies
### Related Rules (from 06 skills)
- Rule 1: Declare All DTOs as `readonly class`
- Rule 2: Apply the 2-3 Layer Threshold Before Introducing a DTO
- Rule 3: Never Include Business Logic Methods in DTOs
- Rule 4: Use Per-Operation DTOs for Larger Codebases
- Rule 5: Include `fromArray()` as the Minimal Factory on Every DTO
- Rule 6: Never Type-Hint `Request` or Contain HTTP Dependencies in DTOs
### Related Skills (from 06 skills)
- DTO Construction Patterns: Add Named Static Factories to a DTO
- Data Object Transformation: Implement and Test DTO Output Methods
- Readonly Data Objects: Apply Readonly Enforcement to a DTO

