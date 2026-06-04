# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Form Request DTO Integration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] DTO built from `$request->validated()` â€” never `$request->all()`
- [ ] DTO properties are `public readonly` (immutable)
- [ ] DTO lives in domain/feature layer â€” not `App\Http`
- [ ] Service layer receives DTO, not FormRequest
- [ ] `fromRequest()` factory method provided on DTO
- [ ] `safe()->only()` used for scoped DTO construction when applicable
- [ ] Controller converts request to DTO before calling service
- [ ] Tests cover DTO construction from valid/invalid data

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - DTO construction from `$request->validated()` via constructor spread or named arguments
- [ ] Architecture guideline: - `safe()` returns `ValidatedInput` with `->only()` and `->except()` for scoped DTO creation
- [ ] Architecture guideline: - `validated()` excludes fields that failed or were excluded (`exclude_if`/`exclude_unless`)
- [ ] Architecture guideline: - `validated()` includes fields with rules and matching data, even through `nullable`
- [ ] Architecture guideline: - The DTO namespace should be in the domain/feature layer, not in `App\Http\Requests`
- [ ] Decision: DTO from validated() vs DTO from Request Directly - ensure correct choice is made
- [ ] Decision: toDto() on FormRequest vs fromRequest() on DTO - ensure correct choice is made
- [ ] Decision: DTO Bridge Always vs Only When Crossing Layers - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Bridge FormRequest to Typed DTO Using validated()
- [ ] Skill applied: Implement payload() Convenience Method on FormRequest

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
- [ ] DTO built from `$request->validated()` â€” never `$request->all()`
- [ ] DTO properties are `public readonly` (immutable)
- [ ] DTO lives in domain/feature layer â€” not `App\Http`
- [ ] Service layer receives DTO, not FormRequest
- [ ] `fromRequest()` factory method provided on DTO
- [ ] `safe()->only()` used for scoped DTO construction when applicable
- [ ] Controller converts request to DTO before calling service

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Passing Raw Request Data Directly to Services -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Building DTOs Inside FormRequest Classes -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Skipping DTOs Entirely â€” Using $request->all() in Services -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Mutable DTOs in Domain Logic -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: One Massive DTO With Nullable Fields for Every Scenario -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: No DTO Mapping Layer Between Request and Domain -- apply preferred alternative
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
- Bridge FormRequest to Typed DTO Using validated()
- Implement payload() Convenience Method on FormRequest
### Decision Trees (from 07)
- DTO from validated() vs DTO from Request Directly
- toDto() on FormRequest vs fromRequest() on DTO
- DTO Bridge Always vs Only When Crossing Layers
### Anti-Patterns (from 08)
- Passing Raw Request Data Directly to Services
- Building DTOs Inside FormRequest Classes
- Skipping DTOs Entirely â€” Using $request->all() in Services
- Mutable DTOs in Domain Logic
- One Massive DTO With Nullable Fields for Every Scenario
- No DTO Mapping Layer Between Request and Domain
### Related Rules (from 06 skills)
- Rule 1: Build DTOs from validated() â€” Never from all()
- Rule 2: Make DTOs Immutable with readonly Properties
- Rule 3: Keep DTOs in the Domain Layer â€” Not the HTTP Layer
- Rule 4: Do Not Pass FormRequest to the Service Layer
- Rule 5: Use Static Factory Methods on DTOs for Consistent Construction
- Rule 6: Use safe()->only() for Scoped DTO Construction
### Related Skills (from 06 skills)
- Create and Use Invokable Custom Validation Rules
- Implement HTTP-Layer Authorization in FormRequests

