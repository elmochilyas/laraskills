# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Form Requests & Validation |
| Knowledge Unit | Form Request Fundamentals |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Form Requests are Laravel's mechanism for encapsulating HTTP input validation and authorization into dedicated, autoloaded classes. They implement the `ValidatesWhenResolved` contract, which triggers validation automatically when the request is resolved from the container via the controller method's type-hint. This removes validation logic from controllers and ensures that every action receives pre-validated, authorized input. The controller never sees invalid data — the request throws `ValidationException` before the controller method executes.

---

## Core Concepts

- **ValidatesWhenResolved contract**: Triggered by the Router after instantiation, before passing to controller
- **Auto-validation pipeline**: Resolve → validateResolved() → passes (controller executes) or fails (ValidationException thrown)
- **Method contract**: `rules()` returns validation rules array; `authorize()` returns boolean permission check
- **Optional overrides**: `messages()`, `attributes()`, `validationData()` for customization
- **Gatekeeper pattern**: The FormRequest stands at the controller door — only valid, authorized requests pass through

---

## When To Use

- Any controller action that accepts user input
- Actions requiring authorization that varies per-request
- Forms with 3+ validation rules that would clutter the controller
- API endpoints needing consistent validation error responses

## When NOT To Use

- Simple forms with 1-2 rules (inline validation in the controller suffices)
- Non-HTTP contexts (commands, jobs, services — use manual Validator)
- Actions that don't accept user input (GET requests without filters)

---

## Best Practices

- **One FormRequest per action** — each action has its own request class with its own rules and authorization
- **Keep rules() clean** — return arrays (not strings) for complex rules to leverage IDE autocompletion
- **Use authorize() for HTTP-level access** — not for business-rule authorization (that belongs in Policies/Services)
- **Trust validated data** — once a FormRequest passes, the controller can assume data is valid
- **Override messages() for user-friendly errors** — don't rely on default Laravel messages for production

---

## Architecture Guidelines

- FormRequests extend `Illuminate\Foundation\Http\FormRequest`
- Located in `app/Http/Requests/` (default) or co-located with domain modules
- Controller method type-hints the request: `public function store(StoreUserRequest $request)`
- Validation errors automatically redirect back (web) or return JSON 422 (API)
- The `validated()` method returns only data that passed all rules
- The `safe()` method returns a `ValidatedInput` instance for scoped access

---

## Performance

FormRequest validation runs on every request that type-hints the class. The overhead is proportional to the number and complexity of rules. For typical forms (5-20 fields), the cost is negligible (~1-5ms). Database rules like `unique:users` add query overhead — use judiciously.

---

## Security

FormRequests are a critical security boundary. They:
- Validate all input before the controller sees it
- Reject unauthorized requests via `authorize()` before validation runs (prevents info leakage)
- Use the container for rule resolution, supporting dependency injection
- Throw `ValidationException` which is automatically handled by Laravel's exception handler

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Validation in controllers | Familiarity with closures | Controller bloat, hard to test | Create dedicated FormRequest |
| Over-authorization | Business logic in authorize() | Authorize() becomes too complex | Delegate to Policy/Service |
| Not using validated() | Accessing `$request->all()` | Unvalidated data used in service | Use `$request->validated()` |
| Missing authorize() | Always returns true | No access control on the action | Add proper authorization check |
| Giant FormRequest | One request for all actions | Rules become conditional mess | One request per action |

---

## Anti-Patterns

- **Controller validation**: `$request->validate([...])` in controller with 10+ rules
- **FormRequest as DTO**: Passing the entire request object to the service layer
- **Missing authorize()**: `authorize()` returns `true` without any actual check
- **One request for create and update**: Conditional rules for store vs update → use separate requests

---

## Examples

**Basic FormRequest:**
```php
class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', User::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }
}
```

**Controller usage:**
```php
public function store(StoreUserRequest $request)
{
    User::create($request->validated());
    return redirect()->route('users.index');
}
```

**Validation error response (API):**
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email has already been taken."]
    }
}
```

---

## Related Topics

- authorization-in-requests — authorize() method details
- validation-rule-patterns — String vs array syntax, Rule objects
- custom-validation-rules — Invokable rule classes
- conditional-validation — Field-dependent rules
- after-validation-hooks — Post-validation processing
- form-request-testing — Testing FormRequests via integration tests

---

## AI Agent Notes

- FormRequest does NOT register itself; the Router calls `validateResolved()` on `ValidatesWhenResolved` instances
- The execution pipeline: prepareForValidation → passesAuthorization → getValidatorInstance → fails → passedValidation
- `authorize()` returns `true` by default if not defined
- `validated()` excludes fields that have rules but no matching data AND excluded fields
- The `validator()` method override provides complete control over the validator instance

---

## Verification

- [ ] Each action has its own FormRequest
- [ ] `authorize()` method implemented with proper access check
- [ ] `rules()` returns array of rules (not pipe-delimited strings for complex rules)
- [ ] Controller uses `$request->validated()` not `$request->all()`
- [ ] FormRequest in proper namespace and autoloaded
- [ ] Authorization runs before validation
- [ ] Custom error messages defined via `messages()` method
- [ ] Integration tests cover validation failure and success scenarios
