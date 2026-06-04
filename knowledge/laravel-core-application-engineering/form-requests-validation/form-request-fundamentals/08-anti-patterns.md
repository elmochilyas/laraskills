# Form Request Fundamentals — Anti-Patterns

## Anti-Pattern 1: Validation in the Controller

**Symptom:** Writing `$request->validate([...])` or `Validator::make($request->all(), [...])` directly in controller methods.

**Problem:** Inline validation in controllers violates single responsibility — controllers should orchestrate, not validate. Validation logic is duplicated when multiple endpoints share the same rules. The validation rules cannot be reused, tested independently, or extended with authorization.

```php
// BAD — inline validation in controller
public function store(Request $request)
{
    $validated = $request->validate([
        'title' => 'required|string|max:255',
        'body' => 'required|string',
        'published_at' => 'nullable|date',
    ]);
    // rest of controller logic
}
```

**Solution:** Create a dedicated FormRequest class and type-hint it in the controller method.

```php
// GOOD — dedicated FormRequest
public function store(StorePostRequest $request)
{
    $validated = $request->validated();
    // rest of controller logic
}
```

**Detection:** Search for `$request->validate(` and `Validator::make(` in controller files. Flag for extraction.

---

## Anti-Pattern 2: Not Calling parent::authorize() in Authorized Requests

**Symptom:** Subclassing or abstracting FormRequest authorization without calling `parent::authorize()`.

**Problem:** Parent classes may contain security checks, IP allowlisting, TOTP verification, or feature flags. Skipping `parent::authorize()` silently bypasses these safeguards.

```php
// BAD — bypasses parent authorization
class AdminPostRequest extends AuthorizedRequest
{
    public function authorize(): bool
    {
        // No parent::authorize() call
        return $this->user()->isAdmin();
    }
}
```

**Solution:** Always chain the parent authorization call.

```php
// GOOD — chains parent authorization
public function authorize(): bool
{
    return parent::authorize() && $this->user()->isAdmin();
}
```

**Detection:** Search for classes that extend `FormRequest` but override `authorize()`. Check if they call `parent::authorize()`.

---

## Anti-Pattern 3: Relying on $request->all() After Validation

**Symptom:** Using `$request->all()` instead of `$request->validated()` throughout the controller after a FormRequest has been injected.

**Problem:** `$request->all()` returns every submitted field including extra fields not in the rules, potentially leaking mass-assignable parameters. The validated data is available and safer.

```php
// BAD — uses unvalidated input
public function store(StoreUserRequest $request)
{
    User::create($request->all()); // Mass assignment risk!
}
```

**Solution:** Always use `$request->validated()` or `$request->safe()` for controller logic.

```php
// GOOD — uses validated input only
public function store(StoreUserRequest $request)
{
    User::create($request->validated());
}
```

**Detection:** Search for `$request->all()` in controller methods that also type-hint a FormRequest.

---

## Anti-Pattern 4: Forgetting to Type-Hint the FormRequest

**Symptom:** The controller method receives a `Illuminate\Http\Request` parameter alongside a FormRequest, or receives no FormRequest at all.

**Problem:** Without type-hinting the FormRequest, validation is never automatically triggered. The controller receives raw request data with no validation or authorization applied.

```php
// BAD — type-hints Request instead of FormRequest
public function store(Request $request) // No validation triggered
{
    // $request is raw, unvalidated
}
```

**Solution:** Type-hint the specific FormRequest class in the controller signature.

```php
// GOOD — type-hints FormRequest, validation runs automatically
public function store(StoreUserRequest $request)
{
    $validated = $request->validated();
}
```

**Detection:** Search for controller methods that should have FormRequests but type-hint `Illuminate\Http\Request`.

---

## Anti-Pattern 5: Accessing Route Parameters Via Input Instead of Route Binding

**Symptom:** Using `$this->input('post')` or `$this->get('post')` to retrieve route parameters inside a FormRequest.

**Problem:** Route model binding already resolves the model instance, available via `$this->route('post')`. Accessing it through input methods is redundant and may bypass model resolution.

```php
// BAD — redundant input access
public function authorize(): bool
{
    $postId = $this->input('post'); // Raw ID, not resolved model
    return $this->user()->can('update', Post::find($postId));
}
```

**Solution:** Use `$this->route('paramName')` to access the route-bound model.

```php
// GOOD — uses route binding
public function authorize(): bool
{
    return $this->user()->can('update', $this->route('post'));
}
```

**Detection:** Search for `$this->input(`, `$this->get(` inside FormRequest classes.

---

## Anti-Pattern 6: Empty or Trivial authorize() Methods

**Symptom:** `authorize()` returns `true` unconditionally with no explanation.

**Problem:** An always-true `authorize()` suggests the developer forgot to implement authorization. When explicit public access is intended, it should be documented.

```php
// BAD — silent default, suspicious
public function authorize(): bool
{
    return true;
    // Why? Is this intentional?
}
```

**Solution:** Document why no authorization check is needed or implement the check.

```php
// GOOD — intentional and documented
/**
 * This endpoint is rate-limited at middleware level.
 * No per-user authorization needed — creating a ticket is always allowed.
 */
public function authorize(): bool
{
    return true;
}
```

**Detection:** Search for `return true` in `authorize()` methods. Flag for documentation or implementation.

---

## Anti-Pattern 7: Not Using Request-Specific Validation Messages

**Symptom:** Relying solely on `resources/lang/{locale}/validation.php` generic messages without overriding messages in the specific FormRequest.

**Problem:** Generic validation messages provide no context about which field or business rule failed. Users see confusing messages like "validation.required" or "The title field is required." when a custom message like "Please provide a post title." would be clearer.

```php
// BAD — generic messages only
class StorePostRequest extends FormRequest
{
    // No messages() method — uses default translations
    public function rules(): array
    {
        return [
            'title' => 'required|min:5',
            'body' => 'required|min:100',
        ];
    }
}
```

**Solution:** Override `messages()` to provide user-friendly, context-aware messages.

```php
// GOOD — specific, helpful messages
public function messages(): array
{
    return [
        'title.required' => 'Every post needs a title.',
        'title.min' => 'Your title must be at least 5 characters.',
        'body.required' => 'Please write your post content.',
        'body.min' => 'Your post must be at least 100 characters. Tell us more!',
    ];
}
```

**Detection:** Search for FormRequest classes without a `messages()` method but with custom validation rules that need user-friendly feedback.
