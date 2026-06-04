# Decision Trees — Validation Error Shape Design

## Tree 1: Field Path Notation

**Decision Context**: Choosing the path notation for nested/array field errors — dot notation vs pointer notation.

**Decision Criteria**:
- Client framework conventions
- Laravel validation conventions
- JSON:API compatibility needs

**Decision Tree**:
```
Does the API use JSON:API or RFC 9457 format?
├── YES → Use pointer notation (JSON:API source.pointer) — /data/attributes/email
└── NO → Does the client framework use dot notation (React, Vue, Laravel)?
    ├── YES → Use dot notation — items.0.name, addresses.0.city; matches Laravel and JavaScript conventions
    └── NO → Does the frontend need simple iteration over field keys?
        ├── YES → Use dot notation — flatter structure, easier to iterate
        └── NO → Use dot notation (default — most compatible with existing tools)
```

**Rationale**: Dot notation is the Laravel convention and widely understood. Pointer notation is needed only for JSON:API compliance.

**Recommended Default**: Dot notation for nested fields: `items.0.name`, `addresses.0.city`.

**Risks**: Using pointer notation in a non-JSON:API API confuses clients. Mixing notations across the API creates unpredictable client parsing.

---

## Tree 2: Value Inclusion Decision

**Decision Context**: Whether to include the submitted value in validation error messages.

**Decision Criteria**:
- PII/security risk of exposing the value
- Client debugging need
- Compliance requirements

**Decision Tree**:
```
Does the submitted value contain potentially sensitive data (email, phone, password)?
├── YES → Never include the value in any error message — risk of PII exposure
└── NO → Is the value non-sensitive and helpful for client-side correction?
    ├── YES → Consider including — "must be greater than 0, got -5" helps debugging
    └── NO → Never include — default to excluding values
```

**Rationale**: Submitted values in error messages can leak PII (email confirmation, username uniqueness) and should never be echoed. Non-sensitive values (numeric ranges, enum options) can be included for debugging.

**Recommended Default**: Never include submitted values in validation error messages. Use field names and rules only.

**Risks**: Including submitted values enables enumeration and PII leaks. Excluding all values makes some validation errors harder to debug (e.g., "must be one of: X, Y, Z" is helpful without risk).
