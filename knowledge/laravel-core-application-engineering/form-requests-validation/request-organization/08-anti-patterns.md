# Request Organization — Anti-Patterns

## Anti-Pattern 1: One FormRequest Per Controller Action in the Same Class

**Symptom:** Placing multiple FormRequest classes inside a single controller file or defining them as inner classes of the controller.

**Problem:** Grouping all FormRequests in one file creates a massive, hard-to-navigate class. Each request deserves its own file in a dedicated namespace for discoverability, autoloading, and test organization.

```php
// BAD — all requests in one file
class PostController extends Controller
{
    // ...
}

class StorePostRequest extends FormRequest { /* ... */ }
class UpdatePostRequest extends FormRequest { /* ... */ }
```

**Solution:** Place each FormRequest in its own file under `App\Http\Requests` with a descriptive name.

```php
// GOOD — one class per file
// app/Http/Requests/Post/StorePostRequest.php
class StorePostRequest extends FormRequest { /* ... */ }

// app/Http/Requests/Post/UpdatePostRequest.php
class UpdatePostRequest extends FormRequest { /* ... */ }
```

**Detection:** Search for files containing multiple FormRequest class definitions.

---

## Anti-Pattern 2: Inconsistent File Naming for Form Requests

**Symptom:** FormRequest filenames that use inconsistent patterns like `PostRequest.php` (unclear whether it's for create or update), `NewPostRequest.php`, `CreatePostRequest.php`, `PostStoreRequest.php`, `PostStoreValidateRequest.php`.

**Problem:** Inconsistent naming makes it difficult to find the right request class. Team members guessing the filename for "the request that creates a post" may try any of several patterns. Tooling (IDE autocomplete, generators) cannot standardize around expectations.

```php
// BAD — inconsistent pattern
// Create post: PostRequest.php, NewPostRequest.php, CreatePostRequest.php
// Update post: PostUpdateRequest.php, EditPostRequest.php, UpdatePostRequest.php
```

**Solution:** Adopt a consistent `{Entity}{Action}Request` pattern (e.g., `PostStoreRequest`, `PostUpdateRequest`, `PostDestroyRequest`).

```php
// GOOD — consistent {Entity}{Action}
// PostStoreRequest.php, PostUpdateRequest.php, PostDestroyRequest.php
```

**Detection:** List all files in `app/Http/Requests/`. Check for naming pattern inconsistencies.

---

## Anti-Pattern 3: Deep Directory Nesting for Form Requests

**Symptom:** Organizing FormRequests by source (e.g., `Api/V1/Posts/StoreRequest.php` vs `Web/Admin/Posts/StoreRequest.php`).

**Problem:** Deeply nested directories create long import paths, complicate autoloading, and make it hard to find files. FormRequest classes should be organized by the entity they validate, not by the transport layer.

```php
// BAD — deep, transport-coupled structure
// app/Http/Requests/Api/V1/Posts/StorePostRequest.php
// app/Http/Requests/Web/Admin/Posts/StorePostRequest.php
```

**Solution:** Organize by entity. Use the same FormRequest regardless of transport layer (API/Web). Create subdirectories only when an entity has many requests.

```php
// GOOD — flat by entity
// app/Http/Requests/PostStoreRequest.php
// app/Http/Requests/PostUpdateRequest.php
```

**Detection:** List subdirectories under `app/Http/Requests/`. Flag any deeper than `{Entity}` single-level subdirectory.

---

## Anti-Pattern 4: FormRequest Class Name Collisions — No Entity Prefix

**Symptom:** FormRequests named `StoreRequest.php`, `UpdateRequest.php`, or `CreateRequest.php` without the entity name.

**Problem:** Without entity prefix, multiple requests share the same class name in different subdirectories. Autoloading conflicts, IDE confusion, and ambiguous imports result.

```php
// BAD — ambiguous naming
// app/Http/Requests/Posts/StoreRequest.php
// app/Http/Requests/Categories/StoreRequest.php
// Both referenced as StoreRequest — ambiguous without full path
```

**Solution:** Always include the entity name in the class name.

```php
// GOOD — unambiguous
// app/Http/Requests/Posts/PostStoreRequest.php
// app/Http/Requests/Categories/CategoryStoreRequest.php
```

**Detection:** Search for FormRequests named `StoreRequest`, `UpdateRequest`, `DestroyRequest`, `CreateRequest` without entity prefix.

---

## Anti-Pattern 5: Not Using Abstract Base Requests

**Symptom:** Every FormRequest independently defines the same authorization check, the same rate-limiting setup, or the same `failedAuthorization()` logging.

**Problem:** Copying the same code across dozens of FormRequests violates DRY. When the authorization pattern changes (e.g., adding a feature flag check), every request must be updated individually.

```php
// BAD — repeated code across requests
class PostStoreRequest extends FormRequest
{
    protected function failedAuthorization(): void
    {
        Log::warning('Denied', ['user_id' => $this->user()?->id, 'request' => static::class]);
        throw new AuthorizationException;
    }
}

class PostUpdateRequest extends FormRequest
{
    // Same code
    protected function failedAuthorization(): void
    {
        Log::warning('Denied', ['user_id' => $this->user()?->id, 'request' => static::class]);
        throw new AuthorizationException;
    }
}
```

**Solution:** Create abstract base request classes for common patterns.

```php
// GOOD — single source of truth
abstract class AuthorizedRequest extends FormRequest
{
    protected function failedAuthorization(): void
    {
        Log::warning('Authorization denied', [
            'user_id' => $this->user()?->id,
            'request' => static::class,
        ]);
        throw new AuthorizationException;
    }
}

class PostStoreRequest extends AuthorizedRequest { /* ... */ }
class PostUpdateRequest extends AuthorizedRequest { /* ... */ }
```

**Detection:** Search for `failedAuthorization` or `prepareForValidation` overrides. Count duplicates across request classes.

---

## Anti-Pattern 6: Including Request-Specific Logic in Shared Abstract Requests

**Symptom:** Adding entity-specific validation rules, custom logging formats, or conditional authorization to an abstract base request.

**Problem:** Base requests are shared across entities. Adding entity-specific logic forces all child requests to acknowledge that logic. When a `LoggableRequest` base class adds `ip` logging but the child request has no IP context, it breaks.

```php
// BAD — base class knows too much
abstract class TenantedRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'tenant_id' => 'required|integer|exists:tenants,id',
        ];
    }
}
// Child inherits tenant_id rule even if it doesn't need it
```

**Solution:** Base requests should define only reusable behavior (authorization patterns, failed validation handling). Keep rules in child classes.

```php
// GOOD — base defines behavior, not data rules
abstract class TenantedRequest extends FormRequest
{
    public function prepareForValidation(): void
    {
        $this->merge(['tenant_id' => $this->user()?->tenant_id]);
    }
    // No rules() here — each child defines its own
}
```

**Detection:** Search for abstract FormRequests with `rules()` methods containing specific field rules.
