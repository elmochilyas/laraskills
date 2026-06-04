---
Domain: Async & Distributed Systems
Subdomain: Webhook Distribution
Knowledge Unit: K067 — Spatie Laravel Webhook Client
Knowledge ID: K067
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Single Global Webhook Config Key | Security | Critical |
| 2 | Infinite Timestamp Tolerance Window | Security | High |
| 3 | Ignoring Rejected Webhooks (No Monitoring) | Operations | Medium |
| 4 | Re-Encoding Request Body Before Signature Verification | Implementation | High |
| 5 | Processing Webhooks Synchronously in Controller | Performance | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Shared Secret Across Endpoints | Critical — one breach exposes all | One config key per external service |
| Replay Attack Window Too Large | High — captured requests replayable for hours | Fix clock drift instead of widening tolerance |
| Silent Rejection | Medium — configuration errors or attacks undetected | Monitor signature mismatch and timestamp expiration rates |

---

## 1. Single Global Webhook Config Key

### Category
Security

### Description
Using one shared signing secret for all incoming webhook endpoints. A compromised secret on any integration exposes all webhook receivers to forged payloads.

### Why It Happens
- Starting with a single webhook source and never splitting
- Not understanding that secrets should be per-integration
- Convenience: one env var, one config entry
- Not planning for multiple external services
- "They're all our partners, we trust them" — misses the point of secret isolation

### Warning Signs
- Single entry in `config/webhook-client.php` for all services
- One `SIGNING_SECRET` env var shared across Stripe, GitHub, custom partners
- When a new webhook source is added, the old secret is reused
- Secret rotation requires coordinating downtime across all integrations
- "We use the same secret for everything" — in a security-sensitive feature

### Why Harmful
Stripe's webhook secret is compromised (e.g., leaked in a log file). An attacker can now forge webhooks not just from Stripe but from ALL integrations sharing that secret — GitHub, custom partner APIs, and internal systems. A single breach cascades across every external system integration. Rotating the secret requires updating all external systems simultaneously, which is operationally difficult.

### Consequences
- Single secret breach exposes all webhook integrations
- Secret rotation requires coordinated updates with ALL external senders
- Cannot isolate security incidents to one integration
- Attacker can forge webhooks from any sender
- Audit trail: which integration sent which webhook is ambiguous
- Compliance violation: shared secrets reduce security posture

### Alternative
- Use one config key per external service:
  ```php
  'configs' => [
      [
          'name' => 'stripe',
          'signing_secret' => env('STRIPE_WEBHOOK_SECRET'),
      ],
      [
          'name' => 'github',
          'signing_secret' => env('GITHUB_WEBHOOK_SECRET'),
      ],
      [
          'name' => 'partner-api',
          'signing_secret' => env('PARTNER_WEBHOOK_SECRET'),
      ],
  ],
  ```
- Each integration has its own secret, env var, and config entry

### Refactoring Strategy
1. Identify all webhook sources and their current secret configuration
2. Generate unique secrets per integration
3. Update `config/webhook-client.php` with per-service configs
4. Share new secrets with each external service
5. After all services are updated, remove the old shared secret
6. Implement secret rotation procedure per service

### Detection Checklist
- [ ] Each external service has its own config key
- [ ] No shared signing secret across integrations
- [ ] Secret rotation is possible per-service without downtime
- [ ] Security incident isolation per integration
- [ ] Audit trail includes which integration processed each webhook

### Related Rules
- validate-webhook-secret-on-receive

### Related Skills
- Set Up Spatie Webhook Client for Receiving

### Related Decision Trees
- Spatie Webhook Client vs Custom Webhook Processing

---

## 2. Infinite Timestamp Tolerance Window

### Category
Security

### Description
Setting the timestamp tolerance window to a very large value (hours or days) or disabling timestamp validation entirely to avoid legitimate rejections from clock skew or queue delays. This effectively disables replay attack protection.

### Why It Happens
- Legitimate webhooks are rejected due to clock skew — operator sets tolerance higher
- Developer doesn't understand replay attack implications
- "Our webhooks sometimes take 30 minutes to process, so we set tolerance to 60 minutes"
- Not fixing the root cause (clock skew, queue delay)
- Disabling timestamp validation because "it's causing problems"

### Warning Signs
- Timestamp tolerance set to 60+ minutes
- `verify_timestamp` set to `false` in config
- Timestamp validation disabled to work around clock skew issues
- "We don't check timestamps because our servers aren't synchronized"
- No NTP synchronization in place

### Why Harmful
An attacker captures a webhook payload and can replay it within the tolerance window. With a 60-minute tolerance, the attacker has an entire hour to replay the webhook multiple times. If the webhook is a payment notification or account state change, each replay triggers a duplicate processing. Setting tolerance to extremes (hours or days) means any captured webhook is replayable for that entire period — the replay protection is effectively disabled.

### Consequences
- Replay protection is effectively disabled
- Captured webhooks can be replayed within the tolerance window
- Duplicate processing from replayed requests
- Compliance violation (PCI DSS, SOC 2 require replay protection)
- False sense of security: "we have webhook security configured"
- No defense against replay attacks

