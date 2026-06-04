# Decision Trees — Service vs Action Decision

## Tree 1: Pattern Selection

**Decision Context**: Choosing between an action class and a service class for a group of related operations.

**Decision Criteria**:
- Number of operations in the group
- Dependency overlap across operations
- Controller injection preferences
- Application maturity

**Decision Tree**:
```
Does the entity have 1-2 operations?
├── YES → Use action class — 1-2 operations don't justify service grouping
└── NO → Does the entity have 3+ operations?
    ├── YES → Do these operations share 50%+ of their dependencies?
    │   ├── YES → Use service — shared dependencies justify grouping
    │   └── NO → Keep actions — low dependency sharing means service won't improve cohesion
    └── NO → Would the controller need to inject 4+ individual actions?
        ├── YES → Create service facade — reduce injection points even if dependencies don't fully overlap
        └── NO → Keep actions — individual injection is manageable
```

**Rationale**: The 3-operation threshold with shared dependencies is the primary signal. Injection count is a secondary signal.

**Recommended Default**: Start with actions. Promote to service when the third related operation with shared dependencies emerges.

**Risks**: Premature service for 1-2 operations adds ceremony without benefit. Delayed promotion from actions creates many controller injections without shared context.

---

## Tree 2: Action Extraction from Services

**Decision Context**: When to extract a method from an existing service into its own action class.

**Decision Criteria**:
- Operation independence
- Reuse potential
- Test isolation requirements
- Service cohesion impact

**Decision Tree**:
```
Is the operation independently testable and independently useful outside the service context?
├── YES → Extract to action class — enable independent reuse and testing
└── NO → Does the operation have unique dependencies not shared with other service methods?
    ├── YES → Extract to action — different dependency profile means low cohesion with the service
    └── NO → Does extracting this method improve the service's cohesion score (remaining methods share higher % of dependencies)?
        ├── YES → Extract to action — improves service focus
        └── NO → Keep in service — operation is naturally cohesive with the service
```

**Rationale**: Extraction is justified by independent usefulness, unique dependencies, or improved service cohesion. Operations tightly coupled to the service should stay.

**Recommended Default**: Extract when the operation has unique dependencies or can be independently reused. Keep when it's tightly coupled to the service's shared context.

**Risks**: Extracting tightly coupled operations creates actions that only the original service calls — no actual independence gained. Keeping poorly cohesive operations in the service reduces service clarity.
