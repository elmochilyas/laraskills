# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Performance & Data Integrity
**Knowledge Unit:** lazy-lazy-by-id
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `lazyById()` used for datasets that may be mutated during iteration
- [ ] Eager loading (`with()`) called before `lazy()` when relationships are accessed
- [ ] LazyCollection is not materialized via `->toArray()` or `->all()`
- [ ] Chunk size tuned for model complexity (smaller for heavy relations)
- [ ] Lazy iteration runs in CLI/queue context, not web request
- [ ] LazyCollection is not iterated twice (single-use generator)
- [ ] Performance: - Memory usage is proportional to chunk size Ã— model size â€” a chunk of 500...
- [ ] Performance: - `lazy()` with eager loading executes one additional query per chunk per rel...
- [ ] Performance: - `lazyById()` is more efficient than `lazy()` for large datasets â€” avoids ...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Place lazy iteration in CLI commands or queue jobs, not web requests
- [ ] Architecture guideline: - Use `lazyById()` for production batch jobs on live tables
- [ ] Architecture guideline: - Log starting/ending keys for `lazyById()` to support failure recovery
- [ ] Architecture guideline: - Consider dispatching a job per chunk for time-sensitive processing
- [ ] Decision: lazy() vs lazyById() Selection - ensure correct choice is made
- [ ] Decision: with() Eager Loading Before lazy() - ensure correct choice is made
- [ ] Decision: Chunk Size Optimization - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Memory-Efficient Iteration with Eager Loading using lazy

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Memory usage is proportional to chunk size Ã— model size â€” a chunk of 500 models with 5 relations may use 10â€“50 MB
- [ ] - `lazy()` with eager loading executes one additional query per chunk per relation â€” for 100 chunks Ã— 3 relations ...
- [ ] - `lazyById()` is more efficient than `lazy()` for large datasets â€” avoids offset scan overhead
- [ ] - `LazyCollection` pipeline processes items one chunk at a time; memory stays bounded by chunk size

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - No direct security implications â€” lazy iteration is a memory management concern
- [ ] - Ensure lazy-iterated data respects authorization boundaries

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
- [ ] `lazyById()` used for datasets that may be mutated during iteration
- [ ] Eager loading (`with()`) called before `lazy()` when relationships are accessed
- [ ] LazyCollection is not materialized via `->toArray()` or `->all()`
- [ ] Chunk size tuned for model complexity (smaller for heavy relations)
- [ ] Lazy iteration runs in CLI/queue context, not web request
- [ ] LazyCollection is not iterated twice (single-use generator)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

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
- Implement Memory-Efficient Iteration with Eager Loading using lazy
### Decision Trees (from 07)
- lazy() vs lazyById() Selection
- with() Eager Loading Before lazy()
- Chunk Size Optimization
### Related Rules (from 06 skills)
- Use lazyById for Concurrent Scenarios by Default (performance-and-integrity/lazy-lazy-by-id)
- Use with() Before lazy() for Relationships (performance-and-integrity/lazy-lazy-by-id)
- Never Materialize the LazyCollection (performance-and-integrity/lazy-lazy-by-id)
- Size Chunks According to Model Complexity (performance-and-integrity/lazy-lazy-by-id)
- Place Lazy Iteration in CLI or Queue Contexts (performance-and-integrity/lazy-lazy-by-id)
- Never Iterate a LazyCollection Twice (performance-and-integrity/lazy-lazy-by-id)
### Related Skills (from 06 skills)
- Implement Mutation-Safe Batch Processing with chunkById
- Implement Memory-Efficient Streaming with cursor
- Implement Read-Only Export with toBase

