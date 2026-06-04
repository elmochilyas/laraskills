# Phase 5: Rules — Idempotency Key Error Handling

## Rule 1: Return Unique Error Codes Per Idempotency Scenario
---
## Category
Design
---
## Rule
Always return distinct error codes for each idempotency failure scenario: `IDEMPOTENCY_KEY_MISSING`, `IDEMPOTENCY_CONFLICT`, `IDEMPOTENCY_EXPIRED`, `IDEMPOTENCY_STORE_UNAVAILABLE`, `CONCURRENT_REQUEST_LOCK`. Never use a single generic error code.
---
## Reason
Generic error codes force consumers to parse error messages programmatically, which is fragile and inconsistent. Unique codes enable precise retry logic.
---
## Bad Example
```json
{ "error": { "code": "IDEMPOTENCY_ERROR", "message": "Something went wrong" } }
```
---
## Good Example
```json
{ "error": { "code": "IDEMPOTENCY_CONFLICT", "message": "Request payload differs from original request with this idempotency key.", "resolution": "Use a new idempotency key for different payloads." } }
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers cannot distinguish error types programmatically; fragile message parsing; incorrect retry decisions.
---

## Rule 2: Use HTTP 409 for Payload Conflicts, 422 for Validation Errors
---
## Category
Design
---
## Rule
Always return 409 Conflict when an idempotency key matches a different request payload. Return 422 Unprocessable Entity for missing or invalid keys. Never use 400 Bad Request for idempotency issues.
---
## Reason
409 semantically means "the request conflicts with current state" — the key exists but with different data. 422 means "the request is well-formed but semantically invalid" — the key itself is wrong. 400 is too generic.
---
## Bad Example
```php
return response()->json([...], 400); // Wrong status for conflict
```
---
## Good Example
```php
match ($error->type) {
    IdempotencyErrorType::CONFLICT => response()->json([...], 409),
    IdempotencyErrorType::INVALID_KEY => response()->json([...], 422),
    IdempotencyErrorType::MISSING_KEY => response()->json([...], 422),
};
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers cannot implement correct retry logic; status-code-based middleware misbehaves.
---

## Rule 3: Include Retry-After Header on Concurrent Lock Responses
---
## Category
Reliability
---
## Rule
Always include a `Retry-After` header (default 500ms) when returning 409 due to `CONCURRENT_REQUEST_LOCK`. Never omit the header.
---
## Reason
Without `Retry-After`, consumers retry immediately, creating a retry storm that exacerbates contention and may never succeed.
---
## Bad Example
```php
return response()->json([...], 409); // No Retry-After header
```
---
## Good Example
```php
return response()->json([
    'error' => [
        'code' => 'CONCURRENT_REQUEST_LOCK',
        'message' => 'Another request with this key is being processed.',
        'resolution' => 'Retry after the specified Retry-After period.',
    ]
], 409)->header('Retry-After', '1'); // 1 second
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer retry storm; Redis lock contention spikes; neither request may complete successfully.
---

## Rule 4: Never Include Stored Payload in Conflict Error Responses
---
## Category
Security
---
## Rule
Never include the stored request payload or response data in idempotency conflict error responses. Leaking stored data violates consumer privacy and may expose sensitive information.
---
## Reason
An attacker could use conflict responses to extract information about previous requests. The stored payload may contain PII, credentials, or financial data.
---
## Bad Example
```json
{ "error": { "code": "IDEMPOTENCY_CONFLICT", "stored_payload": { "credit_card": "4111..." } } }
```
---
## Good Example
```json
{ "error": { "code": "IDEMPOTENCY_CONFLICT", "message": "Request payload differs from original request with this idempotency key. Use a new key for different payloads." } }
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
PII exposure; regulatory non-compliance (GDPR, PCI); consumer data leaked via error messages.
---

## Rule 5: Provide Resolution Steps in Every Error Response
---
## Category
Maintainability
---
## Rule
Always include a `resolution` field in idempotency error responses explaining the concrete action the consumer should take. Never return errors that say what is wrong without saying what to do.
---
## Reason
Error messages without resolution steps force consumers to search documentation or contact support. Resolution guidance reduces support burden and enables self-service debugging.
---
## Bad Example
```json
{ "error": { "code": "IDEMPOTENCY_EXPIRED", "message": "Idempotency key has expired." } }
// Consumer: "What do I do now?"
```
---
## Good Example
```json
{ "error": { "code": "IDEMPOTENCY_EXPIRED", "message": "Idempotency key has expired.", "resolution": "Generate a new idempotency key and retry the request." } }
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Increased support tickets; consumer frustration; slower resolution of integration issues.
---

## Rule 6: Log Key Prefixes, Not Full Keys
---
## Category
Security
---
## Rule
Always log only the consumer prefix portion of idempotency keys, never the full key. Never write full keys to logs, metrics, or error tracking systems.
---
## Reason
Idempotency keys can be used as correlation identifiers and may enable request tracking across services. Full keys in logs create a PII-adjacent data leak.
---
## Bad Example
```php
Log::info('Processing idempotency key', ['key' => $fullKey]); // PII leak
```
---
## Good Example
```php
$prefix = Str::before($fullKey, ':');
Log::info('Processing idempotency request', ['consumer_prefix' => $prefix]);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
PII-adjacent data in logs; compliance violations; consumer activity trackable via leaked keys.
---

## Rule 7: Add Warning Header for Near-Expiry Keys
---
## Category
Maintainability
---
## Rule
Always include a `Warning` header in responses when the idempotency key is within 10% of its TTL expiration. Never silently serve near-expiry replays.
---
## Reason
Consumers should be warned that their retry window is closing. Silent near-expiry responses may cause the consumer to continue retrying after the key expires.
---
## Bad Example
```php
// No warning — consumer doesn't know key is about to expire
return response($data)->header('Idempotency-Key-Status', 'replay');
```
---
## Good Example
```php
$ttlRemaining = Cache::ttl($key);
$ttlPercent = $ttlRemaining / $originalTtl;
if ($ttlPercent < 0.1) {
    return response($data)
        ->header('Idempotency-Key-Status', 'replay')
        ->header('Warning', '299 - "Idempotency key near expiration"');
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer continues retrying after key expires; duplicate processing; idempotency guarantee lost without warning.
