# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Commit Strategies
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `->afterCommit()` or `Bus::dispatchAfterCommit()` used for dispatches inside transactions
- [ ] `BroadcastsEventsAfterCommit` used instead of `BroadcastsEvents`
- [ ] Side effects that must run regardless of transaction outcome do NOT use afterCommit
- [ ] Listeners receiving after-commit data check model existence before processing
- [ ] Transaction boundaries are documented for methods with after-commit side effects

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Domain events dispatched from model methods should use `dispatch()->afterCommit()`
- [ ] Architecture guideline: - Model broadcast trait should be `BroadcastsEventsAfterCommit`
- [ ] Architecture guideline: - Listeners that read the persisted model should use after-commit dispatch

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up afterCommit() Dispatch for Domain Events in Transactions

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
- [ ] `->afterCommit()` or `Bus::dispatchAfterCommit()` used for dispatches inside transactions
- [ ] `BroadcastsEventsAfterCommit` used instead of `BroadcastsEvents`
- [ ] Side effects that must run regardless of transaction outcome do NOT use afterCommit
- [ ] Listeners receiving after-commit data check model existence before processing
- [ ] Transaction boundaries are documented for methods with after-commit side effects

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
- Set Up afterCommit() Dispatch for Domain Events in Transactions
### Related Rules (from 06 skills)
- Rule 1: Always Use `afterCommit()` for Domain Events in Transactions
- Rule 2: Use `BroadcastsEventsAfterCommit` Over `BroadcastsEvents`
- Rule 3: Do Not Use `afterCommit()` for Side Effects That Must Execute Regardless of the Transaction
- Rule 5: Use `dispatchAfterCommit()` on Bus for Readable One-Liners
- Rule 6: Ensure Listeners Receiving After-Commit Events Handle Non-Existence Gracefully
### Related Skills (from 06 skills)
- Broadcast Events Trait for Real-Time Updates
- Event Control / Quiet Operations for Suppression
- Event Catalog for Lifecycle Events

