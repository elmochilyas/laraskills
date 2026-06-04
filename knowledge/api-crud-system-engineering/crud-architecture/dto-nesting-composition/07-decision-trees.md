# Decision Trees — DTO Nesting and Composition

## Tree 1: Nesting Depth Decision

**Decision Context**: Determining the appropriate nesting depth for composed DTOs.

**Decision Criteria**:
- Data hierarchy depth
- API response complexity
- DTO maintainability

**Decision Tree**:
```
Does the data have a natural hierarchical relationship (Order has Items, Invoice has Line Items)?
├── YES → Is the nesting depth 3 levels or fewer?
│   ├── YES → Use nested DTOs — mirrors the data hierarchy naturally
│   └── NO → Is the depth exactly 4 levels?
│       ├── YES → Consider flattening — split into separate operations or use ID references beyond 3 levels
│       └── NO → Definitely flatten — 5+ level nesting is unmaintainable
└── NO → Is the relationship incidental (User and Settings — not a hierarchy)?
    ├── YES → Keep separate flat DTOs — nesting suggests a relationship that doesn't exist
    └── NO → Flat DTO — no nesting needed
```

**Rationale**: 2-3 nesting levels mirrors business data naturally. Beyond 3, complexity explodes and flattened alternatives should be used.

**Recommended Default**: Nest to 2-3 levels for hierarchical data. Flatten beyond 3 levels.

**Risks**: Deep nesting creates brittle construction chains where a missing child field fails the entire top-level construction. Flattening loses the hierarchical relationship documentation.

---

## Tree 2: Nesting Orientation

**Decision Context**: Whether to orient DTO nesting by entity hierarchy (Order → Items) or by API response structure.

**Decision Criteria**:
- Primary DTO use case (input vs output)
- API structure differences from entity hierarchy
- Consistency requirement

**Decision Tree**:
```
Is the DTO primarily used for input (request data)?
├── YES → Orient by entity hierarchy — mirrors domain model, predictable for developers
└── NO → Is the DTO primarily used for output (API response)?
    ├── YES → Does the API response structure differ significantly from the entity hierarchy?
    │   ├── YES → Orient by API structure — but document the mapping explicitly
    │   └── NO → Orient by entity hierarchy — simpler, self-documenting
    └── NO → Orient by entity hierarchy — most consistent across input and output
```

**Rationale**: Entity hierarchy orientation is the most consistent and predictable. API structure orientation should only be used when output structure diverges significantly.

**Recommended Default**: Orient by entity hierarchy for both input and output DTOs.

**Risks**: API structure orientation creates confusion when DTOs serve both input and output roles. Forgetting the orientation decision leads to a mix of both styles.
