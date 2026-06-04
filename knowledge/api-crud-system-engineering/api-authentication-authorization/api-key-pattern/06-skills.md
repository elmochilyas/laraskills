# Skill: Implement API Key Pattern

## Purpose
Implement API key authentication with fixed, long-lived keys for machine-to-machine communication, key generation, storage, hashing, rotation, and revocation.

## When To Use
- Machine-to-machine API access (services, cron jobs, integrations)
- Third-party API access without user context
- Long-lived service credentials

## When NOT To Use
- User-specific authentication (use Sanctum tokens)
- Short-lived access (use JWT or session tokens)
- SPA/browser-based access (use Sanctum cookie auth)

## Prerequisites
- API authentication strategy
- Key storage system

## Inputs
- API key generation specification
- Consumer list

## Workflow
1. Generate API keys using cryptographically secure random: `Str::random(32)` or `random_bytes(32)` encoded as hex/base64
2. Store hashed key in database — never store plaintext key
3. Return plaintext key only at creation — display once, never again
4. Use key prefix for identification: `sk_live_abc123` — prefix identifies environment and type
5. Implement key lookup middleware: hash incoming key, lookup hash in DB
6. Assign metadata to keys: name, environment, permissions, expiration
7. Implement key rotation endpoint: generate new key, return plaintext, hash stored, old key revoked after grace period
8. Implement key revocation: mark key as revoked, middleware checks `revoked_at` before allowing
9. Implement key expiration: `expires_at` field, middleware checks expiry
10. Log all key usage events: creation, authentication, rotation, revocation

## Validation Checklist
- [ ] Keys generated with cryptographically secure random
- [ ] Keys hashed in database (bcrypt or SHA-256)
- [ ] Plaintext key returned only at creation
- [ ] Key prefix for identification
- [ ] Middleware hashes incoming key, looks up hash
- [ ] Key metadata (name, permissions, expiration) stored
- [ ] Key rotation with grace period before revocation
- [ ] Key revocation sets `revoked_at`
- [ ] Key expiration checked per request
- [ ] Key usage events logged

## Common Failures
- Storing keys in plaintext — DB compromise leaks all keys
- Returning plaintext key in every response — key can be intercepted
- Weak key generation — `uniqid()` or `rand()` predictable
- No key metadata — can't identify which consumer is using which key
- Key revocation without grace period — consumer can't rotate without downtime
- No key expiration — keys valid forever, forgotten keys become liability
- Middleware not hashing before lookup — plaintext key sent in query
- Key visible in URLs — logged, cached, leaked via referrer headers

## Decision Points
- Hash algorithm — bcrypt for slow (harder to crack), SHA-256 for fast (more common in API key systems)
- Key prefix — `sk_live_`, `sk_test_`, `sk_dev_` for environment identification
- Rotation grace period — 24-48 hours to allow consumers to update without downtime

## Performance Considerations
- Key hash lookup is O(1) with indexed DB
- bcrypt hashing adds 10-50ms per request — consider SHA-256 for high-throughput APIs
- Key count per consumer should be limited — 5-10 active keys max
- Cache hashed key lookups for repeated requests

## Security Considerations
- API keys must be stored hashed — DB leak doesn't expose active keys
- Keys sent in `Authorization: Bearer <key>` header — never in URL
- Key rotation with grace period ensures no downtime during rotation
- Logged key usage helps detect compromised keys (unusual usage patterns)
- Keys should be scoped to specific permissions — never grant full access
- Key prefix helps identify leaked keys from logs (which environment, which type)

## Related Rules
- Generate Keys With Cryptographically Secure Random
- Hash Keys Before Database Storage
- Return Plaintext Key Only At Creation
- Use Key Prefixes For Identification
- Implement Key Rotation With Grace Period
- Implement Key Revocation And Expiration
- Log Key Usage Events

## Related Skills
- Sanctum Token Auth — for user-scoped tokens
- Rate Limiting by Auth Tier — for key-based rate limits
- API Authentication Strategy — for auth approach selection

## Success Criteria
- API keys authenticate machine-to-machine requests
- Keys stored hashed — plaintext never persisted
- Key rotation works with consumer grace period
- Key revocation immediately blocks access
- Key expiration removes stale keys automatically
- Key metadata identifies consumer and permissions
- Key usage logged for security monitoring
