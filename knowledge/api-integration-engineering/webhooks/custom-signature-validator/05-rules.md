# Custom Webhook Signature Validation — Rules

---

## Always Read Raw Body via getContent(), Not all()

## Category

Security

## Rule

Read the raw request body using `$request->getContent()` for HMAC signature computation; never use `$request->all()` or `$request->json()`.

## Reason

`$request->all()` and `$request->json()` parse and re-encode the JSON body, potentially altering byte order, whitespace, or key ordering. The signature was computed over the original raw bytes. Any byte difference between the raw body and the re-encoded version causes signature mismatch. `$request->getContent()` returns the exact byte sequence as received.

## Bad Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $payload = json_encode($request->all()); // Re-encoded — different bytes
    $expected = hash_hmac('sha256', $payload, $config->signingSecret);
    // Almost certainly fails due to encoding differences
}
```

## Good Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $payload = $request->getContent(); // Raw bytes as received
    $expected = hash_hmac('sha256', $payload, $config->signingSecret);
    return hash_equals($expected, $request->header($config->signatureHeaderName));
}
```

## Exceptions

Providers that explicitly sign the parsed and re-encoded JSON (documented and verified).

## Consequences Of Violation

Reliability: Valid webhooks rejected due to encoding mismatch. Debugging: Hard-to-diagnose signature failures.

---

## Use hash_equals() for All Signature Comparisons

## Category

Security

## Rule

Use PHP's `hash_equals()` for all signature comparison operations; never use `==`, `===`, or `strcmp()`.

## Reason

Standard comparison operators short-circuit on the first differing byte, making the response time proportional to how many leading characters match. An attacker can use this timing difference to determine the correct signature byte-by-byte in a timing side-channel attack. `hash_equals()` performs constant-time comparison regardless of match position.

## Bad Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $expected = hash_hmac('sha256', $request->getContent(), $config->signingSecret);
    return $expected === $request->header($config->signatureHeaderName);
    // Timing attack vulnerable
}
```

## Good Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $expected = hash_hmac('sha256', $request->getContent(), $config->signingSecret);
    return hash_equals($expected, $request->header($config->signatureHeaderName));
    // Constant-time comparison
}
```

## Exceptions

No common exceptions. Timing-safe comparison is mandatory for all cryptographic verification.

## Consequences Of Violation

Security: Timing side-channel reveals signing secret. Compliance: Cryptographic verification standard violated.

---

## Compute Signature Over the Entire Raw Body, Not a Subset

## Category

Security

## Rule

Compute the HMAC signature over the complete raw request body; never compute it over a subset or modified version of the payload.

## Reason

The provider computes the signature over the complete payload. Trimming, pretty-printing, reordering keys, or selecting specific fields produces a different byte sequence, causing signature mismatch. Every byte alteration breaks the signature.

## Bad Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $data = json_decode($request->getContent(), true);
    $subset = json_encode(['event' => $data['event'], 'id' => $data['id']]);
    $expected = hash_hmac('sha256', $subset, $config->signingSecret);
    return hash_equals($expected, $request->header(...));
    // Missing fields — signature mismatch
}
```

## Good Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $expected = hash_hmac('sha256', $request->getContent(), $config->signingSecret);
    return hash_equals($expected, $request->header($config->signatureHeaderName));
}
```

## Exceptions

Providers that document a specific subset of fields as the signed payload (rare).

## Consequences Of Violation

Reliability: All webhook signatures fail validation.

---

## Support Multiple Signatures for Key Rotation

## Category

Maintainability

## Rule

When computing the expected signature, check against all active signing secrets, not just the current one.

## Reason

During key rotation, the provider may sign webhooks with both the old and new secret simultaneously. If your validator only checks the new secret, webhooks signed with the old secret are rejected. Checking multiple secrets enables zero-downtime rotation where both old and new signatures are accepted during the transition period.

## Bad Example

```php
public function isValid(Request $request, WebpackConfig $config): bool
{
    $expected = hash_hmac('sha256', $request->getContent(), $config->signingSecret);
    return hash_equals($expected, $request->header($config->signatureHeaderName));
    // Only checks current secret — rejects old-signature webhooks during rotation
}
```

## Good Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $signatureHeader = $request->header($config->signatureHeaderName);

    foreach ($this->getActiveSecrets($config->name) as $secret) {
        $expected = hash_hmac('sha256', $request->getContent(), $secret);
        if (hash_equals($expected, $signatureHeader)) {
            return true;
        }
    }
    return false;
}

