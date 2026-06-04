# Decision Trees — Response Header Testing

## Tree 1: Header Test Coverage Scope

**Decision Context**: Which headers to test per endpoint — all headers vs content-type only vs security headers separately.

**Decision Criteria**:
- API requirements (Content-Type, CORS, rate limit headers)
- Security compliance requirements
- Header stability (rarely changing vs frequently changing)

**Decision Tree**:
```
Is this a security header (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)?
├── YES → Test in a dedicated security header suite; assert on ALL endpoints using a beforeEach/global test
└── NO → Is this a content negotiation header (Content-Type)?
    ├── YES → Assert on every endpoint: assertHeader('Content-Type', 'application/json')
    └── NO → Is this an operational header (Location, Rate-Limit, Deprecation)?
        ├── YES → Assert in the specific endpoint test where the header applies:
        │   Location → after store (create)
        │   Rate-Limit → on all authenticated responses
        │   Deprecation/Sunset → on deprecated endpoint versions
        └── NO → Test in response-header-testing dedicated suite using a sample endpoint
```

**Rationale**: Security headers must be globally verified. Content-Type is the minimum header test for every endpoint. Operational headers belong in their specific endpoint tests.

**Recommended Default**: Content-Type on every endpoint; security headers in global suite; operational headers in endpoint-specific tests.

**Risks**: Missing Content-Type test allows silent HTML response from misconfigured routes. Missing Location header breaks consumer redirect logic.

---

## Tree 2: Header Absence Testing

**Decision Context**: When to test that a header is absent — asserting headerMissing on error responses vs selective scenarios.

**Decision Criteria**:
- Error response cleanliness
- Debug header exposure risk
- Conditional header presence

**Decision Tree**:
```
Does the response include a header that should only appear on success?
├── Location header → assertHeaderMissing on validation errors, auth failures, 404s
└── Does the response include debug headers in development (X-Debug-Bar, X-Inertia)?
    ├── YES → Assert assertHeaderMissing for debug headers in production-like test environment
    └── NO → Is this a conditional header (X-RateLimit-Remaining on non-rate-limited endpoints)?
        ├── YES → Assert header absence where rate limiting is not configured
        └── NO → No header absence test needed; focus on positive header assertions
```

**Rationale**: Headers that leak from success responses into error scenarios confuse clients. Debug headers must never appear in production.

**Recommended Default**: Assert Location header missing on all 422/401/403/404 responses from store endpoints.
