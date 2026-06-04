# Decision Trees — Response Shape Testing

## Tree 1: Shape Test Depth

**Decision Context**: How deeply to assert response shape — top-level keys only vs full recursive structure vs per-resource-type helpers.

**Decision Criteria**:
- Response nesting depth
- API versioning requirements
- Response stability
- OpenAPI spec availability

**Decision Tree**:
```
Is the response a flat object (<3 levels deep)?
├── YES → Assert full shape inline: assertJsonStructure(['id', 'name', 'email'])
└── NO → Is the response deeply nested (paginated with relationships)?
    ├── YES → Define per-resource-type structure helper: postStructure(), paginatedStructure()
    └── NO → Does the response include conditional fields (loaded relations)?
        ├── YES → Assert common shape in base helper; assert conditional shapes in separate tests
        └── NO → Assert shape in layers: first top-level, then data wrapper, then resource attributes
```

**Rationale**: Per-resource-type helpers reduce duplication and centralize shape expectations. Deeply nested responses benefit from layered assertions. Conditional fields need separate test coverage.

**Recommended Default**: Per-resource-type structure helpers for collections and nested responses; inline for flat responses.

**Risks**: Inline assertions in every test create maintenance burden when shape changes. Missing conditional field assertions let contract changes slip through.

---

## Tree 2: Type Assertions in Shape Tests

**Decision Context**: Whether to include type assertions (string, integer, array) in shape tests — strict vs structure-only.

**Decision Criteria**:
- API strictness requirements
- Client language expectations (typed vs dynamic)
- OpenAPI spec detail level

**Decision Tree**:
```
Does the API have a published OpenAPI spec with type definitions?
├── YES → Use contract testing (assertMatchesOpenApiSpec) instead of manual type assertions
└── NO → Is the API consumed by typed languages (TypeScript, Kotlin, Swift)?
    ├── YES → Include type assertions: assertJsonStructure(['id' => 'integer', 'name' => 'string'])
    └── NO → Is the team concerned about accidental type changes?
        ├── YES → Include type assertions for critical fields (prices, IDs, timestamps)
        └── NO → Structure-only assertions (key presence) — sufficient for stability
```

**Rationale**: Contract testing with OpenAPI is superior to manual type assertions. Without it, add type assertions for typed-language consumers and critical data fields.

**Recommended Default**: Structure-only assertions for most fields; type assertions for ID and numeric fields.

**Risks**: Type assertions add maintenance but catch bugs like string IDs becoming integer IDs or price precision changes.
