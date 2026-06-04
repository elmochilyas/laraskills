# Form Request Customization Points — Skills

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | form-request-customization-points |

## Skills

### Skill: Select Correct Override Point
- **Description:** Choose the appropriate FormRequest method to override based on the type of customization needed.
- **Steps:**
  1. Determine if the customization is input transformation → use `prepareForValidation()`
  2. Determine if the customization is post-rule logic → use `withValidator()`
  3. Determine if the customization is error response → use `failedValidation()`
  4. Determine if the customization is auth failure → use `failedAuthorization()`
- **Context:** Each override method has a specific lifecycle position and purpose. Using the correct one prevents side effects.

### Skill: Implement Input Merging in prepareForValidation
- **Description:** Merge sanitized or derived values into the request before validation executes.
- **Steps:**
  1. Override `protected function prepareForValidation(): void`
  2. Call `$this->merge([...])` with transformed field values
  3. Use `Str::` helpers for string transformations
- **Context:** Merged values are available to validation rules and to the controller after validation.

### Skill: Add Conditional Validation via withValidator
- **Description:** Add validation that depends on multiple field values or external state.
- **Steps:**
  1. Override `protected function withValidator(Validator $validator): void`
  2. Call `$validator->after(function ($validator) { ... })`
  3. Inside the closure, access request data with `$this->input('field')`
  4. Add errors with `$validator->errors()->add('field', 'message')`
- **Context:** After-hooks within `withValidator` execute after field-level rules pass.

### Skill: Customize Validation Error Response
- **Description:** Override `failedValidation()` to return a custom error response structure.
- **Steps:**
  1. Override `protected function failedValidation(Validator $validator): void`
  2. Build a custom response array with required structure
  3. Throw `new HttpResponseException(response()->json(...))`
- **Context:** Only override when the API contract demands a structure different from Laravel's default.
