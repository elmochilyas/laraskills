# Decision Trees — Error Response Testing

## Tree 1: Test Coverage Priority

**Decision Context**: Determining which error scenarios to test for a given endpoint.

**Decision Criteria**:
- Endpoint documentation (documented error modes)
- Error probability
- Security sensitivity
- Client impact

**Decision Tree**:
```
Is the error scenario documented in the API specification?
├── YES → Mandatory test — documented errors are contractual
└── NO → Does the error have security implications (auth bypass, data leak)?
    ├── YES → Mandatory test — security-critical errors must be verified
    └── NO → Is the error a common failure mode for this endpoint?
        ├── YES → Test — validation errors, not found, auth failures for resource endpoints
        └── NO → Optional test — rare error modes can have lower priority
```

**Rationale**: Documented errors and security-critical errors are mandatory. Common failure modes are high priority. Rare errors are optional.

**Recommended Default**: Test all documented error codes, all auth scenarios (no auth, invalid auth, expired auth), all validation failure modes, and not-found scenarios.

**Risks**: Untested error responses break silently in production. Over-testing all error permutations creates test maintenance burden.

---

## Tree 2: Production-Mode Testing Strategy

**Decision Context**: Whether to run error tests with APP_DEBUG=true or APP_DEBUG=false.

**Decision Criteria**:
- Test purpose (shape verification vs sensitive data verification)
- Test environment
- CI pipeline configuration

**Decision Tree**:
```
Does the test verify that no sensitive data is leaked in error responses?
├── YES → Run with APP_DEBUG=false — asserts safe envelope with no stack traces or file paths
└── NO → Does the test verify the error message or detail content?
    ├── YES → Run with APP_DEBUG=false — production-safe messages only; dev messages may include details not present in production
    └── NO → Does the test verify the error shape (envelope structure)?
        ├── YES → Run with APP_DEBUG=false — shape must be identical in both modes; debug key is additive
        └── NO → Use the standard test environment setting
```

**Rationale**: Error shape and sensitive data verification must run in production mode. Dev mode tests may pass when production mode would fail.

**Recommended Default**: Run a dedicated production-mode test suite for all error tests with APP_DEBUG=false.

**Risks**: Testing only with APP_DEBUG=true misses sensitive data leaks. Testing only with APP_DEBUG=false misses dev-specific debugging capability verification.
