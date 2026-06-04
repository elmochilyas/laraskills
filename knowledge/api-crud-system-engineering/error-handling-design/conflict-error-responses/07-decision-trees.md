# Decision Trees — Conflict Error Responses

## Tree 1: 409 vs 422 Distinction

**Decision Context**: Determining whether a request should return 409 Conflict or 422 Unprocessable Entity.

**Decision Criteria**:
- Nature of the problem (resource state vs input format)
- Retry behavior (can the client retry with different data?)
- Business rule vs validation rule

**Decision Tree**:
```
Is the problem with the format or validity of the input data itself?
├── YES → Return 422 — validation failure (malformed input, missing required fields, wrong types)
└── NO → Is the problem a conflict with the current server state?
    ├── YES → Is it a duplicate resource, stale version, or invalid state transition?
    │   ├── YES → Return 409 — conflict with current state
    │   └── NO → Return 409 (semantic conflict — resource state prevents the operation)
    └── NO → Is the problem a rate limit?
        ├── YES → Return 429 — rate limited
        └── NO → Is the problem a server failure?
            ├── YES → Return 500 — server error
            └── NO → Return 409 (catch-all for state-based conflicts)
```

**Rationale**: 422 = input is wrong. 409 = input is correct but resource state prevents the operation. Different client responses needed.

**Recommended Default**: 422 for malformed input. 409 for state conflicts (duplicate, stale, invalid transition).

**Risks**: Using 409 for what are actually validation errors (422) confuses client error handling. Using 422 for state conflicts (409) prevents the client from understanding they need to refresh state.

---

## Tree 2: Conflict Detail Exposure

**Decision Context**: How much information about the conflict to include in the 409 response detail.

**Decision Criteria**:
- Conflict type (duplicate, stale version, state transition)
- PII exposure risk
- Client resolution needs
- Security of exposing valid transitions

**Decision Tree**:
```
Is the conflict a duplicate resource?
├── YES → Include `detail.conflict.field` (field name only, NOT the value)
│   Never include: the duplicate value (email, username, SKU)
└── NO → Is the conflict a stale version (optimistic locking)?
    ├── YES → Include `detail.conflict.expected_version` (opaque counter or timestamp)
    │   Include: the version the client should send next
    └── NO → Is the conflict an invalid state transition?
        ├── YES → Does the client need valid transitions for debugging?
        │   ├── YES → Include `detail.conflict.valid_transitions` — but only for authenticated, authorized clients
        │   └── NO → Include only the current state and the attempted transition
        └── NO → Include generic conflict detail with resource_type
```

**Rationale**: Duplicate fields expose field name (safe) but not value (PII risk). Version info aids resolution. State transitions help debugging but can inform attackers.

**Recommended Default**: Duplicate: field name only. Stale: expected version. State: current + attempted state.

**Risks**: Including duplicate values enables enumeration. Excluding resolution info leaves clients guessing how to fix the conflict.
