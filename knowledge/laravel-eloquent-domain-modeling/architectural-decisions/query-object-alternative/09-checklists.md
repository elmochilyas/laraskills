# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** Query Object Alternative
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Performance: - Query objects are the natural unit for caching â€” cache key derived from c...
- [ ] Performance: - Always eager-load relations inside query objects; never lazy-load
- [ ] Performance: - Support pagination parameters rather than returning all rows

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Place query objects in `App\Queries\{Domain}\{QueryName}Query.php`
- [ ] Architecture guideline: - Inject query objects into actions or controllers, not the reverse
- [ ] Architecture guideline: - Query objects should not check authorization â€” they query; authorization happens at the calle...
- [ ] Architecture guideline: - Query objects are the ideal place to apply `select`, `with`, and eager load constraints
- [ ] Decision: Query Object vs Model Local Scope - ensure correct choice is made
- [ ] Decision: Query Object vs Repository Finder Method - ensure correct choice is made
- [ ] Decision: To Cache or Not to Cache Query Results - ensure correct choice is made
- [ ] Decision: Paginated vs Unbounded Result Sets - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Query objects are the natural unit for caching â€” cache key derived from class name + parameters
- [ ] - Always eager-load relations inside query objects; never lazy-load
- [ ] - Support pagination parameters rather than returning all rows
- [ ] - Avoid lazy-loading inside query objects â€” always eager-load relations

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Query objects never receive raw user input â€” validate and transform at the controller level
- [ ] - Authorization is not the query object's responsibility; callers must check permissions
- [ ] - Be cautious with dynamic `orderBy` from user input â€” validate allowed sort columns

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
- [ ] Prevent: Query Object Proliferation -- apply preferred alternative
    - [ ] Query object count exceeds 5x the number of models
    - [ ] Query objects with zero call sites found in codebase
    - [ ] Multiple query objects with overlapping filter parameters
- [ ] Prevent: Business Logic Leak in Query Objects -- apply preferred alternative
    - [ ] Query object calls domain methods or applies business rules
    - [ ] Query object uses `filter()` with conditional business logic
    - [ ] Query object returns calculated/transformed data beyond attribute selection
- [ ] Prevent: Performance Hiding (Unbounded Results) -- apply preferred alternative
    - [ ] Query object returns `Collection` instead of `LengthAwarePaginator`
    - [ ] No `->limit()`, `->take()`, or pagination in the query
    - [ ] Query result could exceed 1000 rows based on data growth projection
- [ ] Prevent: Over-Abstraction (Trivial Query Objects) -- apply preferred alternative
    - [ ] Query object has exactly one `where` clause and no parameters
    - [ ] Query object is used in a single call site
    - [ ] Query object is under 15 lines total
- [ ] Prevent: Mutation Inside Query Objects -- apply preferred alternative
    - [ ] Query object calls any write method on a model or DB
    - [ ] Query object dispatches events or jobs
    - [ ] Query object modifies state visible outside the query

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
- Query Object vs Model Local Scope
- Query Object vs Repository Finder Method
- To Cache or Not to Cache Query Results
- Paginated vs Unbounded Result Sets
### Anti-Patterns (from 08)
- Query Object Proliferation
- Business Logic Leak in Query Objects
- Performance Hiding (Unbounded Results)
- Over-Abstraction (Trivial Query Objects)
- Mutation Inside Query Objects

