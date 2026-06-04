# Metadata

Domain: Security & Identity Engineering
Subdomain: Threat Mitigation
Knowledge Unit: Form Request validation rules and best practices
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Form Request classes encapsulate validation logic, authorization, and error handling per request type. They implement `authorize()` (permission check) and `rules()` (validation rules array). Using `$request->validated()` returns only the data that passed validation — never use `$request->all()` to populate models or queries. The combination of Form Request validation + model `$fillable` provides defense in depth against mass assignment. Rule objects (`Rule::unique()`, `Password::default()`, custom rule classes) provide reusable, testable validation beyond simple array rules.

---

# Core Concepts

- **Form Request Class**: `php artisan make:request StorePostRequest`. Extends `Illuminate\Foundation\Http\FormRequest`. Implicitly validates on resolution (before controller method runs).
- **$request->validated()**: Returns only the data that passed validation rules. Type-safe — missing fields are not included.
- **authorize()**: Returns `true` (allowed) or `false` (403). Can use `Gate::authorize()` or inline user checks.
- **Rule Objects**: Classes implementing `Illuminate\Contracts\Validation\Rule` or extending `Illuminate\Validation\Rules\*`. Use `new UniqueRule()`, `new Password()`, `new Enum()`.
- **prepareForValidation()**: Hook to modify request data before validation runs (sanitize, merge defaults).
- **withValidator()**: Hook to modify the validator instance after rules are added (add conditional rules, custom callbacks).
- **messages()**: Custom error messages per field/rule.
- **attributes()**: Custom attribute names in error messages (e.g., `'email' => 'email address'`).

---

# Mental Models

- **Validation Gatekeeper**: The Form Request is the first gatekeeper for incoming data. It runs BEFORE the controller. If it fails, the controller never runs. This prevents invalid data from reaching any business logic.
- **Contract Between Client and Server**: The rules array defines the contract: "the client must send X, Y, Z with these constraints." The controller can trust `$request->validated()` completely.

---

# Internal Mechanics

- `FormRequest` extends `Request` and implements `ValidatesWhenResolved`. Laravel's service container resolves the form request from the controller method signature.
- On resolution, `FormRequest` calls `validate()` which creates a `Validator` instance, runs `rules()` and `authorize()`, and throws `ValidationException` on failure.
- `ValidationException` is converted to a redirect (with errors flashed to session) for web requests or a JSON response (422 with error details) for API requests.
- `prepareForValidation()` runs before validation — can modify `$this->merge()` or `$this->replace()`.
- `failedValidation()` can be overridden to customize the error response entirely.

---

# Patterns

## Rule Object Pattern
- **Purpose**: Reusable, testable validation rules.
- **Implementation**: Create custom rule class extending `Illuminate\Contracts\Validation\ValidationRule`. Use in rules array: `['email' => ['required', 'email', new UniqueEmail()]]`.
- **Benefits**: DRY validation across multiple form requests.

## Conditional Rules with withValidator()
- **Purpose**: Rules that depend on other field values.
- **Implementation**: `withValidator($validator) { $validator->sometimes('expires_at', 'required|date|after:now', fn($input) => $input->has_access === true) }`.
- **Benefits**: Dynamic validation without complex array structures.

## Prepare for Validation Pattern
- **Purpose**: Sanitize input before validation.
- **Implementation**: `prepareForValidation() { $this->merge(['slug' => Str::slug($this->title)]) }`.
- **Benefits**: Clean up user input (trim spaces, format phone numbers) before rules run.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Form Request vs inline `$request->validate()` in controller | Complex vs simple validation | Form Request for any action with >3 fields or authorization needs. Inline for simple one-off checks |
| Custom rule objects vs Closure rules | Reusability vs one-off | Rule objects for reused validation; Closure for one-time checks |
| `authorize()` in Form Request vs route middleware | Request-level vs route-level auth | `authorize()` for input-specific permission checks; middleware for general route protection |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Type-safe validated data — no unexpected fields | More files to maintain (one per action) | StorePostRequest, UpdatePostRequest — 2 files for 2 actions. Acceptable overhead |
| Automatic error handling | Custom error responses require overriding failedValidation() | Without override, APIs get default 422 JSON — may not match your error format |
| Reusable rule objects reduce duplication | Rule objects add abstraction layer | Developers must understand the rule class pattern — slight learning curve |

