# Skill: Implement the Saga Pattern for Distributed Integration Transactions

## Purpose
Implement the saga pattern (choreography or orchestration) for distributed transactions across multiple external services, with compensating actions for rollback.

## When To Use
- Distributed operations spanning multiple external services
- Financial transactions across multiple systems
- Long-running business processes with multiple API calls
- Ensuring data consistency without distributed transactions

## When NOT To Use
- Single-service operations
- Simple request-response patterns
- When eventual consistency is unacceptable

## Prerequisites
- Event system or orchestration mechanism
- Compensation logic per operation

## Workflow
1. Identify saga participants and operations
2. Choose pattern: choreography (events) or orchestration (coordinator)
3. Implement local transactions per participant
4. Implement compensating transactions for rollback
5. Define saga state machine: pending, completed, compensating, compensated
6. For orchestration: create saga coordinator class
7. Handle failures with compensation triggers
8. Test saga rollback scenarios end-to-end

## Validation Checklist
- [ ] Saga participants and operations identified
- [ ] Pattern chosen (choreography/orchestration)
- [ ] Local transactions implemented per participant
- [ ] Compensating transactions defined per operation
- [ ] Saga state machine tracks progress
- [ ] Compensation triggered on failure
- [ ] Rollback scenarios tested end-to-end
