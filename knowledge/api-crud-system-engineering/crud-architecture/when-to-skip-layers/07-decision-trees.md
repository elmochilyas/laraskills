# Decision Trees — When to Skip Layers

## Tree 1: Skip Eligibility

**Decision Context**: Determining whether a layer can be skipped for a specific operation.

**Decision Criteria**:
- Operation type (read vs write)
- Existence of business logic in the skipped layer
- Likelihood of future business logic
- Number of call sites

**Decision Tree**:
```
Is the operation a write (create, update, delete)?
├── YES → NEVER skip layers — writes always need the full stack (data integrity, authorization, transactions)
└── NO → Is the operation a read with zero business logic?
    ├── YES → Is it guaranteed the operation will never need business logic?
    │   ├── YES → Acceptable to skip — document with @layer-skip annotation
    │   └── NO → Do not skip — business logic may be needed in the future
    └── NO → Skip evaluation:
        • Does the read have a single call site?
        • Would a skip be clearly understandable to a new developer?
        • Has the team reached consensus on this skip?
        If ALL YES → Acceptable to skip with documentation
        If ANY NO → Do not skip
```

**Rationale**: Writes always need the full stack. Reads can be pragmatically simplified when there is no business logic and no realistic path to acquiring it.

**Recommended Default**: Never skip layers for writes. Skip for reads only when all three conditions are met (no logic, single call site, team consensus).

**Risks**: Skipping writes creates data integrity and authorization gaps. Accumulated read skips without review become architecture blind spots.

---

## Tree 2: Exception Documentation Decision

**Decision Context**: How to document a layer skip exception — what detail to include and where to record it.

**Decision Criteria**:
- Exception permanence (one-time vs ongoing)
- Exception visibility (local vs cross-team)
- Regulatory requirements

**Decision Tree**:
```
Is this a one-time operation that will be removed soon (prototype, temp endpoint)?
├── YES → Document with `@layer-skip` annotation including: reason, date, and planned removal
└── NO → Is this a permanent exception to the layer rule?
    ├── YES → Document with `@layer-skip` annotation + register in the project's exception registry
    │   Include: reason, date, reviewer, quarterly review trigger, bounded scope
    └── NO → Is the project in a regulated industry (finance, healthcare)?
        ├── YES → Full documentation: `@layer-skip` + exception registry + ADR + team approval
        └── NO → `@layer-skip` annotation + exception registry entry
```

**Rationale**: Temporary exceptions need cleanup dates. Permanent exceptions need registry tracking and review triggers.

**Recommended Default**: `@layer-skip` annotation with reason, date, and reviewer. Exception registry for permanent exceptions.

**Risks**: Undocumented skips become invisible architecture debt. Over-documented skips for trivial temporary exceptions add administrative overhead.
