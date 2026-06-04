# Phase 5: Rules — Authentication Error Responses

## Rule: Always Include WWW-Authenticate Header on 401
---
## Category
Framework Usage | Security
---
## Rule
Always include the `WWW-Authenticate` header in every 401 error response indicating the expected auth scheme.
---
## Reason
RFC 7235 requires this header on 401 responses; automated clients and HTTP libraries use it to determine which auth scheme to present without guessing.
---
## Bad Example
```php
return response()->json(['error' => 'Unauthenticated.'], 401);
```
---
## Good Example
```php
return response()->json(
    new ErrorEnvelope('USER.AUTH_UNAUTHENTICATED', 'Authentication required.', 401),
    401,
    ['WWW-Authenticate' => 'Bearer realm="api"']
);
```
---
## Exceptions
When the client has no ability to re-authenticate (e.g., internal service-to-service calls on a private network).
---
## Consequences Of Violation
HTTP spec non-compliance; automated clients cannot programmatically re-authenticate; some HTTP libraries reject responses without this header.

---

## Rule: Return 401 for Missing Credentials, Never 403
---
## Category
Architecture | Framework Usage
---
## Rule
Always return HTTP 401 for missing, expired, malformed, or invalid credentials; never use 403 for authentication failures.
---
## Reason
HTTP 401 means "not authenticated"; 403 means "authenticated but not permitted." Confusing them breaks client logic and HTTP semantics.
---
## Bad Example
```php
// In a controller where token is missing
abort(403, 'Access denied.');
```
---
## Good Example
```php
// Laravel's auth middleware already throws AuthenticationException → 401
// In the handler:
public function renderAuthenticationError(AuthenticationException $e, Request $request): JsonResponse
{
    return response()->json(
        new ErrorEnvelope(ErrorCodes::USER_AUTH_UNAUTHENTICATED, 'Authentication required.', 401),
        401,
        ['WWW-Authenticate' => 'Bearer realm="api"']
    );
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Clients think they are authenticated and behave incorrectly; 401/403 confusion breaks automated guard logic and refresh token flows.

---

## Rule: Use Guard-Aware Error Codes for Auth Failures
---
## Category
Architecture | Maintainability
---
## Rule
Always select distinct error codes based on the auth guard configuration when mapping `AuthenticationException`, differentiating expired tokens from invalid tokens from missing credentials.
---
## Reason
Different guards (Sanctum, Passport, custom) have different token formats and refresh capabilities; clients need guard-specific codes to implement correct recovery logic (silent refresh vs. full re-login).
---
## Bad Example
```php
// Same code for all auth failures regardless of guard
$code = ErrorCodes::USER_AUTH_UNAUTHENTICATED;
```
---
## Good Example
```php
$code = match ($e->guards()) {
    ['sanctum'] => ErrorCodes::USER_AUTH_TOKEN_EXPIRED,
    ['passport'] => ErrorCodes::USER_AUTH_TOKEN_INVALID,
    default => ErrorCodes::USER_AUTH_UNAUTHENTICATED,
};
```
---
## Exceptions
When the application uses a single guard and all auth failures should behave identically on the client side.
---
## Consequences Of Violation
Clients cannot implement token refresh logic; expired and invalid tokens trigger the same UI flow, degrading user experience.

---

## Rule: Never Reveal User Existence in Auth Error Messages
---
## Category
Security
---
## Rule
Always use identical generic messages for all authentication failures; never differentiate "user not found" from "wrong password" or "account disabled" in the response.
---
## Reason
Differentiating auth failure causes enables credential enumeration attacks — attackers can determine which emails/usernames exist in the system.
---
## Bad Example
```php
// Response reveals user exists:
return new ErrorEnvelope('USER.AUTH_INVALID_CREDENTIALS', 'User not found.', 401);
// ...vs...
return new ErrorEnvelope('USER.AUTH_INVALID_CREDENTIALS', 'Invalid password.', 401);
```
---
## Good Example
```php
// Identical message for all auth failures:
return new ErrorEnvelope('USER.AUTH_INVALID_CREDENTIALS', 'Invalid credentials provided.', 401);
```
---
## Exceptions
Internal admin audit endpoints where user enumeration is a desired feature (with rate limiting and access control).
---
## Consequences Of Violation
User enumeration vulnerability; compliance violations (GDPR Article 32 — security of processing); potential account harvesting.

---

## Rule: Never Expose Stack Traces or Exception Internals in 401 Responses
---
## Category
Security | Reliability
---
## Rule
Always catch and wrap all auth exceptions in the safe error envelope; never let stack traces, file paths, or internal exception details appear in any 401 response regardless of environment.
---
## Reason
Auth errors occur before identity is established; exposing internals in the auth path leaks system structure to unauthenticated attackers.
---
## Bad Example
```php
// Default Laravel 401 may include Whoops HTML in debug mode
return response()->json($e->getTraceAsString(), 401);
```
---
## Good Example
```php
public function register(): void
{
    $this->renderable(function (AuthenticationException $e, Request $request) {
        if (! $request->expectsJson()) return null;
        return response()->json(
            new ErrorEnvelope(ErrorCodes::USER_AUTH_UNAUTHENTICATED, 'Authentication required.', 401),
            401,
            ['WWW-Authenticate' => 'Bearer realm="api"']
        );
    });
}
```
---
## Exceptions
No common exceptions — this applies universally to all 401 responses.
---
## Consequences Of Violation
Information disclosure to unauthenticated attackers; exposure of file paths, class names, and framework version.

---

## Rule: Distinguish Expired vs Invalid Token Error Codes
---
## Category
Design | Maintainability
---
## Rule
Always define three distinct error codes for auth failures — generic unauthenticated, token expired, and token invalid — and select the correct one in the exception handler.
---
## Reason
Clients need to distinguish expired tokens (can silently refresh) from invalid tokens (must redirect to login) to implement correct UX flows.
---
## Bad Example
```php
const USER_AUTH_UNAUTHENTICATED = 'USER.AUTH_UNAUTHENTICATED';
// Single code used for expired, invalid, and missing tokens
```
---
## Good Example
```php
const USER_AUTH_UNAUTHENTICATED = 'USER.AUTH_UNAUTHENTICATED';
const USER_AUTH_TOKEN_EXPIRED = 'USER.AUTH_TOKEN_EXPIRED';
const USER_AUTH_TOKEN_INVALID = 'USER.AUTH_TOKEN_INVALID';
```
---
## Exceptions
Token-based auth is not used (e.g., session-only SPA auth where refresh is not applicable).
---
## Consequences Of Violation
Clients force users to re-login for expired tokens instead of silently refreshing; degraded user experience and increased auth traffic.

---

## Rule: Never Log Credential Values in Auth Failure Context
---
## Category
Security | Reliability
---
## Rule
Always exclude raw credential values (passwords, tokens, API keys, secrets) from all log context, error tracking events, and exception context in the auth failure path.
---
## Reason
Credentials in logs are the number-one source of credential leaks; logs are often stored longer than the credential is valid and are accessible to more personnel than the production database.
---
## Bad Example
```php
Log::warning('Auth failed', [
    'email' => $request->email,
    'password' => $request->password, // LEAK
]);
```
---
## Good Example
```php
Log::warning('Auth failed', [
    'email' => $request->email,
    'guard' => $request->guard,
    'ip' => $request->ip(),
    // password is NEVER included
]);
```
---
## Exceptions
No common exceptions — credentials must never appear in any log context.
---
## Consequences Of Violation
Credential leak via log access; compliance violation (PCI DSS 3.2 Requirement 3, GDPR Article 32); account compromise.

---

## Rule: Map AuthenticationException Explicitly in the Handler
---
## Category
Framework Usage | Code Organization
---
## Rule
Always register an explicit `renderable` callback for `AuthenticationException` in the global exception handler; never rely on the fallback handler for auth errors.
---
## Reason
The default Laravel handler may return HTML or expose internal details; explicit mapping guarantees a consistent JSON envelope with correct headers and guard-aware codes.
---
## Bad Example
```php
// No explicit mapping — falls through to generic handler
public function register(): void
{
    $this->renderable(function (Throwable $e, Request $request) {
        // generic handler loses WWW-Authenticate and guard context
    });
}
```
---
## Good Example
```php
public function register(): void
{
    $this->renderable(function (AuthenticationException $e, Request $request) {
        if (! $request->expectsJson()) return null;
        return $this->handleAuthenticationError($e);
    });
    $this->renderable(function (Throwable $e, Request $request) {
        // fallback — never reached for auth errors
    });
}
```
---
## Exceptions
When using Laravel's built-in authentication handling without customization and all consumers accept the default format.
---
## Consequences Of Violation
Auth errors return inconsistent shapes; missing WWW-Authenticate header; inability to distinguish guard contexts.

---

## Rule: Apply Rate Limiting to Authentication Endpoints Per IP
---
## Category
Security | Scalability
---
## Rule
Always configure per-IP rate limiting on all authentication endpoints (login, register, password reset); never apply the same limit as general API endpoints.
---
## Reason
Auth endpoints are prime targets for brute force and credential stuffing attacks; per-IP limits prevent enumeration without blocking legitimate traffic to other endpoints.
---
## Bad Example
```php
// Global rate limiter shared with general API
RateLimiter::for('api', fn ($job) => $job->limit(60)->everyMinute());
```
---
## Good Example
```php
RateLimiter::for('login', fn ($job) => $job->limit(5)->everyMinute()->by($job->ip()));
RateLimiter::for('api', fn ($job) => $job->limit(60)->everyMinute()->by($job->user()?->id ?: $job->ip()));
```
---
## Exceptions
Authentication is handled by an external provider (OAuth, SSO) with its own rate limiting.
---
## Consequences Of Violation
Brute force attacks succeed against auth endpoints; credential stuffing goes undetected; general API users blocked by auth endpoint abuse.

---

## Rule: Log Auth Failures with Full Context Excluding Credentials
---
## Category
Security | Maintainability
---
## Rule
Always log authentication failures with IP address, user agent, attempted identifier, guard name, and timestamp; always exclude the credential value itself.
---
## Reason
Auth failure logs are the primary tool for detecting credential stuffing, brute force, and account enumeration attacks; missing context makes attack detection impossible.
---
## Bad Example
```php
Log::info('Login failed');
// No context — cannot detect attack patterns
```
---
## Good Example
```php
Log::info('Login failed', [
    'email_hash' => hash('sha256', $request->email), // hash not raw value
    'ip' => $request->ip(),
    'user_agent' => $request->userAgent(),
    'guard' => 'web',
]);
```
---
## Exceptions
GDPR/CCPA compliance prohibits storing even hashed identifiers; log only IP and timestamp in those jurisdictions.
---
## Consequences Of Violation
Inability to detect brute force or credential stuffing attacks; delayed incident response; inability to correlate auth failure patterns across regions.

---

## Rule: Guard 401 Renderables with expectsJson() Check
---
## Category
Framework Usage | Reliability
---
## Rule
Always guard `renderable` callbacks for `AuthenticationException` with `$request->expectsJson()` before returning JSON; return null to let web handling proceed otherwise.
---
## Reason
The same exception is thrown for both API and web requests; returning JSON for a web request breaks session-based auth flows.
---
## Bad Example
```php
$this->renderable(function (AuthenticationException $e, $request) {
    return response()->json(/* ... */); // Also catches web requests
});
```
---
## Good Example
```php
$this->renderable(function (AuthenticationException $e, Request $request) {
    if (! $request->expectsJson()) return null;
    return response()->json(/* ... */);
});
```
---
## Exceptions
The application is API-only with no web routes; the check can be omitted when all routes expect JSON.
---
## Consequences Of Violation
Web auth redirects broken by JSON responses; session-based authentication fails for browser users.
