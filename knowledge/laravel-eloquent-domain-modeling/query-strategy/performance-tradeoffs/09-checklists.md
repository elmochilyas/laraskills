# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Query Strategy
**Knowledge Unit:** Performance Tradeoffs
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] N+1 prevention active (`preventLazyLoading()` in development)
- [ ] All list/show endpoints have eager-loaded relationships
- [ ] No `get()` calls on result sets exceeding 10,000 rows
- [ ] Slow query threshold configured and monitored
- [ ] Caching strategy verified with correct invalidation
- [ ] `explain()` plans checked for hot queries
- [ ] Memory limits tested for streaming/export endpoints

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Set query count budgets per request (e.g., "no more than 10 queries on list endpoints")
- [ ] Architecture guideline: - Write performance regression tests for critical query paths
- [ ] Architecture guideline: - Use `explain()` on hot queries to verify index usage
- [ ] Architecture guideline: - Monitor memory usage for endpoints that stream or export large datasets
- [ ] Architecture guideline: - Separate read-heavy paths (reporting, exports) from write-heavy paths in the codebase
- [ ] Decision: Optimization Priority (N+1 vs Hydration) - ensure correct choice is made
- [ ] Decision: Batch Processing Method for Large Datasets - ensure correct choice is made
- [ ] Decision: Eager Loading Strategy - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Evaluate Eloquent Performance Tradeoffs with Profiling

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
- [ ] N+1 prevention active (`preventLazyLoading()` in development)
- [ ] All list/show endpoints have eager-loaded relationships
- [ ] No `get()` calls on result sets exceeding 10,000 rows
- [ ] Slow query threshold configured and monitored
- [ ] Caching strategy verified with correct invalidation
- [ ] `explain()` plans checked for hot queries
- [ ] Memory limits tested for streaming/export endpoints

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
- Evaluate Eloquent Performance Tradeoffs with Profiling
### Decision Trees (from 07)
- Optimization Priority (N+1 vs Hydration)
- Batch Processing Method for Large Datasets
- Eager Loading Strategy
### Related Rules (from 06 skills)
- Fix N+1 Before Optimizing Hydration (query-strategy/performance-tradeoffs)
- Never Use get() for Result Sets Exceeding 10,000 Rows (query-strategy/performance-tradeoffs)
- Enable Model::preventLazyLoading() in Development (query-strategy/performance-tradeoffs)
- Use chunkById() for Stable Batch Pagination Over Simple Offset (query-strategy/performance-tradeoffs)
- Select Only Needed Columns to Reduce Hydration Overhead (query-strategy/performance-tradeoffs)
- Use cursor() Instead of chunk() for True Streaming Iteration (query-strategy/performance-tradeoffs)
- Cache Frequent Query Results with Correct Invalidation (query-strategy/performance-tradeoffs)
### Related Skills (from 06 skills)
- Choose Between Eloquent and Query Builder
- Implement toBase Pattern for Hydration Bypass
- Implement Hybrid Strategies for Eloquent-QB Mixing

