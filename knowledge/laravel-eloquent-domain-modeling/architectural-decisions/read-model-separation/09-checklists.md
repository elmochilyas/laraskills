# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** Read Model Separation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Performance: - Read models can use dedicated read replicas without affecting write throughput
- [ ] Performance: - Database views add negligible query overhead (the database optimizes them)
- [ ] Performance: - Denormalized read models eliminate JOINs â€” significantly faster for compl...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Read models in `App\Models\Read\*` â€” read-only, no `save()`/`update()` methods
- [ ] Architecture guideline: - Populated by projectors, event handlers, or database views
- [ ] Architecture guideline: - Read models are independently indexable from write models
- [ ] Architecture guideline: - Controllers and actions query read models directly, never the write model for display
- [ ] Architecture guideline: - Write model remains free to evolve its internal structure without breaking queries
- [ ] Decision: Read Model Separation vs Single Model for Both Reads and Writes - ensure correct choice is made
- [ ] Decision: Database View vs Queue-Based Projection System - ensure correct choice is made
- [ ] Decision: Real-Time Consistency vs Eventual Consistency for Read Models - ensure correct choice is made
- [ ] Decision: Read Model Indexing Strategy â€” Independent vs Shared - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Read models can use dedicated read replicas without affecting write throughput
- [ ] - Database views add negligible query overhead (the database optimizes them)
- [ ] - Denormalized read models eliminate JOINs â€” significantly faster for complex queries
- [ ] - Read model tables can have different indexing strategies than write tables
- [ ] - Queue-based projections may introduce latency; measure acceptable staleness

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Read models should never expose sensitive write-model columns (password hashes, internal flags)
- [ ] - Read-only models enforce immutability at the code level â€” no accidental writes through read paths
- [ ] - Projection code must validate that only authorized data flows into read models (tenant isolation)

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
- [ ] Prevent: Stale Data (Unmonitored Projection Lag) -- apply preferred alternative
    - [ ] No projection lag metric exists
    - [ ] Read model class has no documented staleness SLA
    - [ ] No alerting for projection failures or lag
- [ ] Prevent: Projection Failure Without Recovery -- apply preferred alternative
    - [ ] No rebuild Artisan command for the read model
    - [ ] Recovery procedure documented as "manual SQL" or "contact engineering"
    - [ ] Projection bugs require truncating and reprocessing data manually
- [ ] Prevent: Schema Drift Between Projector and Read Model -- apply preferred alternative
    - [ ] Projector tests use mocks instead of a real database
    - [ ] Read model schema changes without corresponding projector changes
    - [ ] "Column not found" errors in projector logs
- [ ] Prevent: Over-Engineering Read Models for Simple CRUD -- apply preferred alternative
    - [ ] Read model columns are identical to write model columns
    - [ ] No denormalization, aggregation, or transformation in projection
    - [ ] No performance measurement shows read model is faster
- [ ] Prevent: Mutating Data Through a Read Model -- apply preferred alternative
    - [ ] `->save()` or `->update()` called on a read model instance
    - [ ] Read model class has `$fillable` or `$guarded` arrays
    - [ ] Read model is registered with a writable database connection

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
- Read Model Separation vs Single Model for Both Reads and Writes
- Database View vs Queue-Based Projection System
- Real-Time Consistency vs Eventual Consistency for Read Models
- Read Model Indexing Strategy â€” Independent vs Shared
### Anti-Patterns (from 08)
- Stale Data (Unmonitored Projection Lag)
- Projection Failure Without Recovery
- Schema Drift Between Projector and Read Model
- Over-Engineering Read Models for Simple CRUD
- Mutating Data Through a Read Model

