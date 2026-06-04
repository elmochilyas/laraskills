# Anti-Patterns: Standard Webhooks Specification (Signature, Retry, Metadata)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit | Standard Webhooks Specification (Signature, Retry, Metadata) |
| Difficulty | Advanced |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Custom Verification Implementation Instead of Reference Libraries | Security | Critical |
| 2 | Verification Against Re-Serialized JSON Instead of Raw Payload | Reliability | Critical |
| 3 | Single Secret Per Subscriber Without Rotation Support | Security | High |
| 4 | Timestamp Tolerance Too Tight or Too Loose | Reliability | Medium |
| 5 | No Idempotency Store for Duplicate Detection | Reliability | High |

---

## Anti-Pattern 1: Custom Verification Implementation Instead of Reference Libraries

### Category
Security

### Description
Writing custom webhook signature verification code instead of using the official Standard Webhooks reference libraries, introducing subtle security bugs.

### Why Happens
The signing scheme looks simple (HMAC-SHA256 of `msg_id.timestamp.payload`). Developers write their own implementation to avoid adding a dependency, assuming the algorithm is straightforward enough to implement correctly.

### Warning Signs
- Custom verification code exists instead of `use StandardWebhooks\Webhook;`
- Verification uses regular comparison instead of constant-time comparison
- Payload encoding assumptions differ between sender and receiver
- Verification passes in development but fails intermittently in production
- The string to sign is constructed differently than the spec (`payload` encoding, delimiter handling)

### Why Harmful
The Standard Webhooks spec includes subtle requirements: constant-time comparison (`hash_equals`), exact payload byte matching, multiple signature parsing, version prefix extraction. Custom implementations typically miss one or more of these, creating timing attack vulnerabilities or verification failures that block legitimate webhooks.

### Real-World Consequences
- Timing attack vulnerability: attacker can brute-force the webhook secret by measuring response times
- Legitimate webhooks fail verification because custom code handles JSON whitespace differently
- Multiple signatures (during key rotation) cause verification failures because custom code only checks the first signature
- Signature version prefix handling is wrong; `v1a` (Ed25519) signatures are rejected
- Security audit flags custom crypto implementation as high-risk finding

### Preferred Alternative
Use the official Standard Webhooks reference implementation for PHP. It handles constant-time comparison, multi-signature parsing, timestamp validation, and edge cases correctly.

```php
// Use the reference library
use StandardWebhooks\Webhook;

$webhook = new Webhook($secret);
try {
    $webhook->verify($payload, $headers);
} catch (StandardWebhooks\Exception\WebhookVerificationException $e) {
    Log::error('Webhook verification failed', ['error' => $e->getMessage()]);
    abort(401);
}
```

### Refactoring Strategy
1. Remove custom verification code
2. Add `standard-webhooks/php` as a dependency via Composer
3. Replace all custom verification with the reference library
4. Test with known-good test vectors from the spec repository
5. Remove old custom verification code and any related tests

### Detection Checklist
- [ ] Reference library is used for verification, not custom code
- [ ] Constant-time comparison (`hash_equals`) is used if custom code exists
- [ ] Multi-signature header parsing is handled (space-delimited list)
- [ ] Signature version prefix (`v1`, `v1a`) is parsed correctly
- [ ] Verification works with spec test vectors

### Related Rules/Skills/Trees
- Rule: Use reference implementations for verification (tested, constant-time safe)
- Rule: Custom verification instead of reference libraries
- Related KU: HMAC-SHA256 Signature Generation (foundation)

---

## Anti-Pattern 2: Verification Against Re-Serialized JSON Instead of Raw Payload

### Category
Reliability

### Description
Verifying the webhook signature against JSON that has been re-serialized by the application (e.g., after `json_decode` + `json_encode`) instead of the exact raw payload string received over the wire.

### Why Happens
Developers parse the JSON payload to access fields, then re-serialize it for verification. They assume JSON encoding is deterministic and the re-serialized output will match the original.

