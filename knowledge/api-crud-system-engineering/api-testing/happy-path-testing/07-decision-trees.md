# Decision Trees — Happy Path Testing

## Tree 1: Assertion Priority Order

**Decision Context**: The order of assertions within a happy path test — status first, shape second, content third vs combined assertions.

**Decision Criteria**:
- Test debugging speed
- Assertion failure clarity
- Response parsing overhead

**Decision Tree**:
```
Assert status code first (fastest, cheapest check)
├── PASS → Assert response shape (JSON structure)
│   ├── PASS → Assert specific content values (expensive JSON check)
│   │   ├── PASS → Assert database state changed (for mutations)
│   │   └── FAIL → Content contract break — check API resource / transformer
│   └── FAIL → Shape contract break — check response structure
└── FAIL → Status code break — check controller return type, exception handler
```

**Rationale**: Assert cheapest/most general first (status code is integer comparison) to fail fast. Specific value assertions are last because they're most expensive.

**Recommended Default**: `$response->assertOk()->assertJsonStructure([...])->assertJsonFragment([...])` chain.

**Risks**: Reversing order (content before status) leads to confusing error messages when status is wrong.

---

## Tree 2: Database State Assertion Strategy

**Decision Context**: When and how to assert database state in happy path tests — after every mutation or only for critical operations.

**Decision Criteria**:
- Mutation type (create, update, delete)
- Test reliability requirements
- Performance budget

**Decision Tree**:
```
Is the endpoint a mutation (POST, PUT, PATCH, DELETE)?
├── YES → Assert database state after the mutation:
│   ├── POST (create) → assertDatabaseHas with expected data
│   ├── PUT/PATCH (update) → assertDatabaseHas with updated data
│   └── DELETE → assertDatabaseMissing with deleted ID
└── NO → Read-only endpoint (GET, HEAD) — no database assertion needed
    ├── Is this a collection with pre-seeded data?
    │   ├── YES → Assert database record count matches seeded count
    │   └── NO → Skip database assertion
```

**Rationale**: Database assertions are the only way to verify mutations actually persisted. Read endpoints don't need them.

**Recommended Default**: `assertDatabaseHas` after create/update; `assertDatabaseMissing` after delete.

**Risks**: Missing database assertions mean tests pass even when mutations silently fail.
