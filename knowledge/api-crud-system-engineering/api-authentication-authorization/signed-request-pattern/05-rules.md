# Phase 5: Rules — Signed Request Pattern

> Generated from 04-standardized-knowledge.md

## Always Use hash_equals() for Signature Comparison
---
## Category
Security
---
## Rule
Always compare computed HMAC signatures using `hash_equals()` for constant-time comparison. Never use `==` or `===`.
---
## Reason
Non-constant-time comparison (`==`) is vulnerable to timing attacks — an attacker can infer the correct signature byte-by-byte by measuring response times. `hash_equals()` executes in constant time regardless of match position.
---
## Bad Example
```php
if (hash_hmac('sha256', $payload, $secret) === $signature) {
    // Timing-vulnerable comparison
}
```

---
## Good Example
```php
$computed = hash_hmac('sha256', $payload, $secret);
if (! hash_equals($computed, $signature)) {
    abort(401, 'Invalid signature');
}
```

---
## Exceptions
No common exceptions. Always use constant-time comparison.
---
## Consequences Of Violation
Timing attack vulnerability; attacker can forge valid signatures through response timing analysis.

---
## Include Method, URI, Body Hash, Timestamp, and Nonce in Signature
---
## Category
Security
---
## Rule
Always include the HTTP method, full URI, body hash (SHA-256), timestamp, and nonce in the canonical string used to compute the HMAC signature.
---
## Reason
Omitting any component weakens integrity guarantees. Missing method allows GET→DELETE tampering. Missing body hash allows body modification. Missing nonce allows replay. Missing timestamp allows indefinite replay window.
---
## Bad Example
```php
$canonical = $request->getContent();
// Only body — method, URI, timestamp, nonce all missing
```

---
## Good Example
```php
$canonical = implode("\n", [
    $method,
    $uri,
    hash('sha256', $body),
    $timestamp,
    $nonce,
]);
$signature = hash_hmac('sha256', $canonical, $secret);
```

---
## Exceptions
GET requests with no body — body hash of empty string is still included.
---
## Consequences Of Violation
Method tampering undetected; body modification undetected; replay attacks possible.

---
## Enforce a 5-Minute Maximum Timestamp Window
---
## Category
Security
---
## Rule
Always enforce a maximum timestamp tolerance of 5 minutes (±300 seconds) between the signature timestamp and the server's current time.
---
## Reason
A window larger than 5 minutes allows replay attacks within that window. A smaller window (<1 minute) causes failures from legitimate clock skew between sender and receiver.
---
## Bad Example
```php
if (abs($timestamp - time()) > 3600) {
    // 1-hour window — replay attacks possible for 60 minutes
}
```

---
## Good Example
```php
if (abs($timestamp - time()) > 300) {
    abort(401, 'Signature expired');
}
```

---
## Exceptions
High-latency asynchronous webhook delivery — increase to 15 minutes with documented trade-off.
---
## Consequences Of Violation
Successful replay attacks within the allowed window; request forgery within timestamp tolerance.

---
## Implement Nonce Deduplication with Redis TTL
---
## Category
Security
---
## Rule
Always store received nonces in Redis with a SET NX command and TTL equal to the timestamp window to prevent replay attacks.
---
## Reason
Timestamp-only protection still allows replay within the timestamp window. Nonce deduplication ensures each signed request can only be processed once, regardless of timing.
---
## Bad Example
```php
// No nonce check — replay within 5-minute window succeeds
```

---
## Good Example
```php
$nonceKey = 'nonce:' . $nonce;
$stored = Redis::set($nonceKey, true, 'EX', 300, 'NX');
if (! $stored) {
    abort(401, 'Nonce already used');
}
```

---
## Exceptions
Idempotent operations where replay is harmless — but nonces still provide defense in depth.
---
## Consequences Of Violation
Replay attacks within timestamp window; request duplication.

---
## Accept Two Active Secrets During Rotation
---
## Category
Reliability
---
## Rule
Always accept signatures computed with either the current secret or the previous secret during key rotation periods.
---
## Reason
Instant secret rotation breaks all senders who have not yet updated their shared secret. A grace period with two active secrets ensures uninterrupted service during rotation.
---
## Bad Example
```php
$computed = hash_hmac('sha256', $payload, $currentSecret);
// Old secret immediately rejected — senders with stale secrets fail
```

---
## Good Example
```php
$secrets = [$currentSecret, $previousSecret];
$valid = false;
foreach ($secrets as $secret) {
    if (hash_equals(hash_hmac('sha256', $payload, $secret), $signature)) {
        $valid = true;
        break;
    }
}
```

