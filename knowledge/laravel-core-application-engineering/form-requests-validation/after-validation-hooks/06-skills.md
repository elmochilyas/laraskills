# Skill: Implement Cross-Field Validation Using withValidator and after

## Purpose
Add cross-field validation logic that runs after main field rules execute, enabling checks involving two or more fields together.

## When To Use
- Validation rules that require comparing two or more fields (e.g., `end_date > start_date`)
- Post-rule assertions that depend on the validated values of multiple fields
- Adding conditional validation that fires even when main rules fail

## When NOT To Use
- Simple individual field rules (use the `rules()` array)
- Date comparisons that `after:field` or `before:field` already handle
- Authorization checks (use `authorize()`)

## Prerequisites
- FormRequest class with `rules()` defined
- Understanding of the validation pipeline order

## Inputs
- FormRequest instance
- Validator instance (passed to `withValidator()`)
- Request input data from multiple fields

## Workflow
1. Override `withValidator(Validator $validator): void` in the FormRequest
2. Call `$validator->after(function ($validator) { ... })` to register the callback
3. Inside the closure, access request fields via `$this->input('field')` or `$this->field`
4. Perform the cross-field comparison logic
5. On failure, call `$validator->errors()->add('field', 'message')` to attach the error
6. Do NOT mutate the request or validated data inside the callback
7. Test both the pass path (valid cross-field data) and fail path (invalid cross-field data)

## Validation Checklist
- [ ] `withValidator()` used instead of overriding `validator()`
- [ ] `after()` callback registered inside `withValidator()`
- [ ] No database queries or heavy I/O in `withValidator()`
- [ ] No request mutations inside `after()` callback
- [ ] Error messages added to specific fields via `errors()->add()`
- [ ] Tests cover both valid and invalid cross-field scenarios

## Common Failures
- Mutating the request inside `after()` — changes don't appear in `validated()`
- Throwing exceptions instead of using `$validator->errors()->add()`
- Not checking if related fields exist before accessing them
- Adding `after()` callbacks unconditionally when they should be conditional

## Decision Points
- Use `after:field` for simple date comparisons vs `after()` callback for complex logic
- Use `prepareForValidation()` for data mutations vs `passedValidation()` for post-processing

## Performance Considerations
- `withValidator()` runs once per FormRequest — negligible overhead
- `after()` callbacks fire during the `fails()` pass — keep them lightweight
- Avoid database queries in callbacks; cache data if needed

## Security Considerations
- Do not expose internal state in error messages added by `after()` callbacks
- Cross-field validation should not leak information about why other fields failed
- Error messages must be generic and user-safe

## Related Rules
- Rule 1: Use withValidator() for Validator Modification, Not Override
- Rule 4: Use Validator::after() for Cross-Field Validation
- Rule 7: Do Not Mutate Validated Data in after() Callbacks

## Related Skills
- Implement Post-Validation Side Effects Using passedValidation
- Implement Custom Error Responses Using failedValidation

## Success Criteria
- Cross-field validation correctly rejects invalid combinations
- Error messages attach to the correct field
- Valid cross-field data passes without errors
- All existing field rules continue to work independently
- `validated()` output is not affected by `after()` callbacks

---

# Skill: Implement Post-Validation Side Effects Using passedValidation

## Purpose
Execute lightweight side effects after all validation rules pass, without affecting the validated data output.

## When To Use
- Merging computed metadata (e.g., `validated_at` timestamp) into the request after success
- Logging successful validation attempts
- Enriching the request with derived data that does not need to appear in `validated()`

## When NOT To Use
- Data transformations that must appear in `validated()` (use `prepareForValidation()`)
- Business logic like creating records, sending emails, or dispatching jobs
- Authorization checks (use `authorize()`)

## Prerequisites
- FormRequest class with `rules()` and `authorize()` defined
- Understanding that `passedValidation()` runs after `validated()` is computed

## Inputs
- FormRequest instance (post-validation state)
- Access to `$this->validated()` (already computed)

## Workflow
1. Override `passedValidation(): void` in the FormRequest
2. Keep the implementation lightweight — merge simple data or log
3. Use `$this->merge(['key' => value])` for metadata that should be accessible elsewhere
4. Do NOT execute database writes, dispatch jobs, or call external services
5. Do NOT re-validate or modify validated data
6. Write integration tests that verify the hook fires on successful validation

