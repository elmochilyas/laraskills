# Signed Routes

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Routing System
- **Knowledge Unit:** Signed Routes
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-01

---

## Executive Summary

Signed routes append an HMAC-SHA256 signature to a URL, ensuring the URL has not been tampered with since it was generated. The signature is computed from the full URL (including query parameters) and the application key (`APP_KEY`). Any modification to the URL invalidates the signature, causing the `ValidateSignature` middleware to return a 403 response.

The engineering significance of signed routes is that they transform URLs into bearer credentials — anyone who possesses a valid signed URL can access the associated resource without authentication. This makes signed URLs ideal for public-but-verifiable actions: unsubscribe links, email verification, password reset, magic link login, and secure file downloads.

The critical security property is that signed URLs are NOT single-use by default. A signed URL can be used multiple times until it expires (for temporary signed routes) or until the `APP_KEY` is rotated (for permanent signed routes). Single-use semantics require external tracking via cache or database.

The most common production failure is HTTPS scheme mismatch behind reverse proxies. When a load balancer terminates SSL, the application sees HTTP while the user sees HTTPS. Signed URL validation fails because the signature was computed over the HTTPS URL but the incoming request is HTTP. Proper `TrustProxies` middleware configuration is required.

---

## Core Concepts

### HMAC-SHA256 Signing
`UrlGenerator::signedRoute()` generates the signature:

1. Build the route URL with parameters: `route($name, $parameters, $absolute)`
2. Sort parameters with `ksort()` for deterministic ordering
3. Compute HMAC-SHA256: `hash_hmac('sha256', $url, $appKey)`
4. Append `?signature=<hash>` to the URL

The signature covers the entire URL including query parameters. Adding, removing, or modifying any parameter invalidates the signature.

### Temporary Signed Routes
`UrlGenerator::temporarySignedRoute()` adds an `expires` parameter containing a Unix timestamp:

1. Same as `signedRoute()` but:
2. Adds `expires` with the expiration time: `$parameters['expires'] = $expiration->getTimestamp()`
3. Signs the URL including the `expires` parameter

The `ValidateSignature` middleware checks `now()->timestamp <= expires` to verify the URL has not expired.

### APP_KEY Dependency
The signature is computed using the application key: `config('app.key')`. Rotating the `APP_KEY` invalidates ALL existing signed URLs — both permanent and temporary. This is an important deployment consideration: if you rotate keys, plan for signed URL invalidation.

### Key Rotation Support
The `keyResolver` returns `[app.key, ...previous_keys]`. During validation, each key is tried using `hash_equals()` for timing-safe comparison. This allows a grace period during key rotation where both new and old keys are accepted:
```php
$urlGenerator->setKeyResolver(function () {
    return [config('app.key'), config('app.previous_key')];
});
```

### ValidateSignature Middleware
The `ValidateSignature` middleware intercepts requests to signed routes:
- `handle()` calls `$request->hasValidSignatureWhileIgnoring($ignore, $absolute)`
- `hasValidSignature()` checks `hasCorrectSignature()` (HMAC-SHA256 comparison) and `signatureHasNotExpired()` (timestamp check)
- Returns 403 (`InvalidSignatureException`) on failure

Middleware registration variants:
- `signed` — Standard validation (absolute URL comparison)
- `signed.relative` — Relative URL comparison (omit scheme/host)
- `signed:except=expires,user` — Ignore specific parameters in signature check

---

## Mental Models

### URL as Bearer Token
A signed URL is a bearer token that happens to look like a URL. The signature is the credential — anyone who possesses it gains access. Unlike API tokens, the URL itself is the authentication mechanism. There is no session, no header, no cookie. The URL IS the key.

### Self-Contained vs Database-Backed
Signed URLs are self-contained — they don't require database storage or session state. The validity is encoded in the URL itself. This makes them simpler than traditional tokens (no storage, no garbage collection) but also means they cannot be individually revoked (except by `APP_KEY` rotation).

