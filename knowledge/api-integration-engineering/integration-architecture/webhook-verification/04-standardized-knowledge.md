# ECC Standardized Knowledge — Webhook Verification (Event Sourcing)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | event-sourcing-integrations |
| Knowledge Unit ID | ku-02 |
| Knowledge Unit | Webhook Verification |
| Difficulty | Expert |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K034, K003, K021, K022 |

## Overview (Engineering Value)
In an event-sourced architecture, webhook verification is recorded as a domain event in the event store, providing an immutable audit trail of every verification attempt — successful and failed. This enables security monitoring (detecting attack patterns from verification failures), replay of verification logic against historical payloads, and temporal querying of verification state. Each verification result (signature valid, replay detected, timestamp expired) becomes a structured event in the event stream.

## Core Concepts
- **Verification Event**: Immutable record of signature verification outcome, timestamp, and provider identity
- **Signature Validation Event**: `WebhookSignatureValidated` or `WebhookSignatureInvalid` as domain events
- **Replay Detection Event**: Records when a duplicate webhook ID or expired timestamp is detected
- **Verification Projector**: Read model showing current verification status and failure patterns per provider
- **Temporal Verification Queries**: "Show all verification failures between dates for provider X"

## When To Use
- Security-critical webhook integrations requiring intrusion detection
- Compliance-mandated audit trails of all security decisions
- Post-incident forensics on webhook verification failures
- Multiple verification stages (signature + timestamp + nonce) that benefit from event traces

## When NOT To Use
- Simple HMAC verification with no audit requirements beyond standard logging
- Low-security internal webhooks where verification record is unnecessary

## Best Practices
- Record verification event BEFORE storing the webhook payload (fail-fast on invalid signatures)
- Include verification metadata: signature version, timestamp tolerance, provider, header values (redacted)
- Use projectors to surface verification failure rates per provider for monitoring
- Never store secrets or full signature values in verification events

## Architecture Guidelines
- Verification validators emit events rather than returning booleans
- Event sourcing projector tracks verification health metrics
- Failed verification events trigger security alerting reactors
- Combine with custom SignatureValidator (Spatie) for provider-specific verification
- Store raw body hash in verification event for integrity audit

## Performance Considerations
- Verification events add ~5ms to the verification path
- Projector updates for verification metrics run asynchronously
- Event store queries for forensic analysis are infrequent; no production impact

## Related Topics
- **Prerequisites**: Event sourcing basics, HMAC-SHA256 signing
- **Closely Related**: Webhook receiving (ku-01), inbox pattern (ku-05), replay attack prevention
- **Advanced**: Anomaly detection on verification failure patterns
- **Cross-Domain**: Security event monitoring, SIEM integration

## Verification
- [ ] Verification outcomes recorded as immutable events
- [ ] Failed verification events trigger security alerting
- [ ] Projector tracks verification failure rates per provider
- [ ] No sensitive data (secrets, full signatures) in verification events
- [ ] Replay of verification events produces identical results
