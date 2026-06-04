# Decision Trees — Validation Error Format & Return Messages

## Tree 1: Error Format Selection

**Decision Context**: Choosing the structure of validation error responses.

**Decision Criteria**:
- API client requirements
- Multiple errors vs single error
- Client-side error parsing capability

**Decision Tree**:
```
Does the API need to follow a specific specification (JSON:API, custom schema)?
├── YES → Use custom failedValidation() override — match the spec exactly
└── NO → Does the client need to map errors to specific input fields?
    ├── YES → Return structured errors: { errors: { field: ["message1", "message2"] } }
    └── NO → Does the client need a flat list of all error messages?
        ├── YES → Return flat array: { errors: ["field1 invalid", "field2 required"] }
        └── NO → Return the default Laravel format — keyed by field
```

**Rationale**: Structured errors (field -> messages) are standard for most APIs. Flat errors are simpler but lose field binding.

**Recommended Default**: Use Laravel's default structured error format: `{ message: "...", errors: { field: [...] } }`.

**Risks**: Custom error formats differ from Laravel's default cause confusion. Flat error arrays lose field-position information.

---

## Tree 2: First-Run vs Full Error Reporting

**Decision Context**: Whether to return the first validation error or all errors at once.

**Decision Criteria**:
- UX impact (form with many fields)
- API client processing capability
- Request retry efficiency

**Decision Tree**:
```
Is the client a multi-field form UI that needs to show all errors at once?
├── YES → Return all errors — let the server do full validation and the client display all
└── NO → Is the request idempotent and the client accepts multiple round-trips?
    ├── YES → Return only the first error — simpler response, client can retry one fix at a time
    └── NO → Are there security implications to revealing all validation rules?
        ├── YES → Return first error — minimize information leakage about field rules
        └── NO → Return all errors — provide complete feedback in one round-trip
```

**Rationale**: UX forms benefit from all-at-once feedback. Programmatic APIs can accept first-error-first-fix.

**Recommended Default**: Return all errors for UX-heavy endpoints. Return first error for simple programmatic APIs.

**Risks**: Returning all errors reveals validation rule structure (security concern). Returning first error frustrates form users who must submit multiple times.