---
## Exceptions
Security incident requiring immediate secret rotation — accept the brief outage.
---
## Consequences Of Violation
Production outages when shared secrets are rotated; all signed request consumers fail simultaneously.

---
## Return Signature Error Headers for Debugging
---
## Category
Maintainability
---
## Rule
Always include `X-Signature-Error` headers in failed signature validation responses indicating the specific failure reason.
---
## Reason
Signature validation failures are notoriously hard to debug (encoding differences, header order, canonicalization). Specific error messages drastically reduce debugging time for integrators.
---
## Bad Example
```json
{"error": "Invalid signature"}
```

---
## Good Example
```json
{"error": "Invalid signature"}
```
With header:
```
X-Signature-Error: timestamp_expired
// Or: nonce_reused
// Or: signature_mismatch
```

---
## Exceptions
No common exceptions. Detailed error headers save significant debugging effort.
---
## Consequences Of Violation
Hours of debugging for integrators trying to match signatures; support requests for "invalid signature" errors.

---
## Never Use Signed Requests for Browser-Based Clients
---
## Category
Security
---
## Rule
Never implement HMAC-signed request patterns for browser-based clients that cannot securely store shared secrets.
---
## Reason
HMAC signing requires a shared secret. Browsers cannot store secrets securely — any secret embedded in JavaScript is extractable via XSS or devtools inspection, defeating the security model.
---
## Bad Example
```php
// Browser client with embedded secret
fetch('/api/data', {
    headers: { 'X-Signature': computeSignature(secret, payload) }
});
// Secret extractable from JS bundle
```

---
## Good Example
```php
// Use Sanctum token auth for browser clients
fetch('/api/data', {
    headers: { 'Authorization': 'Bearer ' + token }
});
```

---
## Exceptions
No common exceptions. Browsers cannot securely hold HMAC secrets.
---
## Consequences Of Violation
Shared secret extracted from client-side code; attacker forges signed requests.

---
## Canonicalize the Body Before Signing
---
## Category
Design
---
## Rule
Always canonicalize the request body (sorted JSON keys, standardized whitespace) before computing or verifying the HMAC signature.
---
## Reason
JSON serialization differences between sender and receiver (key order, whitespace, escaping) produce different hashes for semantically identical content, causing signature mismatches.
---
## Bad Example
```php
$bodyHash = hash('sha256', $request->getContent());
// Raw content — whitespace differences cause mismatches
```

---
## Good Example
```php
ksort($data);
$canonical = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
$bodyHash = hash('sha256', $canonical);
```

---
## Exceptions
No common exceptions. Canonicalization is required for reliable signature matching.
---
## Consequences Of Violation
Intermittent signature validation failures from encoding differences; "works on my machine" debugging cycles.

---
## Use hash_hmac(), Never Custom HMAC Implementation
---
## Category
Security
---
## Rule
Always use PHP's built-in `hash_hmac()` function for computing signatures. Never implement HMAC manually.
---
## Reason
Custom HMAC implementations are prone to subtle cryptographic errors (padding, block size, truncation) that create security vulnerabilities. PHP's `hash_hmac()` is thoroughly reviewed and optimized.
---
## Bad Example
```php
// Custom HMAC — likely has cryptographic flaws
function customHmac($key, $data) {
    return hash('sha256', $key ^ str_repeat("\x5c", 64) . hash('sha256', $key ^ str_repeat("\x36", 64) . $data));
}
```

---
## Good Example
```php
$signature = hash_hmac('sha256', $canonical, $secret, true);
```

---
## Exceptions
No common exceptions. Always use the built-in function.
---
## Consequences Of Violation
Cryptographic weakness in signature computation; forgeable signatures due to implementation bugs.

---
## Run Signature Validation Before Controller Logic
---
## Category
Architecture
---
## Rule
Always run HMAC signature validation as middleware before the request reaches the controller.
---
## Reason
Controller-level signature validation means the request may have already triggered side effects (database writes, external API calls) before validation fails. Middleware runs earlier, preventing unnecessary processing.
---
## Bad Example
```php
class WebhookController
{
    public function handle(Request $request)
    {
        $this->validateSignature($request);
        // Expensive processing already started
    }
}
```

---
## Good Example
```php
class ValidateSignatureMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $this->validateSignature($request);
        return $next($request);
    }
}

Route::post('/webhooks/stripe', [WebhookController::class, 'handle'])
    ->middleware(ValidateSignatureMiddleware::class);
```

---
## Exceptions
No common exceptions. Signature validation is always a middleware concern.
---
## Consequences Of Violation
Wasted compute and side effects on requests that will be rejected; higher vulnerability to resource-exhaustion attacks.
