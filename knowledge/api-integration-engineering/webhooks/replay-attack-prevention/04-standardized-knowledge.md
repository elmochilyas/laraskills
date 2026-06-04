# ECC Standardized Knowledge — Replay Attack Prevention for Webhooks

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | incoming-webhooks |
| Knowledge Unit ID | ku-11 |
| Knowledge Unit | Replay Attack Prevention for Webhooks |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K004, K009, K015 |

## Overview (Engineering Value)
Replay attacks occur when an attacker intercepts a valid webhook payload and re-sends it. The receiver processes the same event multiple times, potentially causing duplicate charges, account changes, or data corruption. Prevention combines several techniques: idempotency keys, timestamp tolerance windows, nonce tracking, and signature inclusion of timestamps.

## Core Concepts
- **Replay Attack**: Intercepted and re-sent valid webhook payload
- **Idempotency Key**: Unique event ID stored to prevent duplicate processing
- **Timestamp Tolerance**: Reject webhooks with timestamp outside a window (e.g., ±5 minutes)
- **Nonce Tracking**: One-time-use token preventing replay within tolerance window
- **Signature Inclusion**: Timestamp and nonce included in HMAC payload

## When To Use
- Any webhook processing payment events
- Account/state change webhooks (SSO, user updates)
- Compliance-required exactly-once processing
- Financial or regulated integrations

## When NOT To Use
- Read-only event notifications
- Internal webhooks over trusted network
- At-least-once semantics accepted

## Best Practices
- Combine timestamp tolerance (+5 min) with idempotency keys
- Use event-level idempotency key from sender
- Reject expired timestamps before signature verification
- Track nonces in cache with same TTL as timestamp window
- Log all replay detection events for security auditing

## Architecture Guidelines
- Middleware stack: reject expired → verify signature → check nonce → process
- Idempotency key stored with TTL matching duplicate window
- Nonce cache with TTL matching timestamp tolerance
- Monitoring on replay attempt frequency for incident detection
- Response idempotent: 200 for first process, 200 for duplicate

## Performance Considerations
- Timestamp check is sub-millisecond
- Nonce cache lookup via Redis ~1ms
- Idempotency check via primary key or unique index
- No additional network calls beyond cache/DB

## Common Mistakes
- Relying only on idempotency keys without timestamp tolerance
- Using too large a timestamp window (>15 minutes)
- Not clearing nonces after TTL (unbounded growth)
- Case-sensitive idempotency key comparison
- Not handling idempotency key collisions from different events

## Related Topics
- **Prerequisites**: HMAC signatures, webhook verification
- **Closely Related**: Idempotency keys, signature validation
- **Advanced**: Exactly-once processing, distributed locking
- **Cross-Domain**: Security engineering, data integrity

## Verification
- [ ] Timestamp tolerance window configured (±5 min or less)
- [ ] Idempotency key checked before processing
- [ ] Nonce tracking for replay within tolerance window
- [ ] Replay attempts logged for monitoring
- [ ] Duplicate processing prevented (200 response both times)
- [ ] Timestamp included in HMAC signature payload
