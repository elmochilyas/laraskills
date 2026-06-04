# Skill: Prevent Webhook Replay Attacks

## Purpose
Implement timestamp-based freshness checks and HMAC signing of the concatenated timestamp+payload to prevent intercepted webhooks from being replayed.

## When To Use
Any webhook receiver exposed to the public internet; any webhook carrying financial, authentication, or state-changing operations; compliance-required replay protection.

## When NOT To Use
VPC-internal webhooks with no replay risk; development/staging environments; webhooks idempotent by design (safe to replay at the application level).

## Prerequisites
- Shared secret between sender and receiver
- Clock synchronization (NTP) on both sides

## Inputs
- Timestamp tolerance window (typically 5 minutes)
- Nonce generation (optional, for additional deduplication)

## Workflow
1. Sender: include `Timestamp` (Unix epoch) and `Nonce` (random string) in the payload
2. Sender: sign `timestamp + nonce + payload_body` with HMAC-SHA256 using the shared secret
3. Sender: send `Signature` header (HMAC output) with the webhook request
4. Receiver: extract timestamp from request, compute `|now - timestamp|`
5. If `|now - timestamp| > tolerance` (5 min): reject with 401
6. Receiver: recompute HMAC from timestamp + nonce + payload using shared secret
7. If HMAC doesn't match: reject with 401
8. Implement nonce deduplication: track used nonces in cache (optional, defense-in-depth)

## Validation Checklist
- [ ] Sender includes `Timestamp` in payload
- [ ] HMAC covers `timestamp + nonce + payload_body` (not payload alone)
- [ ] Receiver checks `|now - timestamp| < tolerance` (5 min)
- [ ] Receiver recomputes and validates HMAC
- [ ] Nonce deduplication implemented (optional)
- [ ] NTP enabled on both sides (clock skew)
- [ ] Shared secret stored in env vars, not source code
- [ ] Rejected requests logged for monitoring

## Common Failures
- Signing payload without timestamp — static signature, replayable indefinitely
- No timestamp check on receiver — any age payload accepted
- Timestamp tolerance too high (>15 min) — replay window too large
- Clock skew between sender and receiver — valid requests rejected
- No nonce — same payload within tolerance window can still be replayed

## Decision Points
- Low risk: HMAC + timestamp only (basic replay protection)
- High risk: HMAC + timestamp + nonce with dedup (defense-in-depth)
- Idempotent receiver: nonce dedup may be unnecessary

## Related Rules
- Rule 1: use-timestamped-nonce-in-signature
- Rule 2: reject-expired-timestamps
- Rule 3: validate-hmac-on-every-request
- Rule 4: implement-nonce-dedup-for-defense-in-depth

## Related Skills
- Configure Spatie Webhook Server for Certified Delivery
- Set Up Spatie Webhook Client for Receiving
- Implement Idempotency for Side-Effect Jobs

## Success Criteria
Webhook requests include timestamped nonces signed in the HMAC, receivers reject expired requests and validate signatures, and duplicate requests beyond the freshness window are blocked.
