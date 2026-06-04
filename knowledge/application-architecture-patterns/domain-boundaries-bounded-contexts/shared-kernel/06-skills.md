# Skill: Design Minimal Shared Kernel for Cross-Context Code

## Purpose
Create a minimal shared kernel containing only immutable value objects, foundation interfaces, and stable enums. Never place business logic, Eloquent models, or mutable state in shared kernel. Extract from duplication (wait for third context), not from upfront design.

## When To Use
- Three or more contexts independently need the same stable concept

## When NOT To Use
- Only two contexts use it (duplicate instead)
- Concept might evolve differently across contexts
- Business logic, even if shared across contexts

## Prerequisites
- Bounded contexts identified and mapped
- Understanding of what is "stable" vs "evolving"

## Inputs
- Value objects duplicated across 3+ contexts
- Foundation interfaces with stable contracts
- Cross-cutting enums and base classes

## Workflow
1. **Never place business logic in the shared kernel.** Business logic evolves differently per context over time. Each context owns its own domain logic, even if initially identical.

2. **Never place Eloquent models in the shared kernel.** Each Eloquent model belongs to exactly one bounded context. Shared models couple all contexts to the same schema.

3. **Extract to shared kernel only when a third context needs it.** Default to duplicating code between contexts. When a third context independently needs the same stable concept, extraction is justified.

4. **Keep the shared kernel small — fewer than 20 classes.** A large shared kernel signals wrong context boundaries or a dumping ground for "common" code.

5. **Share only value objects and foundation interfaces.** Immutable value objects (Money, Email) are low-risk to share. Foundation interfaces (EventBus, Logger) define contracts without locking implementation.

6. **Prefer stable interfaces over shared implementations.** Share interfaces/contracts rather than concrete implementations. Each context can implement the interface differently.

7. **Do not mutate shared kernel state.** Never place mutable global state in the shared kernel. It creates hidden temporal coupling between contexts.

8. **Do not put cross-context DTOs in the shared kernel.** Keep DTOs in the consuming context or a dedicated contracts layer. They change when either producer or consumer changes.

9. **Version shared kernel contracts explicitly.** Use versioned interfaces (EventBusV1, EventBusV2) to make contract changes explicit.

## Validation Checklist
- [ ] Shared kernel contains only stable, cross-cutting code
- [ ] No business logic in shared kernel
- [ ] No Eloquent models in shared kernel
- [ ] Shared kernel is small (<20 classes)
- [ ] Content is extracted from duplication (3+ consumers)
- [ ] No mutable state in shared kernel
- [ ] No cross-context DTOs in shared kernel
- [ ] Contracts are versioned explicitly

## Common Failures
- **Business logic in shared kernel.** `DiscountCalculator` in shared because "all contexts need discounts" — locks contexts to same rules.
- **Model classes in shared kernel.** Shared `User` Eloquent model — maximum coupling, every context depends on same schema.
- **Large shared kernel.** 50+ classes as dumping ground for everything "common."

## Decision Points
- **Duplicate vs Share?** Default to duplication. Extract to shared only when the third context independently needs the same stable concept.

## Performance Considerations
- No runtime cost. Shared code is just regular PHP classes.

## Security Considerations
- Shared code is accessible to all contexts. Ensure no sensitive logic or data is exposed through shared kernel.

## Related Rules
- Rule: Never place business logic in the shared kernel (DBC-03/05-rules.md)
- Rule: Never place Eloquent models in the shared kernel (DBC-03/05-rules.md)
- Rule: Extract to shared kernel only when a third context needs it (DBC-03/05-rules.md)
- Rule: Keep the shared kernel small (DBC-03/05-rules.md)
- Rule: Only share value objects and foundation interfaces (DBC-03/05-rules.md)
- Rule: Prefer stable interfaces over shared implementations (DBC-03/05-rules.md)
- Rule: Do not mutate shared kernel state (DBC-03/05-rules.md)
- Rule: Do not put cross-context DTOs in the shared kernel (DBC-03/05-rules.md)
- Rule: Version shared kernel contracts explicitly (DBC-03/05-rules.md)

## Related Skills
- Identify Bounded Contexts (DBC-01/06-skills.md)
- Map Context Relationships (DBC-02/06-skills.md)
- Design Anti-Corruption Layer (DBC-04/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)
- Design Modular Monolith Shared Kernel (MMD-08/06-skills.md)

## Success Criteria
- Shared kernel contains fewer than 20 classes, all of which are immutable value objects, foundation interfaces, or stable enums.
- No business logic or Eloquent models exist in shared kernel.
- Every shared kernel item is extracted from duplication (3+ consumers), not from upfront design.
- No mutable shared state exists; all contracts are versioned.
