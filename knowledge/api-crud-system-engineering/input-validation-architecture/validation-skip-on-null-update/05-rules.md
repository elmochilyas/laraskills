# Validation Skip on Null Update — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | validation-skip-on-null-update |

## Rules

### Rule: Use `nullable` When Null Is a Valid Value
- **Condition:** When a field can be set to null in the database (clear operation)
- **Action:** Add `nullable` as the first rule in the field's rule array. Subsequent rules apply only to non-null values.
- **Consequence:** Null passes validation; non-null values must satisfy remaining rules.
- **Enforcement:** Integration tests verify null updates pass and store null.

### Rule: Use `sometimes` Without `nullable` When Null Is Not Valid
- **Condition:** When a field cannot be null but can be omitted (PATCH)
- **Action:** Use `sometimes` without `nullable`. If the field is sent with null, validation fails.
- **Consequence:** Clients must omit the field to skip update, or send a valid value to update.
- **Enforcement:** Test verifies null value returns validation error for non-nullable optional fields.

### Rule: Convert Null to Absent for "Don't Update" Semantics
- **Condition:** When null in the request means "don't update this field" (same as absent)
- **Action:** In `prepareForValidation()`, check if field is present and null, then call `$this->offsetUnset($field)`.
- **Consequence:** Null values are treated as absent; validation and update logic ignores the field.
- **Enforcement:** Test verifies null input results in no database change for the field.

### Rule: Distinguish DB Nullable from API Null Semantics
- **Condition:** When designing API field specifications
- **Action:** Define null semantics in the API spec — does null clear the value or mean no update? Match validation to semantics, not DB schema.
- **Consequence:** API behavior is predictable regardless of underlying DB column nullability.
- **Enforcement:** API contract review verifies null semantics are documented for all nullable fields.

### Rule: Use `present` When Null Must Be Explicitly Sent
- **Condition:** When a field must be present in the request even if the value is null
- **Action:** Use `present` rule instead of `required`. `present` requires the field key to exist but allows null.
- **Consequence:** Client must explicitly include the field; null is a valid value.
- **Enforcement:** Test verifies absent field fails `present` validation; null field passes.
