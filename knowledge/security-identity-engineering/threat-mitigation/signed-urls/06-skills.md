# Skill: Generate and Verify Signed URLs for Tamper-Proof Links

## Purpose
Use Laravel's signed URL functionality (`URL::signedRoute`, `URL::temporarySignedRoute`) to generate tamper-proof, optionally expiring links for email verification, password reset, downloads, and unsubscribe actions.

## When To Use
- Email verification links
- Password reset links
- Unsubscribe links in marketing emails
- One-time download links with expiration
- Public share links that should be tamper-proof and/or time-limited

## When NOT To Use
- Authenticated routes (use session/token auth instead)
- High-volume public links where signature verification overhead matters
- Links that should be usable an unlimited number of times (consider suitability)

## Prerequisites
- Laravel routes defined with names
- `ValidateSignature` middleware available
- Valid `APP_KEY` (used as HMAC signing key)

## Workflow
1. Define named routes for signed URL destinations
2. Generate permanent signed route: `URL::signedRoute('download', ['file' => $file->id])`
3. Generate temporary signed route: `URL::temporarySignedRoute('verify', now()->addHours(24), ['user' => $user->id])`
4. Apply `signed` middleware to routes: `Route::get('/verify/{user}', ...)->middleware('signed')`
5. For API responses, verify signatures manually using `$request->hasValidSignature()`
6. Allow URL parameter changes only if the signature is regenerated
7. Redirect invalid/expired signatures to a friendly error page (not a bare 403)

## Validation Checklist
- [ ] `signed` middleware applied to protected routes
- [ ] Temporary signed URLs have appropriate expiration
- [ ] Signature tampering results in 403 (not data exposure)
- [ ] Expired signatures show user-friendly error message
- [ ] APP_KEY is not rotated while signed URLs are in-flight (or rotation handled)
