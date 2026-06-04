# Receiving Endpoints — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Incoming Webhooks
- **Knowledge Unit:** Receiving Endpoints
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Laravel routing, CSRF protection, and HTTP methods
- [ ] Familiarity with Spatie laravel-webhook-client package
- [ ] Knowledge of webhook provider delivery behavior (POST, retry, timeout)

## Implementation Checklist
- [ ] Webhook route added to CSRF exception list
- [ ] Route uses POST method only
- [ ] Route responds 200 within 5 seconds
- [ ] Raw body accessible for signature verification
- [ ] Rate limiting configured on receiving endpoint
- [ ] Route cache cleared after adding webhook routes
- [ ] Separate routes per provider for security isolation and routing clarity

## Verification Checklist
- [ ] 419 error rate monitored to detect misconfigured webhooks
- [ ] Webhook endpoint responds quickly under load
- [ ] Signature verification working before any business logic

## Security Checklist
- [ ] CSRF never disabled globally; targeted exceptions per webhook URL
- [ ] Additional throttling on webhook endpoints for abuse prevention
- [ ] IP whitelisting considered for providers with published source IP ranges
- [ ] 419 (CSRF mismatch) rates monitored

## Performance Checklist
- [ ] HTTP response time dominated by signature verification + DB write (10-50ms)
- [ ] Queue dispatch adds ~1-5ms to response time
- [ ] Body size limits set in web server config

## Production Readiness Checklist
- [ ] Spatie laravel-webhook-client for production webhook receiving
- [ ] Dedicated route file `routes/webhooks.php` for organization
- [ ] Provider-specific webhook configs in `config/webhook-client.php`
- [ ] Rate limiting on receiving endpoints (100-1000 req/min per source)

## Common Mistakes to Avoid
- [ ] Avoid forgetting CSRF exception (webhook provider receives 419 errors)
- [ ] Avoid processing webhooks synchronously (slow responses cause provider timeouts)
- [ ] Avoid using `Route::any()` instead of `Route::post()`
- [ ] Avoid not clearing route cache after adding webhook routes
