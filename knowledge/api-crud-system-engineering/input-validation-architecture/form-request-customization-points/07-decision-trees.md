# Decision Trees — Form Request Customization Points

## Tree 1: Override Selection

**Decision Context**: Which FormRequest method to override for custom behavior.

**Decision Criteria**:
- When the customization runs (before vs after validation)
- Purpose of the customization
- Whether the modification affects the input data

**Decision Tree**:
```
Does the customization need to modify the input data before validation?
├── YES → Override prepareForValidation() — transform/normalize input before rules run
└── NO → Does the customization need to modify the validator after rules are set?
    ├── YES → Override withValidator() — add after hooks, conditional rules, modify the validator
    └── NO → Does the customization need to modify the response on validation failure?
        ├── YES → Override failedValidation() — custom JSON structure, logging
        └── NO → Does the customization need to modify the response on auth failure?
            ├── YES → Override failedAuthorization() — custom 403/404 response
            └── NO → Use authorize() or rules() — standard customization is sufficient
```

**Rationale**: Each override has a specific purpose. Using the wrong one mixes responsibilities.

**Recommended Default**: Use `prepareForValidation()` for input transforms. Use `withValidator()` for validator modifications.

**Risks**: Overriding the wrong method creates confusing, hard-to-debug behavior. Modifying validated data in `withValidator()` has no effect on validation.

---

## Tree 2: Validation Error Response Customization

**Decision Context**: Whether to customize the validation error response format.

**Decision Criteria**:
- API response format standards
- Need for additional response data
- Internationalization requirements

**Decision Tree**:
```
Does the API require a custom error format (not Laravel's default)?
├── YES → Override failedValidation() — return custom JSON structure
└── NO → Does the response need additional metadata (error codes, trace IDs)?
    ├── YES → Override failedValidation() — extend the default response
    └── NO → Does the client need translated error messages?
        ├── YES → Use lang/validation.php files — no need to override failedValidation()
        └── NO → Default Laravel error format is sufficient — no override needed
```

**Rationale**: Override `failedValidation()` for custom structure. Use lang files for translations.

**Recommended Default**: Default format unless the API spec requires a specific structure (JSON:API, custom format).

**Risks**: Overriding `failedValidation()` without proper error serialization creates inconsistent error responses. Not overriding when API spec demands custom format violates API contract.
