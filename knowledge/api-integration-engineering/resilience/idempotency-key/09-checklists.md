# Idempotency Keys for API Write Operations — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Idempotency
- **Knowledge Unit:** Idempotency Keys for API Write Operations
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand HTTP methods idempotency (PUT vs POST)
- [ ] Familiarity with UUID generation
- [ ] Knowledge of database transactions

## Implementation Checklist
- [ ] Unique constraint on idempotency key column
- [ ] Key generated once per operation (outside retry loop)
- [ ] TTL aligned with maximum retry window (24h+)
- [ ] First response returned on duplicate key
- [ ] Different body with same key returns error (422 or 409)
- [ ] Key cleanup strategy implemented (scheduled job)
- [ ] Indexed database column for fast duplicate lookup

## Verification Checklist
- [ ] Concurrent requests with same key serialized via distributed lock
- [ ] Failure responses cached to prevent re-execution
- [ ] Key namespace scoped per user/tenant

## Security Checklist
- [ ] Key format validated (UUID pattern, length limits)
- [ ] Internal key storage structure not exposed in error messages
- [ ] Separate key namespace per tenant in multi-tenant systems
- [ ] Key collision/conflict rates monitored as attack indicator

## Performance Checklist
- [ ] Database lookup per request (indexed, ~1ms)
- [ ] Storage proportional to number of unique operations
- [ ] TTL cleanup via cron or scheduled job

## Production Readiness Checklist
- [ ] Middleware-based idempotency check for consistent enforcement
- [ ] Key generation in service class or client SDK
- [ ] Response cache from first request returned on duplicate key
- [ ] Idempotency key storage separate from business data

## Common Mistakes to Avoid
- [ ] Avoid client generating keys inside retry loop (same key per attempt)
- [ ] Avoid no unique constraint on key column (race condition)
- [ ] Avoid too-short TTL (keys expire before retry window ends)
- [ ] Avoid different request body with same key (key collision indicator)
- [ ] Avoid not returning cached first response on duplicate
