## Generate UUID on Client Side Once Per Operation
---
## Category
Architecture
---
## Rule
Generate the idempotency key as UUID v4 on the client side, once per operation before any retry attempts.
---
## Reason
Client-side generation ensures the key is consistent across retries and survives server failures; server-side generation can't be known to client before first attempt.
---
## Bad Example
```php
// Key generated inside retry loop — each attempt gets a new key
```
---
## Good Example
```php
$key = (string) Str::uuid();
// Use $key for all retry attempts
```
---
## Exceptions
APIs that provide server-generated idempotency keys.
---
## Consequences Of Violation
Retries bypass idempotency, causing duplicate side effects on network failures.
## Combine Distributed Lock with Idempotency Key
---
## Category
Reliability
---
## Rule
Use `Cache::lock()` with the idempotency key to serialize concurrent requests with the same key.
---
## Reason
Idempotency key lookup + processing is not atomic; concurrent requests with the same key can both pass the lookup before either completes.
---
## Bad Example
```php
if (!Cache::has("idem:$key")) { Cache::put("idem:$key", $result, 86400); } // race
```
---
## Good Example
```php
$lock = Cache::lock("idem:$key", 30);
if ($lock->get()) {
    try { /* process */ } finally { $lock->release(); }
}
```
---
## Exceptions
Single-worker serial processing where concurrent requests are impossible.
---
## Consequences Of Violation
Duplicate processing under concurrent request delivery, violating exactly-once guarantee.
## Set TTL to Match Provider's Retry Window
---
## Category
Architecture
---
## Rule
Configure idempotency key TTL per provider based on their documented retry window (typically 24h).
---
## Reason
If TTL expires before the provider stops retrying, the late retry is processed as a new operation, causing duplication.
---
## Bad Example
```php
Cache::put("idem:$key", $result, 3600); // 1h — provider retries for 24h
```
---
## Good Example
```php
$ttl = match ($provider) {
    'stripe' => 86400,    // 24h — Stripe retry window
    'paypal' => 172800,   // 48h — PayPal retry window
    default => 86400,
};
Cache::put("idem:$key", $result, $ttl);
```
---
## Exceptions
Providers with documented shorter retry windows.
---
## Consequences Of Violation
Duplicate charges, orders, or other side effects when late provider retries arrive after key expiry.
## Cache First Successful Response per Key
---
## Category
Performance
---
## Rule
Cache the successful response from the first request indexed by idempotency key; return it immediately on duplicate key.
---
## Reason
Returning the cached response avoids reprocessing and ensures the caller gets consistent results.
---
## Bad Example
```php
if (Cache::has("idem:$key")) { return; } // returns nothing — caller waits
```
---
## Good Example
```php
$cached = Cache::get("idem:$key");
if ($cached) { return $cached; } // returns cached response immediately
```
---
## Exceptions
Operations where returning cached response is infeasible (streaming responses).
---
## Consequences Of Violation
Caller waits unnecessarily or receives no response, breaking idempotency contract.
## Monitor Key Collision Rate
---
## Category
Observability
---
## Rule
Track idempotency key collision rate and alert on spikes as a security indicator.
---
## Reason
Elevated collision rates may indicate key generation bugs, key reuse, or replay attacks.
---
## Bad Example
```php
// No collision monitoring — security incidents go undetected
```
---
## Good Example
```php
$collisions = Counter::increment("idem:collisions:{$provider}");
if ($collisions > 10) {
    Alert::warning("Elevated idempotency key collisions for {$provider}");
}
```
---
## Exceptions
None — always monitor collision rates.
---
## Consequences Of Violation
Undetected key misuse, replay attacks, or client bugs causing data corruption.
