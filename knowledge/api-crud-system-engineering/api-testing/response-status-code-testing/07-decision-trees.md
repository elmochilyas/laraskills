# Decision Trees — Response Status Code Testing

## Tree 1: Status Code Assertion Strategy

**Decision Context**: Which status codes to test per endpoint — CRUD codes only vs all possible codes vs codes from error scenarios.

**Decision Criteria**:
- CRUD endpoint type
- Multiple response conditions
- Error scenario coverage requirements

**Decision Tree**:
```
Is this a success scenario (happy path)?
├── YES → Assert CRUD canonical code:
│   GET (index/show) → assertOk() (200)
│   POST (store) → assertCreated() (201)
│   PUT/PATCH (update) → assertOk() (200)
│   DELETE (destroy) → assertNoContent() (204)
└── NO → Is this an error scenario?
    ├── Unauthenticated → assertUnauthorized() (401)
    ├── Unauthorized → assertForbidden() (403)
    ├── Not found → assertNotFound() (404)
    ├── Validation failure → assertStatus(422)
    ├── Rate limited → assertStatus(429)
    └── Server error → assertStatus(500)
```

**Rationale**: Every condition an endpoint can return must have a status code test. The canonical CRUD codes are the most commonly violated (200 instead of 201, 200 instead of 204).

**Recommended Default**: Use convenience methods (`assertCreated()`, `assertNoContent()`) over `assertStatus()` for readability.

**Risks**: 201/204 confusion is the most common status code bug. 401/403 confusion is the second most common.

---

## Tree 2: Status Code Consistency Across Versions

**Decision Context**: Maintaining consistent status codes across API versions — enforcing same codes vs allowing version-specific codes.

**Decision Criteria**:
- API version count
- Breaking change policy
- Consumer expectations

**Decision Tree**:
```
Is the same endpoint defined in multiple API versions?
├── YES → Must return the same status code for the same condition across versions
│   (v1 and v2 store must both return 201, or both return 200 — inconsistency is a breaking change)
└── NO → Single version — test against version's documented status code contract
```

**Rationale**: Changing status codes between versions is a breaking change for clients that check codes programmatically.

**Recommended Default**: Consistent status codes across all API versions for identical conditions.

**Risks**: Version-specific status codes break client libraries that check codes rather than parsing response bodies.
