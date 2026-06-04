# Decision Trees — Error Type Taxonomy

## Tree 1: Classification Decision

**Decision Context**: Classifying an exception into one of the three error categories: operational, programmer, or infrastructure.

**Decision Criteria**:
- Error source (expected runtime condition, code bug, external dependency)
- Recovery path (no code change needed, code fix required, ops intervention)
- Retry safety (is retry safe and likely to succeed?)

**Decision Tree**:
```
Is the error caused by an expected runtime condition that the system was designed to handle?
├── YES → Operational — validation, auth, not found, conflict, rate limit
│   Recovery: No code change needed. Retry: Safe with modified input or after state change.
└── NO → Is the error caused by a bug in application code?
    ├── YES → Programmer — null pointer, type error, unhandled case, assertion failure
    │   Recovery: Code fix required. Retry: Never retry — will fail the same way.
    └── NO → Is the error caused by an external dependency failure?
        ├── YES → Infrastructure — database connection, queue timeout, API 500, disk full
        │   Recovery: Ops intervention or automatic retry. Retry: Safe after dependency recovers.
        └── NO → Operational (default) — if unsure, classify as operational to avoid false alerts
```

**Rationale**: Correct classification determines alert routing, retry behavior, and incident severity. Operational → dashboard. Programmer → on-call. Infrastructure → ops channel.

**Recommended Default**: Operational when in doubt. Never default to programmer — false alerts cause alert fatigue.

**Risks**: Misclassifying programmer as operational hides bugs. Misclassifying operational as programmer triggers unnecessary incident response.

---

## Tree 2: Third-Party Exception Mapping

**Decision Context**: How to classify exceptions from third-party packages and libraries.

**Decision Criteria**:
- Package purpose
- Exception context (what the package says about the error)
- Recovery options

**Decision Tree**:
```
Does the package throw exceptions for expected conditions (validation, not found)?
├── YES → Map to OperationalException — package treats it as an expected runtime condition
└── NO → Does the package throw exceptions for infrastructure failures (connection, timeout)?
    ├── YES → Map to InfrastructureException — dependency failure
    └── NO → Does the package throw exceptions that indicate bugs (type errors, invalid state)?
        ├── YES → Map to ProgrammerException — likely a misconfiguration or misuse
        └── NO → Map to OperationalException (safe default)
```

**Rationale**: Each package has its own exception philosophy. Map each exception explicitly based on its semantic meaning, not its class name.

**Recommended Default**: Map to OperationalException if the purpose is unclear. Document each mapping in a comment. Review quarterly.

**Risks**: Unmapped package exceptions fall through to the catch-all (ProgrammerException default), triggering unnecessary on-call alerts.