## Validation Checklist
- [ ] `passedValidation()` contains only lightweight operations
- [ ] No business logic (DB writes, API calls, job dispatching) in the hook
- [ ] Data merged in `passedValidation()` is documented as not in `validated()`
- [ ] Tests verify the hook fires when validation passes
- [ ] Tests verify the hook does NOT fire when validation fails

## Common Failures
- Treating `passedValidation()` as a business logic hook — leads to hidden side effects
- Merging data that should have been set in `prepareForValidation()` — data missing from `validated()`
- Heavy operations that slow every valid form submission

## Decision Points
- Use `prepareForValidation()` when the merged data must appear in `validated()`
- Use `passedValidation()` only for post-processing that is read-only or adds non-validated metadata

## Performance Considerations
- `passedValidation()` runs on every successful validation — keep under 1ms
- Defer heavy operations to queued jobs or service layer

## Security Considerations
- Do not perform authorization checks here — use `authorize()`
- Logged data must not contain sensitive information (passwords, tokens)

## Related Rules
- Rule 2: Keep passedValidation() Lightweight
- Rule 3: Do Not Put Business Logic in Validation Hooks

## Related Skills
- Implement Cross-Field Validation Using withValidator and after
- Implement Custom Error Responses Using failedValidation

## Success Criteria
- Side effects execute only on successful validation
- Side effects do not affect `validated()` output
- No performance degradation on valid form submissions
- Side effects are documented and testable

---

# Skill: Implement Custom Error Responses Using failedValidation

## Purpose
Override the default validation failure behavior to return custom error response structures, particularly for JSON API endpoints.

## When To Use
- API endpoints requiring consistent JSON error structures
- When the default redirect behavior (for web) is not appropriate
- When error responses need additional metadata (e.g., success flag, error codes)

## When NOT To Use
- Standard web forms that use Laravel's default redirect-back behavior
- When the default `ValidationException` response format is sufficient
- Authorization error handling (use `failedAuthorization()`)

## Prerequisites
- FormRequest class with `rules()` defined
- Understanding of the validation exception handling pipeline

## Inputs
- Validator instance (containing error messages)
- Request context (web vs API)

## Workflow
1. Override `failedValidation(Validator $validator)` in the FormRequest
2. Build the custom response structure using `$validator->errors()`
3. Throw `HttpResponseException` with the customized response
4. Use consistent response format across all API endpoints
5. Include only field-level error messages — do not leak internal state
6. Test both validation success and failure paths for the custom response

## Validation Checklist
- [ ] `failedValidation()` overridden instead of relying on default behavior
- [ ] Response format is consistent with other API error responses
- [ ] No sensitive data (stack traces, DB values, internal state) in the response
- [ ] Status code is 422 for validation errors
- [ ] Tests verify the custom error response structure on failure
- [ ] Tests verify validation success still returns the normal success response

## Common Failures
- Including debug information or internal state in error responses
- Inconsistent error structure across different FormRequests
- Not testing the error response format — broken error handling in production
- Forgetting to handle the case where validation passes normally

## Decision Points
- Use `failedValidation()` for endpoint-specific responses vs a global exception handler for app-wide consistency
- Choose JSON structure that matches frontend expectations (field-level vs summary errors)

## Performance Considerations
- `failedValidation()` runs only on validation failure — performance impact is negligible
- Error response construction should be fast (array building, no I/O)

## Security Considerations
- Error messages must not reveal internal application state or database contents
- Use `app()->isLocal()` for additional debug information in development only
- Do not include SQL queries, stack traces, or PII in error output

## Related Rules
- Rule 5: Test Both Pass and Fail Paths for Custom Hooks
- Rule 8: Do Not Leak Sensitive Information in failedValidation()

## Related Skills
- Implement Cross-Field Validation Using withValidator and after
- Implement Post-Validation Side Effects Using passedValidation

## Success Criteria
- Failed validation returns the custom response format consistently
- Successful validation returns the normal success response
- Error messages are user-safe and field-specific
- All API endpoints use the same error structure
