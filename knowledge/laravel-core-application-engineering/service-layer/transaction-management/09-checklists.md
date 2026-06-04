# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Transaction Management
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Set Transactions at the Service Level
- [ ] Verify: Handle Deadlocks with Retry
- [ ] Verify: Use Manual Control for Complex Workflows
- [ ] Verify: Avoid Long-Running Transactions
- [ ] Transaction boundary is in the service method, not in controllers or actions
- [ ] Actions called within the transaction do NOT call `DB::transaction()`, `beginTransaction()`, `commit()`, or `rollBack()`
- [ ] Non-database operations (API calls, email) are OUTSIDE the transaction
- [ ] High-contention operations use `DB::transaction(callback, 3)` for deadlock retry
- [ ] Transaction scope is minimal â€” only the writes that need atomicity
- [ ] Callback is idempotent â€” safe to execute multiple times on deadlock retry
- [ ] On rollback, an exception is thrown or failure result is returned â€” no silent swallowing
- [ ] Simple linear workflows use closure-based `transaction()`; complex conditional workflows use manual control
- [ ] No transaction-only services (services whose only purpose is wrapping `DB::transaction()`)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Simple Transaction
- [ ] Architecture guideline: DB::transaction(function () {
- [ ] Architecture guideline: $order = Order::create($data);
- [ ] Architecture guideline: $payment = Payment::create($data);
- [ ] Architecture guideline: Inventory::decrement($data->items);
- [ ] Architecture guideline: ### Transaction with Retry
- [ ] Architecture guideline: DB::transaction(function () use ($data) {
- [ ] Architecture guideline: $order = $this->orderService->place($data);
- [ ] Architecture guideline: $this->inventoryService->reserve($data->items);
- [ ] Architecture guideline: }, 3); // Retry up to 3 times on deadlock
- [ ] Architecture guideline: ### Manual Transaction
- [ ] Architecture guideline: DB::beginTransaction();

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Set Transactions at the Service Level
- [ ] Best practice: Handle Deadlocks with Retry
- [ ] Best practice: Use Manual Control for Complex Workflows
- [ ] Best practice: Avoid Long-Running Transactions
- [ ] Skill applied: Manage Transaction Boundaries in Service Orchestration

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
- [ ] Transaction boundary is in the service method, not in controllers or actions
- [ ] Actions called within the transaction do NOT call `DB::transaction()`, `beginTransaction()`, `commit()`, or `rollBack()`
- [ ] Non-database operations (API calls, email) are OUTSIDE the transaction
- [ ] High-contention operations use `DB::transaction(callback, 3)` for deadlock retry
- [ ] Transaction scope is minimal â€” only the writes that need atomicity
- [ ] Callback is idempotent â€” safe to execute multiple times on deadlock retry
- [ ] On rollback, an exception is thrown or failure result is returned â€” no silent swallowing

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
- Manage Transaction Boundaries in Service Orchestration
### Decision Trees (from 07)
- Service-Level Transactions vs Action-Level Transactions
- Closure-Based Transactions vs Manual beginTransaction/commit/rollBack
- Deadlock Retry Configuration vs Single-Attempt Transactions
- External API Calls Inside vs Outside Transaction Boundaries
### Related Rules (from 06 skills)
- **Rule 1**: Set Transaction Boundaries at the Service Orchestration Level
- **Rule 2**: Actions Must Not Manage Their Own Transactions
- **Rule 3**: Use Deadlock Retry for High-Contention Operations
- **Rule 4**: Keep Transaction Scope Minimal
- **Rule 5**: Use Manual Transaction Control for Complex Workflows
- **Rule 6**: Retry Callbacks Must Be Idempotent
- **Rule 7**: Do Not Create Transaction-Only Services
- **Rule 8**: Handle Transaction Rollback Correctly in Orchestration
### Related Skills (from 06 skills)
- Orchestrate a Multi-Step Workflow in a Service Method
- Design a Stateless Service

