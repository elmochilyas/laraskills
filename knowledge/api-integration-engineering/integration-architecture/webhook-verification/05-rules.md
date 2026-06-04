## Record Verification Event Before Processing
---
## Category
Reliability
---
## Rule
Record the verification outcome event (valid/invalid) in the event store before storing the webhook payload or proceeding to processing.
---
## Reason
Pre-recording ensures the verification result is captured even if the subsequent processing fails; lost verification events create security audit gaps.
---
## Bad Example
```php
// Processes first — verification result not recorded
$this->process($payload);
```
---
## Good Example
```php
$verification = Event::record(new WebhookSignatureValidated([
    'provider' => 'stripe',
    'result' => $isValid,
    'timestamp_tolerance' => 300,
]));
if (!$isValid) {
    Event::record(new WebhookSignatureInvalid(['reason' => 'signature_mismatch']));
    return response('Invalid signature', 403);
}
```
---
## Exceptions
Non-critical webhooks where security audit trail is not required.
---
## Consequences Of Violation
Verification audit trail lost on crash, security incident forensics impossible, compliance gaps.
## Include Verification Metadata, Not Secrets
---
## Category
Security
---
## Rule
Record signature version, timestamp tolerance, and provider in verification events; never store secrets, full signatures, or raw tokens.
---
## Reason
Verification events persist indefinitely; storing secrets creates a credential leak risk.
---
## Bad Example
```php
Event::record(new WebhookSignatureValidated([
    'signature' => $request->header('Stripe-Signature'), // stores full signature — unnecessary
    'secret' => 'whsec_...', // stores secret — credential leak
]));
```
---
## Good Example
```php
Event::record(new WebhookSignatureValidated([
    'provider' => 'stripe',
    'signature_version' => 'v1',
    'timestamp_tolerance' => 300,
    'result' => 'valid',
    'body_hash' => hash('sha256', $payload),
]));
```
---
## Exceptions
None — never store secrets in verification events.
---
## Consequences Of Violation
Credential leak from event store, compliance violation (storing secrets in append-only log), security incident on database breach.
## Use Projectors for Verification Failure Monitoring
---
## Category
Observability
---
## Rule
Build projectors that surface verification failure rates per provider for real-time monitoring.
---
## Reason
Raw verification events are too granular for monitoring; projectors provide aggregate failure rates that drive alerting.
---
## Bad Example
```php
// Querying raw events for failure rate — slow and complex
```
---
## Good Example
```php
class VerificationHealthProjector extends Projector {
    public function onWebhookSignatureInvalid(WebhookSignatureInvalid $event): void {
        VerificationMetrics::incrementFailures($event->provider);
    }
    public function onWebhookSignatureValidated(WebhookSignatureValidated $event): void {
        VerificationMetrics::incrementSuccess($event->provider);
    }
}
```
---
## Exceptions
Low-security integrations where projector overhead isn't justified.
---
## Consequences Of Violation
Difficulty monitoring verification health, slow detection of attack patterns, delayed incident response.
## Trigger Security Alerting on Failed Verification
---
## Category
Security
---
## Rule
React to `WebhookSignatureInvalid` events with security alerts (PagerDuty, Slack, email).
---
## Reason
Signature validation failures may indicate replay attacks, tampered payloads, or misconfiguration — all requiring immediate investigation.
---
## Bad Example
```php
// Failed verification silently logged — investigation only after incident
```
---
## Good Example
```php
Event::listen(WebhookSignatureInvalid::class, function ($event) {
    Log::warning('Webhook signature validation failed', $event->toArray());
    if ($this->exceedsThreshold($event->provider)) {
        Alert::critical("Multiple webhook verification failures from {$event->provider}");
    }
});
```
---
## Exceptions
Known transient verification issues with documented root cause.
---
## Consequences Of Violation
Security incidents undetected, replay attacks succeed, delayed incident response to webhook tampering.
## Ensure Replay Produces Identical Results
---
## Category
Testing
---
## Rule
Write tests that replay verification events through projectors and assert identical results to original processing.
---
## Reason
If replay produces different verification results, the audit trail is unreliable and forensics are impossible.
---
## Bad Example
```php
// No replay test — verification projectors may diverge
```
---
## Good Example
```php
public function test_verification_replay_produces_identical_results()
{
    $original = VerificationMetrics::getForProvider('stripe');
    Projector::rebuild(VerificationHealthProjector::class);
    $replayed = VerificationMetrics::getForProvider('stripe');
    $this->assertEquals($original->failure_count, $replayed->failure_count);
}
```
---
## Exceptions
None — always test verification replay.
---
## Consequences Of Violation
Unreliable audit trail, forensic analysis produces wrong results, compliance violations for tampered audit data.
