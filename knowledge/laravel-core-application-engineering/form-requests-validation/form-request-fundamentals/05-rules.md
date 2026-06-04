# Form Request Fundamentals — Engineering Rules

---

## Rule 1: One FormRequest Per Controller Action

---

## Category

Architecture

---

## Rule

Create a dedicated FormRequest class for each controller action that accepts user input. Do not reuse a single FormRequest across multiple actions.

---

## Reason

Each action has unique validation rules, authorization requirements, and error messages. A shared FormRequest requires conditional logic to differentiate between actions, which grows unmaintainable and hides which rules apply to which action.

---

## Bad Example

```php
class UserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => $this->isMethod('post') ? 'required|string' : 'sometimes|string',
            'email' => $this->isMethod('post') ? 'required|email|unique:users' : 'sometimes|email',
        ];
    }
}
```

---

## Good Example

```php
class StoreUserRequest extends FormRequest { /* create rules */ }
class UpdateUserRequest extends FormRequest { /* update rules */ }
```

---

## Exceptions

For truly identical requests across actions (e.g., the same filters on both `index` and `export`), reuse is acceptable with clear documentation.

---

## Consequences Of Violation

Maintenance risks: conditional logic accumulates, rules become ambiguous. Testing risks: each test must set up correct action context.

---

## Rule 2: Always Use validated() in Controllers — Never all()

---

## Category

Security

---

## Rule

Access validated input exclusively through `$request->validated()`. Never use `$request->all()`, `$request->input()`, or `$request->only()` in the controller when a FormRequest is type-hinted.

---

## Reason

`validated()` returns only data that passed all validation rules. Other access methods return raw (potentially malicious) input, including fields the form did not intend to accept, bypassing the entire validation boundary.

---

## Bad Example

```php
public function store(StoreUserRequest $request)
{
    User::create($request->all()); // Unvalidated, extra fields accepted
}
```

---

## Good Example

```php
public function store(StoreUserRequest $request)
{
    User::create($request->validated()); // Only validated data
}
```

---

## Exceptions

Use `$request->safe()->only(['field1', 'field2'])` when the action needs a subset of validated fields. This still uses validated data.

---

## Consequences Of Violation

Security risks: mass-assignment vulnerabilities. Data integrity risks: unvalidated fields stored in database.

---

## Rule 3: Return Rule Arrays — Not Pipe-Delimited Strings — for Complex Rules

---

## Category

Framework Usage

---

## Rule

Return validation rules as PHP arrays (not pipe-delimited strings) when the rule set includes Rule objects, custom rules, or more than 3 rules per field.

---

## Reason

Array syntax supports Rule objects (`Rule::unique()`, `Rule::exists()`), custom invokable rules, and IDE autocompletion. Pipe-delimited strings cannot represent Rule objects and are error-prone with regex patterns and comma-containing parameters.

---

## Bad Example

```php
public function rules(): array
{
    return [
        'email' => 'required|email|unique:users,email|max:255',
        'password' => 'required|string|min:8|confirmed|regex:/[A-Z]/',
    ];
}
```

---

## Good Example

```php
public function rules(): array
{
    return [
        'email' => ['required', 'email', 'max:255', Rule::unique('users')],
        'password' => ['required', 'string', 'min:8', 'confirmed', 'regex:/[A-Z]/'],
    ];
}
```

---

## Exceptions

For trivial rules with 1-2 simple constraints and no Rule objects (e.g., `'title' => 'required|string|max:255'`), string syntax is acceptable.

---

## Consequences Of Violation

Maintenance risks: rules break when parameters contain commas (regex). Framework compatibility: Rule objects silently fail in string syntax.

---

## Rule 4: Implement authorize() on Every FormRequest

---

## Category

Security

---

## Rule

Every FormRequest must explicitly implement `authorize()`, even when access is open to all authenticated users.

---

## Reason

The default `authorize()` returns `true` without any check. Explicit implementation forces the developer to consciously consider access control for every input-accepting action, preventing accidental authorization gaps.

---

## Bad Example

```php
class ContactFormRequest extends FormRequest
{
    // No authorize method — defaults to true
    public function rules(): array
    {
        return ['message' => ['required', 'string']];
    }
}
```

---

## Good Example

```php
class ContactFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Explicit: all authenticated users may submit
    }

    public function rules(): array
    {
        return ['message' => ['required', 'string']];
    }
}
```

---

## Exceptions

Unconfigured base request classes that are never used directly may omit `authorize()`. All concrete request classes must implement it.

---

## Consequences Of Violation

Security risks: forgotten authorization on new actions. Audit compliance: missing explicit access control documentation.

---

## Rule 5: Override messages() for User-Friendly Validation Errors

---

## Category

Design

---

## Rule

Override the `messages()` method to provide user-friendly, context-specific error messages. Do not rely on Laravel's default messages for production applications.

---

## Reason

Default Laravel validation messages are generic and may not match the application's terminology, tone, or language. Custom messages improve user experience and can include field-specific guidance.

---

## Bad Example

```php
// Uses default messages
// "The email field is required." (impersonal)
```

---

## Good Example

```php
public function messages(): array
{
    return [
        'email.required' => 'We need your email address to send you the confirmation.',
        'email.email' => 'Please enter a valid email address.',
        'password.min' => 'Your password must be at least :min characters for security.',
    ];
}
```

---

## Exceptions

Internal API endpoints consumed only by first-party clients may use default messages.

---

## Consequences Of Violation

User experience risks: impersonal or confusing error messages. Inconsistent terminology: error messages may not match application tone.

---

## Rule 6: Trust Validated Data — It Has Passed the Gate

---

## Category

Architecture

---

## Rule

Do not re-validate or re-sanitize data inside the controller or service after a FormRequest has passed. The FormRequest guarantees the data is valid.

---

## Reason

The FormRequest is the validation boundary. Re-validating in the controller duplicates effort, violates DRY, and suggests the validation rules are incomplete. If the service needs additional guarantees, they belong in the FormRequest, not downstream.

---

## Bad Example

```php
public function store(StoreUserRequest $request)
{
    $data = $request->validated();
    if (strlen($data['name']) > 255) { // Re-validating — redundant
        throw new \Exception('Name too long');
    }
    User::create($data);
}
```

---

## Good Example

```php
public function store(StoreUserRequest $request)
{
    User::create($request->validated()); // Trust the validation boundary
}
```

---

## Exceptions

When the FormRequest validates data that could be stale by the time it reaches the service (e.g., `unique:users` in high-concurrency), a service-level check with lock or transaction may be needed.

---

## Consequences Of Violation

Maintenance risks: duplicated validation logic across layers. Performance risks: redundant checks on every request.
