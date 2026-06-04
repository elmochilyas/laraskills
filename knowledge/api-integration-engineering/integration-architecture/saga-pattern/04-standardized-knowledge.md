# ECC Standardized Knowledge — Saga Pattern

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | event-sourcing-integrations |
| Knowledge Unit ID | ku-06 |
| Knowledge Unit | Saga Pattern |
| Difficulty | Expert |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K034 |

## Overview (Engineering Value)
The saga pattern manages distributed transactions across multiple services triggered by webhook and API integration events. Instead of a distributed ACID transaction, a saga breaks the operation into a sequence of local transactions, each with a compensating action for rollback. For example, a webhook indicating "payment received" triggers: create order, charge payment, send email, update inventory. If inventory update fails, compensation charges back the payment. Event sourcing provides the ideal foundation: each saga step is a domain event, compensation is also an event, and the event store provides the complete audit trail.

## Core Concepts
- **Choreography-Based Saga**: Each service produces events that trigger the next step; no central coordinator
- **Orchestration-Based Saga**: Central orchestrator (state machine) coordinates step execution and compensation
- **Compensating Events**: Events that undo the effects of a previous step (not business reversal, technical rollback)
- **Saga Log**: Event-sourced record of all saga steps for audit and recovery
- **Failure Recovery**: On step failure, saga replays events to trigger compensation for all completed steps

## When To Use
- Multi-step business processes triggered by webhooks (payment → order → fulfillment)
- Systems where eventual consistency is acceptable but data integrity is critical
- Distributed operations spanning multiple external APIs with partial failure risks
- Compliance-heavy environments needing complete saga audit trails

## When NOT To Use
- Single-step webhook processing (no saga needed)
- Systems requiring strong ACID transactions across services
- Simple request-response patterns without side effects

## Best Practices
- Prefer choreography for simplicity when services are loosely coupled
- Use orchestration for complex workflows with branching and conditional compensation
- Always define compensating actions before implementing forward actions
- Test compensation paths as rigorously as forward paths

## Architecture Guidelines
- Implement saga steps as event-sourced domain events
- Orchestrator as Laravel job with state machine for step tracking
- Compensations as separate event handlers triggered by failure events
- Saga log in event store for full audit trail and recovery
- Timeout handling: saga step timeout triggers compensation for hung operations

## Performance Considerations
- Saga overhead: multiple events + compensation logic per step
- Event store write per saga step: ~5ms per step
- Compensation delay: increases total operation time on failure
- Orchestrator state machine runs in-memory with persistence to event store

## Related Topics
- **Prerequisites**: Event sourcing, CQRS, distributed systems
- **Closely Related**: Outbox pattern (ku-04), inbox pattern (ku-05), async event mapping (ku-07)
- **Advanced**: Orchestration state machines, temporal workflows
- **Cross-Domain**: Distributed transactions, eventual consistency, domain events

## Verification
- [ ] Each saga step recorded as immutable event
- [ ] Compensating actions defined for each step
- [ ] Saga log shows complete step history and outcomes
- [ ] Failure of any step triggers compensation for all completed steps
- [ ] Idle saga timeouts trigger compensation
