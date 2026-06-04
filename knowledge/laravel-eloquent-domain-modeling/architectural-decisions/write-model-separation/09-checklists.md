# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** Write Model Separation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Performance: - Write models should avoid expensive JOINs and denormalized queries (those b...
- [ ] Performance: - Command handlers are ideal for queue dispatch â€” write-heavy operations ca...
- [ ] Performance: - Optimistic concurrency adds a version-check query per write â€” negligible ...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Command DTOs in `App\Commands\{Domain}\*Command.php`
- [ ] Architecture guideline: - Handlers in `App\Handlers\{Domain}\*Handler.php`
- [ ] Architecture guideline: - Write models should not have public query methods (finders, scopes) â€” those belong on read mo...
- [ ] Architecture guideline: - Command handlers return `void` or a simple success signal â€” not data designed for display
- [ ] Architecture guideline: - Use Laravel's Bus for command dispatch: `$this->bus->dispatch(new CancelOrderCommand(...))`
- [ ] Decision: Command Handler vs Direct Model Mutation - ensure correct choice is made
- [ ] Decision: Model Invariants vs Handler Invariants - ensure correct choice is made
- [ ] Decision: Optimistic Concurrency vs Pessimistic Locking - ensure correct choice is made
- [ ] Decision: Idempotent Handler vs Non-Idempotent Handler - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Write models should avoid expensive JOINs and denormalized queries (those belong in reads)
- [ ] - Command handlers are ideal for queue dispatch â€” write-heavy operations can be async
- [ ] - Optimistic concurrency adds a version-check query per write â€” negligible for most applications
- [ ] - Event-sourced write models append only â€” significantly faster than UPDATE-heavy workloads

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Log every command with its input, timestamp, and user for audit trail
- [ ] - Command validation happens in the handler or a dedicated validator; never trust the client
- [ ] - Use `Model::lockForUpdate()` for pessimistic locking on high-value transactions (financial operations)

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
- [ ] Prevent: Write Model Anemia (All Logic in Handler) -- apply preferred alternative
    - [ ] Handler contains `if` statements about model state
    - [ ] Handler sets model attributes directly
    - [ ] Write model has no domain methods
- [ ] Prevent: Command Explosion (100+ Commands for CRUD) -- apply preferred alternative
    - [ ] Command has 1-2 fields matching model columns directly
    - [ ] Handler under 10 lines with no invariants
    - [ ] No transaction, no locking, no side effects
- [ ] Prevent: Stale Write Model (Lost Updates Without Concurrency) -- apply preferred alternative
    - [ ] Write model table has no version column
    - [ ] Handler doesn't check for concurrent modifications
    - [ ] No `lockForUpdate()` for financial operations
- [ ] Prevent: Partial Command (Handler Without Transaction) -- apply preferred alternative
    - [ ] Handler performs 2+ writes without `DB::transaction()`
    - [ ] Handler dispatches events without `DB::afterCommit()`
    - [ ] Handler calls external services after database writes
- [ ] Prevent: Handler Returns Display Data (Mixing Read and Write) -- apply preferred alternative
    - [ ] Handler returns formatted arrays or serialized models
    - [ ] Handler eager-loads relations for display
    - [ ] Handler return type is `array` or a JSON Resource

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
- Command Handler vs Direct Model Mutation
- Model Invariants vs Handler Invariants
- Optimistic Concurrency vs Pessimistic Locking
- Idempotent Handler vs Non-Idempotent Handler
### Anti-Patterns (from 08)
- Write Model Anemia (All Logic in Handler)
- Command Explosion (100+ Commands for CRUD)
- Stale Write Model (Lost Updates Without Concurrency)
- Partial Command (Handler Without Transaction)
- Handler Returns Display Data (Mixing Read and Write)

