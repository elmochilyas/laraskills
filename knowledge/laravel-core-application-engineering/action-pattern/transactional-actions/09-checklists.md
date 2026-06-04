# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Transactional Actions
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Actions Must Not Manage Their Own Database Transactions
- [ ] Enforce: Always Use `DB::afterCommit()` for Side-Effecting Operations
- [ ] Enforce: Document the Transaction Boundary at the Orchestrator Level
- [ ] Enforce: Test `afterCommit` Actions Within an Active Transaction
- [ ] Enforce: Delegate Heavy `afterCommit` Callbacks to the Queue
- [ ] Enforce: Prevent Phantom Side Effects on Transaction Rollback
- [ ] Enforce: Sub-Actions Must Not Create Savepoints Inside Parent Transactions
- [ ] Transaction wraps all related database operations with `DB::transaction()`
- [ ] All side effects use `DB::afterCommit()` â€” no side effects execute directly inside the transaction
- [ ] Heavy afterCommit callbacks dispatch queued jobs instead of executing inline
- [ ] Sub-actions are transaction-agnostic (no self-managed transactions)
- [ ] Transaction boundary is documented in the method docblock
- [ ] Tests verify rollback does not trigger afterCommit callbacks
- [ ] Tests verify commit triggers afterCommit callbacks in sequence

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Transaction ownership:** Service owns the transaction (calls `DB::transaction()`). Action doe...
- [ ] Architecture guideline: - **Standalone action exception:** Actions that are guaranteed to be top-level callers (scheduled...
- [ ] Architecture guideline: - **Savepoint education:** Teams that allow transactional actions must educate developers that `D...
- [ ] Architecture guideline: - **afterCommit in Octane:** In Octane, afterCommit callbacks may persist across requests if the ...
- [ ] Architecture guideline: - **SQLite differences:** In testing (SQLite by default in Laravel), nested `DB::transaction()` c...
- [ ] Architecture guideline: - **Heavy afterCommit chains:** Delegate heavy afterCommit callbacks to the queue: `DB::afterComm...
- [ ] Decision: Action Transaction Ownership â€” Standalone vs Composed - ensure correct choice is made
- [ ] Decision: Side Effect Strategy â€” afterCommit vs Direct Execution - ensure correct choice is made
- [ ] Decision: afterCommit vs Queue Dispatch for Heavy Callbacks - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Actions Must Not Manage Their Own Database Transactions
- [ ] Apply rule: Always Use `DB::afterCommit()` for Side-Effecting Operations
- [ ] Apply rule: Document the Transaction Boundary at the Orchestrator Level
- [ ] Apply rule: Test `afterCommit` Actions Within an Active Transaction
- [ ] Apply rule: Delegate Heavy `afterCommit` Callbacks to the Queue
- [ ] Apply rule: Prevent Phantom Side Effects on Transaction Rollback
- [ ] Apply rule: Sub-Actions Must Not Create Savepoints Inside Parent Transactions
- [ ] Skill applied: Write a Transaction-Safe Orchestrator with afterCommit Side Effects
- [ ] Skill applied: Test afterCommit Behavior in Actions

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
- [ ] Transaction wraps all related database operations with `DB::transaction()`
- [ ] All side effects use `DB::afterCommit()` â€” no side effects execute directly inside the transaction
- [ ] Heavy afterCommit callbacks dispatch queued jobs instead of executing inline
- [ ] Sub-actions are transaction-agnostic (no self-managed transactions)
- [ ] Transaction boundary is documented in the method docblock
- [ ] Tests verify rollback does not trigger afterCommit callbacks
- [ ] Tests verify commit triggers afterCommit callbacks in sequence

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Action Self-Managing Database Transactions -- apply preferred alternative
    - [ ] Grep `DB::transaction(` in `App\Actions\` files
    - [ ] Verify each action that has a transaction is never injected as a dependency
- [ ] Prevent: Phantom Side Effects -- apply preferred alternative
    - [ ] Grep for `Mail::`, `event(`, `Cache::`, `Http::` inside `DB::transaction()` closures
    - [ ] Check if afterCommit is used for side effects

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
- Actions Must Not Manage Their Own Database Transactions
- Always Use `DB::afterCommit()` for Side-Effecting Operations
- Document the Transaction Boundary at the Orchestrator Level
- Test `afterCommit` Actions Within an Active Transaction
- Delegate Heavy `afterCommit` Callbacks to the Queue
- Prevent Phantom Side Effects on Transaction Rollback
- Sub-Actions Must Not Create Savepoints Inside Parent Transactions
### Skills (from 06)
- Write a Transaction-Safe Orchestrator with afterCommit Side Effects
- Test afterCommit Behavior in Actions
### Decision Trees (from 07)
- Action Transaction Ownership â€” Standalone vs Composed
- Side Effect Strategy â€” afterCommit vs Direct Execution
- afterCommit vs Queue Dispatch for Heavy Callbacks
### Anti-Patterns (from 08)
- Action Self-Managing Database Transactions
- Phantom Side Effects
### Related Rules (from 06 skills)
- Rule: Actions Must Not Manage Their Own Database Transactions (transactional-actions/05-rules.md)
- Rule: Always Use `DB::afterCommit()` for Side-Effecting Operations (transactional-actions/05-rules.md)
- Rule: Document the Transaction Boundary at the Orchestrator Level (transactional-actions/05-rules.md)
- Rule: Test `afterCommit` Actions Within an Active Transaction (transactional-actions/05-rules.md)
- Rule: Delegate Heavy `afterCommit` Callbacks to the Queue (transactional-actions/05-rules.md)
- Rule: Prevent Phantom Side Effects on Transaction Rollback (transactional-actions/05-rules.md)
- Rule: Sub-Actions Must Not Create Savepoints Inside Parent Transactions (transactional-actions/05-rules.md)
### Related Skills (from 06 skills)
- Compose Actions into a Workflow (action-composition/06-skills.md)
- Refactor an Over-Composed Action to a Service (action-composition/06-skills.md)
- Test afterCommit Behavior in Actions (transactional-actions/06-skills.md)

