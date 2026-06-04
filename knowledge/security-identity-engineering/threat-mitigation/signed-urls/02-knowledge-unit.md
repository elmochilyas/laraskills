# Metadata

Domain: Security & Identity Engineering
Subdomain: Threat Mitigation
Knowledge Unit: Signed URLs and signed routes
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Signed URLs provide tamper-proof, temporary-access links by appending an HMAC signature and expiration timestamp to a URL. `URL::signedRoute()` generates a permanent signed URL; `URL::temporarySignedRoute()` adds expiration. The `ValidateSignature` middleware verifies the signature on the receiving end. Signed URLs are used for: email verification links, password reset links, unsubscribe links, paid content access, and webhook verification callbacks. They require no session or database state — the signature is self-validating.

---

# Core Concepts

- **Signature**: HMAC-SHA256 of the URL (including query parameters) signed with the application's `APP_KEY`. Appended as the `signature` query parameter.
- **Temporary Signed URL**: Includes an `expires` Unix timestamp in the URL. The middleware checks current time against the expiration.
- **ValidateSignature Middleware**: Registered as `signed` middleware alias. Checks signature validity and expiration.
- **URL::signedRoute($name, $parameters)**: Generates a signed URL for a named route.
- **URL::temporarySignedRoute($name, $ttl, $parameters)**: Generates a temporary signed URL with TTL in minutes or DateTime.

---

# Mental Models

- **Tamper-Evident Seal**: A signed URL is a URL with a cryptographic seal. Any modification (changing query parameters) breaks the seal — the signature validation fails.
- **Self-Contained Token**: Unlike CSRF tokens (session-bound) or API tokens (DB-bound), signed URLs contain everything needed for validation within the URL itself. Stateless.

---

# Internal Mechanics

- `Illuminate\Routing\UrlGenerator::signedRoute()` builds the URL, extracts query parameters, sorts them by key, appends the `signature` parameter using `hash_hmac('sha256', $url, $key)`.
- `Hasher::check()` provides timing-safe comparison via `hash_equals()`.
- `ValidateSignature` middleware extracts the signature, removes it from the URL, recalculates the HMAC, and compares.
- For temporary URLs, the middleware checks `abs(now()->timestamp - $request->expires) < 5` (5-second clock skew tolerance) and ensures `$request->expires >= now()->timestamp`.

---

# Patterns

## One-Click Email Verification Pattern
- **Purpose**: Verify email ownership without password.
- **Implementation**: `URL::temporarySignedRoute('verification.verify', now()->addHours(24), ['id' => $user->id, 'hash' => sha1($user->email)])`. `ValidateSignature` middleware on the verify route.
- **Benefits**: Stateless verification link — no database token needed.

## Unsubscribe Link Pattern
- **Purpose**: One-click unsubscribe for email campaigns.
- **Implementation**: `URL::temporarySignedRoute('unsubscribe', now()->addDays(30), ['email' => $user->email])`. Route handler validates signature and unsubscribes.
- **Benefits**: User does not need to log in. Link expires after campaign relevance ends.

## Paid Content Access Pattern
- **Purpose**: Temporary access to gated content.
- **Implementation**: `URL::temporarySignedRoute('download', $purchase->expires_at, ['file' => $file->id])`. Route uses `signed` middleware.
- **Benefits**: No authentication required for the download — just the signed URL.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| `signedRoute()` vs `temporarySignedRoute()` | Permanent vs expiring access | Always use temporary unless the link must never expire (unsubscribe) |
| Signed URL vs API token | One-time external access vs continuous API access | Signed URL for email links, webhook callbacks. API token for programmatic access |
| `signed` middleware vs manual `hasValidSignature()` | Route-level vs controller-level | Middleware for simplicity; manual check for conditional validation |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Stateless — no database storage | Signature is tied to APP_KEY | Rotating APP_KEY invalidates all existing signed URLs in transit |
| Self-contained (URL + signature) | URL is visible in server logs, referrer headers | Anyone with access to logs/referrers can replay the signed URL (mitigate with temporary URLs) |
| Temporary URLs expire automatically | No revocation mechanism | Cannot revoke a signed URL once sent. Must rely on expiration or short TTL |

---

# Performance Considerations

- Signed URL generation: HMAC-SHA256 of the URL — ~0.01ms. Negligible.
- Signature validation: HMAC-SHA256 + comparison — ~0.01ms. Negligible.
- No database I/O for signature validation.

---

# Production Considerations

- **URL Logging**: Signed URLs appear in access logs. An attacker with log access can read the URL and use it. Mitigation: use `temporarySignedRoute()` with short TTLs; mask sensitive URLs in logs via middleware.
- **Route Caching**: Signed URL generation relies on route names. Ensure all signed routes use named routes. Route caching is compatible with signed URLs.
- **Clock Skew**: The middleware allows 5 seconds of clock skew. For time-sensitive access (30-second TTL), ensure server NTP is synchronized.
- **Signature in Query String vs Header**: The default is query string (`?signature=...`). For API headers, implement custom middleware that reads from `X-Signature` header.

---

# Common Mistakes

- **Using permanent signed URLs for sensitive actions**: Email verification link with `signedRoute()` (no expiration) — the link works forever. An attacker who intercepts the email years later can still verify. Use `temporarySignedRoute()`.
- **Not including all parameters in the URL**: If the route has parameters resolved by implicit binding (`Route::get('/post/{post}/share')`) and `$post` ID changes, the signed URL created before the change is for the old ID. Use explicit parameter passing.
- **Sharing signed URLs**: A signed URL for "download premium content" shared on social media gives anyone access until expiration. Use user-specific parameters in the URL.
- **Forgetting the `signed` middleware**: Route without middleware accepts ANY request to that URL, with or without a valid signature. The signature parameter is ignored.

---

# Failure Modes

- **APP_KEY Rotation Breaks All Signed URLs**: After `php artisan key:generate`, existing signed URLs (pending email verifications, password resets emailed before rotation) all fail validation. Users cannot complete actions from old emails.
- **URL Parameter Order Change**: If the signed URL includes query parameters and the receiving end constructs the URL differently (e.g., different query parameter order), the HMAC comparison fails. Laravel sorts parameters by key, so order is deterministic.
- **Clock Skew Rejection**: If the server generating the URL has a different time than the server validating it (multi-server, wrong timezone), temporary URLs may be rejected prematurely or accepted past expiry.
- **Expired Temporary URL**: User clicks a link 1 minute after it expired. Show a friendly "link expired" page with option to request a new link.

---

# Related Knowledge Units

- Prerequisites: APP_KEY management, Named routes, Middleware pipeline
- Related: Signed route parameter validation, URL generation in Laravel
- Advanced Follow-up: Custom signature hashing algorithms, Signed URL with header-based signatures, Bulk signed URL generation and validation

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
