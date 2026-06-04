# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** DTO Construction Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Each source type has a dedicated named factory method
- [ ] `fromRequest()` uses `$request->validated()` (not `$request->all()`)
- [ ] Factory methods use explicit key mapping (not spread operator) for production code
- [ ] `fromModel()` does not trigger lazy loading â€” relations are eager-loaded before call
- [ ] No service dependencies (DB, cache, API) in any factory method
- [ ] Missing keys are handled with explicit `?? null` defaults
- [ ] Factory methods have typed parameters and return types
- [ ] Collection factory maps an array of source items to an array of DTOs
- [ ] Each factory method has at least one passing test

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Prefer DTO-owned static factories for consistency across the codebase
- [ ] Architecture guideline: - Use FormRequest `payload()` when DTO construction depends on validated data format
- [ ] Architecture guideline: - Introduce separate Factory classes only when construction requires dependencies (database looku...
- [ ] Architecture guideline: - Always eager-load relations before passing models to `fromModel()` to prevent N+1
- [ ] Architecture guideline: - Use manual mapping over spread for production codebases â€” the safety is worth the verbosity
- [ ] Decision: Named Static Factories vs Generic `from()` Method - ensure correct choice is made
- [ ] Decision: Manual Mapping vs Spread Operator - ensure correct choice is made
- [ ] Decision: DTO-Owned vs FormRequest-Owned Factories - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Add Named Static Factories to a DTO

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
- [ ] Each source type has a dedicated named factory method
- [ ] `fromRequest()` uses `$request->validated()` (not `$request->all()`)
- [ ] Factory methods use explicit key mapping (not spread operator) for production code
- [ ] `fromModel()` does not trigger lazy loading â€” relations are eager-loaded before call
- [ ] No service dependencies (DB, cache, API) in any factory method
- [ ] Missing keys are handled with explicit `?? null` defaults
- [ ] Factory methods have typed parameters and return types

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Kitchen Sink Factory -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Magic Spread -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Constructing From Unvalidated Request Data -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Lazy Loading in fromModel Factories -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Factory in the Service -- apply preferred alternative
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
- Add Named Static Factories to a DTO
### Decision Trees (from 07)
- Named Static Factories vs Generic `from()` Method
- Manual Mapping vs Spread Operator
- DTO-Owned vs FormRequest-Owned Factories
### Anti-Patterns (from 08)
- The Kitchen Sink Factory
- The Magic Spread
- Constructing From Unvalidated Request Data
- Lazy Loading in fromModel Factories
- Factory in the Service
### Related Rules (from 06 skills)
- Rule 1: Use Named Static Factories for Each Source Type
- Rule 2: Always Construct DTOs from Validated Data â€” Never from `$request->all()`
- Rule 3: Use Manual Mapping Over Spread Operator in Production Factories
- Rule 4: Eager-Load Relations Before Passing Models to `fromModel()` Factories
- Rule 5: Keep Factory Methods Free of Service Dependencies
- Rule 6: Provide a Collection Factory for Batch Construction
### Related Skills (from 06 skills)
- DTO Fundamentals: Implement Baseline DTO
- DTO vs Form Request: Bridge FormRequest to DTO
- Nested DTOs: Construct and Serialize Nested DTO Trees