### Warning Signs
- Verification code calls `json_encode(json_decode($payload))` before signing
- Payload is modified (whitespace stripped, fields reordered) before verification
- Verification passes in development (same process) but fails when sender uses different JSON encoder settings
- Intermittent verification failures with no payload content changes
- Re-serialized JSON differs in whitespace, key ordering, or escaping from original

### Why Harmful
JSON encoding is NOT deterministic. Different JSON encoders (or even the same encoder with different settings) may produce different output: whitespace differences, key ordering differences, Unicode escaping differences. The signature was computed over the ORIGINAL bytes. Verifying against re-serialized bytes guarantees intermittent failures.

### Real-World Consequences
- Stripe sends compact JSON (`{"id":"evt_1","amount":1000}`); Laravel's `json_encode` adds whitespace: `{"id": "evt_1", "amount": 1000}`
- Signature verification fails because the payload bytes differ
- Legitimate payment webhook rejected; payment never processed
- Intermittent: sometimes `json_encode` produces matching output (same encoder, same settings)
- Debugging takes hours because the payload content looks identical in logs (whitespace invisible)

### Preferred Alternative
Verify the signature against the EXACT raw payload string received in the HTTP request, before any JSON parsing or transformation.

```php
// Correct: verify against raw payload
class WebhookController extends Controller {
    public function handle(Request $request): Response {
        $rawPayload = $request->getContent(); // Exact bytes received
        
        $webhook = new Webhook($secret);
        try {
            $webhook->verify($rawPayload, $request->headers());
        } catch (WebhookVerificationException $e) {
            Log::error('Verification failed', ['error' => $e->getMessage()]);
            abort(401);
        }
        
        // Only now parse the JSON
        $data = json_decode($rawPayload, true);
        // Process...
    }
}
```

### Refactoring Strategy
1. Identify all verification code that uses `json_encode(json_decode($payload))`
2. Change to use `$request->getContent()` for the payload string
3. Store raw payload for signature verification before any JSON processing
4. Add middleware that captures raw payload before JSON parsing middleware runs
5. Test with various payload formats (compact, pretty-printed, Unicode)

### Detection Checklist
- [ ] Signature verification uses exact raw payload bytes
- [ ] No `json_encode` or `json_decode` happens before verification
- [ ] Middleware captures raw payload before any request transformation
- [ ] Verification passes with compact and pretty-printed JSON
- [ ] Unicode payloads (emoji, non-Latin characters) verify correctly

### Related Rules/Skills/Trees
- Rule: Verify against exact raw payload, not re-serialized JSON
- Rule: Verification against transformed payload instead of raw body
- Related KU: Webhook Signature Verification (raw payload handling)

---

## Anti-Pattern 3: Single Secret Per Subscriber Without Rotation Support

### Category
Security

### Description
Using a single static webhook secret per subscriber that never rotates, and implementing verification code that only accepts a single signature (not a list).

### Why Happens
Setting up webhook secrets is a one-time configuration. Key rotation is perceived as complex and risky (verification will break during rotation), so it's deferred indefinitely.

### Warning Signs
- `webhook-signature` header parsing expects exactly one signature (not space-delimited list)
- No mechanism to configure multiple active secrets per subscriber
- Secret rotation is not in the incident response or maintenance playbook
- Secrets have been unchanged since initial setup (months or years ago)
- No monitoring for webhook secret age

### Why Harmful
A single static secret means any secret leak (source code exposure, insider threat, log file exposure) requires immediate key rotation, which causes verification failure during the transition period. Without rotation support, the choice is between accepting the security risk or causing downtime.

### Real-World Consequences
- Webhook secret exposed in GitHub repository via accidental commit; all subscribers' security compromised
- Rotating the secret requires coordinated deployment with every subscriber simultaneously
- Some subscribers miss the update window; their webhooks fail verification
- Security audit requires quarterly secret rotation; cannot comply without subscriber-side support
- Compromised secret allows attacker to send fake payment webhooks

### Preferred Alternative
Support multiple signature versions per subscriber. The spec's space-delimited `webhook-signature` header enables zero-downtime key rotation: sign with both old and new keys during transition.