### APP_KEY as Root of Trust
Every signed URL's security derives from a single secret: `APP_KEY`. If the key is compromised, ALL signed URLs for the application are compromised. If the key is rotated, ALL signed URLs become invalid. The application key is the root of trust for the entire signed URL system.

---

## Internal Mechanics

### Signature Generation

```php
UrlGenerator::signedRoute($name, $parameters, $expiration, $absolute)
  ├── Validate: 'signature' and 'expires' not in $parameters
  ├── if $expiration: $parameters['expires'] = $expiration->getTimestamp()
  ├── $url = $this->route($name, $parameters, $absolute)
  ├── // Sort for deterministic output (required for correct_signature)
  ├── ksort($parameters) — affects the query string order
  ├── $signature = hash_hmac('sha256', $url, $this->getKey())
  ├── $url .= '?signature=' . $signature
  └── return $url
```

### Signature Validation

```php
Request::hasValidSignature($absolute = true)
  ├── $this->hasValidSignatureWhileIgnoring([], $absolute)
  │     ├── hasCorrectSignature($absolute)
  │     │     ├── Rebuild URL without 'signature' parameter
  │     │     ├── For each key in keyResolver:
  │     │     │     ├── hash_hmac('sha256', $url, $key)
  │     │     │     └── hash_equals($computed, $signature)
  │     │     └── If any key matches, signature is valid
  │     │
  │     ├── signatureHasNotExpired()
  │     │     ├── if no 'expires' parameter: return true
  │     │     └── return $request->expires >= now()->getTimestamp()
  │     │
  │     └── return hasCorrectSignature AND signatureHasNotExpired
  └── return bool
```

### Exception Handling
`InvalidSignatureException` maps to a 403 response by default. The exception has no specific error message differentiating "signature invalid" from "signature expired." Both cases produce the same 403 response.

---

## Patterns

### Email Verification Pattern
```php
URL::signedRoute('verification.verify', ['id' => $user->id, 'hash' => sha1($user->email)]);
```
Built into Laravel's `MustVerifyEmail` trait. Combines signed URL with a hash of the user's email for additional verification.

### Magic Link Authentication
```php
URL::temporarySignedRoute('login.verify', now()->addMinutes(15), ['user' => $user->id]);
```
Passwordless login via email. Short expiry (15 minutes) limits the window for unauthorized access. One-time use requires additional tracking.

### Secure Download Links
```php
URL::temporarySignedRoute('downloads.show', now()->addHours(24), ['file' => $file->uuid]);
```
Paid content or licensed file downloads. The 24-hour window provides a reasonable download period without permanent access.

### Unsubscribe Links
```php
URL::signedRoute('mail.unsubscribe', ['email' => $user->email, 'list' => $list->id]);
```
Permanent (or long-lived) signed URL for unsubscribe. Users expect to use the link months after receiving the email.

### Ignoring Parameters Pattern
Some parameters should NOT be part of the signature because they are validated separately:
```php
Route::get('/redirect')->middleware('signed:except=redirect_url');
```
The `redirect_url` parameter is excluded from signature verification and must be validated separately.

---

## Architectural Decisions

