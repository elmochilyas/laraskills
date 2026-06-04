# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Relationships â€” Aggregate Methods & Relationship Patterns
**Knowledge Unit:** default-models
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: WithDefault-Only-Singular
- [ ] Enforce: WithDefault-Not-For-Data-Loss
- [ ] Enforce: Check-Exists-On-Default
- [ ] Enforce: WithDefault-Callback-Not-Heavy
- [ ] Enforce: WithDefault-Save-Awareness
- [ ] Enforce: WithDefault-Serialization-Impact
- [ ] Enforce: WithDefault-Accessor-Safety

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Place defaults at the relationship layer, not in accessors or application code
- [ ] Architecture guideline: - Use callable defaults sparingly â€” they create coupling between the parent and default generat...
- [ ] Architecture guideline: - For API responses, be aware that introducing `withDefault()` changes serialization output from ...
- [ ] Architecture guideline: - Combine with `$casts` on custom pivot models when defaults need type conversion
- [ ] Architecture guideline: - Add monitoring for expected relationships that are always returning defaults (may indicate data...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: WithDefault-Only-Singular
- [ ] Apply rule: WithDefault-Not-For-Data-Loss
- [ ] Apply rule: Check-Exists-On-Default
- [ ] Apply rule: WithDefault-Callback-Not-Heavy
- [ ] Apply rule: WithDefault-Save-Awareness
- [ ] Apply rule: WithDefault-Serialization-Impact
- [ ] Apply rule: WithDefault-Accessor-Safety

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
- WithDefault-Only-Singular
- WithDefault-Not-For-Data-Loss
- Check-Exists-On-Default
- WithDefault-Callback-Not-Heavy
- WithDefault-Save-Awareness
- WithDefault-Serialization-Impact
- WithDefault-Accessor-Safety