```php
// Implement multi-signature verification
class WebhookVerifier {
    public function verify(string $payload, array $headers, array $secrets): bool {
        $signatureHeader = $headers['webhook-signature'] ?? '';
        $signatures = explode(' ', $signatureHeader);
        
        foreach ($signatures as $sigPart) {
            [$version, $sig] = explode(',', $sigPart, 2);
            
            foreach ($secrets as $secret) {
                $expected = $this->computeSignature($payload, $headers, $secret, $version);
                if (hash_equals($expected, $sig)) {
                    return true; // Any matching secret + signature succeeds
                }
            }
        }
        
        return false;
    }
}

// During rotation:
// $secrets = [$newSecret, $oldSecret]; // Both active during transition
// After all subscribers updated: $secrets = [$newSecret];
```

### Refactoring Strategy
1. Update verification code to accept space-delimited multi-signature header
2. Add secrets configuration as an array, not a single string
3. Implement rotation procedure: add new secret, wait for propagation, remove old secret
4. Document key rotation playbook for operations team
5. Add monitoring for webhook secret age and rotation compliance

### Detection Checklist
- [ ] Verification accepts multiple signatures in the header
- [ ] Multiple secrets can be configured per subscriber
- [ ] Key rotation procedure is documented and tested
- [ ] Secret age is monitored and rotation reminders exist
- [ ] Old secret removal process is documented (after propagation verified)

### Related Rules/Skills/Trees
- Rule: Support multiple secret versions for zero-downtime key rotation
- Rule: Single secret per subscriber without rotation support
- Related KU: Replay Attack Prevention (key rotation patterns)

---

## Anti-Pattern 4: Timestamp Tolerance Too Tight or Too Loose

### Category
Reliability

### Description
Setting the webhook timestamp validation tolerance too tight (causing clock skew rejections) or too loose (weakening replay attack protection).

### Why Happens
The Standard Webhooks default tolerance is 5 minutes. Developers either set it to match their local clock precision (too tight, e.g., 30 seconds) or disable it entirely (too loose, effectively infinite).

### Warning Signs
- Tolerance set to <60 seconds without clock synchronization infrastructure
- Tolerance set to >600 seconds or disabled entirely
- Production incidents caused by webhooks rejected due to minor clock drift
- No clock synchronization (NTP) monitoring between sender and receiver
- Replay attack protection is non-existent or trivially bypassable

### Why Harmful
Too tight: legitimate webhooks are rejected due to normal clock drift between systems (200-500ms typical NTP drift, up to minutes without proper sync). Too loose: an attacker who intercepts a webhook can replay it hours or days later, and it will still be accepted.

### Real-World Consequences
- Tolerance set to 30 seconds; production webhooks rejected hourly due to 2-second clock drift
- Operations team increases tolerance to 10 minutes to stop firefighting
- Compliance audit: 10-minute tolerance means replayed webhooks are acceptable for 10 minutes
- Attacker replays a "payment received" webhook 9 minutes after interception; still accepted
- Tolerance set to 0 during debugging; production deployment breaks all webhooks

### Preferred Alternative
Use the spec-recommended 5-minute tolerance as the default. Configure tighter tolerance (60s) only if NTP-synchronized clocks are verified between sender and receiver.

```php
class TimestampValidator {
    private int $toleranceSeconds;
    
    public function __construct() {
        // Default: 5 minutes (300 seconds) per Standard Webhooks spec
        $this->toleranceSeconds = config('webhooks.timestamp_tolerance', 300);
        
        if ($this->toleranceSeconds < 60) {
            Log::warning('Timestamp tolerance below 60s requires NTP verification');
        }
    }
    
    public function validate(int $timestamp): bool {
        $now = now()->timestamp;
        $diff = abs($now - $timestamp);
        
        if ($diff > $this->toleranceSeconds) {
            Log::warning('Webhook timestamp outside tolerance', [
                'timestamp' => $timestamp,
                'now' => $now,
                'diff' => $diff,
                'tolerance' => $this->toleranceSeconds,
            ]);
            return false;
        }
        
        return true;
    }
}
```

