# Decision Trees — When to Create New Version

## Tree 1: Version Creation Decision

**Decision Context**: Whether a proposed change requires a new API version or can be implemented backward-compatibly.

**Decision Criteria**:
- Breaking change classification
- Change can be made compatible
- Accumulated complexity from non-breaking changes
- Maintenance capacity for new version

**Decision Tree**:
```
Is the change breaking (removes, renames, changes type/semantics)?
├── YES → Can the change be made backward-compatible with additional work?
│   ├── YES → Implement backward-compatible approach; no new version needed
│   └── NO → Is the change worth a new version or can it wait?
│       ├── YES → Create new version with ADR documenting rationale and migration plan
│       └── NO → Defer the change until more breaking changes accumulate
└── NO → Does the change add significant complexity to the current version?
    ├── YES → Has accumulated complexity triggered the 30% threshold (>30% of codebase has version conditionals)?
    │   ├── YES → Consider new version as a "cleanup release" with ADR
    │   └── NO → Add within current version (backward-compatible)
    └── NO → Add within current version
```

**Rationale**: Exhaust backward-compatible options before creating a new version. Each new version costs 2+ years of maintenance.

**Recommended Default**: Do not create a new version if the change can be made backward-compatible.

**Risks**: Creating versions too frequently causes version proliferation. Avoiding new versions indefinitely creates a confusing API surface with accumulated conditionals.

---

## Tree 2: Migration Path Commitment

**Decision Context**: Whether to commit to a new version given maintenance capacity and consumer migration plan.

**Decision Criteria**:
- Expected version lifespan (minimum 2 years)
- Migration tooling budget
- Consumer count and migration complexity
- Team capacity for dual maintenance

**Decision Tree**:
```
Can the team commit to maintaining this new version for at least 2 years?
├── YES → Is there a clear migration path from the old version?
│   ├── YES → Allocate 20% of expected lifecycle cost to migration tooling
│   │   Proceed with new version creation
│   └── NO → Develop migration plan before creating the new version
└── NO → Is there a sunset plan for the old version?
    ├── YES → Proceed only if old version retirement frees enough capacity to maintain the new one
    └── NO → Do not create new version until migration plan and maintenance capacity are confirmed
```

**Rationale**: A new version is a commitment to 2+ years of dual maintenance. Migration tooling is a material cost that must be budgeted.

**Recommended Default**: Create new version only with documented migration plan and confirmed maintenance capacity.

**Risks**: New version without migration plan leaves consumers stranded. New version without maintenance capacity leads to abandonment.
