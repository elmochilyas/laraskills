# Decision Trees — Production vs Dev Error Detail

## Tree 1: Debug Detail Gating

**Decision Context**: Determining what debug detail to include in error responses based on environment.

**Decision Criteria**:
- Environment (local, staging, production)
- APP_DEBUG value
- Request type (API vs web)

**Decision Tree**:
```
Is APP_DEBUG=true AND app()->isLocal()?
├── YES → Is the request an API route (expects JSON)?
│   ├── YES → Append debug key with: exception class, file, line, limited trace (10 frames), previous exception
│   └── NO → Show Whoops page for browser debugging
└── NO → Is APP_DEBUG=true but NOT local (e.g., staging)?
    ├── YES → Treat as production — never expose debug detail in non-local environments
    └── NO → Return safe error envelope — no debug detail, no stack traces, generic messages
```

**Rationale**: Debug detail must be gated by BOTH APP_DEBUG=true AND isLocal(). Either condition false → production-safe response.

**Recommended Default**: Dev (local + debug=true): debug key with limited trace. Production: safe envelope only.

**Risks**: Exposing debug detail in staging or production leaks file paths, SQL, and configuration values. Over-restricting debug in local development slows debugging.

---

## Tree 2: Envelope Shape Consistency

**Decision Context**: Whether the error envelope should have a different shape in dev vs production.

**Decision Criteria**:
- Client contract stability
- Consumer type (internal vs external)
- Testing requirements

**Decision Tree**:
```
Do external clients consume the API in both dev and production environments?
├── YES → Keep envelope shape IDENTICAL in all environments — add debug data as a separate top-level `debug` key
└── NO → Is the API consumed only internally?
    ├── YES → Keep envelope shape identical — internal tools should work identically across environments
    └── NO → Always keep envelope shape identical — clients should never rely on environment-specific shapes
```

**Rationale**: The error envelope is the API contract. It must be identical in all environments. Dev data is additive (debug key), never modificative.

**Recommended Default**: Identical envelope shape everywhere. Dev mode adds a separate `debug` key but never changes `error` envelope fields.

**Risks**: Different envelope shapes per environment cause client issues that only manifest in production. Fields present in dev but missing in production break client error handling.
