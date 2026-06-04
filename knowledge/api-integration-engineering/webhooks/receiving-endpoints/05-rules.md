## Always Add Webhook URLs to CSRF Exception
---
## Category
Security
---
## Rule
Add every webhook route URL to `VerifyCsrfToken::$except` before defining the route; verify exceptions via route caching.
---
## Reason
Webhook providers cannot provide CSRF tokens; a missing exception causes 419 errors, and the webhook provider retries indefinitely without success.
---
## Bad Example
```php
// routes/web.php
Route::post('webhook/stripe', [StripeController::class, 'handle']);
// Missing from VerifyCsrfToken::$except — always 419
```
---
## Good Example
```php
// App\Http\Middleware\VerifyCsrfToken
protected $except = ['webhook/stripe'];
// routes/api.php
Route::post('webhook/stripe', [StripeController::class, 'handle']);
```
---
## Exceptions
Routes in `routes/api.php` which uses the `api` middleware group without CSRF.
---
## Consequences Of Violation
All webhook requests return 419, providers retry indefinitely, no events processed.
## Use Route::post() Only, Never Route::any()
---
## Category
Security
---
## Rule
Define webhook endpoints as `Route::post()` only; never use `Route::any()` or `Route::match()`.
---
## Reason
Webhook providers always POST; allowing other methods (GET, PUT) creates CSRF and security vulnerabilities.
---
## Bad Example
```php
Route::any('webhook/stripe', [StripeController::class, 'handle']); // accepts GET, PUT, DELETE
```
---
## Good Example
```php
Route::post('webhook/stripe', [StripeController::class, 'handle']); // POST only
```
---
## Exceptions
Providers that use non-POST methods (extremely rare).
---
## Consequences Of Violation
CSRF vulnerabilities on GET requests, unintended state changes via PUT/DELETE.
## Respond 200 Within 5 Seconds
---
## Category
Reliability
---
## Rule
Return a 200 response from the webhook endpoint within 5 seconds; never perform significant processing in the HTTP request lifecycle.
---
## Reason
Most providers timeout and retry if the response takes longer than 5 seconds, causing duplicate deliveries and processing overhead.
---
## Bad Example
```php
public function handle(Request $request): Response {
    $this->processPayment($request->all()); // may take 20+ seconds
    return response()->json(['status' => 'ok']);
}
```
---
## Good Example
```php
public function handle(Request $request): Response {
    ProcessStripeWebhook::dispatch($request->getContent()); // ~2ms
    return response()->json(['status' => 'ok']);
}
```
---
## Exceptions
Health check endpoints requiring synchronous validation.
---
## Consequences Of Violation
Provider timeouts and automatic retries, duplicate processing, wasted resources.
## Use Exact Path Exemption Over Wildcards
---
## Category
Security
---
## Rule
Prefer exact URL paths in CSRF exemption over wildcards; use wildcards only when necessary for multiple endpoints.
---
## Reason
Wildcards (`/webhook/*`) broaden the CSRF bypass surface and may inadvertently expose non-webhook routes.
---
## Bad Example
```php
protected $except = ['webhook/*']; // overly broad — matches any /webhook/ path
```
---
## Good Example
```php
protected $except = ['webhook/stripe', 'webhook/github']; // exact, minimal
```
---
## Exceptions
Dynamically registered webhook routes where exact paths aren't known at deployment time.
---
## Consequences Of Violation
Unintended routes bypass CSRF protection, increased attack surface.
## Clear Route Cache After Adding Webhook Routes
---
## Category
Maintainability
---
## Rule
Run `php artisan route:cache` after adding or modifying webhook routes; verify cached routes work correctly.
---
## Reason
Route caching is not automatic; failing to clear the cache after webhook route changes results in 404 errors on new endpoints.
---
## Bad Example
```php
// Added new webhook route but forgot to clear route cache — returns 404
```
---
## Good Example
```bash
php artisan route:cache
# Verify:
php artisan route:list | grep webhook
```
---
## Exceptions
Development environments where route caching is disabled.
---
## Consequences Of Violation
New webhook endpoints return 404, providers fail to deliver, production incidents during deployment.
