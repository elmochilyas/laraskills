# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** When Repositories Hurt
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Performance: - Repository call overhead is negligible (one extra method call)
- [ ] Performance: - The real cost: Repository methods often lack eager-loading, causing N+1 que...
- [ ] Performance: - Removing repositories eliminates the indirection when debugging query perfo...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Prefer direct Eloquent usage in actions â€” queries are visible and explicit
- [ ] Architecture guideline: - Use model factories + RefreshDatabase for testing instead of repository mocks
- [ ] Architecture guideline: - If queries are complex, extract to a Query Object rather than a repository
- [ ] Architecture guideline: - If storage varies, use a repository interface â€” but only then
- [ ] Decision: Repository Layer vs Direct Eloquent Usage - ensure correct choice is made
- [ ] Decision: Repository Interface vs No Interface - ensure correct choice is made
- [ ] Decision: Repository Mock vs Real Database Test - ensure correct choice is made
- [ ] Decision: Repository Finder Method vs Query Object - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Repository call overhead is negligible (one extra method call)
- [ ] - The real cost: Repository methods often lack eager-loading, causing N+1 queries
- [ ] - Removing repositories eliminates the indirection when debugging query performance
- [ ] - Laravel's built-in cache already provides query caching without a repository layer

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Removing unnecessary repositories eliminates a layer where security filtering could be accidentally omitted
- [ ] - Direct Eloquent usage makes queries visible for review â€” no hidden scoping behind an interface

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
- [ ] Prevent: Repository Proliferation (50+ Unnecessary Repos) -- apply preferred alternative
    - [ ] Repository count > 20 for a simple CRUD application
    - [ ] Repositories exist for lookup tables (countries, statuses, categories)
    - [ ] Most repositories have 2-3 methods wrapping simple Eloquent calls
- [ ] Prevent: Mock Testing False Security -- apply preferred alternative
    - [ ] Tests mock repository interfaces
    - [ ] Tests assert method call patterns instead of data state
    - [ ] Tests don't use `RefreshDatabase`
- [ ] Prevent: Query Performance Hiding Behind Interfaces -- apply preferred alternative
    - [ ] Actions call repository methods and the query is not visible
    - [ ] Debugbar queries are attributed to repository classes
    - [ ] Performance reviews require navigating to repository implementations
- [ ] Prevent: Transactional Atrophy (Nested Transactions) -- apply preferred alternative
    - [ ] Repository method uses `DB::transaction()`
    - [ ] Action also uses `DB::transaction()` around repository calls
    - [ ] Nested transaction messages in logs
- [ ] Prevent: Repository for Read-Only Lookup Tables -- apply preferred alternative
    - [ ] Repository exists for a lookup table (seeded, not user-editable data)
    - [ ] Repository has only 1-2 read methods and no write methods
    - [ ] Repository implementation is under 10 lines

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
### Decision Trees (from 07)
- Repository Layer vs Direct Eloquent Usage
- Repository Interface vs No Interface
- Repository Mock vs Real Database Test
- Repository Finder Method vs Query Object
### Anti-Patterns (from 08)
- Repository Proliferation (50+ Unnecessary Repos)
- Mock Testing False Security
- Query Performance Hiding Behind Interfaces
- Transactional Atrophy (Nested Transactions)
- Repository for Read-Only Lookup Tables

