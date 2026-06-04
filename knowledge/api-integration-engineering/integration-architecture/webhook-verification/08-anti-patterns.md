# Anti-Patterns: Webhook Verification (Event Sourcing)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | event-sourcing-integrations |
| Knowledge Unit | Webhook Verification |
| Difficulty | Expert |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Verification Returning Boolean Instead of Emitting Events | Architecture | High |
| 2 | Storing Secrets or Full Signatures in Verification Events | Security | Critical |
| 3 | Silently Skipping Verification for "Internal" Webhooks | Security | Critical |
| 4 | Not Recording Replay Detection Events | Security | High |
| 5 | No Verification Failure Metrics or Alerting | Observability | Medium |

---

## Anti-Pattern 1: Verification Returning Boolean Instead of Emitting Events

### Category
Architecture

### Description
Implementing webhook signature verification as a function that returns a boolean (pass/fail) instead of emitting structured domain events that record the verification outcome.

### Why It Happens
Simple verification logic returns `true` or `false`. Developers apply this pattern without considering that verification outcomes are significant security events that should be auditable and queryable.

### Warning Signs
- Verification function returns `bool` or throws exceptions
- No events are emitted for verification success or failure
- Audit trail of verification attempts relies on log files, not the event store
- Security analysis requires parsing application logs instead of querying events
- Verification failures cannot be correlated with other events in the system

### Why Harmful
Boolean verification loses critical metadata: which signature version was used, what timestamp tolerance was applied, what header values were received (redacted). This information is essential for security monitoring, post-incident forensics, and compliance audits.

### Real-World Consequences
- Security incident: attacker sends forged webhooks; boolean verification correctly rejects them
- Post-incident analysis: "How many forged webhooks arrived? Over what time period?"
- Answer requires parsing application logs, which may have been rotated or lost detail
- Event store has no record of the attack; cannot correlate with other security events
- Compliance audit: "Show all verification failures for the last 6 months" — cannot answer

### Preferred Alternative
Emit structured verification events for every outcome: `WebhookSignatureValidated` or `WebhookSignatureInvalid`. Include verification metadata without secrets.

```php
// Instead of returning bool
class SignatureVerifier {
    public function verify(string $payload, array $headers, string $secret): void {
        $signatureHeader = $headers['webhook-signature'] ?? '';
        $timestamp = (int) ($headers['webhook-timestamp'] ?? 0);
        $webhookId = $headers['webhook-id'] ?? '';
        
        $isValid = $this->cryptoVerify($payload, $signatureHeader, $secret);
        
        if ($isValid) {
            event(new WebhookSignatureValidated(
                webhookId: $webhookId,
                signatureVersion: $this->extractVersion($signatureHeader),
                timestampTolerance: 300,
                verifiedAt: now(),
            ));
        } else {
            event(new WebhookSignatureInvalid(
                webhookId: $webhookId,
                reason: 'signature_mismatch',
                signatureVersion: $this->extractVersion($signatureHeader),
                headerValues: $this->redactHeaders($headers),
                verifiedAt: now(),
            ));
        }
    }
}
```

### Refactoring Strategy
1. Replace boolean return values with event emission
2. Define `WebhookSignatureValidated` and `WebhookSignatureInvalid` event classes
3. Include verification metadata (version, timestamp tolerance, provider) in events
4. Create projectors that track verification rates and failure patterns
5. Update all verification callers to expect event emission instead of return values

### Detection Checklist
- [ ] Verification success emits a validated event
- [ ] Verification failure emits an invalid event with reason
- [ ] Verification metadata (version, timestamp, tolerance) is included
- [ ] No secrets or full signatures are stored in events
- [ ] Projectors track verification rates from events

### Related Rules/Skills/Trees
- Rule: Verification validators emit events rather than returning booleans
- Rule: Record verification event BEFORE storing the webhook payload (fail-fast)
- Related KU: Event sourcing for security auditing

---

## Anti-Pattern 2: Storing Secrets or Full Signatures in Verification Events

### Category
Security