private function getActiveSecrets(string $provider): array
{
    return [
        config("webhook-client.configs.$provider.signing_secret"),
        config("webhook-client.configs.$provider.previous_signing_secret"),
    ];
}
```

## Exceptions

Providers that announce key rotations in advance and enforce a cutover deadline.

## Consequences Of Violation

Reliability: Webhooks rejected during rotation window. Maintainability: Manual rotation coordination required.

---

## Include Timestamp Check for Replay Prevention

## Category

Security

## Rule

Combine signature validation with a timestamp tolerance check to prevent replay attacks; never rely on signature verification alone.

## Reason

Signature verification confirms the payload is authentic, but does not prevent an attacker from replaying a captured payload later. A timestamp tolerance window rejects webhooks whose timestamp falls outside the acceptable range, limiting the replay window to the tolerance duration.

## Bad Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $expected = hash_hmac('sha256', $request->getContent(), $config->signingSecret);
    return hash_equals($expected, $request->header($config->signatureHeaderName));
    // No timestamp check — replayed payloads accepted indefinitely
}
```

## Good Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $timestamp = $request->header('webhook-timestamp');
    if ($timestamp === null || abs((int) $timestamp - time()) > 300) {
        Log::warning('Expired webhook timestamp', ['ip' => $request->ip()]);
        return false;
    }

    $expected = hash_hmac('sha256', $request->getContent(), $config->signingSecret);
    return hash_equals($expected, $request->header($config->signatureHeaderName));
}
```

## Exceptions

Providers that do not include a timestamp in their webhook headers.

## Consequences Of Violation

Security: Replay attacks succeed. Compliance: Replay prevention requirement violated.

---

## Log Failed Signature Attempts for Monitoring

## Category

Observability

## Rule

Log every failed signature validation attempt with request metadata (IP, provider, header names) for security monitoring.

## Reason

Failed signatures indicate either configuration errors (debuggable and fixable) or active forgery attempts (security incident). Without logging, misconfigurations go undetected until delivery complaints arise, and attacks proceed without visibility.

## Bad Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $expected = hash_hmac('sha256', $request->getContent(), $config->signingSecret);
    return hash_equals($expected, $request->header($config->signatureHeaderName));
    // Silent failure — no log
}
```

## Good Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $expected = hash_hmac('sha256', $request->getContent(), $config->signingSecret);
    $valid = hash_equals($expected, $request->header($config->signatureHeaderName));

    if (!$valid) {
        Log::warning('Webhook signature validation failed', [
            'provider' => $config->name,
            'ip' => $request->ip(),
            'signature_header' => $config->signatureHeaderName,
        ]);
        Metrics::increment('webhook.signature_failed', ['provider' => $config->name]);
    }

    return $valid;
}
```

## Exceptions

No common exceptions.

## Consequences Of Violation

Debugging: Undetected configuration errors. Security: Undetected forgery attempts. Compliance: Missing audit trail for security events.

---

## Fetch Secrets from Configuration or Vault, Never Hardcode

## Category

Security

## Rule

Load all signing secrets from environment configuration, encrypted storage, or a secrets vault; never hardcode secrets in validator class source code.

## Reason

Hardcoded secrets are committed to version control, accessible to all developers with repository access, and cannot be rotated without code changes and deployment. Environment variables and vaults keep secrets outside the codebase and enable per-environment values.

## Bad Example

```php
class StripeSignatureValidator implements SignatureValidator
{
    private string $secret = 'whsec_abc123def456'; // Hardcoded

    public function isValid(Request $request, WebhookConfig $config): bool
    {
        // Uses hardcoded secret
    }
}
```

## Good Example

```php
class StripeSignatureValidator implements SignatureValidator
{
    public function isValid(Request $request, WebhookConfig $config): bool
    {
        $secret = config('webhook-client.configs.stripe.signing_secret');
        $expected = hash_hmac('sha256', $request->getContent(), $secret);
        return hash_equals($expected, $request->header($config->signatureHeaderName));
    }
}
```

## Exceptions

Ephemeral local development environments with throwaway test secrets.

## Consequences Of Violation

Security: Secrets exposed in version control. Maintainability: Deployment required for secret rotation. Compliance: Secret management violation.
