# Decision Trees — Idempotency Key Testing

## Tree 1: Idempotency Scenario Test Coverage

**Decision Context**: Which idempotency scenarios to test — first request + retry, different key, expired key, missing key, invalid key.

**Decision Criteria**:
- Mutation criticality (payment, order vs general CRUD)
- Cache driver persistence
- TTL configuration

**Decision Tree**:
```
Does the endpoint process payments or financial transactions?
├── YES → Test ALL scenarios exhaustively: first request, retry (identical response), different key (different operation), expired key (re-executes), missing key (executes normally), invalid key format (422)
└── NO → Is the endpoint a general CRUD mutation?
    ├── YES → Test core scenarios: first request + retry (verify single record in DB), missing key (executes), invalid key (422)
    └── NO → Is idempotency optional for this endpoint?
        ├── YES → Test missing key (works) and retry with same key (deduplication)
        └── NO → Test all scenarios (safety first)
```

**Rationale**: Financial endpoints need exhaustive idempotency testing because duplicate charges are the most expensive bug. General CRUD needs core scenarios.

**Recommended Default**: First request + retry (verify deduplication), missing key, invalid key format.

**Risks**: Missing retry deduplication test allows duplicate records. Missing key expiry test allows stale keys to block legitimate requests.

---

## Tree 2: Cache Driver and State Management

**Decision Context**: How to manage idempotency state in tests — cache driver selection and state isolation.

**Decision Criteria**:
- Cache persistence across requests
- Test isolation requirements

**Decision Tree**:
```
Is the default cache driver array?
├── YES → Change to file/redis for idempotency tests (array resets between requests, making retry testing impossible)
└── NO → Is cache shared with other tests in the same class?
    ├── YES → Ensure unique idempotency keys per test method (use Str::uuid())
    └── NO → Isolated cache — no special state management needed
```

**Rationale**: Idempotency testing requires cache state to persist across sequential requests within a single test method. The `array` cache driver cannot do this.

**Recommended Default**: Use `CACHE_DRIVER=file` for idempotency tests. Generate unique UUIDs per test.

**Risks**: `array` cache causes idempotency tests to pass incorrectly (retry treated as new request). Shared cache without unique keys causes cross-test pollution.
