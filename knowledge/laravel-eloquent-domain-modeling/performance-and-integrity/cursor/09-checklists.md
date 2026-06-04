# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Performance & Data Integrity
**Knowledge Unit:** cursor
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Cursor used only in CLI commands or queue jobs, not web controllers
- [ ] No `with()` calls precede the `cursor()` call
- [ ] No relationship access inside the iteration loop
- [ ] LazyCollection is not materialized via `->toArray()` or `->all()`
- [ ] Connection timeout configured for long-running cursor jobs
- [ ] `READ UNCOMMITTED` isolation set for read-only processing
- [ ] Performance: - `cursor()` uses less PHP memory than `lazy()` â€” models hydrated one at a ...
- [ ] Performance: - The entire result set is still buffered at the PDO driver level â€” truly m...
- [ ] Performance: - Per-row hydration overhead is higher than `lazy()` â€” Eloquent instantiate...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Confine cursor usage to CLI commands, queue jobs, or background processes
- [ ] Architecture guideline: - Never use cursor in a web controller or middleware
- [ ] Architecture guideline: - Limit concurrent cursor processes to avoid connection pool starvation
- [ ] Architecture guideline: - Monitor cursor job duration to detect queries that take too long per row
- [ ] Decision: cursor() vs lazy() vs chunk() Selection - ensure correct choice is made
- [ ] Decision: Cursor Usage Context (CLI vs Web) - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Memory-Efficient Read-Only Streaming with cursor

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - `cursor()` uses less PHP memory than `lazy()` â€” models hydrated one at a time vs. one chunk at a time
- [ ] - The entire result set is still buffered at the PDO driver level â€” truly massive result sets (10M+) may still caus...
- [ ] - Per-row hydration overhead is higher than `lazy()` â€” Eloquent instantiates a model for each row instead of per ba...
- [ ] - Without eager loading, any relationship access inside a cursor loop triggers N+1 cascade, negating all memory benefits

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Long-running cursor processes may hold database credentials in memory for extended periods
- [ ] - Ensure cursor jobs respect row-level authorization if accessing multi-tenant data
- [ ] - Export cursors should not expose data the caller is not authorized to see

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
- [ ] Cursor used only in CLI commands or queue jobs, not web controllers
- [ ] No `with()` calls precede the `cursor()` call
- [ ] No relationship access inside the iteration loop
- [ ] LazyCollection is not materialized via `->toArray()` or `->all()`
- [ ] Connection timeout configured for long-running cursor jobs
- [ ] `READ UNCOMMITTED` isolation set for read-only processing

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
- Implement Memory-Efficient Read-Only Streaming with cursor
### Decision Trees (from 07)
- cursor() vs lazy() vs chunk() Selection
- Cursor Usage Context (CLI vs Web)
### Related Rules (from 06 skills)
- Never Access Relationships Inside a Cursor Loop (performance-and-integrity/cursor)
- Only Use Cursor in CLI or Queue Contexts (performance-and-integrity/cursor)
- Do Not Materialize the LazyCollection (performance-and-integrity/cursor)
- Set a Generous Connection Timeout for Cursor Jobs (performance-and-integrity/cursor)
- Use READ UNCOMMITTED for Read-Only Cursor Processing (performance-and-integrity/cursor)
- Never Add with() Before cursor() (performance-and-integrity/cursor)
### Related Skills (from 06 skills)
- Implement Batch Processing with chunkById
- Implement Memory-Efficient Iteration with lazyById
- Implement Read-Only Export with toBase