### Refactoring Strategy
1. Set timestamp tolerance to 300 seconds (5 minutes) as default
2. Monitor clock sync between sender and receiver via NTP
3. Never set tolerance below 60 seconds without documented NTP verification
4. Never set tolerance above 600 seconds without documented risk acceptance
5. Add alerting on webhooks rejected due to timestamp tolerance

### Detection Checklist
- [ ] Timestamp tolerance is configured (not 0, not infinite)
- [ ] Default tolerance is 300 seconds (5 minutes)
- [ ] Tolerance below 60s is used only with verified NTP sync
- [ ] Replay attack protection is effective within tolerance window
- [ ] Clock drift between sender and receiver is monitored

### Related Rules/Skills/Trees
- Rule: 5-minute timestamp tolerance matching spec default
- Rule: Timestamp tolerance too tight causes clock skew issues; too loose weakens replay protection
- Related KU: Replay Attack Prevention (timestamp validation)

---

## Anti-Pattern 5: No Idempotency Store for Duplicate Detection

### Category
Reliability

### Description
Not implementing an idempotency store for the `webhook-id` header, allowing duplicate webhook deliveries to be processed as new events.

### Why Happens
Developers implement signature verification and assume that proves the webhook is legitimate and never seen before. They don't account for provider retries delivering the same webhook-id multiple times.

### Warning Signs
- `webhook-id` header is verified in signature but not stored or checked for duplicates
- No idempotency store (Redis, database) for webhook IDs
- Provider retry produces duplicate processing of the same event
- Stuck queue causes delayed retry to arrive and be processed as new event
- No mechanism to detect duplicate `webhook-id` values

### Why Harmful
The Standard Webhooks spec explicitly includes `webhook-id` as an idempotency key. Without idempotency storage, every provider retry creates a new processing attempt. For at-least-once delivery providers (most of them), every webhook can arrive multiple times. Without idempotency, duplicate processing is guaranteed.

### Real-World Consequences
- Provider delivers same webhook 3 times (initial + 2 retries due to slow response)
- All 3 are accepted and processed without idempotency check
- Customer receives 3 identical email notifications
- Payment processor records 3 identical payment entries
- Manual cleanup required to remove duplicates from all downstream systems

### Preferred Alternative
Store the `webhook-id` in Redis (or database) with a TTL matching the provider's retry window. Reject webhooks with previously seen IDs (return 200, but skip processing).

```php
class IdempotencyService {
    public function __construct(
        private Cache $cache,
        private int $ttlSeconds = 86400 // 24 hours
    ) {}
    
    public function isDuplicate(string $provider, string $webhookId): bool {
        $key = "webhook_idempotency:{$provider}:{$webhookId}";
        
        if ($this->cache->has($key)) {
            Log::info('Duplicate webhook detected', [
                'provider' => $provider,
                'webhook_id' => $webhookId,
            ]);
            return true;
        }
        
        $this->cache->put($key, true, $this->ttlSeconds);
        return false;
    }
}
```

### Refactoring Strategy
1. Add idempotency store (Redis or database) for webhook IDs
2. Check and store `webhook-id` before any processing
3. Set TTL to 24 hours (covers Standard Webhooks retry schedule)
4. Namespace by provider to prevent cross-provider collisions
5. Monitor idempotency hit rate to track provider retry behavior

### Detection Checklist
- [ ] webhook-id is stored and checked for duplicates before processing
- [ ] Idempotency store has TTL of 24 hours (minimum)
- [ ] Idempotency keys are namespaced by provider
- [ ] Duplicate webhooks return HTTP 200 (not 409) without processing
- [ ] Idempotency hit rate is monitored for retry visibility

### Related Rules/Skills/Trees
- Rule: webhook-id serves as idempotency key for deduplication at receiver
- Rule: Idempotency store: cache webhook-id for 24 hours
- Related KU: Idempotency Key Pattern (webhook-id as idempotency key)
