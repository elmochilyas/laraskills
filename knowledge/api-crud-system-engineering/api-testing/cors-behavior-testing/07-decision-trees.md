# Decision Trees — CORS Behavior Testing

## Tree 1: CORS Test Coverage Scope

**Decision Context**: Which CORS scenarios to test — preflight only, actual requests only, or both — and for which origins.

**Decision Criteria**:
- Number of allowed origins
- Credentialed vs non-credentialed endpoints
- CORS configuration complexity

**Decision Tree**:
```
Does the API support credentialed requests (cookies, Authorization headers)?
├── YES → Test both preflight AND actual requests:
│   - Preflight: OPTIONS with Origin header → assert Access-Control-Allow-Origin, Allow-Methods, Allow-Headers, Max-Age
│   - Actual: GET/POST with Origin header → assert Access-Control-Allow-Origin, Allow-Credentials
│   - Test that wildcard * is NOT returned when credentials are true
└── NO → Is this a public read-only API?
    ├── YES → Test preflight with wildcard origin → assert Access-Control-Allow-Origin: *
    └── NO → Test both preflight and actual for each allowed origin in configuration
```

**Rationale**: Credentialed requests have stricter CORS requirements (no wildcard). Both preflight and actual requests must be tested because they have different CORS header sets.

**Recommended Default**: Test preflight (OPTIONS) + actual request (GET/POST) for each unique origin pattern.

**Risks**: Testing only preflight misses CORS headers on actual responses. Testing only actual misses preflight configuration errors.

---

## Tree 2: Disallowed Origin Testing

**Decision Context**: Whether to test disallowed origins and how to assert CORS header absence.

**Decision Criteria**:
- Security requirements for origin restrictions
- CORS configuration testability

**Decision Tree**:
```
Does the CORS configuration have a limited allowlist (not wildcard)?
├── YES → Test with a clearly disallowed origin (e.g., 'https://evil.com'):
│   - Preflight OPTIONS → assertHeaderMissing('Access-Control-Allow-Origin')
│   - Actual request → assertHeaderMissing('Access-Control-Allow-Origin')
└── NO → Is the CORS configuration using wildcard *?
    └── No disallowed origin test needed — all origins are allowed
```

**Rationale**: Disallowed origin testing verifies the allowlist is working. Without it, a misconfigured wildcard or wide-open allowlist goes undetected.

**Recommended Default**: Test one disallowed origin per environment-specific allowlist.

**Risks**: Skipping disallowed origin tests means a `*` wildcard in production CORS config goes unnoticed until a security audit.
