# Decision Trees — Layer Isolation in Tests

## Tree 1: Test Pyramid Allocation

**Decision Context**: How to distribute tests across layers — feature tests vs unit tests vs integration tests for business logic.

**Decision Criteria**:
- Business logic complexity
- Team size and development velocity
- Debugging requirements
- Test execution time budget

**Decision Tree**:
```
Is the business logic complex (10+ conditional paths, multiple service orchestrations)?
├── YES → Follow 70/30 split: 70% isolated unit tests (actions/services mocked) + 30% feature tests (full stack)
└── NO → Is the API primarily thin controllers delegating to Eloquent?
    ├── YES → 90% feature tests, 10% model tests (scopes, accessors, relationships)
    └── NO → 80% feature tests, 20% unit tests for non-trivial business logic
```

**Rationale**: The test pyramid should match the complexity distribution. Simple CRUD APIs benefit most from feature tests. Complex business logic needs isolated unit tests for fast feedback.

**Recommended Default**: 70% feature tests / 30% isolated unit tests for non-trivial applications.

**Risks**: 100% feature tests make business logic debugging slow. 100% unit tests miss middleware/routing integration bugs.

---

## Tree 2: Mock Boundary Selection

**Decision Context**: Choosing which boundaries to mock in isolated tests — repository interfaces vs Eloquent models vs external services.

**Decision Criteria**:
- Architectural boundaries defined (interfaces vs concrete classes)
- Mock stability requirements
- Ownership of mocked class

**Decision Tree**:
```
Does the layer depend on a repository interface you own?
├── YES → Mock at the repository interface boundary: createMock(PostRepositoryInterface::class)
└── NO → Does the layer use Eloquent models directly?
    ├── YES → Use RefreshDatabase + real models in isolated tests (mocking Eloquent is fragile)
    └── NO → Does the layer call external services (HTTP, SDK)?
        ├── YES → Mock the service client interface; use Http::fake() for HTTP calls
        └── NO → Mock at the nearest owned boundary; avoid mocking framework internals
```

**Rationale**: Mock at boundaries you own (repository interfaces). Avoid mocking what you don't own (Eloquent, SDK internals). Use real implementations for value objects and framework primitives.

**Recommended Default**: Mock repository interfaces; use real database for Eloquent; Http::fake() for external HTTP.

**Risks**: Over-mocking creates brittle tests that pass with wrong business logic. Under-mocking creates slow tests.