### Why HMAC-SHA256, Not Encryption
Signed URLs use HMAC (Hash-based Message Authentication Code) rather than encryption. HMAC provides integrity verification (the URL hasn't been modified) without hiding the content (the URL parameters are visible). This is appropriate because the URL's content is not secret — what matters is that only the application can generate valid signatures.

### Why Self-Contained, Not Database-Backed
Self-contained signed URLs avoid database writes, cache lookups, and garbage collection. The tradeoff is inability to revoke individual URLs. This design decision favors simplicity and performance over fine-grained control.

### Why Timing-Safe Comparison
`hash_equals()` provides timing-safe string comparison, preventing timing attacks where an attacker could determine the signature by measuring response time differences. Without timing-safe comparison, an attacker could forge signatures byte by byte.

---

## Tradeoffs

### Signed Routes vs Database Tokens

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Signed: No storage needed, no GC | Cannot revoke individually | Rotating APP_KEY revokes ALL |
| Signed: Self-contained, works offline | Cannot track usage without external system | Not single-use by default |
| Token: Revocable, trackable, single-use | Storage, GC, lookup overhead | More infrastructure, more control |
| Token: Works without APP_KEY stability | Requires database or cache | Additional latency per request |

### Permanent vs Temporary Signed Routes

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Permanent: Valid forever (until key rotation) | Cannot expire | Links in old emails always work |
| Temporary: Self-expiring, bounded window | Must generate expiration time | Too short: user can't use link; too long: security window |

### Absolute vs Relative Signatures

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Absolute: Includes scheme + host, prevents domain hijacking | Fails behind reverse proxy with HTTPS mismatch | Common production issue |
| Relative: Omitted scheme/host, ignores domain | Does not protect against domain-level attacks | Acceptable when app URL is guaranteed |

---

## Performance Considerations

### Signature Generation Cost
Computing HMAC-SHA256 takes ~0.01ms. Sorting parameters adds negligible overhead. URL generation (including route resolution) is the dominant cost — identical to a normal `route()` call plus ~0.01ms for the signature.

### Signature Validation Cost
Each validation checks the signature against the current key and all previous keys (if key rotation is configured). Each check is one HMAC-SHA256 computation. With 2 keys (current + one previous), validation is ~0.02ms.

### No State Management
Signed URL validation requires no state reads or writes — no database, no cache. This makes it extremely fast and suitable for high-traffic endpoints.

---

## Production Considerations

### Reverse Proxy HTTPS Configuration
The #1 production issue with signed URLs. Behind a load balancer:
1. User requests `https://example.com/signed-url`
2. Load balancer terminates SSL, forwards as `http://internal-app/signed-url`
3. The app computes the signature over `http://...` but the user has `https://...`
4. Validation fails — 403 error

Solution: Properly configure `TrustProxies` middleware to trust the load balancer's forwarded protocol:
```php
class TrustProxies extends Middleware
{
    protected $proxies = '*';
    protected $headers = Request::HEADER_X_FORWARDED_FOR |
                         Request::HEADER_X_FORWARDED_HOST |
                         Request::HEADER_X_FORWARDED_PORT |
                         Request::HEADER_X_FORWARDED_PROTO;
}
```

### APP_KEY Rotation Plan
Before rotating `APP_KEY`:
1. Document which signed URLs exist in the wild (unsubscribe links, download links, magic links)
2. Communicate to users if important URLs will be invalidated
3. Consider a transition period with `keyResolver` supporting both old and new keys
4. After the transition window, remove the old key

### Single-Use Semantics
To make a signed URL single-use:
```php
Route::get('/verify-email/{id}/{hash}', function (Request $request) {
    if (!Cache::add('signed_url_used:' . $request->fullUrl(), true, 3600)) {
        abort(403, 'This link has already been used.');
    }
    // Process the request...
})->middleware('signed');
```

### URL Expiry Monitoring
For temporary signed routes, monitor the distribution of expiration times. If users consistently fail to use links within the expiry window (e.g., email verification taking longer than 60 minutes), extend the window.

---

## Common Mistakes

### Missing TrustProxies Configuration
Why it happens: Development environments don't have reverse proxies. Why it's harmful: Signed URLs pass validation in development but fail in production. Better approach: Configure `TrustProxies` middleware as standard part of production deployment setup.

### Treating Signed Routes as Single-Use
Why it happens: Signed URLs look like one-time tokens. Why it's harmful: A signed URL can be reused indefinitely (or until expiry). If it's for sensitive operations (email verification, password reset reuse), this is a security gap. Better approach: Track usage explicitly via cache or database.

### Including User-Modifiable Parameters in Signature
Why it happens: Parameters like `redirect_url` are part of the URL. Why it's harmful: If a signed URL includes `?redirect_url=http://evil.com`, the signature validates, but the redirect goes to an attacker's site. Better approach: Use the `signed:except=` middleware parameter to exclude separately-validated parameters.

### Rotating APP_KEY Without Planning
Why it happens: Key rotation as a security best practice. Why it's harmful: ALL existing signed URLs become invalid — unsubscribe links break, download links fail, verification emails return 403. Better approach: Use `keyResolver` for transitional key support.

### Not Checking Signature in Queued Jobs
Why it happens: The signature validation only happens at the route level. Why it's harmful: If a queued job processes a signed URL action, it has already passed the middleware check. The job should not re-validate the signature (the middleware already checked it), but it should verify the action is still valid (e.g., user hasn't been unsubscribed since the URL was generated).

