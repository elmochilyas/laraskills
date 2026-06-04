# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Event Projections
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Design Every Projection as Rebuildable from Scratch
- [ ] Enforce: Make Every Projector Idempotent
- [ ] Enforce: Project Only the Minimum Fields Required for the Read Use Case
- [ ] Enforce: Provide an Artisan Command for Rebuilding Projections
- [ ] Enforce: Monitor Projection Lag for Async Projections
- [ ] Enforce: Give Projection Tables Different Indexes Than Write Tables
- [ ] Enforce: Use Sync Projections When Consistency Is Critical, Async for Everything Else
- [ ] Performance: - Async projections scale better â€” writes don't wait for projection updates
- [ ] Performance: - Sync projections keep read models consistent but slow the write path
- [ ] Performance: - Projection tables can have different indexes and storage engines than write...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Projectors in `App\Projectors\*`
- [ ] Architecture guideline: - Read models in `App\Models\Read\*` â€” read-only Eloquent models
- [ ] Architecture guideline: - Provide an Artisan command to rebuild projections from scratch
- [ ] Architecture guideline: - Monitor projection lag for async projections

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Design Every Projection as Rebuildable from Scratch
- [ ] Apply rule: Make Every Projector Idempotent
- [ ] Apply rule: Project Only the Minimum Fields Required for the Read Use Case
- [ ] Apply rule: Provide an Artisan Command for Rebuilding Projections
- [ ] Apply rule: Monitor Projection Lag for Async Projections
- [ ] Apply rule: Give Projection Tables Different Indexes Than Write Tables
- [ ] Apply rule: Use Sync Projections When Consistency Is Critical, Async for Everything Else

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Async projections scale better â€” writes don't wait for projection updates
- [ ] - Sync projections keep read models consistent but slow the write path
- [ ] - Projection tables can have different indexes and storage engines than write tables

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
### Rules (from 05)
- Design Every Projection as Rebuildable from Scratch
- Make Every Projector Idempotent
- Project Only the Minimum Fields Required for the Read Use Case
- Provide an Artisan Command for Rebuilding Projections
- Monitor Projection Lag for Async Projections
- Give Projection Tables Different Indexes Than Write Tables
- Use Sync Projections When Consistency Is Critical, Async for Everything Else

