# Skill: Implement Bridge/Adapter Pattern at Context Boundaries

## Purpose
Define a bridge interface for every synchronous cross-context call. Place the adapter in the producer context. Define the bridge in a shared kernel. Use tiered adapters for different environments. Include both data DTOs and operation contracts in the bridge.

## When To Use
- Every cross-context synchronous call
- Swapping implementations (fake vs real, dev vs production)
- Testing with mock bridges

## When NOT To Use
- Within a single context (interfaces are internal)
- Trivial delegation where producer's interface is already the contract

## Prerequisites
- Interface contracts defined (CPC-01)
- Anti-corruption layer understanding (DBC-04)

## Inputs
- Cross-context synchronous call requirements
- Producer context APIs

## Workflow
1. **Use a bridge interface for every cross-context synchronous call.** Never directly instantiate or import classes from another context. The consumer depends only on the bridge interface.

2. **Place the adapter in the producer context.** The adapter lives in the context that provides the functionality. If the adapter is in the consumer context, the consumer knows both the bridge and the producer's API — defeating the purpose.

3. **Define the bridge in a shared kernel.** Place bridge interfaces in a shared directory both contexts depend on. Never define the bridge inside either context — prevents circular dependencies.

4. **Use tiered adapters for different environments.** Provide multiple adapter implementations (production, testing). Use a fake adapter in tests, never mock the concrete implementation.

5. **Include both data and operations in the bridge contract.** Define both the data DTOs and the allowed operations. A data-only bridge doesn't define how operations are invoked.

6. **Bind the adapter to the bridge in a service provider.** Use Laravel's container to bind the concrete adapter to the bridge interface in the producer context's service provider.

## Validation Checklist
- [ ] Cross-context calls use bridge interface, not direct instantiation
- [ ] Adapter lives in the producer context (not consumer)
- [ ] Bridge is defined in a shared location (shared kernel or contracts directory)
- [ ] Laravel service provider binds adapter to bridge
- [ ] Tiered adapters exist for different environments
- [ ] Bridge includes both data DTOs and operation contract

## Common Failures
- **Skipping the bridge.** Directly importing another context's classes — tight coupling.
- **Adapter in the consumer context.** Consumer knows producer's API — defeats the pattern.
- **Bridge = DTO only.** No operation contract — consumer still couples to producer's methods.

## Decision Points
- **Bridge/adapter vs message bus?** Bridge/adapter for synchronous calls. Message bus for asynchronous events.
- **Adapter placement for third-party?** If producer is a third-party package, adapter may need to live in consumer context as an anti-corruption layer.

## Performance Considerations
- Bridge/adapter adds one extra method call (microseconds). Negligible.

## Security Considerations
- The bridge contract defines what operations and data cross the boundary. The adapter enforces the contract.

## Related Rules
- Rule: Use a bridge interface for every cross-context synchronous call (CPC-07/05-rules.md)
- Rule: Place the adapter in the producer context (CPC-07/05-rules.md)
- Rule: Define the bridge in a shared kernel (CPC-07/05-rules.md)
- Rule: Use tiered adapters for different environments (CPC-07/05-rules.md)
- Rule: Include both data and operations in the bridge contract (CPC-07/05-rules.md)

## Related Skills
- Define Formalized Contracts (CPC-01/06-skills.md)
- Implement Circuit Breaker (CPC-06/06-skills.md)
- Implement Anti-Corruption Layer (DBC-04/06-skills.md)
- Implement Facade Pattern for Third-Party (CPC-12/06-skills.md)

## Success Criteria
- Every synchronous cross-context call uses a bridge interface — no direct instantiation of another context's classes.
- Adapter implementations live in the producer context, not the consumer.
- Bridge interfaces are defined in a shared kernel/contracts directory.
- Multiple adapter implementations exist for different environments (production fake, testing).
- Bridge contracts include both data DTOs and operation method signatures.
