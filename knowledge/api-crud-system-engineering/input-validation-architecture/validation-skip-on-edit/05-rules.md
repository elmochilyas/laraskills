# Validation Skip on Edit — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | validation-skip-on-edit |

## Rules

### Rule: Use `sometimes` for All PATCH Endpoints
- **Condition:** When defining validation rules for PATCH (partial update) endpoints
- **Action:** Prefix every field rule with `sometimes`. This ensures only sent fields are validated.
- **Consequence:** Partial updates succeed with only the changed fields; absent fields are ignored.
- **Enforcement:** Tests verify PATCH requests succeed with single-field payloads.

### Rule: Ignore Current Model in Unique Rules
- **Condition:** When validating unique fields (email, slug) during update
- **Action:** Use `Rule::unique('table')->ignore($this->route('model'))` with the correct route parameter.
- **Consequence:** Current record is excluded from uniqueness check; unchanged values pass validation.
- **Enforcement:** Integration test verifies update with unchanged unique field passes.

### Rule: Validate All Required Fields on PUT
- **Condition:** When defining validation rules for PUT (full update) endpoints
- **Action:** Keep `required` rules for all fields. Do not use `sometimes`. Optionally add skip logic in `prepareForValidation()` for unchanged fields.
- **Consequence:** PUT enforces complete payload as per HTTP semantics.
- **Enforcement:** Tests verify PUT with missing required fields returns 422.

### Rule: Only Skip Validation, Never Authorization
- **Condition:** When implementing skip logic for unchanged fields
- **Action:** Skip only validation rules. Always run `authorize()` regardless of which fields changed.
- **Consequence:** Authorization is enforced on every request; validation is optimized.
- **Enforcement:** Review ensures skip logic is only in validation scope, never in `authorize()`.

### Rule: Confirm Route Parameter Exists Before ignore()
- **Condition:** When using `Rule::unique()->ignore()` in update requests
- **Action:** Verify the route parameter (model binding) is present before calling ignore. Use `$this->route('param')` not hardcoded values.
- **Consequence:** Prevents errors when route parameter binding fails; ensures correct model is ignored.
- **Enforcement:** Test verifies update request with missing route parameter fails gracefully.