---

# Performance Considerations

- Form Request validation overhead is proportional to the number and complexity of rules. Simple rules (required, string, email) add ~0.5ms. DB rules (unique, exists) add a query per check.
- `bail` modifier stops validation on first failure — use for early exit when multiple rules apply to one field.
- Batch validation: For CSV/JSON import, validate each row individually in a loop. Use `Validator::make()` directly with `sometimes` for conditional rules.

---

# Production Considerations

- **Authorization First**: `authorize()` runs before `rules()`. A user who is not authorized to perform the action does not need validation errors — they get 403 instead.
- **Unique Rule with Soft Deletes**: `Rule::unique('users', 'email')->whereNull('deleted_at')` — exclude soft-deleted records from unique checks.
- **Database Existence Checks**: `exists:table,column` adds a DB query. Cache hot table IDs in memory to reduce queries.
- **Error Response Format**: Override `failedValidation()` in a base Form Request to return consistent JSON error structures across all API endpoints.

---

# Common Mistakes

- **Using `$request->all()` in controllers**: Bypasses validation entirely. Always use `$request->validated()`.
- **Not using `bail` for compound rules**: `['name' => ['required', 'string', 'max:255', 'unique:users']]` — if `required` fails, it still checks `string`, `max`, and `unique:users`. `bail` stops after first failure.
- **Repeating same rules across form requests**: Define rule objects (`new StrongPassword()`) instead of copying `min:8|regex:/[A-Z]/|regex:/[0-9]/`.
- **Not validating array fields properly**: `'items' => 'required|array'`, `'items.*.id' => 'required|integer|exists:products,id'`. Nested array validation requires `*` syntax.
- **Returning sensitive data in validation errors**: `unique:users,email` reveals which emails are registered when signup fails. Customize the error message to "Email already in use."

---

# Failure Modes