### Description
Including sensitive data (webhook signing secrets, full signature header values, or raw HMAC keys) in verification events that are stored in the event store.

### Why Happens
Capturing all verification context for audit purposes leads developers to store the full signature header or even the secret used for verification. The event store, being a database table, feels like a safe place.

### Warning Signs
- Verification events include fields like `signing_secret`, `secret_key`, or `hmac_key`
- Full `webhook-signature` header value (including the signature itself) is stored
- Security audit flags event store as containing secrets
- Anyone with database read access can see webhook signing secrets
- Secret rotation requires purging event store records

### Why Harmful
The event store is append-only and long-lived. Secrets stored in events are exposed to anyone with database access (developers, DBAs, support tools). They cannot be rotated out without breaking the event store's immutability. Signature values, while not secrets themselves, can help attackers craft valid signatures if combined with other information.

### Real-World Consequences
- Developer with read-only database access can extract all webhook signing secrets from events
- Security audit discovers secrets in event store; compliance violation
- Secret rotation does not invalidate old events (secrets still present in historical records)
- Attacker who gains database read access (SQL injection) can forge webhooks
- Legal: secrets stored for years in event store multiply breach impact

### Preferred Alternative
Include only metadata and redacted identifiers in verification events. Never store secrets, full signatures, or the raw secret key.

```php
class WebhookSignatureInvalid {
    public function __construct(
        public readonly string $webhookId,
        public readonly string $reason,          // 'signature_mismatch', 'timestamp_expired'
        public readonly string $signatureVersion, // 'v1' or 'v1a'
        public readonly string $keyFingerprint,   // sha256(substr(secret, 0, 8)) — not the key itself
        public readonly int $timestampTolerance,
        public readonly Carbon $verifiedAt,
    ) {}
    
    // NEVER include: secret, full signature, raw signature header
}
```

### Refactoring Strategy
1. Audit all verification events for sensitive data (secrets, full signatures, raw headers)
2. Remove secrets and replace with key fingerprints or version identifiers
3. Redact signature headers to version + prefix only
4. Add data retention policy that purges old events that may contain sensitive data
5. Verify event store backup does not contain secrets

### Detection Checklist
- [ ] No signing secrets are stored in verification events
- [ ] No full signature values are stored (only version + prefix)
- [ ] Key fingerprints replace raw secret storage
- [ ] Redacted header values only include non-sensitive metadata
- [ ] Event store can be freely read without exposing secrets

### Related Rules/Skills/Trees
- Rule: Never store secrets or full signature values in verification events
- Rule: Include verification metadata: signature version, timestamp tolerance, provider
- Related KU: Security event monitoring (SIEM integration)

---

## Anti-Pattern 3: Silently Skipping Verification for "Internal" Webhooks

### Category
Security

### Description
Bypassing signature verification for webhooks that come from "internal" or "trusted" sources (same network, same service, internal IP range), assuming they are inherently safe.

### Why It Happens
Internal network traffic is assumed to be secure. Developers add conditional logic that skips verification based on source IP, internal header, or network range.

### Warning Signs
- Verification code has `if (isInternalIp($request->ip())) { return true; }` or similar bypass
- Internal webhook routes have no signature verification middleware
- Internal headers like `X-Internal: true` bypass verification
- Network-based trust replaces cryptographic verification
- No documentation of which webhooks are "internal" and why they're trusted

### Why Harmful
Network boundaries are not security boundaries. A compromised internal service, an attacker who gains network access (via VPN, compromised container, or SSRF), or a misconfigured network policy can send forged webhooks. Internal-only verification bypass creates a gap that is invisible to security monitoring.

### Real-World Consequences
- Attacker exploits SSRF vulnerability in another service to POST fake webhooks to internal endpoint
- Internal endpoint skips verification because source IP is internal
- Fake webhooks processed as legitimate; attacker triggers unauthorized operations
- Security team cannot detect the attack: verification bypass means no verification failure events
- Post-incident audit reveals the bypass; "why did we skip verification for internal traffic?"

