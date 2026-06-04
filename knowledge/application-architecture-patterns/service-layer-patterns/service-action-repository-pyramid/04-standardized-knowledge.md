# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Service-Action-Repository pyramid architecture
Knowledge Unit ID: SLP-04
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

The Service-Action-Repository pyramid organizes business logic into three layers with specific responsibilities: Services orchestrate workflows and manage transactions, Actions execute single business operations, Repositories handle data access. The call chain flows: Controller → Service → Action → Repository. This architecture prevents god services (by splitting operations into actions), centralizes data access (via repositories), and maintains a clear orchestration layer (services).

---

# Core Concepts

- **Service (top layer)**: Orchestrates workflows, coordinates multiple actions, manages transactions, handles cross-cutting concerns.
- **Action (middle layer)**: Single business operation. Calls repositories. Does not call other actions.
- **Repository (bottom layer)**: Data access interface. Encapsulates Eloquent queries. Returns domain objects or models.

---

# When To Use

- Complex workflows coordinating multiple operations where you want to avoid god services.

---

# When NOT To Use

- Service + Action only (no Repository): when data access is simple (single Eloquent calls). Repository adds complexity without benefit.
- Service + Repository only (no Action): when operations are simple enough that action splitting isn't justified.

---

# Best Practices

- **Service as transaction boundary.** WHY: The service opens and commits transactions. Actions and repositories don't manage transactions individually. This prevents partial commits.
- **Action as leaf node — never call other actions.** WHY: Actions calling actions creates opaque call graphs and couples operations. Composition belongs at service level.
- **Repository as abstraction boundary.** WHY: Repositories abstract data access. Services and actions depend on repository interfaces, not Eloquent directly.
- **Document the call chain convention.** WHY: Establish: "Services orchestrate. Actions execute. Repositories access data." Violations caught in code review.

---

# Architecture Guidelines

- Call chain: Request → Controller → Service → Action → Repository → Database.
- Each layer depends only on the layer below it.
- Service coordinates multiple actions within a transaction.
- Repository returns domain objects or models, never raw queries.

---

# Performance Considerations

- Each layer adds method call + dependency resolution. Negligible for most operations.
- For high-throughput operations, consider flattening (Service → Model directly).

---

# Security Considerations

- No direct implications. Authorization stays in policies/form requests.

---

# Common Mistakes

1. **Action calling action:** Most common violation. Cause: convenience. Consequence: couples operations, bypasses service coordination. Better: service orchestrates; actions are leaf nodes.

2. **Service doing data access:** Service calls `Model::where()` directly. Cause: shortcuts. Consequence: couples orchestration to data access. Better: service → action → repository.

3. **Repository returning Eloquent:** Returns `Collection` or `LengthAwarePaginator`. Cause: convenience. Consequence: leaks ORM coupling to action layer. Better: return domain-specific types.

---

# Anti-Patterns

- **All three layers are the same file:** Service method, action logic, and repository query in one method. Structure exists on paper only.
- **Pyramid becomes flat:** Actions removed, services directly access repositories. Action layer atrophies.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-01 Service classes | SLP-05 DTO pattern | SLP-10 Service vs Action vs Use Case |
| SLP-02 Action classes | SLP-14 Repository debate | SLP-11 Transaction management |

---

# AI Agent Notes

- Generate all three layers for complex operations.
- Actions are leaf nodes — never generate action-to-action calls.
- Services manage transactions, actions execute, repositories query.

---

# Verification

- [ ] Call chain follows Controller → Service → Action → Repository
- [ ] Actions don't call other actions
- [ ] Services don't do direct data access
- [ ] Services manage transactions
- [ ] Each layer has a single responsibility
