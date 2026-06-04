# Decision Trees — Authentication Failure Testing

## Tree 1: Auth Failure Scenario Coverage

**Decision Context**: Which authentication failure scenarios to test per endpoint — exhaustive coverage vs representative sampling.

**Decision Criteria**:
- Number of protected endpoints
- Authentication mechanism complexity
- Risk of auth bypass
- Test suite size constraints

**Decision Tree**:
```
Does the endpoint handle financial or PII data?
├── YES → Test ALL auth failure scenarios: missing token, malformed token, expired token, revoked token, wrong guard
└── NO → Is there a single uniform auth middleware across all endpoints?
    ├── YES → Test each scenario once against any representative endpoint; trust middleware applies uniformly
    └── NO → Is auth middleware applied per-endpoint or per-group?
        ├── YES → Test each auth scenario against each unique middleware group; one endpoint per group
        └── NO → Test missing-token scenario on every endpoint (quick); full scenarios on a representative subset
```

**Rationale**: Uniform middleware means one endpoint test proves the middleware works. Per-endpoint middleware needs per-group testing. Financial/PII endpoints need exhaustive coverage.

**Recommended Default**: Test missing + expired + malformed token on one representative endpoint per middleware group.

**Risks**: Assuming middleware is uniform when it isn't leads to auth bypasses in production.

---

## Tree 2: Token Type and Source Testing

**Decision Context**: Whether to test tokens from different authentication guards and sources (Sanctum, Passport, JWT, session).

**Decision Criteria**:
- Multiple auth guards configured
- API vs web route separation
- Token issuance mechanisms

**Decision Tree**:
```
Does the API use multiple authentication guards (auth:api, auth:sanctum, auth:web)?
├── YES → Test that each guard rejects tokens issued by the other guard — wrong-guard scenario
└── NO → Single guard — test only valid vs invalid tokens for that guard
    ├── Is token source from request header vs cookie?
    │   ├── YES → Test both sources: header-based (Bearer) and cookie-based (Sanctum SPA)
    │   └── NO → Test single source
```

**Rationale**: Wrong-guard scenarios are the most commonly missed auth bug — tokens from web sessions being accepted by API middleware.

**Recommended Default**: Test wrong-guard rejection if multiple guards exist; otherwise test invalid token only.

**Risks**: Omitting wrong-guard tests allows auth bypass via token reuse across guards.