### Preferred Alternative
Verify signatures for ALL webhooks regardless of source. If the webhook comes from a trusted internal source, it should still have a valid signature. If the source doesn't support signatures, the webhook should not bypass verification — it should use a different auth mechanism (API key, mTLS) that is also logged as events.

```php
// Wrong: silent bypass
class WebhookMiddleware {
    public function handle(Request $request, Closure $next): Response {
        if ($request->ip() === '127.0.0.1') {
            return $next($request); // Bypass — no verification, no event
        }
        $this->verifySignature($request);
        return $next($request);
    }
}

// Correct: verify everything
class WebhookMiddleware {
    public function handle(Request $request, Closure $next): Response {
        $authMethod = $request->header('X-Auth-Method', 'signature');
        
        match ($authMethod) {
            'signature' => $this->verifySignature($request),
            'api_key' => $this->verifyApiKey($request),
            'mtls' => $this->verifyClientCert($request),
            default => throw new UnauthenticatedException(),
        };
        
        return $next($request);
    }
}
```

### Refactoring Strategy
1. Remove all conditional verification bypasses
2. Ensure every webhook endpoint has a verification mechanism
3. Use alternative auth (API key, mTLS, internal token) for internal webhooks, not bypass
4. Emit verification events for all auth methods, not just signatures
5. Monitor for webhooks that arrive without any verification credential

### Detection Checklist
- [ ] Every webhook endpoint enforces some verification mechanism
- [ ] No network-based bypass (internal IP, same service) exists
- [ ] Internal webhooks use alternative auth (API key, mTLS) with events
- [ ] Verification events are emitted for all webhooks, regardless of source
- [ ] Webhooks without verification credentials are rejected

### Related Rules/Skills/Trees
- Rule: Verification outcomes recorded as immutable events
- Rule: Failed verification events trigger security alerting
- Related KU: Replay Attack Prevention (verification bypass risks)

---

## Anti-Pattern 4: Not Recording Replay Detection Events

### Category
Security

### Description
Detecting replay attacks (duplicate webhook IDs, expired timestamps) but not recording them as events in the event store, so replay attack patterns are invisible to security monitoring.

### Why Happens
Replay detection logic (checking `webhook-id` uniqueness, validating `webhook-timestamp`) is implemented as early-exit conditions. When detected, the webhook is rejected silently without recording the event.

### Warning Signs
- Replay detection returns HTTP 401 without emitting any event
- No event type exists for "replay attempt detected"
- Security team cannot query how many replay attempts were detected
- Duplicate webhook IDs are silently ignored without trace
- Expired timestamps result in generic "verification failed" with no specific replay indicator

### Why Harmful
Replay attacks are a specific security concern: an attacker intercepts a legitimate webhook and re-sends it. Without replay detection events, these attacks are invisible. A high rate of replay attempts indicates an active attack, but without events, there's no data to alert on.

### Real-World Consequences
- Attacker intercepts a payment webhook and replays it 1,000 times
- Each replay is correctly rejected by the idempotency check
- No events are recorded for any replay attempt
- Security monitoring shows no anomalies
- Attacker can probe the system indefinitely without detection
- Post-incident: "We had no idea we were being probed for 3 weeks"

### Preferred Alternative
Record a `ReplayAttackDetected` event (or equivalent) every time a duplicate webhook ID or expired timestamp is detected. Include the webhook ID and timestamp difference.

```php
class ReplayAttackDetected {
    public function __construct(
        public readonly string $webhookId,
        public readonly string $reason,          // 'duplicate_id' or 'expired_timestamp'
        public readonly int $timestampDiff,      // seconds
        public readonly string $provider,
        public readonly string $sourceIp,        // For threat intelligence
    ) {}
}

// In idempotency check
public function checkIdempotency(string $provider, string $webhookId): bool {
    if ($this->idempotencyStore->has($provider, $webhookId)) {
        event(new ReplayAttackDetected(
            webhookId: $webhookId,
            reason: 'duplicate_id',
            timestampDiff: 0,
            provider: $provider,
            sourceIp: request()->ip(),
        ));
        return false; // Reject
    }
    return true;
}
```

