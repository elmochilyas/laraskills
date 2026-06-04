# Skill: Normalize Request Input Using prepareForValidation

## Purpose
Override `prepareForValidation()` to coerce form input strings to native PHP types, set default values, and normalize field formats before validation rules execute.

## When To Use
- Form inputs with non-standard formats (checkboxes returning "on"/"off", comma-separated strings)
- Fields needing type conversion before validation (string to boolean, string to array)
- Default values for optional fields that may be absent from the request
- Field normalization (trim, lowercase, phone number formatting)

## When NOT To Use
- Authorization checks (use `authorize()`)
- Business logic transformations (belongs in services/actions)
- Database-dependent data enrichment (runs before auth, wasted on unauthorized requests)

## Prerequisites
- FormRequest class extending `Illuminate\Foundation\Http\FormRequest`
- Understanding of the validation pipeline order

## Inputs
- Raw request input data
- `$this->merge()` for adding/overwriting data

## Workflow
1. Override `prepareForValidation(): void` in the FormRequest
2. Use `$this->merge([...])` to coerce types, set defaults, and normalize fields
3. Coerce checkboxes: `filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN)`
4. Coerce comma-separated strings: `array_map('trim', explode(',', $this->tags))`
5. Normalize strings: `strtolower(trim($this->email))`
6. Set defaults: `'status' => $this->status ?? 'draft'`
7. Preserve raw values before overwriting if needed for auditing: merge with a `_original` key
8. Do NOT execute database queries, API calls, or authorization checks

## Validation Checklist
- [ ] `prepareForValidation()` overridden where type coercion is needed
- [ ] `merge()` used for adding/overriding data
- [ ] No database queries or API calls in the method
- [ ] No authorization logic in the method
- [ ] Types coerced before validation rules execute
- [ ] Default values set for optional fields
- [ ] Raw values preserved before overwriting if needed for auditing
- [ ] Tests verify input is normalized before validation

## Common Failures
- Running database queries before authorization — wasted on unauthorized requests
- Using `passedValidation()` for data transformation — changes don't affect `validated()`
- Not coercing types — validation rules see "on" instead of `true`, "1,2,3" instead of array
- Overwriting raw data without preserving original for audit/debugging
- Placing authorization logic in `prepareForValidation()` instead of `authorize()`

## Decision Points
- Use `prepareForValidation()` for transformations vs `passedValidation()` for post-processing
- Use `merge()` to add/replace keys vs `replace()` to overwrite entire ParameterBag
- Preserve original values in `_original` keys vs log separately

## Performance Considerations
- Runs once per FormRequest — negligible cost for simple coercions
- Avoid database queries — this hook fires before authorization
- Avoid heavy computation — should be lightweight normalization

## Security Considerations
- Runs before authorization — values can be tampered with by unauthorized users
- Do not execute user input as code or use dangerous PHP functions
- Strip or encode dangerous characters if needed for output safety
- Transformed values that end up in `validated()` will be used in business logic

## Related Rules
- Rule 1: Use prepareForValidation() for Type Coercion Before Validation
- Rule 2: Do Not Execute Database Queries in prepareForValidation()
- Rule 3: Use merge() — Not passedValidation() — for Data Transformation
- Rule 4: Do Not Place Authorization Logic in prepareForValidation()
- Rule 5: Set Default Values for Optional Fields in prepareForValidation()
- Rule 6: Extract Raw Values Before Overwriting if Original Is Needed

## Related Skills
- Implement Cross-Field Validation Using withValidator and after
- Bridge FormRequest to Typed DTO Using validated

## Success Criteria
- Boolean fields properly coerced from form strings to PHP booleans
- Comma-separated strings converted to arrays
- Default values present for all optional fields
- Normalized data (trimmed, lowercase) available for validation
- Raw original data preserved where needed
- No database queries executed for unauthorized requests
- Validation rules operate on correctly typed data
