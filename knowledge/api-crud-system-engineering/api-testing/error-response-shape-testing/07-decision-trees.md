# Decision Trees — Error Response Shape Testing

## Tree 1: Error Shape Testing Approach

**Decision Context**: How to test error response shapes — handler-level global testing vs per-endpoint testing vs combined.

**Decision Criteria**:
- Error handler customization level
- Number of endpoints
- Error shape consistency requirements

**Decision Tree**:
```
Is error shape customization centralized in the exception handler (Handler/Exceptions class)?
├── YES → Test handler-level globally: trigger each error type once, assert shape; don't test per-endpoint
└── NO → Are endpoints using different error formats?
    ├── YES → Test each unique error format per endpoint group; document the inconsistency
    └── NO → Test handler level for standard errors + per-endpoint for custom controllers that return errors directly
```

**Rationale**: Centralized handler customization means one test per error code covers all endpoints. Per-endpoint testing is redundant and misses handler-level consistency issues.

**Recommended Default**: Global error shape test suite: one test per error status code (401, 403, 404, 422, 429, 500) against a representative endpoint.

**Risks**: Skipping global error shape tests means handler changes silently break error consistency across the API.

---

## Tree 2: Production vs Debug Error Shape

**Decision Context**: Whether to test error shapes in both debug (APP_DEBUG=true) and production (APP_DEBUG=false) modes.

**Decision Criteria**:
- APP_DEBUG configuration management
- Security compliance requirements
- Error response leakage risk

**Decision Tree**:
```
Is APP_DEBUG=true in any production-like environment?
├── YES → Test both modes: debug mode includes stack traces; production mode strips them; assertJsonMissing(['file', 'line', 'trace'])
└── NO → Is the API security-sensitive (PII, financial)?
    ├── YES → Test production mode explicitly; assert no debug info leaked
    └── NO → Test production mode only; debug mode is development-only
```

**Rationale**: The most common error shape violation is leaking stack traces in production. Testing production mode explicitly catches APP_DEBUG misconfiguration.

**Recommended Default**: Test production mode (APP_DEBUG=false) asserts no `file`, `line`, or `trace` keys in error responses.

**Risks**: Untested production error shapes may expose sensitive server information if APP_DEBUG is accidentally enabled.
