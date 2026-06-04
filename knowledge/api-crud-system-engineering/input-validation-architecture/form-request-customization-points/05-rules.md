# Form Request Customization Points — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | form-request-customization-points |

## Rules

### Rule: Transform Input Only in prepareForValidation
- **Condition:** When modifying request data before validation
- **Action:** Use `prepareForValidation()` with `$this->merge()`. Never modify `$this->request` directly.
- **Consequence:** Clean normalized data reaches validation rules; the request object remains consistent.
- **Enforcement:** Code review ensures no `$this->request->replace()` or `$this->request->merge()` outside `prepareForValidation`.

### Rule: Add After Hooks in withValidator
- **Condition:** When needing cross-field validation or conditional logic after rules are set
- **Action:** Use `withValidator()` to call `$validator->after()` with a closure.
- **Consequence:** After-hooks execute after individual field rules, enabling cross-field checks.
- **Enforcement:** Review flags cross-field logic placed in `rules()` or `prepareForValidation()`.

### Rule: Override failedValidation Only for Custom Formats
- **Condition:** When the API requires a non-standard error response structure
- **Action:** Override `failedValidation()` to return a custom `HttpResponseException`. Keep the validation exception chain intact.
- **Consequence:** Clients receive consistent error shapes conforming to the API contract.
- **Enforcement:** Tests verify error response structure matches the API specification.

### Rule: failedAuthorization Returns 403 or 404 Consistent
- **Condition:** When authorization fails in a FormRequest
- **Action:** Override `failedAuthorization()` to return a consistent 403 (or 404 if hiding resource existence).
- **Consequence:** Authorization failures are indistinguishable from missing resources if desired.
- **Enforcement:** Integration tests verify auth failure responses.
