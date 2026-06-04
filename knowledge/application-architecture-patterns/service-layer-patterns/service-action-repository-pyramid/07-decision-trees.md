# Decision Trees: Service-Action-Repository Pyramid

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Service-Action-Repository pyramid architecture
- **Knowledge Unit ID:** SLP-04
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Full pyramid vs simplified layers | Architecture | Application design |
| 2 | Transaction boundary in service vs action | Architecture | Transaction design |
| 3 | Action as leaf node vs composite operation | Architecture | Action design |

---

## Decision 1: Full pyramid vs simplified layers

### Context
The Service-Action-Repository pyramid has three layers. Not every application needs all three. Simple CRUD operations may only need a service (no action, no repository). Complex workflows benefit from the full pyramid. The wrong choice leads to either over-engineering (all three layers for a simple `User::create`) or under-structuring (god services for complex workflows).

### Decision Tree

```
Is the operation a simple CRUD operation (create, read, update, delete)?
├── YES
│   Is data access more complex than a single Eloquent call?
│   ├── YES → Service + Repository (action layer not needed)
│   └── NO → Service only (neither action nor repository needed)
└── NO (complex business workflow with multiple steps)
    → Full pyramid: Service + Action + Repository
    Does the workflow involve transaction coordination?
    ├── YES → Full pyramid (service manages transaction, actions are atomic)
    └── NO → May still benefit from action layer for testability
```

### Rationale
The pyramid is a hierarchical investment — add layers where they provide value. Service-only is the most common pattern for simple apps. Adding actions splits operations into independently testable units. Adding repositories abstracts data access. Each layer should justify its existence.

### Recommended Default
Service-only for simple CRUD; full pyramid for complex workflows

### Risks
- Full pyramid for simple CRUD: boilerplate without benefit, slow development
- Service-only for complex workflows: god service with 10+ dependencies
- No repository: Eloquent coupling throughout actions and services

### Related Rules
- Service as Transaction Boundary (SLP-04/05-rules.md)
- Action as Leaf Node (SLP-04/05-rules.md)
- Repository as Abstraction Boundary (SLP-04/05-rules.md)
- Each Layer Depends Below It (SLP-04/05-rules.md)

### Related Skills
- Build the Service-Action-Repository Pyramid (SLP-04/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)

---

## Decision 2: Transaction boundary in service vs action

### Context
Transaction boundaries belong exclusively in the Service layer. Actions and repositories must not manage transactions. The service orchestrates multiple actions within a single transaction, ensuring atomicity. Nested transactions (action within action) create savepoints that complicate rollback.

### Decision Tree

```
Who manages the transaction for this operation?
├── Service → Correct — service defines the unit of work
│   Is the service wrapping multiple actions in one transaction?
│   ├── YES → Correct pattern — all-or-nothing atomicity
│   └── NO → Single action — still fine, service owns the boundary
├── Action → WRONG — action should not manage transactions
│   Move DB::transaction() to the calling service
└── Repository → WRONG — repository should not manage transactions
    Repository methods perform single data operations
```

### Rationale
The service defines the consistency boundary. It decides which operations succeed or fail together. If an action manages its own transaction, it creates a savepoint that may commit independently of the service's transaction — causing partial commits. The service is the only layer that understands the full workflow.

### Recommended Default
Transaction boundary in Service layer only

### Risks
- Action-level transactions: nested savepoints, partial commits
- Repository-level transactions: hidden commits, difficult to compose
- No transaction: partial failure leaves inconsistent state

### Related Rules
- Service as Transaction Boundary (SLP-04/05-rules.md)
- Action as Leaf Node (SLP-04/05-rules.md)
- No Direct Data Access in Services (SLP-04/05-rules.md)

### Related Skills
- Build the Service-Action-Repository Pyramid (SLP-04/06-skills.md)
- Manage Transactions (SLP-11/06-skills.md)

---

## Decision 3: Action as leaf node vs composite operation

### Context
Actions must be leaf nodes in the call graph — they call repositories but never other actions. Composition of multiple actions belongs at the service layer. An action calling an action creates an opaque call graph that bypasses the service's orchestration and transaction management.

### Decision Tree

```
Does this action call another action to complete its operation?
├── YES → Architecture violation — refactor
│   Does a service already orchestrate these operations?
│   ├── YES → Move the action-to-action call to the service
│   └── NO → Create a service to orchestrate the actions
└── NO → Action is a proper leaf node
    Does the action call repositories only?
    ├── YES → Correct leaf node
    └── NO → Action is doing work that should be in a repository
```

### Rationale
The action's role is to execute a single leaf-node operation. If it needs sub-operations, those should be separate actions orchestrated by a service. Action-to-action calls couple operations together, making them impossible to reuse or reorder independently.

### Recommended Default
Actions are leaf nodes calling only repositories

### Risks
- Action-to-action calls: opaque call graphs, hard to trace
- Action-to-action calls: bypass service transaction management
- Action layer atrophies: services calling repositories directly, losing action benefits

### Related Rules
- Action as Leaf Node (SLP-04/05-rules.md)
- Service as Transaction Boundary (SLP-04/05-rules.md)
- Repository Returns Domain Types (SLP-04/05-rules.md)

### Related Skills
- Build the Service-Action-Repository Pyramid (SLP-04/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)
