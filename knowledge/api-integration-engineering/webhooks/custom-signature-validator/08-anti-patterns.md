# ECC Anti-Patterns — Custom Webhook Signature Validation

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 03-webhooks |
| **Knowledge Unit** | Custom Webhook Signature Validation |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. Signature Over Parsed Body (Re-encoding Mismatch)
2. Non-Constant-Time Comparison (Timing Side-Channel)
3. Signature Over Payload Subset (Truncation Mismatch)
4. Single Secret Validation During Key Rotation
5. No Timestamp Replay Protection
6. Hardcoded Secrets in Source Code

## Repository-Wide Anti-Patterns

- Hidden Configuration
- Security Theater

---

## Anti-Pattern 1: Signature Over Parsed Body (Re-encoding Mismatch)

### Category
Security | Reliability

### Description
Computing the expected HMAC signature over `$request->all()` or `$request->json()` instead of `$request->getContent()`. The re-encoded JSON may differ from the original raw body bytes.

### Why It Happens
`$request->all()` is the most accessible way to get request data. Developers don't consider that JSON encoding is non-deterministic across systems (key ordering, whitespace).

### Warning Signs
- `$request->all()`, `$request->json()`, or `json_encode($request->all())` in signature validation
- Intermittent signature failures (some providers pass, some fail)
- Webhook failures that resolve on retry

### Why It Is Harmful
PHP parses the raw body into an array/structure. When re-encoded with `json_encode()`, the output may differ from the original: key ordering changes, whitespace is normalized, unicode escapes differ. The computed HMAC will not match the provider's signature over the original bytes.

### Real-World Consequences
A Stripe webhook contains `{"id":"evt_123","object":"event"}` with whitespace. `$request->all()` decodes this. `json_encode()` outputs `{"id":"evt_123","object":"event"}` with different whitespace. Signature mismatch. Valid Stripe webhooks are rejected. Stripe retries 3 times then drops. The application misses critical payment events.

### Preferred Alternative
Use `$request->getContent()` to get the exact raw body bytes for signature computation.

### Refactoring Strategy
1. Replace all `$request->all()` / `$request->json()` usage with `$request->getContent()`
2. Test against recorded real webhook payloads
3. Verify with known-good provider test tools

### Related Rules
Always Read Raw Body via getContent(), Not all() (05-rules.md)

### Related Skills
Implement Custom Webhook Signature Validation Middleware (06-skills.md)

---

## Anti-Pattern 2: Non-Constant-Time Comparison (Timing Side-Channel)

### Category
Security

### Description
Using `==`, `===`, or `strcmp()` to compare the computed signature with the received signature header. These operators short-circuit on the first differing byte.

### Why It Happens
`===` is the standard PHP comparison operator. Developers don't know about timing attacks or `hash_equals()`.

### Warning Signs
- `$expected === $received` in signature validation
- No `hash_equals()` usage

### Why It Is Harmful
The comparison time is proportional to the number of matching prefix bytes. An attacker can send crafted signatures and measure response times to determine the correct signature byte-by-byte. With ~256 attempts per byte, the full signing secret can be recovered.

### Real-World Consequences
An attacker sends 256 signatures with a single differing first byte. One returns slightly slower (byte matched, proceeding to compare second byte). After ~4000 requests, the attacker recovers the full signature. They can now forge any webhook event.

### Preferred Alternative
Use `hash_equals()` for constant-time comparison.

### Refactoring Strategy
1. Replace `===` / `==` with `hash_equals($expected, $received)`
2. Ensure both arguments are strings of equal length
3. Add test confirming invalid signatures return false

### Related Rules
Use hash_equals() for All Signature Comparisons (05-rules.md)

---

## Anti-Pattern 3: Signature Over Payload Subset (Truncation Mismatch)

### Category
Reliability | Security

### Description
Selecting only specific fields from the payload before computing the HMAC, instead of using the complete raw body.

### Why It Happens
A developer thinks "I only need to verify these fields are authentic." They extract and re-encode a subset.

### Warning Signs
- `json_decode()` then selective field extraction before HMAC
- Signature computed over `$data['event'] . $data['id']` concatenation

### Why It Is Harmful
The provider computes the HMAC over the entire payload. Any byte difference between the subset and the original causes signature mismatch. Additionally, fields not in the subset are not authenticated — an attacker could modify them without detection.

### Preferred Alternative
Compute the HMAC over the complete raw body via `$request->getContent()`.

### Refactoring Strategy
1. Remove field selection logic from signature computation
2. Use `$request->getContent()` directly in HMAC input
3. Let field selection happen after signature validation

### Related Rules
Compute Signature Over the Entire Raw Body, Not a Subset (05-rules.md)

---

## Anti-Pattern 4: Single Secret Validation During Key Rotation

### Category
Maintainability | Reliability

### Description
Only checking the current signing secret during validation. Webhooks signed with the old secret during key rotation are rejected.

### Why It Happens
Developers assume one secret is always active. Rotations are manual and assumed to happen instantly.

### Warning Signs
- Validation checks only one secret
- Webhook failures spike during provider key rotations
- Provider documentation mentions key rotation support

### Why It Is Harmful
During key rotation, the provider may sign webhooks with both old and new keys simultaneously. Validator only checks the new key → old-key signed webhooks are rejected. These are legitimate events. The provider retries, but if all retries are before the key fully rolls out, the event is permanently lost.

### Preferred Alternative
Validate against all active secrets (old and new during rotation window).

### Refactoring Strategy
1. Store secrets as an array (current + previous)
2. Iterate over all secrets until one matches
3. Remove old secret after rotation window expires

### Related Rules
Support Multiple Signatures for Key Rotation (05-rules.md)

---

## Anti-Pattern 5: No Timestamp Replay Protection

### Category
Security

### Description
Validating the HMAC signature without checking a timestamp tolerance window. Captured webhook payloads can be replayed indefinitely.

### Why It Happens
Developers consider signature verification sufficient. The replay attack vector is not obvious.

### Warning Signs
- No timestamp extraction from webhook headers
- No `abs($timestamp - time()) > $tolerance` check

### Why It Is Harmful
An attacker intercepts a valid webhook payload (e.g., `payment_intent.succeeded`). They can replay this payload to your endpoint at any future time. Each replay credits a fake payment. Without timestamp checking, the endpoint cannot distinguish a fresh delivery from a replayed one.

### Preferred Alternative
Implement a timestamp tolerance check (typically 5 minutes).

### Refactoring Strategy
1. Extract timestamp from provider header
2. Calculate `abs($timestamp - time())`
3. Reject if tolerance exceeded
4. Optionally implement nonce tracking for stronger protection

### Related Rules
Include Timestamp Check for Replay Prevention (05-rules.md)

---

## Anti-Pattern 6: Hardcoded Secrets in Source Code

### Category
Security | Compliance

### Description
Embedding the webhook signing secret directly in the validator class source code.

### Why It Happens
Quick development: "I'll put it here for now and extract it later." Later never comes.

### Warning Signs
- `private string $secret = 'whsec_...'` in validator class
- Secrets committed to version control

### Why It Is Harmful
The secret is in git history for every developer with repo access. Rotating requires a code change and deployment. If the repository is compromised (leaked, former employee access), the secret must be considered exposed.

### Preferred Alternative
Load secrets from `.env` or a vault.

### Refactoring Strategy
1. Remove hardcoded secrets from source
2. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`
3. Access via `config('services.stripe.webhook_secret')`
4. Rotate by changing `.env`, no code deploy needed

### Related Rules
Fetch Secrets from Configuration or Vault, Never Hardcode (05-rules.md)