- **Authorization Before Validation Gotcha**: `authorize()` returning `false` gives 403 before validation runs. If the action is allowed for specific inputs but not others, `authorize()` cannot access validated input (validation hasn't run). Use `withValidator()` for post-validation authorization.
- **Unique Rule Race Condition**: Two concurrent requests to register the same email both pass the `unique:users` check (no row exists yet). Both insert succeeds (if no DB unique constraint). Mitigation: database-level unique constraint as safety net.
- **Validation Exception in API Context**: Default `ValidationException` redirects to previous URL — wrong for APIs. Laravel automatically detects `expectsJson()` and returns 422 JSON. Ensure requests have correct `Accept: application/json` header.

---

# Related Knowledge Units

- Prerequisites: HTTP request lifecycle, Eloquent model $fillable/$guarded
- Related: Mass assignment protection (complementary defense), Password validation rule objects
- Advanced Follow-up: Custom validation rule objects (ValidationRule interface), Form Request testing patterns, Complex conditional validation with nested arrays

## Ecosystem Usage
- **Laravel RateLimiter**: Illuminate\Cache\RateLimiter facade provides named rate limit definitions; the 	hrottle middleware applies limits to routes. Named limits support per-user, per-IP, and custom segmenters.
- **Laravel Form Request Validation**: Illuminate\Foundation\Http\FormRequest base class provides uthorize() and ules() methods; integrates with the Validator facade for automatic input validation on controller methods.
- **Laravel Crypt/Mcrypt**: Crypt::encryptString() and Crypt::decryptString() use AES-256-CBC or AES-256-GCM encryption with the application key. The Crypt facade wraps the framework's encrypter singleton.
- **Laravel Signed URLs**: URL::signedRoute() generates HMAC-signed URLs with optional expiration timestamps; the ValidateSignature middleware verifies signatures on incoming requests.
- **File upload security**: Illuminate\Http\UploadedFile provides getClientOriginalExtension(), getMimeType(), store(), storeAs() methods; validation rules (mimes:csv,txt, max:10240) enforce upload restrictions.
- **Spatie Rate Limited Job Middleware**: Community package providing rate-limited job execution middleware; uses Laravel's RateLimiter facade for distributed rate limiting across multiple workers.
- **Advanced rate limiting patterns**: Plan-aware throttling adjusts rate limits based on user subscription tier; uses RateLimiter::for() with per-tier limit definitions and 	hrottle middleware with dynamic limit resolution.
- **Dependency auditing**: composer audit and community packages like enlightn/enlightn scan dependencies for known vulnerabilities; oave/security-advisories blocks known-vulnerable packages from installation.

## Research Notes
- Laravel rate limiting was significantly enhanced in Laravel 12 with the introduction of named rate limiters that can reference other limiters for inheritance — RateLimiter::for('api', fn() => RateLimiter::for('global')->by('ip')).
- The 	hrottle middleware uses dynamic rate limit resolution when a Closure is passed — the limit is re-evaluated on every request, allowing per-user rate limit overrides based on subscription tier or trust level.
- Signed URLs in Laravel use HMAC-SHA256 with the application key — the signature includes all query parameters and the expires timestamp, providing tamper-proof URL validation without server-side state.
- File upload validation in Laravel 12+ includes built-in SVG upload protection (svg validation rule) that checks for embedded scripts and event handlers in SVG files.
- The Crypt facade uses serialization for encrypting objects and arrays — this introduces a potential unserialization vulnerability if an attacker can control the encrypted data; use Crypt::encryptString() for simple values.
- Form Request validation executes in the middleware pipeline before the controller — the prepareForValidation() hook allows preprocessing input before validation, useful for normalizing data format.
- Plan-aware throttling patterns use RateLimiter::for() with dynamic limit resolution based on the authenticated user's plan — the 	hrottle middleware accepts a RateLimiter::limiter() callback for complex limit definitions.
- Community rate limiting packages (spatie/laravel-rate-limited-job-middleware) extend rate limiting to queued jobs, not just HTTP requests — this prevents downstream API rate limit violations during batch job processing.

## Internal Mechanics
- **RateLimiter Resolution**: RateLimiter::for('login', fn(, ) => Limit::perMinute(5)) registers a named limiter. The 	hrottle middleware resolves the limiter by name at runtime, applies the limit, and returns a 429 Too Many Requests response with Retry-After header when exceeded.
- **Signed URL Generation**: URL::signedRoute('verify', ['id' => ->id], expires: 3600) → collects route name, parameters, and expiration → builds URL → computes HMAC-SHA256 signature over the URL string using APP_KEY → appends ?signature=<hash> to the URL. The ValidateSignature middleware re-computes the hash and compares using hash_equals().
- **Crypt Facade Encryption Flow**: Crypt::encrypt('value') → generates random IV (16 bytes for AES-256-CBC) → serializes the value → encrypts with AES-256-CBC using APP_KEY as encryption key → computes HMAC-SHA256 for integrity → JSON-encodes the payload ({iv, value, mac, tag}). Decryption reverses the process and verifies the MAC.
- **Form Request Validation Flow**: Custom form request class extends Illuminate\Foundation\Http\FormRequest → middleware pipeline calls FormRequest->authorize() → if false, returns 403 Forbidden → if true, calls FormRequest->rules() → FormRequest->validator() validates the request data against rules → if validation fails, throws ValidationException with error bag → if passes, the validated data is available via $request->validated().
- **File Upload Processing**: Uploaded file arrives as Symfony\Component\HttpFoundation\File\UploadedFile → $request->file('document') returns UploadedFile instance → $file->store('uploads') moves file to configured filesystem disk → MIME type is detected by Symfony's MimeTypeGuesser (not by client-provided content-type).
- **Dependency Audit Flow**: composer audit reads composer.lock → matches each package/version against the Security Advisories Database → returns list of known vulnerabilities with CVE IDs, severity, and advisory URLs. The command fails with exit code 1 when vulnerabilities match.
