# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Threat Mitigation |
| Knowledge Unit | Signed URLs and Signed Routes |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Laravel signed URLs provide a way to generate URLs that are cryptographically signed using the application's `APP_KEY`. Any tampering with the URL (changing query parameters, path) invalidates the signature. `URL::signedRoute()` generates a permanent signed route; `URL::temporarySignedRoute()` adds an expiration timestamp. The `ValidateSignature` middleware verifies signed URLs. Common use cases: email verification links, password reset links, unsubscribe links, and one-time download links. Signed URLs prevent parameter tampering and enforce expiration for time-sensitive actions.

---

## Core Concepts

- **Signature**: An HMAC-SHA256 hash of the URL components (route name, parameters, expiry). Append as `?signature=...`.
- **`URL::signedRoute($name, $params)`**: Generates a signed URL that never expires. Permanent.
- **`URL::temporarySignedRoute($name, $expiry, $params)`**: Generates a signed URL that expires at the given time (Unix timestamp).
- **`ValidateSignature` Middleware**: Verifies the signature on the incoming request. Returns 403 if invalid or expired.
- **`hasValidSignature()` / `hasValidRelativeSignature()`**: Manual signature verification on the `Request` instance.
- **HMAC Tamper Detection**: Any modification to the URL changes the HMAC — signature validation fails.

---

## When To Use

- Email verification links (`email/verify/{id}/{hash}`)
- Password reset links
- Unsubscribe links in marketing emails
- One-time download links (temporary signed URLs with expiry)
- Public share links with expiration
- Any URL that should be tamper-proof and/or time-limited

## When NOT To Use

- Regular navigation links (no special protection needed)
- API endpoints with token-based authentication (tokens provide equivalent security)
- Internal-only routes (not exposed to end users)
- When the URL content is not sensitive (no tampering concern)

---

## Best Practices

- **Use Temporary Signed URLs for Time-Sensitive Actions**: Password resets, email verification, download links. Default expiry: 30-60 minutes.
- **Use Permanent Signed URLs for Long-Lived Links**: Unsubscribe links, public share links with no expiry.
- **Validate with Middleware**: Apply `signed` middleware to routes: `Route::get('/verify-email/{id}', ...)->middleware('signed')`.
- **Invalid Signature Handling**: Customize the 403 error page for signed URL failures. Provide a "resend link" option.
- **Log Invalid Signature Attempts**: Tampered URLs may indicate probing attacks. Log and monitor.

---

## Architecture Guidelines

- Signed routes: define in `routes/web.php` or `routes/api.php` with `signed` middleware
- Email verification: Laravel uses signed URLs by default — customize via `VerificationUrl` callback
- Temporary routes: set `$expiry` as `now()->addMinutes(60)` — long enough for user action, short enough for security
- Relative signatures: `hasValidRelativeSignature()` for subdomain-independent URLs
- Signature parameters: add custom parameters to the route — they are included in the signature

---

## Performance Considerations

- Signed URL generation: HMAC computation — <0.01ms — negligible
- Signature validation: one HMAC computation per request — <0.01ms
- No database queries — purely cryptographic
- Temporary signed URL expiry: checked against `expires` query parameter — simple timestamp comparison

---

## Security Considerations

- **Key Dependency**: Signed URLs depend on APP_KEY. Rotating APP_KEY invalidates all existing signed URLs.
- **Permanent vs Temporary**: Permanent signed URLs never expire — use them carefully (unsubscribe links acceptable; password reset links not).
- **`expires` Parameter**: The expiry timestamp is part of the URL — visible to the user. Not a secret, but tamper-proof via signature.
- **Replay Prevention**: Signed URLs can be replayed until expiry. For one-time use, track consumed signatures server-side.
- **URL Content**: Signed URLs include parameters in the URL — avoid including sensitive data (tokens, secrets) in URL parameters.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using permanent signed URLs for sensitive actions | Convenience | Link never expires — can be replayed indefinitely | Use `temporarySignedRoute` with appropriate expiry |
| Forgetting `signed` middleware | Not adding middleware | Route accepts unsigned requests | Always add `signed` middleware to signed routes |
| Including sensitive data in URL parameters | `user()->id` or tokens in URL | Parameters visible in server logs, browser history | Use opaque references (hashed IDs, reference codes) |
| Not handling invalid signatures | Default 403 | Poor user experience | Customize 403 with clear message and recovery action |
| Key rotation breaks signed URLs | Rotating APP_KEY | All existing signed URLs invalidated | Plan key rotation, regenerate signed URLs |

---

## Anti-Patterns

- **Using signed URLs as authentication tokens**: Signed URLs verify the URL is untampered, not that the user is authenticated
- **No expiry on temporary links**: `temporarySignedRoute` with `now()->addYears(1)` is effectively permanent
- **Not logging tampering attempts**: Indicates probing or attacks — monitor invalid signatures

---

## Examples

**Generating signed URLs:**
```php
use Illuminate\Support\Facades\URL;

// Permanent signed URL
$url = URL::signedRoute('posts.show', ['post' => $post->id]);

// Temporary signed URL (expires in 60 minutes)
$url = URL::temporarySignedRoute(
    'download',
    now()->addMinutes(60),
    ['file' => $file->uuid]
);

// In a Blade template
<a href="{{ URL::signedRoute('unsubscribe', ['email' => $user->email]) }}">
    Unsubscribe
</a>
```

**Route with signed middleware:**
```php
// routes/web.php
use Illuminate\Routing\Middleware\ValidateSignature;

Route::get('/download/{file}', [DownloadController::class, 'show'])
    ->middleware('signed');

// Or with relative signature (subdomain-independent)
Route::get('/verify-email/{id}/{hash}', [VerificationController::class, 'verify'])
    ->middleware('signed:relative');
```

**Manual signature validation:**
```php
public function verify(Request $request)
{
    if (! $request->hasValidSignature()) {
        abort(401, 'This link is invalid or has expired.');
    }
    
    // Process the verification
}
```

---

## Related Topics

- Crypt facade (AES-256 symmetric encryption)
- Email verification
- Password reset
- APP_KEY management

---

## AI Agent Notes

- Signed URLs are the standard pattern for verifiable, time-limited URLs. Check that sensitive routes (password reset, email verification) use `temporarySignedRoute`.
- If signed URL validation fails, first check: route name matches, parameters match, and APP_KEY hasn't been rotated.
- For email verification, Laravel's built-in signed URL handling can be customized via the `VerificationUrl` callback.

---

## Verification

- [ ] Sensitive routes use `temporarySignedRoute` (not `signedRoute`)
- [ ] `ValidateSignature` middleware applied to signed routes
- [ ] Expiry appropriate for the action (30-60 min for verification, longer for downloads)
- [ ] Invalid signature handled gracefully (custom 403 with recovery action)
- [ ] No sensitive data in signed URL parameters
- [ ] Invalid signature attempts logged and monitored
- [ ] One-time use links implement server-side consumption tracking (if needed)
- [ ] Email verification uses signed URLs by default (Laravel built-in)
