# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Action Composition
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Limit Composition Depth to 3 Action Dependencies
- [ ] Enforce: Sub-Actions Must Not Manage Their Own Transactions
- [ ] Enforce: Pass Data Through Return Values, Not Shared Mutable State
- [ ] Enforce: Make Sub-Action Execution Order Explicit
- [ ] Enforce: Prevent Circular Dependencies Between Actions
- [ ] Enforce: Test Each Action Independently with Mocked Sub-Actions
- [ ] Enforce: Do Not Compose Actions with Shared Singleton Mutable State
- [ ] Orchestrating action has at most 3 action constructor dependencies
- [ ] Sub-action execution order is explicit in the method body (not implied by constructor order)
- [ ] Data flows between sub-actions through return values, not shared mutable state
- [ ] No sub-action manages its own transaction
- [ ] No circular dependencies exist between composed actions
- [ ] Composition chain is documented with a comment in the orchestrating method
- [ ] Each sub-action has its own independent test class
- [ ] Orchestrator tests use mocked sub-actions with ordered expectations

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Composition depth limit:** Maximum 3-4 action dependencies per action class. At 4+, extract t...
- [ ] Architecture guideline: - **Transaction ownership:** The outermost orchestrator owns the transaction. Sub-actions must no...
- [ ] Architecture guideline: - **Circular dependency detection:** Detect through code review â€” the container detects circula...
- [ ] Architecture guideline: - **Queueable composition:** An action that dispatches a sub-action asynchronously via `onQueue()...
- [ ] Architecture guideline: - **Singleton safety:** Ensure all composed actions are stateless â€” no mutable properties set d...
- [ ] Architecture guideline: - **Test strategy:** Unit tests for sub-actions with mocked dependencies; orchestration tests for...
- [ ] Decision: Action Composition Depth â€” Action vs Service Orchestrator - ensure correct choice is made
- [ ] Decision: Data Flow Between Actions â€” Return Values vs Shared State - ensure correct choice is made
- [ ] Decision: Transaction Ownership â€” Action vs Orchestrator - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Limit Composition Depth to 3 Action Dependencies
- [ ] Apply rule: Sub-Actions Must Not Manage Their Own Transactions
- [ ] Apply rule: Pass Data Through Return Values, Not Shared Mutable State
- [ ] Apply rule: Make Sub-Action Execution Order Explicit
- [ ] Apply rule: Prevent Circular Dependencies Between Actions
- [ ] Apply rule: Test Each Action Independently with Mocked Sub-Actions
- [ ] Apply rule: Do Not Compose Actions with Shared Singleton Mutable State
- [ ] Skill applied: Compose Actions into a Workflow
- [ ] Skill applied: Refactor an Over-Composed Action to a Service
- [ ] Skill applied: Test an Orchestrating Service with Mocked Sub-Actions

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
- [ ] Orchestrating action has at most 3 action constructor dependencies
- [ ] Sub-action execution order is explicit in the method body (not implied by constructor order)
- [ ] Data flows between sub-actions through return values, not shared mutable state
- [ ] No sub-action manages its own transaction
- [ ] No circular dependencies exist between composed actions
- [ ] Composition chain is documented with a comment in the orchestrating method
- [ ] Each sub-action has its own independent test class

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Tower of Actions (Over-Composition) -- apply preferred alternative
    - [ ] Count action constructor parameters (threshold: 4)
    - [ ] Measure `handle()` line count (threshold: 50)
    - [ ] Trace call graph depth
- [ ] Prevent: Action with Self-Managed Transaction Inside Composition -- apply preferred alternative
    - [ ] Grep `DB::transaction()` in all `App\Actions\` files
    - [ ] Grep `DB::beginTransaction` in all action files
    - [ ] Check if actions are injected into other classes (if yes, transactions are forbidden)
- [ ] Prevent: Shared Mutable State Between Composed Actions -- apply preferred alternative
    - [ ] Grep for `static::$` or `self::$` writes in action files
    - [ ] Grep for singleton service writes in action `handle()` methods
    - [ ] Check for execution order assumptions in test setup
- [ ] Prevent: Implicit Execution Order via Constructor Parameter Order -- apply preferred alternative
    - [ ] Are there sub-actions declared in the constructor but not called in `handle()`?
    - [ ] Is the call order in the method body different from the constructor declaration order?
- [ ] Prevent: Circular Composition Dependency -- apply preferred alternative
    - [ ] Trace all action dependencies â€” does any path lead back to the starting action?
    - [ ] Has a `BindingResolutionException` occurred during resolution?

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
- Limit Composition Depth to 3 Action Dependencies
- Sub-Actions Must Not Manage Their Own Transactions
- Pass Data Through Return Values, Not Shared Mutable State
- Make Sub-Action Execution Order Explicit
- Prevent Circular Dependencies Between Actions
- Test Each Action Independently with Mocked Sub-Actions
- Do Not Compose Actions with Shared Singleton Mutable State
### Skills (from 06)
- Compose Actions into a Workflow
- Refactor an Over-Composed Action to a Service
- Test an Orchestrating Service with Mocked Sub-Actions
### Decision Trees (from 07)
- Action Composition Depth â€” Action vs Service Orchestrator
- Data Flow Between Actions â€” Return Values vs Shared State
- Transaction Ownership â€” Action vs Orchestrator
### Anti-Patterns (from 08)
- Tower of Actions (Over-Composition)
- Action with Self-Managed Transaction Inside Composition
- Shared Mutable State Between Composed Actions
- Implicit Execution Order via Constructor Parameter Order
- Circular Composition Dependency
### Related Rules (from 06 skills)
- Rule: Limit Composition Depth to 3 Action Dependencies (action-composition/05-rules.md)
- Rule: Sub-Actions Must Not Manage Their Own Transactions (action-composition/05-rules.md)
- Rule: Pass Data Through Return Values, Not Shared Mutable State (action-composition/05-rules.md)
- Rule: Make Sub-Action Execution Order Explicit (action-composition/05-rules.md)
- Rule: Prevent Circular Dependencies Between Actions (action-composition/05-rules.md)
- Rule: Test Each Action Independently with Mocked Sub-Actions (action-composition/05-rules.md)
- Rule: Do Not Compose Actions with Shared Singleton Mutable State (action-composition/05-rules.md)
### Related Skills (from 06 skills)
- Refactor an Over-Composed Action to a Service (action-composition/06-skills.md)
- Write a Transaction-Safe Orchestrator with afterCommit Side Effects (transactional-actions/06-skills.md)
- Choose the Right Pattern for a Business Operation (action-vs-service-vs-usecase/06-skills.md)

