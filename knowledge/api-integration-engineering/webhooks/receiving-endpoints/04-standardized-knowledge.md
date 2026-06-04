# ECC Standardized Knowledge — Receiving Endpoints

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit ID | ku-01 |
| Knowledge Unit | Receiving Endpoints |
| Difficulty | Foundation |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K011, K020 |

## Overview (Engineering Value)
Webhook receiving endpoints are HTTP routes that accept incoming webhook requests from external providers. They must handle CSRF bypass, raw body access for signature verification, provider-specific routing, and response formatting — all within the constraints of responding quickly (under 5 seconds) to prevent upstream timeouts. Spatie's laravel-webhook-client provides a complete pipeline for receiving webhooks with configurable providers, signature validators, and queued processing. Proper endpoint setup is foundational for all incoming webhook functionality.

## Core Concepts
- **CSRF Exemption**: Webhook routes must bypass CSRF middleware via `$except` array
- **Route Registration**: Typically `Route::post()` in `routes/api.php`
- **POST-Only**: Webhooks use POST; ignore or reject other methods
- **Raw Body Access**: `$request->getContent()` for signature verification before any parsing
- **Quick Response**: Respond 200 quickly (< 5s); actual processing queued
- **Provider-Specific Routes**: Separate paths per provider (`/webhook/stripe`, `/webhook/github`)

## When To Use
- Receiving webhooks from external services (Stripe, GitHub, Slack, etc.)
- B2B integrations where partners send events to your application
- Custom event pipelines from other systems

## When NOT To Use
- Internal event processing within the same application (use Laravel events)
- Pull-based data synchronization (use scheduled tasks or queues)

## Best Practices
- Always add webhook routes to CSRF exception list (providers can't send CSRF tokens)
- Use `routes/api.php` (no CSRF, no sessions) for webhook endpoints
- Respond 200 immediately after validation; queue all processing
- Create separate routes per provider for security isolation and routing clarity
- Use wildcard CSRF exceptions `/webhook/*` for multiple endpoints

## Architecture Guidelines
- Spatie laravel-webhook-client for production webhook receiving
- Dedicated route file `routes/webhooks.php` for organization
- CSRF exception in `VerifyCsrfToken::except` array
- Provider-specific webhook configs in `config/webhook-client.php`
- Rate limiting on receiving endpoints (100-1000 req/min per source)

## Performance Considerations
- HTTP response time dominated by signature verification + database write (10-50ms)
- Queue dispatch adds ~1-5ms to response time
- Raw body reading is fast (<1ms) but must be done before any parsing
- Body size impacts memory; set payload size limits in web server config

## Security Considerations
- Never disable CSRF globally; use targeted exceptions per webhook URL
- Implement additional throttling on webhook endpoints for abuse prevention
- Consider IP whitelisting for providers that publish source IP ranges
- Monitor 419 (CSRF mismatch) rates to detect misconfigured webhooks

## Common Mistakes
- Forgetting CSRF exception: webhook provider receives 419 errors, retries indefinitely
- Processing webhooks synchronously: slow responses cause provider timeouts and retries
- Using Route::any() instead of Route::post(): allowing non-POST requests
- Not clearing route cache after adding webhook routes

## Related Topics
- **Prerequisites**: Laravel routing, CSRF protection, HTTP methods
- **Closely Related**: Signature verification (ku-02), queued processing (ku-03)
- **Advanced**: Multi-tenant webhook endpoints, custom provider routing
- **Cross-Domain**: Security (CSRF bypass compensating controls)

## Verification
- [ ] Webhook route added to CSRF exception list
- [ ] Route uses POST method only
- [ ] Route responds 200 within 5 seconds
- [ ] Raw body accessible for signature verification
- [ ] Rate limiting configured on receiving endpoint
- [ ] Route cache cleared after adding webhook routes
