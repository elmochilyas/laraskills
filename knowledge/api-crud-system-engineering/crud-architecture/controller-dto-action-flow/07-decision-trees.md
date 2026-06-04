# Decision Trees — Controller-DTO-Action Flow

## Tree 1: Flow Pattern Selection

**Decision Context**: Whether to use Controller-DTO-Action flow or Controller-DTO-Service flow for a given endpoint.

**Decision Criteria**:
- Number of related operations per entity
- Dependency sharing between operations
- Application size and complexity

**Decision Tree**:
```
Does the entity have 3+ operations that share the same dependencies?
├── YES → Use Controller-DTO-Service flow — single injection point, shared dependencies
└── NO → Is this a discrete operation with its own unique dependencies?
    ├── YES → Use Controller-DTO-Action flow — maximum isolation, minimal ceremony
    └── NO → Is the application >50k LOC with many entities?
        ├── YES → Controller-DTO-Service flow — better navigation, fewer files
        └── NO → Controller-DTO-Action flow — simpler, sufficient for small-medium apps
```

**Rationale**: Action flow maximizes isolation per operation. Service flow minimizes injection points and centralizes shared dependencies.

**Recommended Default**: Controller-DTO-Action for discrete operations; Controller-DTO-Service for entity-centric domains with 3+ operations.

**Risks**: Wrong choice is low-cost — refactoring between flows is straightforward. Over-engineering with services for single-method entities adds unneeded ceremony.

---

## Tree 2: DTO Necessity Decision

**Decision Context**: Whether to create a DTO for the controller-to-action data transfer or pass validated data directly.

**Decision Criteria**:
- Number of fields crossing the layer boundary
- Reuse across multiple actions
- Need for type coercion
- Need for type safety guarantees

**Decision Tree**:
```
Does the data cross 2+ layers (controller → action, action → repository)?
├── YES → Does the data have 4+ fields or require type coercion?
│   ├── YES → Create a DTO — explicit typed contract between layers
│   └── NO → Is the data shape reused across multiple actions?
│       ├── YES → Create a DTO — avoids duplication of field mapping
│       └── NO → Pass validated array directly — DTO adds ceremony for 2-3 fields
└── NO → Pass validated array directly — data only crosses one boundary
```

**Rationale**: DTOs earn their existence at 4+ fields, type coercion needs, or reuse across call sites.

**Recommended Default**: Create a DTO when data crosses 2+ layers with 4+ fields. No DTO for simple 2-3 field single-use transfers.

**Risks**: No DTO for complex data loses type safety. DTO for every 2-field operation creates file noise.
