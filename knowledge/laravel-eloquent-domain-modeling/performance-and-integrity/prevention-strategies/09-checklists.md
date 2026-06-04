# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Performance & Data Integrity
**Knowledge Unit:** Prevention Strategies
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Every controller method eager-loads all relations consumed by its view/resource
- [ ] Accessors use `loadMissing()` before accessing relationships
- [ ] `$with` only used for universally-needed relations (reviewed individually)
- [ ] Nested eager loading has constraints (limits, where clauses)
- [ ] Views receive pre-loaded models â€” no lazy loading in Blade templates
- [ ] `withCount()` used instead of full relation loading where only counts needed
- [ ] Performance: - Eager loading adds one query per relation â€” loading 10 relations executes...
- [ ] Performance: - Large `WHERE IN (...ids)` clauses (10k+ IDs) can exceed MySQL's `max_allowe...
- [ ] Performance: - Constrained eager loading reduces memory â€” loading only required child ro...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Separate data-fetching code (controllers/repositories) from data-access code (views/resources)
- [ ] Architecture guideline: - Repository-level eager loading map: define `$withMap` arrays mapping view contexts to required ...
- [ ] Architecture guideline: - Use `load()` in repositories, not in views â€” views should access pre-loaded relations
- [ ] Architecture guideline: - Pass pre-loaded models to Blade components as parameters rather than lazy-loading internally
- [ ] Decision: Controller Eager Loading Responsibility - ensure correct choice is made
- [ ] Decision: $with vs Explicit with() Selection - ensure correct choice is made
- [ ] Decision: Constrained Loading for Nested Relations - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Prevent N+1 with Proactive Eager Loading Strategies

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Eager loading adds one query per relation â€” loading 10 relations executes 10 `WHERE IN` queries
- [ ] - Large `WHERE IN (...ids)` clauses (10k+ IDs) can exceed MySQL's `max_allowed_packet` â€” batch via `chunk()`
- [ ] - Constrained eager loading reduces memory â€” loading only required child rows instead of entire relation sets
- [ ] - Cache expensive eager loads: `Cache::remember('posts', 3600, fn() => Post::with('comments')->get())`

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Over-eager loading of sensitive relations may expose data through serialization or debugging
- [ ] - Use `whenLoaded()` in API resources to conditionally include relations â€” prevents exposing data that wasn't expli...

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
- [ ] Every controller method eager-loads all relations consumed by its view/resource
- [ ] Accessors use `loadMissing()` before accessing relationships
- [ ] `$with` only used for universally-needed relations (reviewed individually)
- [ ] Nested eager loading has constraints (limits, where clauses)
- [ ] Views receive pre-loaded models â€” no lazy loading in Blade templates
- [ ] `withCount()` used instead of full relation loading where only counts needed

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
- Prevent N+1 with Proactive Eager Loading Strategies
### Decision Trees (from 07)
- Controller Eager Loading Responsibility
- $with vs Explicit with() Selection
- Constrained Loading for Nested Relations
### Related Rules (from 06 skills)
- Always Eager-Load in Controllers (performance-and-integrity/prevention-strategies)
- Use loadMissing in Accessors (performance-and-integrity/prevention-strategies)
- Prefer Explicit with() Over $with Model Property (performance-and-integrity/prevention-strategies)
- Use Constrained Loading for Nested Relations (performance-and-integrity/prevention-strategies)
- Never Lazy-Load in Blade Templates (performance-and-integrity/prevention-strategies)
- Use loadCount Instead of Full Relation Loading (performance-and-integrity/prevention-strategies)
### Related Skills (from 06 skills)
- Enforce Lazy Loading Violations with Strict Mode
- Detect N+1 with Automated Tooling
- Implement Select Constraints for I/O Reduction

