## Run static property audit as a CI step before Octane deployment
---
Category: Maintainability
---
Add a CI check that searches for static properties in application code (`grep -r "static \$" app/`). Fail the build if any are found without explicit justification.
---
Reason: Static properties are the #1 source of Octane state leaks. Making the audit automated prevents new leaks from being introduced. Each static property must be justified as intentionally cross-request state or eliminated.
---
Bad Example:
```bash
# Manual, one-time audit — leaks introduced later go undetected
```

Good Example:
```yaml
# CI step — fail on undocumented statics
- run: |
    grep -rn "static \$" app/ || true
    if [ $? -eq 0 ]; then exit 1; fi
```
---
Exceptions: Read-only static constants (`public const`) which are safe.
---
Consequences Of Violation: New state leaks introduced after initial audit, production data contamination.

## Always use scoped() bindings for per-request services
---
Category: Architecture
---
Register auth, session, database, and request-bound services using `$this->app->scoped()`, not `singleton()`.
---
Reason: scoped() bindings are automatically reset by Octane at the end of each request. singleton() bindings persist across requests, leaking request-scoped data. Use singleton() only for truly stateless services (config, logging, events).
---
Bad Example:
```php
$this->app->singleton(AuthManager::class, function () {
    return new AuthManager(); // Auth state persists across requests
});
```

Good Example:
```php
$this->app->scoped(AuthManager::class, function () {
    return new AuthManager(); // Fresh per request
});
```
---
Exceptions: Stateless services that carry no request-specific data (config repositories, event dispatchers, loggers).
---
Consequences Of Violation: Auth state leakage, user A authenticated as user B on subsequent request.

## Test Octane with ordered requests to detect state leaks
---
Category: Testing
---
Run ordered request tests (User A, User B, User A) in staging. If User B's data appears in User A's second response, you have a state leak.
---
Reason: State leaks manifest as cross-request contamination. Testing with alternating users (A, B, A) is the most direct way to detect them. If User A's data persists in the worker after User B's request, the leak is confirmed.
---
Bad Example:
```bash
# Testing isolated requests — doesn't detect cross-request leaks
ab -n 100 -c 10 http://app/endpoint
```

Good Example:
```bash
# Ordered test: A, B, A — detect contamination
curl --user user-a:pass http://app/profile # Returns User A
curl --user user-b:pass http://app/profile # Returns User B
curl --user user-a:pass http://app/profile # Must return User A, NOT User B
```
---
Exceptions: Applications where authentication is not relevant (public APIs).
---
Consequences Of Violation: Undetected data leakage shipped to production.

## Monitor per-worker RSS growth — alert on >10% per hour
---
Category: Monitoring
---
Track per-worker RSS in Octane deployments. Alert when RSS grows more than 10% per hour over a 4-hour window.
---
Reason: Memory growth in persistent workers is the leading indicator of state leaks. Gradual growth (5-10% per hour) indicates static property accumulation or closure capture. Rapid growth (>20% per hour) indicates a severe leak requiring immediate investigation.
---
Bad Example:
```php
// No RSS monitoring — leak detected only after OOM kills
```

Good Example:
```php
// Checkpoint monitoring per worker
if ($rssGrowth > 10) { // >10% per hour
    Log::warning('Memory leak suspected', [
        'worker' => $workerId,
        'rss_growth_percent' => $rssGrowth
    ]);
}
```
---
Exceptions: Workers that have just started and are still in warm-up phase (first 100 requests).
---
Consequences Of Violation: Leak undetected until OOM kills, causing production outage.
