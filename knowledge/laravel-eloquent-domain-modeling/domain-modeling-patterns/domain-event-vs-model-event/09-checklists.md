# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Domain Event vs Model Event
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Use Model Events Only for Infrastructure Side Effects
- [ ] Enforce: Dispatch Domain Events Explicitly from Domain Methods, Never from Model Events
- [ ] Enforce: Name Domain Events in Past Tense, Model Events in Eloquent's Convention
- [ ] Enforce: Carry Model Instances in Model Events, Carry IDs in Domain Events
- [ ] Enforce: Never Write Business Logic in Model Event Observers
- [ ] Enforce: Disable Model Events for Bulk Operations Using `saveQuietly()`
- [ ] Enforce: Use `$dispatchesEvents` Only for Persistence-Level Infrastructure
- [ ] Performance: - Model events fire on every save â€” even on `touch()` calls â€” reducing pe...
- [ ] Performance: - Domain events fire only on explicit business operations
- [ ] Performance: - Use `saveQuietly()` for bulk operations that don't need model event side ef...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Model events are registered in `$dispatchesEvents` property or observers
- [ ] Architecture guideline: - Domain events are dispatched from explicit domain method calls, not model event hooks
- [ ] Architecture guideline: - Listeners for model events focus on infrastructure; listeners for domain events focus on business
- [ ] Architecture guideline: - Domain events carry business-relevant payload (IDs, values), not model instances

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Use Model Events Only for Infrastructure Side Effects
- [ ] Apply rule: Dispatch Domain Events Explicitly from Domain Methods, Never from Model Events
- [ ] Apply rule: Name Domain Events in Past Tense, Model Events in Eloquent's Convention
- [ ] Apply rule: Carry Model Instances in Model Events, Carry IDs in Domain Events
- [ ] Apply rule: Never Write Business Logic in Model Event Observers
- [ ] Apply rule: Disable Model Events for Bulk Operations Using `saveQuietly()`
- [ ] Apply rule: Use `$dispatchesEvents` Only for Persistence-Level Infrastructure

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Model events fire on every save â€” even on `touch()` calls â€” reducing performance for bulk operations
- [ ] - Domain events fire only on explicit business operations
- [ ] - Use `saveQuietly()` for bulk operations that don't need model event side effects

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
- Use Model Events Only for Infrastructure Side Effects
- Dispatch Domain Events Explicitly from Domain Methods, Never from Model Events
- Name Domain Events in Past Tense, Model Events in Eloquent's Convention
- Carry Model Instances in Model Events, Carry IDs in Domain Events
- Never Write Business Logic in Model Event Observers
- Disable Model Events for Bulk Operations Using `saveQuietly()`
- Use `$dispatchesEvents` Only for Persistence-Level Infrastructure

