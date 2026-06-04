# Form Request Customization Points — Checklists

## Override Selection
- [ ] `prepareForValidation()` used for all input transformations and merges
- [ ] `withValidator()` used for post-rule validation and after-hooks
- [ ] `failedValidation()` only overridden when API contract requires non-default error format
- [ ] `failedAuthorization()` returns consistent 403/404 responses
- [ ] No input modification occurs outside `prepareForValidation()`

## Implementation
- [ ] `$this->merge()` is the only method used to add/modify input in `prepareForValidation()`
- [ ] `$validator->after()` closures in `withValidator()` have access to all request data
- [ ] Custom `failedValidation()` throws `HttpResponseException` with properly structured response
- [ ] `failedAuthorization()` response matches the application's error response conventions
- [ ] No business logic (DB queries, notifications) exists in `failedValidation()`

## Testing
- [ ] Test that `prepareForValidation()` correctly transforms input
- [ ] Test that `withValidator()` after-hooks trigger for cross-field violations
- [ ] Test that `failedValidation()` returns the expected error structure
- [ ] Test that `failedAuthorization()` returns the expected HTTP status code
- [ ] Test that validation errors still surface correctly when multiple overrides exist