### Alternative
- Fix clock skew (NTP synchronization) instead of widening tolerance
- Keep tolerance at 5-15 minutes maximum
- If queue delays cause rejections: capture the timestamp at dispatch time, not receipt time
- If tolerance must be increased: document the risk and implement compensating controls (idempotency keys, nonce tracking)

### Refactoring Strategy
1. Check current timestamp tolerance setting
2. If > 15 minutes: reduce to 5-15 minutes
3. Implement NTP synchronization on all servers
4. If legitimate rejections occur: measure actual delivery latency and set tolerance to 2x max latency (capped at 15 minutes)
5. Add monitoring: webhook rejections due to timestamp expiration

### Detection Checklist
- [ ] Timestamp tolerance ≤ 15 minutes
- [ ] `verify_timestamp` enabled (not disabled)
- [ ] NTP synchronization in place
- [ ] Webhook rejection rate due to timestamp expiration is near-zero
- [ ] Replay attack protection is effective
- [ ] Compensating controls if tolerance > 15 minutes

### Related Rules
- set-reasonable-timeout-and-retries

### Related Skills
- Set Up Spatie Webhook Client for Receiving

### Related Decision Trees
- Signature Verification vs IP Whitelisting for Webhook Security

---

## 3. Ignoring Rejected Webhooks (No Monitoring)

### Category
Operations

### Description
Not logging or monitoring webhook rejections (signature mismatches, timestamp expirations). These rejections are critical security signals — a spike may indicate an attack, a configuration error, or clock drift — but without monitoring, they go completely unnoticed.

### Why It Happens
- Focusing only on successfully processed webhooks
- Not considering that rejection monitoring is a security practice
- Assuming rejections are always the sender's fault (not monitored)
- No alerting infrastructure for webhook security events
- "If a webhook is rejected, that's between the sender and us" — no, it's a signal

### Warning Signs
- No logging for webhook signature verification failures
- No monitoring for timestamp expiration rates
- "We don't track how many webhooks we reject"
- Signature mismatch rate is unknown
- Alert: "stripe webhooks stopped working" — investigation reveals rejection spike weeks ago

### Why Harmful
A configuration error causes the signing secret to be mismatched — every incoming webhook from a major partner is rejected with 401. The partner's webhooks fail silently for 3 days. No one notices because rejection is not monitored. Orders from that partner are never processed, payments fail, and customers complain. The root cause (mismatched secret) could have been detected within minutes if rejection monitoring existed.

### Consequences
- Silent rejection of valid webhooks from configuration errors
- Attacks (forged webhooks) go undetected — no signal
- Clock drift goes unnoticed (timestamp expiration rate increases)
- Partner dissatisfaction: "our webhooks are being rejected"
- Business impact: orders, payments, or notifications not processed
- Post-mortem: "why didn't anyone notice the rejection spike?"

### Alternative
- Monitor all webhook rejections:
  - Log signature mismatches with source IP, headers, and timestamp
  - Log timestamp expirations with delivery latency
- Set up alerts:
  - Spike in signature mismatches: possible attack or config error
  - Spike in timestamp expirations: possible clock drift or delivery delay issue
- Dashboard: webhook acceptance vs rejection rate over time

### Refactoring Strategy
1. Add logging to the webhook handler for all rejection reasons
2. Track signature mismatch and timestamp expiration rates
3. Set up alerts for unusual rejection patterns
4. Create a dashboard showing webhook acceptance vs rejection rate
5. Document expected rejection rates and investigate deviations

### Detection Checklist
- [ ] Webhook rejections are logged with rejection reason
- [ ] Signature mismatch rate is monitored
- [ ] Timestamp expiration rate is monitored
- [ ] Alerts configured for rejection spikes
- [ ] Expected rejection rate documented
- [ ] No silent webhook processing failures

### Related Rules
- validate-webhook-secret-on-receive, store-webhook-secrets-securely

### Related Skills
- Set Up Spatie Webhook Client for Receiving

### Related Decision Trees
- Spatie Webhook Client vs Custom Webhook Processing

---

## 4. Re-Encoding Request Body Before Signature Verification

### Category
Implementation

### Description
Parsing the webhook request body (JSON) into an array, then re-encoding it to verify the HMAC signature. The re-encoded string may differ from the original (whitespace, key ordering, encoding differences), causing signature verification to fail on legitimate webhooks.

### Why It Happens
- Convenience: using `$request->all()` and `json_encode()` for verification
- Not knowing that JSON serialization is not deterministic
- Assuming parsed → re-encoded = original byte sequence
- Not reading that raw body verification is required
- "I parse the JSON, validate the data, then verify the signature" — wrong order

### Warning Signs
- Signature verification uses `json_encode($request->all())` or similar
- Intermittent signature verification failures (depends on whitespace/key order)
- "The signature was valid in the sender's logs but we rejected it"
- Different JSON encoding libraries (sender vs receiver) cause mismatches
- Verifying signature AFTER parsing the body

