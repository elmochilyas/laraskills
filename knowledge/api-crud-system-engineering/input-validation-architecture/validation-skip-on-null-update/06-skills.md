# Validation Skip on Null Update — Skills

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | validation-skip-on-null-update |

## Skills

### Skill: Distinguish Null from Absent in Validation
- **Description:** Implement validation that correctly handles null values based on business semantics.
- **Steps:**
  1. Determine if null is a valid value for the field (clears it)
  2. If yes, use `nullable` — null passes validation, non-null must satisfy other rules
  3. If no, determine if field can be omitted
  4. If omit-able, use `sometimes` without `nullable` — null fails, absent passes
  5. If not omit-able, use `required` — null fails, absent fails
- **Context:** Laravel treats null as "present" — `sometimes` validates null fields, `required` rejects null.

### Skill: Convert Null to Absent in prepareForValidation
- **Description:** Transform null values to absent when null means "don't update."
- **Steps:**
  1. Override `prepareForValidation()` in the FormRequest
  2. Iterate over fields where null = "don't update"
  3. Check `$this->has($field) && $this->input($field) === null`
  4. Call `$this->offsetUnset($field)` to remove the field
- **Context:** After conversion, `sometimes` rules skip the field as if it was never sent.

### Skill: Use `present` for Required Nullable Fields
- **Description:** Require a field to exist in the request while allowing null as its value.
- **Steps:**
  1. Add `'present'` to the rule array
  2. Add `'nullable'` to allow null as a value
  3. Add other validation rules that apply to non-null values
- **Context:** `present` ensures explicit client intent — the field must be included even if clearing to null.

### Skill: Handle Null in Nested Object Updates
- **Description:** Correctly validate null values in nested object fields during partial updates.
- **Steps:**
  1. Determine null semantics for each nested field
  2. Use `nullable` for nested fields where null clears the value
  3. Add `present` for nested fields that must be explicitly included
  4. Handle null-to-absent conversion for nested fields recursively
- **Context:** Nested null handling follows the same principles but requires recursive field checking.
