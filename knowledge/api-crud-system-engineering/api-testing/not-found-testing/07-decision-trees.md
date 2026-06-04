# Decision Trees — Not Found Testing

## Tree 1: 404 Coverage per Endpoint

**Decision Context**: Which endpoints need 404 tests — every member route vs representative subset.

**Decision Criteria**:
- Routing consistency (uniform route model binding)
- Endpoint count
- Soft-delete usage
- Risk of unhandled ModelNotFoundException

**Decision Tree**:
```
Are all member routes using implicit route model binding?
├── YES → Test 404 for one SHOW, one UPDATE, one DELETE endpoint (binding mechanism is shared)
└── NO → Does the controller mix implicit binding with explicit findOrFail()?
    ├── YES → Test 404 for each unique binding mechanism — implicit vs explicit may throw differently
    └── NO → Does the endpoint use soft deletes?
        ├── YES → Test 404 for soft-deleted resources separately from non-existent IDs (different code paths)
        └── NO → Test 404 for each member route that has unique 404 handling
```

**Rationale**: Implicit route model binding is uniform across routes using the same pattern. Different binding mechanisms (implicit vs explicit) and soft-delete behavior need separate tests.

**Recommended Default**: Test 404 on show, update, and delete for each unique binding pattern.

**Risks**: Assuming uniform 404 handling without testing may miss uncaught ModelNotFoundException that returns 500 instead of 404.

---

## Tree 2: Invalid ID Shape Handling

**Decision Context**: Whether to test invalid ID shapes (string UUID passed to integer binding) in 404 tests.

**Decision Criteria**:
- ID type (incrementing integer vs UUID vs custom)
- Route key type configuration
- Historical errors from ID type mismatches

**Decision Tree**:
```
Does the model use UUID as the route key (Route::keyType)?
├── YES → Test that non-UUID strings return 404, not 500 (common casting error)
└── NO → Does the model use auto-incrementing integer IDs?
    ├── YES → Test that non-numeric strings (e.g., "abc") return 404, not 500
    └── NO → Does the model use a custom route key (e.g., slug)?
        ├── YES → Test that invalid slug formats return 404
        └── NO → Test with non-existent ID (standard 404 test only)
```

**Rationale**: ID type mismatches are a common source of 500 errors instead of proper 404s. Testing invalid ID shapes catches these before they reach production.

**Recommended Default**: Test string ID for integer route keys and non-UUID for UUID route keys.

**Risks**: Untested ID shape mismatches result in 500 errors in production that look like server bugs to consumers.