### Refactoring Strategy
1. Add `ReplayAttackDetected` event type
2. Emit event whenever duplicate webhook ID or expired timestamp is detected
3. Include source IP and timestamp difference for threat analysis
4. Create reactor that alerts on high replay attempt rates
5. Add projector tracking replay attempts per provider and source IP

### Detection Checklist
- [ ] Replay detection emits structured events (not silent rejections)
- [ ] Required fields: webhook ID, reason, timestamp diff, source IP, provider
- [ ] Alerting exists for high replay attempt rates
- [ ] Projector tracks replay attempts per source IP and provider
- [ ] Security monitoring can query replay detection events

### Related Rules/Skills/Trees
- Rule: Replay detection events records when duplicate webhook ID or expired timestamp detected
- Rule: Failed verification events trigger security alerting
- Related KU: Replay Attack Prevention (detection patterns)

---

## Anti-Pattern 5: No Verification Failure Metrics or Alerting

### Category
Observability

### Description
Not monitoring webhook verification failure rates, so an increase in failures (indicating an attack, configuration error, or provider change) goes undetected.

### Why Happens
Verification failures are handled as individual events (HTTP 401). Teams monitor application errors but don't specifically track verification failure rates as a security metric.

### Warning Signs
- No dashboard showing verification success/failure rates
- No alerting on verification failure rate exceeding baseline
- Verification failures are buried in general application error logs
- No baseline for "normal" verification failure rate per provider
- Provider signature format change goes unnoticed for days

### Why Harmful
Verification failures have multiple causes: attack (forged signatures), misconfiguration (wrong secret), provider change (signature format updated), or clock drift (timestamp tolerance). Without monitoring, all of these are invisible until a significant number of legitimate webhooks are rejected or an attack succeeds.

### Real-World Consequences
- Stripe changes signature format version; verification drops to 0% success
- 10,000 payment webhooks rejected over 4 hours before anyone notices
- Provider support ticket and emergency configuration change required
- Revenue impact: 10,000 payments not processed
- Customer complaints overwhelm support team
- "Why didn't our monitoring catch this?" — because verification wasn't monitored

### Preferred Alternative
Track verification success and failure rates as metrics. Set up alerting on failure rate deviations from baseline. Create a projector that reads verification events for real-time monitoring.

```php
class VerificationMonitor {
    public function onWebhookSignatureValidated(WebhookSignatureValidated $event): void {
        Monitor::increment('webhook.verification.success', ['provider' => $event->provider]);
    }
    
    public function onWebhookSignatureInvalid(WebhookSignatureInvalid $event): void {
        Monitor::increment('webhook.verification.failure', [
            'provider' => $event->provider,
            'reason' => $event->reason,
        ]);
        
        // Alert on failure rate (tracked as gauge, evaluated per minute)
        $failureRate = Monitor::gauge('webhook.verification.failure_rate');
        if ($failureRate > 0.05) { // >5% failure rate
            Notification::alert('webhook.verification.failure_rate_high', [
                'rate' => $failureRate,
                'provider' => $event->provider,
            ]);
        }
    }
}
```

### Refactoring Strategy
1. Add verification success/failure metrics from verification events
2. Establish baseline failure rate per provider (normal operation)
3. Set alert thresholds: >2x baseline or absolute threshold (e.g., >5%)
4. Create dashboard showing verification health per provider
5. Add reactor that sends critical alerts on complete verification failure (100% failure rate)

### Detection Checklist
- [ ] Verification success and failure rates are monitored
- [ ] Alerting exists for failure rate exceeding baseline
- [ ] Per-provider verification health is visible on dashboard
- [ ] Signature format changes trigger detectable verification failure increase
- [ ] Clock drift issues are detectable from timestamp failure patterns

### Related Rules/Skills/Trees
- Rule: Projector tracks verification failure rates per provider
- Rule: Failed verification events trigger security alerting
- Related KU: Integration Health Checks (verification reliability metrics)
