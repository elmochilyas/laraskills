# Decision Trees — Custom Exception Classes

## Tree 1: Exception Category Selection

**Decision Context**: Choosing which base exception category a new custom exception should extend.

**Decision Criteria**:
- Error nature (expected vs unexpected)
- Recovery possibility (retry vs code fix vs ops intervention)
- Error source (business logic, code bug, external dependency)

**Decision Tree**:
```
Is the error caused by expected runtime conditions (validation, auth, not found, conflict)?
├── YES → Extend OperationalException — expected, recoverable, no code change needed
└── NO → Is the error caused by a code bug (null pointer, type error, unhandled case)?
    ├── YES → Extend ProgrammerException — unexpected, requires code fix
    └── NO → Is the error caused by an external dependency (DB down, queue timeout, API 500)?
        ├── YES → Extend InfrastructureException — unexpected, requires ops intervention or retry
        └── NO → Extend OperationalException as the safest default (expected with unknown source)
```

**Rationale**: Category determines alert routing, retry policy, and response shape. Correct classification ensures appropriate automated handling.

**Recommended Default**: Business logic errors → OperationalException. Code bugs → ProgrammerException. Dependency failures → InfrastructureException.

**Risks**: Classifying programmer errors as operational silences bug alerts. Classifying operational errors as programmer triggers unnecessary on-call pages.

---

## Tree 2: Static Factory Method Usage

**Decision Context**: Whether to use static factory methods on exception classes for common error scenarios.

**Decision Criteria**:
- Number of error scenarios for the same exception
- Context parameter variation
- Error message localization needs

**Decision Tree**:
```
Does the exception have 2+ distinct error scenarios that differ only in context?
├── YES → Create static factory methods — UserNotFound::forId($id), UserNotFound::forEmail($email)
└── NO → Does the exception constructor require complex parameter derivation?
    ├── YES → Create static factory method — encapsulates derivation logic
    └── NO → Direct constructor call is sufficient — no factory needed
```

**Rationale**: Static factories provide intention-revealing names for different error scenarios and encapsulate context derivation.

**Recommended Default**: Create static factories when the same exception class is thrown from multiple call sites with different context shapes.

**Risks**: Too many factory methods on one exception class suggest it should be split into multiple specific exception classes.
