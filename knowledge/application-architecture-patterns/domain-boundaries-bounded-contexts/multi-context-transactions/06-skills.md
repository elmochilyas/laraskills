# Skill: Implement Sagas for Multi-Context Transactions

## Purpose
Use the Saga pattern for operations spanning multiple bounded contexts. Use ACID within a context, Sagas across contexts. Include compensating transactions for every step. Choose choreographed sagas for simple workflows and orchestrated sagas for complex ones. Persist saga state for recovery.

## When To Use
- Operation spans multiple bounded contexts and must be "eventually consistent"

## When NOT To Use
- Single-context operations (use ACID within a context)
- Using distributed ACID across contexts (expensive, fragile)

## Prerequisites
- Understanding of domain events
- Bounded contexts with event dispatching capability

## Inputs
- Cross-context workflow steps
- Compensating transaction logic per step

## Workflow
1. **Use ACID within a context, Sagas across contexts.** Within a single context, use standard `DB::transaction()`. Use the Saga pattern for operations spanning multiple contexts.

2. **Always include compensating transactions for every saga step.** Every step must have a compensating transaction that can undo its effects. Without compensation, a failed step leaves the system inconsistent.

3. **Choose choreographed sagas for simple workflows.** Each step publishes an event that triggers the next. Decentralized, good for independent teams. Use for simple linear flows.

4. **Choose orchestrated sagas for complex workflows.** Use a central saga manager (coordinator) for workflows with multiple failure paths, branches, parallel steps, or complex compensation logic.

5. **Persist saga state for recovery.** Store saga type, status, current step, and payload in a `saga_states` table. In-memory saga state is lost on crash.

6. **Design compensating transactions to be idempotent.** Use idempotency keys or status checks. A saga may retry compensation if the first attempt fails.

7. **Use the Outbox pattern to guarantee event delivery for saga steps.** Store events atomically with the database transaction. A separate publisher dispatches them reliably.

8. **Time-box saga steps with timeouts.** Set timeouts on each step and mark the saga as failed if a step does not complete within the expected window.

9. **Do not use sagas for single-context operations.** Use standard ACID transactions where available.

## Validation Checklist
- [ ] ACID used within context, Sagas across contexts
- [ ] Compensating transactions exist for each step
- [ ] Saga state is persisted for recovery
- [ ] Choreographed/orchestrated choice is documented
- [ ] No distributed ACID transactions across contexts
- [ ] Compensating transactions are idempotent
- [ ] Outbox pattern ensures reliable event delivery
- [ ] Saga steps have timeouts configured

## Common Failures
- **Using ACID across contexts.** Attempting distributed transaction across context databases — expensive and fragile.
- **No compensating transactions.** Saga without compensation — inconsistent state on failure.
- **Sagas for single-context operations.** Using saga pattern where ACID suffices — unnecessary complexity.

## Decision Points
- **Choreographed vs Orchestrated Saga?** Choreographed for simple linear workflows. Orchestrated for complex workflows with multiple failure paths, branches, or parallel steps.

## Performance Considerations
- Sagas are eventually consistent — they don't hold locks across contexts.
- Compensating transactions add latency on failure paths but don't affect success path performance.

## Security Considerations
- Compensating transactions must be authorized appropriately. A saga attempting to refund a payment must have the right credentials.
- Idempotency prevents duplicate financial operations.

## Related Rules
- Rule: Use ACID within a context, Sagas across contexts (DBC-11/05-rules.md)
- Rule: Always include compensating transactions for every saga step (DBC-11/05-rules.md)
- Rule: Use choreographed sagas for simple workflows (DBC-11/05-rules.md)
- Rule: Use orchestrated sagas for complex workflows (DBC-11/05-rules.md)
- Rule: Persist saga state for recovery from failures (DBC-11/05-rules.md)
- Rule: Design compensating transactions to be idempotent (DBC-11/05-rules.md)
- Rule: Use the Outbox pattern to guarantee event delivery (DBC-11/05-rules.md)
- Rule: Time-box saga steps with timeouts (DBC-11/05-rules.md)
- Rule: Do not use sagas for single-context operations (DBC-11/05-rules.md)

## Related Skills
- Manage Eventual Consistency (DBC-12/06-skills.md)
- Implement Domain Events (CPC-02/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)
- Implement Eventual Consistency (DBC-12/06-skills.md)
- Design Event Sourcing (CPC-09/06-skills.md)

## Success Criteria
- ACID transactions used within a single context; Sagas for cross-context operations.
- Every saga step has an idempotent compensating transaction.
- Saga state is persisted in database for crash recovery.
- Choreographed sagas used for simple workflows; orchestrated for complex ones.
- Outbox pattern guarantees event delivery for saga steps.
- Saga steps are time-boxed with timeout-based failure detection.
