# Skill: Create Validator Instances Manually for Dynamic Rules
## Purpose
Build Validator objects manually (not via Form Request) when rules depend on runtime conditions — user roles, resource state, database lookups — or when validation must happen outside HTTP context (console commands, queued jobs, service layers).
## When When NOT To Use
When a Form Request can statically define all rules (use Form Request); when validation is simple and controller is the only consumer (use Form Request); for reusable validation logic (use custom Rule objects).
## Prerequisites
Laravel Validator facade; validation rule definitions; understanding of `Validator::make()` signature.
## Inputs
Data array; rules array; custom error messages (optional); custom attributes (optional).
## Workflow
1. Call `Validator::make($data, $rules, $messages, $attributes)` with the data and rules
2. For dynamic rules, build the `$rules` array conditionally (e.g., based on `auth()->user()->role`)
3. Call `$validator->validate()` to get validated data on success or throw on failure
4. Or call `$validator->passes()` / `$validator->fails()` for conditional logic
5. Manually handle `ValidationException` or use `$validator->errors()` for custom responses
6. For reusable manual validation, extract into a custom Validation class or action
7. Test manual validation the same way as Form Request validation — with unit tests
## Validation Checklist
- [ ] Rules array correctly reflects runtime conditions
- [ ] `$validator->validate()` throws `ValidationException` on failure
- [ ] Custom error messages are provided for user-facing rules
- [ ] Custom attributes rename dot-notation fields in error output
- [ ] Manual validation is wrapped in try/catch when custom error handling is needed
- [ ] Reusable manual validation logic is extracted — not duplicated
## Common Failures
- Not catching `ValidationException` — returns Laravel's default redirect response for API
- Building dynamic rules inside the controller — couples validation to HTTP
- Reusing a Form Request's `rules()` method outside HTTP context (missing dependencies)
- Forgetting to provide custom attributes — error messages show ugly dot-notation keys
## Decision Points
- Custom Rule class vs manual Validator for complex conditional logic
- Manual validation in service layer vs wrapping Form Request to accept context
## Performance/Security Considerations
Manual validator creation is lightweight — no HTTP kernel overhead. Security: runtime-derived rules must not expose unauthorized validation paths; test role-based rule conditions.
## Related Rules/Skills
Form Request Design; Custom Validation Rules; Form Request Testing; Input Preparation.
## Success Criteria
Validation is performed correctly outside HTTP context; runtime conditions dynamically alter rules; errors are returned in consistent format; controller remains free of validation logic.
