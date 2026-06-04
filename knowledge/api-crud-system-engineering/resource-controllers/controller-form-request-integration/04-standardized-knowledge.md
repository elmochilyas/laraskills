| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Controller Form Request Integration |
| **Metadata** | Difficulty | Foundation |
| **Metadata** | Dependencies | Controller Method Injection, Validation Basics |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Laravel form requests encapsulate validation logic and authorization checks into dedicated classes injected into controller methods via type-hinting. When a controller method parameter is type-hinted with a form request class, Laravel automatically validates the incoming request against the rules defined in that class before the controller method executes. Failed validation automatically returns a 422 response — the controller method is never called.

## Core Concepts

- **Type-Hint Resolution**: `public function store(StorePhotoRequest $request)` — validated before method body executes.
- **rules() Method**: Returns an array of validation rules for the incoming data.
- **authorize() Method**: Returns boolean determining if the user can perform the action.
- **Auto-422 on Failure**: Validation failure returns 422 immediately; controller method is never executed.
- **validated() Method**: Returns only the data that passed validation — never use `$request->all()` with form requests.

## When To Use

- All `store` and `update` controller actions.
- Any action requiring input validation beyond simple existence checks.
- Actions with authorization checks that are simple gate checks.
- When validation rules differ between store and update operations.

## When NOT To Use

- Read-only actions (`index`, `show`) that don't accept user input.
- Actions with trivial validation that fits in one line.
- When authorization logic is complex — keep in policies, not form requests.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Always use `$request->validated()` in controllers | Passing unvalidated mass-assignment data bypasses validation |
| Create separate Store/Update form requests per resource | Store and update typically have different rules (required vs sometimes, unique exclusions) |
| Keep `authorize()` as a simple gate check | Complex authorization belongs in policies |
| Create a base form request for shared rules when store/update overlap | Prevents rule drift between the two request types |
| Test form request rules independently | Unit tests with `$request->merge()` are faster than HTTP tests |

## Architecture Guidelines

- Generate form requests with `php artisan make:request StorePhotoRequest`.
- Use `passedValidation()` and `failedValidation()` hooks for side effects.
- Log validation failures in `failedValidation()` for audit trails.
- Return custom error messages via `messages()` method for production APIs.
- Place form requests in `app/Http/Requests/` following the same domain organization as controllers.

## Performance Considerations

- Simple validation rules take ~0.1ms per field.
- `unique` with `ignore` rules add a database query (~1-2ms).
- `authorize()` adds a policy resolution call — cache policy results if used repeatedly.
- `validated()` reuses the already-built validator, making it faster than `$request->only()`.

## Security Considerations

- Form requests are validated before the controller method executes — this is a security-by-design pattern.
- Never use `$request->all()` in controllers with form requests — bypasses validation entirely.
- Authorization in form requests returns 403 if denied — test both validation and authorization paths.
- Ensure `prepareForValidation()` doesn't introduce mass-assignment vulnerabilities.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using `$request->all()` instead of `validated()` | Habit from non-form-request controllers | Bypasses validation; mass-assignment vulnerability | Always use `$request->validated()` |
| Duplicating rules across Store and Update requests | No shared base form request | Rules drift over time | Create shared base request |
| Complex `authorize()` duplicating policies | Convenience | Authorization logic split between form requests and policies | Keep authorize() simple; delegate to policy |
| Form request not type-hinted (plain Request used) | Missing type-hint | Validation moves to controller body | Always type-hint the form request |

## Anti-Patterns

- **`$request->all()` with form requests**: The most common and dangerous mistake — bypasses validation.
- **Single form request for both store and update**: Forces conditional rules and reduces clarity.
- **Authorization logic in form requests that duplicates policies**: Splits authorization across layers.
- **Empty `rules()` returning no validation**: All data passes — defeats the purpose of form requests.

## Examples

- **StorePhotoRequest**: `rules()` with `required` for POST, `sometimes` for PUT; `authorize()` checking `create` ability.
- **Controller usage**: `public function store(StorePhotoRequest $request) { return new PhotoResource(Photo::create($request->validated())); }`
- **Conditional rules**: `'image' => $this->isMethod('POST') ? ['required', 'image'] : ['sometimes', 'image']`
- **After-validation hook**: `$validator->after(function ($validator) { if (limitReached) $validator->errors()->add('image', 'Limit reached'); })`

## Related Topics

- Controller Method Injection — How form requests are resolved
- Validation Rule Design — Defining comprehensive validation rules
- Controller Action Delegation — Delegating validated data to action classes

## AI Agent Notes

- Always generate Store and Update form requests for new API resource controllers.
- Ensure controllers use `$request->validated()` exclusively.
- Test form request rules with `$request->merge()` in unit tests.
- Keep `authorize()` simple; delegate complex logic to policies.

## Verification

- [ ] Store and update actions use typed form requests (not plain `Request`)
- [ ] Controllers use `$request->validated()` (not `$request->all()`)
- [ ] Store and Update requests exist as separate classes
- [ ] `authorize()` method returns boolean (simple gate check)
- [ ] Validation failure returns 422 (tested)
- [ ] Authorization failure returns 403 (tested)
- [ ] Form request rules are unit tested independently from controller
