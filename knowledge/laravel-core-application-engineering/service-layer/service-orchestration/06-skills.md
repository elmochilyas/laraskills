# Skill: Orchestrate a Multi-Step Workflow in a Service Method

## Purpose
To coordinate multiple business operations (actions, sub-services) into a single cohesive workflow with correct transaction boundaries, error handling, and result aggregation.

## When To Use
- Multi-step business processes (place order → reserve inventory → charge payment)
- Workflows requiring atomicity across multiple database operations
- Processes with conditional branching or error recovery
- Operations that must be reusable across HTTP, CLI, and queue entry points

## When NOT To Use
- Single-step operations (call the action directly)
- Independent operations that don't need coordination
- Simple CRUD pass-through

## Prerequisites
- Service class already designed with constructor dependencies
- Action classes exist for each execution step
- Understanding of the workflow's success and failure paths

## Inputs
- Workflow definition (ordered list of steps)
- Action classes for each step
- Transaction and error handling requirements

## Workflow
1. Create a method on the service that represents the business workflow. Name it as a single business operation: `placeOrder()`, `processRefund()`, `cancelSubscription()`.
2. Identify the steps that require database atomicity. Wrap those steps in `DB::transaction()`. For high-contention operations, add deadlock retry: `DB::transaction(callback, 3)`.
3. Call each action class in sequence, passing the result of one step as input to the next if needed.
4. Aggregate results from all steps into a single result object or DTO. Return this aggregated result from the orchestration method.
5. Add error handling at the orchestration level: catch exceptions from individual actions, log failures, wrap in domain-specific exceptions, and re-throw. Do not handle errors inside individual actions.
6. Keep non-database operations (API calls, email sending) outside the transaction boundary to avoid long-held locks.
7. Verify the orchestration method does not inline the execution logic of any step — each step must be delegated to an action class.

## Validation Checklist
- [ ] Action classes for each step are injected via constructor
- [ ] `DB::transaction()` wraps the database-critical steps
- [ ] Deadlock retry configured (`DB::transaction(callback, 3)`) for high-contention operations
- [ ] External API calls, email, and slow I/O are OUTSIDE the transaction
- [ ] Result is aggregated and returned as a single result object or DTO
- [ ] Error handling is at orchestration level, not inside actions
- [ ] No step's implementation logic is inlined in the orchestration method
- [ ] Actions are called in the correct order with correct parameter passing
- [ ] Orchestration method is on a service, not in a controller
- [ ] Method handles one workflow only — no multi-workflow conditional dispatch

## Common Failures
- Orchestration logic in controllers instead of services
- Actions calling other services (inverted dependency direction)
- Missing transaction boundaries — partial writes on failure
- Including slow API calls inside the transaction scope
- Returning partial results (just the Order) instead of aggregated result
- Inlining step logic instead of delegating to actions
- Single method handling multiple unrelated workflows via parameter dispatch

## Decision Points
- Which steps belong inside the transaction? → Only those that require atomic database writes
- Retry count for deadlock? → 3 for high contention (orders, inventory, payments); 1 for reference data
- Closure-based or manual transaction? → Closure for linear workflows; manual for conditional commits/rollbacks
- What to return? → Aggregated result object containing all step outputs

## Performance Considerations
- Keep transaction scope minimal — only the writes that need atomicity
- External API calls inside transactions hold locks for network latency — always exclude
- Deadlock retry adds latency on contention but prevents 500 errors
- Orchestration methods should be idempotent when retried

## Security Considerations
- Authorization should be checked before the orchestration method is called (controller/middleware level)
- The orchestration method should not receive raw request data — use DTOs
- Transaction callbacks must not have side effects visible to unauthorized users

## Related Rules
- **Rule 1**: Services Orchestrate, Actions Execute
- **Rule 2**: Actions Must Not Call Services
- **Rule 3**: Keep Orchestration Methods Focused on One Workflow
- **Rule 4**: Handle Transactions at the Orchestration Level
- **Rule 5**: Return Aggregated Results from Orchestration
- **Rule 6**: Do Not Orchestrate in Controllers
- **Rule 7**: Do Not Over-Orchestrate Independent Operations
- **Rule 8**: Handle Workflow-Level Errors in Orchestration

## Related Skills
- Design a Service Class
- Manage Transaction Boundaries in Service Orchestration
- Refactor Orchestration from Controller to Service

## Success Criteria
- Multi-step workflow is encapsulated in a single service method
- Each step is delegated to an action class
- Transaction boundary is correct and minimal
- Result is aggregated and typed
- Workflow is callable from HTTP, CLI, and queue without modification
