# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Factories & Seeders
**Knowledge Unit:** Circular Dependency Resolution
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Circular dependency is identified and the primary/independent model is chosen
- [ ] `recycle()` placed before any `has()`, `for()`, or `hasAttached()` calls
- [ ] Pre-created model instances cover all dependent model references
- [ ] No infinite recursion or stack overflow occurs during factory execution
- [ ] Resolution strategy documented on the factory class
- [ ] Performance: - Circular dependency resolution typically adds no overhead beyond the pre-cr...
- [ ] Performance: - Recursive factory calls can crash PHP (stack overflow) â€” resolve before h...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Identify which model is the "primary" entity that can exist independently
- [ ] Architecture guideline: - Pre-create that model with `recycle()` in the factory chain
- [ ] Architecture guideline: - The dependent model's factory references the recycled instance

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Resolve Circular Factory Dependency with recycle()

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Circular dependency resolution typically adds no overhead beyond the pre-creation step
- [ ] - Recursive factory calls can crash PHP (stack overflow) â€” resolve before hitting large counts

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
- [ ] Circular dependency is identified and the primary/independent model is chosen
- [ ] `recycle()` placed before any `has()`, `for()`, or `hasAttached()` calls
- [ ] Pre-created model instances cover all dependent model references
- [ ] No infinite recursion or stack overflow occurs during factory execution
- [ ] Resolution strategy documented on the factory class

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
- Resolve Circular Factory Dependency with recycle()
### Related Rules (from 06 skills)
- Rule 1: Break Every Circular Factory Dependency Before Seeding
- Rule 2: Use recycle() to Break Circular Dependencies
- Rule 3: Defer the Dependent Side of a Cycle to afterCreating
- Rule 5: Do Not Call Model::factory() Inside Another Model's definition()
- Rule 6: Document Circular Dependency Resolutions in Factory DocBlocks
### Related Skills (from 06 skills)
- Recycle Pattern for Shared Parents
- HasMany Factory Relationships with has()
- BelongsTo Factory Relationships with for()

