# Rules: Signed URLs

## Use Signed URLs for All Public Temporary Access
---
## Category
Security
---
## Rule
Use `URL::signedRoute()` or `URL::temporarySignedRoute()` for any action that gives temporary public access to a protected resource (email verification links, file downloads, unsubscribe links).
---
## Reason
Signed URLs are cryptographically signed with the `APP_KEY` — tampering with the URL parameters invalidates the signature. This provides secure, temporary access without requiring authentication. Unsigned URLs for these actions are trivially guessable or shareable.
---
## Bad Example
```php
// Unsigned URL — anyone who knows the user ID can unsubscribe
route('unsubscribe', ['user' => $user->id]);
```
---
## Good Example
```php
// Signed URL — only valid for this user and expires
URL::temporarySignedRoute('unsubscribe', now()->addHours(24), ['user' => $user->id]);
```
---
## Exceptions
No common exceptions — signed URLs are the standard for temporary access.
---
## Consequences Of Violation
Unsigned URLs are guessable and shareable, no authentication required.
---

## Set the Shortest Practical Expiration for Temporary Signed URLs
---
## Category
Security
---
## Rule
Set the expiration for `temporarySignedRoute()` to the minimum time the user needs to complete the action. Default to 1 hour or less.
---
## Reason
A signed URL with a long expiration (30 days) that is emailed to the user can be intercepted or forwarded. Shorter expiration reduces the window of opportunity for an attacker who obtains the URL.
---
## Bad Example
```php
URL::temporarySignedRoute('password-reset', now()->addDays(30), ['user' => $user->id]); // 30 days
```
---
## Good Example
```php
URL::temporarySignedRoute('password-reset', now()->addHour(), ['user' => $user->id]); // 1 hour
```
---
## Exceptions
No common exceptions — shorter expiration is always safer.
---
## Consequences Of Violation
Intercepted signed URL usable for days or weeks.
---

## Validate Signed URLs in the Controller or Middleware
---
## Category
Architecture
---
## Rule
Use `$request->hasValidSignature()` or `$request->hasValidSignatureWhileIgnoring()` in the controller or `signed` middleware on the route. Never skip validation.
---
## Reason
A route that accepts signed URLs must verify the signature. Without validation, anyone can access the route by removing the `signature` parameter from the URL. The `signed` middleware or `hasValidSignature()` method validates the HMAC before the controller runs.
---
## Bad Example
```php
Route::get('/unsubscribe/{user}', [UnsubscribeController::class, 'index']); // No signature validation
// Anyone can call /unsubscribe/1
```
---
## Good Example
```php
Route::get('/unsubscribe/{user}', [UnsubscribeController::class, 'index'])
    ->middleware('signed'); // Validates signature
```
---
## Exceptions
No common exceptions — signature validation is mandatory for signed URL routes.
---
## Consequences Of Violation
Unauthorized access to signed URL routes without valid signature.
---

## Use hasValidSignatureWhileIgnoring() for Non-Essential Parameters
---
## Category
Architecture
---
## Rule
Use `$request->hasValidSignatureWhileIgnoring(['utm_source', 'ref'])` when the URL may have query parameters appended by email clients or analytics tools that were not part of the original signature.
---
## Reason
Email clients, analytics tools, and proxies may add query parameters to URLs. `hasValidSignature()` validates against all parameters in the URL. `hasValidSignatureWhileIgnoring()` excludes specified parameters from the signature validation, preventing false invalidation.
---
## Bad Example
```php
// Email client adds ?utm_source=newsletter — signature becomes invalid
$request->hasValidSignature(); // false — extra parameter breaks signature
```
---
## Good Example
```php
$request->hasValidSignatureWhileIgnoring(['utm_source', 'utm_campaign', 'ref']); // true
```
---
## Exceptions
No common exceptions — ignoring analytics parameters is essential for email delivery.
---
## Consequences Of Violation
Broken signed URLs when email clients or proxies add parameters.
---

## Invalidate Signed URLs After Single Use When Appropriate
---
## Category
Security
---
## Rule
For one-time actions (email verification, password reset), mark the URL as used after successful processing. Return an error if the same URL is used again.
---
## Reason
A signed URL for email verification or password reset should be usable only once. If the URL is intercepted, the attacker can use it before the legitimate user. Single-use invalidation (tracking used URLs in a database or cache) prevents replay attacks.
---
## Bad Example
```php
// Email verification URL can be used repeatedly
public function verify(Request $request) {
    if (!$request->hasValidSignature()) abort(401);
    $user = User::findOrFail($request->user);
    $user->email_verified_at = now(); // Always sets — no single-use check
    $user->save();
}
```
---
## Good Example
```php
public function verify(Request $request) {
    if (!$request->hasValidSignature()) abort(401);
    $user = User::findOrFail($request->user);
    if ($user->email_verified_at) {
        return redirect('/already-verified'); // Already used
    }
    $user->email_verified_at = now();
    $user->save();
}
```
---
## Exceptions
Download links that should be usable multiple times before expiration.
---
## Consequences Of Violation
Replay attack — intercepted URL used before legitimate user.
---

## Log Signed URL Access for Audit
---
## Category
Audit Logging
---
## Rule
Log when a signed URL is accessed, including the target user, action, IP address, and whether validation succeeded or failed.
---
## Reason
Failed signature validation indicates tampering attempts. Logging successful and failed access provides an audit trail for investigation. Repeated failed signature validation from one IP may indicate an attacker scanning for valid signed URLs.
---
## Bad Example
```php
// No logging — tampering attempts invisible
```
---
## Good Example
```php
public function verify(Request $request) {
    if (!$request->hasValidSignature()) {
        Log::warning('Invalid signed URL', ['url' => $request->fullUrl(), 'ip' => $request->ip()]);
        abort(401);
    }
    Log::info('Signed URL accessed', ['user' => $request->user, 'action' => 'verify']);
}
```
---
## Exceptions
No common exceptions — logging signed URL access is important for security monitoring.
---
## Consequences Of Violation
Tampering attempts undetected, no audit trail.
