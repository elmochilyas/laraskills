# Authorization in Requests — Anti-Patterns

## Anti-Pattern 1: Complex Inline Logic in authorize()

**Symptom:** Writing long if/else chains, role checks, or database queries directly inside `authorize()` instead of delegating to a Policy.

**Problem:** Inline authorization logic scatters access rules across request classes, cannot be reused, and is impossible to unit-test without HTTP scaffolding. The `authorize()` method becomes a dumping ground for ad-hoc permission checks.

```php
// BAD — inline logic
public function authorize(): bool
{
    if ($this->user()->role === 'admin') {
        return true;
    }
    if ($this->user()->id === $this->route('post')->user_id) {
        return true;
    }
    $subscription = Subscription::where('user_id', $this->user()->id)->first();
    return $subscription?->active ?? false;
}
```

**Solution:** Delegate to a Policy method. Keep `authorize()` as a single-line delegation.

```php
// GOOD — single-line delegation
public function authorize(): bool
{
    return $this->user()->can('update', $this->route('post'));
}
```

**Detection:** Search for `if`, `switch`, `::where`, `::find` inside `authorize()` methods. Flag any method exceeding 3 lines.

---

## Anti-Pattern 2: Missing authorize() on Mutating Actions

**Symptom:** Omitting `authorize()` entirely on create, update, or delete FormRequests.

**Problem:** The default `authorize()` returns `true`, granting access to every authenticated user. Missing authorization on mutating actions silently bypasses access control.

```php
// BAD — no authorization
class UpdatePostRequest extends FormRequest
{
    public function rules(): array
    {
        return ['title' => ['required', 'string']];
    }
    // authorize() not implemented — defaults to true
}
```

**Solution:** Implement `authorize()` on every FormRequest. Even public endpoints should explicitly return `true`.

```php
// GOOD — explicit authorization
class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('post'));
    }
}
```

**Detection:** Search for classes extending `FormRequest` that do not define `authorize()`.

---

## Anti-Pattern 3: Database Queries in authorize()

**Symptom:** Querying the database inside `authorize()` to resolve model instances, check quotas, or load relationships.

**Problem:** `authorize()` runs before validation. Database queries here are wasted on requests that will be rejected for invalid input. Additionally, route model binding already resolves the resource — re-querying is redundant.

```php
// BAD — redundant query
public function authorize(): bool
{
    $post = Post::findOrFail($this->input('post_id'));
    return $this->user()->can('update', $post);
}
```

**Solution:** Use `$this->route('param')` to access route model binding results. Delegate complex authorization to Policies.

```php
// GOOD — uses route binding
public function authorize(): bool
{
    return $this->user()->can('update', $this->route('post'));
}
```

**Detection:** Search for `::find`, `::where`, `::first`, `DB::`, `::query` inside `authorize()` methods.

---

## Anti-Pattern 4: Returning false Without a Denial Message

**Symptom:** Returning `false` from `authorize()` instead of `Response::deny('message')`.

**Problem:** A bare `false` produces a generic 403 response with no user-facing feedback. Users cannot distinguish between "not logged in," "not the owner," or "insufficient role" — all produce the same opaque 403.

```php
// BAD — no user feedback
public function authorize(): bool
{
    if ($this->user()->cannot('update', $this->route('post'))) {
        return false;
    }
    return true;
}
```

**Solution:** Return `Response::deny()` with a descriptive message.

```php
// GOOD — descriptive denial
public function authorize(): Response
{
    if ($this->user()->cannot('update', $this->route('post'))) {
        return Response::deny('You do not own this post.');
    }
    return Response::allow();
}
```

**Detection:** Search for `return false` inside `authorize()` methods. Flag for conversion to `Response::deny()`.

---

## Anti-Pattern 5: Unlogged Authorization Denials

**Symptom:** Relying on the default `failedAuthorization()` which throws `AuthorizationException` — a class in Laravel's `internalDontReport` list that is never logged.

**Problem:** `AuthorizationException` never appears in production logs. Security teams cannot detect brute-force attempts, privilege escalation patterns, or malicious probing without explicit logging.

```php
// BAD — denial is invisible in logs
protected function failedAuthorization()
{
    throw new AuthorizationException; // Never logged
}
```

**Solution:** Override `failedAuthorization()` to log the denial before throwing.

```php
// GOOD — explicit audit trail
protected function failedAuthorization()
{
    Log::warning('Authorization denied', [
        'user_id' => $this->user()?->id,
        'action' => static::class,
        'route' => $this->route()->getName(),
        'ip' => $this->ip(),
    ]);
    throw new AuthorizationException;
}
```

**Detection:** Search for `extends FormRequest` classes. Verify each has custom logging in `failedAuthorization()` for security-sensitive endpoints.

---

## Anti-Pattern 6: Authorization in the Wrong Pipeline Step

**Symptom:** Placing authorization logic in `prepareForValidation()`, `rules()`, or controller methods instead of `authorize()`.

**Problem:** Authorization must run before validation to prevent information leakage. Authorization in `prepareForValidation()` runs too early (before the authorize method) and in the wrong place. Authorization in `rules()` runs after validation — unauthorized users can probe validation rules.

```php
// BAD — auth in rules() after validation processed
public function rules(): array
{
    if (! $this->user()->can('create', Post::class)) {
        abort(403);
    }
    return ['title' => 'required'];
}
```

**Solution:** Place all HTTP-layer authorization in the dedicated `authorize()` method.

```php
// GOOD — auth in the right place
public function authorize(): bool
{
    return $this->user()->can('create', Post::class);
}
```

**Detection:** Search for `can(`, `cannot(`, `Gate::`, `abort(403` inside `rules()`, `prepareForValidation()`, or `withValidator()`.
