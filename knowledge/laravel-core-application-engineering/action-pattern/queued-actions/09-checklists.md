# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Queued Actions
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Let the Caller Decide Sync vs Async Execution
- [ ] Enforce: Override `queueMethod()` When Using Non-Standard Method Names
- [ ] Enforce: Configure Predictable Queues on the Action, Context-Dependent Queues via Fluent API
- [ ] Enforce: Log the Action Class Name in Queue Monitoring
- [ ] Enforce: Drain Queues Before Deploying Incompatible Action Changes
- [ ] Enforce: Do Not Use Queueable Actions for Operations That Must Return a Result
- [ ] Enforce: Do Not Bind Queueable Actions as Singletons
- [ ] Enforce: Do Not Pass Non-Serializable Parameters to Queued Action Methods
- [ ] `use QueueableAction;` added to the action class
- [ ] `queueMethod()` is overridden if using `handle()` (not `execute()`)
- [ ] `public string $queue` declared if the action routes to a specific queue
- [ ] All method parameters are serializable (no resources, closures)
- [ ] Action is NOT bound as a singleton
- [ ] Action is stateless (no mutable properties set during execution)
- [ ] Callers can choose sync (`->execute()`) or async (`->onQueue()->execute()`)
- [ ] Queue monitoring is configured to log the action class name
- [ ] Tests use `QueueableActionFake` for dispatch verification

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **QueueableAction trait** reduces ceremony at the cost of a Spatie package dependency. For team...
- [ ] Architecture guideline: - **ActionJob stores class name, not instance.** Constructor DI is preserved because the action i...
- [ ] Architecture guideline: - **Worker-side rehydration** means the action gets fresh database connections, fresh config, and...
- [ ] Architecture guideline: - **Anonymous class allocation** per `onQueue()` call is negligible for web requests but measurab...
- [ ] Architecture guideline: - **Separate queues for different action types** to prevent head-of-line blocking (e.g., `'mail'`...
- [ ] Architecture guideline: - **Serialization of Eloquent models** via `SerializesModels` serializes only the class name and ...
- [ ] Decision: Queued Action vs Job Wrapper Class - ensure correct choice is made
- [ ] Decision: Synchronous vs Asynchronous Execution - ensure correct choice is made
- [ ] Decision: Queue Routing â€” Class-Level vs Call-Site Configuration - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Let the Caller Decide Sync vs Async Execution
- [ ] Apply rule: Override `queueMethod()` When Using Non-Standard Method Names
- [ ] Apply rule: Configure Predictable Queues on the Action, Context-Dependent Queues via Fluent API
- [ ] Apply rule: Log the Action Class Name in Queue Monitoring
- [ ] Apply rule: Drain Queues Before Deploying Incompatible Action Changes
- [ ] Apply rule: Do Not Use Queueable Actions for Operations That Must Return a Result
- [ ] Apply rule: Do Not Bind Queueable Actions as Singletons
- [ ] Apply rule: Do Not Pass Non-Serializable Parameters to Queued Action Methods
- [ ] Skill applied: Make an Action Queueable with Spatie QueueableAction
- [ ] Skill applied: Drain Queues Before Deploying Incompatible Action Changes

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
- [ ] `use QueueableAction;` added to the action class
- [ ] `queueMethod()` is overridden if using `handle()` (not `execute()`)
- [ ] `public string $queue` declared if the action routes to a specific queue
- [ ] All method parameters are serializable (no resources, closures)
- [ ] Action is NOT bound as a singleton
- [ ] Action is stateless (no mutable properties set during execution)
- [ ] Callers can choose sync (`->execute()`) or async (`->onQueue()->execute()`)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Hardcoded Async Dispatch Inside Action -- apply preferred alternative
    - [ ] Grep for `dispatch(` in `App\Actions\` files
    - [ ] Check if actions have both sync and async code paths
    - [ ] Verify callers can choose execution mode
- [ ] Prevent: Constructor Mixed Dependencies -- apply preferred alternative
    - [ ] Does the constructor mix service type-hints with data type-hints?
    - [ ] Does the action work in HTTP but fail on queue workers?

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
- Let the Caller Decide Sync vs Async Execution
- Override `queueMethod()` When Using Non-Standard Method Names
- Configure Predictable Queues on the Action, Context-Dependent Queues via Fluent API
- Log the Action Class Name in Queue Monitoring
- Drain Queues Before Deploying Incompatible Action Changes
- Do Not Use Queueable Actions for Operations That Must Return a Result
- Do Not Bind Queueable Actions as Singletons
- Do Not Pass Non-Serializable Parameters to Queued Action Methods
### Skills (from 06)
- Make an Action Queueable with Spatie QueueableAction
- Drain Queues Before Deploying Incompatible Action Changes
### Decision Trees (from 07)
- Queued Action vs Job Wrapper Class
- Synchronous vs Asynchronous Execution
- Queue Routing â€” Class-Level vs Call-Site Configuration
### Anti-Patterns (from 08)
- Hardcoded Async Dispatch Inside Action
- Constructor Mixed Dependencies
### Related Rules (from 06 skills)
- Rule: Let the Caller Decide Sync vs Async Execution (queued-actions/05-rules.md)
- Rule: Override `queueMethod()` When Using Non-Standard Method Names (queued-actions/05-rules.md)
- Rule: Configure Predictable Queues on the Action, Context-Dependent Queues via Fluent API (queued-actions/05-rules.md)
- Rule: Log the Action Class Name in Queue Monitoring (queued-actions/05-rules.md)
- Rule: Drain Queues Before Deploying Incompatible Action Changes (queued-actions/05-rules.md)
- Rule: Do Not Use Queueable Actions for Operations That Must Return a Result (queued-actions/05-rules.md)
- Rule: Do Not Bind Queueable Actions as Singletons (queued-actions/05-rules.md)
- Rule: Do Not Pass Non-Serializable Parameters to Queued Action Methods (queued-actions/05-rules.md)
### Related Skills (from 06 skills)
- Test a Queued Action with QueueableActionFake (queued-actions/06-skills.md)
- Write a Transaction-Safe Orchestrator with afterCommit Side Effects (transactional-actions/06-skills.md)
- Drain Queues Before Deploying Incompatible Action Changes (queued-actions/06-skills.md)

