# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** Eloquent as Adapter
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Performance: - Mapping between Eloquent and domain models adds CPU overhead (~<1ms per 100...
- [ ] Performance: - Pagination must be handled in the repository layer before mapping
- [ ] Performance: - Cache mapped domain models, not raw Eloquent instances, to avoid serializat...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Define repository interfaces in the Domain layer, owned by the domain
- [ ] Architecture guideline: - Implement repositories in the Infrastructure layer, using Eloquent internally
- [ ] Architecture guideline: - Domain namespaces must have zero `use Illuminate\*` imports (enforce via PHPStan)
- [ ] Architecture guideline: - Repository methods only accept/return domain models or primitives
- [ ] Architecture guideline: - Repository should accept `$with` parameters for relation eager-loading

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Mapping between Eloquent and domain models adds CPU overhead (~<1ms per 100 entities)
- [ ] - Pagination must be handled in the repository layer before mapping
- [ ] - Cache mapped domain models, not raw Eloquent instances, to avoid serialization issues
- [ ] - Lazy loading must happen inside the repository before returning domain objects

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Domain models use `DateTimeImmutable` not Carbon â€” prevents time-based mutation
- [ ] - Domain models use native PHP types and value objects â€” no Eloquent collections that could expose internal state
- [ ] - Repository layer is the enforcement point for soft-delete filtering and tenant scoping

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

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Mapping Explosion -- apply preferred alternative
    - [ ] Each repository has custom `toDomain()` / `fromDomain()` methods
    - [ ] Adding a field requires updating mapper code in multiple places
    - [ ] Mapping tests are brittle and exceed 50 lines per repository
- [ ] Prevent: Eloquent Feature Lock-In -- apply preferred alternative
    - [ ] Adapter uses `SoftDeletes`, `withCount`, or global scopes
    - [ ] Port interface accepts or returns Eloquent-specific types
    - [ ] In-memory adapter does not exist or is significantly different from production adapter
- [ ] Prevent: N+1 Adapter -- apply preferred alternative
    - [ ] Repository queries lack `with()` calls for accessed relations
    - [ ] Callers loop through results and call the repository again per item
    - [ ] Production query count shows N+1 pattern on repository queries
- [ ] Prevent: Identity Drift -- apply preferred alternative
    - [ ] `toDomain()` generates a new ID value instead of using the Eloquent ID
    - [ ] Repository `store()` always calls `create()` â€” never `update()`
    - [ ] Integration test save-and-retrieve returns different ID values
- [ ] Prevent: Incomplete Decoupling (Hybrid Model) -- apply preferred alternative
    - [ ] Domain models extend both `Model` and implement domain interfaces
    - [ ] `Domain/` namespace has mixed `use Illuminate\*` imports
    - [ ] Tests for domain logic require both `RefreshDatabase` and pure PHPUnit

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
### Anti-Patterns (from 08)
- Mapping Explosion
- Eloquent Feature Lock-In
- N+1 Adapter
- Identity Drift
- Incomplete Decoupling (Hybrid Model)