### Why Harmful
The sender signs the raw JSON body: `{"order_id":123,"event":"paid"}`. The receiver parses it into an array and re-encodes: `json_encode($data)` produces `{"event":"paid","order_id":123}` (different key ordering). The HMAC signature computed over the re-encoded body doesn't match the sender's signature. A perfectly valid webhook is rejected with 401. Debugging is confusing: "the signature was generated correctly, why doesn't it verify?"

### Consequences
- Legitimate webhooks rejected with 401 (intermittent or consistent)
- Debugging nightmare: "the signature is valid but verification fails"
- Time wasted comparing JSON encoding behavior across systems
- Trust issues: "sometimes our webhooks work, sometimes they don't"
- Increased support burden: "why are you rejecting our valid webhooks?"

### Alternative
- Always verify the signature against the raw request body:
  ```php
  $rawBody = $request->getContent(); // Raw bytes — no parsing
  $signature = $request->header('Signature');
  $computed = base64_encode(hash_hmac('sha256', $rawBody, $secret, true));
  
  if (!hash_equals($computed, $signature)) {
      abort(401, 'Invalid signature');
  }
  
  // Only AFTER verification, parse the body
  $data = json_decode($rawBody, true);
  ```
- Never parse before verification

### Refactoring Strategy
1. Audit webhook handler — are we verifying raw body or re-encoded body?
2. If re-encoding: change to raw body verification
3. Ensure `$request->getContent()` is called before any parsing
4. Test with known good payload+sender signature — verify it passes
5. Add test: verify that signature validation against raw body works consistently

### Detection Checklist
- [ ] Signature verified against raw request body (`$request->getContent()`)
- [ ] No parsing before verification
- [ ] No `json_encode($request->all())` in signature verification code
- [ ] Signature verification is consistent (no intermittent failures)
- [ ] Test verifies raw body signature matching

### Related Rules
- validate-webhook-secret-on-receive

### Related Skills
- Set Up Spatie Webhook Client for Receiving

### Related Decision Trees
- Signature Verification vs IP Whitelisting for Webhook Security

---

## 5. Processing Webhooks Synchronously in Controller

### Category
Performance

### Description
Processing the webhook payload inline in the HTTP controller instead of dispatching a queued job. The HTTP response waits for the full processing duration — if the provider has a timeout (typically 5-30 seconds), the provider retries, causing duplicate processing.

### Why It Happens
- Simplicity: processing inline avoids queue setup
- Not checking the provider's timeout expectations
- Assuming processing is always fast enough to avoid timeouts
- Not testing with realistic payloads and processing times
- "It works in development" — development doesn't have webhook timeouts

### Warning Signs
- Webhook handler processes payload directly (no job dispatch)
- Provider sends duplicate webhooks for the same event
- HTTP response time for webhook endpoint is slow (seconds)
- "We keep getting duplicate webhook calls from Stripe" — they're retrying due to timeouts
- No queue job class for webhook processing

### Why Harmful
The provider has a 10-second timeout — the handler takes 20 seconds. The provider retries after 10 seconds, creating a second job for the same event. Both jobs process, causing duplicate side effects. The provider retries because it didn't get a 200 response within its timeout window. The synchronous processing is also blocking a PHP-FPM child for 20 seconds, reducing concurrent request capacity.

### Consequences
- Duplicate processing from provider retries (timeout → retry → second execution)
- PHP-FPM pool saturation from slow webhook handlers
- Provider may mark the webhook delivery as failed (no 200 response)
- Customer impact: duplicate charges, duplicate notifications, duplicate inventory deductions
- Provider trust: "your webhook endpoint is slow"

### Alternative
- Return 200 immediately after validation, dispatch a job for processing:
  ```php
  Route::post('webhooks/stripe', function (Request $request) {
      $rawBody = $request->getContent();
      // Verify signature (fast)
      // Return 200 immediately
      ProcessStripeWebhook::dispatch($rawBody);
      return response()->json(['status' => 'ok'], 200);
  });
  ```
- Validation only in the controller (signature, timestamp) — fast enough to stay within provider timeout
- Processing in a queued job with appropriate timeout

### Refactoring Strategy
1. Audit webhook controller handlers for synchronous processing
2. Extract payload processing into a queued job class
3. Controller does: validate → dispatch job → return 200
4. Configure queue worker for webhook processing
5. Test: verify 200 response within provider timeout

### Detection Checklist
- [ ] Webhook controller returns 200 immediately (no inline processing)
- [ ] Processing dispatched as queued job
- [ ] Provider timeout respected (< 10 seconds response time)
- [ ] No duplicate webhook processing from provider retries
- [ ] Webhook processing isolated from HTTP request lifecycle

### Related Rules
- process-webhooks-asynchronously, return-200-before-processing

### Related Skills
- Set Up Spatie Webhook Client for Receiving

### Related Decision Trees
- Spatie Webhook Client vs Custom Webhook Processing
