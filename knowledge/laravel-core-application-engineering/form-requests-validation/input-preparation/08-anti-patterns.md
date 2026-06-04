# Input Preparation — Anti-Patterns

## Anti-Pattern 1: Mutating $this->request in prepareForValidation()

**Symptom:** Calling `$this->merge()`, `$this->replace()`, or `$this->request->set()` inside `prepareForValidation()`.

**Problem:** These methods modify the underlying `ParameterBag` directly. Other parts of the request (middleware, controllers, listeners) that access `$request->input('field')` receive the mutated values even though they were expecting raw input. This is a side effect that leaks beyond the FormRequest's responsibilities.

```php
// BAD — direct mutation of ParameterBag
protected function prepareForValidation(): void
{
    $this->merge([
        'slug' => Str::slug($this->input('title')),
    ]);
}
```

**Solution:** Use `$this->prepareForValidation()` solely to set values via `$this->merge()` or use a DTO for transformation — but understand that merge is the intended pattern. If avoiding mutation is critical, apply transformations in a dedicated pipeline step.

However, `merge()` is the documented Laravel pattern for input preparation. A better solution for avoiding mutation concerns is to create a dedicated input pipeline:

```php
// GOOD — keeps concerns separate
class NormalizeInput
{
    public function handle(Request $request, Closure $next)
    {
        $request->merge(['slug' => Str::slug($request->input('title'))]);
        return $next($request);
    }
}
```

**Detection:** Search for `$this->merge(`, `$this->replace(`, `$this->request->` inside `prepareForValidation()`.

---

## Anti-Pattern 2: Heavy Operations in prepareForValidation()

**Symptom:** Database queries, external API calls, image processing, or file uploads in `prepareForValidation()`.

**Problem:** `prepareForValidation()` runs for every request including those that fail authorization. Heavy operations here waste resources on requests that will be rejected with 403. Additionally, these operations are untestable without HTTP scaffolding.

```php
// BAD — DB query in prepareForValidation
protected function prepareForValidation(): void
{
    $user = User::where('email', $this->input('email'))->first();
    $this->merge(['user_id' => $user?->id]);
}
```

**Solution:** Move heavy operations to the service layer after validation and authorization pass.

```php
// GOOD — move to service layer
class RegistrationService
{
    public function register(StoreUserDTO $dto): User
    {
        // Heavy operations here
    }
}
```

**Detection:** Search for `::find`, `::where`, `::create`, `Http::`, `dispatch`, `Storage::` inside `prepareForValidation()`.

---

## Anti-Pattern 3: Validation Rules That Depend on Mutated Input Without Explicit Ordering

**Symptom:** Rules depend on values set in `prepareForValidation()`, but the method's timing is implicit and fragile.

**Problem:** Developers reading `rules()` see validations for fields generated in `prepareForValidation()` and have no indication where those values come from. The dependency on method execution order is invisible and easy to break.

```php
// BAD — invisible dependency
protected function prepareForValidation(): void
{
    $this->merge(['slug' => Str::slug($this->input('title'))]);
}

public function rules(): array
{
    return [
        'slug' => 'required|string|max:255|unique:posts', // Where does slug come from?
    ];
}
```

**Solution:** Document the dependency or move the derivation into the rules using rule objects that accept the source data.

```php
// GOOD — explicit dependency
protected function prepareForValidation(): void
{
    $this->merge(['slug' => Str::slug($this->input('title'))]);
}

public function rules(): array
{
    return [
        'slug' => ['required', 'string', 'max:255', new UniqueSlug()],
    ];
}
```

**Detection:** Search for fields in `rules()` that are also set in `prepareForValidation()`. Review for documented dependencies.

---

## Anti-Pattern 4: Null Coalescing That Masks Missing Required Fields

**Symptom:** Using `??` or `?:` fallback values in `prepareForValidation()` for fields that should be required.

**Problem:** Fallback values silently supply default data for missing fields, bypassing `required` validation rules. The user submits incomplete data, the validation passes, and the system operates on default assumptions.

```php
// BAD — masks missing required field
protected function prepareForValidation(): void
{
    $this->merge([
        'sort_order' => $this->input('sort_order') ?? 0, // Missing sort_order silently defaults to 0
    ]);
}

public function rules(): array
{
    return [
        'sort_order' => 'required|integer|min:1', // Never triggered — default exists
    ];
}
```

**Solution:** Let required fields remain missing — the validation rule will catch them. Apply defaults only for optional fields.

```php
// GOOD — preserves required behavior
protected function prepareForValidation(): void
{
    // Only apply defaults for truly optional fields
    $this->mergeIfMissing([
        'theme' => 'light',
    ]);
}
```

**Detection:** Search for `??`, `??=`, `?:` inside `prepareForValidation()`. Check if the field is also in `rules()` as `required`.

---

## Anti-Pattern 5: Stripping or Sanitizing Input Without Documentation

**Symptom:** `prepareForValidation()` silently removes HTML tags, trims whitespace, or lowercases strings without documenting the transformation.

**Problem:** Consumers of the validated data have no way to know that input was transformed. A controller acting on validated data assumes values match user input exactly. Downstream bugs (e.g., truncated strings) are difficult to trace when transformations are undocumented.

```php
// BAD — undocumented sanitization
protected function prepareForValidation(): void
{
    $this->merge([
        'bio' => strip_tags($this->input('bio')), // Silent strip
    ]);
}
```

**Solution:** Document the transformation or use a named method that communicates the side effect.

```php
// GOOD — documented, testable
/**
 * Strip HTML tags from bio before validation.
 * Intended to prevent XSS in profile display.
 */
protected function stripHtmlFromBio(): void
{
    $this->merge([
        'bio' => strip_tags($this->input('bio')),
    ]);
}

protected function prepareForValidation(): void
{
    $this->stripHtmlFromBio();
}
```

**Detection:** Search for `strip_tags`, `trim`, `strtolower`, `str_replace`, `htmlspecialchars` inside `prepareForValidation()`.

---

## Anti-Pattern 6: Input Preparation That Depends on Authorized User Data

**Symptom:** Reading from `$this->user()` inside `prepareForValidation()` to derive field values.

**Problem:** `prepareForValidation()` runs before `authorize()`. When the user is not authorized, preparation that depends on user data may still have executed, consuming resources and potentially creating state. Additionally, if an unauthenticated route calls the FormRequest, `user()` may be null.

```php
// BAD — depends on user before authorization
protected function prepareForValidation(): void
{
    $this->merge([
        'tenant_id' => $this->user()->tenant_id, // Fatal if null, wasted if unauthorized
    ]);
}
```

**Solution:** Move authorization-dependent logic out of preparation. Use `after()` hooks or controller-level setup.

```php
// GOOD — user data after authorization
public function rules(): array
{
    return [
        'tenant_id' => ['required', new BelongsToUserTenant()],
    ];
}
```

**Detection:** Search for `$this->user(` inside `prepareForValidation()`. Flag for authorization timing concerns.
