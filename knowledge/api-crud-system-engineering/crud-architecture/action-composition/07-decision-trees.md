# Decision Trees — Action Composition

## Tree 1: Composition Depth Decision

**Decision Context**: Whether to compose actions into a workflow or keep the logic in a single action/service.

**Decision Criteria**:
- Number of discrete operations in the workflow
- Reuse potential of sub-operations
- Error recovery complexity
- Need for independent testing of sub-operations

**Decision Tree**:
```
Does the workflow contain 2 or more distinct business operations?
├── YES → Are the sub-operations independently useful (reused elsewhere)?
│   ├── YES → Compose actions — coordinator calls sub-actions, each independently testable
│   └── NO → Is the workflow error recovery complex (partial failure needs rollback)?
│       ├── YES → Compose with coordinator-level transaction and compensating actions
│       └── NO → Keep in a single action — deep composition without reuse adds ceremony
└── NO → Single action class is sufficient — no composition needed
```

**Rationale**: Compose when sub-operations are independently useful or when error recovery requires coordination. Single actions are simpler when the operation is atomic.

**Recommended Default**: Compose when the workflow has 2+ reuseable sub-operations. Single action for atomic operations.

**Risks**: Over-composition creates unnecessary class count. Under-composition creates untestable monolithic actions.

---

## Tree 2: Composition Pattern Selection

**Decision Context**: Choosing between sequential, conditional, or pipeline composition patterns.

**Decision Criteria**:
- Execution order requirements
- Conditional branching needs
- Data flow between steps
- Error handling requirements

**Decision Tree**:
```
Does each step depend on the previous step's result?
├── YES → Pipeline composition: pass result of each step as input to the next (functional chain)
└── NO → Do steps have independent execution conditions?
    ├── YES → Conditional composition: coordinator checks conditions before calling sub-actions
    └── NO → Is the execution order fixed and sequential?
        ├── YES → Sequential composition: coordinator calls sub-actions in order
        └── NO → Does the workflow need to process a collection?
            ├── YES → Loop composition: iterate over collection calling a sub-action per item
            └── NO → Sequential composition (default)
```

**Rationale**: Pipeline is best for functional data transformation. Sequential is best for ordered operations. Conditional handles branching workflows. Loop handles batch processing.

**Recommended Default**: Sequential composition — simplest, most readable, covers 70% of use cases.

**Risks**: Pipeline creates tight coupling between step output and next step input. Conditional composition can accumulate complex branching logic in the coordinator.
