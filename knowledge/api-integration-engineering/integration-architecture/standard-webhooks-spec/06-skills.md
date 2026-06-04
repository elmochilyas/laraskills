# Skill: Implement the Standard Webhooks Specification

## Purpose
Adopt the Standard Webhooks specification for sending and receiving webhooks, providing a consistent, interoperable format with signing, retry, and idempotency built in.

## When To Use
- Building webhook sender or receiver that should be interoperable
- Standardizing webhook format across multiple services
- Reducing custom webhook integration code
- New webhook integrations where you control both sides

## When NOT To Use
- Existing webhook integrations with established formats
- Integrating with providers using proprietary webhook specs

## Prerequisites
- Standard Webhooks spec familiarity (`standardwebhooks.com`)
- HTTP endpoints for sending/receiving

## Workflow
1. Follow Standard Webhooks spec for payload format
2. Implement signature generation: HMAC-SHA256 with `X-Webhook-Signature`
3. Include `X-Webhook-Id` for idempotency and deduplication
4. Include `X-Webhook-Timestamp` for replay protection
5. Implement spec-compliant verification on receiver
6. Generate and verify `v1` scheme signatures
7. Handle webhook lifecycle: retry, idempotency, expiration
8. Use existing SDKs or libraries for spec compliance

## Validation Checklist
- [ ] Payload format follows Standard Webhooks spec
- [ ] Signature generated with `v1,base64=...` format
- [ ] `X-Webhook-Id` included for idempotency
- [ ] `X-Webhook-Timestamp` included for replay protection
- [ ] Verification implements spec-compliant signature matching
- [ ] Libraries/SDKs used for spec compliance where available
