# Skill: Build the Service-Action-Repository Pyramid

## Purpose
Organize business logic into three layers with clear call chain: Service orchestrates workflows and manages transactions, Action executes single business operations as leaf nodes, Repository encapsulates data access.

## When To Use
- Complex workflows coordinating multiple operations
- Need to avoid god services by splitting operations into actions
- Need data access abstraction via repositories

## When NOT To Use
- Service + Action only (no Repository) when data access is simple
- Service + Repository only (no Action) when operations are simple

## Prerequisites
- Understanding of Service classes (SLP-01), Action classes (SLP-02)
- Repository pattern understanding
- Call chain convention documented

## Inputs
- Identified workflows requiring multi-step coordination
- Data access patterns

## Workflow
1. **Establish the call chain: Controller → Service → Action → Repository → Database.** Document this convention explicitly. Every developer must know the roles of each layer.

2. **Place transaction boundaries in the Service layer only.** The service opens and commits transactions. Actions and repositories must not manage transactions individually.

3. **Make Actions leaf nodes — never call other actions.** Services orchestrate multiple actions. Actions only call repositories. Action-to-action calls create opaque call graphs and couple operations.

4. **Ensure Services do not do direct data access.** Services call actions or repositories. A service doing `Model::where()` directly couples orchestration to data access.

5. **Use Repositories as the abstraction boundary for data access.** Services and actions depend on repository interfaces, not on Eloquent directly. Repository methods return domain objects (models/DTOs), not query builders.

6. **Enforce each layer depends only on the layer below it.** Controller → Service, Service → Action, Action → Repository. No layer skips or depends on multiple layers.

7. **Prevent the pyramid from collapsing.** Don't let the action layer atrophy. If actions are removed and services access repositories directly, the architecture loses the benefits of independent action testability.

## Validation Checklist
- [ ] Call chain follows Controller → Service → Action → Repository
- [ ] Actions don't call other actions (leaf nodes)
- [ ] Services orchestrate and manage transactions
- [ ] Services don't do direct data access
- [ ] Repositories return domain objects, not query builders
- [ ] Each layer depends only on the layer below it
- [ ] Transaction boundaries are only at Service layer
- [ ] Action layer is maintained (not atrophied)

## Common Failures
- **Action calling action.** Most common violation — couples operations, bypasses service coordination.
- **Service doing data access.** Service calls `Model::where()` directly — couples orchestration to data access.
- **Repository returning query builders.** Returns `Builder` instead of domain objects — leaks ORM coupling to action layer.
- **Pyramid becomes flat.** Actions removed, services directly access repositories.

## Decision Points
- **Full pyramid vs simplified layers?** Use full pyramid for complex workflows. Simplify to Service-only or Service+Repository for simple CRUD.
- **Repository with interface vs without?** Use interfaces for abstraction when testing or data-source swapping matters.

## Performance Considerations
- Each layer adds method call + dependency resolution — negligible for most operations.
- For high-throughput operations, consider flattening (Service → Model directly).

## Security Considerations
- Authorization stays in policies/form requests, not in the pyramid layers.

## Related Rules
- Rule: Service as Transaction Boundary (SLP-04/05-rules.md)
- Rule: Action as Leaf Node (SLP-04/05-rules.md)
- Rule: No Direct Data Access in Services (SLP-04/05-rules.md)
- Rule: Repository as Abstraction Boundary (SLP-04/05-rules.md)
- Rule: Each Layer Depends Below It (SLP-04/05-rules.md)
- Rule: Document Call Chain (SLP-04/05-rules.md)
- Rule: Repository Returns Domain Types (SLP-04/05-rules.md)

## Related Skills
- Design Service Classes (SLP-01/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)
- Implement Repository Pattern (SLP-14/06-skills.md)
- Manage Transactions (SLP-11/06-skills.md)

## Success Criteria
- Call chain follows Controller → Service → Action → Repository consistently.
- Actions are leaf nodes that never call other actions.
- Services manage transactions and orchestrate without direct data access.
- Repositories abstract data access and return domain objects.
