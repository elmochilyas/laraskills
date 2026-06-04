# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Service Orchestration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Services Orchestrate, Actions Execute
- [ ] Verify: Keep Orchestration Methods Focused
- [ ] Verify: Handle Transactions at the Orchestration Level
- [ ] Verify: Return Aggregated Results
- [ ] Action classes for each step are injected via constructor
- [ ] `DB::transaction()` wraps the database-critical steps
- [ ] Deadlock retry configured (`DB::transaction(callback, 3)`) for high-contention operations
- [ ] External API calls, email, and slow I/O are OUTSIDE the transaction
- [ ] Result is aggregated and returned as a single result object or DTO
- [ ] Error handling is at orchestration level, not inside actions
- [ ] No step's implementation logic is inlined in the orchestration method
- [ ] Actions are called in the correct order with correct parameter passing
- [ ] Orchestration method is on a service, not in a controller
- [ ] Method handles one workflow only â€” no multi-workflow conditional dispatch

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Orchestration Flow
- [ ] Architecture guideline: class OrderService
- [ ] Architecture guideline: public function placeOrder(PlaceOrderData $data): OrderResult
- [ ] Architecture guideline: return DB::transaction(function () use ($data) {
- [ ] Architecture guideline: $inventory = $this->reserveInventory->handle($data->items);
- [ ] Architecture guideline: $payment = $this->chargePayment->handle($data->payment);
- [ ] Architecture guideline: $order = $this->createOrder->handle($data, $payment);
- [ ] Architecture guideline: return new OrderResult($order, $payment, $inventory);
- [ ] Architecture guideline: ### Orchestration vs Execution
- [ ] Architecture guideline: Service method (orchestrates)
- [ ] Architecture guideline: â†’ calls Action A (executes)
- [ ] Architecture guideline: â†’ calls Action B (executes)

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Services Orchestrate, Actions Execute
- [ ] Best practice: Keep Orchestration Methods Focused
- [ ] Best practice: Handle Transactions at the Orchestration Level
- [ ] Best practice: Return Aggregated Results
- [ ] Skill applied: Orchestrate a Multi-Step Workflow in a Service Method

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
- [ ] Action classes for each step are injected via constructor
- [ ] `DB::transaction()` wraps the database-critical steps
- [ ] Deadlock retry configured (`DB::transaction(callback, 3)`) for high-contention operations
- [ ] External API calls, email, and slow I/O are OUTSIDE the transaction
- [ ] Result is aggregated and returned as a single result object or DTO
- [ ] Error handling is at orchestration level, not inside actions
- [ ] No step's implementation logic is inlined in the orchestration method

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
- Orchestrate a Multi-Step Workflow in a Service Method
### Decision Trees (from 07)
- Service Orchestration vs Controller Orchestration
- Action Composition in Services vs Direct Implementation in Services
- Transaction Boundaries at Service Level vs Action Level
- Aggregated Result Objects vs Multiple Return Values
### Related Rules (from 06 skills)
- **Rule 1**: Services Orchestrate, Actions Execute
- **Rule 2**: Actions Must Not Call Services
- **Rule 3**: Keep Orchestration Methods Focused on One Workflow
- **Rule 4**: Handle Transactions at the Orchestration Level
- **Rule 5**: Return Aggregated Results from Orchestration
- **Rule 6**: Do Not Orchestrate in Controllers
- **Rule 7**: Do Not Over-Orchestrate Independent Operations
- **Rule 8**: Handle Workflow-Level Errors in Orchestration
### Related Skills (from 06 skills)
- Design a Service Class
- Manage Transaction Boundaries in Service Orchestration
- Refactor Orchestration from Controller to Service

