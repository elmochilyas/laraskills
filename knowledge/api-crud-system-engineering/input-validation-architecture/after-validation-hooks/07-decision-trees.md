# Decision Trees — After Validation Hooks

## Tree 1: Hook Selection

**Decision Context**: Choosing between `passedValidation()` and `Validator::after()` for post-validation logic.

**Decision Criteria**:
- Need to reject the request based on validation
- Whether the operation is in-memory transformation vs external check
- Whether I/O is required

**Decision Tree**:
```
Does the operation need to potentially reject the request (add errors)?
├── YES → Use Validator::after() — can call $validator->errors()->add() to fail validation
└── NO → Does the operation compute derived data from validated input?
    ├── YES → Use passedValidation() with $this->merge() — in-memory data transformation only
    └── NO → Does the operation check an external service (fraud, blacklist, uniqueness)?
        ├── YES → Use Validator::after() — runs synchronously, can reject the request
        └── NO → Use passedValidation() — normalization and defaults only
```

**Rationale**: `after()` is for rejection-capable checks (cross-field, external). `passedValidation()` is for in-memory transformation only.

**Recommended Default**: `passedValidation()` for computed fields and normalization. `Validator::after()` for cross-field or external-service validation that can reject.

**Risks**: Using `passedValidation()` for rejection-capable logic silently passes invalid data. Using `after()` for simple transformations adds unnecessary complexity.

---

## Tree 2: External Service Call in After Hook

**Decision Context**: Whether to call an external service inside `Validator::after()`.

**Decision Criteria**:
- Service reliability and latency
- Whether the check must block the request
- Timeout tolerance

**Decision Tree**:
```
Is the external service check critical for request validity (fraud check, blacklist)?
├── YES → Is the service reliable (99.9%+ uptime, <500ms response)?
│   ├── YES → Use after() with timeout 2-5s — must block the request for security
│   └── NO → Log the failure and proceed — don't block the request on an unreliable service
└── NO → Is the check advisory (recommendation, scoring)?
    ├── YES → Defer to service layer — don't block validation for advisory checks
    └── NO → Use after() with short timeout — wrap in try/catch with logging
```

**Rationale**: External calls in `after()` block the request. Only use for security-critical checks. Non-critical checks should be deferred.

**Recommended Default**: Use after() with try/catch and short timeout for critical checks. Defer non-critical checks to the service layer.

**Risks**: Blocking on unreliable external services causes 5xx errors. Deferring critical checks allows invalid requests to pass through.
