# Validation Skip on Edit — Skills

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | validation-skip-on-edit |

## Skills

### Skill: Apply `sometimes` Rule to Update FormRequests
- **Description:** Mark all validation rules as `sometimes` to support partial updates.
- **Steps:**
  1. Add `'sometimes'` as the first element in each field's rule array
  2. Remove `required` from fields that can be omitted
  3. Keep `required` for fields that must always be sent (present in every update)
- **Context:** `sometimes` validates only when the field exists in the request. Absent fields are skipped entirely.

### Skill: Implement Unique Rule with Model Ignore
- **Description:** Configure unique validation to exclude the current record during updates.
- **Steps:**
  1. Import `Rule::unique('table')`
  2. Chain `->ignore($this->route('model'))` with the correct route parameter name
  3. Optionally chain `->whereNull('deleted_at')` for soft-delete scoping
- **Context:** The route parameter name must match the route definition (e.g., `{user}` → `$this->route('user')`).

### Skill: Build Custom Skip Logic for PUT Requests
- **Description:** Compare input with current database values and skip validation for unchanged fields.
- **Steps:**
  1. Access the model via route binding: `$model = $this->route('model')`
  2. Loop through fields and compare `$this->input('field')` with `$model->field`
  3. If unchanged, call `$this->offsetUnset('field')` in `prepareForValidation()`
  4. Validation rules with `sometimes` will skip the unset field
- **Context:** Custom skip logic is only needed for PUT requests. PATCH with `sometimes` handles this naturally.

### Skill: Verify Route Binding in Update Requests
- **Description:** Ensure the route model binding is accessible before using it in validation rules.
- **Steps:**
  1. Check `$this->route('model')` is not null
  2. For policies: `$this->user()->can('update', $this->route('model'))`
  3. For rules: `Rule::unique('table')->ignore($this->route('model')->id)`
- **Context:** Route binding fails if the model is not found — handle this before validation rules reference it.
