---
Domain: Async & Distributed Systems
Subdomain: Webhook Distribution
Knowledge Unit: K069 — Webhook Replay Attack Prevention
Knowledge ID: K069
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Single Factor Replay Prevention | Security | Critical |
| 2 | Infinite Timestamp Tolerance | Security | High |
| 3 | Ignoring Raw Body for Signature Verification | Implementation | High |
| 4 | Secret Key in Signature Verification Error Messages | Security | Medium |
| 5 | No Idempotency Key as Second Defense Layer | Architecture | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| HMAC-Only Protection (No Timestamp) | Critical — captured webhooks replayable forever | Always sign timestamp + payload |
| Overly Wide Tolerance Window | High — replay window measured in hours/days | Set tolerance to 5-15 minutes max |
| No Idempotency Layer | Medium — replayed requests cause duplicate effects | Add idempotency key to all state-changing webhooks |

---

## 1. Single Factor Replay Prevention

### Category
Security

### Description
Relying on either HMAC signature verification or timestamp freshness alone, but not both. HMAC without timestamp allows indefinite replay. Timestamp without HMAC is trivially forgeable.

### Why It Happens
- Implementing only signature verification (thinking it's sufficient)
- Implementing only timestamp checking (thinking replay prevention is only about time)
- Not understanding that each addresses a different threat: HMAC = authenticity, timestamp = freshness
- Copying partial implementations from incomplete examples
- "We check the timestamp, that should prevent replays" — but signatures can be forged

### Warning Signs
- HMAC signature verification exists but no timestamp check
- Timestamp check exists but no HMAC signature verification
- "We use IP whitelisting instead of signatures" — not equivalent
- Documentation mentions "replay attack prevention" but only one check is implemented
- Webhook handler code shows only one layer of verification

### Why Harmful
**HMAC without timestamp:** Proves authenticity but not freshness. An attacker intercepts a valid "refund" webhook and replays it every hour. Each replay has a valid signature (the HMAC is computed from the payload, not time-bound). The attacker can drain the company's bank account with replayed refunds indefinitely.

**Timestamp without HMAC:** Proves freshness but not authenticity. An attacker intercepts a webhook, modifies the payload (changes `amount: 10` to `amount: 1000`), updates the timestamp to the current time, and replays it. The timestamp is recent, so it passes — but the signature was never verified because there is no HMAC.

### Consequences
- HMAC-only: indefinite replay attack possible
- Timestamp-only: forged payloads accepted
- Compliance violation: PCI DSS requires both authenticity and replay protection
- False sense of security: "we have replay protection"
- Business impact: duplicate refunds, forged orders, account changes

### Alternative
- Always combine HMAC signature verification AND timestamp freshness check:
  ```php
  // 1. Check freshness
  $timestamp = $request->header('Timestamp');
  if (abs(now()->timestamp - $timestamp) > 300) { // 5 min tolerance
      abort(401, 'Webhook expired');
  }
  
  // 2. Verify signature (covers timestamp + payload)
  $rawBody = $request->getContent();
  $signature = $request->header('Signature');
  $expected = base64_encode(hash_hmac('sha256', "{$timestamp}.{$rawBody}", $secret, true));
  if (!hash_equals($expected, $signature)) {
      abort(401, 'Invalid signature');
  }
  ```
- Both layers are required — neither is sufficient alone

### Refactoring Strategy
1. Audit webhook verification — does it check both HMAC and timestamp?
2. Add missing layer (HMAC or timestamp)
3. Ensure HMAC covers timestamp + payload (not payload alone)
4. Test: replay attack scenarios — verify both layers block them
5. Document: replay prevention requires both authenticity (HMAC) and freshness (timestamp)

### Detection Checklist
- [ ] HMAC signature verification implemented
- [ ] Timestamp freshness check implemented
- [ ] HMAC covers timestamp + payload (not payload alone)
- [ ] Neither IP whitelisting nor network security substitutes for these
- [ ] Replay attack test: both layers must be bypassed
- [ ] Compliance: authenticity + freshness both verified

### Related Rules
- use-timestamped-nonce-in-signature, reject-expired-timestamps

### Related Skills
- Prevent Webhook Replay Attacks

### Related Decision Trees
- Signature Verification vs IP Whitelisting for Webhook Security

---

## 2. Infinite Timestamp Tolerance

### Category
Security

### Description
Setting the timestamp tolerance window to a very large value (hours or days) to avoid legitimate rejections from clock skew or queue delays. This gives attackers a large window to replay captured webhooks.

### Why It Happens
- Legitimate webhooks are rejected because of clock skew → operator increases tolerance
- Not fixing the root cause: NTP synchronization
- Queue-backed delivery causes delays → tolerance increased to accommodate
- "Setting it to 24 hours fixes all our rejection problems" — and all our replay protection
- Not understanding the security implications of a wide tolerance

### Warning Signs
- Timestamp tolerance > 15 minutes
- "We set tolerance to 1 hour because of queue delays"
- No NTP synchronization (clock drift is the real problem)
- "It was easier to increase tolerance than fix clock sync"
- Tolerance setting exists but is effectively infinite (hours or days)

### Why Harmful
An attacker captures a webhook and can replay it within the tolerance window. With a 60-minute tolerance, the attacker has an entire hour to replay the webhook multiple times. With a 24-hour tolerance, they have a full day. Each replay processes the same event: duplicate refunds, duplicate charges, duplicate account changes. The replay protection that should prevent this is disabled by the overly wide window.

### Consequences
- Replay protection is effectively disabled (large replay window)
- Captured webhooks are replayable for hours or days
- Duplicate processing from replayed requests
- Compliance violation: PCI DSS, SOC 2 require replay protection
- False sense of security: "we have replay prevention"
- Attacker has comfortable window to exploit replayed payloads

### Alternative
- Fix the root causes of timer rejection instead of widening the window:
  - **Clock skew:** Implement NTP synchronization on all servers
  - **Queue delays:** Capture timestamp at dispatch time (not receipt time) or reduce queue latency
  - **Network delays:** Set tolerance to 2x measured max end-to-end latency (capped at 15 minutes)
- Keep tolerance at 5-15 minutes maximum
- If > 15 minutes required: document the risk, implement compensating controls (idempotency keys, nonce tracking)

### Refactoring Strategy
1. Check current timestamp tolerance
2. If > 15 minutes: reduce to 15 minutes
3. Implement NTP synchronization
4. If rejections occur: measure actual delivery latency, set tolerance to 2x max (capped at 15 min)
5. If still rejecting: fix queue delivery latency, don't increase tolerance further
6. Monitor rejection rate due to timestamp expiration — should be near-zero

### Detection Checklist
- [ ] Timestamp tolerance ≤ 15 minutes
- [ ] NTP synchronization in place on all servers
- [ ] Queue delivery delay measured and accounted for
- [ ] Rejection rate due to timestamp expiration < 0.1%
- [ ] No tolerance increase used as workaround for clock/queue issues
- [ ] Compensating controls if tolerance > 15 minutes

### Related Rules
- reject-expired-timestamps

### Related Skills
- Prevent Webhook Replay Attacks

### Related Decision Trees
- Replay Attack Prevention Strategy

---

## 3. Ignoring Raw Body for Signature Verification

### Category
Implementation

### Description
Using the parsed JSON body instead of the raw request body bytes for HMAC signature verification. JSON serialization is not deterministic — key ordering, whitespace, and encoding can differ between sender and receiver, causing legitimate signatures to fail.

### Why It Happens
- Convenience: `json_encode($request->all())` is easier than accessing raw body
- Not knowing that JSON serialization is non-deterministic
- Assuming parsed JSON → re-encoded JSON = original byte sequence
- Not reading the raw body documentation in webhook verification guides
- "I need to validate the payload before verifying the signature" — wrong order (validate after)

### Warning Signs
- Signature verification uses `json_encode($request->all())` or `json_encode($data)`
- Intermittent signature verification failures (key ordering, whitespace differences)
- "The signature was valid in Stripe's dashboard but we rejected it"
- Using `$request->input()` or `$request->all()` before signature check
- Encoding library differences: PHP's `json_encode` produces different output than Ruby/Python/Node

### Why Harmful
Stripe signs the raw request body `{"event":"charge.succeeded","amount":1000}`. The receiver parses this into an array, then re-encodes: `json_encode($data)` might produce `{"amount":1000,"event":"charge.succeeded"}` (key order changed). The HMAC over the re-encoded body doesn't match Stripe's signature. A valid payment notification webhook is rejected. The merchant never learns about the successful charge. Debugging is confusing because the payload looks identical when viewed as data.

### Consequences
- Legitimate webhooks rejected with 401 (intermittent or consistent)
- Silent payment/order processing failure
- Debugging nightmare: "the signature matches in the test tool but fails in production"
- Engineering time wasted on JSON encoding comparison
- Trust erosion: "our webhook integration is unreliable"

### Alternative
- Always verify signature against the raw request body:
  ```php
  // Get raw body before ANY parsing
  $rawBody = $request->getContent();
  
  // Recompute HMAC from raw body
  $expected = hash_hmac('sha256', $rawBody, $secret);
  
  if (!hash_equals($expected, $request->header('Signature'))) {
      abort(401, 'Invalid signature');
  }
  
  // Only after verification, parse the body
  $data = json_decode($rawBody, true);
  ```

### Refactoring Strategy
1. Audit webhook handler — find all signature verification code
2. Change to use `$request->getContent()` for raw body verification
3. Move parsing AFTER verification
4. Test with known real webhook payloads from each provider
5. Add test: parse, re-encode, verify — should fail (demonstrates the non-determinism)

### Detection Checklist
- [ ] Signature verified against raw body (`$request->getContent()`)
- [ ] No `json_encode($request->all())` in signature verification
- [ ] Body parsed only AFTER signature verification
- [ ] No intermittent signature failures from encoding differences
- [ ] Test confirms raw body verification passes

### Related Rules
- use-timestamped-nonce-in-signature

### Related Skills
- Prevent Webhook Replay Attacks

### Related Decision Trees
- Signature Verification vs IP Whitelisting for Webhook Security

---

## 4. Secret Key in Signature Verification Error Messages

### Category
Security

### Description
Including the expected signature, computed signature, or secret key in HTTP error responses when signature verification fails. This helps attackers debug their forgery attempts by showing what the expected output looks like.

### Why It Happens
- Debugging convenience: returning details to help diagnose integration issues
- Not considering that error responses are visible to attackers
- Copying verbose error patterns from other parts of the application
- "We return helpful error messages for our developers" — also helpful for attackers
- Not sanitizing error responses for security-sensitive operations

### Warning Signs
- Error response: `{"error": "Invalid signature", "expected": "...", "received": "..."}`
- Signature comparison values exposed in HTTP response body
- Stack traces or debug information in webhook error responses
- "Our error messages include the computed hash for debugging"
- Logging signature values alongside the error

### Why Harmful
An attacker sends a forged webhook with an incorrect signature. The error response includes the expected signature value: `{"expected": "abc123", "received": "xyz789"}`. The attacker now knows:
1. Their signature doesn't match
2. The expected signature value (which reveals information about the HMAC output)
With multiple attempts, the attacker can correlate inputs with expected outputs — a chosen-plaintext attack on the HMAC. Even if the secret isn't directly leaked, the attacker gains valuable information about the verification algorithm and can fine-tune forgery attempts.

### Consequences
- Attacker gains information about signature verification
- Chosen-plaintext attack surface for HMAC analysis
- Secret rotation may be needed if signatures are exposed
- Compliance violation: security details must not leak in error responses
- Debugging difficulty: extracting detailed errors from logs is harder but necessary

### Alternative
- Return a generic 401 response without details:
  ```php
  abort(401, 'Invalid signature'); // No details
  ```
- Log the details server-side:
  ```php
  Log::warning('Webhook signature verification failed', [
      'source_ip' => $request->ip(),
      'expected_signature' => $expected,
      'received_signature' => $signature,
      'endpoint' => $request->path(),
  ]);
  abort(401, 'Invalid signature');
  ```

### Refactoring Strategy
1. Audit webhook error response for leaked signature information
2. Remove expected/computed signatures from error responses
3. Move detailed debug information to server-side logs
4. Add rate limiting on webhook endpoint to prevent brute-force probing
5. Alert on high signature mismatch rates (possible attack in progress)

### Detection Checklist
- [ ] Error responses return generic "Invalid signature" (no details)
- [ ] No expected/computed signature values in HTTP responses
- [ ] Detailed information logged server-side only
- [ ] Rate limiting on webhook endpoint
- [ ] Signature mismatch alerting in place

### Related Rules
- use-timestamped-nonce-in-signature

### Related Skills
- Prevent Webhook Replay Attacks

### Related Decision Trees
- Replay Attack Prevention Strategy

---

## 5. No Idempotency Key as Second Defense Layer

### Category
Architecture

### Description
Relying solely on timestamp + HMAC for replay prevention without adding idempotency keys as a second defense layer. While timestamp + HMAC prevents external replay attacks, it doesn't handle duplicate deliveries from the sender (which are common in webhook systems).

### Why It Happens
- Assuming webhook providers never deliver duplicates
- Not reading provider documentation about "at least once" delivery semantics
- Believing replay prevention (timestamp + HMAC) covers all duplicate scenarios
- Not implementing idempotency because "replay prevention is enough"
- "We check the timestamp, so duplicates won't happen" — duplicates can arrive within the tolerance window

### Warning Signs
- State-changing webhook processing has no idempotency key check
- Duplicate webhook events cause duplicate side effects (double charges, duplicate orders)
- "Stripe sent the same event twice" — well-documented behavior
- Status change operations are not idempotent (e.g., "mark as paid" — applying twice is usually safe, but complex operations are not)
- Post-mortem: "we got the same webhook twice and processed it both times"

### Why Harmful
Even with perfect timestamp + HMAC protection against external replay attacks, the webhook provider may deliver the same event twice. Stripe, GitHub, and most webhook providers document "at least once" delivery — duplicates are expected. When a duplicate arrives within the timestamp tolerance window (5 minutes), it passes the freshness check and has a valid signature. Without idempotency keys, both deliveries are processed — causing duplicate charges, duplicate orders, or duplicate notifications.

### Consequences
- Duplicate processing from provider-issued duplicates (not external replay)
- Double charges, duplicate orders, duplicate inventory deductions
- Customer complaints: charged twice for the same purchase
- Reconciliation complexity: identifying and reversing duplicates
- Trust erosion: "your system double-charged me"
- Provider relationship: "this is expected behavior, you need idempotency"

### Alternative
- Add idempotency key as a second defense layer:
  ```php
  public function handle(Request $request): void
  {
      $idempotencyKey = $request->header('Idempotency-Key') ?? $request->input('event_id');
      
      if ($idempotencyKey) {
          $lock = Cache::lock("webhook:{$idempotencyKey}", 10);
          if (!$lock->get()) {
              return response()->json(['status' => 'already_processed']);
          }
      }
      
      // Process webhook...
  }
  ```
- Idempotency keys handle: provider duplicates, network retries, and any remaining replay attacks within the tolerance window

### Refactoring Strategy
1. Identify all state-changing webhook operations
2. Add idempotency key tracking (cache lock or database unique constraint)
3. Use provider-provided event IDs as idempotency keys
4. Test: send duplicate webhook — verify only first is processed
5. Monitor: track idempotency key hit rate (duplicate detection rate)

### Detection Checklist
- [ ] Idempotency keys implemented for all state-changing webhooks
- [ ] Duplicate deliveries from provider are silently handled
- [ ] No duplicate side effects from webhook processing
- [ ] Idempotency key expiration configured (e.g., 24 hours)
- [ ] Idempotency key hit rate monitored
- [ ] Defense in depth: HMAC + timestamp + idempotency key

### Related Rules
- implement-idempotency-keys

### Related Skills
- Prevent Webhook Replay Attacks

### Related Decision Trees
- Replay Attack Prevention Strategy
