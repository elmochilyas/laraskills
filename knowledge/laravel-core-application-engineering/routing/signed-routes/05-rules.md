## Use Temporary Signed Routes for User-Facing Links

Always use `URL::temporarySignedRoute()` with an explicit expiration for email verification, password reset, unsubscribe, and invitation links. Never use `URL::signedRoute()` for user-facing actions.

---

## Category

Security

---

## Rule

Generate all signed URLs intended for end users via `URL::temporarySignedRoute()` with a reasonable expiration time. Do not use `URL::signedRoute()` (permanent) for user-facing links.

---

## Reason

Permanent signed URLs are valid indefinitely. If a link is intercepted (via email access, server log, browser history), it can be used at any future time. Temporary signed URLs embed an expiration timestamp in the HMAC signature, making them invalid after the specified time.

---

## Bad Example

```php
// Permanent — valid forever
URL::signedRoute('verification.verify', ['id' => $user->id]);
// Intercepted link can be used years later
```

---

## Good Example

```php
// Temporary — expires in 24 hours
URL::temporarySignedRoute('verification.verify', now()->addHours(24), [
    'id' => $user->id,
]);
```

---

## Exceptions

Public API webhook callbacks or public resource links that genuinely should be accessible indefinitely may use permanent signed routes. These are rare.

---

## Consequences Of Violation

Intercepted links can be replayed indefinitely; account takeover if verification links are intercepted; compliance risks for time-sensitive actions.

---

## Define Separate Routes for Signed Actions

Do not share a route between signed (unauthenticated) access and authenticated access. Define dedicated routes for signed actions.

---

## Category

Security

---

## Rule

Create distinct routes for actions that can be triggered via signed URL vs authenticated request. Do not apply the `signed` middleware to routes also used by authenticated users.

---

## Reason

Signed routes bypass session authentication — the signature is the authorization. Sharing a route between signed and authenticated access creates ambiguity about which security model applies. A developer may remove the `signed` middleware for authenticated convenience, breaking the security model for signed access, or may expose an authenticated-only action to signature-based access.

---

## Bad Example

```php
// Single route — ambiguous security model
Route::get('/settings/{user}/unsubscribe', [UnsubscribeController::class, 'confirm'])
    ->name('unsubscribe')
    ->middleware('signed');
// Authenticated users also use this route — signed middleware
// forces them to have a valid signature too
```

---

## Good Example

```php
// Dedicated signed route
Route::get('/unsubscribe/{email}', [UnsubscribeController::class, 'confirm'])
    ->name('unsubscribe.confirm')
    ->middleware('signed');

// Separate authenticated route for managing preferences
Route::post('/settings/unsubscribe', [UnsubscribeController::class, 'update'])
    ->name('unsubscribe.update')
    ->middleware('auth');
```

---

## Exceptions

No common exceptions. Mixed security models on a single route create unmanageable complexity.

---

## Consequences Of Violation

Security model ambiguity; signed route may be inadvertently exposed without middleware; authenticated flow may be broken by signature requirements.

---

## Enforce Server-Side Consumption Tracking for One-Time URLs

Mark signed URL resources as consumed server-side after first use. Check consumption before processing the action.

---

## Category

Security

---

## Rule

For one-time actions (email verification, password reset, confirm delete), track consumption in the database (e.g., `email_verified_at`, `used_at`, a consumed flag). Reject replayed signed URLs even if the signature is still valid.

---

## Reason

Temporary signed URLs prevent replay after expiration but do not prevent replay within the validity window. For one-time actions, a signed URL can be used multiple times within the same expiry period. Server-side consumption tracking ensures each URL can only be used once, regardless of signature validity.

---

## Bad Example

```php
class VerifyEmailController
{
    public function __invoke(Request $request, User $user)
    {
        // No consumption check — link can be replayed
        $user->markEmailAsVerified();
        return redirect('/dashboard');
    }
}
```

---

## Good Example

```php
class VerifyEmailController
{
    public function __invoke(Request $request, User $user)
    {
        if ($user->hasVerifiedEmail()) {
            // Already consumed — reject replay
            return redirect('/dashboard');
        }
        $user->markEmailAsVerified();
        return redirect('/dashboard');
    }
}
```

---

## Exceptions

Non-consumable actions (e.g., public document links, resource downloads) may allow repeated access. One-time actions must always track consumption.

---

## Consequences Of Violation

Replay attacks within the signature validity window; email addresses verified without actual email access; password resets triggered multiple times from the same link.

---

## Validate Parameters After Signature Validation

A valid signature only proves the URL was not tampered with. Always validate that the referenced resource exists and the action is still applicable.

---

## Category

Security

---

## Rule

After the `signed` middleware validates the signature, the route handler must independently verify that the referenced resource exists, is in the correct state, and the action is still valid.

---

## Reason

Signature validation confirms URL integrity — no parameters were modified. It does not confirm that the resource referenced by those parameters still exists, or that the action (e.g., unsubscribe, verify) is still applicable (e.g., user is already verified, already unsubscribed).

---

## Bad Example

```php
Route::get('/unsubscribe/{email}', function (string $email) {
    // Assumes email exists because signature is valid
    // What if the user deleted their account?
    Newsletter::unsubscribe($email);
})->middleware('signed');
```

---

## Good Example

```php
Route::get('/unsubscribe/{email}', function (string $email) {
    $subscriber = Subscriber::where('email', $email)->first();
    if (! $subscriber || $subscriber->isUnsubscribed()) {
        return redirect('/already-unsubscribed');
    }
    $subscriber->unsubscribe();
    return redirect('/unsubscribed');
})->middleware('signed');
```

---

## Exceptions

Public links that reference immutable resources (e.g., download links for static files) may not need additional validation. Any action that mutates state must validate.

---

## Consequences Of Violation

Processing actions on non-existent resources; duplicate processing of already-completed actions; unexpected errors when resources have been deleted.

---

## Never Expose Sensitive Data in Signed URL Parameters

Do not include sensitive information (emails, API keys, tokens) as plain parameters in signed URLs.

---

## Category

Security

---

## Rule

Signed URL parameters should use opaque identifiers (model IDs, UUIDs) rather than sensitive values. Hash or encode sensitive data before including it as a URL parameter.

---

## Reason

Signed URL parameters (including the signature itself) are visible in the query string. They appear in server access logs, browser history, analytics tools, and reverse proxy logs. Exposing plain-text emails, tokens, or other PII in URLs creates a data leak.

---

## Bad Example

```php
// Email and API key visible in URL query string
URL::temporarySignedRoute('api.access', now()->addHour(), [
    'email' => 'user@example.com',
    'api_key' => 'sk-live-abc123',
]);
```

---

## Good Example

```php
// Use opaque model identifier instead
URL::temporarySignedRoute('api.access', now()->addHour(), [
    'user_id' => $user->id,
    'token_hash' => sha1($apiToken),
]);
```

---

## Exceptions

No common exceptions. Never include sensitive or personally identifiable information as plain text in URL parameters.

---

## Consequences Of Violation

PII exposure in server logs; token leakage through referer headers; analytics tools recording sensitive data; compliance violations (GDPR, HIPAA).
