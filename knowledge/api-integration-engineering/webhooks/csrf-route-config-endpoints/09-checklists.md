# CSRF Bypass and Route Configuration for Webhook Endpoints — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Incoming Webhooks
- **Knowledge Unit:** CSRF Bypass and Route Configuration for Webhook Endpoints
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Laravel middleware fundamentals and route configuration
- [ ] Familiarity with CSRF protection mechanism in Laravel
- [ ] Knowledge of webhook provider requirements (POST-only, signature verification)

## Implementation Checklist
- [ ] Webhook URLs added to `VerifyCsrfToken::$except` array
- [ ] Routes defined as `Route::post()` only (no `Route::any()`)
- [ ] Rate limiting middleware applied to webhook endpoints
- [ ] Signature verification implemented as compensating control
- [ ] Route cache cleared after adding new webhook routes
- [ ] Webhook routes placed in separate file (`routes/webhooks.php`) for organization
- [ ] Provider-specific paths used (`/webhook/stripe`, `/webhook/github`)

## Verification Checklist
- [ ] 419 response rate monitored for misconfigured endpoints
- [ ] Webhook endpoint responds 200 within 5 seconds
- [ ] Raw body accessible for signature verification (`$request->getContent()`)

## Security Checklist
- [ ] CSRF bypass removes one security layer — signature verification must replace it
- [ ] Wildcard exceptions avoided; exact paths preferred (`/webhook/stripe` not `/webhook/*`)
- [ ] CSRF never disabled globally; targeted `$except` array entries only
- [ ] IP whitelisting considered where providers publish source IP ranges
- [ ] All webhook requests logged for audit trail

## Performance Checklist
- [ ] Route matching is O(n); webhook route count kept manageable
- [ ] Request body reading cached to avoid re-reading PHP input stream
- [ ] Rate limiting middleware uses Redis-backed stores for distributed throttling

## Production Readiness Checklist
- [ ] API routes used (`routes/api.php`) to avoid CSRF and session overhead entirely
- [ ] Throttling middleware configured on all webhook endpoints
- [ ] Compensating security (signature verification) at a different layer from CSRF
- [ ] Provider-specific signing handled correctly

## Common Mistakes to Avoid
- [ ] Avoid adding route to CSRF except without defining it first (produces 404)
- [ ] Avoid using `Route::any()` instead of `Route::post()` (allows non-POST hits)
- [ ] Avoid wildcards too broad (`/webhook*` matching unintended routes)
- [ ] Avoid disabling CSRF globally instead of using targeted exceptions
- [ ] Avoid forgetting to clear route cache after adding webhook routes
