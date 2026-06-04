# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Threat Mitigation |
| Knowledge Unit | Form Request Validation Rules and Best Practices |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Form Requests are dedicated validation classes that encapsulate validation logic for controller actions. They extend `FormRequest` and define `rules()` and `authorize()` methods. `$request->validated()` returns only the validated, authorized fields — this should be the only data passed to model `create()`/`update()` (never `$request->all()`). Form Requests support rule objects, custom validation rules, after-validation hooks, and dependency injection. Using Form Requests is the standard pattern for secure input validation in Laravel.

---

## Core Concepts

- **`FormRequest`**: A class extending `Illuminate\Foundation\Http\FormRequest`. Handles authorization and validation before the controller.
- **`rules()`**: Returns an array of validation rules for the request's input fields.
- **`authorize()`**: Returns `bool` — whether the authenticated user is allowed to make this request. Defaults to `false`.
- **`$request->validated()`**: Returns only the fields that passed validation. Prevents mass assignment of unexpected fields.
- **After Validation Hook**: `withValidator($validator)` — modify the validator after rules are added. For custom validation logic.
- **Rule Objects**: Reusable validation classes implementing `Rule` contract. `new UniqueRule(...)`.

---

## When To Use

- Every controller action accepting user input — Form Requests centralize validation logic
- Complex validation requiring custom rules, conditional logic, or authorization checks
- API endpoints where validated data is passed directly to create/update operations
- Maintaining a consistent validation pattern across the application

## When NOT To Use

- Simple, one-off validation with a single rule (inline `validate()` in controller is acceptable)
- Read-only endpoints (GET requests) — validation matters less for reads
- When Form Request overhead is not justified (small application, single developer)

---

## Best Practices

- **Always Use `$request->validated()`**: Never pass `$request->all()` to create/update. Validated data prevents mass assignment of unexpected fields.
- **Set `authorize()` to `true` for All Users**: If authorization is not needed, return `true`. Default is `false` — forgetting to implement it denies all requests.
- **Use Rule Objects**: `unique:table,column,except,idColumn` for uniqueness checks. Custom Rule classes for complex logic.
- **Keep Rules Readable**: Use arrays with pipe-separated rules for simple cases, rule objects for complex ones.
- **`bail` Modifier**: Stop validating after the first failure. Prevents redundant error messages.

---

## Architecture Guidelines

- One Form Request per controller action (or per logical validation group)
- Form Request classes in `app/Http/Requests/`
- Validation rules should be readable and declarative — avoid closures in rules() method
- Custom rules in `app/Rules/` — implement `Illuminate\Contracts\Validation\Rule`
- Inject dependencies via Form Request's `__construct()` — resolves from container

---

## Performance Considerations

- Form Request instantiation: lightweight class resolution — negligible
- Validation execution: O(n) where n is the number of fields × rules — usually <1ms
- Database validation rules (`unique`, `exists`): adds DB query per rule
- Custom rule objects: performance depends on internal logic

---

## Security Considerations

- **First Line of Defense**: Form Requests validate input before the controller receives it. Combined with mass assignment protection, this provides defense in depth.
- **`authorize()` Default**: Default `false` — if `authorize()` is not implemented, all requests are denied. Always add `return true` or proper authorization.
- **SQL Injection**: Validation rules prevent malformed input but do not replace parameterized queries.
- **File Upload Validation**: Use `file`, `mimes`, `max` rules for upload security. Validate before the file reaches the controller.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using `$request->all()` instead of `$request->validated()` | Convenience | Unexpected fields can bypass mass assignment | Always use validated data |
| Forgetting `authorize()` method | Default is false | All requests denied (403) | Always implement authorize() |
| Complex closures in rules() | Inline custom validation | Testable; cannot reuse | Extract to Rule objects |
| Not using bail modifier | Assuming stop-on-first-failure | Multiple errors for the same field | Use `bail` for early stopping |
| No validation for GET params | Assuming GET is safe | Directory traversal, IDOR via query params | Validate GET parameters too |

---

## Anti-Patterns

- **One monolithic Form Request for the entire controller**: Each action gets its own Form Request
- **Validation in controllers instead of Form Requests**: Mixing validation and business logic
- **`$request->validate()` in controller**: Works but misses Form Request's authorization and testability benefits

---

## Examples

**Form Request definition:**
```php
namespace App\Http\Requests;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Or Gate::authorize('create', Post::class);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
            'tags' => ['array'],
            'tags.*' => ['exists:tags,id'],
            'publish_at' => ['nullable', 'date', 'after:now'],
        ];
    }
}
```

**Usage in controller:**
```php
public function store(StorePostRequest $request)
{
    // $request->validated() contains only validated fields
    $post = Post::create($request->validated());
    
    return redirect()->route('posts.show', $post);
}
```

**Custom rule object:**
```php
namespace App\Rules;

class Uppercase implements Rule
{
    public function passes($attribute, $value): bool
    {
        return strtoupper($value) === $value;
    }

    public function message(): string
    {
        return 'The :attribute must be uppercase.';
    }
}
```

---

## Related Topics

- Mass assignment protection
- Input validation security
- Custom validation rules
- File upload security

---

## AI Agent Notes

- Form Requests are the standard validation pattern. If the project uses `$request->validate()` in controllers, recommend migrating to Form Requests.
- Always check that `authorize()` returns `true` (or a proper check) — the default `false` blocks all requests.
- `$request->validated()` vs `$request->all()` is the most important security distinction.

---

## Verification

- [ ] Form Requests used for all state-changing operations
- [ ] `$request->validated()` used (not `$request->all()`) for create/update
- [ ] `authorize()` method implemented (returns true or proper auth check)
- [ ] Complex validation extracted to Rule objects
- [ ] `bail` modifier used on appropriate fields
- [ ] Uniqueness validation handles the current record (except clause)
- [ ] GET parameters validated where applicable
- [ ] File uploads validated with `file`, `mimes`, `max` rules
- [ ] Form Requests testable (no hardcoded dependencies)
