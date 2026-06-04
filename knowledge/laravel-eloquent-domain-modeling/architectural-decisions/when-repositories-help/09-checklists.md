# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** When Repositories Help
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Performance: - Repository method calls add a single PHP method invocation â€” negligible
- [ ] Performance: - Repositories should eager-load required relations explicitly to prevent N+1
- [ ] Performance: - Consider a caching decorator wrapping the Eloquent repository without chang...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Interface in `App\Contracts\Repositories\*` â€” domain-owned
- [ ] Architecture guideline: - Eloquent implementation in `App\Repositories\*` â€” infrastructure
- [ ] Architecture guideline: - Repository interface contains zero Eloquent-specific types (no `Builder`, no `Model`)
- [ ] Architecture guideline: - Every repository method is unit-testable with an in-memory fake
- [ ] Architecture guideline: - Repository only created for aggregate roots with actual storage variation needs

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Repository method calls add a single PHP method invocation â€” negligible
- [ ] - Repositories should eager-load required relations explicitly to prevent N+1
- [ ] - Consider a caching decorator wrapping the Eloquent repository without changing its interface
- [ ] - Pagination parameters should be accepted, not returning all rows

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Repository methods should not accept raw user input for query building
- [ ] - Soft-delete filtering should be consistently applied in repository methods
- [ ] - Repository is the enforcement point for tenant scoping and data isolation

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
- [ ] Prevent: Leaky Abstraction -- apply preferred alternative
    - [ ] Repository interface has `find`, `save`, `create`, `update`, `delete` methods
    - [ ] Interface accepts `array $data` or `array $criteria`
    - [ ] Interface has no domain-specific method names
- [ ] Prevent: Repository Per Entity Proliferation -- apply preferred alternative
    - [ ] Repository exists for every database table
    - [ ] Repository count > 2x the number of aggregate roots
    - [ ] Child entities have independent repository write methods
- [ ] Prevent: N+1 via Repository (Missing Eager Loading) -- apply preferred alternative
    - [ ] Repository methods lack `with()` calls
    - [ ] Callers loop and access relations after repository return
    - [ ] Debugbar shows repeated queries for relations
- [ ] Prevent: Transaction Antipattern (Repository Manages Transactions) -- apply preferred alternative
    - [ ] Repository method uses `DB::transaction()`
    - [ ] Caller also uses `DB::transaction()` around repository call
    - [ ] Nested transaction warnings in log
- [ ] Prevent: Repository as Default Layer for Every Model -- apply preferred alternative
    - [ ] Every model has a corresponding repository
    - [ ] Lookup tables have repositories
    - [ ] Most repositories have 2-3 methods with simple Eloquent calls

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
- Leaky Abstraction
- Repository Per Entity Proliferation
- N+1 via Repository (Missing Eager Loading)
- Transaction Antipattern (Repository Manages Transactions)
- Repository as Default Layer for Every Model

