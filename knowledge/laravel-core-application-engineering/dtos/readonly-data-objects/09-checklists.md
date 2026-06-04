# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** Readonly Data Objects
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Class declared as `readonly class` (PHP 8.2+) or `public readonly` on all promoted properties (PHP 8.1)
- [ ] All properties use constructor promotion â€” no manual declarations
- [ ] No setters or mutable methods exist
- [ ] No `__set()` or `__get()` magic methods
- [ ] "with" pattern methods exist for properties that need modified copies
- [ ] No `clone` + mutation patterns in the codebase
- [ ] `__serialize()`/`__unserialize()` implemented if used in cache/queue contexts
- [ ] PHPStan level 6+ passes â€” no uninitialized readonly properties
- [ ] No reflection-based readonly property assignment in production code

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Use `readonly class` (PHP 8.2+) as the default for all DTO definitions
- [ ] Architecture guideline: - Use constructor promotion exclusively â€” never manually assign promoted parameters
- [ ] Architecture guideline: - Avoid lazy initialization in DTOs; if needed, use a private non-readonly property with memoization
- [ ] Architecture guideline: - Never use reflection or `array_combine` to construct readonly DTOs â€” this bypasses type checking
- [ ] Architecture guideline: - Establish team convention: PHP 8.2 `readonly class` for new DTOs, individual `readonly` propert...
- [ ] Decision: Readonly Class vs Individual Readonly Properties - ensure correct choice is made
- [ ] Decision: With-Pattern vs Clone + Mutation for Modified Copies - ensure correct choice is made
- [ ] Decision: PHP Serialization vs JsonSerializable for Serialization - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Apply Readonly Enforcement to a DTO

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
- [ ] Class declared as `readonly class` (PHP 8.2+) or `public readonly` on all promoted properties (PHP 8.1)
- [ ] All properties use constructor promotion â€” no manual declarations
- [ ] No setters or mutable methods exist
- [ ] No `__set()` or `__get()` magic methods
- [ ] "with" pattern methods exist for properties that need modified copies
- [ ] No `clone` + mutation patterns in the codebase
- [ ] `__serialize()`/`__unserialize()` implemented if used in cache/queue contexts

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Non-Readonly DTO -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Manual Assignment DTO -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Clone-and-Mutate Pattern -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Lazy Initialization in Readonly DTOs -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Dynamic Construction via Spread or Reflection -- apply preferred alternative
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
- Apply Readonly Enforcement to a DTO
### Decision Trees (from 07)
- Readonly Class vs Individual Readonly Properties
- With-Pattern vs Clone + Mutation for Modified Copies
- PHP Serialization vs JsonSerializable for Serialization
### Anti-Patterns (from 08)
- The Non-Readonly DTO
- Manual Assignment DTO
- Clone-and-Mutate Pattern
- Lazy Initialization in Readonly DTOs
- Dynamic Construction via Spread or Reflection
### Related Rules (from 06 skills)
- Rule 1: Declare Every DTO as a `readonly class` (PHP 8.2+) or Use `public readonly` on All Properties (PHP 8.1)
- Rule 2: Always Use Constructor Promotion â€” Never Manually Assign Properties
- Rule 3: Use the "with" Pattern for Modified Copies Instead of Mutation
- Rule 4: Control Serialization via `__serialize()`/`__unserialize()` to Prevent Unserialize Bypass
- Rule 5: Never Add `__set` or `__get` Magic Methods to Readonly DTOs
- Rule 6: Run Static Analysis at PHPStan Level 6+ to Catch Uninitialized Readonly Properties
### Related Skills (from 06 skills)
- DTO Fundamentals: Implement Baseline DTO
- DTO Construction Patterns: Add Named Static Factories to a DTO

