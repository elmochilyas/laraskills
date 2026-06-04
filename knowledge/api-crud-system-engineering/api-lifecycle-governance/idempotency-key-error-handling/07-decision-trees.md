# Decision Trees — Idempotency Key Error Handling

## Tree 1: Error HTTP Status Code Selection

**Decision Context**: Determining the correct HTTP status code for each idempotency error scenario — whether to use 409, 422, 503, or other codes.

**Decision Criteria**:
- Error type (conflict, validation, server error)
- Consumer retry behavior implications
- HTTP semantics correctness
- Middleware and client library expectations

**Decision Tree**:
```
Is the idempotency store (Redis) unreachable?
├── YES → Return 503 Service Unavailable with retry guidance; fall back to process without idempotency
└── NO → Does the request carry an idempotency key?
    ├── NO → Does the endpoint require idempotency?
    │   ├── YES → Return 422 Unprocessable Entity (IDEMPOTENCY_KEY_MISSING)
    │   └── NO → Process normally (idempotency optional)
    └── YES → Is the key format valid (length, characters, not empty)?
        ├── NO → Return 422 Unprocessable Entity (IDEMPOTENCY_INVALID_KEY)
        └── YES → Does the key match a stored request with different payload?
            ├── YES → Return 409 Conflict (IDEMPOTENCY_CONFLICT) with resolution guidance
            └── NO → Is another request with this key currently being processed?
                ├── YES → Return 409 Conflict (CONCURRENT_REQUEST_LOCK) with Retry-After header
                └── NO → Process normally (valid, unique, no conflict)
```

**Rationale**: Semantic HTTP status codes enable correct client-side retry logic. 409 signals a conflict that the consumer must resolve (different payload). 422 signals a client error (missing/invalid key). 503 signals the server cannot process idempotency.

**Recommended Default**: 409 for conflicts, 422 for validation errors, 503 for store unavailable.

**Risks**:
- Using 400 for all idempotency errors prevents differentiated retry logic
- 409 without Retry-After on concurrent locks causes retry storms
- 503 without fallback causes unnecessary request rejection

**Related Rules/Skills**: Rules: Return Unique Error Codes Per Idempotency Scenario, Use HTTP 409 for Payload Conflicts, 422 for Validation Errors. Skills: Handle Idempotency Key Errors.

---

## Tree 2: Error Response Content and Resolution Guidance

**Decision Context**: What information to include in idempotency error responses — whether to include stored payload, resolution steps, and debugging hints.

**Decision Criteria**:
- Security/PII exposure risk
- Consumer debugging needs
- Error message clarity requirements
- Support burden reduction

**Decision Tree**:
```
Does the error include stored request/response data from a previous request?
├── YES → Never include stored payload in error response (PII/security risk). Log key prefix only.
└── NO → Is the error type a concurrent lock?
    ├── YES → Include Retry-After header + resolution field: "Retry after the specified period"
    └── NO → Is the error a conflict (different payload, same key)?
        ├── YES → Include resolution: "Use a new idempotency key for different payloads." Never show stored payload.
        └── NO → Is the key expired?
            ├── YES → Include resolution: "Generate a new idempotency key and retry." Include Warning header if near-expiry.
            └── NO → Include resolution explaining the consumer action needed for the specific scenario
```

**Rationale**: Never expose stored data in error responses. Every error should tell the consumer what happened and what to do about it. Resolution field reduces support tickets.

**Recommended Default**: Structured JSON with `code`, `message`, and `resolution` fields. Never include stored payload.

**Risks**:
- Including stored payload leaks consumer data across requests
- Missing resolution guidance increases support burden
- Too much detail in errors reveals internal implementation

**Related Rules/Skills**: Rules: Never Include Stored Payload in Conflict Error Responses, Include Retry-After Header on Concurrent Lock Responses. Skills: Handle Idempotency Key Errors.

---

## Tree 3: Store Unavailable Fallback Strategy

**Decision Context**: How to behave when the idempotency store (Redis) is unavailable — whether to reject all requests, process without idempotency, or use a local fallback.

**Decision Criteria**:
- API criticality (can we accept duplicate processing?)
- Consumer expectations for idempotency guarantees
- Duration of store outage expected
- Risk of duplicate mutations

**Decision Tree**:
```
Is the endpoint a mutation (POST, PATCH, PUT, DELETE)?
├── YES → Is the operation idempotent by nature (PUT, DELETE)?
│   ├── YES → Process without idempotency guarantee; warn log; return 200 with warning header
│   └── NO → Can the operation safely be processed twice (no financial impact)?
│       ├── YES → Process without idempotency; warn log; return 202 with warning header
│       └── NO → Return 503 with retry guidance; do not process (risk of duplicate charge)
└── NO → Is the endpoint read-only (GET, HEAD)?
    ├── YES → Process normally (reads don't need idempotency)
    └── NO → Return 503 with retry guidance (unclear semantics)
```

**Rationale**: Store unavailability forces a trade-off between availability and idempotency guarantee. Read operations are safe. Idempotent-by-nature mutations are lower risk. Non-idempotent mutations with financial impact must be rejected.

**Recommended Default**: Return 503 with Retry-After header and resolution guidance. Implement circuit breaker with local in-memory fallback for degraded mode.

**Risks**:
- Processing without idempotency may cause duplicate charges
- Always returning 503 reduces availability unnecessarily
- Silent fallback without warning header confuses consumers

**Related Rules/Skills**: Rules: Return Unique Error Codes Per Idempotency Scenario. Skills: Handle Idempotency Key Errors, Manage Idempotency Key TTL and Expiration.
