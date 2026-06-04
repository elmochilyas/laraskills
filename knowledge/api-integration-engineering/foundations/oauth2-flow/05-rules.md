## Cache Tokens with Stampede Protection
---
## Category
Performance
---
## Rule
Always cache access tokens with TTL and use `Cache::lock()` to prevent cache stampede on concurrent requests.
---
## Reason
Fetching a token on every request adds an unnecessary round-trip; without stampede protection, multiple concurrent requests all trigger token refresh simultaneously when the cache expires.
---
## Bad Example
```php
$token = Http::asForm()->post('https://auth.example.com/oauth/token', [
    'grant_type' => 'client_credentials', 'client_id' => $id, 'client_secret' => $secret,
])->json()['access_token'];
```
---
## Good Example
```php
$token = Cache::remember('stripe:token', 3500, function () {
    return Http::asForm()->post('https://auth.example.com/oauth/token', [
        'grant_type' => 'client_credentials', 'client_id' => $id, 'client_secret' => $secret,
    ])->json()['access_token'];
});
```
---
## Exceptions
Non-expiring tokens or tokens refreshed outside the request cycle (e.g., via scheduler).
---
## Consequences Of Violation
Excessive token requests, upstream rate limit hits from refresh storms, degraded latency.
## Proactively Refresh at 50% TTL
---
## Category
Performance
---
## Rule
Implement proactive token refresh at 50% of TTL to avoid expiration during request processing.
---
## Reason
Waiting until token expiry risks serving an expired token during a request; refreshing early ensures valid tokens are always available.
---
## Bad Example
```php
Cache::remember('token', 3600, fn () => $this->fetchToken()); // waits until expiry
```
---
## Good Example
```php
$ttl = $tokenData['expires_in'] ?? 3600;
$refreshAt = (int)($ttl * 0.5);
Cache::remember('token', $ttl - 10, fn () => $this->fetchToken());
// Optionally schedule a pre-emptive refresh at $refreshAt seconds
```
---
## Exceptions
Tokens with very short TTL (<60s) where proactive refresh doesn't provide meaningful benefit.
---
## Consequences Of Violation
Requests fail with 401 during the window between token expiry and refresh, causing unnecessary retries.
## Handle 401 with Single Retry and Fresh Token
---
## Category
Reliability
---
## Rule
On receiving a 401 response, retry once with a freshly fetched token before propagating the error.
---
## Reason
Tokens can expire between cache check and request dispatch; a single retry with fresh token handles this edge case transparently.
---
## Bad Example
```php
$response = Http::withToken($token)->get('/charges');
if ($response->unauthorized()) { throw new AuthException(); }
```
---
## Good Example
```php
$response = Http::withToken($token)->get('/charges');
if ($response->unauthorized()) {
    Cache::forget('token');
    $freshToken = $this->fetchToken();
    $response = Http::withToken($freshToken)->get('/charges')->throw();
}
```
---
## Exceptions
Operations where retry is not idempotent or the 401 clearly indicates invalid credentials (not expiry).
---
## Consequences Of Violation
Transient 401 failures propagate to users unnecessarily, reducing integration reliability.
## Store Secrets in Vault, Not .env
---
## Category
Security
---
## Rule
Store client credentials (client_id, client_secret) in a secrets vault; never commit them to version control even in .env files.
---
## Reason
.env files are frequently committed to repos accidentally; vaults provide auditing, rotation, and access control for credentials.
---
## Bad Example
```php
'client_secret' => env('STRIPE_CLIENT_SECRET'), // committed in .env.example
```
---
## Good Example
```php
'client_secret' => Vault::secret('stripe/client_secret'), // fetched from vault at runtime
```
---
## Exceptions
Local development environments where vault access is not available (use .env with .gitignore).
---
## Consequences Of Violation
Credential exposure in version control, no audit trail of credential access, difficult rotation.
## Inject Token Service as Singleton
---
## Category
Code Organization
---
## Rule
Register the OAuth token service as a singleton per upstream to share cached tokens across the request cycle.
---
## Reason
Multiple token requests within the same request cycle would each fetch tokens independently without singleton scoping.
---
## Bad Example
```php
$tokenService = new StripeTokenService(); // new instance — no cache sharing
```
---
## Good Example
```php
// ServiceProvider
$this->app->singleton(StripeTokenService::class, fn () => new StripeTokenService());
// All consumers share the same cached token
```
---
## Exceptions
Multi-tenant integrations where each tenant has different credentials.
---
## Consequences Of Violation
Duplicate token fetches within a single request, wasted resources, potential rate limit hits.
