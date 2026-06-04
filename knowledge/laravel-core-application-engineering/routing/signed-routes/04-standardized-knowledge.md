# ECC Standardized Knowledge — Signed Routes

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Routing System |
| **Knowledge Unit** | Signed Routes |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — Routing |
| **Last Updated** | 2026-06-02 |

---

## Overview

Signed routes generate URLs with HMAC signatures that verify the URL hasn't been tampered with. The signature is appended as an `signature` query parameter, generated using the application's `APP_KEY`. When the route is accessed, Laravel validates the signature and returns 403 if validation fails.

Signed routes are used for links that need to be verified without authentication — email verification links, unsubscribe links, one-time action links, and public invitation links. They provide URL-level integrity without requiring the user to be logged in.

---

## Core Concepts

### URL Generation
`URL::signedRoute('route.name', ['parameter' => $value])` generates a signed URL with `?signature=` appended.

### Temporary Signed URLs
`URL::temporarySignedRoute('route.name', now()->addHours(24), [...])` adds an expiration timestamp to the signed URL. The signature includes the expiration time, making the URL valid only until the specified time.

### Signature Validation
`Route::get('/verify/{id}', ...)->name('verify')->middleware('signed')` validates the signature. If invalid, returns 403.

### InvalidSignatureException
Thrown when the signature validation fails (tampered URL, expired timestamp). The exception renders as a 403 HTTP response.

---

## When To Use

- Email verification links
- Password reset links
- Unsubscribe links
- One-time action links (confirm deletion, approve action)
- Invitation links
- Public links that must be verified at access time

---

## When NOT To Use

- Authenticated routes (use CSRF and session-based auth instead)
- API endpoints with API tokens (use token-based auth)
- Routes that should be bookmarkable without expiration
- Routes where the signature exposes sensitive data in the URL

---

## Best Practices

### Always Use Temporary Signed Routes for Time-Sensitive Actions
Use `temporarySignedRoute()` with an appropriate expiration for verification and confirmation links.

**Why:** Without expiration, a signed URL is valid indefinitely. An intercepted email verification link could be used at any future time by anyone who has access to it.

### Validate Parameters in the Route Handler
Signed routes verify URL integrity, not parameter validity. Always validate that the signed parameters reference valid resources.

**Why:** A valid signature only proves the URL hasn't been tampered with, not that the referenced resource exists or the action is still applicable.

### Use Dedicated Routes for Signed Actions
Define separate routes for signed actions rather than sharing routes with authenticated actions.

**Why:** Signed routes bypass session authentication. Sharing routes between signed and authenticated access creates confusion about which security model applies.

---

## Architecture Guidelines

### Signed Route Definition
```php
Route::get('/verify-email/{id}/{hash}', [VerificationController::class, 'verify'])
    ->name('verification.verify')
    ->middleware('signed');
```

### URL Generation
```php
use Illuminate\Support\Facades\URL;

// Permanent (valid indefinitely)
URL::signedRoute('verification.verify', ['id' => $user->id, 'hash' => sha1($user->email)]);

// Temporary (valid 24 hours)
URL::temporarySignedRoute('verification.verify', now()->addHours(24), ['id' => $user->id]);
```

---

## Performance Considerations

Signature generation and validation use HMAC-SHA256 via PHP's `hash_hmac()` function. Both operations are O(1) and add <0.1ms overhead. The signature is computed once during URL generation and once during route validation.

---

## Security Considerations

### APP_KEY Protection
Signed route security depends entirely on the secrecy of `APP_KEY`. If the key is compromised, anyone can generate valid signed URLs.

### Signature Exposure
The signature is part of the URL query string. URLs containing signatures may be logged by web servers, proxies, or analytics tools. Use POST-only routes for sensitive actions.

### Replay Attacks
Permanent signed URLs can be used repeatedly. For one-time actions (email verification, password reset), mark the resource as consumed server-side after first use.

### URL Tampering
Any modification to the URL parameters, host, or query string invalidates the signature. This prevents attackers from changing signed URL parameters.

---

## Common Mistakes

### Not Expiring Signed URLs
Desc: Using `signedRoute()` instead of `temporarySignedRoute()` for time-sensitive actions.
Cause: Convenience — permanent URLs are simpler.
Consequence: Signed URL is valid indefinitely. An intercepted link can be used at any time.
Better: Always add expiration for time-sensitive actions.

### Sharing Signed Routes with Authenticated Access
Desc: A single route that works both with and without signature validation.
Cause: Trying to reduce route duplication.
Consequence: Security model ambiguity; signed access may bypass intended authentication checks.
Better: Define separate routes for signed and authenticated access.

### Not Validating Parameters After Signature
Desc: Trusting signed URL parameters without checking resource existence.
Cause: Assuming a valid signature means the action is valid.
Consequence: Using non-existent or already-consumed resources without validation.
Better: Always validate that the referenced resource exists and the action is applicable.

---

## Anti-Patterns

### Signed Routes for Authentication
Using signed routes as an authentication mechanism. Signed routes only verify URL integrity, not user identity. Always combine with proper authentication for sensitive actions.

### Exposing Sensitive Data in Signed URLs
Including sensitive information (user email, API keys) as plain parameters in signed URLs. The URL parameters are visible in server logs and browser history.

---

## Examples

### Email Verification
```php
// URL generation
URL::temporarySignedRoute(
    'verification.verify',
    now()->addHours(24),
    ['id' => $user->id, 'hash' => sha1($user->email)]
);

// Route definition
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, '__invoke'])
    ->name('verification.verify')
    ->middleware('signed');
```

### Unsubscribe Link
```php
URL::temporarySignedRoute('newsletter.unsubscribe', now()->addDays(30), [
    'email' => $user->email,
]);

Route::get('/unsubscribe/{email}', [UnsubscribeController::class, '__invoke'])
    ->name('newsletter.unsubscribe')
    ->middleware('signed');
```

---

## Related Topics

### Prerequisites
- **Route Definition** — Route naming for signed URL generation
- **Route Name Generation** — URL generation via route names

### Closely Related
- **Middleware** — The signed middleware implementation
- **URL Generation** — `URL::signedRoute()` and `URL::temporarySignedRoute()`

### Cross-Domain
- **Security & Identity Engineering** — Email verification and password reset patterns

---

## AI Agent Notes

### Important Decisions
- Signed URLs use the application's `APP_KEY` for HMAC signing
- Temporary signed URLs embed an expiration timestamp in the signature
- The `signed` middleware validates signatures and returns 403 on failure
- `InvalidSignatureException` renders as a 403 response

### Important Constraints
- The `signature` query parameter name is reserved — don't use it for other purposes
- Signed URLs are exposed in server logs and browser history
- Changing `APP_KEY` invalidates ALL existing signed URLs
- `temporarySignedRoute()` expiration maxes out at signed 32-bit integer (year 2038 issue on 32-bit systems)

### Rules Generation Hints
- Enforce `temporarySignedRoute()` over `signedRoute()` for user-facing links
- Enforce separate signed routes (not sharing with authenticated routes)
- Enforce server-side consumption tracking for one-time signed URLs

---

## Verification

This document has been validated against:
- `Illuminate\Routing\UrlGenerator::signedRoute()` — signed URL generation
- `Illuminate\Routing\UrlGenerator::temporarySignedRoute()` — expiring URL generation
- `Illuminate\Routing\Middleware\ValidateSignature` — signature validation middleware
- `Illuminate\Routing\Exceptions\InvalidSignatureException` — exception handling
