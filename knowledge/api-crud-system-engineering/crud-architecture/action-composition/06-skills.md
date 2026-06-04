# Skill: Compose Actions for Complex Workflows

## Purpose
Build complex business workflows by composing multiple action classes — a coordinator action calls several sub-actions in sequence, passing results forward, with transaction management and error handling.

## When To Use
- Complex workflows composed of multiple discrete business operations
- When sub-actions are independently useful and reused across workflows
- When coordination logic is separate from operation logic
- When workflow needs testing at both unit and integration level

## When NOT To Use
- Simple operations that fit in a single action class
- When sub-actions only exist for one coordinator and are never reused
- Composition deeper than 3-4 levels (use service or state machine instead)
- When composition relies on shared mutable state between actions

## Prerequisites
- Action class design patterns
- Dependency injection

## Inputs
- Workflow step sequence
- Sub-action class specifications

## Workflow
1. Create coordinator action that sequences sub-actions — pure orchestration, no business logic
2. Limit composition depth to 3-4 levels maximum
3. Pass context through method parameters — never shared mutable state or properties
4. Ensure each sub-action is independently testable without the coordinator
5. Wrap multi-step operations in `DB::transaction()` at coordinator level
6. Implement error handling at coordinator level — rollback or compensating actions for partial failure
7. Add logging at coordinator level to trace workflow execution
8. Test coordinators by mocking sub-actions and verifying call sequence

## Validation Checklist
- [ ] Coordinator delegates to sub-actions, not inline business logic
- [ ] Each sub-action independently testable without coordinator
- [ ] Composition depth 3-4 levels or fewer
- [ ] Context passed through method parameters, not shared state
- [ ] Error handling at coordinator level for partial failure
- [ ] Logging at coordinator level
- [ ] Sub-actions reusable across multiple coordinators

## Common Failures
- Coordinator doing sub-action work — extract distinct operations
- Shared mutable state between actions — pass data explicitly
- No error handling at composition level — use transactions
- Composition without reusability — sub-actions should be independently useful

## Decision Points
- Coordinator action vs service — action for within-domain, service for cross-domain
- Sequential vs conditional composition — sequential for ordered steps, conditional for branches
- Transaction vs compensation — DB transaction for DB operations, compensation for external APIs

## Performance Considerations
- Each composed sub-action adds ~0.01ms container resolution + method call
- Database operations dominate — composition overhead irrelevant
- Container resolves leaf dependencies once, shares where possible

## Security Considerations
- Coordinator must pass authenticated actor explicitly to sub-actions needing authorization
- Transaction rollback prevents partial writes leaving sensitive data inconsistent
- Logging must not leak sensitive DTO data in workflow traces

## Related Rules
- Coordinator Delegates All Business Logic
- Limit Composition Depth to 3-4 Levels
- Pass Context Through Method Parameters Only
- Ensure Each Sub-Action Is Independently Testable
- Add Error Handling at the Coordinator Level
- Test Coordinators with Mocked Sub-Actions

## Related Skills
- Action Class Design — single action class patterns
- Service Orchestration — cross-domain coordination
- Transactional Actions — transaction boundaries in composed workflows

## Success Criteria
- Coordinator sequences sub-actions without inline business logic
- Each sub-action is independently testable
- Error handling with rollback for multi-step workflows
- Composition stays within 3-4 levels
- Sub-actions are reusable across different coordinators