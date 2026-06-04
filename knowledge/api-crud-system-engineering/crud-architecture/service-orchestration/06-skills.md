# Skill: Orchestrate Services for Complex Workflows

## Purpose
Coordinate multiple services, actions, and external systems to complete a complex cross-domain business workflow — managing sequence, transaction boundaries, error handling, and compensation.

## When To Use
- Complex cross-domain workflows involving 3+ services (checkout, onboarding, refund)
- When workflow sequence and error handling must be centralized in one class
- When auditability requires a single place to trace the workflow
- For coordinating operations that span multiple bounded contexts

## When NOT To Use
- Simple 2-step operations — service calling 2 sub-methods is not orchestration
- Intra-domain workflows handled by action composition
- When orchestrator would coordinate only 1-2 services
- When orchestration logic can be replaced by event-driven choreography

## Prerequisites
- Service class design
- Transaction management
- Error handling patterns

## Inputs
- Workflow sequence specification
- Sub-service interface contracts

## Workflow
1. Create orchestrator service for workflows involving 3+ services
2. Keep orchestrator pure coordination — all domain logic in sub-services, never inline
3. Implement database transaction wrapping for atomicity across steps
4. Add compensation actions for external system calls (payment, email) — database rollback can't undo API calls
5. Add structured logging at orchestrator level to trace execution, timing, and failure points
6. Test orchestrators by mocking all sub-services and asserting call sequence
7. Handle errors at orchestrator level — rollback or compensating actions for partial failure
8. Place orchestrators at application layer — `App\Orchestrators\` or `App\Services\Orchestration\`

## Validation Checklist
- [ ] Orchestrator is pure coordination — no domain logic inline
- [ ] Orchestrator handles 3+ services (otherwise use simpler pattern)
- [ ] Error handling with rollback or compensating actions
- [ ] External system calls have compensation paths
- [ ] Logging at orchestrator level
- [ ] Orchestrator testable with mocked sub-services
- [ ] Orchestrator at application layer, not domain layer

## Common Failures
- Orchestrator doing sub-service work — adding domain logic to orchestrator
- Over-orchestration — creating orchestrators for every 2-step operation
- Orchestrator without error handling — assuming sub-services never fail
- Orchestrator god class — coordinating 8+ services with accumulated conditional logic

## Decision Points
- Orchestration vs composition — orchestration for cross-domain (3+ services), composition for within-domain
- Sequential vs conditional orchestration — sequential for ordered, conditional for branching
- Database transaction vs saga — transaction for atomic DB operations, saga for long-running workflows

## Performance Considerations
- Orchestration adds no direct performance overhead — just method calls
- Performance profile is sum of all sub-service operations
- For slow sub-operations, consider queue dispatching from within orchestrator
- Long-running orchestrations should use state machines or saga patterns

## Security Considerations
- Authorization checks in sub-services, not orchestrator — orchestrator should not bypass security
- Logging at orchestrator must not leak sensitive DTO data
- Compensation actions for payment reversals must include audit trails
- Financial workflow orchestrators must have explicit rollback and escalation paths

## Related Rules
- Orchestrators Must Be Pure Coordination — No Domain Logic
- Only Create Orchestrators for 3+ Services
- Always Implement Error Handling and Compensation Paths
- Test Orchestrators with Mocked Sub-Services
- Add Logging at the Orchestrator Level

## Related Skills
- Action Composition — lighter alternative within a domain
- Service Class Design — service patterns orchestrators coordinate
- Transactional Actions — transaction boundaries
- Saga Pattern — long-running orchestration with compensation

## Success Criteria
- Orchestrator coordinates 3+ services with no inline domain logic
- Error handling with compensation paths for all external calls
- Transaction atomicity across multi-step operations
- Logging enables tracing entire workflow execution
- Sub-services remain independently testable