---

## Failure Modes

### HTTPS Scheme Mismatch
The most common signed URL failure. The application computes the signature over `https://` but the incoming request is `http://` (or vice versa). `hash_equals()` fails on different strings. Solution: TrustProxies middleware configuration.

### APP_KEY Change
Changing `APP_KEY` invalidates all signed URLs. This is by design but frequently catches developers off guard during key rotation or environment setup.

### Clock Skew
`temporarySignedRoute()` uses Unix timestamps. If the application server and the user's device have different clocks, the expiration check may be inaccurate. The server clock is authoritative — use NTP synchronization.

### Signature Leak in Server Logs
Signed URLs contain the full URL with signature. If URLs are logged in web server access logs, the signature is exposed. Anyone with access to those logs can construct valid signed URLs (within the expiry window). Mitigation: Filter signature query parameter from access logs.

---

## Ecosystem Usage

### Laravel Framework
Built-in features that use signed routes:
- `MustVerifyEmail` trait — Email verification via signed URL
- Password reset — Signed URL in reset email
- Horizon — Signed URL for action confirmation

### Forge and Envoyer
Laravel Forge uses signed URLs for deployment-related notifications. Envoyer uses signed URLs for deployment action confirmations.

### Community Packages
- Spatie's `laravel-newsletter` uses signed URLs for subscription management
- Mailcoach (Spatie) uses signed URLs for email tracking and unsubscribe
- Most email marketing packages use signed unsubscribe URLs

---

## Related Knowledge Units

### Prerequisites
- Route Definition — Named routes for signed URL generation
- Route Name Generation — `route()` helper for URL building

### Related Topics
- Configuration Management — APP_KEY as the root of trust for signatures
- Middleware System — ValidateSignature middleware placement

### Advanced Follow-up Topics
- Security & Identity Engineering — Token-based authentication vs signed URLs
- Queue Systems — Deferred processing of signed URL actions

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\UrlGenerator.php` — `signedRoute()`, `temporarySignedRoute()`, `hasValidSignature()`, `hasCorrectSignature()`, `signatureHasNotExpired()`
- `Illuminate\Routing\Middleware\ValidateSignature.php` — Middleware registration and validation
- `Illuminate\Routing\Exceptions\InvalidSignatureException.php` — 403 exception
- `Illuminate\Http\Request.php` — `hasValidSignatureWhileIgnoring()`, `hasValidRelativeSignature()`

### Key Insight
The `keyResolver` pattern supporting multiple keys is a well-engineered solution for key rotation. Most applications don't use it, but it's essential for any production system that rotates keys while maintaining signed URL validity for in-flight links.

### Version-Specific Notes
- Signed route behavior is consistent across Laravel 8-13
- Relative signature support (`signed.relative`) added in Laravel 9
- `hasValidSignatureWhileIgnoring()` added in Laravel 9 for flexible parameter exclusion
- `ValidateSignature::$neverValidate` static property added in Laravel 11 for global exception parameters
